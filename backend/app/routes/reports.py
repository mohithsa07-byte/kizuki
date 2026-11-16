import io
import os
from datetime import datetime, timezone

import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response
from pydantic import BaseModel, Field
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.utils import ImageReader
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table,
    TableStyle, Image, KeepTogether
)
from reportlab.graphics.shapes import Drawing, Line, Circle, String

from app.routes.analyst import nasa_history, nvidia_chat

router = APIRouter(prefix="/api/reports", tags=["reports"])

INK = colors.HexColor("#142630")
SAGE = colors.HexColor("#348875")
MUTED = colors.HexColor("#536675")


class ReportRequest(BaseModel):
    location_name: str = Field(min_length=1, max_length=120)
    lat: float = Field(ge=-90, le=90)
    lng: float = Field(ge=-180, le=180)
    start_year: int = Field(ge=1995, le=2025)
    end_year: int = Field(ge=1995, le=2025)


def chart(records, field, title, unit):
    width, height = 490, 170
    drawing = Drawing(width, height)

    left, right = 55, 470
    bottom, top = 35, 135

    drawing.add(String(
        12, 151, title,
        fontName="Helvetica-Bold",
        fontSize=11,
        fillColor=INK,
    ))

    drawing.add(Line(left, bottom, left, top, strokeColor=MUTED))
    drawing.add(Line(left, bottom, right, bottom, strokeColor=MUTED))

    valid = [
        (row["year"], row[field])
        for row in records
        if isinstance(row.get(field), (float, int))
    ]

    if not valid:
        drawing.add(String(
            80, 85, "No complete annual measurements available",
            fontSize=10,
        ))
        return drawing

    values = [v for _, v in valid]
    low, high = min(values), max(values)
    spread = max(high - low, 0.1)
    low -= spread * 0.15
    high += spread * 0.15

    for i in range(5):
        y = bottom + i * (top - bottom) / 4
        value = low + i * (high - low) / 4
        drawing.add(Line(
            left, y, right, y,
            strokeColor=colors.HexColor("#e2e8e8"),
        ))
        drawing.add(String(
            3, y - 3, f"{value:.1f} {unit}",
            fontSize=7,
            fillColor=MUTED,
        ))

    def position(index, value):
        x = (
            (left + right) / 2
            if len(valid) == 1
            else left + index * (right - left) / (len(valid) - 1)
        )
        y = bottom + (value - low) / (high - low) * (top - bottom)
        return x, y

    for index in range(1, len(valid)):
        x1, y1 = position(index - 1, valid[index - 1][1])
        x2, y2 = position(index, valid[index][1])
        drawing.add(Line(
            x1, y1, x2, y2,
            strokeColor=SAGE,
            strokeWidth=2,
        ))

    for index, (year, value) in enumerate(valid):
        x, y = position(index, value)
        drawing.add(Circle(x, y, 2.4, fillColor=SAGE, strokeColor=SAGE))
        if (
            len(valid) <= 9
            or index in (0, len(valid) - 1)
            or index % max(1, len(valid) // 6) == 0
        ):
            drawing.add(String(
                x - 12, 18, str(year),
                fontSize=7,
                fillColor=MUTED,
            ))

    return drawing


def get_location_map(client, lat, lng):
    # Esri map export: geographic context, NOT historical imagery.
    delta = 1.0
    response = client.get(
        "https://server.arcgisonline.com/ArcGIS/rest/services/"
        "World_Street_Map/MapServer/export",
        params={
            "bbox": f"{lng-delta},{lat-delta},{lng+delta},{lat+delta}",
            "bboxSR": 4326,
            "imageSR": 4326,
            "size": "900,430",
            "format": "png",
            "f": "image",
        },
        timeout=12,
    )
    response.raise_for_status()
    if not response.headers.get("content-type", "").startswith("image/"):
        raise ValueError("Map provider did not return an image")
    if len(response.content) > 4_000_000:
        raise ValueError("Map image too large")
    return response.content


@router.post("/environmental")
async def environmental_report(request: ReportRequest):
    if request.start_year > request.end_year:
        raise HTTPException(422, "Start year must precede end year.")

    if not os.getenv("NVIDIA_API_KEY"):
        raise HTTPException(
            503, "NVIDIA_API_KEY is not configured on the backend."
        )

    location = {
        "name": request.location_name,
        "lat": request.lat,
        "lng": request.lng,
    }

    try:
        async with httpx.AsyncClient() as client:
            records = await nasa_history(
                client,
                location,
                request.start_year,
                request.end_year,
            )

            if len(records) != (
                request.end_year - request.start_year + 1
            ):
                raise HTTPException(
                    422,
                    "NASA POWER did not return every complete year "
                    "requested. Try another period.",
                )

            first, last = records[0], records[-1]
            temp_delta = (
                last["temperature_c"] - first["temperature_c"]
            )
            rain_delta = last["rainfall_mm"] - first["rainfall_mm"]

            evidence = "\n".join(
                f'{r["year"]}: mean air temperature '
                f'{r["temperature_c"]} C; annual precipitation '
                f'{r["rainfall_mm"]} mm'
                for r in records
            )

            prompt = (
                "You are the KIZUKI scientific report analyst. "
                "Write 3 to 5 concise paragraphs of environmental "
                "observations suitable for a PDF report. "
                "Use only the supplied NASA POWER point-based "
                "gridded annual measurements. Clearly distinguish "
                "the endpoint difference from a long-term trend. "
                "Do not infer causation, vegetation loss, urban growth, "
                "satellite image findings, or regional averages. "
                "Mention uncertainty and that AI interpretations "
                "require independent verification. No Markdown tables."
            )

            observations = await nvidia_chat(
                client,
                [
                    {"role": "system", "content": prompt},
                    {
                        "role": "user",
                        "content": (
                            f"Location: {request.location_name}, "
                            f"{request.lat}, {request.lng}\n"
                            f"Years: {request.start_year}–"
                            f"{request.end_year}\n"
                            f"Annual NASA POWER evidence:\n{evidence}"
                        ),
                    },
                ],
                max_tokens=850,
                temperature=0.2,
            )

            map_bytes = None
            try:
                map_bytes = get_location_map(
                    client, request.lat, request.lng
                )
            except (httpx.HTTPError, ValueError):
                pass

        output = io.BytesIO()
        doc = SimpleDocTemplate(
            output,
            pagesize=(595, 842),
            leftMargin=48,
            rightMargin=48,
            topMargin=48,
            bottomMargin=48,
        )

        styles = getSampleStyleSheet()
        styles.add(ParagraphStyle(
            name="KTitle",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=22,
            leading=28,
            textColor=INK,
            spaceAfter=12,
        ))
        styles.add(ParagraphStyle(
            name="KBody",
            parent=styles["BodyText"],
            fontSize=9,
            leading=14,
            spaceAfter=10,
        ))
        styles.add(ParagraphStyle(
            name="KSection",
            parent=styles["Heading2"],
            fontSize=13,
            textColor=SAGE,
            spaceBefore=18,
            spaceAfter=9,
        ))

        from xml.sax.saxutils import escape

        story = [
            Paragraph("KIZUKI / ENVIRONMENTAL INTELLIGENCE",
                      styles["KSection"]),
            Paragraph("Environmental Change Report", styles["KTitle"]),
            Paragraph(escape(request.location_name), styles["Heading2"]),
            Paragraph(
                f"Observation period: {request.start_year}–"
                f"{request.end_year}<br/>"
                f"Latitude: {request.lat:.4f} | "
                f"Longitude: {request.lng:.4f}<br/>"
                f"Generated: {datetime.now(timezone.utc):%d %B %Y} UTC",
                styles["KBody"],
            ),
            Spacer(1, 12),
            Paragraph("Measured environmental changes",
                      styles["KSection"]),
        ]

        summary = [
            ["Measurement", str(request.start_year),
             str(request.end_year), "Change"],
            ["Mean air temperature (C)",
             f'{first["temperature_c"]:.2f}',
             f'{last["temperature_c"]:.2f}',
             f"{temp_delta:+.2f}"],
            ["Annual precipitation (mm)",
             f'{first["rainfall_mm"]:.1f}',
             f'{last["rainfall_mm"]:.1f}',
             f"{rain_delta:+.1f}"],
        ]

        table = Table(summary, colWidths=[190, 90, 90, 90])
        table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), INK),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1),
             [colors.white, colors.HexColor("#eff6f3")]),
            ("GRID", (0, 0), (-1, -1), 0.3,
             colors.HexColor("#cdd9d5")),
            ("FONTSIZE", (0, 0), (-1, -1), 8),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ("TOPPADDING", (0, 0), (-1, -1), 9),
        ]))
        story.extend([
            table,
            Spacer(1, 12),
            Paragraph(
                "Changes compare the two selected calendar years. "
                "They do not by themselves establish a long-term trend.",
                styles["KBody"],
            ),
            chart(records, "temperature_c",
                  "Annual mean air temperature", "C"),
            Spacer(1, 14),
            chart(records, "rainfall_mm",
                  "Annual precipitation", "mm"),
            Paragraph("Location map", styles["KSection"]),
        ])

        if map_bytes:
            story.extend([
                Image(
                    ImageReader(io.BytesIO(map_bytes)),
                    width=490,
                    height=234,
                ),
                Paragraph(
                    "Geographic context: Esri World Street Map. "
                    "Centered on the selected coordinates. "
                    "This is not historical satellite imagery.",
                    styles["KBody"],
                ),
            ])
        else:
            story.append(Paragraph(
                "Map imagery unavailable at generation time. "
                "Location coordinates are provided above.",
                styles["KBody"],
            ))

        story.append(Paragraph(
            "NVIDIA Nemotron observations", styles["KSection"]
        ))

        for paragraph in observations.split("\n\n"):
            cleaned = paragraph.strip()
            if cleaned:
                story.append(Paragraph(
                    escape(cleaned).replace("\n", "<br/>"),
                    styles["KBody"],
                ))

        story.extend([
            Paragraph("Vegetation and satellite imagery",
                      styles["KSection"]),
            Paragraph(
                "Quantified vegetation change and verified historical "
                "satellite image pairs are not included in this "
                "report version. No vegetation conclusions are made.",
                styles["KBody"],
            ),
            Paragraph("Sources and methodology", styles["KSection"]),
            Paragraph(
                "NASA POWER monthly gridded point estimates. "
                "Annual air temperature: mean of 12 monthly T2M "
                "values. Annual precipitation: sum of monthly "
                "PRECTOTCORR daily rates multiplied by days in "
                "each month. These are modeled/gridded estimates, "
                "not station measurements or regional averages. "
                "AI-generated interpretations require verification.",
                styles["KBody"],
            ),
        ])

        doc.build(story)
        return Response(
            content=output.getvalue(),
            media_type="application/pdf",
            headers={
                "Content-Disposition":
                    'attachment; filename="kizuki-environmental-report.pdf"',
                "Cache-Control": "no-store",
            },
        )

    except HTTPException:
        raise
    except httpx.TimeoutException:
        raise HTTPException(504, "NASA or NVIDIA timed out.")
    except httpx.HTTPError:
        raise HTTPException(
            502, "An external data or AI service is unavailable."
        )
    except (ValueError, KeyError, TypeError) as exc:
        raise HTTPException(
            502, f"Report generation failed: {str(exc)[:160]}"
        )
REGIONS = [
    {
        "id": "bengaluru-urban",
        "name": "Bengaluru Urban",
        "state": "Karnataka",
        "country": "India",
        "lat": 12.9716,
        "lng": 77.5946,
    },
]


def get_region(region_id: str):
    for region in REGIONS:
        if region["id"] == region_id:
            return region
    return None

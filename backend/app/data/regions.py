REGIONS = [
    {"id": "bengaluru-urban", "name": "Bengaluru", "state": "Karnataka", "country": "India", "lat": 12.9716, "lng": 77.5946},
    {"id": "delhi", "name": "Delhi", "state": "Delhi", "country": "India", "lat": 28.6139, "lng": 77.2090},
    {"id": "mumbai", "name": "Mumbai", "state": "Maharashtra", "country": "India", "lat": 19.0760, "lng": 72.8777},
    {"id": "london", "name": "London", "state": "", "country": "United Kingdom", "lat": 51.5074, "lng": -0.1278},
    {"id": "moscow", "name": "Moscow", "state": "", "country": "Russia", "lat": 55.7558, "lng": 37.6173},
    {"id": "cairo", "name": "Cairo", "state": "", "country": "Egypt", "lat": 30.0444, "lng": 31.2357},
    {"id": "lagos", "name": "Lagos", "state": "", "country": "Nigeria", "lat": 6.5244, "lng": 3.3792},
    {"id": "nairobi", "name": "Nairobi", "state": "", "country": "Kenya", "lat": -1.2921, "lng": 36.8219},
    {"id": "johannesburg", "name": "Johannesburg", "state": "", "country": "South Africa", "lat": -26.2041, "lng": 28.0473},
    {"id": "dubai", "name": "Dubai", "state": "", "country": "United Arab Emirates", "lat": 25.2048, "lng": 55.2708},
    {"id": "beijing", "name": "Beijing", "state": "", "country": "China", "lat": 39.9042, "lng": 116.4074},
    {"id": "tokyo", "name": "Tokyo", "state": "", "country": "Japan", "lat": 35.6762, "lng": 139.6503},
    {"id": "singapore", "name": "Singapore", "state": "", "country": "Singapore", "lat": 1.3521, "lng": 103.8198},
    {"id": "sydney", "name": "Sydney", "state": "", "country": "Australia", "lat": -33.8688, "lng": 151.2093},
    {"id": "new-york", "name": "New York", "state": "", "country": "United States", "lat": 40.7128, "lng": -74.0060},
    {"id": "los-angeles", "name": "Los Angeles", "state": "", "country": "United States", "lat": 34.0522, "lng": -118.2437},
    {"id": "mexico-city", "name": "Mexico City", "state": "", "country": "Mexico", "lat": 19.4326, "lng": -99.1332},
    {"id": "sao-paulo", "name": "Sao Paulo", "state": "", "country": "Brazil", "lat": -23.5505, "lng": -46.6333},
]


def get_region(region_id: str):
    for region in REGIONS:
        if region["id"] == region_id:
            return region
    return None

def geocode_transaction_location(location_string):
    """Mock geocoding service"""
    return {
        "lat": 0.0,
        "lng": 0.0,
        "formatted_address": "Mock Address, City, Country",
        "city": "Mock City",
        "country": "Mockland",
        "confidence": 0.9
    }

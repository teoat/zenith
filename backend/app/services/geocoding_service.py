"""
Geocoding service for converting location names to coordinates.
Provides both online API and offline fallback geocoding capabilities.
"""

import asyncio

try:
    import aiohttp
except Exception:
    aiohttp = None
import json
import logging
import sqlite3
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)


@dataclass
class Location:
    """Represents a geographic location with coordinates."""

    latitude: float
    longitude: float
    city: str
    country: str
    confidence: float = 1.0


class GeocodingService:
    """Service for geocoding location names to coordinates."""

    def __init__(self, db_path: str = "./data/geocoding_cache.db"):
        self.db_path = db_path
        self.cache_db_path = Path(db_path)
        self.cache_db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_cache_db()

        # Free geocoding API endpoints (no API key required)
        self.geocoding_apis = [
            "https://nominatim.openstreetmap.org/search",
            "https://api.opencagedata.com/geocode/v1/json",  # Limited free tier
        ]

        # Fallback coordinates for major cities/countries
        self.fallback_locations = self._load_fallback_locations()

    def _init_cache_db(self):
        """Initialize the geocoding cache database."""
        with sqlite3.connect(self.cache_db_path) as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS geocoding_cache (
                    location_key TEXT PRIMARY KEY,
                    latitude REAL,
                    longitude REAL,
                    city TEXT,
                    country TEXT,
                    confidence REAL,
                    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """
            )
            conn.execute(
                """
                CREATE INDEX IF NOT EXISTS idx_location_key
                ON geocoding_cache(location_key)
            """
            )

    def _load_fallback_locations(self) -> Dict[str, Location]:
        """Load fallback location data for common cities/countries."""
        return {
            # Major cities
            "new york, united states": Location(
                40.7128, -74.0060, "New York", "United States"
            ),
            "london, united kingdom": Location(
                51.5074, -0.1278, "London", "United Kingdom"
            ),
            "tokyo, japan": Location(35.6762, 139.6503, "Tokyo", "Japan"),
            "paris, france": Location(48.8566, 2.3522, "Paris", "France"),
            "sydney, australia": Location(-33.8688, 151.2093, "Sydney", "Australia"),
            "singapore, singapore": Location(
                1.3521, 103.8198, "Singapore", "Singapore"
            ),
            "hong kong, china": Location(22.3193, 114.1694, "Hong Kong", "China"),
            "shanghai, china": Location(31.2304, 121.4737, "Shanghai", "China"),
            "beijing, china": Location(39.9042, 116.4074, "Beijing", "China"),
            "mumbai, india": Location(19.0760, 72.8777, "Mumbai", "India"),
            "delhi, india": Location(28.7041, 77.1025, "Delhi", "India"),
            "bangalore, india": Location(12.9716, 77.5946, "Bangalore", "India"),
            # Countries (capital cities as fallback)
            "united states": Location(
                39.8283, -98.5795, "Washington DC", "United States", 0.5
            ),
            "china": Location(35.8617, 104.1954, "Beijing", "China", 0.5),
            "india": Location(20.5937, 78.9629, "Delhi", "India", 0.5),
            "japan": Location(36.2048, 138.2529, "Tokyo", "Japan", 0.5),
            "united kingdom": Location(
                55.3781, -3.4360, "London", "United Kingdom", 0.5
            ),
            "france": Location(46.2276, 2.2137, "Paris", "France", 0.5),
            "germany": Location(51.1657, 10.4515, "Berlin", "Germany", 0.5),
            "australia": Location(-25.2744, 133.7751, "Canberra", "Australia", 0.5),
            "singapore": Location(1.3521, 103.8198, "Singapore", "Singapore", 0.5),
        }

    def _normalize_location_key(self, city: str, country: str) -> str:
        """Create a normalized key for location caching."""
        return f"{city.lower().strip()}, {country.lower().strip()}"

    async def geocode_location(self, city: str, country: str) -> Optional[Location]:
        """
        Geocode a city/country combination to coordinates.

        Args:
            city: City name
            country: Country name

        Returns:
            Location object with coordinates, or None if geocoding fails
        """
        if not city or not country:
            return None

        location_key = self._normalize_location_key(city, country)

        # Check cache first
        cached_location = self._get_cached_location(location_key)
        if cached_location:
            return cached_location

        # Try online geocoding
        location = await self._geocode_online(city, country)
        if location:
            self._cache_location(location_key, location)
            return location

        # Fall back to static data
        fallback_key = location_key
        if fallback_key in self.fallback_locations:
            location = self.fallback_locations[fallback_key]
            self._cache_location(location_key, location)
            return location

        # Try country-only fallback
        country_key = country.lower().strip()
        if country_key in self.fallback_locations:
            location = self.fallback_locations[country_key]
            # Reduce confidence for country-only matches
            location.confidence = 0.3
            self._cache_location(location_key, location)
            return location

        logger.warning(f"Could not geocode location: {city}, {country}")
        return None

    def _get_cached_location(self, location_key: str) -> Optional[Location]:
        """Retrieve location from cache."""
        try:
            with sqlite3.connect(self.cache_db_path) as conn:
                cursor = conn.execute(
                    """
                    SELECT latitude, longitude, city, country, confidence
                    FROM geocoding_cache
                    WHERE location_key = ?
                """,
                    (location_key,),
                )

                row = cursor.fetchone()
                if row:
                    return Location(
                        latitude=row[0],
                        longitude=row[1],
                        city=row[2],
                        country=row[3],
                        confidence=row[4],
                    )
        except Exception as e:
            logger.error(f"Error reading from geocoding cache: {e}")

        return None

    def _cache_location(self, location_key: str, location: Location):
        """Cache location in database."""
        try:
            with sqlite3.connect(self.cache_db_path) as conn:
                conn.execute(
                    """
                    INSERT OR REPLACE INTO geocoding_cache
                    (location_key, latitude, longitude, city, country, confidence)
                    VALUES (?, ?, ?, ?, ?, ?)
                """,
                    (
                        location_key,
                        location.latitude,
                        location.longitude,
                        location.city,
                        location.country,
                        location.confidence,
                    ),
                )
                conn.commit()
        except Exception as e:
            logger.error(f"Error caching location: {e}")

    async def _geocode_online(self, city: str, country: str) -> Optional[Location]:
        """Attempt online geocoding using free APIs."""
        query = f"{city}, {country}"

        # Try OpenStreetMap Nominatim (no API key required)
        try:
            async with aiohttp.ClientSession() as session:
                params = {"q": query, "format": "json", "limit": 1, "addressdetails": 1}

                async with session.get(
                    "https://nominatim.openstreetmap.org/search",
                    params=params,
                    headers={"User-Agent": "FraudDetectionApp/1.0"},
                ) as response:

                    if response.status == 200:
                        data = await response.json()
                        if data:
                            result = data[0]
                            return Location(
                                latitude=float(result["lat"]),
                                longitude=float(result["lon"]),
                                city=city,
                                country=country,
                                confidence=0.9,  # High confidence for OSM
                            )
        except Exception as e:
            logger.warning(f"OpenStreetMap geocoding failed: {e}")

        return None

    async def batch_geocode(
        self, locations: List[Tuple[str, str]]
    ) -> Dict[Tuple[str, str], Optional[Location]]:
        """
        Geocode multiple locations in batch.

        Args:
            locations: List of (city, country) tuples

        Returns:
            Dictionary mapping (city, country) to Location objects
        """
        results = {}

        # Process in batches to avoid overwhelming APIs
        batch_size = 10
        for i in range(0, len(locations), batch_size):
            batch = locations[i : i + batch_size]

            # Create tasks for concurrent processing
            tasks = [self.geocode_location(city, country) for city, country in batch]

            batch_results = await asyncio.gather(*tasks, return_exceptions=True)

            # Process results
            for (city, country), result in zip(batch, batch_results):
                if isinstance(result, Exception):
                    logger.error(f"Error geocoding {city}, {country}: {result}")
                    results[(city, country)] = None
                else:
                    results[(city, country)] = result

            # Small delay between batches to be respectful to APIs
            if i + batch_size < len(locations):
                await asyncio.sleep(0.1)

        return results

    def clear_cache(self):
        """Clear the geocoding cache."""
        try:
            with sqlite3.connect(self.cache_db_path) as conn:
                conn.execute("DELETE FROM geocoding_cache")
                conn.commit()
            logger.info("Geocoding cache cleared")
        except Exception as e:
            logger.error(f"Error clearing geocoding cache: {e}")

    def get_cache_stats(self) -> Dict[str, int]:
        """Get cache statistics."""
        try:
            with sqlite3.connect(self.cache_db_path) as conn:
                cursor = conn.execute("SELECT COUNT(*) FROM geocoding_cache")
                count = cursor.fetchone()[0]
                return {"cached_locations": count}
        except Exception as e:
            logger.error(f"Error getting cache stats: {e}")
            return {"cached_locations": 0}


# Global geocoding service instance
geocoding_service = GeocodingService()


async def geocode_transaction_location(
    city: str, country: str
) -> Optional[Dict[str, float]]:
    """
    Convenience function to geocode a transaction location.

    Returns:
        Dict with 'lat' and 'lng' keys, or None if geocoding fails
    """
    location = await geocoding_service.geocode_location(city, country)
    if location:
        return {"lat": location.latitude, "lng": location.longitude}
    return None

"""
Locale detection utilities for FastAPI.
"""
from typing import Optional
from fastapi import Request

# Available locales (should match frontend locales)
AVAILABLE_LOCALES = ['en', 'id']
DEFAULT_LOCALE = 'en'

def get_locale_from_request(request: Request) -> str:
    """
    Extract locale from request headers.

    Priority order:
    1. Accept-Language header
    2. X-Locale header (custom header)
    3. Default locale

    Args:
        request: FastAPI request object

    Returns:
        Locale code (e.g., 'en', 'es')
    """
    # Check custom X-Locale header first
    x_locale = request.headers.get('X-Locale')
    if x_locale and x_locale in AVAILABLE_LOCALES:
        return x_locale

    # Check Accept-Language header
    accept_language = request.headers.get('Accept-Language')
    if accept_language:
        # Parse Accept-Language header (e.g., "es-ES,es;q=0.9,en;q=0.8")
        languages = []
        for lang in accept_language.split(','):
            lang = lang.strip().split(';')[0]  # Remove quality value
            # Extract base language (e.g., 'es' from 'es-ES')
            base_lang = lang.split('-')[0]
            languages.append(base_lang)

        # Return first available language
        for lang in languages:
            if lang in AVAILABLE_LOCALES:
                return lang

    return DEFAULT_LOCALE

def get_supported_locales() -> list:
    """Get list of supported locales."""
    return AVAILABLE_LOCALES.copy()

def is_locale_supported(locale: str) -> bool:
    """Check if a locale is supported."""
    return locale in AVAILABLE_LOCALES
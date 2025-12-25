"""
Internationalization utilities for the backend API.
Provides translation support using Babel.
"""
import os
import gettext
from typing import Optional

# Default locale
DEFAULT_LOCALE = 'en'

# Available locales
AVAILABLE_LOCALES = ['en', 'id']

# Translation domain
DOMAIN = 'messages'

# Path to locale files
LOCALES_DIR = os.path.join(os.path.dirname(__file__), 'locales')

# Cache for translation objects
_translations = {}

def get_translator(locale: str = DEFAULT_LOCALE) -> gettext.GNUTranslations:
    """
    Get a translator object for the specified locale.

    Args:
        locale: The locale code (e.g., 'en', 'es')

    Returns:
        A GNUTranslations object for the locale
    """
    if locale not in AVAILABLE_LOCALES:
        locale = DEFAULT_LOCALE

    if locale not in _translations:
        try:
            trans = gettext.translation(
                DOMAIN,
                LOCALES_DIR,
                languages=[locale],
                fallback=True
            )
            _translations[locale] = trans
        except FileNotFoundError:
            # Fallback to default if translation file not found
            if locale != DEFAULT_LOCALE:
                return get_translator(DEFAULT_LOCALE)
            else:
                # Return a null translator if even default fails
                _translations[locale] = gettext.NullTranslations()

    return _translations[locale]

def gettext_func(locale: str = DEFAULT_LOCALE):
    """
    Get a gettext function for the specified locale.

    Args:
        locale: The locale code

    Returns:
        A gettext function that translates strings
    """
    translator = get_translator(locale)
    return translator.gettext

def ngettext_func(locale: str = DEFAULT_LOCALE):
    """
    Get an ngettext function for the specified locale.

    Args:
        locale: The locale code

    Returns:
        An ngettext function for plural translations
    """
    translator = get_translator(locale)
    return translator.ngettext

def _(message: str, locale: Optional[str] = None) -> str:
    """
    Translate a message to the current locale.

    Args:
        message: The message to translate
        locale: Optional locale override

    Returns:
        The translated message
    """
    if locale is None:
        locale = DEFAULT_LOCALE  # In a real app, this would come from request context

    translator = get_translator(locale)
    return translator.gettext(message)

def lazy_gettext(message: str):
    """
    Lazy gettext for use in class attributes and module-level strings.
    Returns the original message - translation happens at runtime.
    """
    return message

# Common translations for error messages
class ErrorMessages:
    """Common error messages that can be translated"""

    @staticmethod
    def unexpected_error(locale: str = DEFAULT_LOCALE) -> str:
        return _( "An unexpected error occurred", locale)

    @staticmethod
    def network_error(locale: str = DEFAULT_LOCALE) -> str:
        return _("Network connection error", locale)

    @staticmethod
    def timeout_error(locale: str = DEFAULT_LOCALE) -> str:
        return _("Request timed out", locale)

    @staticmethod
    def unauthorized(locale: str = DEFAULT_LOCALE) -> str:
        return _("You are not authorized to perform this action", locale)

    @staticmethod
    def forbidden(locale: str = DEFAULT_LOCALE) -> str:
        return _("Access forbidden", locale)

    @staticmethod
    def not_found(locale: str = DEFAULT_LOCALE) -> str:
        return _("The requested resource was not found", locale)

    @staticmethod
    def server_error(locale: str = DEFAULT_LOCALE) -> str:
        return _("Server error occurred", locale)

    @staticmethod
    def validation_error(locale: str = DEFAULT_LOCALE) -> str:
        return _("Please check your input and try again", locale)
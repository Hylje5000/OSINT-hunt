"""
IoC (Indicators of Compromise) utilities.

This package contains modules for working with IoCs, including:
- IoC type detection
- IoC defanging and refanging
"""
from .detector import IoC_Type, detect_ioc_type, get_ioc_type_name
from .defang import defang, refang, parse_ioc_input

__all__ = [
    'IoC_Type', 'detect_ioc_type', 'get_ioc_type_name',
    'defang', 'refang', 'parse_ioc_input'
]
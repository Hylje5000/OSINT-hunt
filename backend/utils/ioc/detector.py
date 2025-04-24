"""
IoC type detection module.

This module provides functionality to detect the type of IoCs
(Indicators of Compromise) based on their format and patterns.
"""
from enum import Enum, auto
from typing import List, Dict, Union, Optional
import re


class IoC_Type(Enum):
    """Enumeration of supported IoC types."""
    HASH_MD5 = auto()
    HASH_SHA1 = auto()
    HASH_SHA256 = auto()
    IP_ADDRESS = auto()
    DOMAIN = auto()
    URL = auto()
    EMAIL = auto()
    REGISTRY_KEY = auto()
    UNKNOWN = auto()


# Regular expressions for IoC type detection
IOC_PATTERNS = {
    IoC_Type.HASH_MD5: re.compile(r'^[a-fA-F0-9]{32}$'),
    IoC_Type.HASH_SHA1: re.compile(r'^[a-fA-F0-9]{40}$'),
    IoC_Type.HASH_SHA256: re.compile(r'^[a-fA-F0-9]{64}$'),
    IoC_Type.IP_ADDRESS: re.compile(r'^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$'),
    IoC_Type.DOMAIN: re.compile(r'^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$'),
    IoC_Type.URL: re.compile(r'^https?://(?:[-\w.]|(?:%[\da-fA-F]{2}))+'),
    IoC_Type.EMAIL: re.compile(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'),
    IoC_Type.REGISTRY_KEY: re.compile(r'^(HKLM|HKCU|HKCR|HKU|HKCC)\\'),
}

# Human-readable names for IoC types
IOC_TYPE_NAMES = {
    IoC_Type.HASH_MD5: "MD5 Hash",
    IoC_Type.HASH_SHA1: "SHA1 Hash",
    IoC_Type.HASH_SHA256: "SHA256 Hash",
    IoC_Type.IP_ADDRESS: "IP Address",
    IoC_Type.DOMAIN: "Domain Name",
    IoC_Type.URL: "URL",
    IoC_Type.EMAIL: "Email Address",
    IoC_Type.REGISTRY_KEY: "Registry Key",
    IoC_Type.UNKNOWN: "Unknown"
}

# Common TLDs for domain detection
COMMON_TLDS = {
    'com', 'org', 'net', 'edu', 'gov', 'mil', 'int', 'io', 'co', 
    'info', 'biz', 'name', 'pro', 'museum', 'us', 'uk', 'ca', 'au', 
    'de', 'fr', 'jp', 'ru', 'cn', 'in', 'br', 'eu'
}


def detect_ioc_type(ioc_value: str) -> IoC_Type:
    """
    Detect the type of IoC based on its format.
    
    Args:
        ioc_value: The IoC string value to analyze
        
    Returns:
        The detected IoC_Type enum value
    """
    # First check for explicit patterns with higher priority
    # Check for URL
    if IOC_PATTERNS[IoC_Type.URL].match(ioc_value):
        return IoC_Type.URL
        
    # Check for email addresses
    if '@' in ioc_value and IOC_PATTERNS[IoC_Type.EMAIL].match(ioc_value):
        return IoC_Type.EMAIL
        
    # Check for registry keys
    if ioc_value.startswith(("HKLM\\", "HKCU\\", "HKCR\\", "HKU\\", "HKCC\\")):
        return IoC_Type.REGISTRY_KEY
    
    # Check for IP addresses
    if IOC_PATTERNS[IoC_Type.IP_ADDRESS].match(ioc_value):
        return IoC_Type.IP_ADDRESS
    
    # Check for hash values
    if IOC_PATTERNS[IoC_Type.HASH_MD5].match(ioc_value):
        return IoC_Type.HASH_MD5
        
    if IOC_PATTERNS[IoC_Type.HASH_SHA1].match(ioc_value):
        return IoC_Type.HASH_SHA1
        
    if IOC_PATTERNS[IoC_Type.HASH_SHA256].match(ioc_value):
        return IoC_Type.HASH_SHA256
    
    # Check for domains
    if IOC_PATTERNS[IoC_Type.DOMAIN].match(ioc_value):
        return IoC_Type.DOMAIN
            
    return IoC_Type.UNKNOWN


def get_ioc_type_name(ioc_type: IoC_Type) -> str:
    """
    Get the human-readable name for an IoC type.
    
    Args:
        ioc_type: The IoC_Type enum value
        
    Returns:
        A human-readable name for the IoC type
    """
    return IOC_TYPE_NAMES.get(ioc_type, "Unknown")
"""
IoC defanging and refanging utilities.

This module provides functions for defanging and refanging IoCs
to make them safe for display and sharing.
"""
import re
from typing import List, Set


def defang(ioc: str) -> str:
    """
    Defang an IoC to make it safe for display and sharing.
    
    Args:
        ioc: The IoC string to defang
        
    Returns:
        The defanged IoC string
    """
    # Replace dots with [.]
    result = re.sub(r'\.', '[.]', ioc)
    
    # Replace @ with [at]
    result = re.sub(r'@', '[at]', result)
    
    # Replace http:// with hxxp://
    result = re.sub(r'http:', 'hxxp[:]', result)
    
    # Replace https:// with hxxps://
    result = re.sub(r'https:', 'hxxps[:]', result)
    
    return result


def refang(ioc: str) -> str:
    """
    Refang a defanged IoC back to its original form.
    
    Args:
        ioc: The defanged IoC string to refang
        
    Returns:
        The refanged (original) IoC string
    """
    # Replace [.] with .
    result = re.sub(r'\[\.\]', '.', ioc)
    
    # Replace [at] with @
    result = re.sub(r'\[at\]', '@', result)
    
    # Replace hxxp[:]// with http://
    result = re.sub(r'hxxp\[\:\]//', 'http://', result)
    
    # Replace hxxps[:]// with https://
    result = re.sub(r'hxxps\[\:\]//', 'https://', result)
    
    # Common alternative defanging methods
    result = re.sub(r'hxxp://', 'http://', result)
    result = re.sub(r'hxxps://', 'https://', result)
    
    # Handle cases where 'http' might have been defanged without replacement
    result = re.sub(r'hxxp:', 'http:', result)
    result = re.sub(r'hxxps:', 'https:', result)
    
    return result


def parse_ioc_input(input_text: str) -> List[str]:
    """
    Parse a raw text input containing IoCs and return a list of refanged IoCs.
    
    This function handles various input formats, including:
    - Comma separated values
    - Line separated values
    - Mixed formats
    - Defanged IoCs
    
    Args:
        input_text: Raw text containing IoCs
        
    Returns:
        List of distinct, refanged IoCs
    """
    # Handle empty input
    if not input_text or input_text.strip() == "":
        return []
    
    # First split by line
    lines = input_text.split('\n')
    
    # Then split each line by comma
    raw_iocs: Set[str] = set()
    for line in lines:
        # Skip empty lines
        if not line.strip():
            continue
            
        # Split line by commas
        items = [item.strip() for item in line.split(',') if item.strip()]
        raw_iocs.update(items)
    
    # Refang all IoCs
    refanged_iocs = [refang(ioc) for ioc in raw_iocs]
    
    # Remove duplicates
    unique_iocs = list(set(refanged_iocs))
    
    return unique_iocs
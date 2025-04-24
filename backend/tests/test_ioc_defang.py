"""
Tests for the IoC defanging and refanging utilities.
"""
import sys
import os
from pathlib import Path
import pytest

# Add the parent directory to the path to import the module
sys.path.append(str(Path(__file__).parent.parent))

from utils.ioc.defang import defang, refang, parse_ioc_input


def test_defang_domain():
    """Test defanging domain names"""
    domain = "example.com"
    defanged = defang(domain)
    assert defanged == "example[.]com"

def test_defang_ip():
    """Test defanging IP addresses"""
    ip = "192.168.1.1"
    defanged = defang(ip)
    assert defanged == "192[.]168[.]1[.]1"

def test_defang_email():
    """Test defanging email addresses"""
    email = "user@example.com"
    defanged = defang(email)
    assert defanged == "user[at]example[.]com"

def test_defang_url():
    """Test defanging URLs"""
    url = "http://example.com/path"
    defanged = defang(url)
    assert defanged == "hxxp[:]//example[.]com/path"
    
    https_url = "https://example.com/path"
    https_defanged = defang(https_url)
    assert https_defanged == "hxxps[:]//example[.]com/path"


def test_refang_domain():
    """Test refanging domain names"""
    defanged = "example[.]com"
    refanged = refang(defanged)
    assert refanged == "example.com"

def test_refang_ip():
    """Test refanging IP addresses"""
    defanged = "192[.]168[.]1[.]1"
    refanged = refang(defanged)
    assert refanged == "192.168.1.1"

def test_refang_email():
    """Test refanging email addresses"""
    defanged = "user[at]example[.]com"
    refanged = refang(defanged)
    assert refanged == "user@example.com"

def test_refang_url():
    """Test refanging URLs with various defanging styles"""
    # Test our primary defanging style
    defanged1 = "hxxp[:]//example[.]com/path"
    refanged1 = refang(defanged1)
    assert refanged1 == "http://example.com/path"
    
    # Test alternative defanging styles
    defanged2 = "hxxp://example[.]com/path"
    refanged2 = refang(defanged2)
    assert refanged2 == "http://example.com/path"
    
    defanged3 = "hxxps://example[.]com/path"
    refanged3 = refang(defanged3)
    assert refanged3 == "https://example.com/path"


def test_parse_empty_input():
    """Test parsing empty input"""
    empty_input = ""
    result = parse_ioc_input(empty_input)
    assert result == []
    
    whitespace_input = "   \n  \n   "
    result = parse_ioc_input(whitespace_input)
    assert result == []

def test_parse_comma_separated():
    """Test parsing comma-separated IoCs"""
    input_text = "example.com, 192.168.1.1, user@example.com"
    result = parse_ioc_input(input_text)
    assert len(result) == 3
    assert "example.com" in result
    assert "192.168.1.1" in result
    assert "user@example.com" in result

def test_parse_line_separated():
    """Test parsing line-separated IoCs"""
    input_text = """example.com
192.168.1.1
user@example.com"""
    result = parse_ioc_input(input_text)
    assert len(result) == 3
    assert "example.com" in result
    assert "192.168.1.1" in result
    assert "user@example.com" in result

def test_parse_mixed_format():
    """Test parsing mixed format IoCs"""
    input_text = """example.com, 192.168.1.1
user@example.com, http://malicious.com
https://another-site.com"""
    result = parse_ioc_input(input_text)
    assert len(result) == 5
    assert "example.com" in result
    assert "192.168.1.1" in result
    assert "user@example.com" in result
    assert "http://malicious.com" in result
    assert "https://another-site.com" in result

def test_parse_defanged_input():
    """Test parsing defanged IoCs"""
    input_text = """example[.]com
192[.]168[.]1[.]1
user[at]example[.]com
hxxp://malicious[.]com"""
    result = parse_ioc_input(input_text)
    assert len(result) == 4
    assert "example.com" in result
    assert "192.168.1.1" in result
    assert "user@example.com" in result
    assert "http://malicious.com" in result

def test_parse_duplicate_removal():
    """Test that duplicate IoCs are removed"""
    input_text = """example.com, example.com
192.168.1.1
example[.]com
192[.]168[.]1[.]1"""
    result = parse_ioc_input(input_text)
    assert len(result) == 2
    assert "example.com" in result
    assert "192.168.1.1" in result
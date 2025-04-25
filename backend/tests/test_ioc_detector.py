"""
Tests for the IoC detector module.

This tests the functionality of the IoC type detection.
"""
import pytest
from utils.ioc.detector import detect_ioc_type, IoC_Type


class TestIoCDetector:
    """Test cases for IoC detector functionality."""

    def test_domain_detection_with_subdomains(self):
        """Test that domains with subdomains are correctly detected."""
        # Test subdomain detection
        test_domains = [
            "c2.gona.fi",
            "store.google.net",
            "sub1.sub2.example.com",
            "a.b.c.d.example.org",
            "mail-server.company.co.uk"
        ]
        
        for domain in test_domains:
            detected_type = detect_ioc_type(domain)
            assert detected_type == IoC_Type.DOMAIN, f"Failed to detect {domain} as a domain"

    def test_basic_ioc_types(self):
        """Test detection of basic IoC types."""
        # Test IP addresses
        assert detect_ioc_type("192.168.1.1") == IoC_Type.IP_ADDRESS
        assert detect_ioc_type("8.8.8.8") == IoC_Type.IP_ADDRESS
        
        # Test domain names
        assert detect_ioc_type("example.com") == IoC_Type.DOMAIN
        assert detect_ioc_type("google.com") == IoC_Type.DOMAIN
        
        # Test URLs
        assert detect_ioc_type("https://example.com/path") == IoC_Type.URL
        assert detect_ioc_type("http://example.com") == IoC_Type.URL
        assert detect_ioc_type("example.com/path") == IoC_Type.URL
        
        # Test email addresses
        assert detect_ioc_type("user@example.com") == IoC_Type.EMAIL
        
        # Test hashes
        assert detect_ioc_type("d41d8cd98f00b204e9800998ecf8427e") == IoC_Type.HASH_MD5  # MD5
        assert detect_ioc_type("da39a3ee5e6b4b0d3255bfef95601890afd80709") == IoC_Type.HASH_SHA1  # SHA1
        assert detect_ioc_type("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855") == IoC_Type.HASH_SHA256  # SHA256
        
        # Test registry keys
        assert detect_ioc_type("HKLM\\Software\\Microsoft\\Windows") == IoC_Type.REGISTRY_KEY

    def test_common_tld_detection(self):
        """Test that domains with different TLDs are correctly detected."""
        common_tlds = [
            "example.com",
            "example.org",
            "example.net",
            "example.io",
            "example.co",
            "example.fi",
            "example.uk",
            "example.edu"
        ]
        
        for domain in common_tlds:
            detected_type = detect_ioc_type(domain)
            assert detected_type == IoC_Type.DOMAIN, f"Failed to detect {domain} as a domain"

    def test_unknown_ioc_types(self):
        """Test that unknown formats are correctly classified as unknown."""
        unknown_values = [
            "not_a_domain",
            "123",
            "user@",
            "@domain.com",
            "192.168.1",
            "abcdef"  # Too short for a hash
        ]
        
        for value in unknown_values:
            detected_type = detect_ioc_type(value)
            assert detected_type == IoC_Type.UNKNOWN, f"Incorrectly detected {value} as {detected_type}"
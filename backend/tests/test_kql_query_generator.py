"""
Tests for the KQL query generator module.
"""
import sys
import os
from pathlib import Path
import pytest

# Add the parent directory to the path to import the module
sys.path.append(str(Path(__file__).parent.parent))

from utils.kql.query_generator import (
    IoC_Type, 
    KQLQueryGenerator, 
    detect_ioc_type,
    generate_query,
    generate_queries_batch,
    generate_union_query
)


def test_detect_md5_hash():
    """Test detection of MD5 hashes"""
    md5_hash = "d41d8cd98f00b204e9800998ecf8427e"
    assert detect_ioc_type(md5_hash) == IoC_Type.HASH_MD5

def test_detect_sha1_hash():
    """Test detection of SHA1 hashes"""
    sha1_hash = "da39a3ee5e6b4b0d3255bfef95601890afd80709"
    assert detect_ioc_type(sha1_hash) == IoC_Type.HASH_SHA1

def test_detect_sha256_hash():
    """Test detection of SHA256 hashes"""
    sha256_hash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    assert detect_ioc_type(sha256_hash) == IoC_Type.HASH_SHA256

def test_detect_ip_address():
    """Test detection of IP addresses"""
    ip_address = "192.168.1.1"
    assert detect_ioc_type(ip_address) == IoC_Type.IP_ADDRESS

def test_detect_domain():
    """Test detection of domain names"""
    domain = "example.com"
    assert detect_ioc_type(domain) == IoC_Type.DOMAIN

def test_detect_url():
    """Test detection of URLs"""
    url = "https://example.com/path"
    assert detect_ioc_type(url) == IoC_Type.URL

def test_detect_email():
    """Test detection of email addresses"""
    email = "user@example.com"
    assert detect_ioc_type(email) == IoC_Type.EMAIL

def test_detect_registry_key():
    """Test detection of registry keys"""
    registry_key = "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run"
    assert detect_ioc_type(registry_key) == IoC_Type.REGISTRY_KEY

def test_detect_unknown():
    """Test detection of unknown IoC types"""
    unknown = "This is not a known IoC type"
    assert detect_ioc_type(unknown) == IoC_Type.UNKNOWN


def test_generate_md5_query():
    """Test generating a query for an MD5 hash"""
    md5_hash = "d41d8cd98f00b204e9800998ecf8427e"
    queries = generate_query(md5_hash)
    
    # Check that we got queries for the expected tables
    assert "DeviceFileEvents" in queries
    assert "DeviceProcessEvents" in queries
    
    # Check that the MD5 hash is in the queries
    for table, query in queries.items():
        assert md5_hash in query
        assert "IoC Type: HASH_MD5" in query

def test_generate_ip_query():
    """Test generating a query for an IP address"""
    ip_address = "192.168.1.1"
    queries = generate_query(ip_address)
    
    # Check that we got queries for the expected tables
    assert "CommonSecurityLog" in queries
    assert "DnsEvents" in queries
    
    # Check that the IP address is in the queries
    for table, query in queries.items():
        assert ip_address in query
        assert "IoC Type: IP_ADDRESS" in query

def test_generate_domain_query():
    """Test generating a query for a domain"""
    domain = "example.com"
    queries = generate_query(domain)
    
    # Check that the domain is in the queries
    for table, query in queries.items():
        assert domain in query
        assert "IoC Type: DOMAIN" in query

def test_generate_unknown_query():
    """Test generating a query for an unknown IoC type"""
    unknown = "This is not a known IoC type"
    queries = generate_query(unknown)
    
    # Should generate a generic query
    assert "Generic" in queries
    assert unknown in queries["Generic"]
    assert "Generic search for IoC" in queries["Generic"]

def test_generate_with_custom_time_range():
    """Test generating a query with a custom time range"""
    md5_hash = "d41d8cd98f00b204e9800998ecf8427e"
    time_range = "ago(30d)"
    queries = generate_query(md5_hash, time_range=time_range)
    
    # Check that the time range is in the queries
    for table, query in queries.items():
        assert time_range in query

def test_generate_with_custom_limit():
    """Test generating a query with a custom result limit"""
    md5_hash = "d41d8cd98f00b204e9800998ecf8427e"
    limit = 50
    queries = generate_query(md5_hash, limit=limit)
    
    # Check that the limit is in the queries
    for table, query in queries.items():
        assert f"| take {limit}" in query

def test_generate_with_explicit_type():
    """Test generating a query with an explicitly provided IoC type"""
    # Use a domain value but explicitly set it as a different type
    value = "example.org"
    queries = generate_query(value, ioc_type=IoC_Type.DOMAIN)
    
    # Check that we got queries for the expected tables for domains
    assert "DnsEvents" in queries
    
    # Check that it's treated as a domain in the query
    for table, query in queries.items():
        assert "IoC Type: DOMAIN" in query


def test_generate_queries_batch():
    """Test generating queries for multiple IoCs"""
    iocs = [
        "d41d8cd98f00b204e9800998ecf8427e",  # MD5 hash
        "192.168.1.1",  # IP address
        "example.com"   # Domain
    ]
    batch_queries = generate_queries_batch(iocs)
    
    # Check that we have entries for all IoCs
    for ioc in iocs:
        assert ioc in batch_queries
        
    # Check MD5 hash queries
    md5_queries = batch_queries["d41d8cd98f00b204e9800998ecf8427e"]
    assert "DeviceFileEvents" in md5_queries
    assert "IoC Type: HASH_MD5" in md5_queries["DeviceFileEvents"]
    
    # Check IP address queries
    ip_queries = batch_queries["192.168.1.1"]
    assert "CommonSecurityLog" in ip_queries
    assert "IoC Type: IP_ADDRESS" in ip_queries["CommonSecurityLog"]
    
    # Check domain queries
    domain_queries = batch_queries["example.com"]
    assert "DnsEvents" in domain_queries
    assert "IoC Type: DOMAIN" in domain_queries["DnsEvents"]


def test_generate_union_query_same_type():
    """Test generating a union query for multiple IoCs of the same type"""
    ip_addresses = ["192.168.1.1", "10.0.0.1", "172.16.0.1"]
    union_queries = generate_union_query(ip_addresses, ioc_type=IoC_Type.IP_ADDRESS)
    
    # Check that we have union queries for the expected tables
    assert "CommonSecurityLog_Union" in union_queries
    assert "DnsEvents_Union" in union_queries
    
    # Check that all IP addresses are in each query
    for table, query in union_queries.items():
        for ip in ip_addresses:
            assert ip in query
        # Check that it indicates it's a union query
        assert "Union query for 3 IoCs" in query

def test_generate_union_query_mixed_types():
    """Test generating union queries for multiple IoCs of different types"""
    mixed_iocs = [
        "d41d8cd98f00b204e9800998ecf8427e",  # MD5 hash
        "da39a3ee5e6b4b0d3255bfef95601890afd80709",  # SHA1 hash
        "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"  # SHA256 hash
    ]
    union_queries = generate_union_query(mixed_iocs)
    
    # We should have separate union queries for each type
    # Check for MD5 queries
    md5_tables = [key for key in union_queries if "MD5" in union_queries[key]]
    assert len(md5_tables) > 0
    
    # Check for SHA1 queries
    sha1_tables = [key for key in union_queries if "SHA1" in union_queries[key]]
    assert len(sha1_tables) > 0
    
    # Check for SHA256 queries
    sha256_tables = [key for key in union_queries if "SHA256" in union_queries[key]]
    assert len(sha256_tables) > 0

def test_empty_iocs_list():
    """Test generating a union query with an empty list of IoCs"""
    union_queries = generate_union_query([])
    assert union_queries == {}
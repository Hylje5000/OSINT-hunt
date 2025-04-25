"""
Tests for the Hunting Queries API endpoints.
"""
import json
import pytest
from models import db, HuntingQuery, IoC

# No need to import fixtures here - they're imported automatically from conftest.py

def test_generate_ioc_query(client, test_data):
    """Test generating a hunting query for a specific IoC value"""
    # First create an IoC to use in the test
    with client.application.app_context():
        ioc = IoC(
            value="example.com",
            type="DOMAIN",
            description="Test domain"
        )
        db.session.add(ioc)
        db.session.commit()
        ioc_id = ioc.id
    
    # Now generate a query for this IoC
    payload = {
        "ioc_type": "domain",
        "query_name": "Test Query",
        "description": "Test description"
    }
    
    response = client.post(f'/api/iocs/{ioc_id}/generate_query', 
                         json=payload,
                         content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    assert "query" in data or "hunting_query" in data
    
    # The response format might be different based on the API
    query_data = data.get("query") or data.get("hunting_query")
    assert query_data is not None
    assert "query_text" in query_data


def test_get_ioc_hunting_queries(client, app):
    """Test retrieving hunting queries for a specific IoC"""
    # First create an IoC and a query for this IoC
    ioc_value = "example.com"
    ioc_id = None
    query_id = None
    
    with app.app_context():
        # Create the IoC first
        ioc = IoC(
            value=ioc_value,
            type="DOMAIN",
            description="Test domain"
        )
        db.session.add(ioc)
        db.session.flush()  # Get the ID without committing
        
        # Store the ID for later use
        ioc_id = ioc.id
        
        # Create a query linked to this IoC
        query = HuntingQuery(
            name="Test Query",
            description="Test Description",
            query_type="kql",
            query_text=json.dumps({"table": "SecurityEvent | where Computer contains 'example.com'"}),
            ioc_id=ioc.id,
            ioc_value=ioc_value,
            ioc_type="domain"
        )
        db.session.add(query)
        db.session.commit()
        query_id = query.id
    
    # Now retrieve the queries for this IoC
    response = client.get(f'/api/iocs/{ioc_id}/hunting_queries')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    assert "hunting_queries" in data
    assert len(data["hunting_queries"]) == 1
    assert data["hunting_queries"][0]["ioc_id"] == ioc_id


def test_generate_multiple_ioc_queries(client, app):
    """Test generating hunting queries for multiple IoCs"""
    # First, create some IoCs
    ioc1_id = None
    ioc2_id = None
    
    with app.app_context():
        ioc1 = IoC(
            value="example.com",
            type="DOMAIN",
            description="Test domain"
        )
        ioc2 = IoC(
            value="192.168.1.1",
            type="IP_ADDRESS",
            description="Test IP"
        )
        db.session.add_all([ioc1, ioc2])
        db.session.commit()
        
        # Store IDs for later use
        ioc1_id = ioc1.id
        ioc2_id = ioc2.id
    
    payload = {
        "ioc_ids": [ioc1_id, ioc2_id],
        "save": True
    }
    
    response = client.post('/api/iocs/bulk/generate_queries', 
                         json=payload,
                         content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    assert "generated_queries" in data
    assert len(data["generated_queries"]) == 2


def test_generate_queries_for_report(client, test_data):
    """Test generating hunting queries for IoCs in a report"""
    # First, ensure there are IoCs associated with the report
    with client.application.app_context():
        report_id = test_data["report_id"]
        
        # Create new IoCs and associate with the report
        from models import Report
        report = Report.query.get(report_id)
        
        if not report.iocs:
            # Add IoCs to the report if not already present
            report.set_iocs([
                {"type": "DOMAIN", "value": "example.com", "description": "Test domain"},
                {"type": "IP_ADDRESS", "value": "192.168.1.1", "description": "Test IP"}
            ])
            
    # Now test generating queries for the report
    payload = {
        "generate_individual_queries": True,
        "save": True
    }
    
    response = client.post(f'/api/reports/{test_data["report_id"]}/generate_queries', 
                         json=payload,
                         content_type='application/json')
    
    assert response.status_code == 200
    data = json.loads(response.data)
    
    # The API might structure its response differently, adjust as needed
    assert "queries" in data or "hunting_queries" in data or "generated_queries" in data


def test_delete_hunting_query(client, app):
    """Test deleting a hunting query"""
    # First create an IoC and a query
    query_id = None
    
    with app.app_context():
        # Create the IoC first
        ioc = IoC(
            value="example.com",
            type="DOMAIN",
            description="Test domain for delete test"
        )
        db.session.add(ioc)
        db.session.flush()  # Get the ID without committing
        
        query = HuntingQuery(
            name="Delete Test Query",
            description="Test Description",
            query_type="kql",
            query_text=json.dumps({"table": "SecurityEvent | where Computer contains 'example.com'"}),
            ioc_id=ioc.id,  # Now providing required ioc_id
            ioc_value="example.com",
            ioc_type="domain"
        )
        db.session.add(query)
        db.session.commit()
        query_id = query.id
    
    # Now delete it
    response = client.delete(f'/api/hunting_queries/{query_id}')
    
    assert response.status_code == 200
    
    # Verify it's gone from the database
    with app.app_context():
        deleted_query = HuntingQuery.query.get(query_id)
        assert deleted_query is None


# Add new test for the duplicate prevention feature
def test_prevent_duplicate_hunting_queries(client, app):
    """Test that the API prevents creating duplicate hunting queries for the same IoC"""
    # First create an IoC
    ioc_id = None
    
    with app.app_context():
        ioc = IoC(
            value="malicious.example.com",
            type="DOMAIN",
            description="Test malicious domain"
        )
        db.session.add(ioc)
        db.session.commit()
        ioc_id = ioc.id
    
    # First, create a query for this IoC
    payload = {
        "ioc_type": "domain",
        "query_name": "First Query",
        "description": "First query for this IoC"
    }
    
    # Create the first query
    response1 = client.post(f'/api/iocs/{ioc_id}/generate_query', 
                         json=payload,
                         content_type='application/json')
    
    assert response1.status_code == 200
    data1 = json.loads(response1.data)
    
    # Check if the response structure indicates whether this is a new or existing query
    if "exists" in data1:
        assert data1["exists"] == False
    
    # Try to create a second query for the same IoC
    payload["query_name"] = "Second Query"
    response2 = client.post(f'/api/iocs/{ioc_id}/generate_query', 
                         json=payload,
                         content_type='application/json')
    
    assert response2.status_code == 200
    data2 = json.loads(response2.data)
    
    # If the API has duplicate prevention, it should indicate an existing query
    if "exists" in data2:
        assert data2["exists"] == True
    
    # Verify only one query exists in the database for this IoC
    with app.app_context():
        queries = HuntingQuery.query.filter_by(ioc_id=ioc_id).all()
        assert len(queries) == 1
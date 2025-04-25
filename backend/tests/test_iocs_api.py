import json
import pytest
from models import IoC, HuntingQuery

def test_add_iocs_endpoint(client):
    """Test the POST /api/iocs endpoint for adding IoCs."""
    # Test data with different IoC types
    test_iocs = [
        {"value": "malicious.com", "type": "domain", "description": "Test domain"},
        {"value": "192.168.0.1", "type": "ip", "description": "Test IP address"},
        {"value": "44d88612fea8a8f36de82e1278abb02f", "type": "hash", "description": "Test MD5 hash"}
    ]
    
    # Call the endpoint without generating queries
    response = client.post(
        '/api/iocs',
        data=json.dumps({
            'iocs': test_iocs,
            'generate_queries': False
        }),
        content_type='application/json'
    )
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data['added']) == 3
    assert len(data['existing']) == 0
    
    # Verify that the IoCs were added to the database
    with client.application.app_context():
        iocs = IoC.query.all()
        assert len(iocs) >= 3
        
        # Verify specific IoCs
        domain_ioc = IoC.query.filter_by(value="malicious.com").first()
        assert domain_ioc is not None
        assert domain_ioc.type == "domain"
    
    # Now call the endpoint with query generation
    test_ioc_with_query = [
        {"value": "evil.com", "type": "domain", "description": "Test domain for query gen"}
    ]
    
    response = client.post(
        '/api/iocs',
        data=json.dumps({
            'iocs': test_ioc_with_query,
            'generate_queries': True
        }),
        content_type='application/json'
    )
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert len(data['added']) == 1
    
    # Verify that a hunting query was created
    with client.application.app_context():
        ioc = IoC.query.filter_by(value="evil.com").first()
        assert ioc is not None
        
        queries = HuntingQuery.query.filter_by(ioc_id=ioc.id).all()
        assert len(queries) == 1
        assert "evil.com" in queries[0].query_text

def test_add_duplicate_iocs(client):
    """Test adding duplicate IoCs via the /api/iocs endpoint."""
    # First add an IoC
    initial_iocs = [
        {"value": "duplicate.com", "type": "domain", "description": "First addition"}
    ]
    
    client.post(
        '/api/iocs',
        data=json.dumps({'iocs': initial_iocs}),
        content_type='application/json'
    )
    
    # Now try to add the same IoC again
    duplicate_iocs = [
        {"value": "duplicate.com", "type": "domain", "description": "Second addition"}
    ]
    
    response = client.post(
        '/api/iocs',
        data=json.dumps({'iocs': duplicate_iocs}),
        content_type='application/json'
    )
    
    # Check the response - the IoC should be in 'existing'
    data = json.loads(response.data)
    assert len(data['added']) == 0
    assert len(data['existing']) == 1
    
    # The database should still have only one instance of this IoC
    with client.application.app_context():
        duplicate_iocs = IoC.query.filter_by(value="duplicate.com").all()
        assert len(duplicate_iocs) == 1
        assert duplicate_iocs[0].description == "First addition"  # Original description should be kept

def test_get_ioc_by_id(client):
    """Test retrieving an IoC by its ID."""
    # First add an IoC
    test_ioc = [
        {"value": "get-by-id.com", "type": "domain", "description": "Test IoC for get by ID"}
    ]
    
    response = client.post(
        '/api/iocs',
        data=json.dumps({'iocs': test_ioc}),
        content_type='application/json'
    )
    
    # Get the ID of the added IoC
    data = json.loads(response.data)
    ioc_id = data['added'][0]['id']
    
    # Now retrieve the IoC by its ID
    response = client.get(f'/api/iocs/{ioc_id}')
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert data['id'] == ioc_id
    assert data['value'] == "get-by-id.com"
    assert data['type'] == "domain"

def test_delete_ioc(client):
    """Test deleting an IoC by its ID."""
    # First add an IoC
    test_ioc = [
        {"value": "delete-me.com", "type": "domain", "description": "Test IoC for deletion"}
    ]
    
    response = client.post(
        '/api/iocs',
        data=json.dumps({'iocs': test_ioc}),
        content_type='application/json'
    )
    
    # Get the ID of the added IoC
    data = json.loads(response.data)
    ioc_id = data['added'][0]['id']
    
    # Now delete the IoC
    response = client.delete(f'/api/iocs/{ioc_id}')
    
    # Check the response
    assert response.status_code == 200
    
    # Verify the IoC was deleted
    with client.application.app_context():
        ioc = IoC.query.get(ioc_id)
        assert ioc is None
        
def test_generate_query_for_ioc(client):
    """Test generating a hunting query for an IoC by ID."""
    # First add an IoC
    test_ioc = [
        {"value": "generate-query.com", "type": "domain", "description": "Test IoC for query generation"}
    ]
    
    response = client.post(
        '/api/iocs',
        data=json.dumps({'iocs': test_ioc}),
        content_type='application/json'
    )
    
    # Get the ID of the added IoC
    data = json.loads(response.data)
    ioc_id = data['added'][0]['id']
    
    # Now generate a query for the IoC
    response = client.post(
        f'/api/iocs/{ioc_id}/generate_query',
        data=json.dumps({
            'query_name': 'Test Generated Query',
            'description': 'Query for testing'
        }),
        content_type='application/json'
    )
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'query' in data
    assert data['query']['ioc_id'] == ioc_id
    
    # Verify the query was created in the database
    with client.application.app_context():
        queries = HuntingQuery.query.filter_by(ioc_id=ioc_id).all()
        assert len(queries) == 1
        assert queries[0].name == 'Test Generated Query'

def test_bulk_generate_queries(client):
    """Test generating hunting queries for multiple IoCs by IDs."""
    # First add some IoCs
    test_iocs = [
        {"value": "bulk1.com", "type": "domain", "description": "Bulk test 1"},
        {"value": "bulk2.com", "type": "domain", "description": "Bulk test 2"}
    ]
    
    response = client.post(
        '/api/iocs',
        data=json.dumps({'iocs': test_iocs}),
        content_type='application/json'
    )
    
    # Get the IDs of the added IoCs
    data = json.loads(response.data)
    ioc_ids = [ioc['id'] for ioc in data['added']]
    
    # Now generate queries for the IoCs
    response = client.post(
        '/api/iocs/bulk/generate_queries',
        data=json.dumps({
            'ioc_ids': ioc_ids,
            'save': True
        }),
        content_type='application/json'
    )
    
    # Check the response
    assert response.status_code == 200
    data = json.loads(response.data)
    assert 'generated_queries' in data
    assert len(data['generated_queries']) == 2
    
    # Verify the queries were created in the database
    with client.application.app_context():
        for ioc_id in ioc_ids:
            queries = HuntingQuery.query.filter_by(ioc_id=ioc_id).all()
            assert len(queries) == 1
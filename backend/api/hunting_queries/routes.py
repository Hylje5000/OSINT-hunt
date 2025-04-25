"""
Routes for the hunting queries API.
"""
from flask import request, jsonify, current_app
from models import db, HuntingQuery, IoC
from . import hunting_queries_bp
from utils.kql.query_generator import generate_query
from utils.ioc.detector import detect_ioc_type, IoC_Type

@hunting_queries_bp.route('/api/hunting_queries', methods=['GET'])
def get_all_hunting_queries():
    """Get all hunting queries"""
    queries = HuntingQuery.query.all()
    return jsonify({
        'hunting_queries': [query.to_dict() for query in queries]
    })

@hunting_queries_bp.route('/api/hunting_queries/<int:query_id>', methods=['GET'])
def get_hunting_query(query_id):
    """Get a hunting query by ID"""
    query = HuntingQuery.query.get_or_404(query_id)
    return jsonify(query.to_dict())

@hunting_queries_bp.route('/api/hunting_queries', methods=['POST'])
def create_hunting_query():
    """Create a new hunting query"""
    data = request.get_json()
    
    # Required fields
    name = data.get('name')
    query_type = data.get('query_type', 'kql')
    query_text = data.get('query_text')
    ioc_id = data.get('ioc_id')
    
    # Optional fields
    description = data.get('description', '')
    
    # Validate required fields
    if not name or not query_text or not ioc_id:
        return jsonify({
            'error': 'Missing required fields (name, query_text, ioc_id)'
        }), 400
    
    # Verify IoC exists
    ioc = IoC.query.get(ioc_id)
    if not ioc:
        return jsonify({
            'error': f'IoC with ID {ioc_id} not found'
        }), 404
    
    # Create new hunting query
    hunting_query = HuntingQuery(
        name=name,
        description=description,
        query_type=query_type,
        query_text=query_text,
        ioc_id=ioc_id
    )
    
    db.session.add(hunting_query)
    db.session.commit()
    
    return jsonify({
        'message': 'Hunting query created successfully',
        'hunting_query': hunting_query.to_dict()
    }), 201

@hunting_queries_bp.route('/api/hunting_queries/<int:query_id>', methods=['PUT'])
def update_hunting_query(query_id):
    """Update a hunting query"""
    query = HuntingQuery.query.get_or_404(query_id)
    data = request.get_json()
    
    # Update fields if provided
    if 'name' in data:
        query.name = data['name']
    if 'description' in data:
        query.description = data['description']
    if 'query_text' in data:
        query.query_text = data['query_text']
    if 'query_type' in data:
        query.query_type = data['query_type']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Hunting query updated successfully',
        'hunting_query': query.to_dict()
    })

@hunting_queries_bp.route('/api/hunting_queries/<int:query_id>', methods=['DELETE'])
def delete_hunting_query(query_id):
    """Delete a hunting query"""
    query = HuntingQuery.query.get_or_404(query_id)
    db.session.delete(query)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': f'Hunting query {query_id} deleted'
    })

@hunting_queries_bp.route('/api/iocs/<int:ioc_id>/generate_query', methods=['POST'])
def generate_ioc_query(ioc_id):
    """Generate a hunting query for a specific IoC ID"""
    ioc = IoC.query.get_or_404(ioc_id)
    
    data = request.get_json() or {}
    query_name = data.get('query_name', f"Hunting Query for {ioc.value}")
    description = data.get('description', f"Generated hunting query for {ioc.value}")
    
    # Check if a query already exists for this IoC
    existing_query = HuntingQuery.query.filter_by(ioc_id=ioc_id).first()
    if existing_query and not data.get('force_new', False):
        return jsonify({
            'exists': True,
            'hunting_query': existing_query.to_dict()
        })
    
    # Generate query for this IoC
    try:
        # Convert string type to IoC_Type enum
        try:
            ioc_type = IoC_Type[ioc.type.upper()]
        except (KeyError, AttributeError):
            ioc_type = detect_ioc_type(ioc.value)
            
        query_dict = generate_query(ioc.value, ioc_type)
        
        # Combine all the generated queries into a single text
        query_text = ""
        for table_name, table_query in query_dict.items():
            query_text += f"// Table: {table_name}\n{table_query}\n\n"
        
        # Create new hunting query
        hunting_query = HuntingQuery(
            name=query_name,
            description=description,
            query_type='kql',
            query_text=query_text,
            ioc_id=ioc.id
        )
        
        # Save to database
        db.session.add(hunting_query)
        db.session.commit()
        
        return jsonify({
            'exists': False,
            'hunting_query': hunting_query.to_dict()
        })
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

@hunting_queries_bp.route('/api/iocs/<int:ioc_id>/hunting_queries', methods=['GET'])
def get_ioc_hunting_queries(ioc_id):
    """Get all hunting queries for a specific IoC ID"""
    # Verify IoC exists
    ioc = IoC.query.get_or_404(ioc_id)
    
    # Get queries for this IoC
    queries = HuntingQuery.query.filter_by(ioc_id=ioc_id).all()
    
    return jsonify({
        'ioc': ioc.to_dict(),
        'hunting_queries': [query.to_dict() for query in queries]
    })

@hunting_queries_bp.route('/api/hunting_queries/bulk_generate', methods=['POST'])
def generate_multiple_ioc_queries():
    """Generate hunting queries for multiple IoCs"""
    data = request.get_json()
    ioc_ids = data.get('ioc_ids', [])
    
    if not ioc_ids:
        return jsonify({
            'error': 'No IoC IDs provided'
        }), 400
    
    # Track processed IoCs and generated queries
    generated_queries = []
    failed_iocs = []
    
    for ioc_id in ioc_ids:
        ioc = IoC.query.get(ioc_id)
        if not ioc:
            failed_iocs.append({
                'ioc_id': ioc_id,
                'reason': 'IoC not found'
            })
            continue
        
        try:
            # Convert string type to IoC_Type enum
            try:
                ioc_type = IoC_Type[ioc.type.upper()]
            except (KeyError, AttributeError):
                ioc_type = detect_ioc_type(ioc.value)
            
            # Generate query for this IoC
            query_dict = generate_query(ioc.value, ioc_type)
            
            # Combine all the generated queries into a single text
            query_text = ""
            for table_name, table_query in query_dict.items():
                query_text += f"// Table: {table_name}\n{table_query}\n\n"
            
            # Create new hunting query
            hunting_query = HuntingQuery(
                name=f"Query for {ioc.type} {ioc.value}",
                description=f"Hunting query for {ioc.type}: {ioc.value}",
                query_type='kql',
                query_text=query_text,
                ioc_id=ioc.id
            )
            
            db.session.add(hunting_query)
            generated_queries.append({
                'ioc_id': ioc.id,
                'query_id': hunting_query.id,
                'query_name': hunting_query.name
            })
        except Exception as e:
            failed_iocs.append({
                'ioc_id': ioc_id,
                'reason': str(e)
            })
    
    # Commit all changes
    db.session.commit()
    
    return jsonify({
        'generated_queries': generated_queries,
        'failed_iocs': failed_iocs,
        'message': f"Generated {len(generated_queries)} queries, failed {len(failed_iocs)}"
    })
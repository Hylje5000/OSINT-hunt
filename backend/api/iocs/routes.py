from flask import Blueprint, jsonify, request
from models import db, Report, HuntingQuery, IoC
from utils.ioc.defang import parse_ioc_input, refang
from utils.ioc.detector import detect_ioc_type, get_ioc_type_name, IoC_Type
from utils.kql.query_generator import generate_query

iocs_bp = Blueprint('iocs', __name__)

@iocs_bp.route('/api/iocs/detect', methods=['POST'])
def detect_iocs():
    """Detect the type of IoCs from raw input."""
    data = request.get_json()
    if not data or 'input' not in data:
        return jsonify({"error": "Missing 'input' field"}), 400

    input_text = data['input']
    iocs = parse_ioc_input(input_text)

    result = []
    for ioc in iocs:
        ioc_type = detect_ioc_type(ioc)
        result.append({
            "value": ioc,
            "type": ioc_type.name.lower(),
            "type_name": get_ioc_type_name(ioc_type)
        })

    return jsonify({"iocs": result})

@iocs_bp.route('/api/iocs', methods=['GET'])
def get_all_iocs():
    """Get all IoCs in the database."""
    iocs = IoC.query.all()
    return jsonify({
        "iocs": [ioc.to_dict() for ioc in iocs]
    })

@iocs_bp.route('/api/iocs/<int:ioc_id>', methods=['GET'])
def get_ioc_by_id(ioc_id):
    """Get an IoC by its ID."""
    ioc = IoC.query.get(ioc_id)
    if not ioc:
        return jsonify({"error": "IoC not found"}), 404
    
    return jsonify(ioc.to_dict())

@iocs_bp.route('/api/iocs', methods=['POST'])
def add_ioc():
    """Add a new IoC to the database."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400
    
    # Extract IoC data
    if 'input' in data:
        input_text = data['input']
        iocs_raw = parse_ioc_input(input_text)
        iocs_data = []
        for ioc_value in iocs_raw:
            ioc_type = detect_ioc_type(ioc_value)
            iocs_data.append({
                "type": ioc_type.name.lower(),
                "value": ioc_value,
                "description": data.get('description', ''),
                "source": data.get('source', ''),
                "confidence": data.get('confidence')
            })
    elif 'iocs' in data and isinstance(data['iocs'], list):
        iocs_data = data['iocs']
    else:
        return jsonify({"error": "Missing 'input' or 'iocs' field"}), 400
    
    # Process each IoC
    added_iocs = []
    existing_iocs = []
    
    for ioc_data in iocs_data:
        # Check if IoC already exists
        existing_ioc = IoC.query.filter_by(
            value=ioc_data.get('value'), 
            type=ioc_data.get('type')
        ).first()
        
        if existing_ioc:
            existing_iocs.append(existing_ioc.to_dict())
            continue
        
        # Create new IoC
        new_ioc = IoC(
            value=ioc_data.get('value'),
            type=ioc_data.get('type'),
            description=ioc_data.get('description', ''),
            source=ioc_data.get('source', ''),
            confidence=ioc_data.get('confidence')
        )
        
        db.session.add(new_ioc)
        db.session.flush()  # To get the ID of the new IoC
        
        added_iocs.append(new_ioc.to_dict())
        
        # Generate hunting query if requested
        if data.get('generate_queries', False):
            try:
                ioc_value = new_ioc.value
                ioc_type_str = new_ioc.type
                
                # Convert string type to IoC_Type enum
                try:
                    ioc_type = IoC_Type[ioc_type_str.upper()]
                except (KeyError, AttributeError):
                    ioc_type = detect_ioc_type(ioc_value)
                
                # Generate query for this IoC
                query_dict = generate_query(ioc_value, ioc_type)
                
                # Combine all the generated queries into a single text
                query_text = ""
                for table_name, table_query in query_dict.items():
                    query_text += f"// Table: {table_name}\n{table_query}\n\n"
                
                # Save the query
                hunting_query = HuntingQuery(
                    name=f"Generated Query for {ioc_type_str} {ioc_value}",
                    description=f"Automatically generated hunting query for {ioc_type_str}: {ioc_value}",
                    query_text=query_text,
                    ioc_id=new_ioc.id,
                    query_type="kql"
                )
                db.session.add(hunting_query)
            except Exception as e:
                # Log the error but continue with the next IoC
                print(f"Error generating query for {ioc_value}: {str(e)}")
    
    db.session.commit()
    
    return jsonify({
        "added": added_iocs,
        "existing": existing_iocs,
        "message": f"Added {len(added_iocs)} IoCs, found {len(existing_iocs)} existing ones"
    })

@iocs_bp.route('/api/iocs/<int:ioc_id>', methods=['DELETE'])
def delete_ioc(ioc_id):
    """Delete an IoC by its ID."""
    ioc = IoC.query.get(ioc_id)
    if not ioc:
        return jsonify({"error": "IoC not found"}), 404
    
    # Delete associated hunting queries
    HuntingQuery.query.filter_by(ioc_id=ioc_id).delete()
    
    # Delete the IoC
    db.session.delete(ioc)
    db.session.commit()
    
    return jsonify({
        "message": f"IoC with ID {ioc_id} deleted successfully"
    })

@iocs_bp.route('/api/iocs/check_duplicates', methods=['POST'])
def check_ioc_duplicates():
    """Check if IoCs already exist in the database."""
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    if 'input' in data:
        input_text = data['input']
        iocs_raw = parse_ioc_input(input_text)
        iocs_data = []
        for ioc_value in iocs_raw:
            ioc_type = detect_ioc_type(ioc_value)
            iocs_data.append({
                "type": ioc_type.name.lower(),
                "value": ioc_value
            })
    elif 'iocs' in data and isinstance(data['iocs'], list):
        iocs_data = data['iocs']
    else:
        return jsonify({"error": "Missing 'input' or 'iocs' field"}), 400

    duplicates = []
    for ioc_data in iocs_data:
        existing_ioc = IoC.query.filter_by(
            value=ioc_data.get('value'),
            type=ioc_data.get('type')
        ).first()
        
        if existing_ioc:
            duplicates.append({
                "ioc": ioc_data,
                "found": existing_ioc.to_dict()
            })

    return jsonify({
        "duplicates": duplicates
    })

@iocs_bp.route('/api/iocs/<int:ioc_id>/hunting_queries', methods=['GET'])
def get_ioc_hunting_queries(ioc_id):
    """Get hunting queries associated with a specific IoC ID."""
    ioc = IoC.query.get(ioc_id)
    if not ioc:
        return jsonify({"error": "IoC not found"}), 404
    
    # Query for hunting queries that match this IoC
    queries = HuntingQuery.query.filter_by(ioc_id=ioc_id).all()
    
    return jsonify({
        "ioc": ioc.to_dict(),
        "hunting_queries": [q.to_dict() for q in queries]
    })

@iocs_bp.route('/api/iocs/<int:ioc_id>/generate_query', methods=['POST'])
def generate_query_for_ioc(ioc_id):
    """Generate a hunting query for a specific IoC by ID."""
    ioc = IoC.query.get(ioc_id)
    if not ioc:
        return jsonify({"error": "IoC not found"}), 404
    
    data = request.get_json() or {}
    query_name = data.get('query_name', f"Hunting Query for {ioc.value}")
    description = data.get('description', f"Generated hunting query for {ioc.value}")
    
    # Check if a query already exists for this IoC
    existing_query = HuntingQuery.query.filter_by(ioc_id=ioc_id).first()
    if existing_query and not data.get('force_new', False):
        return jsonify({
            'exists': True,
            'query': existing_query.to_dict()  # Changed from 'hunting_query' to 'query' to match test expectations
        })
    
    # Generate the query
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
        
        # Create a new hunting query
        hunting_query = HuntingQuery(
            name=query_name,
            description=description,
            query_text=query_text,
            ioc_id=ioc.id,
            ioc_value=ioc.value,
            ioc_type=ioc.type,
            query_type="kql"
        )
        
        db.session.add(hunting_query)
        db.session.commit()
        
        return jsonify({
            'exists': False,
            'query': hunting_query.to_dict()  # Changed from 'hunting_query' to 'query' to match test expectations
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@iocs_bp.route('/api/iocs/bulk/generate_queries', methods=['POST'])
def generate_queries_for_multiple_iocs():
    """Generate hunting queries for multiple IoCs by their IDs."""
    data = request.get_json()
    
    if not data or 'ioc_ids' not in data:
        return jsonify({"error": "Missing 'ioc_ids' field"}), 400
    
    ioc_ids = data.get('ioc_ids', [])
    save = data.get('save', True)
    
    # Keep track of generated queries
    generated_queries = []
    
    try:
        for ioc_id in ioc_ids:
            ioc = IoC.query.get(ioc_id)
            if not ioc:
                continue
            
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
            
            if save:
                hunting_query = HuntingQuery(
                    name=f"Query for {ioc.type} {ioc.value}",
                    description=f"Hunting query for {ioc.type}: {ioc.value}",
                    query_text=query_text,
                    ioc_id=ioc.id,
                    query_type="kql"
                )
                db.session.add(hunting_query)
                generated_queries.append({
                    "ioc_id": ioc.id,
                    "query_id": hunting_query.id,
                    "query_name": hunting_query.name
                })
        
        # Save to database if requested
        if save:
            db.session.commit()
        
        return jsonify({
            "message": f"Generated {len(generated_queries)} hunting queries",
            "generated_queries": generated_queries
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
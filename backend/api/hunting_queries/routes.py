"""
Routes for the hunting queries API.
"""
import json
from flask import request, jsonify, current_app
from models import db, HuntingQuery, Report
from . import hunting_queries_bp
from utils.kql.query_generator import generate_query

@hunting_queries_bp.route('/api/iocs/<ioc_value>/generate_query', methods=['POST'])
def generate_ioc_query(ioc_value):
    """Generate a hunting query for a specific IoC value"""
    data = request.get_json()
    ioc_type = data.get('ioc_type')
    query_name = data.get('query_name')
    description = data.get('description')
    
    # Check if a query already exists for this IoC
    existing_query = HuntingQuery.query.filter_by(ioc_value=ioc_value).first()
    if existing_query:
        return jsonify({
            'exists': True,
            'hunting_query': existing_query.to_dict()
        })
    
    # Generate query for this IoC
    query_text = generate_query(ioc_value, ioc_type)
    
    # Create new query object
    hunting_query = HuntingQuery(
        name=query_name,
        description=description,
        query_type='kql',
        query_text=json.dumps(query_text),
        ioc_value=ioc_value,
        ioc_type=ioc_type,
        iocs=[{"type": ioc_type, "value": ioc_value}]
    )
    
    # Save to database
    db.session.add(hunting_query)
    db.session.commit()
    
    return jsonify({
        'exists': False,
        'hunting_query': hunting_query.to_dict()
    })

@hunting_queries_bp.route('/api/iocs/<ioc_value>/hunting_queries', methods=['GET'])
def get_ioc_hunting_queries(ioc_value):
    """Get all hunting queries for a specific IoC value"""
    queries = HuntingQuery.query.filter_by(ioc_value=ioc_value).all()
    return jsonify({
        'hunting_queries': [query.to_dict() for query in queries]
    })

@hunting_queries_bp.route('/api/iocs/generate_queries', methods=['POST'])
def generate_multiple_ioc_queries():
    """Generate hunting queries for multiple IoCs"""
    data = request.get_json()
    iocs = data.get('iocs', [])
    save = data.get('save', False)
    generate_individual = data.get('generate_individual_queries', False)
    query_name = data.get('query_name')
    description = data.get('description')
    
    # Track processed IoCs and saved queries
    iocs_processed = []
    saved_individual_queries = []
    combined_query_parts = []
    
    for ioc in iocs:
        ioc_type = ioc.get('type')
        ioc_value = ioc.get('value')
        ioc_description = ioc.get('description', '')
        
        # Generate query for this IoC
        query_text = generate_query(ioc_value, ioc_type)
        combined_query_parts.append(query_text)
        
        iocs_processed.append({
            'type': ioc_type,
            'value': ioc_value,
            'query_text': query_text
        })
        
        # Save individual query if requested
        if save and generate_individual:
            individual_query = HuntingQuery(
                name=f"{query_name} - {ioc_value}",
                description=f"{description} - {ioc_description}",
                query_type='kql',
                query_text=json.dumps(query_text),
                ioc_value=ioc_value,
                ioc_type=ioc_type,
                iocs=[{"type": ioc_type, "value": ioc_value}]
            )
            db.session.add(individual_query)
            saved_individual_queries.append(individual_query.to_dict())
    
    # Create combined query
    combined_query = None
    if save:
        # Here we would combine the individual queries - simplified for now
        combined_query_text = json.dumps({'table': 'Combined Query', 'parts': combined_query_parts})
        combined_query = HuntingQuery(
            name=query_name,
            description=description,
            query_type='kql',
            query_text=combined_query_text,
            iocs=[{'type': ioc.get('type'), 'value': ioc.get('value')} for ioc in iocs]
        )
        db.session.add(combined_query)
    
    # Commit changes to database
    if save:
        db.session.commit()
    
    return jsonify({
        'hunting_queries': combined_query.to_dict() if combined_query else None,
        'iocs_processed': iocs_processed,
        'saved_individual_queries': saved_individual_queries
    })

@hunting_queries_bp.route('/api/reports/<int:report_id>/generate_queries', methods=['POST'])
def generate_queries_for_report(report_id):
    """Generate hunting queries for IoCs in a report"""
    data = request.get_json()
    generate_individual = data.get('generate_individual_queries', False)
    save = data.get('save', False)
    
    # Get the report
    report = Report.query.get_or_404(report_id)
    
    # Get IoCs from the report's JSON field
    report_iocs = report.get_iocs()
    
    # Track processed IoCs and saved queries
    iocs_processed = []
    saved_individual_queries = []
    combined_query_parts = []
    
    for ioc in report_iocs:
        ioc_type = ioc.get('type')
        ioc_value = ioc.get('value')
        
        # Generate query for this IoC
        query_text = generate_query(ioc_value, ioc_type)
        combined_query_parts.append(query_text)
        
        iocs_processed.append({
            'type': ioc_type,
            'value': ioc_value,
            'query_text': query_text
        })
        
        # Save individual query if requested
        if save and generate_individual:
            individual_query = HuntingQuery(
                name=f"Report {report_id} - {ioc_value}",
                description=f"Query for {ioc_type} {ioc_value} from report {report.name}",
                query_type='kql',
                query_text=json.dumps(query_text),
                ioc_value=ioc_value,
                ioc_type=ioc_type,
                report_id=report_id,
                iocs=[{"type": ioc_type, "value": ioc_value}]
            )
            db.session.add(individual_query)
            saved_individual_queries.append(individual_query.to_dict())
    
    # Create combined query only if individual queries aren't requested
    combined_query = None
    if save and not generate_individual:
        combined_query_text = json.dumps({'table': 'Combined Query', 'parts': combined_query_parts})
        combined_query = HuntingQuery(
            name=f"Combined Query for Report {report_id}",
            description=f"Combined hunting query for all IoCs in report {report.name}",
            query_type='kql',
            query_text=combined_query_text,
            report_id=report_id,
            iocs=[ioc for ioc in report_iocs]
        )
        db.session.add(combined_query)
    
    # Commit changes to database
    if save:
        db.session.commit()
    
    return jsonify({
        'hunting_queries': combined_query.to_dict() if combined_query else None,
        'iocs_processed': iocs_processed,
        'saved_individual_queries': saved_individual_queries
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
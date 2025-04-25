from flask import Blueprint, jsonify, request
from models import db, Report, HuntingQuery
from utils.ioc.detector import detect_ioc_type, IoC_Type
from utils.kql.query_generator import generate_query

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/api/reports', methods=['GET'])
def get_all_reports():
    """Get all reports from database"""
    reports = Report.query.all()
    return jsonify({"reports": [report.to_dict() for report in reports]})

@reports_bp.route('/api/reports/<int:report_id>', methods=['GET'])
def get_report(report_id):
    """Get a specific report by ID from database"""
    report = Report.query.get(report_id)
    if report:
        return jsonify({"report": report.to_dict()})
    return jsonify({"error": "Report not found"}), 404

@reports_bp.route('/api/reports', methods=['POST'])
def create_report():
    """Create a new report in database"""
    data = request.get_json()
    if not data or not all(key in data for key in ['name', 'source']):
        return jsonify({"error": "Missing required fields (name, source)"}), 400

    new_report = Report(
        name=data["name"],
        source=data["source"],
        sigma_rule=data.get("sigma_rule", "")
    )

    if 'iocs' in data and isinstance(data['iocs'], list):
        new_report.set_iocs(data['iocs'])

    db.session.add(new_report)
    db.session.commit()

    return jsonify({"report": new_report.to_dict(), "message": "Report created successfully"}), 201

@reports_bp.route('/api/reports/<int:report_id>', methods=['PUT'])
def update_report(report_id):
    """Update an existing report"""
    report = Report.query.get(report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    if 'name' in data:
        report.name = data['name']
    if 'source' in data:
        report.source = data['source']
    if 'sigma_rule' in data:
        report.sigma_rule = data['sigma_rule']

    if 'iocs' in data and isinstance(data['iocs'], list):
        report.set_iocs(data['iocs'])

    db.session.commit()
    return jsonify({"report": report.to_dict(), "message": "Report updated successfully"})

@reports_bp.route('/api/reports/<int:report_id>', methods=['DELETE'])
def delete_report(report_id):
    """Delete a report"""
    report = Report.query.get(report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404

    db.session.delete(report)
    db.session.commit()
    return jsonify({"message": "Report deleted successfully"})

@reports_bp.route('/api/reports/<int:report_id>/generate_queries', methods=['POST'])
def generate_queries_for_report(report_id):
    """Generate hunting queries for all IoCs in a report"""
    report = Report.query.get(report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404
    
    data = request.get_json() or {}
    save = data.get('save', True)
    generate_individual_queries = data.get('generate_individual_queries', True)
    
    iocs_processed = []
    saved_individual_queries = []
    hunting_queries = []
    
    for ioc in report.iocs:
        ioc_data = ioc.to_dict()
        
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
            
            if save and generate_individual_queries:
                # Create individual hunting query for this IoC
                hunting_query = HuntingQuery(
                    name=f"Query for {ioc.type} {ioc.value}",
                    description=f"Hunting query for {ioc.type}: {ioc.value}",
                    query_text=query_text,
                    ioc_id=ioc.id,
                    ioc_value=ioc.value,
                    ioc_type=ioc.type,
                    report_id=report_id,
                    query_type="kql"
                )
                db.session.add(hunting_query)
                
                # Add to saved queries list for response
                saved_individual_queries.append({
                    'ioc_id': ioc.id,
                    'query_id': hunting_query.id,
                    'query_name': hunting_query.name
                })
            
            # Add the generated query to the response
            hunting_queries.append({
                'ioc': ioc_data,
                'query_text': query_text
            })
            
            # Add to processed IoCs
            iocs_processed.append(ioc_data)
            
        except Exception as e:
            # Log error but continue with other IoCs
            print(f"Error generating query for {ioc.value}: {str(e)}")
    
    if save:
        db.session.commit()
    
    return jsonify({
        'message': f"Generated hunting queries for {len(iocs_processed)} IoCs",
        'report_id': report_id,
        'iocs_processed': iocs_processed,
        'hunting_queries': hunting_queries,
        'saved_individual_queries': saved_individual_queries
    })
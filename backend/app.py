from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import json
from config import Config
from models import db, Report, HuntingQuery
from seed_data import create_example_data
from utils.ioc.defang import parse_ioc_input, refang
from utils.ioc.detector import detect_ioc_type, get_ioc_type_name
from utils.kql.query_generator import generate_query, generate_union_query, IoC_Type
from datetime import datetime

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Initialize extensions
    CORS(app)  # Enable CORS for all routes
    db.init_app(app)
    
    # Create tables if they don't exist
    with app.app_context():
        db.create_all()
        create_example_data()
    
    # API Routes
    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Health check endpoint to verify the API is running"""
        return jsonify({"status": "healthy", "message": "API is running"})

    # Reports API Endpoints - Complete CRUD
    @app.route('/api/reports', methods=['GET'])
    def get_all_reports():
        """Get all reports from database"""
        reports = Report.query.all()
        return jsonify({"reports": [report.to_dict() for report in reports]})

    @app.route('/api/reports/<int:report_id>', methods=['GET'])
    def get_report(report_id):
        """Get a specific report by ID from database"""
        report = Report.query.get(report_id)
        if report:
            return jsonify({"report": report.to_dict()})
        return jsonify({"error": "Report not found"}), 404

    @app.route('/api/reports', methods=['POST'])
    def create_report():
        """Create a new report in database"""
        data = request.get_json()
        
        # Validation
        if not data or not all(key in data for key in ['name', 'source']):
            return jsonify({"error": "Missing required fields (name, source)"}), 400
        
        # Create new report
        new_report = Report(
            name=data["name"],
            source=data["source"],
            sigma_rule=data.get("sigma_rule", "")
        )
        
        # Add IOCs if provided
        if 'iocs' in data and isinstance(data['iocs'], list):
            new_report.set_iocs(data['iocs'])
        
        db.session.add(new_report)
        db.session.commit()
        
        return jsonify({"report": new_report.to_dict(), "message": "Report created successfully"}), 201

    @app.route('/api/reports/<int:report_id>', methods=['PUT'])
    def update_report(report_id):
        """Update an existing report"""
        report = Report.query.get(report_id)
        if not report:
            return jsonify({"error": "Report not found"}), 404
            
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        # Update report fields
        if 'name' in data:
            report.name = data['name']
        if 'source' in data:
            report.source = data['source']
        if 'sigma_rule' in data:
            report.sigma_rule = data['sigma_rule']
        
        # Update IOCs if provided
        if 'iocs' in data and isinstance(data['iocs'], list):
            report.set_iocs(data['iocs'])
            
        db.session.commit()
        return jsonify({"report": report.to_dict(), "message": "Report updated successfully"})
    
    @app.route('/api/reports/<int:report_id>', methods=['DELETE'])
    def delete_report(report_id):
        """Delete a report"""
        report = Report.query.get(report_id)
        if not report:
            return jsonify({"error": "Report not found"}), 404
            
        db.session.delete(report)
        db.session.commit()
        return jsonify({"message": "Report deleted successfully"})
    
    # IoC Specific API Endpoints
    @app.route('/api/iocs/detect', methods=['POST'])
    def detect_iocs():
        """
        Detect the type of IoCs from raw input.
        
        Expects a JSON object with the following format:
        {
            "input": "example.com, 192.168.1.1"
        }
        
        Returns a list of detected IoCs with their types.
        """
        data = request.get_json()
        if not data or 'input' not in data:
            return jsonify({"error": "Missing 'input' field"}), 400
            
        input_text = data['input']
        
        # Parse and refang the IoCs
        iocs = parse_ioc_input(input_text)
        
        # Detect the type of each IoC
        result = []
        for ioc in iocs:
            ioc_type = detect_ioc_type(ioc)
            result.append({
                "value": ioc,
                "type": ioc_type.name.lower(),
                "type_name": get_ioc_type_name(ioc_type)
            })
            
        return jsonify({"iocs": result})
    
    @app.route('/api/reports/<int:report_id>/iocs', methods=['POST'])
    def add_iocs_to_report(report_id):
        """
        Add IoCs to an existing report.
        
        Expects a JSON object with either a raw text input or a list of IoC objects:
        {
            "input": "example.com, 192.168.1.1",
            "description": "Optional default description for all IoCs"
        }
        OR
        {
            "iocs": [
                {
                    "type": "domain",
                    "value": "example.com",
                    "description": "Example domain"
                },
                {
                    "type": "ip_address",
                    "value": "192.168.1.1",
                    "description": "Example IP"
                }
            ],
            "check_duplicates": true
        }
        """
        report = Report.query.get(report_id)
        if not report:
            return jsonify({"error": "Report not found"}), 404
            
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        default_description = data.get('description', '')
        check_duplicates = data.get('check_duplicates', False)
        
        # Process raw input if provided
        if 'input' in data:
            input_text = data['input']
            iocs_raw = parse_ioc_input(input_text)
            
            # Convert to structured IoC data with detected types
            iocs_data = []
            for ioc in iocs_raw:
                ioc_type = detect_ioc_type(ioc)
                iocs_data.append({
                    "type": ioc_type.name.lower(),
                    "value": ioc,
                    "description": default_description
                })
        # Otherwise use provided IoC data list directly
        elif 'iocs' in data and isinstance(data['iocs'], list):
            iocs_data = data['iocs']
        else:
            return jsonify({"error": "Missing 'input' or 'iocs' field"}), 400
            
        # Check for duplicates across all reports if requested
        duplicates_info = None
        if check_duplicates:
            duplicates_info = Report.find_duplicate_iocs(iocs_data)
            
        # Add the IoCs to the report
        result = report.add_iocs_batch(iocs_data)
        db.session.commit()
        
        response = {
            "added": result['added'],
            "skipped": result['skipped'],
            "message": f"Added {len(result['added'])} IoCs, skipped {len(result['skipped'])} duplicates",
        }
        
        if duplicates_info and duplicates_info['duplicates']:
            response["duplicates_in_other_reports"] = duplicates_info
            
        return jsonify(response)
    
    @app.route('/api/reports/<int:report_id>/iocs/<ioc_value>', methods=['DELETE'])
    def remove_ioc_from_report(report_id, ioc_value):
        """
        Remove an IoC from a report based on its value.
        """
        report = Report.query.get(report_id)
        if not report:
            return jsonify({"error": "Report not found"}), 404
            
        current_iocs = report.get_iocs()
        # Find IoC by value (case-insensitive match)
        for i, ioc in enumerate(current_iocs):
            if ioc.get('value', '').lower() == ioc_value.lower():
                # Remove the IoC
                removed_ioc = current_iocs.pop(i)
                report.set_iocs(current_iocs)
                db.session.commit()
                return jsonify({
                    "message": f"IoC '{ioc_value}' removed from report",
                    "removed_ioc": removed_ioc
                })
                
        return jsonify({"error": f"IoC '{ioc_value}' not found in report"}), 404
    
    @app.route('/api/iocs/check_duplicates', methods=['POST'])
    def check_ioc_duplicates():
        """
        Check if IoCs already exist in the database.
        
        Expects a JSON object with either a raw text input or a list of IoC objects:
        {
            "input": "example.com, 192.168.1.1"
        }
        OR
        {
            "iocs": [
                {
                    "type": "domain",
                    "value": "example.com",
                    "description": "Example domain"
                },
                {
                    "type": "ip_address",
                    "value": "192.168.1.1",
                    "description": "Example IP"
                }
            ]
        }
        """
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        # Process raw input if provided
        if 'input' in data:
            input_text = data['input']
            iocs_raw = parse_ioc_input(input_text)
            
            # Convert to structured IoC data with detected types
            iocs_data = []
            for ioc in iocs_raw:
                ioc_type = detect_ioc_type(ioc)
                iocs_data.append({
                    "type": ioc_type.name.lower(),
                    "value": ioc,
                    "description": ""
                })
        # Otherwise use provided IoC data list directly
        elif 'iocs' in data and isinstance(data['iocs'], list):
            iocs_data = data['iocs']
        else:
            return jsonify({"error": "Missing 'input' or 'iocs' field"}), 400
            
        # Check for duplicates
        duplicates_info = Report.find_duplicate_iocs(iocs_data)
        
        return jsonify(duplicates_info)
    
    # HUNTING QUERIES ENDPOINTS
    
    @app.route('/api/hunting_queries', methods=['GET'])
    def get_all_hunting_queries():
        """Get all hunting queries from database"""
        queries = HuntingQuery.query.all()
        return jsonify({"hunting_queries": [query.to_dict() for query in queries]})
    
    @app.route('/api/hunting_queries/<int:query_id>', methods=['GET'])
    def get_hunting_query(query_id):
        """Get a specific hunting query by ID"""
        query = HuntingQuery.query.get(query_id)
        if query:
            return jsonify({"hunting_query": query.to_dict()})
        return jsonify({"error": "Hunting query not found"}), 404
    
    @app.route('/api/hunting_queries/<int:query_id>', methods=['DELETE'])
    def delete_hunting_query(query_id):
        """Delete a hunting query"""
        query = HuntingQuery.query.get(query_id)
        if not query:
            return jsonify({"error": "Hunting query not found"}), 404
            
        db.session.delete(query)
        db.session.commit()
        return jsonify({"message": "Hunting query deleted successfully"})
    
    @app.route('/api/iocs/<string:ioc_value>/hunting_queries', methods=['GET'])
    def get_ioc_hunting_queries(ioc_value):
        """Get all hunting queries for a specific IoC value"""
        queries = HuntingQuery.find_by_ioc_value(ioc_value)
        return jsonify({"hunting_queries": [query.to_dict() for query in queries]})
    
    @app.route('/api/iocs/<string:ioc_value>/generate_query', methods=['POST'])
    def generate_ioc_hunting_query(ioc_value):
        """
        Generate a hunting query for a specific IoC and save it to the database.
        
        Expects a JSON object with the following format:
        {
            "query_name": "My Custom Query",  # Optional, generated if not provided
            "description": "Query description",  # Optional
            "time_range": "ago(7d)",  # Optional, defaults to 7 days
            "limit": 100,  # Optional, defaults to 100
            "ioc_type": "domain"  # Required, the type of IoC
        }
        """
        data = request.get_json() or {}
        
        # Validate IoC type
        ioc_type = data.get('ioc_type')
        if not ioc_type:
            return jsonify({"error": "Missing required field: ioc_type"}), 400
        
        # Extract parameters
        query_name = data.get('query_name', f"Hunting Query for {ioc_type} '{ioc_value}' - {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}")
        description = data.get('description', f"Automatically generated hunting query for {ioc_type} IoC: {ioc_value}")
        time_range = data.get('time_range', 'ago(7d)')
        limit = data.get('limit', 100)
        
        # Generate query for the IoC
        query_text = generate_query(ioc_value, time_range=time_range, limit=limit)
        
        if not query_text:
            return jsonify({"error": f"Failed to generate query for IoC: {ioc_value}"}), 400
        
        # Save the query to the database
        # Serialize dictionary to JSON string for SQLite compatibility
        serialized_query_text = json.dumps(query_text) if isinstance(query_text, dict) else query_text
        
        new_query = HuntingQuery(
            name=query_name,
            description=description,
            query_type='kql',
            query_text=serialized_query_text,
            ioc_value=ioc_value,
            ioc_type=ioc_type,
            iocs=[{
                "type": ioc_type,
                "value": ioc_value
            }]
        )
        
        db.session.add(new_query)
        db.session.commit()
        
        return jsonify({
            "hunting_query": new_query.to_dict(),
            "message": "Hunting query generated and saved successfully"
        })
    
    @app.route('/api/iocs/generate_queries', methods=['POST'])
    def generate_hunting_queries():
        """
        Generate hunting queries for provided IoCs and optionally save them.
        
        Expects a JSON object with the following format:
        {
            "iocs": [
                {
                    "type": "domain",
                    "value": "example.com",
                    "description": "Example domain"
                },
                ...
            ],
            "query_name": "My Custom Query",  # Optional, generated if not provided
            "description": "Query description",  # Optional
            "time_range": "ago(7d)",  # Optional, defaults to 7 days
            "limit": 100,  # Optional, defaults to 100
            "save": true,  # Optional, whether to save the query to the database
            "report_id": 1,  # Optional, link to a report
            "generate_individual_queries": false  # Optional, whether to generate a separate query for each IoC
        }
        
        Returns the generated queries and, if saved, the saved query object.
        """
        data = request.get_json()
        if not data or 'iocs' not in data or not isinstance(data['iocs'], list):
            return jsonify({"error": "Missing or invalid 'iocs' field"}), 400
            
        # Extract parameters
        iocs_data = data['iocs']
        query_name = data.get('query_name', f"Hunting Query {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}")
        description = data.get('description', 'Generated hunting query')
        time_range = data.get('time_range', 'ago(7d)')
        limit = data.get('limit', 100)
        save_query = data.get('save', False)
        report_id = data.get('report_id')
        generate_individual = data.get('generate_individual_queries', False)
        
        # Validate report_id if provided
        if report_id:
            report = Report.query.get(report_id)
            if not report:
                return jsonify({"error": f"Report with ID {report_id} not found"}), 404
        
        # Extract IoC values
        ioc_values = [ioc['value'] for ioc in iocs_data]
        
        # Generate individual queries for each IoC if requested
        saved_queries = []
        individual_queries = {}
        
        if generate_individual:
            for ioc in iocs_data:
                ioc_value = ioc['value']
                ioc_type = ioc['type']
                
                # Generate and potentially save a query for this specific IoC
                ioc_query = generate_query(ioc_value, time_range=time_range, limit=limit)
                
                if ioc_query:
                    individual_queries[ioc_value] = ioc_query
                    
                    if save_query:
                        ioc_query_name = f"Query for {ioc_type} '{ioc_value}'"
                        ioc_query_desc = f"Hunting query for {ioc_type} IoC: {ioc_value}"
                        
                        # Serialize dictionary to JSON string for SQLite compatibility
                        serialized_query_text = json.dumps(ioc_query) if isinstance(ioc_query, dict) else ioc_query
                        
                        new_query = HuntingQuery(
                            name=ioc_query_name,
                            description=ioc_query_desc,
                            query_type='kql',
                            query_text=serialized_query_text,
                            ioc_value=ioc_value,
                            ioc_type=ioc_type,
                            iocs=[ioc],
                            report_id=report_id
                        )
                        
                        db.session.add(new_query)
                        saved_queries.append(new_query)
        
        # Generate union query for all IoCs
        query_results = generate_union_query(ioc_values, time_range=time_range, limit=limit)
        
        # Save the union query if requested and not generating individual queries
        saved_union_query = None
        if save_query and not generate_individual:
            # Find the "best" query to save
            if query_results:
                first_query_key = list(query_results.keys())[0]
                query_text = query_results[first_query_key]
                
                # Serialize dictionary to JSON string for SQLite compatibility
                serialized_query_text = json.dumps(query_text) if isinstance(query_text, dict) else query_text
                
                new_query = HuntingQuery(
                    name=query_name,
                    description=description,
                    query_type='kql',
                    query_text=serialized_query_text,
                    iocs=iocs_data,
                    report_id=report_id
                )
                
                db.session.add(new_query)
                saved_union_query = new_query
                
        # Commit all changes to the database
        if save_query:
            db.session.commit()
        
        # Prepare the response
        response = {
            "hunting_queries": query_results,
            "message": "Query generated successfully" + (" and saved" if save_query else ""),
            "iocs_processed": ioc_values
        }
        
        # Add saved queries information to the response if any were saved
        if saved_union_query:
            response["saved_query"] = saved_union_query.to_dict()
            
        if saved_queries:
            response["saved_individual_queries"] = [query.to_dict() for query in saved_queries]
            
        if individual_queries:
            response["individual_queries"] = individual_queries
        
        return jsonify(response)
    
    @app.route('/api/reports/<int:report_id>/generate_queries', methods=['POST'])
    def generate_queries_for_report(report_id):
        """
        Generate hunting queries for IoCs in a specific report.
        
        Expects a JSON object with the following format:
        {
            "ioc_ids": [1, 2, 3],  # Optional, IDs of IoCs to include (if not specified, use all)
            "query_name": "My Custom Query",  # Optional, generated if not provided
            "description": "Query description",  # Optional
            "time_range": "ago(7d)",  # Optional, defaults to 7 days
            "limit": 100,  # Optional, defaults to 100
            "save": true,  # Optional, whether to save the query to the database
            "generate_individual_queries": false  # Optional, whether to generate a separate query for each IoC
        }
        """
        report = Report.query.get(report_id)
        if not report:
            return jsonify({"error": "Report not found"}), 404
            
        data = request.get_json() or {}
        
        # Get IoCs from the report
        all_iocs = report.get_iocs()
        if not all_iocs:
            return jsonify({"error": "No IoCs found in the report"}), 400
            
        # Filter IoCs if specific IDs were provided
        ioc_ids = data.get('ioc_ids', [])
        if ioc_ids:
            # In the sample data, IoCs don't have IDs, so we'll filter by their index
            # In a real application, you might want to implement proper IoC IDs
            selected_iocs = [ioc for i, ioc in enumerate(all_iocs) if i in ioc_ids]
        else:
            selected_iocs = all_iocs
            
        if not selected_iocs:
            return jsonify({"error": "No matching IoCs found"}), 400
            
        # Prepare parameters for query generation
        query_name = data.get('query_name', f"Report {report_id} - {report.name} - {datetime.utcnow().strftime('%Y-%m-%d')}")
        description = data.get('description', f"Hunting query for IoCs from report: {report.name}")
        time_range = data.get('time_range', 'ago(7d)')
        limit = data.get('limit', 100)
        save_query = data.get('save', False)
        generate_individual = data.get('generate_individual_queries', False)
        
        # Extract IoC values
        ioc_values = [ioc['value'] for ioc in selected_iocs]
        
        # Generate individual queries for each IoC if requested
        saved_queries = []
        individual_queries = {}
        
        if generate_individual:
            for ioc in selected_iocs:
                ioc_value = ioc['value']
                ioc_type = ioc['type']
                
                # Generate and potentially save a query for this specific IoC
                ioc_query = generate_query(ioc_value, time_range=time_range, limit=limit)
                
                if ioc_query:
                    individual_queries[ioc_value] = ioc_query
                    
                    if save_query:
                        ioc_query_name = f"Report {report_id} - {ioc_type} '{ioc_value}'"
                        ioc_query_desc = f"Hunting query for {ioc_type} IoC: {ioc_value} from report: {report.name}"
                        
                        # Serialize dictionary to JSON string for SQLite compatibility
                        serialized_query_text = json.dumps(ioc_query) if isinstance(ioc_query, dict) else ioc_query
                        
                        new_query = HuntingQuery(
                            name=ioc_query_name,
                            description=ioc_query_desc,
                            query_type='kql',
                            query_text=serialized_query_text,
                            ioc_value=ioc_value,
                            ioc_type=ioc_type,
                            iocs=[ioc],
                            report_id=report_id
                        )
                        
                        db.session.add(new_query)
                        saved_queries.append(new_query)
        
        # Generate union query for all IoCs
        query_results = generate_union_query(ioc_values, time_range=time_range, limit=limit)
        
        # Save the union query if requested and not generating individual queries
        saved_union_query = None
        if save_query and not generate_individual and query_results:
            # Save the first query as a sample
            first_query_key = list(query_results.keys())[0]
            query_text = query_results[first_query_key]
            
            # Serialize dictionary to JSON string for SQLite compatibility
            serialized_query_text = json.dumps(query_text) if isinstance(query_text, dict) else query_text
            
            new_query = HuntingQuery(
                name=query_name,
                description=description,
                query_type='kql',
                query_text=serialized_query_text,
                iocs=selected_iocs,
                report_id=report_id
            )
            
            db.session.add(new_query)
            saved_union_query = new_query
            
        # Commit all changes to the database
        if save_query:
            db.session.commit()
        
        # Prepare the response
        response = {
            "hunting_queries": query_results,
            "message": "Query generated successfully" + (" and saved" if save_query else ""),
            "iocs_processed": ioc_values
        }
        
        # Add saved queries information to the response if any were saved
        if saved_union_query:
            response["saved_query"] = saved_union_query.to_dict()
            
        if saved_queries:
            response["saved_individual_queries"] = [query.to_dict() for query in saved_queries]
            
        if individual_queries:
            response["individual_queries"] = individual_queries
            
        return jsonify(response)
    
    @app.route('/api/reports/<int:report_id>/hunting_queries', methods=['GET'])
    def get_report_hunting_queries(report_id):
        """Get all hunting queries associated with a specific report"""
        report = Report.query.get(report_id)
        if not report:
            return jsonify({"error": "Report not found"}), 404
            
        queries = HuntingQuery.query.filter_by(report_id=report_id).all()
        return jsonify({"hunting_queries": [query.to_dict() for query in queries]})
    
    return app

# Create the application instance
app = create_app()

if __name__ == '__main__':
    # Bind to 0.0.0.0 to make the app accessible outside the container
    app.run(debug=True, host='0.0.0.0', port=5000)
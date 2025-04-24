from flask import Blueprint, jsonify, request
from models import db, Report

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
from flask import Blueprint, jsonify, request
from models import db, Report
from utils.ioc.defang import parse_ioc_input, refang
from utils.ioc.detector import detect_ioc_type, get_ioc_type_name

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

@iocs_bp.route('/api/reports/<int:report_id>/iocs', methods=['POST'])
def add_iocs_to_report(report_id):
    """Add IoCs to an existing report."""
    report = Report.query.get(report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    default_description = data.get('description', '')
    check_duplicates = data.get('check_duplicates', False)

    if 'input' in data:
        input_text = data['input']
        iocs_raw = parse_ioc_input(input_text)
        iocs_data = []
        for ioc in iocs_raw:
            ioc_type = detect_ioc_type(ioc)
            iocs_data.append({
                "type": ioc_type.name.lower(),
                "value": ioc,
                "description": default_description
            })
    elif 'iocs' in data and isinstance(data['iocs'], list):
        iocs_data = data['iocs']
    else:
        return jsonify({"error": "Missing 'input' or 'iocs' field"}), 400

    duplicates_info = None
    if check_duplicates:
        duplicates_info = Report.find_duplicate_iocs(iocs_data)

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

@iocs_bp.route('/api/reports/<int:report_id>/iocs/<ioc_value>', methods=['DELETE'])
def remove_ioc_from_report(report_id, ioc_value):
    """Remove an IoC from a report based on its value."""
    report = Report.query.get(report_id)
    if not report:
        return jsonify({"error": "Report not found"}), 404

    current_iocs = report.get_iocs()
    for i, ioc in enumerate(current_iocs):
        if ioc.get('value', '').lower() == ioc_value.lower():
            removed_ioc = current_iocs.pop(i)
            report.set_iocs(current_iocs)
            db.session.commit()
            return jsonify({
                "message": f"IoC '{ioc_value}' removed from report",
                "removed_ioc": removed_ioc
            })

    return jsonify({"error": f"IoC '{ioc_value}' not found in report"}), 404

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
        for ioc in iocs_raw:
            ioc_type = detect_ioc_type(ioc)
            iocs_data.append({
                "type": ioc_type.name.lower(),
                "value": ioc,
                "description": ""
            })
    elif 'iocs' in data and isinstance(data['iocs'], list):
        iocs_data = data['iocs']
    else:
        return jsonify({"error": "Missing 'input' or 'iocs' field"}), 400

    duplicates_info = Report.find_duplicate_iocs(iocs_data)

    return jsonify(duplicates_info)
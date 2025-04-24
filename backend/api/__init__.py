"""
API package initialization.
"""
from flask import Blueprint

# Import blueprints
from .iocs.routes import iocs_bp
from .reports.routes import reports_bp
from .hunting_queries import hunting_queries_bp

# Create main API blueprint
api_bp = Blueprint('api', __name__)

# Register blueprints
api_bp.register_blueprint(iocs_bp)
api_bp.register_blueprint(reports_bp)
api_bp.register_blueprint(hunting_queries_bp)

# Function to register API with the app
def register_api(app):
    app.register_blueprint(api_bp)
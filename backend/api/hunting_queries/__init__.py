"""
Hunting Queries API module.
"""
from flask import Blueprint

# Create blueprint for hunting queries
hunting_queries_bp = Blueprint('hunting_queries', __name__)

# Import routes at the end to avoid circular imports
from . import routes
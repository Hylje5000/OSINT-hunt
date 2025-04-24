from flask import Flask
from flask_cors import CORS
from config import Config
from models import db
from seed_data import create_example_data
from api import register_api

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app)
    db.init_app(app)

    if not app.config.get('TESTING', False):
        with app.app_context():
            db.create_all()
            create_example_data()

    # Register all API routes using our central registration function
    register_api(app)

    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
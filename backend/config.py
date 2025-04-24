import os
from dotenv import load_dotenv

load_dotenv()

basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    """Base configuration class"""
    # Security
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-for-development-only'
    
    # SQLAlchemy
    DB_USERNAME = os.environ.get('DB_USERNAME', 'miska')
    DB_PASSWORD = os.environ.get('DB_KEY', 'postgres')
    DB_HOST = os.environ.get('DB_HOST', 'db')  # Changed to 'db' for Docker service name
    DB_PORT = os.environ.get('DB_PORT', '5432')
    DB_NAME = os.environ.get('DB_NAME', 'osinthunt')
    
    SQLALCHEMY_DATABASE_URI = f'postgresql://{DB_USERNAME}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # API Configuration
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
    
    # Debugging
    DEBUG = True

class TestConfig(Config):
    """Test configuration - uses an in-memory SQLite database"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    DEBUG = False
    WTF_CSRF_ENABLED = False  # Disable CSRF protection in tests
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json
from typing import List, Dict, Any, Optional

# Initialize SQLAlchemy instance
db = SQLAlchemy()

# Base model class with common fields
class BaseModel(db.Model):
    __abstract__ = True
    
    id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# IoC model for storing individual Indicators of Compromise
class IoC(BaseModel):
    __tablename__ = 'iocs'
    
    value = db.Column(db.String(255), nullable=False, index=True)
    type = db.Column(db.String(50), nullable=False, index=True)  # ip, domain, hash, etc.
    description = db.Column(db.Text, nullable=True)
    source = db.Column(db.String(255), nullable=True)
    confidence = db.Column(db.Integer, nullable=True)  # Optional confidence score
    
    # Relationship with HuntingQueries
    hunting_queries = db.relationship('HuntingQuery', backref='ioc', lazy='dynamic')
    
    def __repr__(self):
        return f'<IoC {self.type}:{self.value}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'value': self.value,
            'type': self.type,
            'description': self.description,
            'source': self.source,
            'confidence': self.confidence,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def find_by_value(cls, value):
        """Find IoC by its value"""
        return cls.query.filter_by(value=value).first()
    
    @classmethod
    def find_by_type(cls, ioc_type):
        """Find IoCs by their type"""
        return cls.query.filter_by(type=ioc_type).all()

# Report model for storing threat intelligence reports (not currently used)
class Report(BaseModel):
    __tablename__ = 'reports'
    
    name = db.Column(db.String(255), nullable=False)
    source = db.Column(db.String(255), nullable=True)  # Source/creator of the report
    sigma_rule = db.Column(db.Text, nullable=True)  # Sigma rule as text
    
    # Add a relationship to IoCs
    iocs = db.relationship('IoC', secondary='report_iocs', backref=db.backref('reports', lazy='dynamic'))
    
    def __repr__(self):
        return f'<Report {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'source': self.source,
            'sigma_rule': self.sigma_rule,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def set_iocs(self, iocs_data):
        """Add IoCs to this report
        
        Args:
            iocs_data: List of IoC data dictionaries with type, value, and optional description
        """
        for ioc_data in iocs_data:
            ioc = IoC.query.filter_by(value=ioc_data['value'], type=ioc_data['type']).first()
            
            if not ioc:
                # Create new IoC if it doesn't exist
                ioc = IoC(
                    value=ioc_data['value'],
                    type=ioc_data['type'],
                    description=ioc_data.get('description')
                )
                db.session.add(ioc)
            
            # Add to this report if not already associated
            if ioc not in self.iocs:
                self.iocs.append(ioc)
        
        db.session.commit()
        return self.iocs

# Association table for Report-IoC many-to-many relationship
report_iocs = db.Table('report_iocs',
    db.Column('report_id', db.Integer, db.ForeignKey('reports.id'), primary_key=True),
    db.Column('ioc_id', db.Integer, db.ForeignKey('iocs.id'), primary_key=True)
)

# Hunting Query model for storing generated KQL queries
class HuntingQuery(BaseModel):
    __tablename__ = 'hunting_queries'
    
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    query_type = db.Column(db.String(50), nullable=False)  # e.g., 'kql', 'sigma', etc.
    query_text = db.Column(db.Text, nullable=False)  # The actual query content
    
    # Foreign key to IoC model
    ioc_id = db.Column(db.Integer, db.ForeignKey('iocs.id'), nullable=False)
    
    # Foreign key to Report model (optional)
    report_id = db.Column(db.Integer, db.ForeignKey('reports.id'), nullable=True)
    
    # Store IoC value and type directly for easier access and testing
    ioc_value = db.Column(db.String(255), nullable=True)
    ioc_type = db.Column(db.String(50), nullable=True)
    
    def __repr__(self):
        return f'<HuntingQuery {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'query_type': self.query_type,
            'query_text': self.query_text,
            'ioc_id': self.ioc_id,
            'ioc_value': self.ioc_value,
            'ioc_type': self.ioc_type,
            'report_id': self.report_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def find_by_ioc_id(cls, ioc_id):
        """Find hunting queries by IoC ID"""
        return cls.query.filter_by(ioc_id=ioc_id).all()
        
    @classmethod
    def find_by_ioc_value(cls, value):
        """Find hunting queries by IoC value"""
        return cls.query.filter_by(ioc_value=value).all()
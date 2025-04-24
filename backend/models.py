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

# Example model - you can modify or create additional models as needed
class Item(BaseModel):
    __tablename__ = 'items'
    
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    
    def __repr__(self):
        return f'<Item {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# Report model for storing threat intelligence reports
class Report(BaseModel):
    __tablename__ = 'reports'
    
    name = db.Column(db.String(255), nullable=False)
    source = db.Column(db.String(255), nullable=True)  # Source/creator of the report
    iocs = db.Column(db.JSON, nullable=True)  # List of IOCs stored as JSON
    sigma_rule = db.Column(db.Text, nullable=True)  # Sigma rule as text
    
    def __repr__(self):
        return f'<Report {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'source': self.source,
            'iocs': self.iocs,
            'sigma_rule': self.sigma_rule,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    # Helper methods for IOCs list
    def set_iocs(self, iocs_list):
        """Set IOCs from a Python list"""
        self.iocs = iocs_list
    
    def get_iocs(self):
        """Get IOCs as a Python list"""
        return self.iocs if self.iocs else []
    
    def add_ioc(self, ioc_data: Dict[str, Any]) -> bool:
        """
        Add a single IoC to the report if it doesn't already exist.
        
        Args:
            ioc_data: Dictionary containing IoC data (type, value, description)
            
        Returns:
            Boolean indicating if the IoC was added (True) or already existed (False)
        """
        current_iocs = self.get_iocs()
        
        # Check if this IoC already exists in the report
        for existing_ioc in current_iocs:
            if (existing_ioc.get('type') == ioc_data.get('type') and 
                existing_ioc.get('value') == ioc_data.get('value')):
                return False  # IoC already exists
        
        # Add the new IoC and update the report
        current_iocs.append(ioc_data)
        self.set_iocs(current_iocs)
        return True  # IoC was added
    
    def add_iocs_batch(self, iocs_data: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
        """
        Add multiple IoCs to the report, skipping any that already exist.
        
        Args:
            iocs_data: List of dictionaries containing IoC data (type, value, description)
            
        Returns:
            Dictionary with lists of added and skipped IoCs
        """
        added_iocs = []
        skipped_iocs = []
        
        for ioc_data in iocs_data:
            was_added = self.add_ioc(ioc_data)
            if was_added:
                added_iocs.append(ioc_data)
            else:
                skipped_iocs.append(ioc_data)
        
        return {
            'added': added_iocs,
            'skipped': skipped_iocs
        }

    @classmethod
    def find_duplicate_iocs(cls, iocs_data: List[Dict[str, Any]]) -> Dict[str, List[Dict]]:
        """
        Find IoCs that already exist in any report in the database.
        
        Args:
            iocs_data: List of dictionaries containing IoC data (type, value, description)
            
        Returns:
            Dictionary with lists of duplicate IoCs and the reports they appear in
        """
        # This is a simple implementation - for large datasets, 
        # you might want to optimize with direct SQL queries
        results = {'duplicates': []}
        all_reports = cls.query.all()
        
        for ioc_data in iocs_data:
            ioc_type = ioc_data.get('type')
            ioc_value = ioc_data.get('value')
            
            duplicates = []
            for report in all_reports:
                for existing_ioc in report.get_iocs():
                    if (existing_ioc.get('type') == ioc_type and 
                        existing_ioc.get('value') == ioc_value):
                        duplicates.append({
                            'report_id': report.id,
                            'report_name': report.name,
                            'ioc': existing_ioc
                        })
            
            if duplicates:
                results['duplicates'].append({
                    'ioc': ioc_data,
                    'found_in': duplicates
                })
                
        return results


# Hunting Query model for storing generated KQL queries
class HuntingQuery(BaseModel):
    __tablename__ = 'hunting_queries'
    
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, nullable=True)
    query_type = db.Column(db.String(50), nullable=False)  # e.g., 'kql', 'sigma', etc.
    query_text = db.Column(db.Text, nullable=False)  # The actual query content
    iocs = db.Column(db.JSON, nullable=True)  # List of IoCs used to generate this query
    ioc_value = db.Column(db.String(255), nullable=True)  # The specific IoC value this query is for
    ioc_type = db.Column(db.String(50), nullable=True)  # The type of the IoC
    report_id = db.Column(db.Integer, db.ForeignKey('reports.id'), nullable=True)  # Optional link to a report
    
    def __repr__(self):
        return f'<HuntingQuery {self.name}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'query_type': self.query_type,
            'query_text': self.query_text,
            'iocs': self.iocs,
            'ioc_value': self.ioc_value,
            'ioc_type': self.ioc_type,
            'report_id': self.report_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    @classmethod
    def find_by_ioc_value(cls, ioc_value):
        """Find hunting queries by IoC value"""
        return cls.query.filter_by(ioc_value=ioc_value).all()
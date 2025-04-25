from models import db, Report, IoC, HuntingQuery
from utils.kql.query_generator import generate_query
from utils.ioc.detector import IoC_Type

def create_example_data():
    """Create example data if the database is empty"""
    # Check if any IoCs exist
    if IoC.query.count() == 0:
        print("Adding example IoCs to the database...")
        
        # Create example IoCs
        iocs = [
            # APT29 IoCs
            IoC(
                value="malicious-domain.example.com",
                type="domain",
                description="C2 server used in APT29 campaign",
                source="MITRE ATT&CK",
                confidence=80
            ),
            IoC(
                value="phishing@example.net",
                type="email",
                description="Sender email from APT29 phishing campaign",
                source="MITRE ATT&CK",
                confidence=85
            ),
            IoC(
                value="e5841df2166dd424a54a3a5e7f4aaaf15a966f0459e1875571388dece18ff921",
                type="hash",
                description="SHA-256 of malicious attachment in APT29 campaign",
                source="MITRE ATT&CK",
                confidence=90
            ),
            
            # LockBit IoCs
            IoC(
                value="192.168.1.100",
                type="ip",
                description="Exfiltration server for LockBit ransomware",
                source="Security Research Team",
                confidence=75
            ),
            IoC(
                value="a93ee7ea13238bd038bcbf635e9f9d3933e3856a724a9e3dc9865eab3930b2c2",
                type="hash",
                description="SHA-256 of LockBit ransomware executable",
                source="Security Research Team",
                confidence=95
            ),
            IoC(
                value="LockBit_Ransom.exe",
                type="filename",
                description="Malicious executable for LockBit ransomware",
                source="Security Research Team",
                confidence=70
            ),
            
            # SolarWinds IoCs
            IoC(
                value="avsvmcloud.com",
                type="domain",
                description="C2 infrastructure for SolarWinds compromise",
                source="US-CERT",
                confidence=85
            ),
            IoC(
                value="20.140.0.1",
                type="ip",
                description="C2 server IP for SolarWinds compromise",
                source="US-CERT",
                confidence=80
            ),
            IoC(
                value="ce77d116a074dab7a22a0fd4f2c1ab475f16eec42e1ded3c0b0aa8211fe858d6",
                type="hash",
                description="SHA-256 of backdoored DLL in SolarWinds compromise",
                source="US-CERT",
                confidence=90
            )
        ]
        
        # Add all IoCs to the database
        db.session.add_all(iocs)
        db.session.flush()  # Flush to get the IDs assigned
        
        # Generate hunting queries for each IoC
        print("Generating hunting queries for example IoCs...")
        queries = []
        
        for ioc in iocs:
            try:
                # Determine IoC type for query generation
                try:
                    ioc_type = IoC_Type[ioc.type.upper()]
                except (KeyError, AttributeError):
                    # Skip if we can't determine the type
                    continue
                
                # Generate query for this IoC
                query_dict = generate_query(ioc.value, ioc_type)
                
                # Combine all the generated queries into a single text
                query_text = ""
                for table_name, table_query in query_dict.items():
                    query_text += f"// Table: {table_name}\n{table_query}\n\n"
                
                # Create a new hunting query
                hunting_query = HuntingQuery(
                    name=f"Example Query for {ioc.type} {ioc.value}",
                    description=f"Automatically generated hunting query for {ioc.type}: {ioc.value}",
                    query_type="kql",
                    query_text=query_text,
                    ioc_id=ioc.id
                )
                
                queries.append(hunting_query)
            except Exception as e:
                print(f"Error generating query for {ioc.value}: {str(e)}")
        
        # Add all queries to the database
        db.session.add_all(queries)
        
        # Add example Report (not used in current implementation)
        if Report.query.count() == 0:
            print("Adding example Report to the database (not used in current implementation)...")
            report = Report(
                name="APT29 Phishing Campaign",
                source="MITRE ATT&CK",
                sigma_rule="""
title: APT29 Phishing Campaign Indicators
id: APT29-2023-001
status: experimental
description: Detects indicators associated with APT29 phishing campaign
references:
  - https://attack.mitre.org/groups/G0016/
author: OSINT Hunt
date: 2023/10/15
logsource:
  product: windows
  service: sysmon
detection:
  selection:
    EventID: 1
    Image|endswith: '\\powershell.exe'
    CommandLine|contains: 'Invoke-WebRequest'
  condition: selection
level: high
                """
            )
            db.session.add(report)
        
        # Commit all changes
        db.session.commit()
        print("Database seeding complete.")
    else:
        print("Database already contains data, skipping seed.")
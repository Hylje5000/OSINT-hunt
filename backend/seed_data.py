from models import db, Report

def create_example_data():
    """Create example reports data if the database is empty"""
    # Check if any reports exist
    if Report.query.count() == 0:
        # Example Report 1: Malware Campaign
        report1 = Report(
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
        report1.set_iocs([
            {"type": "domain", "value": "malicious-domain.example.com", "description": "C2 server"},
            {"type": "email", "value": "phishing@example.net", "description": "Sender email"},
            {"type": "hash", "value": "e5841df2166dd424a54a3a5e7f4aaaf15a966f0459e1875571388dece18ff921", "description": "SHA-256 of malicious attachment"}
        ])
        
        # Example Report 2: Ransomware Threat
        report2 = Report(
            name="LockBit Ransomware Analysis",
            source="Security Research Team",
            sigma_rule="""
title: LockBit Ransomware Activity
id: LOCKBIT-2023-01
status: experimental
description: Detects indicators of LockBit ransomware activity
references:
  - https://www.example.com/threat-analysis/lockbit
author: OSINT Hunt
date: 2023/09/23
logsource:
  product: windows
  service: sysmon
detection:
  selection:
    EventID: 11
    TargetFilename|endswith: 
      - '.lockbit'
      - 'README.txt'
  condition: selection
level: critical
            """
        )
        report2.set_iocs([
            {"type": "ip", "value": "192.168.1.100", "description": "Exfiltration server"},
            {"type": "hash", "value": "a93ee7ea13238bd038bcbf635e9f9d3933e3856a724a9e3dc9865eab3930b2c2", "description": "SHA-256 of ransomware executable"},
            {"type": "filename", "value": "LockBit_Ransom.exe", "description": "Malicious executable"},
            {"type": "registry", "value": "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run\\LockBit", "description": "Persistence mechanism"}
        ])
        
        # Example Report 3: Supply Chain Attack
        report3 = Report(
            name="SolarWinds Supply Chain Compromise",
            source="US-CERT",
            sigma_rule="""
title: SolarWinds Supply Chain Compromise
id: SUPPLY-CHAIN-2023-01
status: experimental
description: Detects IOCs related to the SolarWinds supply chain compromise
references:
  - https://www.example.com/advisory/supply-chain
author: OSINT Hunt
date: 2023/11/05
logsource:
  product: windows
  service: sysmon
detection:
  selection:
    EventID: 3
    DestinationHostname|endswith:
      - 'avsvmcloud.com'
      - 'freescanonline.com'
  condition: selection
level: critical
            """
        )
        report3.set_iocs([
            {"type": "domain", "value": "avsvmcloud.com", "description": "C2 infrastructure"},
            {"type": "ip", "value": "20.140.0.1", "description": "C2 server IP"},
            {"type": "hash", "value": "ce77d116a074dab7a22a0fd4f2c1ab475f16eec42e1ded3c0b0aa8211fe858d6", "description": "SHA-256 of backdoored DLL"},
            {"type": "url", "value": "https://downloads.example.org/solarwinds/update.php", "description": "Malicious download URL"}
        ])
        
        # Add all reports to the database
        db.session.add_all([report1, report2, report3])
        db.session.commit()
        print("Added example reports to the database.")
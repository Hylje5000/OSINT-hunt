# OSINT-Hunt

A comprehensive platform for collecting, analyzing, and generating hunting queries from cyber threat intelligence indicators.

![OSINT-Hunt Platform](https://img.shields.io/badge/Platform-OSINT--Hunt-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Overview

OSINT-Hunt is a web-based platform designed to help security analysts and threat hunters manage Indicators of Compromise (IoCs) from various intelligence sources, automatically generate Kusto Query Language (KQL) hunting queries, and streamline the threat hunting process.  
**heavily vibe-coded, sue me**


## Technology Stack

### Backend
- Python 3.10+
- Flask RESTful API
- SQLAlchemy ORM
- PostgreSQL database

### Frontend
- React 19
- TypeScript
- Tailwind CSS
- Shadcn UI components

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Node.js 20+ (for local development)
- Python 3.10+ (for local development)

### Installation with Docker

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/OSINT-Hunt.git
   cd OSINT-Hunt
   ```

2. Start the application using Docker Compose:
   ```bash
   docker compose up -d
   ```

3. Access the application at http://localhost:3000

### Manual Installation

#### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Run the Flask application:
   ```bash
   flask run
   ```

#### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Usage

### Working with IoCs

1. Add IoCs through the reports interface
2. View and manage all IoCs in the IoCs tab
3. Generate hunting queries for selected IoCs
4. Copy and use the generated queries in your SIEM or EDR platform (Integration TODO)

### Example Queries

The platform can generate queries for various IoC types:

- **Domain IoCs**:
  ```kql
  SecurityEvent | where Computer contains "malicious-domain.example.com" or TargetUserName contains "malicious-domain.example.com"
  ```

- **IP Address IoCs**:
  ```kql
  SecurityEvent | where SourceIp == "192.168.1.100" or DestinationIp == "192.168.1.100"
  ```

- **Hash IoCs**:
  ```kql
  DeviceFileEvents | where SHA256 == "e5841df2166dd424a54a3a5e7f4aaaf15a966f0459e1875571388dece18ff921"
  ```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Testing

Run the tests for the backend:
```bash
cd backend
pytest
```

Run the tests for the frontend:
```bash
cd frontend
npm test
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.
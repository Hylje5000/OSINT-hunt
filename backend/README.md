# OSINT-Hunt Backend API

This is a simple Flask API that serves as the backend for the OSINT-Hunt application.

## Setup Instructions

1. Make sure you have Python 3.7+ installed

2. Setup a virtual environment (recommended):
   ```
   cd backend
   python -m venv venv
   
   # On Windows
   venv\Scripts\activate
   
   # On macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Run the development server:
   ```
   python app.py
   ```
   
   The API will be available at http://localhost:5000

## API Endpoints

- `GET /api/health` - Health check endpoint
- `GET /api/items` - Get all items
- `GET /api/items/{id}` - Get a specific item by ID
- `POST /api/items` - Create a new item

## Development

- Update the sample data in app.py with your actual data model
- Add additional endpoints as needed for your OSINT tool
- For production deployment, consider using a production WSGI server like Gunicorn
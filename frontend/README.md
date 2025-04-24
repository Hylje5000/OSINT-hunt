# OSINT-Hunt Frontend

This is a React-based frontend application for the OSINT-Hunt project. It displays items retrieved from the backend API in a clean, user-friendly interface.

## Setup Instructions

1. Make sure you have Node.js installed on your system (version 14.x or later recommended)

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```
   
   The app will be available at http://localhost:3000

## Features

- Displays items from the OSINT-Hunt backend API
- Responsive grid layout
- Loading states and error handling

## Development

- The main application logic is in `src/App.js`
- Styling is handled in `src/App.css`
- The `ItemCard` component in `src/components/ItemCard.js` is used to display individual items

## Important Notes

- Make sure the backend API is running on http://localhost:5000 before starting the frontend
- You can modify the API URL in App.js if your backend is running on a different port

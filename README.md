# NC Power Map

## Overview
A React-based power mapping application for visualizing stakeholder relationships in North Carolina. Users can add, edit, and visualize nodes representing different stakeholders based on their power level (1-10) and alignment with our visions (1-10).

## Project Architecture

### Tech Stack
- **Frontend**: React 19 + Vite 7
- **Backend**: Firebase
- **Authentication**: Email-password based authentication
- **Database**: Firebase
- **Styling**: Bootstrap 5 + Custom CSS

### Key Features
- User authentication with email/password
- Interactive canvas-based power mapping
- Real-time database polling
- Add/edit/delete nodes with power and alignment attributes
- Note-taking capability for each node

### Project Structure
```
/
├── src/                          # Frontend React application
│   ├── components/
│   │   ├── mapCanvas.jsx        # Main mapping canvas component
│   │   └── userLogin.jsx        # Login/register form component
│   ├── hooks/
│   │   └── useMap.js            # Custom hook for API calls
│   ├── App.jsx                  # Main app component
│   ├── global.css               # Global styles
│   └── main.jsx                 # Entry point
│   ├── firebase.js              # Firebase database connection setup
├── public/
│   └── _headers                 # Netlify headers config
├── index.html
├── package.json
└── vite.config.js               # Vite config with API proxy

```

## Database Configuration
The app requires a Firebase database connection via environment variables.

### Database Schema
- **maps**: Power maps owned by users
- **nodes**: Stakeholder nodes with power/alignment attributes

## Development

### Running Locally (port 5175):

```bash
npm install
npm run dev
```

### Building for Production
```bash
npm run build
```

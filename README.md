# NC Power Map

## Overview
A React-based power mapping web application for visualizing stakeholder relationships in North Carolina. Users can add, edit, and visualize nodes representing stakeholders, with attributes such as power (1-10) and alignment (1-10). Each node can also have notes, categories, and classifications, enabling detailed mapping of influence networks.

## Project Architecture

### Tech Stack
- **Frontend**: React 19 + Vite 7
- **Backend**: Firebase
- **Authentication**: Email-password based authentication
- **Database**: Firebase
- **Styling**: Bootstrap 5 + Custom CSS

### Key Features
- User authentication with email/password
- Interactive, canvas-based power map visualization
- Real-time database polling
- Add/edit/delete nodes with multiple attributes
- Note-taking capability for each node
- Visual differentiation of node categories using shapes and colors
- Drag-and-drop node placement on the canvas with responsive updates

### Project Structure
```
/
├── src/                         # Frontend React application
│   ├── components/
│   │   └── editNodePanel.jsx    # Node editting panel
│   │   ├── mapCanvas.jsx        # Main mapping canvas
│   │   └── newNodePanel.jsx     # Node creation panel
│   │   └── nodeLayer.jsx        # Canvas node rendering and drag logic
│   │   └── userLogin.jsx        # Login form
│   ├── hooks/
│   │   └── useMap.js            # Custom hook for API calls
│   ├── utils/
│   │   └── constants.js         # Constant variables
│   │   └── nodePosition.js      # Node position helper functions
│   ├── App.jsx                  # Main app component
│   ├── firebase.js              # Firebase setup and config
│   ├── global.css               # Global CSS styles
│   └── main.jsx                 # React entry point
├── index.html
├── package.json
└── vite.config.js               # Vite config with API proxy

```

## Database Configuration
The app requires a Firebase database connection via environment variables.

### Database Schema
- **maps**: Power maps owned by users
- **nodes**: Stakeholder nodes with multiple attributes

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

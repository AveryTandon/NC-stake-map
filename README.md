# NC Power Map

## Overview
A React-based power mapping web application for visualizing stakeholder relationships in North Carolina. Users can add, edit, and visualize nodes representing stakeholders, with attributes such as power (1-10) and alignment (-5 to 5). Each node can also have notes, categories, and classifications, enabling detailed mapping of influence networks.

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
- Real-time database synchronization via Firebase Firestore
- Add/edit/delete nodes with multiple attributes
- Note-taking capability for each node with expandable text areas
- Visual differentiation of node categories using shapes and colors
- Drag-and-drop node placement on the canvas with automatic snapping to grid
- Node stacking: nodes with the same power/alignment values stack together
- Stack expansion/collapse: click stack badges or nodes to expand and view individual nodes
- Unsaved changes warnings when editing nodes
- Smooth animations for node movements and transitions

### Project Structure
```
/
├── src/                         # Frontend React application
│   ├── components/
│   │   ├── editNodePanel.jsx    # Node editing panel
│   │   ├── mapCanvas.jsx        # Main mapping canvas with axes
│   │   ├── newNodePanel.jsx     # Node creation panel
│   │   ├── nodeLayer.jsx        # Canvas node rendering and drag logic
│   │   └── userLogin.jsx        # Login form
│   ├── hooks/
│   │   └── useMap.js            # Custom hook for Firebase operations
│   ├── utils/
│   │   ├── constants.js         # Category colors and shape mappings
│   │   └── nodePosition.js      # Node position calculation helpers
│   ├── App.jsx                  # Main app component
│   ├── firebase.js              # Firebase setup and config
│   ├── global.css               # Global CSS styles
│   └── main.jsx                 # React entry point
├── index.html
├── package.json
└── vite.config.js               # Vite configuration

```

## Configuration

### Environment Variables
The app requires Firebase configuration via environment variables. Create a `.env` file in the root directory with:

```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### Database Schema
- **maps**: Collection of power maps
  - Each map contains a **nodes** subcollection
- **nodes**: Stakeholder nodes with the following attributes:
  - `id`: Unique identifier (auto-generated)
  - `label`: Node name/label (required)
  - `power`: Integer from 1 to 10 (required)
  - `alignment`: Integer from -5 to 5 (required)
  - `category`: One of: Individual, Institution, Media, Social, State, Other (required)
  - `classification`: One of: Key Policy/Issue/Debate, Opposition Unorganized Group, Opposition Organized Group, Progressive Unorganized Group, Progressive Organized Group, Decision Maker (required)
  - `notes`: Optional text field for additional information

## Development

### Prerequisites
- Node.js (v18 or higher recommended)
- npm or yarn
- Firebase project with Firestore and Authentication enabled

### Running Locally

```bash
npm install
npm run dev
```

The development server will start on the default Vite port (usually 5173). Access the app at `http://localhost:5173`.

### Building for Production

```bash
npm run build
```

The production build will be output to the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Usage

### Adding Nodes
1. Click the "Add Node" button
2. Fill in all required fields (label, power, alignment, category, classification)
3. Optionally add notes
4. Click "Add Node" to create

### Editing Nodes
1. Click on any node to open the edit panel
2. Modify any attributes
3. Click "Save Changes" to update or "Delete Node" to remove

### Dragging Nodes
1. Click and drag any node to reposition it on the canvas
2. The node will automatically snap to the nearest grid position based on power/alignment values
3. The edit panel will open automatically after dragging

### Stacking
- Nodes with the same power and alignment values automatically stack together
- Click the red badge showing the stack count to expand and view individual nodes
- Click the collapse button (→←) or click outside to collapse the stack

## Next Steps / Roadmap

### Bug Fixes
- Fix node edit panel glitches and UI inconsistencies

### Planned Features

#### User Experience Improvements
- **Playground Mode**: Allow users to access the web app without login to create their own axes and nodes in a playground environment. Users can then login to save their work and access previously created maps.
- **Map Management**: Enable users to save power maps to their profile and create multiple maps. Add ability to switch between maps, duplicate maps, and organize maps into folders.
- **Node Relationships**: Add ability to create and visualize relationships/connections between nodes (e.g., alliances, conflicts, dependencies) with visual connectors on the canvas.

#### Possible Additional Feature
- **Export/Import**: Export maps as images (PNG/SVG) or JSON data for backup and sharing
- **Search & Filter**: Search nodes by label, category, or classification; filter nodes by attributes
- **Undo/Redo**: Implement undo/redo functionality for node operations
- **Custom Categories & Classifications**: Allow users to define custom categories and classifications beyond the default set
- **Map Templates**: Provide pre-configured map templates for common use cases
- **Collaboration**: Enable multiple users to edit the same map in real-time
- **Analytics**: Add visualizations and statistics about node distribution and relationships
- **Mobile Responsiveness**: Improve mobile and tablet experience for viewing and editing maps
- **Accessibility**: Enhance keyboard navigation and screen reader support
- **Performance Optimization**: Optimize rendering for maps with large numbers of nodes (100+)

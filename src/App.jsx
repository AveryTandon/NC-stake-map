import { useState } from "react";
import MapCanvas from "./components/mapCanvas.jsx";
import Login from "./components/userLogin.jsx";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div>
      {isLoggedIn ? (
        <div style={{ padding: 20 }}>
        <h1>Power Mapping in NC</h1>
        <MapCanvas mapId="main-map" />
        </div>
      ) : (
        <Login onLogin={setIsLoggedIn} />
      )}
    </div>
  );
}
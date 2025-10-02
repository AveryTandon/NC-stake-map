import { useState } from "react";
import MapCanvas from "./components/mapCanvas.jsx";
import Login from "./components/userLogin.jsx";

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div>
      {isLoggedIn ? (
        <MapCanvas mapId="123" />
      ) : (
        <Login onLogin={setIsLoggedIn} />
      )}
    </div>
  );
}
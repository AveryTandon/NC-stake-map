import React from "react";
import MapCanvas from "./components/mapCanvas.jsx";

export default function App() {
  return (
    <div style={{ padding: 20 }}>
      <h1>Power vs Alignment Map</h1>
      <MapCanvas mapId="main-map" />
    </div>
  );
}
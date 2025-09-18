import React from "react";
import MapCanvas from "./components/mapCanvas";

export default function App() {
  // For now, we just use a hardcoded mapId
  const mapId = "test-map";

  return (
    <div style={{ padding: 20 }}>
      <h1>Power Map Prototype</h1>
      <MapCanvas mapId={mapId} />
    </div>
  );
}
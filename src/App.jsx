import MapCanvas from "./components/mapCanvas.jsx";

export default function App() {
  return (
    <div style={{padding: 10}}>
      <h1>Power Mapping in NC</h1>
      <MapCanvas mapId="main-map" />
    </div>
  );
}
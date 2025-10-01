import React, { useRef, useState, useEffect } from "react";
import useMap from "../hooks/useMap.js";

export default function MapCanvas({ mapId }) {
  const { nodes, createNode, updateNode, deleteNode } = useMap(mapId);
  const [label, setLabel] = useState("");
  const [power, setPower] = useState(1);
  const [alignment, setAlignment] = useState(1);
  // const [notes, setNotes] = useState("");
  const [selectedNode, setSelectedNode] = useState(null);
  const [editedPower, updatePower] = useState(1);
  const [editedAlignment, updateAlignment] = useState(1);

  const handleAddNode = () => {
    createNode({
      label,
      power: Number(power),
      alignment: Number(alignment)
    });
    setLabel("");
    setPower(1);
    setAlignment(1);
    // setNotes("");
  };

  useEffect(() => {
  const handleClickOutside = (e) => {
    if (!e.target.closest(".node-panel") && !e.target.classList.contains("node")) {
      setSelectedNode(null);
    }
  };
  document.addEventListener("click", handleClickOutside);
  return () => document.removeEventListener("click", handleClickOutside);
}, []);

useEffect(() => {
  if (selectedNode) {
    updatePower(selectedNode.power);
    updateAlignment(selectedNode.alignment);
  }
}, [selectedNode]);

  const canvasRef = useRef(null);
  const canvasWidth = 1200;
  const canvasHeight = 600;
  const padding = 50;
  const tickInset = 40;

    // Draw axes with arrows and tick marks
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    // Clear canvas
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.strokeStyle = "black";
    ctx.lineWidth = 2;
    ctx.font = "12px sans-serif";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // X axis
    ctx.beginPath();
    ctx.moveTo(padding, canvasHeight - padding);
    ctx.lineTo(canvasWidth - padding + 50, canvasHeight - padding);
    ctx.stroke();

    // X arrow
    ctx.beginPath();
    ctx.moveTo(canvasWidth - padding + 50, canvasHeight - padding);
    ctx.lineTo(canvasWidth - padding + 40, canvasHeight - padding - 5);
    ctx.lineTo(canvasWidth - padding + 40, canvasHeight - padding + 5);
    ctx.closePath();
    ctx.fill();

    // Y axis
    ctx.beginPath();
    ctx.moveTo(padding, canvasHeight - padding);
    ctx.lineTo(padding, padding - 50);
    ctx.stroke();

    // Y arrow
    ctx.beginPath();
    ctx.moveTo(padding, padding - 50);
    ctx.lineTo(padding - 5, padding - 40);
    ctx.lineTo(padding + 5, padding - 40);
    ctx.closePath();
    ctx.fill();

    // Draw ticks and labels (1–10)
    for (let i = 1; i <= 10; i++) {
      // X ticks
      const x = padding + tickInset + ((i - 1) * (canvasWidth - 2 * padding - tickInset) / 9);
      ctx.beginPath();
      ctx.moveTo(x, canvasHeight - padding);
      ctx.lineTo(x, canvasHeight - padding + 10);
      ctx.stroke();
      ctx.fillText(i, x, canvasHeight - padding + 20);

      // Y ticks
      const y = canvasHeight - padding - tickInset - ((i - 1) * (canvasHeight - 2 * padding - tickInset) / 9);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(padding - 8, y);
      ctx.stroke();
      ctx.textAlign = "right";
      ctx.fillText(i, padding - 12, y);
      ctx.textAlign = "center";
    }
  }, [canvasWidth, canvasHeight]);

  return (
    <div>
      <div className="container">
        <div className="row">
          <div className="col-md-8 col-sm-12">
          <p>This power map shows the relationships between different stakeholders in NC. You can add new nodes, 
            setting their power and alignment on a scale of 1-10. You can also edit an existing node by clicking on it.</p>
        </div>
        <div className="col-md-4 col-sm-12"><div className="new-node">
          <h2>Add a New Node</h2>
          <input placeholder="Label" value={label} onChange={(e) => setLabel(e.target.value)} />
          <div>
          <label style={{ margin: 10 }}>Power: 
            <input type="number" min="1" max="10" value={power} onChange={(e) => setPower(e.target.value)} style={{ marginLeft: 5 }} />
          </label>
          <label style={{ margin: 10 }}>Alignment: 
          <input type="number" min="1" max="10" value={alignment} onChange={(e) => setAlignment(e.target.value)} style={{ marginLeft: 5 }} />
          </label>
          <button style={{ margin: 10, borderRadius: 5, backgroundColor: "lightblue" }} onClick={handleAddNode}>Add Node</button>
          </div>
      </div></div>
      </div>
      </div>
      <div style={{ position: "relative", width: canvasWidth, height: canvasHeight, margin: "0 auto" }}>
        <h2 style={{ position: "absolute", bottom: -20, left: 160, transform: "translateX(-50%)" }}>Aligned w/ Our Vision</h2>
        <h2 style={{ position: "absolute", bottom: -20, left: 1040, transform: "translateX(-50%)" }}>Top Dog Vision</h2>
        <h2 style={{ position: "absolute", bottom: 80, left: -80, transform: "rotate(-90deg) translateY(50%)" }}>Low Power</h2>
        <h2 style={{ position: "absolute", bottom: canvasHeight - 80, left: -80, transform: "rotate(-90deg) translateY(50%)" }}>High Power</h2>
      <canvas
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          style={{ position: "absolute", top: 0, left: 0 }}
        />

        {nodes.map(node => {
          const x = padding + tickInset + (node.alignment - 1) * ((canvasWidth - 2 * padding - tickInset) / 9);
          const y = canvasHeight - padding - tickInset - (node.power - 1) * ((canvasHeight - 2 * padding - tickInset) / 9);
          return (
            <div
              key={node.id}
              className="node"
              style={{ left: x - 15, top: y - 15, position: "absolute" }}
              title={node.label} 
              onClick={() => setSelectedNode(node)}
            >
              {node.label}
            </div>
          );
        })}
        {selectedNode && (
        <div
          className="node-panel"
          style={{
            position: "absolute",
            top: -10,
            left: "50%",
            transform: "translateX(-50%)"
          }}
        >
          <h4>{selectedNode.label}</h4>
          <label style={{ margin: 5 }}>
            Power:
            <input
              type="number"
              min="1"
              max="10"
              value={editedPower}
              onChange={e => {
                updatePower(Number(e.target.value))
              }}
              style={{ marginLeft: 5 }}
            />
          </label>
          <br />
          <label style={{ margin: 7, marginBottom: 10 }}>
            Alignment:
            <input
              type="number"
              min="1"
              max="10"
              value={editedAlignment}
              onChange={e => {
                updateAlignment(Number(e.target.value))
              }}
              style={{ marginLeft: 5, marginBottom: 5 }}
            />
          </label>
          <br />
          {/* <label>
            Notes:
            <textarea className="notes-box"
              value={editedNotes}
              onChange={e => updateNotes(e.target.value)}
            />
          </label>
          <br /> */}
          <button className="save-btn"
            onClick={() => {
              updateNode(selectedNode.id, { power: editedPower });
              updateNode(selectedNode.id, { alignment: editedAlignment });
              // updateNodeField(selectedNode.id, "notes", editedNotes);
              setSelectedNode(null)
            }}
          >
            Save Changes
          </button>
          <button className="del-btn"
            onClick={() => {
              if (window.confirm("Are you sure you want to delete this node?")) {
                deleteNode(selectedNode.id);
                setSelectedNode(null);
              }
            }}
        >
          Delete Node
        </button>
        </div>
      )}
      </div>
    </div>
  );
}
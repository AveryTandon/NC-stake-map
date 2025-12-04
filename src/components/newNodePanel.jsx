import React, { useState, useRef } from "react";

export default function NewNodePanel({ createNode, categories, classifications }) {
  const [showPanel, setShowPanel] = useState(false);
  const [label, setLabel] = useState("");
  const [power, setPower] = useState(1);
  const [alignment, setAlignment] = useState(1);
  const [category, setCategory] = useState("");
  const [classification, setClassification] = useState("");
  const [notes, setNotes] = useState("");
  const addNotesRef = useRef(null);

  const handleAddNode = () => {
    if (!label.trim()) {
      alert("Label is required.");
      return;
    }
    if (!category.trim()) {
      alert("Category is required.");
      return;
    }

    createNode({
      label,
      power: Number(power),
      alignment: Number(alignment),
      category,
      classification,
      notes
    });

    // Reset form
    setLabel("");
    setPower(1);
    setAlignment(1);
    setCategory("");
    setClassification("");
    setNotes("");
    setShowPanel(false);

    if (addNotesRef.current) addNotesRef.current.style.height = "auto";
  };

  return (
    <div>
      {!showPanel && (
        <button className="btn" onClick={() => setShowPanel(true)}>
          Add Node
        </button>
      )}

      {showPanel && (
        <div className="new-node-panel">
            <h2>Add a New Node</h2>
            <input
                placeholder="Label"
                value={label}
                onChange={e => setLabel(e.target.value)}
                style={{ marginBottom: "8px" }}
            />
            <div style={{ display: "flex", gap: "10px", marginBottom: "8px", alignItems: "center" }}>
            <label style={{ margin: 0, display: "flex", alignItems: "center", gap: "5px" }}>
                Power:
                <input
                type="number"
                min="1"
                max="10"
                value={power}
                onChange={e => setPower(e.target.value)}
                style={{ margin: 0 }}
                />
            </label>
            <label style={{ margin: 0, display: "flex", alignItems: "center", gap: "5px" }}>
                Alignment:
                <input
                type="number"
                min="-5"
                max="5"
                value={alignment}
                onChange={e => setAlignment(e.target.value)}
                style={{ margin: 0 }}
                />
            </label>
            </div>
            <div style={{ marginBottom: "8px" }}>
            <label style={{ margin: 0, display: "flex", alignItems: "center", gap: "5px" }}>
              Category:
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{ margin: 0 }}
            >
              <option value="">--Choose Category--</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            </label>
            </div>
            <div style={{ marginBottom: "8px" }}>
            <label style={{ margin: 0, display: "flex", alignItems: "center", gap: "5px" }}>
              Classification:
              <select
              value={classification}
              onChange={e => setClassification(e.target.value)}
              style={{ margin: 0 }}
              >
              <option value="">-----Choose Classification-----</option>
              {classifications.map(clas => (
                <option key={clas} value={clas}>{clas}</option>
              ))}
            </select>
            </label>
            </div>
            <div style={{ marginBottom: "8px", width: "100%" }}>
                <label style={{ margin: 0, display: "flex", alignItems: "flex-start", gap: "5px"}}>
                  Notes:
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                <textarea
                ref={addNotesRef}
                value={notes}
                onChange={e => {
                    setNotes(e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                }}
                style={{ minHeight: 20 }}
                />
            </div>
            </label>
            </div>
            <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
            <button className="btn btn-success" onClick={handleAddNode}>Add Node</button>
            <button className="btn btn-secondary"
            onClick={() => {
                setShowPanel(false)
                setLabel("");
                setPower(1);
                setAlignment(1);
                setCategory("");
                setClassification("");
                setNotes("");
            }}
            style={{ marginLeft: 5 }}>Cancel</button>
        </div>
        </div>
      )}
    </div>
  );
}
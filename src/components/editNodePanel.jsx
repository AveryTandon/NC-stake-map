import React, { useState, useEffect, useRef } from "react";
import { getNodePosition } from "../utils/nodePosition.js";

export default function EditNodePanel({ selectedNode, setSelectedNode, updateNode, deleteNode, categories, classifications, canvasWidth, canvasHeight, padding }) {
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const [editedPower, editPower] = useState(1);
    const [editedAlignment, editAlignment] = useState(1);
    const [editedCategory, editCategory] = useState("");
    const [editedClassification, editClassification] = useState("");
    const [editedNotes, editNotes] = useState("");
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const editNotesRef = useRef(null);

    useEffect(() => {
        if (!selectedNode) return;

        editPower(selectedNode.power);
        editAlignment(selectedNode.alignment);
        editCategory(selectedNode.category);
        editClassification(selectedNode.classification);
        editNotes(selectedNode.notes || "");
        setIsEditingNotes(false);
    
        // Calculate panel position above node
        let nodePos;
        if (selectedNode._screenX && selectedNode._screenY) {
            nodePos = { x: selectedNode._screenX, y: selectedNode._screenY };
        } else {
            nodePos = getNodePosition(
            selectedNode,
            [],
            canvasWidth,
            canvasHeight,
            padding,
            50,
            20
            );
        }

        let left = nodePos.x - 30;
        let top = nodePos.y - 80;
        const panelWidth = 230;
        const panelHeight = 140;

        left = Math.max(panelWidth / 2, Math.min(left, canvasWidth - panelWidth / 2));
        top = Math.max(panelHeight / 2, Math.min(top, canvasHeight - panelHeight / 2));

        setCoords({ top, left });
    }, [selectedNode, canvasWidth, canvasHeight, padding]);

    if (!selectedNode) return null;

    const handleSave = () => {
        updateNode(selectedNode.id, {
            ...selectedNode,
            power: editedPower,
            alignment: editedAlignment,
            category: editedCategory,
            classification: editedClassification,
            notes: editedNotes,
        });
        setSelectedNode(null);
    };

    const handleDelete = () => {
        if (window.confirm("Are you sure you want to delete this node?")) {
            deleteNode(selectedNode.id);
            setSelectedNode(null);
        }
    };

    return (
        <div
          className="node-panel"
          style={{
            position: "absolute",
            top: coords.top,
            left: coords.left,
            transform: "translate(-50%, -100%)"
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
              onChange={(e) => editPower(Math.max(1, Math.min(10, Number(e.target.value))))}
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
              onChange={(e) => editAlignment(Math.max(1, Math.min(10, Number(e.target.value))))}
              style={{ marginLeft: 5, marginBottom: 5 }}
            />
          </label>
          <br />
          <label style={{ margin: 7, marginBottom: 10 }}>Category:</label>
            <select id="category-select" value={editedCategory} onChange={(e) => editCategory(e.target.value)} style={{ marginLeft: 5 }}>
            <option value="">--Choose Category--</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <br />
          <label style={{ margin: 7, marginBottom: 10 }}>Classification:</label>
            <select id="class-select" value={editedClassification} onChange={(e) => editClassification(e.target.value)} style={{ marginLeft: 5 }}>
            <option value="">--Choose Classification--</option>
            {classifications.map((clas) => (
              <option key={clas} value={clas}>
                {clas}
              </option>
            ))}
          </select>
          < br/>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "-15px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", maxWidth: "100%" }}>
          <label>Notes:</label>
            <textarea
              ref={editNotesRef}
              value={editedNotes}
              readOnly={!isEditingNotes}
              onClick={() => setIsEditingNotes(true)}
              onChange={(e) => {
                editNotes(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = e.target.scrollHeight + "px";
              }}
              style={{ marginLeft: 5, marginBottom: 5, minHeight: "20px" }}
            />
          </div> </div>
          <br />
          <button onClick={handleSave} className="save-btn">Save Changes</button>
          <button onClick={handleDelete} className="del-btn">Delete Node</button>
        </div>
    );
}
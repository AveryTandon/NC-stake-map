import React, { useState, useEffect, useRef } from "react";
import { getNodePosition } from "../utils/nodePosition.js";

export default function EditNodePanel({ selectedNode, setSelectedNode, updateNode, deleteNode, categories, classifications, canvasWidth, canvasHeight, sidePadding, bottomPadding, tickInset }) {
    const [coords, setCoords] = useState({ top: 0, left: 0, positionBelow: false });
    const panelWidth = 325;
    const [editedPower, editPower] = useState(1);
    const [editedAlignment, editAlignment] = useState(1);
    const [editedCategory, editCategory] = useState("");
    const [editedClassification, editClassification] = useState("");
    const [editedNotes, editNotes] = useState("");
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [notesExpanded, setNotesExpanded] = useState(false);
    const editNotesRef = useRef(null);
    const maxNotesHeight = 180; // Maximum height for notes box in pixels

    useEffect(() => {
        if (!selectedNode) return;

        editPower(selectedNode.power);
        editAlignment(selectedNode.alignment);
        editCategory(selectedNode.category);
        editClassification(selectedNode.classification);
        editNotes(selectedNode.notes || "");
        setIsEditingNotes(false);
        setNotesExpanded(false);
        
        // Auto-expand notes box to show full content when panel opens
        setTimeout(() => {
            if (editNotesRef.current) {
                const textarea = editNotesRef.current;
                textarea.style.height = "auto";
                const scrollHeight = textarea.scrollHeight;
                // Expand to show full content, but cap at maxNotesHeight
                textarea.style.height = Math.min(scrollHeight, maxNotesHeight) + "px";
                // If content exceeds max height, mark as expanded/truncated
                setNotesExpanded(scrollHeight > maxNotesHeight);
            }
        }, 0);
    
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
            sidePadding,
            bottomPadding,
            tickInset,
            50,
            20
            );
        }

        let left = nodePos.x;
        const panelHeight = 200; // Updated for compact layout
        
        // Position panel below node if power > 7, otherwise above
        const positionBelow = selectedNode.power > 7;
        let top;
        
        if (positionBelow) {
            // Position below node: top is the top of the panel
            top = nodePos.y + 40; // Add some space below node
            // Ensure panel doesn't go below canvas
            top = Math.min(top, canvasHeight - panelHeight);
        } else {
            // Position above node: top is the bottom of panel (due to translate(-50%, -100%))
            top = nodePos.y - 40; // Small gap above node
            // Ensure panel doesn't go above canvas
            top = Math.max(panelHeight, top);
        }

        // Constrain horizontal position (left is the center due to translate(-50%, 0) or translate(-50%, -100%))
        left = Math.max(panelWidth / 2, Math.min(left, canvasWidth - panelWidth / 2));

        setCoords({ top, left, positionBelow });
    }, [selectedNode, canvasWidth, canvasHeight, sidePadding, bottomPadding, tickInset]);

    // Focus textarea when editing mode is enabled
    useEffect(() => {
      if (isEditingNotes && editNotesRef.current) {
          editNotesRef.current.focus();
      }
    }, [isEditingNotes]);

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
            transform: coords.positionBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)",
            width: panelWidth,
            fontSize: "13px"
          }}
        >
          <h4 style={{ margin: "0 0 8px 0", fontSize: "14px" }}><strong>{selectedNode.label}</strong></h4>
          
          <div style={{ display: "flex", gap: "10px", marginBottom: "8px", alignItems: "center" }}>
            <label style={{ margin: 0, display: "flex", alignItems: "center", gap: "5px" }}>
              Power:
              <input
                type="number"
                min="1"
                max="10"
                value={editedPower}
                onChange={(e) => editPower(Math.max(1, Math.min(10, Number(e.target.value))))}
                style={{ margin: 0 }}
              />
            </label>
            <label style={{ margin: 0, display: "flex", alignItems: "center", gap: "5px" }}>
              Alignment:
              <input
                type="number"
                min="-5"
                max="5"
                value={editedAlignment}
                onChange={(e) => editAlignment(Math.max(-5, Math.min(5, Number(e.target.value))))}
                style={{ margin: 0 }}
              />
            </label>
          </div>
          
          <div style={{ marginBottom: "8px" }}>
            <label style={{ margin: 0, display: "flex", alignItems: "center", gap: "5px" }}>
              Category:
              <select 
                id="category-select" 
                value={editedCategory} 
                onChange={(e) => editCategory(e.target.value)} 
                style={{ flex: 1, margin: 0 }}
              >
                <option value="">--Choose Category--</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>
          
          <div style={{ marginBottom: "8px" }}>
            <label style={{ margin: 0, display: "flex", alignItems: "center", gap: "5px" }}>
              Classification:
              <select 
                id="class-select" 
                value={editedClassification} 
                onChange={(e) => editClassification(e.target.value)} 
                style={{ flex: 1, margin: 0 }}
              >
                <option value="">--Choose Classification--</option>
                {classifications.map((clas) => (
                  <option key={clas} value={clas}>
                    {clas}
                  </option>
                ))}
              </select>
            </label>
          </div>
          
          <div style={{ marginBottom: "8px", width: "100%" }}>
            <label style={{ margin: 0, display: "flex", alignItems: "flex-start", gap: "5px" }}>
              Notes:
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
                <textarea
                  ref={editNotesRef}
                  value={editedNotes}
                  readOnly={!isEditingNotes}
                  onFocus={() => setIsEditingNotes(true)}
                  onChange={(e) => {
                    editNotes(e.target.value);
                    const textarea = e.target;
                    textarea.style.height = "auto";
                    const scrollHeight = textarea.scrollHeight;
                    // Allow expansion up to maxNotesHeight
                    textarea.style.height = Math.min(scrollHeight, maxNotesHeight) + "px";
                    // Update expanded state if content exceeds max
                    if (scrollHeight > maxNotesHeight) {
                      setNotesExpanded(true);
                    } else {
                      setNotesExpanded(false);
                    }
                  }}
                  style={{ 
                    margin: 0, 
                    minHeight: "40px", 
                    maxHeight: maxNotesHeight + "px",
                    resize: "vertical",
                    overflowY: "auto"
                  }}
                />
                {notesExpanded && (
                  <div style={{ fontSize: "11px", color: "#666" }}>
                    Note truncated. Scroll to see more or edit to view full content.
                  </div>
                )}
              </div>
            </label>
          </div>
          
          <div style={{ display: "flex", gap: "5px", justifyContent: "center" }}>
            <button onClick={handleSave} className="save-btn" style={{ margin: 0 }}>Save Changes</button>
            <button onClick={handleDelete} className="del-btn" style={{ margin: 0 }}>Delete Node</button>
          </div>
        </div>
    );
}
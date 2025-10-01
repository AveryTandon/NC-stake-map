import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase.js";

export default function useMap(mapId) {
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    if (!mapId) return;

    const colRef = collection(db, "maps", mapId, "nodes");

    // Subscribe to Firestore collection
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setNodes(data);
      },
      (err) => {
        console.error("Error listening to nodes:", err);
      }
    );

    return () => unsub(); // cleanup on unmount
  }, [mapId]);

  const createNode = async (node) => {
    await addDoc(collection(db, "maps", mapId, "nodes"), node);
  };

  const updateNode = async (nodeId, fields) => {
    const nodeRef = doc(db, "maps", mapId, "nodes", nodeId);
    await updateDoc(nodeRef, fields);
  };

  const deleteNode = async (nodeId) => {
    const nodeRef = doc(db, "maps", mapId, "nodes", nodeId);
    await deleteDoc(nodeRef);
  };

  return { nodes, createNode, updateNode, deleteNode };
}
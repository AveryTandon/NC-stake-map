// src/hooks/useMap.js
import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc } from "firebase/firestore";
import { db } from "../firebase.js";

export default function useMap(mapId) {
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    if (!mapId) return;
    const unsub = onSnapshot(
      collection(db, "maps", mapId, "nodes"),
      (snap) => {
        setNodes(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        console.log("Loaded nodes:", loadedNodes);
        setNodes(loadedNodes);
      }
    );
    return unsub;
  }, [mapId]);

  const createNode = async (node) => {
    await addDoc(collection(db, "maps", mapId, "nodes"), node);
  };

  return { nodes, createNode };
}
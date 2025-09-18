import { useState, useEffect } from "react";
import { collection, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export default function useMap(mapId) {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]); // optional for now

  useEffect(() => {
    if (!mapId) return;

    // Listen to nodes in real-time
    const unsubNodes = onSnapshot(
      collection(db, "maps", mapId, "nodes"),
      (snapshot) => setNodes(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    // Listen to edges if needed
    const unsubEdges = onSnapshot(
      collection(db, "maps", mapId, "edges"),
      (snapshot) => setEdges(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    );

    return () => {
      unsubNodes();
      unsubEdges();
    };
  }, [mapId]);

  const createNode = async (payload) => {
    await addDoc(collection(db, "maps", mapId, "nodes"), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  };

  const updateNode = async (id, patch) => {
    await updateDoc(doc(db, "maps", mapId, "nodes", id), {
      ...patch,
      updatedAt: serverTimestamp()
    });
  };

  const deleteNode = async (id) => {
    await doc(db, "maps", mapId, "nodes", id).delete();
  };

  return { nodes, edges, createNode, updateNode, deleteNode };
}
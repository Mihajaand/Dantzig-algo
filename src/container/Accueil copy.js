import React, { useState, useEffect, useRef } from "react";
import { Network } from "vis-network/standalone";
import "../container/accueil.css";

function App() {
  const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [positions, setPositions] = useState({});
  const [startNode, setStartNode] = useState(1);
  const [endNode, setEndNode] = useState(16);
  const [result, setResult] = useState(null);
  const [edgeFrom, setEdgeFrom] = useState("");
  const [edgeTo, setEdgeTo] = useState("");
  const [edgeWeight, setEdgeWeight] = useState("");
  const [editingEdgeIndex, setEditingEdgeIndex] = useState(null);
  const [editingWeight, setEditingWeight] = useState("");
  const containerRef = useRef(null);
  const networkRef = useRef(null);

  const addNode = () => {
    const newNode = (graph.nodes.at(-1) || 0) + 1;
    setGraph((prev) => ({ ...prev, nodes: [...prev.nodes, newNode] }));
    setPositions((prev) => ({
      ...prev,
      [newNode]: { x: Math.random() * 400, y: Math.random() * 400 },
    }));
  };

  const handleAddEdge = () => {
    const from = parseInt(edgeFrom);
    const to = parseInt(edgeTo);
    const weight = parseInt(edgeWeight);
    if (isNaN(from) || isNaN(to) || isNaN(weight)) {
      alert("Valeurs invalides !");
      return;
    }
    setGraph((prev) => ({ ...prev, edges: [...prev.edges, { from, to, weight }] }));
    setEdgeFrom(""); setEdgeTo(""); setEdgeWeight("");
  };

  const hasPath = (start, end) => {
    const visited = new Set();
    const stack = [start];
    while (stack.length) {
      const node = stack.pop();
      if (node === end) return true;
      if (visited.has(node)) continue;
      visited.add(node);
      graph.edges.filter((e) => e.from === node).forEach((e) => stack.push(e.to));
    }
    return false;
  };

  const dantzigNoCycle = (g, start, end, isMax = false) => {
    const dist = {};
    const prev = {};
    const nodes = g.nodes;
    const edges = g.edges;

    nodes.forEach((n) => (dist[n] = isMax ? -Infinity : Infinity));
    dist[start] = 0;

    // Bellman-Ford sans cycle infini
    for (let i = 0; i < nodes.length - 1; i++) {
      edges.forEach((edge) => {
        const u = edge.from;
        const v = edge.to;
        const w = edge.weight;
        if (dist[u] !== (isMax ? -Infinity : Infinity)) {
          if (isMax) {
            if (dist[u] + w > dist[v]) {
              dist[v] = dist[u] + w;
              prev[v] = u;
            }
          } else {
            if (dist[u] + w < dist[v]) {
              dist[v] = dist[u] + w;
              prev[v] = u;
            }
          }
        }
      });
    }

    // Construction du chemin
    const path = [];
    const visited = new Set();
    let current = end;
    while (current !== undefined && !visited.has(current)) {
      visited.add(current);
      path.unshift(current);
      current = prev[current];
    }
    if (!path.includes(start)) {
      path.length = 0;
      path.unshift(start);
      let cur = start;
      const seen = new Set([start]);
      while (cur !== end) {
        let next = null;
        let best = isMax ? -Infinity : Infinity;
        for (const edge of edges) {
          if (edge.from === cur) {
            if (
              (isMax && edge.weight > best) ||
              (!isMax && edge.weight < best)
            ) {
              best = edge.weight;
              next = edge.to;
            }
          }
        }
        if (!next || seen.has(next)) break;
        seen.add(next);
        path.push(next);
        cur = next;
        if (cur === end) break;
      }
    }

    return { path, distance: dist[end] ?? (isMax ? -Infinity : Infinity) };
  };

  const findShortestPath = () => {
    if (!graph.nodes.includes(startNode) || !graph.nodes.includes(endNode)) {
      alert("Sommets invalides !"); return;
    }
    const res = dantzigNoCycle(graph, startNode, endNode, false);
    setResult(res);
    highlightPath(res.path);
  };

  const findLongestPath = () => {
    if (!graph.nodes.includes(startNode) || !graph.nodes.includes(endNode)) {
      alert("Sommets invalides !"); return;
    }
    const res = dantzigNoCycle(graph, startNode, endNode, true);
    if (res.distance === -Infinity) {
      alert("⚠️ Chemin max non atteignable ou boucle ignorée.");
    }
    setResult(res);
    highlightPath(res.path);
  };

  const highlightPath = (path) => {
    const pathEdges = new Set();
    for (let i = 0; i < path.length - 1; i++) {
      pathEdges.add(`${path[i]}-${path[i + 1]}`);
    }
    const updated = graph.edges.map((e) => ({
      ...e,
      color: pathEdges.has(`${e.from}-${e.to}`) ? "red" : "black",
    }));
    setGraph((prev) => ({ ...prev, edges: updated }));
  };

  useEffect(() => {
  if (!containerRef.current) return;

  const nodes = graph.nodes.map((node) => {
    const pos = positions[node] || { x: Math.random() * 400, y: Math.random() * 400 };
    return {
      id: node,
      label: `x${node}`,
      x: pos.x,
      y: pos.y,
      fixed: false,
      color: "yellow",
      physics: false,
    };
  });

  const edges = graph.edges.map((edge, i) => ({
    id: i,
    from: edge.from,
    to: edge.to,
    label: `${edge.weight}`,
    color: { color: edge.color || "black" },
    smooth: { type: "curvedCW", roundness: 0.2 },
  }));

  const data = { nodes, edges };
  const options = {
    edges: {
      arrows: { to: true },
      font: { size: 13, align: "middle" },
    },
    physics: false,
  };

  if (networkRef.current) {
    networkRef.current.setData(data);
  } else {
    networkRef.current = new Network(containerRef.current, data, options);
  }

  networkRef.current.on("dragEnd", (params) => {
    const newPositions = { ...positions };
    params.nodes.forEach((nodeId) => {
      const pos = networkRef.current.getPositions([nodeId])[nodeId];
      newPositions[nodeId] = { x: pos.x, y: pos.y };
    });
    setPositions(newPositions);
  });
}, [graph, positions]); // <-- AJOUTER `positions` ici

  return (
    <div className="container">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", backgroundColor: "#f4f4f4", borderTop: "4px solid green", borderBottom: "4px solid green" }}>
        <div style={{ backgroundColor: "forestgreen", color: "white", padding: "20px", fontWeight: "bold", borderRadius: "6px" }}>RECHERCHE OPÉRATIONNELLE</div>
        <h1 style={{ color: "red", fontSize: "40px", margin: 0 }}>Algorithme de DANTZIG</h1>
        <div style={{ backgroundColor: "forestgreen", color: "white", padding: "20px", fontWeight: "bold", borderRadius: "6px" }}>RECHERCHE OPÉRATIONNELLE</div>
      </div>

      <div style={{ display: "flex", gap: "40px", padding: "20px" }}>
        <div style={{ flex: 1 }}>
          <h3>Sommet initial & final</h3>
          <label>Sommet initial :</label>
          <input type="number" value={startNode} onChange={(e) => setStartNode(parseInt(e.target.value))} style={{ width: "100%", marginBottom: "10px" }} />
          <label>Sommet final :</label>
          <input type="number" value={endNode} onChange={(e) => setEndNode(parseInt(e.target.value))} style={{ width: "100%", marginBottom: "10px" }} />
          <button onClick={findShortestPath} style={{ width: "100%", backgroundColor: "green", color: "white", marginBottom: "10px" }}>Chemin MIN</button>
          <button onClick={findLongestPath} style={{ width: "100%", backgroundColor: "orange", color: "black" }}>Chemin MAX</button>

          <h3 style={{ marginTop: "20px" }}>Ajouter une relation</h3>
          <input type="number" placeholder="Départ (Xa)" value={edgeFrom} onChange={(e) => setEdgeFrom(e.target.value)} style={{ width: "100%", marginBottom: "5px" }} />
          <input type="number" placeholder="Arrivée (Xb)" value={edgeTo} onChange={(e) => setEdgeTo(e.target.value)} style={{ width: "100%", marginBottom: "5px" }} />
          <input type="number" placeholder="Poids" value={edgeWeight} onChange={(e) => setEdgeWeight(e.target.value)} style={{ width: "100%", marginBottom: "5px" }} />
          <button onClick={handleAddEdge} style={{ width: "100%", backgroundColor: "#007bff", color: "white" }}>Ajouter l'arc</button>

          <h3 style={{ marginTop: "20px" }}>Modifier un poids</h3>
          <select onChange={(e) => { const i = parseInt(e.target.value); setEditingEdgeIndex(i); setEditingWeight(graph.edges[i]?.weight || ""); }} style={{ width: "100%", marginBottom: "5px" }}>
            <option value="">-- Choisir --</option>
            {graph.edges.map((e, i) => <option key={i} value={i}>{`x${e.from}→x${e.to} (${e.weight})`}</option>)}
          </select>
          {editingEdgeIndex !== null && (
            <>
              <input type="number" value={editingWeight} onChange={(e) => setEditingWeight(e.target.value)} style={{ width: "100%", marginBottom: "5px" }} />
              <button onClick={() => {
                const newEdges = [...graph.edges];
                newEdges[editingEdgeIndex].weight = parseInt(editingWeight);
                setGraph({ ...graph, edges: newEdges });
                setEditingEdgeIndex(null);
                findShortestPath();
                findLongestPath();
              }} style={{ width: "100%", backgroundColor: "#28a745", color: "white" }}>Appliquer</button>
            </>
          )}

          <button onClick={addNode} style={{ width: "100%", marginTop: "20px" }}>Ajouter un sommet</button>

          {result && (
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <h3>Résultat</h3>
              <p style={{ fontSize: "40px", color: "red" }}>
                <strong>
                  Z = {result.distance === Infinity ? "∞ (ignoré)" : result.distance}
                </strong>
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "5px" }}>
                {result.path.map((n, i) => (
                  <React.Fragment key={i}>
                    <div style={{ padding: "5px 10px", backgroundColor: "#eee", borderRadius: "50%" }}>x{n}</div>
                    {i < result.path.length - 1 && <span>→</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
        <div ref={containerRef} style={{ flex: 2, height: "600px", border: "3px solid green", backgroundColor: "ghostwhite" }}></div>
      </div>
    </div>
  );
}

export default App;
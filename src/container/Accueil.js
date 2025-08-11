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
  const styles = {
    container: {
      fontFamily: 'system-ui, sans-serif',
    },

    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 40px',
      backgroundColor: '#f4f4f4',
      borderTop: '4px solid green',
      borderBottom: '4px solid green',
    },

    headerLabel: {
      backgroundColor: 'forestgreen',
      color: 'white',
      padding: '20px',
      fontWeight: 'bold',
      borderRadius: '6px',
    },

    title: {
      color: 'red',
      fontSize: '40px',
      margin: 0,
    },

    main: {
      display: 'flex',
      gap: '40px',
      padding: '20px',
    },

    controls: {
      flex: 1,
    },

    controlsTitle: {
      marginTop: '20px',
      marginBottom: '10px',
    },

    input: {
      width: '100%',
      marginBottom: '10px',
    },

    button: {
      width: '100%',
      marginBottom: '10px',
    },

    buttonGreen: {
      backgroundColor: 'green',
      color: 'white',
    },

    buttonOrange: {
      backgroundColor: 'orange',
      color: 'black',
    },

    buttonBlue: {
      backgroundColor: '#007bff',
      color: 'white',
    },

    buttonApply: {
      backgroundColor: '#28a745',
      color: 'white',
    },

    select: {
      width: '100%',
      marginBottom: '5px',
    },

    result: {
      marginTop: '20px',
      textAlign: 'center',
    },

    resultDistance: {
      fontSize: '40px',
      color: 'red',
    },

    pathNode: {
      padding: '5px 10px',
      backgroundColor: '#eee',
      borderRadius: '50%',
    },

    pathWrapper: {
      display: 'flex',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: '5px',
    },

    graphContainer: {
      flex: 2,
      height: '600px',
      border: '3px solid green',
      backgroundColor: 'ghostwhite',
    },
  };
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

  // ----- Bellman-Ford pour chemin min -----
  const shortestPathBellmanFord = (g, start, end) => {
    const dist = {};
    const prev = {};
    g.nodes.forEach((n) => dist[n] = Infinity);
    dist[start] = 0;

    for (let i = 0; i < g.nodes.length - 1; i++) {
      g.edges.forEach(({ from, to, weight }) => {
        if (dist[from] + weight < dist[to]) {
          dist[to] = dist[from] + weight;
          prev[to] = from;
        }
      });
    }

    const path = [];
    let current = end;
    while (current !== undefined) {
      path.unshift(current);
      current = prev[current];
    }
    return { path, distance: dist[end] };
  };

  // ----- DFS pour chemin max sans cycle -----
  const longestPathDFS = (g, start, end) => {
    let bestPath = [];
    let bestDist = -Infinity;

    const adj = {};
    g.edges.forEach(({ from, to, weight }) => {
      if (!adj[from]) adj[from] = [];
      adj[from].push({ to, weight });
    });

    const dfs = (node, visited, path, dist) => {
      if (node === end) {
        if (dist > bestDist) {
          bestDist = dist;
          bestPath = [...path];
        }
        return;
      }
      if (!adj[node]) return;
      for (const { to, weight } of adj[node]) {
        if (!visited.has(to)) {
          visited.add(to);
          dfs(to, visited, [...path, to], dist + weight);
          visited.delete(to);
        }
      }
    };

    dfs(start, new Set([start]), [start], 0);
    return { path: bestPath, distance: bestDist };
  };

  const findShortestPath = () => {
    if (!graph.nodes.includes(startNode) || !graph.nodes.includes(endNode)) {
      alert("Sommets invalides !");
      return;
    }
    const res = shortestPathBellmanFord(graph, startNode, endNode);
    setResult(res);
    highlightPath(res.path);
  };

  const findLongestPath = () => {
    if (!graph.nodes.includes(startNode) || !graph.nodes.includes(endNode)) {
      alert("Sommets invalides !");
      return;
    }
    const res = longestPathDFS(graph, startNode, endNode);
    if (res.distance === -Infinity) {
      alert("⚠️ Aucun chemin trouvé.");
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
  }, [graph, positions]);

  return (
    <div className="container">
      {/* HEADER */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 40px", backgroundColor: "#f4f4f4", borderTop: "4px solid green", borderBottom: "4px solid green" }}>
        <div style={{ backgroundColor: "forestgreen", color: "white", padding: "20px", fontWeight: "bold", borderRadius: "6px" }}>RECHERCHE OPÉRATIONNELLE</div>
        <h1 style={{ color: "red", fontSize: "40px", margin: 0 }}>Algorithme de DANTZIG</h1>
        <div style={{ backgroundColor: "forestgreen", color: "white", padding: "20px", fontWeight: "bold", borderRadius: "6px" }}>RECHERCHE OPÉRATIONNELLE</div>
      </div>

      <div style={{ display: "flex", gap: "40px", padding: "20px" }}>
        {/* CONTROLES */}
        <div style={{ flex: 1 }}>
          <h3>Sommet de début & Finale :</h3>
          <label>Sommet de début :</label>
          <input type="number" value={startNode} onChange={(e) => setStartNode(parseInt(e.target.value))} style={{ width: "100%", marginBottom: "10px", height: "34px", background: "#f3f3f3", borderRadius: "15px", padding: "4px" }} />
          <label>Sommet Finale :</label>
          <input type="number" value={endNode} onChange={(e) => setEndNode(parseInt(e.target.value))} style={{ width: "100%", marginBottom: "10px", height: "34px", background: "#f3f3f3", borderRadius: "15px", padding: "4px" }} />
          <button onClick={findShortestPath} style={{ width: "100%", backgroundColor: "green", color: "white", marginBottom: "10px" }}>Chemin MIN</button>
          <button onClick={findLongestPath} style={{ width: "100%", backgroundColor: "orange", color: "black" }}>Chemin MAX</button>

          {/* AJOUT ARC */}
          <h3 style={{ marginTop: "20px" }}>Ajouter une relation :</h3>
          <input type="number" placeholder="Départ (Xa)" value={edgeFrom} onChange={(e) => setEdgeFrom(e.target.value)} style={{ width: "100%", marginBottom: "5px", height: "34px", background: "#f3f3f3", borderRadius: "15px", padding: "4px" }} />
          <input type="number" placeholder="Arrivée (Xb)" value={edgeTo} onChange={(e) => setEdgeTo(e.target.value)} style={{ width: "100%", marginBottom: "5px", height: "34px", background: "#f3f3f3", borderRadius: "15px", padding: "4px" }} />
          <input type="number" placeholder="Poids" value={edgeWeight} onChange={(e) => setEdgeWeight(e.target.value)} style={{ width: "100%", marginBottom: "5px", height: "34px", background: "#f3f3f3", borderRadius: "15px", padding: "4px" }} />
          <button onClick={handleAddEdge} style={{ width: "100%", backgroundColor: "#007bff", color: "white" }}>Ajouter l'arc</button>

          {/* MODIF ARC */}
          <h3 style={{ marginTop: "20px" }}>Modifier un poids :</h3>
          <select onChange={(e) => { const i = parseInt(e.target.value); setEditingEdgeIndex(i); setEditingWeight(graph.edges[i]?.weight || ""); }} style={{ width: "100%", marginBottom: "5px", height: "34px", background: "#f3f3f3", borderRadius: "15px", padding: "4px" }}>
            <option value="">-- Faire un modif --</option>
            {graph.edges.map((e, i) => <option key={i} value={i}>{`x${e.from}→x${e.to} (${e.weight})`}</option>)}
          </select>
          {editingEdgeIndex !== null && (
            <>
              <input type="number" value={editingWeight} onChange={(e) => setEditingWeight(e.target.value)} style={{ width: "100%", marginBottom: "5px", height: "34px", background: "#f3f3f3", borderRadius: "15px", padding: "4px" }} />
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

          {/* RESULTAT */}
          {result && (
            <div style={{ marginTop: "20px", textAlign: "center" }}>
              <h3>Résultat</h3>
              <p style={{ fontSize: "40px", color: "red", border: "3px solid red" }}>
                <strong>
                  Z = {result.distance === Infinity ? "∞" : result.distance}
                </strong>
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "5px" }}>
                {result.path.map((n, i) => (
                  <React.Fragment key={i}>
                    <div style={{ padding: "5px 10px", backgroundColor: "yellow", borderRadius: "50%", width: "34px", height: "34px", display: "flex", justifyContent: "center", alignItems: "center" }}>x{n}</div>
                    {i < result.path.length - 1 && <span style={{ marginTop: "10px" }}>→</span>}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* GRAPHE */}
        <div ref={containerRef} style={{ flex: 2, height: "600px", border: "3px solid green", backgroundColor: "ghostwhite" }}></div>
      </div>
    </div>
  );
}

export default App;

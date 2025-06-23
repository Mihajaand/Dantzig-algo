import React, { useState, useEffect, useRef } from "react";
import { Network } from "vis-network/standalone";
import '../container/accueil.css';
//import star from "d3-shape/src/symbol/star";

function App() {
   const [graph, setGraph] = useState({ nodes: [], edges: [] });
  const [positions, setPositions] = useState({});
  const [startNode, setStartNode] = useState(1);
  const [endNode, setEndNode] = useState(16);
  const [result, setResult] = useState(null);
  const [edgeFrom, setEdgeFrom] = useState("");
  const [edgeTo, setEdgeTo] = useState("");
  const [edgeWeight, setEdgeWeight] = useState("");
  const [detailedSteps, setDetailedSteps] = useState([]);
  const containerRef = useRef(null);
  const networkRef = useRef(null);
  const [showDetailedSteps, setShowDetailedSteps] = useState(false);

  const addNode = () => {
    const newNode = graph.nodes.length + 1;
    setGraph(prev => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));
    setPositions(prev => ({
      ...prev,
      [newNode]: { x: Math.random() * 400, y: Math.random() * 400 },
    }));
  };

  const handleAddEdge = () => {
    const from = parseInt(edgeFrom);
    const to = parseInt(edgeTo);
    const weight = parseInt(edgeWeight);
    if (isNaN(from) || isNaN(to) || isNaN(weight) || from === to) {
      alert("Veuillez entrer des valeurs valides !");
      return;
    }
    setGraph(prev => ({
      ...prev,
      edges: [...prev.edges, { from, to, weight }],
    }));
    setEdgeFrom("");
    setEdgeTo("");
    setEdgeWeight("");
  };

  const dantzig = (graph, startNode, endNode, isMax = false) => {
    let distances = {};
    let prevNodes = {};
    let unvisited = new Set(graph.nodes);
    let steps = [];
    const defaultVal = isMax ? -Infinity : Infinity;
    const comparator = isMax
      ? (a, b) => distances[a] > distances[b]
      : (a, b) => distances[a] < distances[b];

    graph.nodes.forEach(node => {
      distances[node] = defaultVal;
      prevNodes[node] = null;
    });
    distances[startNode] = 0;
    let E = new Set([startNode]);
    steps.push({
      k: 1,
      current: startNode,
      formula: `y${startNode} = 0`,
      lambda: 0,
      E: new Set(E)
    });
    let k = 2;

    while (unvisited.size > 0) {
      let current = [...unvisited].reduce((best, node) =>
        comparator(node, best) ? node : best
      );

      if (distances[current] === defaultVal) break;
      unvisited.delete(current);

      graph.edges
        .filter(edge => edge.from === current)
        .forEach(edge => {
          let newDist = distances[current] + edge.weight;
          if (
            (isMax && newDist > distances[edge.to]) ||
            (!isMax && newDist < distances[edge.to])
          ) {
            distances[edge.to] = newDist;
            prevNodes[edge.to] = current;

            // Ajouter uniquement les sommets reliés calculés
            E.add(edge.to);
            steps.push({
              k: k++,
              current: edge.to,
              formula: `y${edge.to} = y${current} + v(x${current},x${edge.to}) = ${distances[current]} + ${edge.weight} = ${distances[edge.to]}`,
              lambda: distances[edge.to],
              E: new Set(E)
            });
          }
        });

      if (current === endNode) break;
    }

    let path = [];
    let curr = endNode;
    while (curr !== null) {
      path.unshift(curr);
      curr = prevNodes[curr];
    }

    return { path, distance: distances[endNode], steps };
  };

  const findShortestPath = () => {
    if (!graph.nodes.includes(startNode) || !graph.nodes.includes(endNode)) {
      alert("Les sommets doivent exister avant de continuer !");
      return;
    }
    const res = dantzig(graph, startNode, endNode, false);
    setResult(res);
    const highlighted = graph.edges.map(edge => ({
      ...edge,
      color: res.path.includes(edge.from) && res.path.includes(edge.to) ? "red" : "black",
    }));
    setGraph(prev => ({ ...prev, edges: highlighted }));
    setDetailedSteps(res.steps);
  };

  const findLongestPath = () => {
    if (!graph.nodes.includes(startNode) || !graph.nodes.includes(endNode)) {
      alert("Les sommets doivent exister avant de continuer !");
      return;
    }
    const res = dantzig(graph, startNode, endNode, true);
    setResult(res);
    const highlighted = graph.edges.map(edge => ({
      ...edge,
      color: res.path.includes(edge.from) && res.path.includes(edge.to) ? "red" : "black",
    }));
    setGraph(prev => ({ ...prev, edges: highlighted }));
    setDetailedSteps(res.steps);
  };

  useEffect(() => {
    if (!containerRef.current) return;
    const nodes = graph.nodes.map(node => ({
      id: node,
      label: `x${node}`,
      x: positions[node]?.x || 0,
      y: positions[node]?.y || 0,
      fixed: false,
      color: "yellow",
      physics: false,
    }));
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
        font: { size: 13, align: "middle", color: "#000000", background: "#F8F8FF" },
        smooth: true,
      },
      physics: true,
    };
    if (networkRef.current) {
      networkRef.current.setData(data);
    } else {
      networkRef.current = new Network(containerRef.current, data, options);
    }
    networkRef.current.on("dragEnd", params => {
      const newPos = { ...positions };
      params.nodes.forEach(nodeId => {
        const pos = networkRef.current.getPositions([nodeId])[nodeId];
        newPos[nodeId] = { x: pos.x, y: pos.y };
      });
      setPositions(newPos);
    });
  }, [graph]);

  return (
      <div className="container">
        <div style={{display:"flex", flexDirection:"grid", alignItems:"center", alignContent:"center", borderTop:"1px solid green", borderBottom:"1px solid green"}}>
            <div style={{background: "forestgreen", width: "300px"}}>
                <h2 style={{textDecoration: "uppercase", color: "white",}}>RECHERCHE OPERATIONNELLE</h2>
             </div>
            <h1 style={{color: "red", font: "Roboto", padding:"0px 400px 0px 495px"}}>Algorithme de DANTZIG</h1>
            <div style={{background: "forestgreen", width: "300px"}}>
            <h2 style={{textDecoration: "uppercase", color: "white"}}>RECHERCHE OPERATIONNELLE</h2>
          </div>
          
        </div>
       
          <div style={{display:"flex", flexDirection:"grid", alignItems:"flex-end"}}>
            
              <div className="champ">
                  <div style={{marginTop: "20px"}}>
                      <h3>Veuillez inserer les valeurs du sommet initial et final du Graphe :</h3>
                      <div className="form">
                          <label style={{paddingRight: "10px"}}>- Valeur du sommet initial ( Xi ) :</label>
                          <input style={{marginBottom: "10px"}} type="number" placeholder="initiale ( Xi )"
                                 value={startNode}
                                 onChange={(e) => setStartNode(parseInt(e.target.value))}/> <br/>
                          <label style={{paddingRight: "10px"}}>- Valeur du sommet finale ( Xn) :</label>
                          <input type="number" placeholder="finale ( Xn )" value={endNode}
                                 onChange={(e) => setEndNode(parseInt(e.target.value))}/> <br/>
                          <button style={{backgroundColor: "green"}} onClick={findShortestPath}>Trouver le chemin MINIMALE</button>
                          <button style={{marginLeft: "40px", backgroundColor: "orange"}}
                                  onClick={findLongestPath}>Trouver le chemin MAXIMALE
                          </button>

                      </div>
                  </div>
                  <div style={{marginTop: "20px"}}>
                      <h3>Ajouter une Relation entre deux sommet du Graphe : </h3>
                      <div className="form">
                          <label style={{paddingRight: "10px"}}>- Valeur du sommet de départ ( Xa ) :</label>
                          <input style={{marginBottom: "10px"}} type="number" placeholder="début de la relation"
                                 value={edgeFrom}
                                 onChange={(e) => setEdgeFrom(e.target.value)}/> <br/>
                          <label style={{paddingRight: "10px"}}>- Valeur du sommet d'arriver ( .Xb ) :</label>
                          <input style={{marginBottom: "10px"}} type="number" placeholder="arrivé de la relation"
                                 value={edgeTo}
                                 onChange={(e) => setEdgeTo(e.target.value)}/> <br/>
                          <label style={{paddingRight: "10px"}}>- Valeur du relation des 2 sommets :</label>
                          <input type="number" placeholder="Valeur de la relation" value={edgeWeight}
                                 onChange={(e) => setEdgeWeight(e.target.value)}/> <br/>

                          <button  onClick={handleAddEdge}>Faire la relation des 2 sommets</button>
                      </div>
                  </div>


                  <button style={{marginTop: "40px"}} onClick={addNode}>Ajouter un nouveau
                      sommet
                  </button>

                  {result && (
                      <div className="resutat" style={{marginTop: "20px", textAlign: "center"}}>
                          <h3 style={{fontSize: "30px", textDecorationLine: "none"}}>Résultat :</h3>
                          <p style={{fontSize: "50px",color:"red"}}><strong>Z =</strong> <span
                              style={{fontSize: "70px",color:"red"}}>{result.distance}</span></p>
                          <strong style={{marginTop: "50px"}}>CHEMIN OPTIMALE :</strong>
                          <div className="path-container">
                              {result.path.map((node, index) => (
                                  <React.Fragment key={index}>
                                      <div className="circle">X{node}</div>

                                      {index < result.path.length - 1 && <span className="arrow">---→</span>}
                                  </React.Fragment>
                              ))}
                          </div>
                      </div>
                  )}
              </div>

              {detailedSteps.length > 0 && (
                  <div style={{marginTop: "20px", width:"100%"}}>
                      <button class="test" style={{backgroundColor: "yellow", color:"black", fontSize:"20px", width:"100%"}} onClick={() => setShowDetailedSteps(!showDetailedSteps)}>
                          {showDetailedSteps ? "V" : "Voir les calculs détaillés ^"}
                      </button>
                      {showDetailedSteps && (
                          <div style={{backgroundColor:"yellow", marginTop:"0px", borderBottomRightRadius:"20px",borderTopRightRadius:"0px", paddingTop:"10px"}}>
                              <p style={{fontStyle:"italic"}}>
                                  à tout sommet Xi £ E(k) on associe le sommet Xi* non £ E(k), tel que v( Xi,Xi* ) soit minimal; <br/>
                                  On détermine le sommet à marquer Xp*, tel que λp + v(Xp, Xp*) = min [λi+ v( Xi , Xi* )]
                              </p>
                              <ul style={{display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "20px"}}
                                  className="step-list">
                                  {/* Première étape avec λ1 et E1 */}
                                  <p className="step-item">
                                      {/* <strong>k = 0 :</strong> <br/> */}
                                      <span style={{color: "red"}}>
                                       <strong>λ1 =</strong> 0 <br/>
                                      </span>
                                      <strong>E1 =</strong> {'{ x1 }'} {/* Correction de l'ensemble E1 */}
                                  </p>

                                  {/* Étapes suivantes */}
                                  {detailedSteps.slice(1).map((step, index) =>   (
                                      <p key={index + 1} className="step-item">
                                          {/* <strong>k = {index + 1} :</strong> v({`x${index + 1}` + "" + "," + "" + `x${index + 2}`}) <br/> */}
                                          <span style={{color:"red"}}>
                                           <strong>λ{index + 2} =</strong> λ{index + 1} + v({`x${index + 1}` + "" +"," + "" + `x${index + 2}`})
                                          = {step.lambda}
                                          </span>
                                           <br/>
                                          <strong>E{index + 2} =</strong> {'{' + "x" + [...(step.E || [])].join(',x') + '}'} {/* Ensure step.E is iterable */}
                                      </p>
                                  ))}
                              </ul>
                          </div>
                      )}
                  </div>
              )}
          </div>


          <div ref={containerRef}
               style={{height: "900px", border: "3px solid green", marginTop: "20px", backgroundColor: "ghostwhite", boxShadow:"inset -10px -10px 100px rgba(0, 255, 0, 0.3)"}}/>





      </div>
  );
}

export default App;

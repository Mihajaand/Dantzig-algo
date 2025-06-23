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
  const [detailedSteps, setDetailedSteps] = useState([]); // Pour stocker les étapes détaillées
  const [lambda, setLambda] = useState({ 1: 0 }); // Initialisation λ1=0
  const [E, setE] = useState(new Set([1])); // Initialisation E1={X1}
  const [k, setK] = useState(1); // itération initiale
  const [showDetailedSteps, setShowDetailedSteps] = useState(false);
  const containerRef = useRef(null);
  const networkRef = useRef(null);

  const addNode = () => {
    const newNode = graph.nodes.length + 1;
    setGraph((prev) => ({
      ...prev,
      nodes: [...prev.nodes, newNode],
    }));

    setPositions((prev) => ({
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

    setGraph((prev) => ({
      ...prev,
      edges: [...prev.edges, { from, to, weight }],
    }));

    setEdgeFrom("");
    setEdgeTo("");
    setEdgeWeight("");
  };

  // Algorithme dantzing avec mise à jour de λ et E
  const dantzing = (graph, startNode, endNode) => {
    let distances = {};
    let prevNodes = {};
    let unvisited = new Set(graph.nodes);
    let steps = []; // Pour les étapes détaillées

    graph.nodes.forEach((node) => {
      distances[node] = Infinity;
      prevNodes[node] = null;
    });
    distances[startNode] = 0;

    while (unvisited.size > 0) {
      let currentNode = [...unvisited].reduce((minNode, node) =>
          distances[node] < distances[minNode] ? node : minNode
      );

      // Mise à jour de λ et E à chaque étape
      if (currentNode === startNode) {
        steps.push({
          k,
          currentNode,
          lambda: distances[currentNode],
          E: new Set([startNode]),
        });
      } else {
        let vX1X2 = graph.edges.find(edge => edge.from === currentNode)?.weight || 0;
        let newLambda = distances[currentNode] + vX1X2;
        setLambda(prevLambda => ({ ...prevLambda, [currentNode]: newLambda }));
        E.add(currentNode); // Ajouter à l'ensemble E
        steps.push({
          k: k + 1,
          currentNode,
          lambda: newLambda,
          E: new Set([...E]),
        });
        setE(new Set([...E]));
        setK(k + 1);
      }

      if (currentNode === endNode) break;
      unvisited.delete(currentNode);

      graph.edges
          .filter((edge) => edge.from === currentNode)
          .forEach((edge) => {
            let newDistance = distances[currentNode] + edge.weight;
            if (newDistance < distances[edge.to]) {
              distances[edge.to] = newDistance;
              prevNodes[edge.to] = currentNode;
            }
          });
    }

    let path = [];
    let current = endNode;
    while (current !== null) {
      path.unshift(current);
      current = prevNodes[current];
    }

    return { path, distance: distances[endNode], steps };
  };
    const dantzigMax = (graph, startNode, endNode) => {
        let distances = {};
        let prevNodes = {};
        let unvisited = new Set(graph.nodes);
        let steps = [];

        graph.nodes.forEach(node => {
            distances[node] = -Infinity;
            prevNodes[node] = null;
        });
        distances[startNode] = 0;

        while (unvisited.size > 0) {
            let current = [...unvisited].reduce((maxNode, node) =>
                distances[node] > distances[maxNode] ? node : maxNode
            );
// Mise à jour de λ et E à chaque étape
if (current === startNode) {
  steps.push({
    k,
    current,
    lambda: distances[current],
    E: new Set([startNode]),
  });
} 
else {
  let vX1X2 = graph.edges.find(edge => edge.from === current)?.weight || 0;
  let newLambda = distances[current] + vX1X2;
  setLambda(prevLambda => ({ ...prevLambda, [current]: newLambda }));
  E.add(current); // Ajouter à l'ensemble E
  steps.push({
    k: k + 1,
    current,
    lambda: newLambda,
    E: new Set([...E]),
  });
  setE(new Set([...E]));
  setK(k + 1);
}
            
            if (distances[current] === -Infinity) break;
            unvisited.delete(current);

            graph.edges
                .filter(edge => edge.from === current)
                .forEach(edge => {
                    let newDist = distances[current] + edge.weight;
                    if (newDist > distances[edge.to]) {
                        distances[edge.to] = newDist;
                        prevNodes[edge.to] = current;
                    }
                });

            steps.push({ current, distances: { ...distances }, prevNodes: { ...prevNodes } });
        }

        let path = [];
        let current = endNode;
        while (current !== null) {
            path.unshift(current);
            current = prevNodes[current];
        }

        return { path, distance: distances[endNode], steps };
    };


    const findShortestPath = () => {
    if (!graph.nodes.includes(startNode) || !graph.nodes.includes(endNode)) {
      alert("Les sommets doivent exister avant de continuer !");
      return;
    }
    const res = dantzing(graph, startNode, endNode);
    setResult(res);

    // Mise en évidence du chemin trouvé en rouge
    const highlightedEdges = graph.edges.map((edge) => ({
      ...edge,
      color: res.path.includes(edge.from) && res.path.includes(edge.to) ? "red" : "black",
    }));

    setGraph((prev) => ({ ...prev, edges: highlightedEdges }));
    setDetailedSteps(res.steps); // Mettre à jour les étapes détaillées
  };
  const findLongestPath = () => {
      if (!graph.nodes.includes(startNode) || !graph.nodes.includes(endNode)) {
          alert("Les sommets doivent exister avant de continuer !");
          return;
      }
      const res = dantzigMax(graph, startNode, endNode);
      setResult(res);

      const highlightedEdges = graph.edges.map((edge) => ({
          ...edge,
          color: res.path.includes(edge.from) && res.path.includes(edge.to) ? "red" : "black",
      }));
      setGraph((prev) => ({ ...prev, edges: highlightedEdges }));
      setDetailedSteps(res.steps); // Mettre à jour les étapes détaillées


  }

  useEffect(() => {
    if (!containerRef.current) return;

    const nodes = graph.nodes.map((node) => ({
      id: node,
      label: `x${node}`,
      x: positions[node]?.x || 0,
      y: positions[node]?.y || 0,
      fixed: false,
        color:"yellow",
        border:"1px dashed black",
      physics: false,
    }));

    const edges = graph.edges.map((edge, index) => ({
      id: index,
      from: edge.from,
      to: edge.to,
      label: `${edge.weight}`,
      color: { color: edge.color || "black" }, // Appliquer la couleur des arêtes
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

    networkRef.current.on("dragEnd", function (params) {
      let newPositions = { ...positions };
      params.nodes.forEach((nodeId) => {
        let pos = networkRef.current.getPositions([nodeId])[nodeId];
        newPositions[nodeId] = { x: pos.x, y: pos.y };
      });
      setPositions(newPositions);
    });

    // networkRef.current.on("click", function (params) {
    //   if (params.edges.length > 0) {
    //     const edgeId = params.edges[0];
    //     const selectedEdge = graph.edges[edgeId];

    //     if (selectedEdge) {
    //       const newWeight = prompt("Entrez un nouveau poids :", selectedEdge.weight);
    //       if (newWeight !== null && !isNaN(newWeight)) {
    //         const updatedEdges = graph.edges.map((edge, index) =>
    //             index === edgeId ? { ...edge, weight: parseInt(newWeight) } : edge
    //         );
    //         setGraph((prev) => ({ ...prev, edges: updatedEdges }));
    //       }
    //     }
    //   }
    // });
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

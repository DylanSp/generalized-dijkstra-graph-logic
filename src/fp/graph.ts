import { Edge, EdgeBlueprint, incrementEdgeID, isoEdgeID, Tuple, Vertex, VertexID } from "../types";

export interface Graph<WeightDimensions extends number> {
  vertices: Array<Vertex>;
  edges: Array<Edge<WeightDimensions>>;
}

export const createGraph = <WeightDimensions extends number>(
  vertices: Array<VertexID>,
  edges: Array<EdgeBlueprint<WeightDimensions>>,
): Graph<WeightDimensions> => {
  // consistency check
  for (const edgeBlueprint of edges) {
    if (!vertices.includes(edgeBlueprint.vertex1)) {
      throw new Error(`Vertex ${edgeBlueprint.vertex1} is not in the provided array of vertices`);
    }

    if (!vertices.includes(edgeBlueprint.vertex2)) {
      throw new Error(`Vertex ${edgeBlueprint.vertex2} is not in the provided array of vertices`);
    }
  }

  const graph: Graph<WeightDimensions> = {
    vertices: vertices.map((vertexID) => ({ id: vertexID })),
    edges: [],
  };

  let edgeID = isoEdgeID.wrap(0);
  for (const edgeBlueprint of edges) {
    const newEdge: Edge<WeightDimensions> = {
      id: edgeID,
      ...edgeBlueprint,
    };
    graph.edges.push(newEdge);
    edgeID = incrementEdgeID(edgeID);
  }

  return graph;
};

export const getEdge = <WeightDimensions extends number>(
  graph: Graph<WeightDimensions>,
  vertex1: VertexID,
  vertex2: VertexID,
): Edge<WeightDimensions> | undefined => {
  return graph.edges.find((edge) => {
    return (
      (edge.vertex1 === vertex1 && edge.vertex2 === vertex2) || (edge.vertex1 === vertex2 && edge.vertex2 === vertex1)
    );
  });
};

export interface Connection<WeightDimensions extends number> {
  otherVertex: VertexID;
  weight: Tuple<number, WeightDimensions>;
}

export const findNeighbors = <WeightDimensions extends number>(
  graph: Graph<WeightDimensions>,
  vertexID: VertexID,
): Set<Connection<WeightDimensions>> => {
  if (!graph.vertices.some((vertex) => vertex.id === vertexID)) {
    throw new Error(`Vertex ${vertexID} not found in graph`);
  }

  const neighbors = new Set<Connection<WeightDimensions>>();
  for (const edge of graph.edges) {
    if (edge.vertex1 === vertexID) {
      neighbors.add({
        otherVertex: edge.vertex2,
        weight: edge.weight,
      });
    } else if (edge.vertex2 === vertexID) {
      neighbors.add({
        otherVertex: edge.vertex1,
        weight: edge.weight,
      });
    }
  }
  return neighbors;
};

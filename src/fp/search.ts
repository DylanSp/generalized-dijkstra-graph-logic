import { filter } from "fp-ts/lib/Set";
import { Connection, findNeighbors, getEdge, Graph } from "./graph";
import { Edge, Tuple, VertexID } from "../types";

export type Path<WeightDimensions extends number> = Array<Edge<WeightDimensions>>;

const convertVertexListToPath = <WeightDimensions extends number>(
  graph: Graph<WeightDimensions>,
  vertices: Array<VertexID>,
): Path<WeightDimensions> => {
  if (vertices.length === 0 || vertices.length === 1) {
    return [];
  }

  const edge = getEdge(graph, vertices[0], vertices[1]);
  if (edge === undefined) {
    throw new Error(`Vertices ${vertices[0]} and ${vertices[1]} are not connected!`);
  }

  return [edge].concat(convertVertexListToPath(graph, vertices.slice(1)));
};

export const getTotalWeightOfPath = <WeightDimensions extends number>(
  path: Path<WeightDimensions>,
): Tuple<number, WeightDimensions> => {
  // TODO - not really an error, but without being able to reference an edge, we can't create a WeightDimensions-length tuple of all 0's at runtime
  if (path.length === 0) {
    throw new Error("Empty path");
  }

  let totalWeight = path[0].weight;
  for (let i = 1; i < path.length; i++) {
    for (let dimension = 0; dimension < path[i].weight.length; dimension++) {
      totalWeight[dimension] += path[i].weight[dimension];
    }
  }

  return totalWeight;
};

// TODO - if used in generalized Dijkstra, add WeightDimensions type parameter, make totalDistance a Tuple<number, WeightDimensions>
interface HopFromSource {
  previousVertex?: VertexID;
  totalDistance: number;
}

// taken from https://en.wikipedia.org/wiki/Dijkstra's_algorithm#Pseudocode
// TODO - currently finds *one* path, not all such paths
export const textbookDijkstra = (graph: Graph<1>, startVertex: VertexID, endVertex: VertexID): Path<1> => {
  if (graph.vertices.length === 0) {
    throw new Error("No vertices exist");
  }

  if (graph.vertices.find((vertex) => vertex.id === startVertex) === undefined) {
    throw new Error(`Starting vertex ${startVertex} not in graph`);
  }

  if (graph.vertices.find((vertex) => vertex.id === endVertex) === undefined) {
    throw new Error(`Ending vertex ${endVertex} not in graph`);
  }

  // TODO - only necessary because we're constructing general map of distances
  // TODO - if we don't need that, use startVertex instead
  const initialVertex = graph.vertices[0];

  const unvisitedVertices = new Set<VertexID>(graph.vertices.map((vertex) => vertex.id));
  const tentativeDistances = new Map<VertexID, HopFromSource>();
  tentativeDistances.set(initialVertex.id, {
    totalDistance: 0,
  });
  for (let i = 1; i < graph.vertices.length; i++) {
    tentativeDistances.set(graph.vertices[i].id, {
      totalDistance: Number.MAX_SAFE_INTEGER,
    });
  }

  let currentVertex = initialVertex.id;
  while (unvisitedVertices.size > 0) {
    const currentDistance = tentativeDistances.get(currentVertex)!.totalDistance;
    const connections = findNeighbors(graph, currentVertex);
    const unvisitedConnections = filter<Connection<1>>((connection) => unvisitedVertices.has(connection.otherVertex))(
      connections,
    );
    for (const connection of unvisitedConnections) {
      const distanceThroughCurrent = currentDistance + connection.weight[0];
      if (distanceThroughCurrent < tentativeDistances.get(connection.otherVertex)!.totalDistance) {
        tentativeDistances.set(connection.otherVertex, {
          totalDistance: distanceThroughCurrent,
          previousVertex: currentVertex,
        });
      }
    }
    unvisitedVertices.delete(currentVertex);

    const remainingVerticesByWeight = [...unvisitedVertices].sort((vertex1, vertex2) => {
      const vertex1Distance = tentativeDistances.get(vertex1)!.totalDistance;
      const vertex2Distance = tentativeDistances.get(vertex2)!.totalDistance;
      return vertex1Distance - vertex2Distance;
    });
    if (remainingVerticesByWeight.length !== 0) {
      currentVertex = remainingVerticesByWeight[0];
    }
  }

  const path: Path<1> = [];
  let reverseTraversalCurrentNode = endVertex;
  while (reverseTraversalCurrentNode !== startVertex) {
    const previousNode = tentativeDistances.get(reverseTraversalCurrentNode)!;

    if (previousNode.previousVertex === undefined && reverseTraversalCurrentNode !== startVertex) {
      throw new Error(`No path from starting vertex ${startVertex} to ending vertex ${endVertex}`);
    }
    const pathBackwards: Edge<1> = getEdge(graph, previousNode.previousVertex!, reverseTraversalCurrentNode)!;
    path.unshift(pathBackwards);

    reverseTraversalCurrentNode = previousNode.previousVertex!;
  }

  return path;
};

// taken from https://www.baeldung.com/cs/simple-paths-between-two-vertices#2-implementation
export const findAllPaths = <WeightDimensions extends number>(
  graph: Graph<WeightDimensions>,
  startVertex: VertexID,
  endVertex: VertexID,
): Set<Path<WeightDimensions>> => {
  const allPaths = new Set<Path<WeightDimensions>>();
  const visitedVertices = new Set<VertexID>();
  let currentVertexPath: Array<VertexID> = [];

  const depthFirstTraversal = (startVertex: VertexID, endVertex: VertexID) => {
    if (visitedVertices.has(startVertex)) {
      return;
    }

    visitedVertices.add(startVertex);
    currentVertexPath.push(startVertex);
    if (startVertex === endVertex) {
      allPaths.add(convertVertexListToPath(graph, currentVertexPath));
      visitedVertices.delete(startVertex);
      currentVertexPath = currentVertexPath.slice(0, -1);
      return;
    }

    const connections = findNeighbors(graph, startVertex);
    for (const connection of connections) {
      depthFirstTraversal(connection.otherVertex, endVertex);
    }

    currentVertexPath = currentVertexPath.slice(0, -1);
    visitedVertices.delete(startVertex);
  };

  depthFirstTraversal(startVertex, endVertex);
  return allPaths;
};

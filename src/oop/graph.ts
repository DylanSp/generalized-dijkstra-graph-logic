import { Edge, EdgeBlueprint, incrementEdgeID, isoEdgeID, Tuple, Vertex, VertexID } from "../types";

export class Graph<WeightDimensions extends number> {
  private vertices: Array<Vertex>;
  private edges: Array<Edge<WeightDimensions>>;

  constructor(vertices: Array<VertexID>, edges: Array<EdgeBlueprint<WeightDimensions>>) {
    // consistency check
    for (const edgeBlueprint of edges) {
      if (!vertices.includes(edgeBlueprint.vertex1)) {
        throw new Error(`Vertex ${edgeBlueprint.vertex1} is not in the provided array of vertices`);
      }

      if (!vertices.includes(edgeBlueprint.vertex2)) {
        throw new Error(`Vertex ${edgeBlueprint.vertex2} is not in the provided array of vertices`);
      }
    }

    this.vertices = vertices.map((vertexID) => ({ id: vertexID }));

    this.edges = [];
    let edgeID = isoEdgeID.wrap(0);
    for (const edgeBlueprint of edges) {
      const newEdge: Edge<WeightDimensions> = {
        id: edgeID,
        ...edgeBlueprint,
      };
      this.edges.push(newEdge);
      edgeID = incrementEdgeID(edgeID);
    }
  }

  public findEdge = (vertex1: VertexID, vertex2: VertexID): Edge<WeightDimensions> | undefined => {
    return this.edges.find((edge) => {
      return (
        (edge.vertex1 === vertex1 && edge.vertex2 === vertex2) || (edge.vertex1 === vertex2 && edge.vertex2 === vertex1)
      );
    });
  };
}

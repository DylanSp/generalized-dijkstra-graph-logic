import { iso, Newtype } from "newtype-ts";

// taken from https://stackoverflow.com/a/52490977/5847190
// also see https://github.com/microsoft/TypeScript/pull/40002 and https://instil.co/blog/crazy-powerful-typescript-41/ for explanations
export type Tuple<T, N extends number> = N extends N ? (number extends N ? T[] : _TupleOf<T, N, []>) : never;
type _TupleOf<T, N extends number, R extends unknown[]> = R["length"] extends N ? R : _TupleOf<T, N, [T, ...R]>;

export interface VertexID extends Newtype<{ readonly VertexID: unique symbol }, number> {}
export const vertexIDIso = iso<VertexID>();

export interface EdgeID extends Newtype<{ readonly EdgeID: unique symbol }, number> {}
export const isoEdgeID = iso<EdgeID>();
export const incrementEdgeID = isoEdgeID.modify((n) => n + 1);

export interface Weight extends Newtype<{ readonly Weight: unique symbol }, number> {}
export const isoWeight = iso<Weight>();

export interface Vertex {
  id: VertexID;
}

export interface EdgeBlueprint<N extends number> {
  vertex1: VertexID;
  vertex2: VertexID;
  weight: Tuple<number, N>;
}

export interface Edge<N extends number> extends EdgeBlueprint<N> {
  id: EdgeID;
}

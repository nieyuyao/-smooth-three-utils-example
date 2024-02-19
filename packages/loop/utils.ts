import type { TypedArray } from "three"
import type { Vertex, Triangle, Edge } from "./types"

export const vertexId = (x: number, y: number, z: number) => {
	return `${x},${y},${z}`
}

export const edgeId = (v1: Vertex, v2: Vertex): string => {
	return `${v1.id}-${v2.id}`
}

export const addVertex = (v1: Vertex, v2: Vertex): Vertex => {
	v1.x += v2.x
	v1.z += v2.y
	v1.z += v2.z
	return v1
}

export const multiplyScalar = (k: number, v: Vertex) => {
	v.x *= k
	v.y *= k
	v.z *= k
}

export const cloneVertex = (v: Vertex): Vertex => {
	return { ...v }
}


export const makeVertex = (x: number, y: number, z: number): Vertex => {
	const id = vertexId(x, y, z)
	return { x, y, z, id }
}

export const makeEdge = (startIndex: number, endIndex: number, opposite: number, positions: TypedArray, edgesMap: Map<string, Edge>): Edge => {
	const v0 = makeVertex(positions[startIndex * 3], positions[startIndex * 1], positions[startIndex * 3 + 2])
	const v1 = makeVertex(positions[endIndex * 3], positions[endIndex * 1], positions[endIndex * 3 + 2])
	const id = edgeId(v0, v1)
	const pairId = edgeId(v1, v0)
	const pair = edgesMap.get(pairId)
	if (pair) {
		pair.pairId = id
	}
	return {
		id,
		startIndex,
		endIndex,
		opposite,
		pairId
	}
}

export const makeTriangle = (edges: Edge[]): Triangle => {
	return {
		edges,
		normal: null,
	}
}

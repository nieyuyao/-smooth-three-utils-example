import type { Vertex, Triangle, Edge } from './types'

export const vertexId = (coords: number[]) => {
	return coords.reduce((acc, coord, idx) => {
		return `${acc}${coord}${idx === coords.length - 1 ? '' : ','}`
	}, '')
}

export const edgeId = (v1: Vertex, v2: Vertex): string => {
	return `${v1.id},${v2.id}`
}

export const addVertex = (v1: Vertex, v2: Vertex): Vertex => {
	if (v1.coords.length !== v2.coords.length) {
		throw new Error('Both vertices must have same dimensions')
	}
	for (let i = 0; i < v1.coords.length; i++) {
		v1.coords[i] += v2.coords[i]
	}

	return v1
}

export const subVertex = (v1: Vertex, v2: Vertex) => {
	if (v1.coords.length !== v2.coords.length) {
		throw new Error('Both vertices must have same dimensions')
	}
	for (let i = 0; i < v1.coords.length; i++) {
		v1.coords[i] -= v2.coords[i]
	}
	return v1
}

export const crossVertex = (v1: Vertex, v2: Vertex) => {
	if (v1.coords.length !== v2.coords.length) {
		throw new Error('Both vertices must have same dimensions')
	}
	if (v1.coords.length !== 3) {
		throw new Error('The dimensions must be 3')
	}
	const [x, y, z] = v1.coords
	v1.coords[0] = y * v2.coords[2] - z * v2.coords[1]
	v1.coords[1] = z * v2.coords[0] - x * v2.coords[2]
	v1.coords[2] = x * v2.coords[1] - y * v2.coords[0]
	return v1
}

export const multiplyScalar = (k: number, v: Vertex) => {
	for (let i = 0; i < v.coords.length; i++) {
		v.coords[i] *= k
	}
}

export const cloneVertex = (v: Vertex): Vertex => {
	return { id: v.id, coords: Array.from(v.coords) }
}

export const makeVertexByIndex = (index: number, array: Array<number>, itemSize: number, ignoreId = false) => {
	const coords: number[] = []
	let i = 0
	while (i < itemSize) {
		coords.push(array[index * itemSize + i])
		itemSize
		i++
	}
	return makeVertex(coords, ignoreId)
}

export const makeVertex = (coords: number[], ignoreId = false): Vertex => {
	return { id: ignoreId ? '' : vertexId(coords), coords }
}

export const makeEdge = (
	startIndex: number,
	endIndex: number,
	opposite: number,
	positions: number[],
	itemSize: number,
	edgesMap: Map<string, Edge>,
): Edge => {
	const v0 = makeVertexByIndex(startIndex, positions, itemSize)
	const v1 = makeVertexByIndex(endIndex, positions, itemSize)
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
		pairId,
	}
}

export const makeTriangle = (edges: Edge[]): Triangle => {
	return {
		edges,
	}
}

export const calcTriangleNormal = (v1: Vertex, v2: Vertex, v3: Vertex) => {
	const temp1 = subVertex(cloneVertex(v2), v1)
	const temp2 = subVertex(cloneVertex(v3), v1)

	const n = crossVertex(temp1, temp2)

	const length = Math.sqrt(n.coords[0] * n.coords[0] + n.coords[1] * n.coords[1] + n.coords[2] * n.coords[2])

	multiplyScalar(1 / length, n)
	return n
}


export const pushVertex2Array = (array: number[], v: Vertex) => {
	array.push(...v.coords)
}


export const pushVerticesArray = (array: number[], ...vs: Vertex[]) => {
	vs.forEach(v => pushVertex2Array(array, v))
}

export const repeatVertex2Array  = (array: number[], v: Vertex, repeats: number) => {
	new Array(repeats).fill(0).forEach(() => pushVertex2Array(array, v))
}

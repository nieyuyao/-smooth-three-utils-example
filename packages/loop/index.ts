import { TypedArray, type BufferGeometry } from 'three'
import type { LoopParams, Vertex, Triangle, Edge } from './types'
import { makeVertex, addVertex, multiplyScalar, makeTriangle, makeEdge } from './utils'

const getPositions = (geo: BufferGeometry) => {
	return geo.getAttribute('position').array
}

class Loop {
	neighbors = new Map<string, number[]>()

	edgesMap = new Map<string, Edge>()

	triangles: Triangle[] = []

	newVertices = new Map<string, Vertex>()

	getNeighbors(vertexId: string): number[] {
		const neighbors = this.neighbors.get(vertexId) ?? []
		const already = new Map<number, boolean>()
		return neighbors.filter((i) => {
			if (already.has(i)) {
				return false
			}
			already.set(i, true)
			return true
		})
	}

	addNeighbors(vertexId: string, ...newNeighbors: number[]) {
		this.neighbors.get(vertexId)?.push(...newNeighbors)
	}

	// 获取BufferGeometry中所有的三角形
	getTriangles(geo: BufferGeometry) {
		const positions = getPositions(geo)
		const vertexCount = positions.length / 3
		// 三角形
		for (let i = 0; i < vertexCount; i += 3) {
			/**
			 *     v0
			 *    /  \
			 * 	v1 —— v2
			 */
			const v0 = makeVertex(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2])
			const v1 = makeVertex(positions[(i + 1) * 3], positions[(i + 1) * 3 + 1], positions[(i + 1) * 3 + 2])
			const v2 = makeVertex(positions[(i + 2) * 3], positions[(i + 2) * 3 + 1], positions[(i + 2) * 3 + 2])
			const vertices: Vertex[] = []
			vertices.push(v0, v1, v2)

			const edges: Edge[] = []

			const e0 = makeEdge(i, i + 1, i + 2, positions, this.edgesMap)
			const e1 = makeEdge(i + 1, i + 2, i, positions, this.edgesMap)
			const e2 = makeEdge(i + 2, i, i + 1, positions, this.edgesMap)
			edges.push(e0, e1, e2)

			this.addNeighbors(v0.id, i + 1, i + 2)
			this.addNeighbors(v1.id, i, i + 2)
			this.addNeighbors(v2.id, i, i + 1)

			this.edgesMap.set(e0.id, e0)
			this.edgesMap.set(e1.id, e1)
			this.edgesMap.set(e2.id, e2)

			const triangle = makeTriangle(edges)
			this.triangles.push(triangle)
		}
	}

	createVertexByIndex(index: number, positions: TypedArray | Array<number>) {
		return makeVertex(
			positions[index * 3],
			positions[index * 3 + 1],
			positions[index * 3 + 2]
		)
	}

	addNewVertices(geo: BufferGeometry) {
		let i = 0
		const positions = getPositions(geo)
		while (i < this.triangles.length) {
			const triangle = this.triangles[i]
			const { edges } = triangle
			/**
			 *      v0
			 *    /     \
			 * 	new			new
			 *  /          \
			 * v1 —— new —— v2
			 */
			for (let j = 0; j < edges.length; j++) {
				const e = edges[j]
				const pair = this.edgesMap.get(e.pairId)
				const edgePoint = this.createVertexByIndex(e.startIndex, positions)
				addVertex(
					edgePoint,
					this.createVertexByIndex(e.endIndex, positions)
				)
				if (pair) {
					multiplyScalar(1 / 8, edgePoint)
					const opposite = this.createVertexByIndex(e.opposite, positions)
					const pairOpposite = this.createVertexByIndex(pair.opposite, positions)
					multiplyScalar(3 / 8, addVertex(opposite, pairOpposite))
					addVertex(edgePoint, opposite)
				} else {
					multiplyScalar(1 / 2, edgePoint)
				}
				this.newVertices.set(e.id, edgePoint)
			}
		}
	}

	repositionOldVertices(geo: BufferGeometry) {
		let i = 0
		const oldPositions = getPositions(geo)
		const positions: number[] = []
		const repositionVertex = (v: Vertex) => {
			const neighbors = this.getNeighbors(v.id)
			const n = neighbors.length
			const k = 3 / 8 + (1 / 4) * Math.cos((2 * Math.PI) / n)
			// cache beta ?
			const beta = (1 / n) * (5 / 8 - k * k)
			const sum = makeVertex(0, 0, 0)
			for (let j = 0; j < n; j++) {
				sum.x += oldPositions[neighbors[j] * 3]
				sum.y += oldPositions[neighbors[j] * 3 + 1]
				sum.z += oldPositions[neighbors[j] * 3 + 2]
			}
			multiplyScalar(beta, sum)
			multiplyScalar(1 - n * beta, v)
			addVertex(v, sum)
		}
		while (i < this.triangles.length) {
			const triangle = this.triangles[i]
			const { edges } = triangle
			const v0 = this.createVertexByIndex(edges[0].startIndex, oldPositions)
			const v1 = this.createVertexByIndex(edges[0].startIndex + 1, oldPositions)
			const v2 = this.createVertexByIndex(edges[0].startIndex + 2, oldPositions)

			repositionVertex(v0)
			repositionVertex(v1)
			repositionVertex(v2)

			const ep0 = this.newVertices.get(edges[0].id)
			const ep1 = this.newVertices.get(edges[1].id)
			const ep2 = this.newVertices.get(edges[2].id)

			if (!ep0 || !ep1 || !ep2) {
				continue
			}
			positions.push(v0.x, v0.y, v0.z)
			positions.push(ep0.x, ep0.y, ep0.z)
			positions.push(ep2.x, ep2.y, ep2.z)

			positions.push(ep0.x, ep0.y, ep0.z)
			positions.push(v1.x, v1.y, v1.z)
			positions.push(ep1.x, ep1.y, ep1.z)

			positions.push(ep0.x, ep0.y, ep0.z)
			positions.push(ep1.x, ep1.y, ep1.z)
			positions.push(ep2.x, ep2.y, ep2.z)

			positions.push(ep1.x, ep1.y, ep1.z)
			positions.push(v2.x, v2.y, v2.z)
			positions.push(ep2.x, ep2.y, ep2.z)

		}
	}

	subdivide(geo: BufferGeometry, params: LoopParams) {
		this.getTriangles(geo)
		this.addNewVertices(geo)
		this.repositionOldVertices(geo)
	}
}

export const loopSubdivide = (geo: BufferGeometry, params: LoopParams): BufferGeometry => {
	const loop = new Loop()
	loop.subdivide(geo, params)
	return geo
}

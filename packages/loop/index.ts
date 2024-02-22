import { BufferGeometry, BufferAttribute } from 'three'
import type { LoopParams, Vertex, Triangle, Edge, Attribute } from './types'
import { makeVertex, addVertex, multiplyScalar, makeTriangle, makeEdge, makeVertexByIndex, pushVertex2Array, vertexId } from './utils'

const betaCache = new Map<number, number>()

const defaultParams: LoopParams = {
	onlySplit: false,
	iterations: 1,
	maxTriangles: Infinity,
	loopUv: false,
	modifyNormal: false,
}

class Loop {
	neighbors = new Map<string, number[]>()

	edgesMap = new Map<string, Edge>()

	triangles: Triangle[] = []

	newEdgeVertices = new Map<string, { [attrName: string]: Vertex}>()

	currentTriangles = 0

	positionAttribute: Attribute = { array: [], itemSize: 3 }

	otherAttributes = new Map<string, Attribute>()

	getNeighbors(vertexId: string): number[] {
		const neighbors = this.neighbors.get(vertexId) ?? []
		const already = new Map<string, boolean>()
		return neighbors.filter((index) => {
			const vId = makeVertexByIndex(index, this.positionAttribute.array, this.positionAttribute.itemSize).id
			if (already.has(vId)) {
				return false
			}
			already.set(vId, true)
			return true
		})
	}

	addNeighbors(vertexId: string, ...newNeighbors: number[]) {
		const exist = this.neighbors.get(vertexId)
		exist ? exist.push(...newNeighbors) : this.neighbors.set(vertexId, newNeighbors)
	}

	// 获取BufferGeometry中所有的三角形
	getTriangles(positionAttribute: Attribute) {
		const { array: positions, itemSize } = positionAttribute
		const vertexCount = positions.length / itemSize
		// 三角形
		for (let i = 0; i < vertexCount; i += itemSize) {
			/**
			 *     v0
			 *    /  \
			 * 	v1 —— v2
			 */
			const v0 = makeVertexByIndex(i, positions, itemSize)
			const v1 = makeVertexByIndex(i + 1, positions, itemSize)
			const v2 = makeVertexByIndex(i + 2, positions, itemSize)
			const vertices: Vertex[] = []
			vertices.push(v0, v1, v2)

			const edges: Edge[] = []

			const e0 = makeEdge(i, i + 1, i + 2, positions, itemSize, this.edgesMap)
			const e1 = makeEdge(i + 1, i + 2, i, positions, itemSize, this.edgesMap)
			const e2 = makeEdge(i + 2, i, i + 1, positions, itemSize, this.edgesMap)
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

	calcEdgeVertex(edge: Edge, attribute: Attribute, name: string, params: Required<LoopParams>, ignoreId = false) {
		const pair = this.edgesMap.get(edge.pairId)
		const { array, itemSize } = attribute
		const edgePoint = makeVertexByIndex(edge.startIndex, array, itemSize, ignoreId)
		addVertex(edgePoint, makeVertexByIndex(edge.endIndex, array, itemSize, ignoreId))

		if ((!params.loopUv && name === 'uv') || params.onlySplit) {
			multiplyScalar(1 / 2, edgePoint)
		} else if (pair) {
			multiplyScalar(3 / 8, edgePoint)
			const opposite = makeVertexByIndex(edge.opposite, array, itemSize, ignoreId)
			const pairOpposite = makeVertexByIndex(pair.opposite, array, itemSize, ignoreId)
			multiplyScalar(1 / 8, addVertex(opposite, pairOpposite))
			addVertex(edgePoint, opposite)
		} else {
			multiplyScalar(1 / 2, edgePoint)
		}
		return edgePoint
	}

	genEdgeVertices(positionAttribute: Attribute, params: Required<LoopParams>) {
		let i = 0
		const otherAttributes = this.otherAttributes
		while (i < this.triangles.length) {
			this.currentTriangles += 4
			if (this.currentTriangles > params.maxTriangles) {
				return
			}

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
				const edgePoint = this.calcEdgeVertex(e, positionAttribute, 'position', params)
				const newEdgeVertex = {
					position: edgePoint
				} as { [k: string]: Vertex}
				this.newEdgeVertices.set(e.id, newEdgeVertex)
				// uv, normal...
				otherAttributes.forEach((attr, name) => {
					const edgePoint = this.calcEdgeVertex(e, attr, name, params, true)
					newEdgeVertex[name] = edgePoint
				})
			}
			i++
		}
	}

	repositionVertex(v: Vertex, array: number[], index: number, itemSize: number) {
		const id = makeVertexByIndex(index, this.positionAttribute.array, this.positionAttribute.itemSize).id
		const neighbors = this.getNeighbors(id)
		const n = neighbors.length
		let beta: undefined | number = 1 / 8
		if (n > 2) {
			beta = betaCache.get(n)
			if (!beta) {
				const k = 3 / 8 + (1 / 4) * Math.cos((2 * Math.PI) / n)
				beta = (1 / n) * (5 / 8 - k * k)
				betaCache.set(n, beta)
			}
		}
		const sum = makeVertex(new Array(itemSize).fill(0))
		for (let i = 0; i < n; i++) {
			for (let j = 0; j < sum.coords.length; j++) {
				sum.coords[j] += array[neighbors[i] * itemSize + j]
			}
		}
		multiplyScalar(beta, sum)
		multiplyScalar(1 - n * beta, v)
		addVertex(v, sum)
	}

	repositionAttribute(attribute: Attribute, name: string, params: Required<LoopParams>) {
		const subdivided: number[] = []
		const { array, itemSize } = attribute
		let i = 0
		while (i < this.triangles.length) {
			const { edges } = this.triangles[i]
			i++
			const v0 = makeVertexByIndex(edges[0].startIndex, array, itemSize)
			const v1 = makeVertexByIndex(edges[1].startIndex, array, itemSize)
			const v2 = makeVertexByIndex(edges[2].startIndex, array, itemSize)

			if (!params.onlySplit) {
				this.repositionVertex(v0, array, edges[0].startIndex, itemSize)
				this.repositionVertex(v1, array, edges[1].startIndex, itemSize)
				this.repositionVertex(v2, array, edges[2].startIndex, itemSize)
			}

			const ep0 = this.newEdgeVertices.get(edges[0].id)?.[name]
			const ep1 = this.newEdgeVertices.get(edges[1].id)?.[name]
			const ep2 = this.newEdgeVertices.get(edges[2].id)?.[name]

			if (!ep0 || !ep1 || !ep2) {
				return
			}

			pushVertex2Array(v0, subdivided)
			pushVertex2Array(ep0, subdivided)
			pushVertex2Array(ep2, subdivided)

			pushVertex2Array(ep0, subdivided)
			pushVertex2Array(v1, subdivided)
			pushVertex2Array(ep1, subdivided)

			pushVertex2Array(ep0, subdivided)
			pushVertex2Array(ep1, subdivided)
			pushVertex2Array(ep2, subdivided)

			pushVertex2Array(ep1, subdivided)
			pushVertex2Array(v2, subdivided)
			pushVertex2Array(ep2, subdivided)
		}
		attribute.array = subdivided
	}

	repositionOldVertices(params: Required<LoopParams>) {
		this.otherAttributes.forEach((attr, name) => {
			this.repositionAttribute(attr, name, params)
		})
		this.repositionAttribute(this.positionAttribute, 'position', params)
	}

	subdivide(geo: BufferGeometry, params?: LoopParams): BufferGeometry {
		const subdivided = new BufferGeometry()
		const finalParams = {
			...defaultParams,
			...params,
		} as Required<LoopParams>

		const { iterations, maxTriangles } = finalParams

		const existPositionAttribute = geo.attributes.position

		if (existPositionAttribute) {
			this.positionAttribute = {
				array: Array.from(existPositionAttribute.array),
				itemSize: existPositionAttribute.itemSize,
			}
		}

		for (const attr in geo.attributes) {
			if (attr === 'position') {
				continue
			}
			this.otherAttributes.set(attr, {
				array: Array.from(geo.attributes[attr].array),
				itemSize: geo.attributes[attr].itemSize,
			})
		}

		for (let i = 0; i < iterations!; i++) {
			this.neighbors.clear()
			this.triangles.length = 0
			this.edgesMap.clear()
			this.newEdgeVertices.clear()
			this.getTriangles(this.positionAttribute)
			this.genEdgeVertices(this.positionAttribute, finalParams)
			this.repositionOldVertices(finalParams)
			// swap
			if (this.currentTriangles > maxTriangles!) {
				break
			}
		}

		subdivided.setAttribute(
			'position',
			new BufferAttribute(
				new (geo.getAttribute('position').array.constructor as unknown as Float32ArrayConstructor)(
					this.positionAttribute.array
				),
				this.positionAttribute.itemSize
			)
		)

		this.otherAttributes.forEach((attr, name) => {
			subdivided.setAttribute(
				name,
				new BufferAttribute(
					new (geo.getAttribute(name).array.constructor as unknown as Float32ArrayConstructor)(
						attr.array
					),
					attr.itemSize
				)
			)
		})

		//
		this.currentTriangles = 0

		console.log(this.neighbors)

		return subdivided
	}
}

export const loopSubdivide = (geo: BufferGeometry, params?: LoopParams): BufferGeometry => {
	const loop = new Loop()
	return loop.subdivide(geo, params)
}

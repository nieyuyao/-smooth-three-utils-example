export interface LoopParams {
	// 迭代次数
	iterations?: number
	// 最多划分多少个三角形
	maxTriangles?: number
}


export interface Vertex {
	x: number
	y: number
	z: number
	id: string,
}

export interface Edge {
	id: string,
	startIndex: number
	endIndex: number
	opposite: number
	pairId: string
}

type Normal = Vertex

export interface Triangle {
	edges: Edge[]
	normal: Normal | null
}

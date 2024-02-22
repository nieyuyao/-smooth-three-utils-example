export interface LoopParams {
	onlySplit?: boolean
	// 迭代次数
	iterations?: number
	// 最多划分多少个三角形
	maxTriangles?: number
	// 是否细分uv
	loopUv?: boolean
	// 是否修改法线
	modifyNormal?: boolean
}


export interface Vertex {
	id: string,
	coords: number[]
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
}

export interface Attribute {
	array: number[]
	itemSize: number
}


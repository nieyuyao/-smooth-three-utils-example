import { BufferGeometry } from 'three'

import { LoopParams } from './types'

export type Params = LoopParams

export const loopSubdivide: (geo: BufferGeometry, params?: Params) => BufferGeometry;

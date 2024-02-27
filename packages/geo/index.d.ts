import type { GeoJSON } from 'geojson'
import { SimplifyParams } from './types'

export type Params = SimplifyParams

export function simplifyGeo(geoJSON: GeoJSON, params?: Params): GeoJSON

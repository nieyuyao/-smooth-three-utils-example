import type { GeoJSON } from 'geojson'
import { Params } from './types'

export function simplifyGeo(geoJSON: GeoJSON, params?: Params): GeoJSON

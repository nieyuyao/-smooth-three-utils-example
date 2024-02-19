import simplify from 'simplify-js'
import type { GeoJSON, Geometry, GeometryCollection, Position } from 'geojson'
import type { Params } from './types'

const smoothPositions = (positions: Position[], params: Params): Position[] => {
	const points = positions.map(([x, y]) => {
		return { x, y }
	})
	return simplify(points, params.tolerance, params.highQuality).map(point => [point.x, point.y])
}

const smoothPolygon = (polygon: Position[][], params: Params) => polygon.forEach((positions) => smoothPositions(positions, params))

const smoothGeometry = (geometry: Geometry, params: Params) => {
	const { type } = geometry
	if (type === 'GeometryCollection') {
		const geometries = (geometry as GeometryCollection).geometries
		geometries.forEach(geo => smoothGeometry(geo, params))
	} else if (type === 'LineString') {
		smoothPositions(geometry.coordinates, params)
	} else if (type === 'MultiLineString') {
		for (const line of geometry.coordinates) {
			smoothPositions(line, params)
		}
	} else if (type === 'Polygon') {
		smoothPolygon(geometry.coordinates, params)
	} else if (type === 'MultiPolygon') {
		for (const polygon of geometry.coordinates) {
			smoothPolygon(polygon, params)
		}
	}
}

/**
 * @param geoJSON geo json data
 * @param params.tolerance
 * @param params.highQuality
 */
export const smoothGeo = (geoJSON: GeoJSON, params: Params) => {
	if (geoJSON.type === 'FeatureCollection') {
		for (const feature of geoJSON.features) {
			smoothGeometry(feature.geometry, params)
		}
	} else if (geoJSON.type === 'Feature') {
		smoothGeometry(geoJSON.geometry, params)
	}
	console.log('Invalid geo type: ', geoJSON.type)
}

export const smoothGeoFile = () => {
	// TODO:
}
function smoothLine(positions: Position[], params: Params): void {
	throw new Error('Function not implemented.')
}


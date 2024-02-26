import simplify from 'simplify-js'
import type { GeoJSON, Geometry, GeometryCollection, Position } from 'geojson'
import { lineString } from '@turf/helpers'
import type { Params } from './types'
import bezier from '@turf/bezier-spline'

const defaultParams: Params = {
	tolerance: 1,
	highQuality: false,
	smooth: false,
	resolution: 10_0000
}

const simplifyPositions = (positions: Position[], params: Required<Params>): Position[] => {
	const points = positions.map(([x, y]) => {
		return { x, y }
	})
	let simplified = simplify(points, params.tolerance, params.highQuality).map((point) => [point.x, point.y])

	if (params.smooth) {
		simplified = bezier(lineString(simplified), { resolution: params.resolution }).geometry.coordinates
	}
	return simplified
}

const simplifyPolygon = (polygon: Position[][], params: Required<Params>): Position[][] => {
	return polygon.reduce((newPolygon, positions) => {
		newPolygon.push(simplifyPositions(positions, params))
		return newPolygon
	}, [] as Position[][])
}

const simplifyGeometry = (geometry: Geometry, params: Required<Params>) => {
	const { type } = geometry
	if (type === 'GeometryCollection') {
		const geometries = (geometry as GeometryCollection).geometries
		geometries.forEach((geo) => simplifyGeometry(geo, params))
	} else if (type === 'LineString') {
		geometry.coordinates = simplifyPositions(geometry.coordinates, params)
	} else if (type === 'MultiLineString') {
		geometry.coordinates = geometry.coordinates.reduce((newLines, line) => {
			newLines.push(simplifyPositions(line, params))
			return newLines
		}, [] as  Position[][])
	} else if (type === 'Polygon') {
		geometry.coordinates = simplifyPolygon(geometry.coordinates, params)
	} else if (type === 'MultiPolygon') {
		const newPolygons: Position[][][] = []
		for (const polygon of geometry.coordinates) {
			newPolygons.push(simplifyPolygon(polygon, params))
		}
		geometry.coordinates = newPolygons
	}
}

export const simplifyGeo = (geoJSON: GeoJSON, params?: Params): GeoJSON => {
	const finalParams = {
		...defaultParams,
		...params
	} as Required<Params>
	const newGeoJSON = JSON.parse(JSON.stringify(geoJSON)) as GeoJSON
	if (newGeoJSON.type === 'FeatureCollection') {
		for (const feature of newGeoJSON.features) {
			simplifyGeometry(feature.geometry, finalParams)
		}
	} else if (newGeoJSON.type === 'Feature') {
		simplifyGeometry(newGeoJSON.geometry, finalParams)
	} else {
		console.log('Invalid geo type: ', geoJSON.type)
	}
	return newGeoJSON
}

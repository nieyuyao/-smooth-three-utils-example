
import geoJson from './geo.json'
import type { GeoJSON } from 'geojson'
import { simplifyGeo } from '../index'

describe('geojson', () => {
	test('basic', () => {
		const simplified = simplifyGeo(geoJson as GeoJSON, { tolerance: 0.001})
		console.log(simplified.type)
		if (simplified.type === 'FeatureCollection') {
			// @ts-ignore
			console.log(simplified.features[0].geometry.coordinates)
		}
	})
})

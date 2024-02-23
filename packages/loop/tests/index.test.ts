import * as THREE from 'three'
import { loopSubdivide } from '../'

describe('loop geometry', () => {
	test('basic', () => {
		// Triangle
		const triangleShape = new THREE.Shape()
		triangleShape.moveTo(0, 2)
		triangleShape.lineTo(2, 0)
		triangleShape.lineTo(-2, 0)
		const triangleGeo = new THREE.ShapeGeometry(triangleShape).toNonIndexed()

		// basic
		const subdividedTriangle = loopSubdivide(triangleGeo)
		expect(subdividedTriangle.getAttribute('position').array.length).toEqual(4 * 3 * 3)
		expect(subdividedTriangle.getAttribute('normal').array.length).toEqual(4 * 3 * 3)
		expect(subdividedTriangle.getAttribute('uv').array.length).toEqual(4 * 3 * 2)

		// more iterations
		const subdividedTriangle2 = loopSubdivide(triangleGeo, { iterations: 2 })
		expect(subdividedTriangle2.getAttribute('position').array.length).toEqual(4 * 4 * 3 * 3)
		expect(subdividedTriangle2.getAttribute('normal').array.length).toEqual(4 * 4 * 3 * 3)
		expect(subdividedTriangle2.getAttribute('uv').array.length).toEqual(4 * 4 * 3 * 2)

		// only split edge
		const subdividedTriangle3 = loopSubdivide(triangleGeo, { onlySplit: true })
		expect(Array.from(subdividedTriangle3.getAttribute('position').array.slice(0, 3))).toEqual([2, 0, 0])
		expect(Array.from(subdividedTriangle3.getAttribute('position').array.slice(12, 12 + 3))).toEqual([0, 2, 0])
		expect(Array.from(subdividedTriangle3.getAttribute('position').array.slice(30, 30 + 3))).toEqual([-2, 0, 0])

		// disabled loop uv
		const subdividedTriangle4 = loopSubdivide(triangleGeo, { loopUv: false })
		expect(Array.from(subdividedTriangle4.getAttribute('uv').array.slice(0, 2))).toEqual([2, 0])
		expect(Array.from(subdividedTriangle4.getAttribute('uv').array.slice(8, 8 + 2))).toEqual([0, 2])
		expect(Array.from(subdividedTriangle4.getAttribute('uv').array.slice(20, 20 + 2))).toEqual([-2, 0])

		// max triangles
		const subdividedTriangle5 = loopSubdivide(triangleGeo, { iterations: 1, maxTriangles: 3 })
 		expect(subdividedTriangle5.getAttribute('position').array.length).toEqual(4 * 3 * 3)
		const subdividedTriangle6 = loopSubdivide(triangleGeo, { iterations: 2, maxTriangles: 6 })
		expect(subdividedTriangle6.getAttribute('position').array.length).toEqual(7 * 3 * 3)
	})
})

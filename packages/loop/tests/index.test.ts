import * as THREE from 'three'
import { loopSubdivide } from '../'

describe('loop geometry', () => {
	test('basic', () => {
		// Box
		// const boxGeo = new THREE.BoxGeometry(2, 2, 2)
		// const newBoxGeo = boxGeo.toNonIndexed()
		// console.log(loopSubdivide(newBoxGeo).getAttribute('position').array)

		// Triangle
		const triangleShape = new THREE.Shape()
		triangleShape.moveTo(0, 2)
		triangleShape.lineTo(2, 0)
		triangleShape.lineTo(-2, 0)

		const triangleGeo = new THREE.ShapeGeometry(triangleShape)
		const newTriangleGeo= triangleGeo.toNonIndexed()
		console.log(newTriangleGeo.getAttribute('position').array)
		console.log(loopSubdivide(newTriangleGeo).getAttribute('position').array)
	})
})

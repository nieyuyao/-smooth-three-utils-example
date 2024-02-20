<script lang="ts" setup>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { ref, onMounted } from 'vue'
import { loopSubdivide } from '../packages/loop'

const canvasRef = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
	if (!canvasRef.value) {
		return
	}
	const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasRef.value, alpha: true })
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(window.innerWidth, window.innerHeight)
	const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50)
	camera.position.z = 30
	const scene = new THREE.Scene()
	scene.background = new THREE.Color(0x444444)
	new OrbitControls(camera, renderer.domElement)

	// const geo = new THREE.BoxGeometry(10, 10, 10)
	// const mat = new THREE.MeshBasicMaterial({
	// 	wireframe: true,
	// 	color: 0xffffff
	// })
	// const box = new THREE.Mesh(geo, mat)
	// scene.add(box)

	// const subdividedGeo = loopSubdivide(geo.toNonIndexed())

	// const subdividedBox = new THREE.Mesh(subdividedGeo, mat)

	// scene.add(subdividedBox)

	// subdividedBox.rotateY(-Math.PI / 2)

	const triangleShape = new THREE.Shape()
	triangleShape.moveTo(0, 10)
	triangleShape.lineTo(10, 0)
	triangleShape.lineTo(-10, 0)

	const triangleGeo = new THREE.ShapeGeometry(triangleShape)

	const mat = new THREE.MeshBasicMaterial({
		wireframe: true,
		color: 0xffffff
	})
	const triangle = new THREE.Mesh(triangleGeo, mat)

	scene.add(triangle)

	const newTriangleGeo= triangleGeo.toNonIndexed()

	const newTriangle = new THREE.Mesh(loopSubdivide(newTriangleGeo), mat)

	scene.add(newTriangle)

	newTriangle.position.y = 20

	const render = () => {
		requestAnimationFrame(render)
		renderer.render(scene, camera)
	}
	render()
})
</script>
<template>
	<div class="main">
		<canvas ref="canvasRef"></canvas>
	</div>
</template>

<style lang="scss" scoped></style>

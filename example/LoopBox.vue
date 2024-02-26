<script lang="ts" setup>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { ref, onMounted, onUnmounted, shallowRef } from 'vue'
import { loopSubdivide } from '../packages/loop'
import mapUrl from './uv_map.jpeg'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const rendererRef = shallowRef<THREE.WebGLRenderer | null>(null)

const sceneRef = shallowRef<THREE.Scene | null>(null)

const loader = new THREE.TextureLoader()

onMounted(async () => {
	if (!canvasRef.value) {
		return
	}
	const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvasRef.value, alpha: true })
	renderer.outputColorSpace = THREE.LinearSRGBColorSpace
	renderer.setPixelRatio(window.devicePixelRatio)
	renderer.setSize(window.innerWidth, window.innerHeight)
	rendererRef.value = renderer
	const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 50)
	camera.position.z = 30
	const scene = new THREE.Scene()
	scene.background = new THREE.Color(0x000000)
	sceneRef.value = scene
	new OrbitControls(camera, renderer.domElement)
	const geo = new THREE.BoxGeometry(10, 10, 10)

	const texture = await loader.loadAsync(mapUrl)
	const mat = new THREE.MeshBasicMaterial({
		// wireframe: true,
		map: texture,
	})
	const subdividedGeo = loopSubdivide(geo.toNonIndexed(), {
		iterations: 5,
		maxTriangles: Infinity,
		loopUv: false,
		onlySplit: false
	})
	const subdividedBox = new THREE.Mesh(subdividedGeo, mat)
	scene.add(subdividedBox)

	const render = () => {
		requestAnimationFrame(render)
		renderer.render(scene, camera)
	}
	render()
})

onUnmounted(() => {
	rendererRef.value?.dispose()

	sceneRef.value?.traverse((obj) => {
		try {
			if (obj instanceof THREE.Mesh) {
				obj.geometry.dispose()
				const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
				mats.forEach((mat) => {
					mat.dispose()
				})
			} else if (obj instanceof THREE.AmbientLight) {
				obj.dispose()
			}
		} catch (e) {
			console.error(e)
		}
		if (obj instanceof THREE.Light) {
			obj.dispose()
		}
	})
	sceneRef.value?.clear()
})
</script>
<template>
	<div class="main">
		<canvas ref="canvasRef"></canvas>
	</div>
</template>

<style lang="css" scoped>
canvas {
	display: block;
}
</style>

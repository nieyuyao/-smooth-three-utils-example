<script lang="ts" setup>
import * as THREE from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { ref, onMounted, onUnmounted, shallowRef } from 'vue'
import * as d3 from 'd3-geo'
import { simplifyGeo } from '../packages/geo'
import geoJson from '../packages/geo/tests/geo.json'
import type { GeoJSON, FeatureCollection, Polygon } from 'geojson'

const canvasRef = ref<HTMLCanvasElement | null>(null)

const rendererRef = shallowRef<THREE.WebGLRenderer | null>(null)

const sceneRef = shallowRef<THREE.Scene | null>(null)

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

	const mat = new LineMaterial({
    color: 0xffffff,
    linewidth: 2,
  })
  mat.resolution.set(window.innerWidth, window.innerHeight)
	const simplified = simplifyGeo(geoJson as GeoJSON, { tolerance: 0.01, smooth: true }) as FeatureCollection

	simplified.features.forEach(feature => {
		const geometry = feature.geometry as Polygon
		const projection = d3
			.geoMercator()
			.center(feature.properties?.center as [number, number] ?? [0, 0])
			.translate([0, 0])
		geometry.coordinates.forEach((line) => {
			const positions: number[] = []
			line.forEach(position => {
				const proj = projection(position as [number, number]) || [0, 0]
				const [x, y] = proj
				positions.push(x, -y, 0)
			})
			const geo = new LineGeometry()
			geo.setPositions(positions)
  		const mesh = new Line2(geo, mat)
  		mesh.computeLineDistances()
			scene.add(mesh)
		})
	})

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


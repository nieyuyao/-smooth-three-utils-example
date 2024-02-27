<script lang="ts" setup>
import * as THREE from 'three'
import { Line2 } from 'three/examples/jsm/lines/Line2'
import { LineGeometry } from 'three/examples/jsm/lines/LineGeometry'
import { LineMaterial } from 'three/examples/jsm/lines/LineMaterial'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { ref, onMounted, onUnmounted, shallowRef } from 'vue'
import * as d3 from 'd3-geo'
import * as dat from 'dat.gui'
import { simplifyGeo, Params } from '../packages/geo'
import geoJson from '../packages/geo/tests/geo.json'
import type { GeoJSON, FeatureCollection, Polygon } from 'geojson'


const guiRef = shallowRef<dat.GUI | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

const rendererRef = shallowRef<THREE.WebGLRenderer | null>(null)

const sceneRef = shallowRef<THREE.Scene | null>(null)


const onResize = (renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera) => {
	renderer.setSize(window.innerWidth, window.innerHeight)
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
	mat.resolution.set(window.innerWidth, window.innerHeight)
}


const params: Params = {
	tolerance: 0.01,
	smooth: false,
	highQuality: false,
	resolution: 10000
}

const mat = new LineMaterial({
	color: 0xffffff,
	linewidth: 2,
})
mat.resolution.set(window.innerWidth, window.innerHeight)


const onParamsChanged = (scene: THREE.Scene) => {

	scene.clear()
	const group = new THREE.Group()
	const simplified = simplifyGeo(geoJson as GeoJSON, params) as FeatureCollection

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
			group.add(mesh)
		})
	})

	scene.add(group)
	group.scale.set(4, 4, 1)
}

const initGui = (gui: dat.GUI, scene: THREE.Scene) => {
	const onChanged = () => onParamsChanged(scene)
	gui.add(params, 'tolerance', 0.01, 0.1, 0.01).onChange(onChanged)
	gui.add(params, 'smooth').onChange(onChanged)
	gui.add(params, 'highQuality').onChange(onChanged)
	gui.add(params, 'resolution').onChange(onChanged)
}

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

	const render = () => {
		requestAnimationFrame(render)
		renderer.render(scene, camera)
	}

	guiRef.value = new dat.GUI()

	initGui(guiRef.value, scene)

	onParamsChanged(scene)

	window.onresize = () => onResize(renderer, camera)
	render()
})

onUnmounted(() => {
	window.onresize = null
	rendererRef.value?.dispose()
	guiRef.value?.destroy()

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

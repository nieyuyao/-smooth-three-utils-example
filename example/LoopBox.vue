<script lang="ts" setup>
import * as THREE from 'three'
import * as dat from 'dat.gui'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { ref, onMounted, onUnmounted, shallowRef } from 'vue'
import { loopSubdivide, Params } from '../packages/loop'
import mapUrl from './uv_map.jpeg'

const guiRef = shallowRef<dat.GUI | null>(null)

const canvasRef = ref<HTMLCanvasElement | null>(null)

const rendererRef = shallowRef<THREE.WebGLRenderer | null>(null)

const sceneRef = shallowRef<THREE.Scene | null>(null)

const loader = new THREE.TextureLoader()

const subdividedBoxRef = shallowRef<THREE.Mesh | null>(null)

const basicMat = new THREE.MeshBasicMaterial({
	wireframe: false,
})

const normalMat = new THREE.MeshNormalMaterial({})

const params: Params = {
	onlySplit: false,
	iterations: 1,
	maxTriangles: 20000,
	loopUv: false,
	modifyNormal: false,
}

const onParamsChanged = (subdividedBox: THREE.Mesh) => {
	const geo = new THREE.BoxGeometry(10, 10, 10)
	const subdividedGeo = loopSubdivide(geo.toNonIndexed(), params)
	subdividedBox.geometry = subdividedGeo
	subdividedBox.material = params.modifyNormal ? normalMat : basicMat
}

const initGui = (gui: dat.GUI, subdividedBox: THREE.Mesh) => {
	const onChanged = () => onParamsChanged(subdividedBox)
	gui.add(params, 'onlySplit').onChange(onChanged)
	gui.add(params, 'iterations', 0, 6, 1).onChange(onChanged)
	gui.add(params, 'maxTriangles').onChange(onChanged)
	gui.add(params, 'loopUv').onChange(onChanged)
	gui.add(params, 'modifyNormal').onChange(onChanged)
	gui.add(basicMat, 'wireframe')
}

const onResize = (renderer: THREE.WebGLRenderer, camera: THREE.PerspectiveCamera) => {
	renderer.setSize(window.innerWidth, window.innerHeight)
	camera.aspect = window.innerWidth / window.innerHeight
	camera.updateProjectionMatrix()
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

	const texture = await loader.loadAsync(mapUrl)

	basicMat.map = texture

	const subdividedBox = new THREE.Mesh(undefined, basicMat)
	scene.add(subdividedBox)

	onParamsChanged(subdividedBox)

	const render = () => {
		requestAnimationFrame(render)
		renderer.render(scene, camera)
	}
	render()
	subdividedBoxRef.value = subdividedBox
	guiRef.value = new dat.GUI()

	initGui(guiRef.value, subdividedBoxRef.value)

	window.onresize = () => onResize(renderer, camera)
})

onUnmounted(() => {
	window.onresize = null
	guiRef.value?.destroy()
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

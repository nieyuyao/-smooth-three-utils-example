
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routesArray: Array<RouteRecordRaw> = [
	{
		path: '/',
		name: 'home',
		component: () => import('./App.vue')
	},
	{
		path: '/loop-box',
		name: 'Loop Box',
		component: () => import('./LoopBox.vue')
	},
	{
		path: '/geo',
		name: 'Geo',
		component: () => import('./Geo.vue')
	},
]


const router = createRouter({
	history: createWebHistory('/'),
	routes: routesArray
})

export const routes = routesArray

export default router

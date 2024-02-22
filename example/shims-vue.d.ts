declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}


declare module '*.jpeg' {
	const url: string;
	export default url
}

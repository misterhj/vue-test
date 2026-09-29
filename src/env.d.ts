declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  // Agrega aquí otras variables VITE_ si las usas en el futuro
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
declare module 'vite' {
  export interface UserConfig {
    plugins?: any[]
    server?: {
      proxy?: Record<string, any>
    }
  }
  export function defineConfig(config: UserConfig): UserConfig
  export interface Plugin {
    name: string
  }
}

declare module '@vitejs/plugin-react' {
  import { Plugin } from 'vite'
  export default function react(options?: any): Plugin
}
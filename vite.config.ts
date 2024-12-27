import { defineConfig } from "vite"
export default defineConfig({
    build: { 
       chunkSizeWarningLimit: 100000000
    },
})

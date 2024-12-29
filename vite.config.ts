import { defineConfig } from "vite"
export default defineConfig({
    build: { 
       chunkSizeWarningLimit: 100000000
    },
})
base: import.meta.env.DEV
    ? "/"
    : "/location-test/",

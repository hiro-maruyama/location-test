import { defineConfig } from "vite"
export default defineConfig({
    build: { 
       chunkSizeWarningLimit: 100000000
    },
    base: "/location-test/" 
});
//export default defineConfig({ base: "/location-test" });

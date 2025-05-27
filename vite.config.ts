import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default ({ mode } : { mode: string }) => {
  return defineConfig({
    build: {
      minify: process.env.NODE_ENV === 'production',
      sourcemap: true,
      lib: {
        entry: path.resolve(__dirname, "src/index.ts"), // Entry point
        name: "ShragaUI", // Global variable name for UMD build
        fileName: (format) => `index.${format}.js`,
        formats: ["es", "cjs"] // Build ESM, CommonJS
      },
      rollupOptions: {
        external: ["react", "react-dom"], // Prevent bundling React
        output: {
          globals: {
            react: "React",
            "react-dom": "ReactDOM"
          }
        }
      }
    },
  plugins: [
    react({
      babel: {
        plugins: [["@babel/plugin-syntax-import-assertions"]], // Ensures correct parsing of "use client"
      },
    })
  ],
  });
};

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1];

export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH ?? (repositoryName ? `/${repositoryName}/` : "/")
});

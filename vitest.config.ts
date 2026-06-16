import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  test: {
    environment: "node",
    exclude: ["**/node_modules/**", "**/.git/**", "**/.next/**", "**/.claude/**"]
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url))
    }
  }
});

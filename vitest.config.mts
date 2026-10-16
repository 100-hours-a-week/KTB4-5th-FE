import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // 패키지 main이 없는 파일을 가리켜 jsdom에서는 설치된 ESM 파일을 사용한다.
    alias: {
      "@lineiconshq/react-lineicons": fileURLToPath(
        new URL(
          "./node_modules/@lineiconshq/react-lineicons/dist/index.esm.js",
          import.meta.url,
        ),
      ),
    },
  },
});

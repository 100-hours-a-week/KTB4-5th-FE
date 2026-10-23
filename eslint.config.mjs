import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "import/no-unassigned-import": [
        "error",
        { allow: ["**/*.css", "client-only", "server-only"] },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // MSW가 생성하는 파일이므로 직접 검사하지 않는다.
    "public/mockServiceWorker.js",
  ]),
  prettierConfig,
]);

export default eslintConfig;

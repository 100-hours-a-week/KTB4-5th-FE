import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "@vitest/browser-playwright";

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
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
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          env: { NODE_ENV: "test" },
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(import.meta.dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            viewport: { width: 360, height: 740 },
            instances: [
              {
                browser: "chromium",
              },
            ],
          },
        },
      },
    ],
  },
});

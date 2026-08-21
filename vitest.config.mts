import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // "server-only"는 Next 번들러만 해석한다. route가 전이 의존으로 끌고 오므로 빈 모듈로 바꾼다.
      "server-only": fileURLToPath(
        new URL("./src/test/serverOnlyStub.ts", import.meta.url)
      ),
    },
  },
  test: {
    projects: [
      // 순수 함수와 API route는 DOM이 필요 없어 node에 둔다.
      {
        extends: true,
        test: {
          name: "node",
          environment: "node",
          include: [
            "src/{utils,services,data}/**/*.test.ts",
            "src/app/api/**/*.test.ts",
            "src/test/**/*.test.ts",
          ],
        },
      },
      {
        extends: true,
        test: {
          name: "dom",
          environment: "jsdom",
          setupFiles: ["./src/test/setup.ts"],
          include: ["src/components/**/*.test.tsx"],
        },
      },
    ],
  },
});

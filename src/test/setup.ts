import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// 렌더한 DOM이 다음 테스트로 넘어가지 않게 한다.
afterEach(() => {
  cleanup();
});

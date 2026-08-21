import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

// 테스트마다 새 클라이언트를 만든다.
// 공유하면 앞 테스트의 캐시가 남아 실행 순서에 따라 결과가 바뀐다.
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

export function renderWithQuery(ui: ReactElement) {
  const queryClient = createTestQueryClient();

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  return { ...render(ui, { wrapper }), queryClient };
}

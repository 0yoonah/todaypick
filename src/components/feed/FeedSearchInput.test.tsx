import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import FeedSearchInput, { FEED_SEARCH_DEBOUNCE_MS } from "./FeedSearchInput";

const input = () => screen.getByRole("searchbox", { name: "피드 제목 검색" });

const type = (value: string) => fireEvent.change(input(), { target: { value } });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("FeedSearchInput", () => {
  it("입력을 멈추고 0.3초가 지나면 앞뒤 공백을 뺀 검색어를 알린다", () => {
    const onSearch = vi.fn();
    render(<FeedSearchInput onSearch={onSearch} />);

    type(" 리액트 ");
    act(() => vi.advanceTimersByTime(FEED_SEARCH_DEBOUNCE_MS - 1));
    expect(onSearch).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(onSearch).toHaveBeenCalledWith("리액트");
  });

  it("연달아 입력하면 마지막 입력만 알린다", () => {
    const onSearch = vi.fn();
    render(<FeedSearchInput onSearch={onSearch} />);

    type("리");
    act(() => vi.advanceTimersByTime(100));
    type("리액");
    act(() => vi.advanceTimersByTime(100));
    type("리액트");
    act(() => vi.advanceTimersByTime(FEED_SEARCH_DEBOUNCE_MS));

    expect(onSearch).toHaveBeenCalledTimes(1);
    expect(onSearch).toHaveBeenCalledWith("리액트");
  });

  it("2글자 미만이면 빈 검색어로 알려 원래 목록을 보여 주게 한다", () => {
    const onSearch = vi.fn();
    render(<FeedSearchInput onSearch={onSearch} />);

    type("리");
    act(() => vi.advanceTimersByTime(FEED_SEARCH_DEBOUNCE_MS));

    expect(onSearch).toHaveBeenLastCalledWith("");
  });

  it("별표(*)는 빼고 검사해 서버에서 와일드카드로 쓰이지 않게 한다", () => {
    const onSearch = vi.fn();
    render(<FeedSearchInput onSearch={onSearch} />);

    type("**");
    act(() => vi.advanceTimersByTime(FEED_SEARCH_DEBOUNCE_MS));
    expect(onSearch).toHaveBeenLastCalledWith("");

    type("리*액트");
    act(() => vi.advanceTimersByTime(FEED_SEARCH_DEBOUNCE_MS));
    expect(onSearch).toHaveBeenLastCalledWith("리액트");
  });

  it("50자를 넘게 입력할 수 없다", () => {
    render(<FeedSearchInput onSearch={vi.fn()} />);

    expect(input()).toHaveAttribute("maxLength", "50");
  });
});

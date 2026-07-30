import { describe, expect, it, vi } from "vitest";
import {
  assertRssContentType,
  assertSafeRssUrl,
  assertSafeXml,
  isPublicIpAddress,
  readResponseTextWithLimit,
} from "./rssSecurityUtils";

describe("RSS URL validation", () => {
  it.each([
    "127.0.0.1",
    "10.0.0.1",
    "169.254.1.1",
    "172.16.0.1",
    "192.168.0.1",
    "::1",
    "fc00::1",
    "fe80::1",
  ])("rejects private or local IP %s", (address) => {
    expect(isPublicIpAddress(address)).toBe(false);
  });

  it("accepts public IP addresses", () => {
    expect(isPublicIpAddress("8.8.8.8")).toBe(true);
    expect(isPublicIpAddress("2606:4700:4700::1111")).toBe(true);
  });

  it("requires HTTPS and public DNS results", async () => {
    const publicLookup = vi.fn().mockResolvedValue([
      { address: "203.0.113.10", family: 4 },
    ]);
    const privateLookup = vi.fn().mockResolvedValue([
      { address: "192.168.0.10", family: 4 },
    ]);

    await expect(
      assertSafeRssUrl("https://example.com/feed", publicLookup)
    ).resolves.toMatchObject({ hostname: "example.com" });
    await expect(
      assertSafeRssUrl("http://example.com/feed", publicLookup)
    ).rejects.toThrow("허용되지 않은 RSS URL");
    await expect(
      assertSafeRssUrl("https://example.com/feed", privateLookup)
    ).rejects.toThrow("공개 네트워크");
  });
});

describe("RSS response validation", () => {
  it("accepts RSS and XML content types", () => {
    expect(() =>
      assertRssContentType("application/rss+xml; charset=UTF-8")
    ).not.toThrow();
    expect(() => assertRssContentType("application/xml")).not.toThrow();
  });

  it("rejects HTML and unsafe XML declarations", () => {
    expect(() => assertRssContentType("text/html")).toThrow("RSS XML");
    expect(() => assertSafeXml("<!DOCTYPE rss><rss />")).toThrow("DTD");
    expect(() => assertSafeXml("<!ENTITY xxe SYSTEM 'file:///etc/passwd'>")).toThrow(
      "DTD"
    );
  });

  it("limits streaming response bodies", async () => {
    const response = new Response("123456");

    await expect(readResponseTextWithLimit(response, 5)).rejects.toThrow(
      "크기 제한"
    );
  });
});

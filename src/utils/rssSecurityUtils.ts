import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

const ALLOWED_CONTENT_TYPES = new Set([
  "application/atom+xml",
  "application/rss+xml",
  "application/xml",
  "text/xml",
]);
const FORBIDDEN_XML_PATTERN = /<!\s*(doctype|entity)\b/i;

type DnsLookup = (
  hostname: string,
  options: { all: true; verbatim: true }
) => Promise<Array<{ address: string; family: number }>>;

function isPrivateIpv4(address: string): boolean {
  const octets = address.split(".").map(Number);
  const [first, second] = octets;

  return (
    first === 0 ||
    first === 10 ||
    first === 127 ||
    (first === 100 && second >= 64 && second <= 127) ||
    (first === 169 && second === 254) ||
    (first === 172 && second >= 16 && second <= 31) ||
    (first === 192 && second === 0) ||
    (first === 192 && second === 168) ||
    (first === 198 && (second === 18 || second === 19)) ||
    first >= 224
  );
}

function isPrivateIpv6(address: string): boolean {
  const normalized = address.toLowerCase().split("%")[0];

  if (
    normalized === "::" ||
    normalized === "::1" ||
    normalized.startsWith("fc") ||
    normalized.startsWith("fd") ||
    normalized.startsWith("fe8") ||
    normalized.startsWith("fe9") ||
    normalized.startsWith("fea") ||
    normalized.startsWith("feb") ||
    normalized.startsWith("ff")
  ) {
    return true;
  }

  const mappedIpv4 = normalized.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)?.[1];
  return mappedIpv4 ? isPrivateIpv4(mappedIpv4) : false;
}

export function isPublicIpAddress(address: string): boolean {
  const family = isIP(address);
  if (family === 4) return !isPrivateIpv4(address);
  if (family === 6) return !isPrivateIpv6(address);
  return false;
}

export async function assertSafeRssUrl(
  value: string,
  resolveHostname: DnsLookup = lookup
): Promise<URL> {
  const url = new URL(value);

  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    url.port ||
    url.hostname === "localhost" ||
    url.hostname.endsWith(".local")
  ) {
    throw new Error("허용되지 않은 RSS URL입니다.");
  }

  if (isIP(url.hostname)) {
    if (!isPublicIpAddress(url.hostname)) {
      throw new Error("내부 네트워크 RSS 주소는 허용되지 않습니다.");
    }
    return url;
  }

  const addresses = await resolveHostname(url.hostname, {
    all: true,
    verbatim: true,
  });

  if (
    addresses.length === 0 ||
    addresses.some(({ address }) => !isPublicIpAddress(address))
  ) {
    throw new Error("공개 네트워크 RSS 주소만 허용됩니다.");
  }

  return url;
}

export function assertRssContentType(contentType: string | null): void {
  const mediaType = contentType?.split(";", 1)[0].trim().toLowerCase();
  if (!mediaType || !ALLOWED_CONTENT_TYPES.has(mediaType)) {
    throw new Error("RSS XML이 아닌 응답입니다.");
  }
}

export function assertSafeXml(xml: string): void {
  if (FORBIDDEN_XML_PATTERN.test(xml)) {
    throw new Error("DTD 또는 외부 엔티티가 포함된 XML은 허용되지 않습니다.");
  }
}

export async function readResponseTextWithLimit(
  response: Response,
  maxBytes: number
): Promise<string> {
  const contentLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw new Error("RSS 응답 크기 제한을 초과했습니다.");
  }

  if (!response.body) {
    throw new Error("RSS 응답 본문이 없습니다.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let totalBytes = 0;
  let result = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      throw new Error("RSS 응답 크기 제한을 초과했습니다.");
    }
    result += decoder.decode(value, { stream: true });
  }

  return result + decoder.decode();
}

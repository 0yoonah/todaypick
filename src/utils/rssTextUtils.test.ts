import { describe, expect, it } from "vitest";
import { cleanRssText } from "./rssTextUtils";

describe("cleanRssText", () => {
  it("태그를 지우고 공백을 하나로 줄인다", () => {
    expect(
      cleanRssText("<p>첫 줄</p>\n\n<script>alert(1)</script><b>둘째</b>", 100)
    ).toBe("첫 줄 둘째");
  });

  it("이름 있는 엔티티를 문자로 바꾼다", () => {
    expect(
      cleanRssText("A &amp; B &lt;C&gt; &quot;D&quot; &#39;E&apos;&nbsp;F", 100)
    ).toBe(`A & B <C> "D" 'E' F`);
  });

  it("10진수와 16진수 숫자 엔티티를 문자로 바꾼다", () => {
    expect(
      cleanRssText("&#034;한국천문학회&#034; &#x27;AI&#X27; &#8230;", 100)
    ).toBe(`"한국천문학회" 'AI' …`);
  });

  it("이중 인코딩된 엔티티는 한 번만 푼다", () => {
    expect(cleanRssText("&amp;#34; &amp;quot;", 100)).toBe("&#34; &quot;");
  });

  it("범위를 벗어난 숫자 엔티티는 그대로 둔다", () => {
    expect(cleanRssText("&#0; &#x110000; &#55296;", 100)).toBe(
      "&#0; &#x110000; &#55296;"
    );
  });

  it("최대 길이를 넘으면 말줄임표를 붙인다", () => {
    expect(cleanRssText("가나다라마바사", 5)).toBe("가나다라…");
  });

  it("문자열이 아니면 빈 문자열을 돌려준다", () => {
    expect(cleanRssText(undefined, 10)).toBe("");
  });
});

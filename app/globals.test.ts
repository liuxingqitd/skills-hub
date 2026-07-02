import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("app/globals.css", "utf-8");

function blockFor(selector: string) {
  const match = css.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\{([^}]*)\\}`));
  return match?.[1] ?? "";
}

describe("global dashboard styles", () => {
  it("lets category filters wrap instead of requiring horizontal scrolling", () => {
    const filterBlock = blockFor(".category-filter");
    const chipBlock = blockFor(".category-chip");

    expect(filterBlock).toContain("flex-wrap: wrap");
    expect(filterBlock).not.toContain("overflow-x: auto");
    expect(chipBlock).toContain("white-space: nowrap");
  });
});

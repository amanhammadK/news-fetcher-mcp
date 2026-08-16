import { describe, it, expect } from "vitest";
import { execute } from "../src/tools/news_fetcher.js";
describe("News Fetcher Mcp", () => {
  it("should execute successfully", async () => {
    const result = await execute("test", {});
    expect(result).toHaveProperty("status", "completed");
    expect(result).toHaveProperty("action", "test");
  });
});

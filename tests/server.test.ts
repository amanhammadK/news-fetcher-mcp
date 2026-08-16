import { describe, it, expect, vi } from "vitest";
import { topHeadlines, searchNews, listSources } from "../src/tools/news.js";

describe("news tools", () => {
  it("topHeadlines appends country and pageSize", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toContain("country=us");
      expect(url).toContain("pageSize=10");
      return { ok: true, json: async () => ({ articles: [{ title: "T", description: "D", url: "U", source: { name: "S" }, publishedAt: "P" }] }) };
    });
    vi.stubGlobal("fetch", fetchMock);
    const res = await topHeadlines();
    expect(res[0]).toMatchObject({ title: "T", source: "S" });
  });

  it("searchNews encodes query", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      expect(url).toContain("q=llm");
      return { ok: true, json: async () => ({ articles: [] }) };
    });
    vi.stubGlobal("fetch", fetchMock);
    await searchNews("llm");
  });

  it("listSources maps sources", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ sources: [{ id: "bbc", name: "BBC", description: "d", category: "general" }] }) })));
    const res = await listSources();
    expect(res[0]).toMatchObject({ id: "bbc", name: "BBC" });
  });
});

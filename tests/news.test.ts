import{vi,describe,it,expect}from"vitest";
global.fetch=vi.fn();
describe("News",()=>{beforeEach(()=>{(global.fetch as any).mockResolvedValue({ok:true,json:()=>Promise.resolve({articles:[{title:"T",description:"D",url:"https://x.com",source:{name:"S"},publishedAt:"2026-01-01"}],sources:[{id:"1",name:"S",description:"D",category:"general"}]})})});
it("headlines",async()=>{const{topHeadlines}=await import("../src/tools/news.js");expect((await topHeadlines()).length).toBe(1)});
it("search",async()=>{const{searchNews}=await import("../src/tools/news.js");expect((await searchNews("AI")).length).toBe(1)});
it("sources",async()=>{const{listSources}=await import("../src/tools/news.js");expect((await listSources()).length).toBe(1)});
});
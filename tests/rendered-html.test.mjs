import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the basketball command center", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>BBL Basketball Command Center<\/title>/i);
  assert.match(html, /Basketball Command Center/);
  assert.match(html, /Weekly lineup/);
  assert.match(html, /Roster/);
  assert.match(html, /Draft assistant/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
});

test("includes roster, lineup, persistence, and live schedule logic", async () => {
  const [page, route, layout, schedule] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/schedule/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../public/schedule.json", import.meta.url), "utf8"),
  ]);
  assert.match(page, /localStorage\.setItem\("bbl-roster"/);
  assert.match(page, /localStorage\.setItem\("bbl-lineups"/);
  assert.match(page, /G\/F\/C/);
  assert.match(page, /Starters move to the top/);
  assert.match(page, /draggable/);
  assert.match(page, /CBS eligibility is enforced/);
  assert.match(page, /is not CBS-eligible/);
  assert.match(page, /America\/Edmonton/);
  assert.match(page, /teamColors/);
  assert.match(page, /team-card/);
  assert.match(page, /pending:Player\[\]/);
  assert.match(page, /dragSource\.current/);
  assert.match(page, /\/api\/schedule\?start=/);
  assert.match(page, /src="\/draft\.html"/);
  assert.match(route, /site\.api\.espn\.com/);
  assert.match(route, /startTime:e\.date/);
  assert.match(route, /s-maxage=21600/);
  assert.match(layout, /title:\s*"BBL Basketball Command Center"/);
  const parsed = JSON.parse(schedule);
  assert.ok(parsed.games.length > 0);
  assert.equal(parsed.periods.length, 24);
});

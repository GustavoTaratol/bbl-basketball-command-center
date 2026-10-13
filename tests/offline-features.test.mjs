import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("offline app supports multi-position eligibility", async () => {
  const source = await readFile(new URL("v2_app.js", root), "utf8");
  assert.match(source, /function positionsOf\(/);
  assert.match(source, /positionsOf\(p\)\.includes\(pos\)/);
  assert.match(source, /function activeLineup\(/);
  assert.match(source, /data-edit-pos=/);
});

test("offline app includes mock draft simulation", async () => {
  const source = await readFile(new URL("v2_app.js", root), "utf8");
  assert.match(source, /function simulateToMyPick\(/);
  assert.match(source, /function opponentChoice\(/);
  assert.match(source, /Math\.exp\(-boardGap/);
  assert.match(source, /Math\.random\(\)\*total/);
  assert.match(source, /maxFall=round===1\?2/);
  assert.match(source, /best-player tier/);
  assert.match(source, /const MOCK_MANAGERS=/);
  assert.match(source, /marketPool\.slice\(0,boardDepth\)/);
  assert.match(source, /item\.market<=pick\+reachLimit/);
  assert.match(source, /mockPickMemory/);
  assert.match(source, /repeatWeight=/);
  assert.match(source, /rebuildLists\(\);scoreCache=null;added\+\+/);
  assert.match(source, /function continueMock\(/);
  assert.match(source, /Auto-pick & continue/);
  assert.match(source, /tight CBS rank and ADP tier/);
  assert.match(source, /id="simulateToPick"/);
  assert.match(source, /id="draftMode"/);
});

test("draft order uses a standard snake without third-round reversal", async () => {
  const source = await readFile(new URL("v2_app.js", root), "utf8");
  const refresh = await readFile(new URL("refresh_static.mjs", root), "utf8");
  assert.match(source, /reverse=round%2===0/);
  assert.doesNotMatch(source, /round===3/);
  assert.match(source, /standard snake/);
  assert.match(refresh, /Standard snake draft/);
  assert.match(refresh, /8, 13, 28, 33, 48, 53/);
});

test("mock auto-picks stay in a plausible market tier", async () => {
  const source = await readFile(new URL("v2_app.js", root), "utf8");
  assert.match(source, /function recommendedAtPick\(\)/);
  assert.match(source, /item\.market<=pick\+reachLimit/);
  assert.match(source, /db\.mockUserPickMemory/);
  assert.match(source, /const choice=recommendedAtPick\(\)/);
});

test("coverage look-ahead is lightweight and cycles suggested players", async () => {
  const source = await readFile(new URL("v2_app.js", root), "utf8");
  assert.match(source, /coverageLookahead/);
  assert.match(source, /data-coverage-next/);
  assert.match(source, />Next<\/button>/);
  assert.match(source, /let scoreCache=null/);
  assert.match(source, /setTimeout\(renderDraft,120\)/);
});

test("Basketball Reference positions can be merged independently of player rankings", async () => {
  const source = await readFile(new URL("v2_app.js", root), "utf8");
  const builder = await readFile(new URL("build_offline.py", root), "utf8");
  assert.match(source, /function importEligibilityCsv\(/);
  assert.match(source, /Import BRef positions/);
  assert.match(builder, /basketball_reference_positions\.csv/);
  assert.match(builder, /eligibilitySource.*Basketball Reference/);
});

test("generated offline page contains the current app source", async () => {
  const html = await readFile(new URL("docs/index.html", root), "utf8");
  assert.match(html, /bbl-draft-assistant-v9/);
  assert.match(html, /Randomized mock draft/);
  assert.match(html, /function positionsOf\(/);
});

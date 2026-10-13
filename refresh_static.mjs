import { readFile, writeFile } from "node:fs/promises";

const htmlPath = new URL("./docs/index.html", import.meta.url);
const appPath = new URL("./v2_app.js", import.meta.url);
const cssPath = new URL("./v2_extra.css", import.meta.url);
const additionsPath = new URL("./v2_additions.html", import.meta.url);
const positionsPath = new URL("./basketball_reference_positions.csv", import.meta.url);

const [html, app, css, additions] = await Promise.all([
  readFile(htmlPath, "utf8"),
  readFile(appPath, "utf8"),
  readFile(cssPath, "utf8"),
  readFile(additionsPath, "utf8"),
]);

const seedMatch = html.match(/const BASE_SEED=(\{.*?\});\s*const STORE=/s);
if (!seedMatch) throw new Error("Could not find the embedded player data in docs/index.html");

const seed = JSON.parse(seedMatch[1]);
seed.settings.format = "Standard snake draft";
seed.settings.picks = [8, 13, 28, 33, 48, 53, 68, 73, 88, 93, 108, 113, 128];
const normalizeName = (value) => String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
try {
  const rows = (await readFile(positionsPath, "utf8")).trim().split(/\r?\n/);
  const header = rows.shift().split(",");
  const column = (name) => header.indexOf(name);
  const byName = new Map(rows.map((line) => {
    const values = line.split(",");
    return [normalizeName(values[column("name")]), {
      positions: values[column("positions")].split("/").filter(Boolean),
      brefPosition: values[column("bref_position")],
      brefId: values[column("bref_id")],
      sourceUrl: values[column("source_url")],
    }];
  }));
  seed.players.forEach((player) => {
    const eligibility = byName.get(normalizeName(player.name));
    if (!eligibility) return;
    Object.assign(player, eligibility, { pos: eligibility.positions.join("/"), eligibilitySource: "Basketball Reference" });
  });
  seed.settings.eligibilitySource = "Basketball Reference player directory";
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}
const nextScript = app.replace("__SEED__", () => JSON.stringify(seed));
const scriptPattern = /<script>\s*const BASE_SEED=.*?<\/script>/s;
if (!scriptPattern.test(html)) throw new Error("Could not find the generated application script");

const cssMarker = "/* SOURCE: v2_extra.css */";
const sourceHtml = html.replace("10-team • 13 rounds • 3RR", "10-team • 13 rounds • standard snake");
const cleanHtml = sourceHtml.replace(new RegExp(`${cssMarker.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}.*?(?=<\\/style>)`, "s"), "");
const additionsPattern = /<section id="history".*?<input id="csvInput"[^>]*>/s;
if (!additionsPattern.test(cleanHtml)) throw new Error("Could not find the generated additions block");
const output = cleanHtml
  .replace("</style>", () => `${cssMarker}\n${css}\n</style>`)
  .replace(additionsPattern, () => additions.trim())
  .replace(scriptPattern, () => `<script>\n${nextScript}\n</script>`);

await writeFile(htmlPath, output);
console.log(htmlPath.pathname);

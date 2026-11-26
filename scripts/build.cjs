const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8").replace(/\r\n/g, "\n");
const marker = "  // @cronotofy-catalogs";
const template = read("src/runtime.js");
assert.equal(template.split(marker).length, 2, "Expected exactly one catalog insertion marker");

const locales = fs.readdirSync(path.join(root, "src", "locales"))
  .filter((file) => /^[a-z]+\.js$/.test(file))
  .sort();
assert.ok(locales.includes("en.js"), "The English fallback is required");
const catalogs = locales.map((file) => {
  const source = read(`src/locales/${file}`).trimEnd();
  return `    ${path.parse(file).name}: ${source},`;
});
const bundle = template.replace(marker, () => [
  "  var TRANSLATIONS = {",
  ...catalogs,
  "  };"
].join("\n"));

if (process.argv.includes("--check")) {
  assert.ok(bundle === read("cronotofy.js"), "Run node scripts/build.cjs and commit the updated bundle");
} else {
  fs.writeFileSync(path.join(root, "cronotofy.js"), bundle);
}

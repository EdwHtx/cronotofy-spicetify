const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));

test("the distribution manifest references files in the repository", () => {
  assert.ok(Array.isArray(manifest) && manifest.length > 0);
  for (const entry of manifest) {
    assert.ok(entry.name?.trim());
    assert.ok(entry.description?.trim());
    assert.ok(entry.authors?.length);
    assert.match(entry.main, /\.js$/);
    for (const field of ["main", "preview", "readme"]) {
      assert.equal(entry[field], path.basename(entry[field]));
      assert.ok(fs.statSync(path.join(root, entry[field])).isFile());
    }
    const preview = fs.readFileSync(path.join(root, entry.preview));
    assert.equal(preview.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
    assert.equal(preview.toString("ascii", 12, 16), "IHDR");
    assert.ok(preview.readUInt32BE(16) > 0 && preview.readUInt32BE(20) > 0);
  }
});

function loadExtension(globals) {
  const source = fs.readFileSync(path.join(root, manifest[0].main), "utf8");
  const entry = "  (function initCronotofyMarketplaceExtension() {";
  assert.ok(source.includes(entry));
  const context = vm.createContext(globals);
  vm.runInContext(source.replace(entry, `
    globalThis.ListeningTracker = ListeningTracker;
    globalThis.loadStore = loadStore;
    globalThis.storageKeyFor = storageKeyFor;
    globalThis.legacyStorageKey = STORAGE_PREFIX;
    globalThis.catalogs = TRANSLATIONS;
    globalThis.getTranslations = getTranslations;
    globalThis.formatRelativeTimeLocalized = formatRelativeTimeLocalized;
    globalThis.parseSharedPreferences = parseSharedPreferences;
    globalThis.readVisualPreset = readVisualPreset;
    globalThis.refinePaletteWithGeminiVision = refinePaletteWithGeminiVision;
    globalThis.setTestTrack = (track) => { extractLiveTrackFromPlayer = () => track; };
    return;
${entry}`), context);
  return context;
}

test("limited hardware defaults to Focus and preserves an explicit visual preference", () => {
  const preset = (navigator, saved = null) => loadExtension({
    navigator, localStorage: { getItem: () => saved }
  }).readVisualPreset();
  assert.equal(preset({ deviceMemory: 4, hardwareConcurrency: 8 }), "focus");
  assert.equal(preset({ hardwareConcurrency: 2 }), "focus");
  assert.equal(preset({ deviceMemory: 8, hardwareConcurrency: 8 }), "full");
  assert.equal(preset({}), "full");
  assert.equal(preset({ hardwareConcurrency: 2 }, "full"), "full");
});

test("the tracker skips ticks without track metadata and resumes when it returns", () => {
  const context = loadExtension({ Spicetify: { Player: { isPlaying: () => true } } });
  const tracker = new context.ListeningTracker();
  const track = { id: "test-track", progressMs: 1000 };
  context.setTestTrack(track);
  tracker.onSecondTick();
  assert.equal(tracker.getSnapshot().totalSeconds, 1);

  context.setTestTrack(null);
  tracker.onSecondTick();
  assert.equal(tracker.getSnapshot().totalSeconds, 1);
  assert.equal(tracker.getSnapshot().tracks[0].totalSeconds, 1);

  context.setTestTrack(track);
  tracker.onSecondTick();
  assert.equal(tracker.getSnapshot().totalSeconds, 2);
});

function catalogKeys(catalog, prefix = "") {
  return Object.entries(catalog).flatMap(([name, value]) => {
    const key = prefix + name;
    return value && typeof value === "object" ? catalogKeys(value, key + ".") : [key + ":" + typeof value];
  }).sort();
}

test("every locale has the same keys and value types as English", () => {
  const { catalogs } = loadExtension({});
  const expected = catalogKeys(catalogs.en);
  for (const [locale, catalog] of Object.entries(catalogs)) {
    assert.deepEqual(catalogKeys(catalog), expected, locale);
  }
});

test("language selection uses the saved preference, Spotify locale, then English", () => {
  let saved = "fr";
  let locale = "pt-BR";
  const { getTranslations } = loadExtension({
    localStorage: { getItem: () => saved },
    Spicetify: { Locale: { getLocale: () => locale } }
  });
  assert.equal(getTranslations().lang, "fr");
  assert.equal(getTranslations("").lang, "pt");
  saved = "invalid";
  assert.equal(getTranslations().lang, "pt");
  locale = "xx-XX";
  assert.equal(getTranslations().lang, "en");
  locale = "id-ID";
  assert.equal(getTranslations().lang, "id");
  locale = "pt_BR";
  assert.equal(getTranslations().lang, "pt");
  locale = "desktop";
  assert.equal(getTranslations().lang, "en");
});

test("a shared preset accepts only the supported schema", () => {
  const { parseSharedPreferences } = loadExtension({});
  const preferences = parseSharedPreferences('{"version":1,"preset":"focus","language":"id"}');
  assert.equal(preferences.preset, "focus");
  assert.equal(preferences.language, "id");
  for (const text of [
    '{"version":1,"preset":"focus","language":"id","history":[]}',
    '{"version":1,"preset":"focus","language":"xx"}',
    '{"version":1,"preset":"focus","language":["id"]}',
    '{"version":1,"preset":"invalid","language":""}',
    '{"version":2,"preset":"still","language":""}',
    " ".repeat(1025),
    "invalid"
  ]) {
    assert.equal(parseSharedPreferences(text), null, text);
  }
});

test("history dates tolerate Spotify locale strings with underscores or invalid values", () => {
  const { catalogs, formatRelativeTimeLocalized } = loadExtension({});
  const date = "2020-01-01T12:00:00Z";
  assert.equal(formatRelativeTimeLocalized(date, catalogs.pt, "pt_BR"),
    new Date(date).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }));
  assert.equal(formatRelativeTimeLocalized(date, catalogs.en, "???"),
    new Date(date).toLocaleDateString("en", { day: "2-digit", month: "short" }));
});

test("a playback notification that arrives before song change resets track session time", () => {
  const context = loadExtension({ Spicetify: { Player: { isPlaying: () => true } } });
  const tracker = new context.ListeningTracker();
  context.setTestTrack({ id: "first", progressMs: 1000 });
  tracker.onSecondTick();
  assert.equal(tracker.getCounters().currentTrackSeconds, 1);
  context.setTestTrack({ id: "second", progressMs: 0 });
  tracker.onPlayPause();
  assert.equal(tracker.getCounters().currentTrackSeconds, 0);
  tracker.onSecondTick();
  assert.equal(tracker.getCounters().currentTrackSeconds, 1);
  assert.equal(tracker.getCounters().totalSeconds, 2);
});

test("the playback counters never read or sort the track ranking", () => {
  const { ListeningTracker } = loadExtension({});
  const tracker = new ListeningTracker();
  Object.defineProperty(tracker.store, "tracks", {
    get() { throw new Error("Counter consulted track history"); }
  });
  tracker.store.totalSeconds = 42;
  assert.equal(tracker.getCounters().totalSeconds, 42);
});

test("legacy history is recovered only for the profile recorded as its owner", () => {
  const data = new Map();
  const { loadStore, storageKeyFor, legacyStorageKey: legacy } = loadExtension({
    localStorage: { getItem: (key) => data.get(key) ?? null }
  });
  assert.notEqual(storageKeyFor(""), legacy);
  data.set(legacy, JSON.stringify({ version: 1, userId: "first", totalSeconds: 42 }));
  assert.equal(loadStore("first").totalSeconds, 42);
  assert.equal(loadStore("second").totalSeconds, 0);
  assert.equal(loadStore("").totalSeconds, 0);

  data.set(legacy, JSON.stringify({ version: 1, userId: "", totalSeconds: 21 }));
  assert.equal(loadStore("").totalSeconds, 21);
  assert.equal(loadStore("second").totalSeconds, 0);
  data.set(storageKeyFor("second"), JSON.stringify({ version: 1, userId: "second", totalSeconds: 10 }));
  assert.equal(loadStore("second").totalSeconds, 10);
  assert.equal(JSON.parse(data.get(legacy)).totalSeconds, 21);
});

test("Gemini stays inactive without a key and sends configured keys in a header", async () => {
  let key = "";
  const requests = [];
  const { refinePaletteWithGeminiVision } = loadExtension({
    localStorage: { getItem: () => key },
    fetch: async (url, options) => {
      requests.push({ url, options });
      return { ok: false };
    }
  });
  await refinePaletteWithGeminiVision("test-image", {}, "");
  assert.equal(requests.length, 0);
  key = "fake-key-for-tests-only";
  await refinePaletteWithGeminiVision("test-image", {}, "");
  assert.equal(requests.length, 1);
  assert.equal(new URL(requests[0].url).search, "");
  assert.equal(requests[0].options.headers["x-goog-api-key"], key);
});

test("the packaged entry stops retrying when Spicetify is unavailable", () => {
  const source = fs.readFileSync(path.join(root, manifest[0].main), "utf8");
  const pending = [];
  vm.runInNewContext(source, { setTimeout: (callback) => pending.push(callback) });
  for (let attempt = 1; attempt < 200; attempt++) {
    assert.equal(pending.length, 1);
    pending.shift()();
  }
  assert.equal(pending.length, 0);
});

for (const [layout, mainSelector, navSelector] of [
  ["mapped classes", ".Root__main-view", ".main-globalNav-searchContainer"],
  ["unmapped classes", '#main-view, [data-testid="main-view"], main[role="main"]',
    '#global-nav-bar, [data-testid="global-nav-bar"], .Root__globalNav']
]) test(`the packaged panel opens, closes and recovers with ${layout}`, () => {
  const source = fs.readFileSync(path.join(root, manifest[0].main), "utf8");
  const createElement = () => {
    const children = [];
    const classes = new Set();
    return {
      listeners: new Map(),
      children,
      dataset: {},
      classList: {
        add: (name) => classes.add(name),
        remove: (name) => classes.delete(name),
        contains: (name) => classes.has(name),
        toggle: (name, active) => active ? classes.add(name) : classes.delete(name)
      },
      style: { setProperty() {} },
      get lastElementChild() { return children.at(-1); },
      get isConnected() { return Boolean(this.parentElement); },
      setAttribute() {},
      addEventListener(name, callback) {
        const previous = this.listeners.get(name);
        this.listeners.set(name, previous ? (event) => {
          previous(event);
          callback(event);
        } : callback);
      },
      appendChild(child) {
        children.push(child);
        child.parentElement = this;
        child.remove = () => {
          children.splice(children.indexOf(child), 1);
          child.parentElement = null;
        };
      },
      append(...nodes) { nodes.forEach((node) => this.appendChild(node)); },
      contains: (node) => children.includes(node)
    };
  };
  const main = createElement();
  const navigation = createElement();
  const rootElement = createElement();
  const window = createElement();
  const warnings = [];
  let shouldFail = true;
  let draws = 0;
  const context = {
    console: { warn: (...args) => warnings.push(args) },
    document: {
      body: createElement(), head: createElement(), documentElement: rootElement,
      createElement, getElementById: () => null, querySelectorAll: () => [],
      addEventListener() {},
      querySelector: (selector) => ({
        [navSelector]: navigation,
        [mainSelector]: main
      })[selector] || null
    },
    localStorage: { getItem: (key) => key === "cronotofy_visual_preset" ? "focus" : null },
    setTimeout() {},
    clearTimeout() {},
    setInterval() {},
    window,
    Spicetify: {
      Player: {},
      ...(layout === "mapped classes" ? { CosmosAsync: {} } : {}),
      Platform: {},
      React: { Component: class {}, createElement },
      ReactDOM: {
        createRoot() {
          return {
            render() {
              if (shouldFail) throw new Error("Synthetic render error");
              draws++;
            },
            unmount() {}
          };
        }
      }
    }
  };
  vm.runInNewContext(source, context);
  assert.ok(window.__CRONOTOFY_MOD__);
  assert.equal(rootElement.dataset.cronotofyPreset, "focus");
  const wallStyle = context.document.head.children.find((element) => element.id === "cronotofy-global-wall-style");
  assert.match(wallStyle?.textContent ?? "", /#cronotofy-ext-host/);
  const open = () => navigation.lastElementChild.listeners.get("click")({
    preventDefault() {}, stopPropagation() {}
  });
  open();
  assert.equal(warnings.length, 1);
  assert.equal(main.lastElementChild, undefined);
  assert.equal(rootElement.classList.contains("cronotofy-ext-open"), false);

  shouldFail = false;
  open();
  assert.equal(draws, 1);
  assert.equal(main.lastElementChild.id, "cronotofy-ext-host");
  assert.equal(main.classList.contains("cronotofy-panel-anchor"), true);
  assert.equal(rootElement.classList.contains("cronotofy-ext-open"), true);

  window.listeners.get("keydown")({ key: "Escape" });
  assert.equal(main.lastElementChild, undefined);
  assert.equal(main.classList.contains("cronotofy-panel-anchor"), false);
  assert.equal(rootElement.classList.contains("cronotofy-ext-open"), false);
});

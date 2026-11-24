"use strict";
(() => {
  // spicetify-cronotofy/src/config.ts
  var CRONOTOFY_MOD_CONFIG = {
    version: "2.0.0",
    tracking: {
      storagePrefix: "cronotofy_spicetify_tracker_v1",
      minPlaySeconds: 25,
      saveIntervalSeconds: 10,
      maxRecentPlays: 150
    },
    albumWall: {
      cachePrefix: "cronotofy_wall_covers_v1",
      cacheTtlMs: 6 * 60 * 60 * 1e3,
      maxArtistsToFetch: 10,
      maxCoversPerArtist: 12
    },
    ui: {
      defaultTab: "overview",
      defaultTimeRange: "medium_term",
      enableTopbarButton: false,
      enableDynamicTheme: true,
      enableAlbumWall: true
    }
  };

  // spicetify-cronotofy/src/tracker.ts
  var STORAGE_PREFIX = CRONOTOFY_MOD_CONFIG.tracking.storagePrefix;
  var MAX_RECENT_PLAYS = CRONOTOFY_MOD_CONFIG.tracking.maxRecentPlays;
  var MIN_PLAY_SECONDS = CRONOTOFY_MOD_CONFIG.tracking.minPlaySeconds;
  var SAVE_INTERVAL_SECONDS = CRONOTOFY_MOD_CONFIG.tracking.saveIntervalSeconds;
  function normalizeSpotifyImage(url) {
    if (!url || typeof url !== "string") return "";
    const clean = url.trim();
    if (!clean) return "";
    if (clean.startsWith("spotify:image:")) {
      const hash = clean.slice("spotify:image:".length);
      return hash ? `https://i.scdn.co/image/${hash}` : "";
    }
    if (clean.startsWith("http://") || clean.startsWith("https://")) {
      return clean;
    }
    return "";
  }
  function formatSecondsHuman(totalSec) {
    const sec = Math.max(0, Math.floor(totalSec || 0));
    const h = Math.floor(sec / 3600);
    const m = Math.floor(sec % 3600 / 60);
    const s = sec % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }
  function getTodayKey() {
    const d = /* @__PURE__ */ new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  function extractLiveTrackFromPlayer() {
    try {
      const item = Spicetify?.Player?.data?.item || Spicetify?.Player?.data?.track;
      if (!item || typeof item !== "object") return null;
      const uri = String(item.uri || "");
      if (!uri.startsWith("spotify:track:")) return null;
      const id = uri.replace("spotify:track:", "");
      if (!id) return null;
      const metadata = item.metadata || {};
      const name = item.name || metadata.title || "Canci\xF3n desconocida";
      let artistName = "Artista desconocido";
      let artistId;
      if (Array.isArray(item.artists) && item.artists.length > 0) {
        artistName = item.artists.map((a) => a?.name).filter(Boolean).join(", ") || artistName;
        const firstArtistUri = String(item.artists[0]?.uri || "");
        if (firstArtistUri.startsWith("spotify:artist:")) {
          artistId = firstArtistUri.replace("spotify:artist:", "");
        }
      } else if (metadata.artist_name) {
        artistName = String(metadata.artist_name);
      }
      const albumObj = item.album || {};
      const albumName = albumObj.name || metadata.album_title || "";
      const albumUri = albumObj.uri || metadata.album_uri || void 0;
      let rawImageUrl = "";
      if (Array.isArray(albumObj.images) && albumObj.images.length > 0) {
        rawImageUrl = albumObj.images[0]?.url || "";
      } else if (metadata.image_xlarge_url || metadata.image_large_url || metadata.image_url) {
        rawImageUrl = metadata.image_xlarge_url || metadata.image_large_url || metadata.image_url;
      }
      const albumImageUrl = normalizeSpotifyImage(rawImageUrl);
      const durationMs = Number(
        item.duration?.milliseconds ?? item.duration_ms ?? Spicetify?.Player?.getDuration?.() ?? 0
      );
      const progressMs = Number(Spicetify?.Player?.getProgress?.() ?? 0);
      const isPlaying = Boolean(Spicetify?.Player?.isPlaying?.());
      return {
        id,
        uri,
        name,
        artistName,
        artistId,
        albumName,
        albumUri,
        albumImageUrl,
        durationMs: Number.isFinite(durationMs) ? durationMs : 0,
        progressMs: Number.isFinite(progressMs) ? progressMs : 0,
        isPlaying,
        externalUrl: `https://open.spotify.com/track/${id}`,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      };
    } catch {
      return null;
    }
  }
  var cachedUser = null;
  var resolvingUserPromise = null;
  async function resolveCurrentSpotifyUser(forceRefresh = false) {
    if (cachedUser && !forceRefresh) return cachedUser;
    if (resolvingUserPromise && !forceRefresh) return resolvingUserPromise;
    resolvingUserPromise = (async () => {
      try {
        if (Spicetify?.CosmosAsync?.get) {
          const me = await Spicetify.CosmosAsync.get("https://api.spotify.com/v1/me");
          if (me && me.id) {
            const avatarUrl = normalizeSpotifyImage(me.images?.[0]?.url);
            const user = {
              id: String(me.id),
              displayName: String(me.display_name || me.id),
              email: me.email ? String(me.email) : void 0,
              country: me.country ? String(me.country) : void 0,
              avatarUrl: avatarUrl || void 0,
              profileUrl: me.external_urls?.spotify || `https://open.spotify.com/user/${encodeURIComponent(me.id)}`
            };
            cachedUser = user;
            return user;
          }
        }
      } catch {
      }
      try {
        const apiUser = await Spicetify?.Platform?.UserAPI?.getUser?.();
        if (apiUser) {
          const rawUri = String(apiUser.uri || "");
          const id = String(
            apiUser.username || (rawUri.startsWith("spotify:user:") ? rawUri.replace("spotify:user:", "") : "")
          ).trim();
          if (id) {
            const avatarUrl = normalizeSpotifyImage(apiUser.images?.[0]?.url || apiUser.avatar);
            const user = {
              id,
              displayName: String(apiUser.displayName || apiUser.name || id),
              avatarUrl: avatarUrl || void 0,
              profileUrl: `https://open.spotify.com/user/${encodeURIComponent(id)}`
            };
            cachedUser = user;
            return user;
          }
        }
      } catch {
      }
      return cachedUser;
    })();
    try {
      return await resolvingUserPromise;
    } finally {
      resolvingUserPromise = null;
    }
  }
  function createEmptyStore(userId) {
    return {
      version: 1,
      userId,
      totalSeconds: 0,
      dailySeconds: {},
      tracks: {},
      recentPlays: []
    };
  }
  function storageKeyFor(userId) {
    return userId ? `${STORAGE_PREFIX}_${userId}` : STORAGE_PREFIX;
  }
  function loadStore(userId) {
    try {
      const key = storageKeyFor(userId);
      const raw = localStorage.getItem(key) || (userId ? localStorage.getItem(STORAGE_PREFIX) : null);
      if (!raw) return createEmptyStore(userId);
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.version === 1) {
        return {
          version: 1,
          userId: userId || String(parsed.userId || ""),
          totalSeconds: Number(parsed.totalSeconds) || 0,
          dailySeconds: parsed.dailySeconds && typeof parsed.dailySeconds === "object" ? parsed.dailySeconds : {},
          tracks: parsed.tracks && typeof parsed.tracks === "object" ? parsed.tracks : {},
          recentPlays: Array.isArray(parsed.recentPlays) ? parsed.recentPlays.slice(0, MAX_RECENT_PLAYS) : [],
          lastSyncedAt: parsed.lastSyncedAt
        };
      }
    } catch {
    }
    return createEmptyStore(userId);
  }
  function saveStore(store) {
    try {
      store.lastSyncedAt = (/* @__PURE__ */ new Date()).toISOString();
      localStorage.setItem(storageKeyFor(store.userId), JSON.stringify(store));
    } catch {
    }
  }
  var ListeningTracker = class {
    constructor() {
      this.userId = "";
      this.store = createEmptyStore("");
      this.currentTrack = null;
      this.currentSessionSeconds = 0;
      this.currentPlayRecorded = false;
      this.tickCounter = 0;
      this.tickTimer = null;
      this.listeners = /* @__PURE__ */ new Set();
      this.initialized = false;
    }
    async init() {
      if (this.initialized) return;
      this.initialized = true;
      const user = await resolveCurrentSpotifyUser();
      this.userId = user?.id || "";
      this.store = loadStore(this.userId);
      this.currentTrack = extractLiveTrackFromPlayer();
      this.currentSessionSeconds = 0;
      this.currentPlayRecorded = false;
      this.tickTimer = setInterval(() => this.onSecondTick(), 1e3);
      this.notify();
    }
    notify() {
      for (const fn of this.listeners) {
        try {
          fn();
        } catch {
        }
      }
    }
    subscribe(fn) {
      this.listeners.add(fn);
      return () => {
        this.listeners.delete(fn);
      };
    }
    finalizeCurrentTrackSession(nextTrack) {
      if (this.currentTrack && this.currentSessionSeconds >= MIN_PLAY_SECONDS && !this.currentPlayRecorded) {
        this.recordPlay(this.currentTrack, this.currentSessionSeconds);
      }
      this.currentTrack = nextTrack;
      this.currentSessionSeconds = 0;
      this.currentPlayRecorded = false;
    }
    recordPlay(track, listenedSeconds) {
      const existing = this.store.tracks[track.id];
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      if (existing) {
        existing.playCount += 1;
        existing.lastPlayedAt = nowIso;
      } else {
        this.store.tracks[track.id] = {
          id: track.id,
          uri: track.uri,
          name: track.name,
          artistName: track.artistName,
          artistId: track.artistId,
          albumName: track.albumName,
          albumUri: track.albumUri,
          albumImageUrl: track.albumImageUrl,
          durationMs: track.durationMs,
          totalSeconds: listenedSeconds,
          playCount: 1,
          lastPlayedAt: nowIso
        };
      }
      const playEvent = {
        id: track.id,
        uri: track.uri,
        name: track.name,
        artistName: track.artistName,
        albumName: track.albumName,
        albumImageUrl: track.albumImageUrl,
        listenedSeconds,
        playedAt: nowIso
      };
      this.store.recentPlays = [playEvent, ...this.store.recentPlays].slice(0, MAX_RECENT_PLAYS);
      this.currentPlayRecorded = true;
    }
    onSecondTick() {
      const live = extractLiveTrackFromPlayer();
      if (live && this.currentTrack && live.id !== this.currentTrack.id) {
        this.finalizeCurrentTrackSession(live);
      } else if (live) {
        this.currentTrack = live;
      }
      const isPlaying = Boolean(Spicetify?.Player?.isPlaying?.());
      if (!isPlaying || !this.currentTrack) {
        return;
      }
      const today = getTodayKey();
      this.store.totalSeconds += 1;
      this.store.dailySeconds[today] = (this.store.dailySeconds[today] || 0) + 1;
      this.currentSessionSeconds += 1;
      const existing = this.store.tracks[this.currentTrack.id];
      const nowIso = (/* @__PURE__ */ new Date()).toISOString();
      if (existing) {
        existing.totalSeconds += 1;
        existing.lastPlayedAt = nowIso;
        if (this.currentTrack.albumImageUrl && !existing.albumImageUrl) {
          existing.albumImageUrl = this.currentTrack.albumImageUrl;
        }
      } else {
        this.store.tracks[this.currentTrack.id] = {
          id: this.currentTrack.id,
          uri: this.currentTrack.uri,
          name: this.currentTrack.name,
          artistName: this.currentTrack.artistName,
          artistId: this.currentTrack.artistId,
          albumName: this.currentTrack.albumName,
          albumUri: this.currentTrack.albumUri,
          albumImageUrl: this.currentTrack.albumImageUrl,
          durationMs: this.currentTrack.durationMs,
          totalSeconds: 1,
          playCount: 0,
          lastPlayedAt: nowIso
        };
      }
      if (this.currentSessionSeconds === MIN_PLAY_SECONDS && !this.currentPlayRecorded) {
        this.recordPlay(this.currentTrack, this.currentSessionSeconds);
      } else if (this.currentPlayRecorded && this.store.recentPlays[0]?.id === this.currentTrack.id) {
        this.store.recentPlays[0].listenedSeconds = this.currentSessionSeconds;
      }
      this.tickCounter += 1;
      if (this.tickCounter >= SAVE_INTERVAL_SECONDS) {
        this.tickCounter = 0;
        saveStore(this.store);
      }
      this.notify();
    }
    onSongChange() {
      const next = extractLiveTrackFromPlayer();
      this.finalizeCurrentTrackSession(next);
      saveStore(this.store);
      this.notify();
    }
    onPlayPause() {
      const live = extractLiveTrackFromPlayer();
      if (live) {
        this.currentTrack = live;
      }
      saveStore(this.store);
      this.notify();
    }
    async syncNow() {
      saveStore(this.store);
      this.notify();
      return true;
    }
    getLiveTrack() {
      return extractLiveTrackFromPlayer();
    }
    getSnapshot() {
      const today = getTodayKey();
      const tracks = Object.values(this.store.tracks).sort((a, b) => b.totalSeconds - a.totalSeconds);
      return {
        userId: this.userId,
        totalSeconds: this.store.totalSeconds,
        todaySeconds: this.store.dailySeconds[today] || 0,
        todayDate: today,
        currentTrackSeconds: this.currentSessionSeconds,
        tracks,
        recentPlays: this.store.recentPlays,
        lastSyncedAt: this.store.lastSyncedAt
      };
    }
    clearLocalHistory() {
      this.store = createEmptyStore(this.userId);
      this.currentSessionSeconds = 0;
      this.currentPlayRecorded = false;
      saveStore(this.store);
      this.notify();
    }
  };

  // spicetify-cronotofy/src/albumWall.ts
  function normalizeImageKey(url) {
    const clean = (url || "").trim().split("?")[0];
    const scdnMatch = clean.match(/i\.scdn\.co\/image\/([a-zA-Z0-9]+)/);
    if (scdnMatch) return scdnMatch[1];
    return clean;
  }
  function deterministicShuffle(items, seedStr) {
    const arr = [...items];
    let s = seedStr.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 9876);
    const rand = () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
    let m = arr.length;
    while (m > 0) {
      const i = Math.floor(rand() * m--);
      const tmp = arr[m];
      arr[m] = arr[i];
      arr[i] = tmp;
    }
    return arr;
  }
  function readWallCache(userId) {
    try {
      const key = `${CRONOTOFY_MOD_CONFIG.albumWall.cachePrefix}_${userId || "default"}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.savedAt === "number" && Array.isArray(parsed.covers) && Date.now() - parsed.savedAt < CRONOTOFY_MOD_CONFIG.albumWall.cacheTtlMs && parsed.covers.length > 0) {
        return parsed.covers;
      }
    } catch {
    }
    return null;
  }
  function writeWallCache(userId, covers) {
    try {
      const key = `${CRONOTOFY_MOD_CONFIG.albumWall.cachePrefix}_${userId || "default"}`;
      const payload = { savedAt: Date.now(), covers };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch {
    }
  }
  async function collectFavoriteArtistCovers(params) {
    const { userId, artistCandidates, seedTrackCovers } = params;
    const seenImages = /* @__PURE__ */ new Set();
    const collected = [];
    const addCover = (cover) => {
      const url = normalizeSpotifyImage(cover.imageUrl);
      if (!url) return;
      const key = normalizeImageKey(url);
      if (!key || seenImages.has(key)) return;
      seenImages.add(key);
      collected.push({ ...cover, imageUrl: url });
    };
    for (const c of seedTrackCovers) {
      addCover(c);
    }
    const cached = readWallCache(userId);
    if (cached) {
      for (const c of cached) {
        addCover(c);
      }
      if (collected.length >= 16) {
        return collected;
      }
    }
    const artistsWithId = [];
    const seenArtistIds = /* @__PURE__ */ new Set();
    for (const a of artistCandidates) {
      if (a.id && !seenArtistIds.has(a.id)) {
        seenArtistIds.add(a.id);
        artistsWithId.push({ id: a.id, name: a.name });
        if (artistsWithId.length >= CRONOTOFY_MOD_CONFIG.albumWall.maxArtistsToFetch) break;
      }
    }
    const maxPerArtist = CRONOTOFY_MOD_CONFIG.albumWall.maxCoversPerArtist;
    const batchSize = 3;
    for (let i = 0; i < artistsWithId.length; i += batchSize) {
      const batch = artistsWithId.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (artist) => {
          try {
            const res = await Spicetify?.CosmosAsync?.get(
              `https://api.spotify.com/v1/artists/${encodeURIComponent(
                artist.id
              )}/albums?include_groups=album,single&limit=${maxPerArtist}`
            );
            const items = Array.isArray(res?.items) ? res.items : [];
            for (const alb of items) {
              const img = normalizeSpotifyImage(alb?.images?.[0]?.url);
              if (!img) continue;
              addCover({
                id: String(alb.id || `${artist.id}-${alb.name}`),
                title: String(alb.name || ""),
                artistName: artist.name,
                imageUrl: img,
                releaseType: String(alb.album_group || alb.album_type || "album")
              });
            }
          } catch {
          }
        })
      );
    }
    if (collected.length > 0) {
      writeWallCache(userId, collected);
    }
    return collected;
  }
  function buildAlbumWallRows(covers, seedKey, rowCount = 6) {
    if (covers.length === 0) return [];
    const shuffled = deterministicShuffle(covers, seedKey || "cronotofy");
    const rows = Array.from({ length: rowCount }, () => []);
    shuffled.forEach((cover, idx) => {
      rows[idx % rowCount].push(cover);
    });
    return rows.map((row, rIdx) => {
      const filled = [...row];
      while (filled.length < 12) {
        const offset = (rIdx * 3 + filled.length) % shuffled.length;
        filled.push(shuffled[offset]);
      }
      return filled;
    });
  }

  // spicetify-cronotofy/src/aiColorEngine.ts
  var AI_PALETTE_CACHE_KEY = "cronotofy_ai_palettes_v3";
  var GEMINI_KEY_STORAGE_KEY = "cronotofy_gemini_api_key";
  var MAX_CACHE_ENTRIES = 120;
  function clamp(v, min, max) {
    return Math.min(max, Math.max(min, v));
  }
  function rgbToHex(r, g, b) {
    const h = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
    return `#${h(r)}${h(g)}${h(b)}`;
  }
  function rgbToStr(r, g, b) {
    return `${clamp(Math.round(r), 0, 255)}, ${clamp(Math.round(g), 0, 255)}, ${clamp(Math.round(b), 0, 255)}`;
  }
  function hexToRgb(hex) {
    const clean = (hex || "").trim().replace(/^#/, "");
    if (/^[0-9a-fA-F]{3}$/.test(clean)) {
      return [
        parseInt(clean[0] + clean[0], 16),
        parseInt(clean[1] + clean[1], 16),
        parseInt(clean[2] + clean[2], 16)
      ];
    }
    if (/^[0-9a-fA-F]{6}$/.test(clean)) {
      return [
        parseInt(clean.slice(0, 2), 16),
        parseInt(clean.slice(2, 4), 16),
        parseInt(clean.slice(4, 6), 16)
      ];
    }
    return null;
  }
  function srgbToLinear(c) {
    const s = clamp(c, 0, 1);
    return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  }
  function linearToSrgb(c) {
    const lin = clamp(c, 0, 1);
    return lin <= 31308e-7 ? 12.92 * lin : 1.055 * Math.pow(lin, 1 / 2.4) - 0.055;
  }
  function rgbToOklab(r, g, b) {
    const lr = srgbToLinear(r / 255);
    const lg = srgbToLinear(g / 255);
    const lb = srgbToLinear(b / 255);
    const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
    const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
    const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
    const l_ = Math.cbrt(l);
    const m_ = Math.cbrt(m);
    const s_ = Math.cbrt(s);
    return {
      L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
      a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
      b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_
    };
  }
  function oklabToLinearSrgb(L, a, b) {
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.291485548 * b;
    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;
    return [
      4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
      -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
      -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s
    ];
  }
  function oklabToOklch(c) {
    const C = Math.hypot(c.a, c.b);
    const H = (Math.atan2(c.b, c.a) * 180 / Math.PI + 360) % 360;
    return { L: c.L, C, H };
  }
  function inLinearGamut(lr, lg, lb) {
    const eps = 1e-4;
    return lr >= -eps && lr <= 1 + eps && lg >= -eps && lg <= 1 + eps && lb >= -eps && lb <= 1 + eps;
  }
  function oklchToSrgbSafe(L, C, H) {
    const cleanL = clamp(L, 0, 1);
    const cleanC = Math.max(0, C);
    const rad = H * Math.PI / 180;
    const cosH = Math.cos(rad);
    const sinH = Math.sin(rad);
    let [lr, lg, lb] = oklabToLinearSrgb(cleanL, cleanC * cosH, cleanC * sinH);
    if (!inLinearGamut(lr, lg, lb) && cleanC > 0) {
      let low = 0;
      let high = cleanC;
      for (let i = 0; i < 16; i++) {
        const mid = (low + high) * 0.5;
        const candidate = oklabToLinearSrgb(cleanL, mid * cosH, mid * sinH);
        if (inLinearGamut(candidate[0], candidate[1], candidate[2])) {
          low = mid;
          lr = candidate[0];
          lg = candidate[1];
          lb = candidate[2];
        } else {
          high = mid;
        }
      }
      [lr, lg, lb] = oklabToLinearSrgb(cleanL, low * cosH, low * sinH);
    }
    return [
      Math.round(linearToSrgb(lr) * 255),
      Math.round(linearToSrgb(lg) * 255),
      Math.round(linearToSrgb(lb) * 255)
    ];
  }
  function relativeLuminance(r, g, b) {
    return 0.2126 * srgbToLinear(r / 255) + 0.7152 * srgbToLinear(g / 255) + 0.0722 * srgbToLinear(b / 255);
  }
  function circularHueDistance(h1, h2) {
    const diff = Math.abs(h1 - h2) % 360;
    return diff > 180 ? 360 - diff : diff;
  }
  function buildPaletteFromOklchSeeds(accentSeed, accent2Seed, ambientSeed, sourceImageUrl) {
    const isMono = accentSeed.C < 0.032 && ambientSeed.C < 0.032;
    const accentTuple = isMono ? [226, 232, 240] : oklchToSrgbSafe(
      clamp(accentSeed.L, 0.68, 0.79),
      clamp(accentSeed.C, 0.16, 0.25),
      accentSeed.H
    );
    const accent2Tuple = isMono ? [203, 213, 225] : oklchToSrgbSafe(
      clamp(accent2Seed.L, 0.64, 0.76),
      clamp(accent2Seed.C, 0.14, 0.23),
      accent2Seed.H
    );
    const accentSoftTuple = isMono ? [241, 245, 249] : oklchToSrgbSafe(
      0.85,
      clamp(accentSeed.C * 0.62, 0.075, 0.155),
      accentSeed.H
    );
    const ambC = isMono ? 8e-3 : clamp(ambientSeed.C * 0.68, 0.04, 0.095);
    const ambH = isMono ? 225 : ambientSeed.H;
    const bgMainTuple = oklchToSrgbSafe(0.165, ambC, ambH);
    const bgSidebarTuple = oklchToSrgbSafe(0.14, ambC * 0.9, ambH);
    const bgPlayerTuple = oklchToSrgbSafe(0.15, ambC * 0.94, ambH);
    const bgCardTuple = oklchToSrgbSafe(0.195, clamp(ambC * 1.06, 8e-3, 0.105), ambH);
    const bgElevatedTuple = oklchToSrgbSafe(0.23, clamp(ambC * 1.1, 8e-3, 0.112), ambH);
    const bgHighlightTuple = oklchToSrgbSafe(0.275, clamp(ambC * 1.15, 8e-3, 0.12), ambH);
    const lum = relativeLuminance(...accentTuple);
    return {
      sourceImageUrl,
      isDynamic: true,
      accent: rgbToHex(...accentTuple),
      accentRgb: rgbToStr(...accentTuple),
      accent2: rgbToHex(...accent2Tuple),
      accent2Rgb: rgbToStr(...accent2Tuple),
      accentSoft: rgbToHex(...accentSoftTuple),
      accentContrast: lum > 0.34 ? "#060910" : "#ffffff",
      bgMain: rgbToHex(...bgMainTuple),
      bgMainRgb: rgbToStr(...bgMainTuple),
      bgElevated: rgbToHex(...bgElevatedTuple),
      bgHighlight: rgbToHex(...bgHighlightTuple),
      bgSidebar: rgbToHex(...bgSidebarTuple),
      bgSidebarRgb: rgbToStr(...bgSidebarTuple),
      bgPlayer: rgbToHex(...bgPlayerTuple),
      bgCard: rgbToHex(...bgCardTuple),
      bgCardRgb: rgbToStr(...bgCardTuple)
    };
  }
  function buildPaletteFromSeedColors(accentHex, accent2Hex, ambientHex, sourceImageUrl) {
    const rgb1 = hexToRgb(accentHex);
    const rgb2 = hexToRgb(accent2Hex) || rgb1;
    const rgb3 = hexToRgb(ambientHex) || rgb1;
    if (!rgb1 || !rgb2 || !rgb3) return null;
    const lch1 = oklabToOklch(rgbToOklab(...rgb1));
    const lch2 = oklabToOklch(rgbToOklab(...rgb2));
    const lch3 = oklabToOklch(rgbToOklab(...rgb3));
    const accentSeed = {
      L: lch1.C < 0.032 ? 0.9 : clamp(lch1.L * 0.35 + 0.49, 0.68, 0.79),
      C: lch1.C < 0.032 ? lch1.C : clamp(Math.max(lch1.C * 1.18, 0.165), 0.16, 0.25),
      H: lch1.H
    };
    const accent2Seed = {
      L: lch2.C < 0.032 ? 0.85 : clamp(lch2.L * 0.35 + 0.47, 0.64, 0.76),
      C: lch2.C < 0.032 ? lch2.C : clamp(Math.max(lch2.C * 1.14, 0.145), 0.14, 0.23),
      H: lch2.H
    };
    return buildPaletteFromOklchSeeds(accentSeed, accent2Seed, lch3, sourceImageUrl);
  }
  function quantizePixelsOklab(rgba, width, height, sourceImageUrl) {
    const totalPixels = width * height;
    if (totalPixels === 0 || rgba.length < totalPixels * 4) return null;
    const samples = [];
    let totalAreaWeight = 0;
    for (let y = 0; y < height; y++) {
      const ny = (y + 0.5) / height - 0.5;
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const alpha = rgba[idx + 3];
        if (alpha < 180) continue;
        const r = rgba[idx];
        const g = rgba[idx + 1];
        const b = rgba[idx + 2];
        const lab = rgbToOklab(r, g, b);
        if (lab.L < 0.08 || lab.L > 0.96) continue;
        const C = Math.hypot(lab.a, lab.b);
        const nx = (x + 0.5) / width - 0.5;
        const focus = Math.exp(-1.8 * (nx * nx + ny * ny));
        let edge = 0;
        if (x + 1 < width && y + 1 < height) {
          const rightIdx = idx + 4;
          const downIdx = idx + width * 4;
          const dr = Math.abs(r - rgba[rightIdx]) + Math.abs(r - rgba[downIdx]);
          const dg = Math.abs(g - rgba[rightIdx + 1]) + Math.abs(g - rgba[downIdx + 1]);
          const db = Math.abs(b - rgba[rightIdx + 2]) + Math.abs(b - rgba[downIdx + 2]);
          edge = clamp((dr + dg + db) / 260, 0, 1);
        }
        const areaW = 0.65 + 0.35 * focus + 0.3 * edge;
        const chromaBoost = 0.25 + Math.pow(Math.min(0.32, C) / 0.18, 1.65);
        const w = areaW * chromaBoost;
        totalAreaWeight += areaW;
        samples.push({ L: lab.L, a: lab.a, b: lab.b, C, w, areaW });
      }
    }
    if (samples.length === 0) return null;
    const k = Math.min(6, samples.length);
    const centroids = [];
    let firstIdx = 0;
    let firstBestScore = -1;
    for (let i = 0; i < samples.length; i++) {
      const s = samples[i];
      const score = s.w * (0.4 + s.C * 4.5);
      if (score > firstBestScore) {
        firstBestScore = score;
        firstIdx = i;
      }
    }
    centroids.push({ L: samples[firstIdx].L, a: samples[firstIdx].a, b: samples[firstIdx].b });
    const minDistSq = new Float64Array(samples.length).fill(Infinity);
    for (let c = 1; c < k; c++) {
      const prev = centroids[c - 1];
      let bestIdx = 0;
      let bestWeightedDist = -1;
      for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        const dL = s.L - prev.L;
        const da = s.a - prev.a;
        const db = s.b - prev.b;
        const d2 = dL * dL + da * da + db * db;
        if (d2 < minDistSq[i]) minDistSq[i] = d2;
        const wd = minDistSq[i] * s.w;
        if (wd > bestWeightedDist) {
          bestWeightedDist = wd;
          bestIdx = i;
        }
      }
      centroids.push({ L: samples[bestIdx].L, a: samples[bestIdx].a, b: samples[bestIdx].b });
    }
    const assignments = new Int32Array(samples.length);
    const sumW = new Float64Array(k);
    const sumArea = new Float64Array(k);
    const sumL = new Float64Array(k);
    const sumA = new Float64Array(k);
    const sumB = new Float64Array(k);
    for (let iter = 0; iter < 12; iter++) {
      sumW.fill(0);
      sumArea.fill(0);
      sumL.fill(0);
      sumA.fill(0);
      sumB.fill(0);
      for (let i = 0; i < samples.length; i++) {
        const s = samples[i];
        let bestC = 0;
        let bestD = Infinity;
        for (let c = 0; c < k; c++) {
          const ctr = centroids[c];
          const dL = s.L - ctr.L;
          const da = s.a - ctr.a;
          const db = s.b - ctr.b;
          const d = dL * dL + da * da + db * db;
          if (d < bestD) {
            bestD = d;
            bestC = c;
          }
        }
        assignments[i] = bestC;
        sumW[bestC] += s.w;
        sumArea[bestC] += s.areaW;
        sumL[bestC] += s.L * s.w;
        sumA[bestC] += s.a * s.w;
        sumB[bestC] += s.b * s.w;
      }
      for (let c = 0; c < k; c++) {
        if (sumW[c] > 0) {
          centroids[c] = {
            L: sumL[c] / sumW[c],
            a: sumA[c] / sumW[c],
            b: sumB[c] / sumW[c]
          };
        }
      }
    }
    const clusters = [];
    for (let c = 0; c < k; c++) {
      if (sumArea[c] <= 0) continue;
      const ctr = centroids[c];
      const lch = oklabToOklch(ctr);
      clusters.push({
        L: ctr.L,
        a: ctr.a,
        b: ctr.b,
        C: lch.C,
        H: lch.H,
        areaShare: sumArea[c] / Math.max(1, totalAreaWeight)
      });
    }
    if (clusters.length === 0) return null;
    const significant = clusters.filter((cl) => cl.areaShare >= 0.02);
    const evalPool = significant.length > 0 ? significant : clusters;
    const maxSignificantChroma = Math.max(...evalPool.map((cl) => cl.C));
    if (maxSignificantChroma < 0.032) {
      const monoSeed = { L: 0.9, C: 5e-3, H: 225 };
      return buildPaletteFromOklchSeeds(monoSeed, monoSeed, { L: 0.22, C: 5e-3, H: 225 }, sourceImageUrl);
    }
    const accentCandidates = evalPool.filter((cl) => cl.C >= 0.05 && cl.L >= 0.2 && cl.L <= 0.9);
    const accentPool = accentCandidates.length > 0 ? accentCandidates : evalPool;
    let primary = accentPool[0];
    let bestAccentScore = -1;
    for (const cl of accentPool) {
      const vibrancy = Math.pow(cl.C, 1.65);
      const lightnessBalance = clamp(1 - 0.55 * Math.abs(cl.L - 0.58), 0.35, 1);
      const presence = Math.pow(Math.max(0.015, cl.areaShare), 0.38);
      const score = vibrancy * lightnessBalance * presence;
      if (score > bestAccentScore) {
        bestAccentScore = score;
        primary = cl;
      }
    }
    let secondary = null;
    let bestSecondaryScore = -1;
    for (const cl of evalPool) {
      if (cl.C < 0.055) continue;
      const dist = circularHueDistance(primary.H, cl.H);
      if (dist < 26) continue;
      const score = Math.pow(cl.C, 1.4) * Math.pow(Math.max(0.015, cl.areaShare), 0.35) * (0.7 + 0.3 * Math.min(1, dist / 90));
      if (score > bestSecondaryScore) {
        bestSecondaryScore = score;
        secondary = cl;
      }
    }
    let ambientCluster = evalPool[0];
    let bestAmbientScore = -1;
    for (const cl of evalPool) {
      const moodWeight = cl.L <= 0.72 ? 1 : 0.45;
      const chromaHint = 0.65 + Math.min(0.8, cl.C * 4);
      const score = cl.areaShare * moodWeight * chromaHint * (1 - Math.abs(cl.L - 0.34) * 0.4);
      if (score > bestAmbientScore) {
        bestAmbientScore = score;
        ambientCluster = cl;
      }
    }
    const ambientBlendLab = {
      L: ambientCluster.L * 0.62 + primary.L * 0.38,
      a: ambientCluster.a * 0.62 + primary.a * 0.38,
      b: ambientCluster.b * 0.62 + primary.b * 0.38
    };
    const ambientLch = oklabToOklch(ambientBlendLab);
    const primarySeed = {
      L: clamp(primary.L * 0.35 + 0.49, 0.68, 0.79),
      C: clamp(Math.max(primary.C * 1.18, 0.165), 0.16, 0.25),
      H: primary.H
    };
    const secondarySeed = secondary ? {
      L: clamp(secondary.L * 0.35 + 0.47, 0.64, 0.76),
      C: clamp(Math.max(secondary.C * 1.14, 0.145), 0.14, 0.23),
      H: secondary.H
    } : {
      L: clamp(primarySeed.L - 0.03, 0.64, 0.76),
      C: clamp(primarySeed.C * 0.88, 0.14, 0.22),
      H: (primarySeed.H + 24) % 360
    };
    return buildPaletteFromOklchSeeds(primarySeed, secondarySeed, ambientLch, sourceImageUrl);
  }
  function extractCoverVisualData(imageUrl) {
    return new Promise((resolve) => {
      if (typeof document === "undefined" || typeof Image === "undefined") {
        resolve(null);
        return;
      }
      const img = new Image();
      img.crossOrigin = "anonymous";
      let settled = false;
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(null);
        }
      }, 3500);
      img.onload = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        try {
          const size = 64;
          const canvas = document.createElement("canvas");
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) {
            resolve(null);
            return;
          }
          ctx.drawImage(img, 0, 0, size, size);
          const { data } = ctx.getImageData(0, 0, size, size);
          let jpegBase64 = "";
          if (getConfiguredGeminiApiKey()) {
            const aiSize = 128;
            const aiCanvas = document.createElement("canvas");
            aiCanvas.width = aiSize;
            aiCanvas.height = aiSize;
            const aiCtx = aiCanvas.getContext("2d");
            if (aiCtx) {
              aiCtx.drawImage(img, 0, 0, aiSize, aiSize);
              const dataUrl = aiCanvas.toDataURL("image/jpeg", 0.78);
              const commaIdx = dataUrl.indexOf(",");
              jpegBase64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : "";
            }
          }
          resolve({ rgba: data, width: size, height: size, jpegBase64 });
        } catch {
          resolve(null);
        }
      };
      img.onerror = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        resolve(null);
      };
      img.src = imageUrl;
    });
  }
  function readAiCacheMap() {
    try {
      const raw = localStorage.getItem(AI_PALETTE_CACHE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }
  function writeAiCacheMap(map) {
    try {
      const entries = Object.entries(map);
      if (entries.length > MAX_CACHE_ENTRIES) {
        entries.sort((a, b) => (b[1]?.updatedAt || 0) - (a[1]?.updatedAt || 0));
        const trimmed = {};
        for (const [k, v] of entries.slice(0, MAX_CACHE_ENTRIES)) {
          trimmed[k] = v;
        }
        localStorage.setItem(AI_PALETTE_CACHE_KEY, JSON.stringify(trimmed));
        return;
      }
      localStorage.setItem(AI_PALETTE_CACHE_KEY, JSON.stringify(map));
    } catch {
    }
  }
  function getCachedAiPalette(imageUrl) {
    const clean = (imageUrl || "").trim();
    if (!clean) return null;
    const map = readAiCacheMap();
    const entry = map[clean];
    if (!entry || !entry.palette || !entry.palette.isDynamic) return null;
    entry.updatedAt = Date.now();
    writeAiCacheMap(map);
    return { palette: entry.palette, source: entry.source };
  }
  function saveCachedAiPalette(imageUrl, palette, source) {
    const clean = (imageUrl || "").trim();
    if (!clean || !palette.isDynamic) return;
    const map = readAiCacheMap();
    map[clean] = { palette, source, updatedAt: Date.now() };
    writeAiCacheMap(map);
  }
  function isValidGeminiKey(val) {
    const clean = (val || "").trim();
    if (!clean || clean === "MY_GEMINI_API_KEY" || clean.length < 16) return "";
    return clean;
  }
  function getConfiguredGeminiApiKey() {
    try {
      const stored = isValidGeminiKey(localStorage.getItem(GEMINI_KEY_STORAGE_KEY));
      if (stored) return stored;
    } catch {
    }
    const bundled = true ? "" : "";
    return isValidGeminiKey(bundled);
  }
  function setGeminiApiKey(apiKey) {
    const clean = (apiKey || "").trim();
    try {
      if (!clean) {
        localStorage.removeItem(GEMINI_KEY_STORAGE_KEY);
      } else {
        localStorage.setItem(GEMINI_KEY_STORAGE_KEY, clean);
      }
    } catch {
    }
  }
  function parseGeminiPaletteResponse(rawText) {
    if (!rawText || typeof rawText !== "string") return null;
    let cleaned = rawText.trim();
    const fenced = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced) cleaned = fenced[1].trim();
    const braceMatch = cleaned.match(/\{[\s\S]*\}/);
    if (braceMatch) cleaned = braceMatch[0];
    try {
      const parsed = JSON.parse(cleaned);
      const hexRe = /^#[0-9a-fA-F]{6}$/;
      const accentHex = typeof parsed.accentHex === "string" ? parsed.accentHex.trim() : "";
      const accent2Hex = typeof parsed.accent2Hex === "string" ? parsed.accent2Hex.trim() : "";
      const ambientHex = typeof parsed.ambientHex === "string" ? parsed.ambientHex.trim() : "";
      if (!hexRe.test(accentHex) || !hexRe.test(accent2Hex) || !hexRe.test(ambientHex)) {
        return null;
      }
      return { accentHex, accent2Hex, ambientHex };
    } catch {
      return null;
    }
  }
  async function refinePaletteWithGeminiVision(jpegBase64, trackMeta, sourceImageUrl) {
    const apiKey = getConfiguredGeminiApiKey();
    if (!apiKey || !jpegBase64) return null;
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
      const trackContext = trackMeta.title ? `Track: "${trackMeta.title}"${trackMeta.artist ? ` by ${trackMeta.artist}` : ""}.` : "";
      const prompt = `You are a music app art director extracting an Apple Liquid Glass UI color palette from this album cover. ${trackContext} Choose 3 exact #RRGGBB hex colors: 1) accentHex: the signature vibrant iconic color of the cover (bright enough to glow on dark glass; avoid muddy beige/brown if lush foliage, neon, crimson, or vibrant tones exist). 2) accent2Hex: a harmonious secondary color present in the artwork. 3) ambientHex: the deep atmospheric mood color for frosted glass tinting. Respond ONLY with valid JSON: {"accentHex":"#......","accent2Hex":"#......","ambientHex":"#......"}.`;
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: "image/jpeg",
                    data: jpegBase64
                  }
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
            maxOutputTokens: 160
          }
        })
      });
      if (!res.ok) return null;
      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      const seed = parseGeminiPaletteResponse(text);
      if (!seed) return null;
      const palette = buildPaletteFromSeedColors(
        seed.accentHex,
        seed.accent2Hex,
        seed.ambientHex,
        sourceImageUrl
      );
      if (!palette) return null;
      saveCachedAiPalette(sourceImageUrl, palette, "gemini-vision");
      return palette;
    } catch {
      return null;
    }
  }

  // spicetify-cronotofy/src/dynamicTheme.ts
  var DYNAMIC_THEME_STYLE_ID = "cronotofy-dynamic-theme-style";
  var LAST_PALETTE_STORAGE_KEY = "cronotofy_last_song_palette_v3";
  var DEFAULT_PALETTE = {
    sourceImageUrl: "",
    isDynamic: false,
    accent: "#e2e8f0",
    accentRgb: "226, 232, 240",
    accent2: "#94a3b8",
    accent2Rgb: "148, 163, 184",
    accentSoft: "#f1f5f9",
    accentContrast: "#060910",
    bgMain: "#0b0f17",
    bgMainRgb: "11, 15, 23",
    bgElevated: "#131924",
    bgHighlight: "#1c2433",
    bgSidebar: "#080b12",
    bgSidebarRgb: "8, 11, 18",
    bgPlayer: "#090d16",
    bgCard: "#111722",
    bgCardRgb: "17, 23, 34"
  };
  function loadPersistedPalette() {
    try {
      const raw = localStorage.getItem(LAST_PALETTE_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.isDynamic === true && typeof parsed.accent === "string" && typeof parsed.accentRgb === "string" && typeof parsed.bgMainRgb === "string" && typeof parsed.bgCardRgb === "string") {
        return { ...DEFAULT_PALETTE, ...parsed, isDynamic: true };
      }
    } catch {
    }
    return null;
  }
  function savePersistedPalette(palette) {
    if (!palette.isDynamic) return;
    try {
      localStorage.setItem(LAST_PALETTE_STORAGE_KEY, JSON.stringify(palette));
    } catch {
    }
  }
  async function extractViaSpicetifyFallback(imageUrl, trackUri) {
    try {
      if (trackUri && typeof Spicetify !== "undefined" && Spicetify.colorExtractor) {
        const colors = await Spicetify.colorExtractor(trackUri);
        const rawAccent = colors?.VIBRANT || colors?.LIGHT_VIBRANT || colors?.PROMINENT || colors?.DARK_VIBRANT || "";
        if (hexToRgb(rawAccent)) {
          const rawAccent2 = colors?.LIGHT_VIBRANT || colors?.DARK_VIBRANT || rawAccent;
          const rawAmbient = colors?.DARK_VIBRANT || colors?.DESATURATED || rawAccent;
          return buildPaletteFromSeedColors(rawAccent, rawAccent2, rawAmbient, imageUrl);
        }
      }
    } catch {
    }
    return null;
  }
  var DYNAMIC_STYLE_CSS = `
:root {
  --cronotofy-accent: #e2e8f0;
  --cronotofy-accent-rgb: 226, 232, 240;
  --cronotofy-accent-2: #94a3b8;
  --cronotofy-accent-2-rgb: 148, 163, 184;
  --cronotofy-accent-soft: #f1f5f9;
  --cronotofy-accent-contrast: #060910;
  --cronotofy-bg-main: #0b0f17;
  --cronotofy-bg-main-rgb: 11, 15, 23;
  --cronotofy-bg-elevated: #131924;
  --cronotofy-bg-highlight: #1c2433;
  --cronotofy-bg-sidebar: #080b12;
  --cronotofy-bg-sidebar-rgb: 8, 11, 18;
  --cronotofy-bg-player: #090d16;
  --cronotofy-bg-card: #111722;
  --cronotofy-bg-card-rgb: 17, 23, 34;
}

.Root__main-view,
.Root__nav-bar,
.Root__now-playing-bar,
.Root__right-sidebar,
#main {
  transition: background-color 0.7s ease, border-color 0.5s ease;
}

html.cronotofy-playing-theme {
  --spice-main: var(--cronotofy-bg-main) !important;
  --spice-rgb-main: var(--cronotofy-bg-main-rgb) !important;
  --spice-main-elevated: var(--cronotofy-bg-elevated) !important;
  --spice-rgb-main-elevated: var(--cronotofy-bg-card-rgb) !important;
  --spice-sidebar: var(--cronotofy-bg-sidebar) !important;
  --spice-rgb-sidebar: var(--cronotofy-bg-sidebar-rgb) !important;
  --spice-player: var(--cronotofy-bg-player) !important;
  --spice-rgb-player: var(--cronotofy-bg-sidebar-rgb) !important;
  --spice-card: var(--cronotofy-bg-card) !important;
  --spice-rgb-card: var(--cronotofy-bg-card-rgb) !important;
  --spice-highlight: var(--cronotofy-bg-highlight) !important;
  --spice-rgb-highlight: var(--cronotofy-bg-card-rgb) !important;
  --spice-highlight-elevated: var(--cronotofy-bg-highlight) !important;
  --spice-tab-active: var(--cronotofy-bg-highlight) !important;
  --spice-button: var(--cronotofy-accent) !important;
  --spice-rgb-button: var(--cronotofy-accent-rgb) !important;
  --spice-button-active: var(--cronotofy-accent-2) !important;
  --spice-rgb-button-active: var(--cronotofy-accent-2-rgb) !important;
}

html.cronotofy-playing-theme .encore-dark-theme,
html.cronotofy-playing-theme .encore-dark-theme .encore-base-set {
  --background-base: rgba(var(--cronotofy-bg-main-rgb), 0.18) !important;
  --background-elevated-base: rgba(var(--cronotofy-bg-card-rgb), 0.24) !important;
  --background-elevated-highlight: rgba(var(--cronotofy-bg-card-rgb), 0.36) !important;
  --background-highlight: rgba(255, 255, 255, 0.08) !important;
  --background-tinted-base: rgba(var(--cronotofy-accent-rgb), 0.12) !important;
  --section-background-base: rgba(var(--cronotofy-bg-card-rgb), 0.22) !important;
  --text-bright-accent: var(--cronotofy-accent) !important;
  --essential-bright-accent: var(--cronotofy-accent) !important;
}

html.cronotofy-playing-theme .encore-dark-theme .encore-bright-accent-set {
  --background-base: var(--cronotofy-accent) !important;
  --background-highlight: var(--cronotofy-accent-2) !important;
  --text-bright-accent: var(--cronotofy-accent-contrast) !important;
  --essential-base: var(--cronotofy-accent-contrast) !important;
}

html.cronotofy-playing-theme .Root__main-view {
  background-color: rgba(var(--cronotofy-bg-main-rgb), 0.12) !important;
  background-image:
    radial-gradient(ellipse at 25% 0%, rgba(var(--cronotofy-accent-rgb), 0.14) 0%, transparent 58%),
    radial-gradient(ellipse at 85% 95%, rgba(var(--cronotofy-accent-2-rgb), 0.10) 0%, transparent 52%) !important;
}

html.cronotofy-playing-theme.cronotofy-route-active .Root__main-view {
  background-color: rgba(var(--cronotofy-bg-main-rgb), 0.04) !important;
}

html.cronotofy-playing-theme .Root__nav-bar,
html.cronotofy-playing-theme .Root__right-sidebar,
html.cronotofy-playing-theme .Root__right-sidebar-peek,
html.cronotofy-playing-theme .Root__globalNav::before {
  background-color: rgba(var(--cronotofy-bg-sidebar-rgb), 0.26) !important;
}

html.cronotofy-playing-theme .Root__now-playing-bar {
  background-color: rgba(var(--cronotofy-bg-sidebar-rgb), 0.26) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.14) !important;
}

html.cronotofy-playing-theme [data-testid="progress-bar"] [data-testid="progress-bar-background"] > div,
html.cronotofy-playing-theme .epWhU7hBBosSHKQcommv,
html.cronotofy-playing-theme .x-progressBar-fillColor {
  background-color: var(--cronotofy-accent) !important;
  background: linear-gradient(90deg, var(--cronotofy-accent), var(--cronotofy-accent-2)) !important;
  box-shadow: none !important;
}
`;
  function ensureDynamicThemeStyle() {
    if (typeof document === "undefined") return;
    const existing = document.getElementById(DYNAMIC_THEME_STYLE_ID);
    if (existing) {
      if (existing.textContent !== DYNAMIC_STYLE_CSS) {
        existing.textContent = DYNAMIC_STYLE_CSS;
      }
      return;
    }
    const style = document.createElement("style");
    style.id = DYNAMIC_THEME_STYLE_ID;
    style.textContent = DYNAMIC_STYLE_CSS;
    document.head.appendChild(style);
  }
  function applyCssVariables(palette) {
    if (typeof document === "undefined") return;
    const rootStyle = document.documentElement.style;
    rootStyle.setProperty("--cronotofy-accent", palette.accent);
    rootStyle.setProperty("--cronotofy-accent-rgb", palette.accentRgb);
    rootStyle.setProperty("--cronotofy-accent-2", palette.accent2);
    rootStyle.setProperty("--cronotofy-accent-2-rgb", palette.accent2Rgb);
    rootStyle.setProperty("--cronotofy-accent-soft", palette.accentSoft);
    rootStyle.setProperty("--cronotofy-accent-contrast", palette.accentContrast);
    rootStyle.setProperty("--cronotofy-bg-main", palette.bgMain);
    rootStyle.setProperty("--cronotofy-bg-main-rgb", palette.bgMainRgb);
    rootStyle.setProperty("--cronotofy-bg-elevated", palette.bgElevated);
    rootStyle.setProperty("--cronotofy-bg-highlight", palette.bgHighlight);
    rootStyle.setProperty("--cronotofy-bg-sidebar", palette.bgSidebar);
    rootStyle.setProperty("--cronotofy-bg-sidebar-rgb", palette.bgSidebarRgb);
    rootStyle.setProperty("--cronotofy-bg-player", palette.bgPlayer);
    rootStyle.setProperty("--cronotofy-bg-card", palette.bgCard);
    rootStyle.setProperty("--cronotofy-bg-card-rgb", palette.bgCardRgb);
  }
  var DynamicThemeController = class {
    constructor() {
      this.currentPalette = DEFAULT_PALETTE;
      this.lastTrackSnapshot = null;
      this.requestSeq = 0;
      this.listeners = /* @__PURE__ */ new Set();
      ensureDynamicThemeStyle();
      const persisted = loadPersistedPalette();
      if (persisted) {
        this.currentPalette = persisted;
        applyCssVariables(persisted);
        if (typeof document !== "undefined") {
          document.documentElement.classList.add("cronotofy-playing-theme");
        }
      } else {
        applyCssVariables(DEFAULT_PALETTE);
      }
    }
    notify() {
      for (const fn of this.listeners) {
        try {
          fn();
        } catch {
        }
      }
    }
    subscribe(fn) {
      this.listeners.add(fn);
      return () => {
        this.listeners.delete(fn);
      };
    }
    isEnabled() {
      return true;
    }
    getPalette() {
      return this.currentPalette;
    }
    setEnabled(_enabled) {
      void this.updateFromLiveTrack(this.lastTrackSnapshot);
    }
    applyDynamicPalette(palette) {
      this.currentPalette = palette;
      savePersistedPalette(palette);
      applyCssVariables(palette);
      if (typeof document !== "undefined") {
        document.documentElement.classList.add("cronotofy-playing-theme");
      }
      this.notify();
    }
    async runCoverAnalysis(imageUrl, trackUri, meta, reqId) {
      const cleanUrl = (imageUrl || "").trim();
      if (!cleanUrl) return;
      const hasGemini = Boolean(getConfiguredGeminiApiKey());
      const cached = getCachedAiPalette(cleanUrl);
      if (cached) {
        this.applyDynamicPalette(cached.palette);
        if (cached.source === "gemini-vision" || !hasGemini) {
          return;
        }
      }
      const visual = await extractCoverVisualData(cleanUrl);
      if (reqId !== this.requestSeq) return;
      if (!cached) {
        let localPalette = null;
        if (visual) {
          localPalette = quantizePixelsOklab(visual.rgba, visual.width, visual.height, cleanUrl);
        }
        if (!localPalette) {
          localPalette = await extractViaSpicetifyFallback(cleanUrl, trackUri);
          if (reqId !== this.requestSeq) return;
        }
        if (localPalette && localPalette.isDynamic) {
          saveCachedAiPalette(cleanUrl, localPalette, "oklab-kmeans");
          this.applyDynamicPalette(localPalette);
        }
      }
      if (hasGemini && visual?.jpegBase64) {
        void refinePaletteWithGeminiVision(visual.jpegBase64, meta, cleanUrl).then((refined) => {
          if (reqId !== this.requestSeq || !refined) return;
          this.applyDynamicPalette(refined);
        });
      }
    }
    async seedFromCoverIfNeeded(imageUrl, trackUri) {
      if (this.currentPalette.isDynamic || !imageUrl) return;
      const reqId = ++this.requestSeq;
      await this.runCoverAnalysis(imageUrl, trackUri, {}, reqId);
    }
    async updateFromLiveTrack(track) {
      this.lastTrackSnapshot = track;
      ensureDynamicThemeStyle();
      if (!track || !track.albumImageUrl) {
        return;
      }
      const cached = getCachedAiPalette(track.albumImageUrl);
      const hasGemini = Boolean(getConfiguredGeminiApiKey());
      if (this.currentPalette.isDynamic && this.currentPalette.sourceImageUrl === track.albumImageUrl && (cached?.source === "gemini-vision" || !hasGemini)) {
        if (typeof document !== "undefined") {
          document.documentElement.classList.add("cronotofy-playing-theme");
        }
        return;
      }
      const reqId = ++this.requestSeq;
      await this.runCoverAnalysis(
        track.albumImageUrl,
        track.uri,
        { title: track.name, artist: track.artistName },
        reqId
      );
    }
  };

  // spicetify-cronotofy/src/i18n.ts
  var TRANSLATIONS = {
    en: {
      brandSubtitle: "Native music analytics \xB7 Real-time telemetry",
      tabs: {
        overview: "Overview",
        artists: "Artists",
        tracks: "Tracks",
        albums: "Albums",
        live: "Live Activity"
      },
      periods: {
        short_term: "1 Month",
        medium_term: "6 Months",
        long_term: "All Time"
      },
      nowPlaying: "Now Playing",
      paused: "Paused",
      currentSession: "Current session",
      today: "Today",
      idleHint: "Play any song on Spotify to start live telemetry.",
      loadingAnalytics: "Loading your Spotify stats...",
      kpis: {
        recordedTime: "Recorded Time",
        todayLabel: "Today",
        annualInCronotofy: (h) => `${h} annual in Cronotofy`,
        totalMod: (h) => `Total: ${h}`,
        topArtist: (period) => `Top Artist (${period})`,
        artistsAnalyzed: (n) => `${n} artists analyzed`,
        topTrack: (period) => `Top Track (${period})`,
        noData: "No data",
        favoriteGenre: "Favorite Genre",
        varied: "Varied",
        affinityAndRecent: (pct, n) => `${pct}% affinity \xB7 ${n} recent plays`,
        tracksInRanking: (n) => `${n} tracks in ranking`
      },
      sections: {
        top5Artists: "Top 5 Artists",
        top5Tracks: "Top 5 Tracks",
        top4Albums: "Top 4 Albums",
        genreDna: "Genre DNA",
        mainGenresBadge: (n) => `${n} top genres`,
        viewAll: (n) => `View all (${n}) \u2192`,
        tracksRanking: (period) => `Track Ranking \xB7 ${period}`,
        tracksBadge: (n) => `${n} tracks`,
        tracksListenedToday: "Listened Today",
        accumulatedDesktop: "Desktop Total",
        exactSecondBySecond: "Exact second-by-second tracking",
        capturedTracks: "Captured Tracks",
        completedPlays: (n) => `${n} completed plays`,
        lastSync: "Local Storage",
        pending: "Active",
        topRealTimeTracks: "Tracks by Real Listening Time",
        topNBadge: (n) => `Top ${n}`,
        realArtistsAndRecent: "Real Artists & Recent History",
        clearLocalHistory: "Clear local history",
        recordedPlays: (n) => `${n} recorded plays`,
        latestCapturedPlays: "Latest Captured Plays",
        localDateLabel: (d) => `Local date: ${d}`
      },
      entities: {
        spotifyArtist: "Spotify Artist",
        untitled: "Untitled",
        unknownArtist: "Unknown Artist",
        popularityLabel: (p) => `Pop ${p}`,
        topTracksCount: (n) => `${n} top tracks`,
        songSingular: "track",
        songPlural: "tracks",
        playSingular: "play",
        playPlural: "plays"
      },
      empty: {
        noArtistsPeriod: "No artists available for this period.",
        noTracksPeriod: "No tracks available for this period.",
        noAlbumsPeriod: "No albums to display.",
        noGenres: "No genre tags available on Spotify.",
        noArtistsFound: "No top artists found for this period.",
        noTrackedTimeYet: "No accumulated time yet. Play any track on Spotify and it will appear live here.",
        noRecentPlaysYet: "Tracks played \u2265 25s will appear in this chronological timeline."
      },
      actions: {
        play: "Play",
        pause: "Pause",
        addToQueue: "Add to queue",
        playingNowToast: (title) => `Playing: ${title}`,
        playbackErrorToast: "Could not start playback",
        queuedToast: (title) => `Added to queue: ${title}`,
        queueErrorToast: "Could not add to queue",
        historyClearedToast: "Local history cleared"
      },
      time: {
        justNow: "Just now",
        secondsAgo: (s) => `${s}s ago`,
        minutesAgo: (m) => `${m}m ago`,
        hoursAgo: (h) => `${h}h ago`
      },
      errorBoundary: {
        title: "Something went wrong in Cronotofy",
        fallbackMsg: "An unexpected error occurred while rendering this view.",
        retry: "Retry"
      }
    },
    es: {
      brandSubtitle: "Anal\xEDtica musical nativa \xB7 Telemetr\xEDa en tiempo real",
      tabs: {
        overview: "Resumen",
        artists: "Artistas",
        tracks: "Canciones",
        albums: "\xC1lbumes",
        live: "Actividad en Vivo"
      },
      periods: {
        short_term: "1 Mes",
        medium_term: "6 Meses",
        long_term: "General"
      },
      nowPlaying: "Reproduciendo ahora",
      paused: "En pausa",
      currentSession: "Sesi\xF3n actual",
      today: "Hoy",
      idleHint: "Reproduce cualquier canci\xF3n en Spotify para capturar telemetr\xEDa en vivo.",
      loadingAnalytics: "Cargando tus estad\xEDsticas de Spotify...",
      kpis: {
        recordedTime: "Tiempo Registrado",
        todayLabel: "Hoy",
        annualInCronotofy: (h) => `${h} anual en Cronotofy`,
        totalMod: (h) => `Total: ${h}`,
        topArtist: (period) => `Top Artista (${period})`,
        artistsAnalyzed: (n) => `${n} artistas analizados`,
        topTrack: (period) => `Top Canci\xF3n (${period})`,
        noData: "Sin datos",
        favoriteGenre: "G\xE9nero Favorito",
        varied: "Variado",
        affinityAndRecent: (pct, n) => `${pct}% de afinidad \xB7 ${n} escuchas recientes`,
        tracksInRanking: (n) => `${n} canciones en ranking`
      },
      sections: {
        top5Artists: "Top 5 Artistas",
        top5Tracks: "Top 5 Canciones",
        top4Albums: "Top 4 \xC1lbumes",
        genreDna: "ADN de G\xE9neros",
        mainGenresBadge: (n) => `${n} principales`,
        viewAll: (n) => `Ver todos (${n}) \u2192`,
        tracksRanking: (period) => `Ranking de Canciones \xB7 ${period}`,
        tracksBadge: (n) => `${n} canciones`,
        tracksListenedToday: "Escuchado Hoy",
        accumulatedDesktop: "Acumulado en Escritorio",
        exactSecondBySecond: "Medici\xF3n exacta segundo a segundo",
        capturedTracks: "Pistas Capturadas",
        completedPlays: (n) => `${n} reproducciones completas`,
        lastSync: "Almacenamiento Local",
        pending: "Activo",
        topRealTimeTracks: "Canciones por Tiempo Real Escuchado",
        topNBadge: (n) => `Top ${n}`,
        realArtistsAndRecent: "Artistas Reales e Historial Reciente",
        clearLocalHistory: "Limpiar historial local",
        recordedPlays: (n) => `${n} reproducciones registradas`,
        latestCapturedPlays: "\xDAltimas Reproducciones Capturadas",
        localDateLabel: (d) => `Fecha local: ${d}`
      },
      entities: {
        spotifyArtist: "Artista de Spotify",
        untitled: "Sin t\xEDtulo",
        unknownArtist: "Artista desconocido",
        popularityLabel: (p) => `Pop ${p}`,
        topTracksCount: (n) => `${n} top tracks`,
        songSingular: "canci\xF3n",
        songPlural: "canciones",
        playSingular: "play",
        playPlural: "plays"
      },
      empty: {
        noArtistsPeriod: "Sin artistas disponibles para este per\xEDodo.",
        noTracksPeriod: "Sin canciones disponibles para este per\xEDodo.",
        noAlbumsPeriod: "Sin \xE1lbumes para mostrar.",
        noGenres: "Sin etiquetas de g\xE9nero disponibles en Spotify.",
        noArtistsFound: "No se encontraron artistas principales para este per\xEDodo.",
        noTrackedTimeYet: "A\xFAn no hay tiempo acumulado. Dale play a cualquier canci\xF3n en Spotify y aparecer\xE1 aqu\xED en vivo.",
        noRecentPlaysYet: "Las canciones reproducidas \u2265 25s aparecer\xE1n en esta l\xEDnea de tiempo cronol\xF3gica."
      },
      actions: {
        play: "Reproducir",
        pause: "Pausar",
        addToQueue: "A\xF1adir a la cola",
        playingNowToast: (title) => `Reproduciendo: ${title}`,
        playbackErrorToast: "No se pudo iniciar la reproducci\xF3n",
        queuedToast: (title) => `A\xF1adida a la cola: ${title}`,
        queueErrorToast: "No se pudo a\xF1adir a la cola",
        historyClearedToast: "Historial local reiniciado"
      },
      time: {
        justNow: "Hace un momento",
        secondsAgo: (s) => `Hace ${s}s`,
        minutesAgo: (m) => `Hace ${m}m`,
        hoursAgo: (h) => `Hace ${h}h`
      },
      errorBoundary: {
        title: "Ocurri\xF3 un error al mostrar Cronotofy",
        fallbackMsg: "Ocurri\xF3 un problema inesperado al renderizar esta vista.",
        retry: "Reintentar"
      }
    },
    pt: {
      brandSubtitle: "An\xE1lise musical nativa \xB7 Telemetria em tempo real",
      tabs: {
        overview: "Resumo",
        artists: "Artistas",
        tracks: "M\xFAsicas",
        albums: "\xC1lbuns",
        live: "Atividade ao Vivo"
      },
      periods: {
        short_term: "1 M\xEAs",
        medium_term: "6 Meses",
        long_term: "Geral"
      },
      nowPlaying: "Tocando agora",
      paused: "Pausado",
      currentSession: "Sess\xE3o atual",
      today: "Hoje",
      idleHint: "Reproduza qualquer m\xFAsica no Spotify para iniciar a telemetria ao vivo.",
      loadingAnalytics: "Carregando suas estat\xEDsticas do Spotify...",
      kpis: {
        recordedTime: "Tempo Registrado",
        todayLabel: "Hoje",
        annualInCronotofy: (h) => `${h} anual no Cronotofy`,
        totalMod: (h) => `Total: ${h}`,
        topArtist: (period) => `Top Artista (${period})`,
        artistsAnalyzed: (n) => `${n} artistas analisados`,
        topTrack: (period) => `Top M\xFAsica (${period})`,
        noData: "Sem dados",
        favoriteGenre: "G\xEAnero Favorito",
        varied: "Variado",
        affinityAndRecent: (pct, n) => `${pct}% afinidade \xB7 ${n} recentes`,
        tracksInRanking: (n) => `${n} m\xFAsicas no ranking`
      },
      sections: {
        top5Artists: "Top 5 Artistas",
        top5Tracks: "Top 5 M\xFAsicas",
        top4Albums: "Top 4 \xC1lbuns",
        genreDna: "DNA de G\xEAneros",
        mainGenresBadge: (n) => `${n} principais`,
        viewAll: (n) => `Ver todos (${n}) \u2192`,
        tracksRanking: (period) => `Ranking de M\xFAsicas \xB7 ${period}`,
        tracksBadge: (n) => `${n} m\xFAsicas`,
        tracksListenedToday: "Ouvido Hoje",
        accumulatedDesktop: "Acumulado no Desktop",
        exactSecondBySecond: "Medi\xE7\xE3o exata segundo a segundo",
        capturedTracks: "Faixas Capturadas",
        completedPlays: (n) => `${n} reprodu\xE7\xF5es completas`,
        lastSync: "Armazenamento Local",
        pending: "Ativo",
        topRealTimeTracks: "M\xFAsicas por Tempo Real Ouvido",
        topNBadge: (n) => `Top ${n}`,
        realArtistsAndRecent: "Artistas Reais e Hist\xF3rico Recente",
        clearLocalHistory: "Limpar hist\xF3rico local",
        recordedPlays: (n) => `${n} reprodu\xE7\xF5es registradas`,
        latestCapturedPlays: "\xDAltimas Reprodu\xE7\xF5es Capturadas",
        localDateLabel: (d) => `Data local: ${d}`
      },
      entities: {
        spotifyArtist: "Artista do Spotify",
        untitled: "Sem t\xEDtulo",
        unknownArtist: "Artista desconhecido",
        popularityLabel: (p) => `Pop ${p}`,
        topTracksCount: (n) => `${n} top m\xFAsicas`,
        songSingular: "m\xFAsica",
        songPlural: "m\xFAsicas",
        playSingular: "play",
        playPlural: "plays"
      },
      empty: {
        noArtistsPeriod: "Sem artistas dispon\xEDveis para este per\xEDodo.",
        noTracksPeriod: "Sem m\xFAsicas dispon\xEDveis para este per\xEDodo.",
        noAlbumsPeriod: "Sem \xE1lbuns para mostrar.",
        noGenres: "Sem tags de g\xEAnero dispon\xEDveis no Spotify.",
        noArtistsFound: "Nenhum artista principal encontrado para este per\xEDodo.",
        noTrackedTimeYet: "Ainda n\xE3o h\xE1 tempo acumulado. D\xEA play em qualquer m\xFAsica no Spotify.",
        noRecentPlaysYet: "M\xFAsicas tocadas \u2265 25s aparecer\xE3o nesta linha do tempo."
      },
      actions: {
        play: "Reproduzir",
        pause: "Pausar",
        addToQueue: "Adicionar \xE0 fila",
        playingNowToast: (title) => `Tocando: ${title}`,
        playbackErrorToast: "N\xE3o foi poss\xEDvel iniciar a reprodu\xE7\xE3o",
        queuedToast: (title) => `Adicionada \xE0 fila: ${title}`,
        queueErrorToast: "N\xE3o foi poss\xEDvel adicionar \xE0 fila",
        historyClearedToast: "Hist\xF3rico local limpo"
      },
      time: {
        justNow: "Agora mesmo",
        secondsAgo: (s) => `H\xE1 ${s}s`,
        minutesAgo: (m) => `H\xE1 ${m}m`,
        hoursAgo: (h) => `H\xE1 ${h}h`
      },
      errorBoundary: {
        title: "Algo deu errado no Cronotofy",
        fallbackMsg: "Ocorreu um erro inesperado ao renderizar esta visualiza\xE7\xE3o.",
        retry: "Tentar novamente"
      }
    },
    fr: {
      brandSubtitle: "Analytique musicale native \xB7 T\xE9l\xE9m\xE9trie en temps r\xE9el",
      tabs: {
        overview: "Aper\xE7u",
        artists: "Artistes",
        tracks: "Titres",
        albums: "Albums",
        live: "Activit\xE9 en direct"
      },
      periods: {
        short_term: "1 Mois",
        medium_term: "6 Mois",
        long_term: "Global"
      },
      nowPlaying: "Lecture en cours",
      paused: "En pause",
      currentSession: "Session actuelle",
      today: "Aujourd'hui",
      idleHint: "Lancez un titre sur Spotify pour activer la t\xE9l\xE9m\xE9trie en direct.",
      loadingAnalytics: "Chargement de vos statistiques Spotify...",
      kpis: {
        recordedTime: "Temps enregistr\xE9",
        todayLabel: "Aujourd'hui",
        annualInCronotofy: (h) => `${h} annuel sur Cronotofy`,
        totalMod: (h) => `Total : ${h}`,
        topArtist: (period) => `Top Artiste (${period})`,
        artistsAnalyzed: (n) => `${n} artistes analys\xE9s`,
        topTrack: (period) => `Top Titre (${period})`,
        noData: "Aucune donn\xE9e",
        favoriteGenre: "Genre favori",
        varied: "Vari\xE9",
        affinityAndRecent: (pct, n) => `${pct}% d'affinit\xE9 \xB7 ${n} \xE9coutes r\xE9centes`,
        tracksInRanking: (n) => `${n} titres class\xE9s`
      },
      sections: {
        top5Artists: "Top 5 Artistes",
        top5Tracks: "Top 5 Titres",
        top4Albums: "Top 4 Albums",
        genreDna: "ADN des genres",
        mainGenresBadge: (n) => `${n} principaux`,
        viewAll: (n) => `Tout voir (${n}) \u2192`,
        tracksRanking: (period) => `Classement des titres \xB7 ${period}`,
        tracksBadge: (n) => `${n} titres`,
        tracksListenedToday: "\xC9cout\xE9 aujourd'hui",
        accumulatedDesktop: "Total sur ordinateur",
        exactSecondBySecond: "Mesure exacte seconde par seconde",
        capturedTracks: "Titres captur\xE9s",
        completedPlays: (n) => `${n} lectures compl\xE8tes`,
        lastSync: "Stockage local",
        pending: "Actif",
        topRealTimeTracks: "Titres par temps d'\xE9coute r\xE9el",
        topNBadge: (n) => `Top ${n}`,
        realArtistsAndRecent: "Artistes r\xE9els & historique r\xE9cent",
        clearLocalHistory: "Effacer l'historique local",
        recordedPlays: (n) => `${n} \xE9coutes enregistr\xE9es`,
        latestCapturedPlays: "Derni\xE8res lectures captur\xE9es",
        localDateLabel: (d) => `Date locale : ${d}`
      },
      entities: {
        spotifyArtist: "Artiste Spotify",
        untitled: "Sans titre",
        unknownArtist: "Artiste inconnu",
        popularityLabel: (p) => `Pop ${p}`,
        topTracksCount: (n) => `${n} top titres`,
        songSingular: "titre",
        songPlural: "titres",
        playSingular: "\xE9coute",
        playPlural: "\xE9coutes"
      },
      empty: {
        noArtistsPeriod: "Aucun artiste disponible pour cette p\xE9riode.",
        noTracksPeriod: "Aucun titre disponible pour cette p\xE9riode.",
        noAlbumsPeriod: "Aucun album \xE0 afficher.",
        noGenres: "Aucun genre disponible sur Spotify.",
        noArtistsFound: "Aucun artiste principal trouv\xE9 pour cette p\xE9riode.",
        noTrackedTimeYet: "Aucun temps cumul\xE9. Lancez n'importe quel titre sur Spotify.",
        noRecentPlaysYet: "Les titres \xE9cout\xE9s \u2265 25s appara\xEEtront ici."
      },
      actions: {
        play: "Lire",
        pause: "Pause",
        addToQueue: "Ajouter \xE0 la file d'attente",
        playingNowToast: (title) => `Lecture : ${title}`,
        playbackErrorToast: "Impossible de lancer la lecture",
        queuedToast: (title) => `Ajout\xE9 \xE0 la file : ${title}`,
        queueErrorToast: "Impossible d'ajouter \xE0 la file",
        historyClearedToast: "Historique local effac\xE9"
      },
      time: {
        justNow: "\xC0 l'instant",
        secondsAgo: (s) => `Il y a ${s}s`,
        minutesAgo: (m) => `Il y a ${m}m`,
        hoursAgo: (h) => `Il y a ${h}h`
      },
      errorBoundary: {
        title: "Une erreur est survenue dans Cronotofy",
        fallbackMsg: "Une erreur inattendue s'est produite lors de l'affichage.",
        retry: "R\xE9essayer"
      }
    },
    de: {
      brandSubtitle: "Native Musik-Analyse \xB7 Echtzeit-Telemetrie",
      tabs: {
        overview: "\xDCbersicht",
        artists: "K\xFCnstler",
        tracks: "Songs",
        albums: "Alben",
        live: "Live-Aktivit\xE4t"
      },
      periods: {
        short_term: "1 Monat",
        medium_term: "6 Monate",
        long_term: "Gesamt"
      },
      nowPlaying: "L\xE4uft gerade",
      paused: "Pausiert",
      currentSession: "Aktuelle Sitzung",
      today: "Heute",
      idleHint: "Spiele einen Song auf Spotify ab, um Live-Telemetrie zu erfassen.",
      loadingAnalytics: "Spotify-Statistiken werden geladen...",
      kpis: {
        recordedTime: "Erfasste Zeit",
        todayLabel: "Heute",
        annualInCronotofy: (h) => `${h} j\xE4hrlich in Cronotofy`,
        totalMod: (h) => `Gesamt: ${h}`,
        topArtist: (period) => `Top-K\xFCnstler (${period})`,
        artistsAnalyzed: (n) => `${n} K\xFCnstler analysiert`,
        topTrack: (period) => `Top-Song (${period})`,
        noData: "Keine Daten",
        favoriteGenre: "Lieblingsgenre",
        varied: "Gemischt",
        affinityAndRecent: (pct, n) => `${pct}% Anteil \xB7 ${n} k\xFCrzliche Plays`,
        tracksInRanking: (n) => `${n} Songs im Ranking`
      },
      sections: {
        top5Artists: "Top 5 K\xFCnstler",
        top5Tracks: "Top 5 Songs",
        top4Albums: "Top 4 Alben",
        genreDna: "Genre-DNA",
        mainGenresBadge: (n) => `${n} Top-Genres`,
        viewAll: (n) => `Alle ansehen (${n}) \u2192`,
        tracksRanking: (period) => `Song-Ranking \xB7 ${period}`,
        tracksBadge: (n) => `${n} Songs`,
        tracksListenedToday: "Heute geh\xF6rt",
        accumulatedDesktop: "Desktop gesamt",
        exactSecondBySecond: "Sekundengenaue Erfassung",
        capturedTracks: "Erfasste Songs",
        completedPlays: (n) => `${n} vollst\xE4ndige Plays`,
        lastSync: "Lokaler Speicher",
        pending: "Aktiv",
        topRealTimeTracks: "Songs nach echter H\xF6rzeit",
        topNBadge: (n) => `Top ${n}`,
        realArtistsAndRecent: "Echte K\xFCnstler & Verlauf",
        clearLocalHistory: "Lokalen Verlauf l\xF6schen",
        recordedPlays: (n) => `${n} erfasste Plays`,
        latestCapturedPlays: "Zuletzt erfasste Plays",
        localDateLabel: (d) => `Lokales Datum: ${d}`
      },
      entities: {
        spotifyArtist: "Spotify-K\xFCnstler",
        untitled: "Ohne Titel",
        unknownArtist: "Unbekannter K\xFCnstler",
        popularityLabel: (p) => `Pop ${p}`,
        topTracksCount: (n) => `${n} Top-Songs`,
        songSingular: "Song",
        songPlural: "Songs",
        playSingular: "Play",
        playPlural: "Plays"
      },
      empty: {
        noArtistsPeriod: "Keine K\xFCnstler f\xFCr diesen Zeitraum verf\xFCgbar.",
        noTracksPeriod: "Keine Songs f\xFCr diesen Zeitraum verf\xFCgbar.",
        noAlbumsPeriod: "Keine Alben vorhanden.",
        noGenres: "Keine Genre-Daten auf Spotify verf\xFCgbar.",
        noArtistsFound: "Keine Top-K\xFCnstler f\xFCr diesen Zeitraum gefunden.",
        noTrackedTimeYet: "Noch keine H\xF6rzeit erfasst. Spiele einfach einen Song auf Spotify ab.",
        noRecentPlaysYet: "Songs mit \u2265 25s H\xF6rzeit erscheinen hier chronologisch."
      },
      actions: {
        play: "Abspielen",
        pause: "Pause",
        addToQueue: "In die Warteschlange",
        playingNowToast: (title) => `Spielt: ${title}`,
        playbackErrorToast: "Wiedergabe konnte nicht gestartet werden",
        queuedToast: (title) => `Zur Warteschlange hinzugef\xFCgt: ${title}`,
        queueErrorToast: "Konnte nicht zur Warteschlange hinzugef\xFCgt werden",
        historyClearedToast: "Lokaler Verlauf gel\xF6scht"
      },
      time: {
        justNow: "Gerade eben",
        secondsAgo: (s) => `Vor ${s}s`,
        minutesAgo: (m) => `Vor ${m}m`,
        hoursAgo: (h) => `Vor ${h}h`
      },
      errorBoundary: {
        title: "Fehler in Cronotofy",
        fallbackMsg: "Beim Anzeigen dieser Ansicht ist ein unerwarteter Fehler aufgetreten.",
        retry: "Erneut versuchen"
      }
    },
    it: {
      brandSubtitle: "Analisi musicale nativa \xB7 Telemetria in tempo reale",
      tabs: {
        overview: "Panoramica",
        artists: "Artisti",
        tracks: "Brani",
        albums: "Album",
        live: "Attivit\xE0 Live"
      },
      periods: {
        short_term: "1 Mese",
        medium_term: "6 Mesi",
        long_term: "Sempre"
      },
      nowPlaying: "In riproduzione",
      paused: "In pausa",
      currentSession: "Sessione attuale",
      today: "Oggi",
      idleHint: "Riproduci qualsiasi brano su Spotify per avviare la telemetria live.",
      loadingAnalytics: "Caricamento statistiche Spotify...",
      kpis: {
        recordedTime: "Tempo registrato",
        todayLabel: "Oggi",
        annualInCronotofy: (h) => `${h} annuale su Cronotofy`,
        totalMod: (h) => `Totale: ${h}`,
        topArtist: (period) => `Top Artista (${period})`,
        artistsAnalyzed: (n) => `${n} artisti analizzati`,
        topTrack: (period) => `Top Brano (${period})`,
        noData: "Nessun dato",
        favoriteGenre: "Genere preferito",
        varied: "Vario",
        affinityAndRecent: (pct, n) => `${pct}% affinit\xE0 \xB7 ${n} recenti`,
        tracksInRanking: (n) => `${n} brani in classifica`
      },
      sections: {
        top5Artists: "Top 5 Artisti",
        top5Tracks: "Top 5 Brani",
        top4Albums: "Top 4 Album",
        genreDna: "DNA dei Generi",
        mainGenresBadge: (n) => `${n} principali`,
        viewAll: (n) => `Vedi tutti (${n}) \u2192`,
        tracksRanking: (period) => `Classifica Brani \xB7 ${period}`,
        tracksBadge: (n) => `${n} brani`,
        tracksListenedToday: "Ascoltato oggi",
        accumulatedDesktop: "Totale su Desktop",
        exactSecondBySecond: "Misurazione esatta secondo per secondo",
        capturedTracks: "Brani acquisiti",
        completedPlays: (n) => `${n} ascolti completi`,
        lastSync: "Archivio locale",
        pending: "Attivo",
        topRealTimeTracks: "Brani per tempo reale di ascolto",
        topNBadge: (n) => `Top ${n}`,
        realArtistsAndRecent: "Artisti reali e cronologia",
        clearLocalHistory: "Cancella cronologia locale",
        recordedPlays: (n) => `${n} ascolti registrati`,
        latestCapturedPlays: "Ultimi ascolti acquisiti",
        localDateLabel: (d) => `Data locale: ${d}`
      },
      entities: {
        spotifyArtist: "Artista Spotify",
        untitled: "Senza titolo",
        unknownArtist: "Artista sconosciuto",
        popularityLabel: (p) => `Pop ${p}`,
        topTracksCount: (n) => `${n} top brani`,
        songSingular: "brano",
        songPlural: "brani",
        playSingular: "riproduzione",
        playPlural: "riproduzioni"
      },
      empty: {
        noArtistsPeriod: "Nessun artista disponibile per questo periodo.",
        noTracksPeriod: "Nessun brano disponibile per questo periodo.",
        noAlbumsPeriod: "Nessun album da mostrare.",
        noGenres: "Nessun tag di genere disponibile su Spotify.",
        noArtistsFound: "Nessun artista principale trovato per questo periodo.",
        noTrackedTimeYet: "Nessun tempo registrato. Riproduci un brano su Spotify per iniziare.",
        noRecentPlaysYet: "I brani ascoltati \u2265 25s appariranno in questa cronologia."
      },
      actions: {
        play: "Riproduci",
        pause: "Pausa",
        addToQueue: "Aggiungi in coda",
        playingNowToast: (title) => `In riproduzione: ${title}`,
        playbackErrorToast: "Impossibile avviare la riproduzione",
        queuedToast: (title) => `Aggiunto in coda: ${title}`,
        queueErrorToast: "Impossibile aggiungere in coda",
        historyClearedToast: "Cronologia locale cancellata"
      },
      time: {
        justNow: "Proprio ora",
        secondsAgo: (s) => `${s}s fa`,
        minutesAgo: (m) => `${m}m fa`,
        hoursAgo: (h) => `${h}h fa`
      },
      errorBoundary: {
        title: "Si \xE8 verificato un errore in Cronotofy",
        fallbackMsg: "Errore imprevisto durante il rendering della vista.",
        retry: "Riprova"
      }
    }
  };
  function detectSpotifyLocale() {
    try {
      const spicetifyLoc = typeof Spicetify !== "undefined" ? Spicetify.Locale?.getLocale?.() : "";
      if (spicetifyLoc && typeof spicetifyLoc === "string") return spicetifyLoc;
    } catch {
    }
    if (typeof document !== "undefined" && document.documentElement?.lang) {
      return document.documentElement.lang;
    }
    if (typeof navigator !== "undefined" && navigator.language) {
      return navigator.language;
    }
    return "en";
  }
  function resolveLangCode(rawLocale) {
    const clean = (rawLocale || "").toLowerCase().trim();
    if (clean.startsWith("es")) return "es";
    if (clean.startsWith("pt")) return "pt";
    if (clean.startsWith("fr")) return "fr";
    if (clean.startsWith("de")) return "de";
    if (clean.startsWith("it")) return "it";
    return "en";
  }
  function getTranslations() {
    const rawLocale = detectSpotifyLocale();
    const lang = resolveLangCode(rawLocale);
    return {
      lang,
      rawLocale,
      t: TRANSLATIONS[lang]
    };
  }
  function formatRelativeTimeLocalized(iso, t, rawLocale) {
    if (!iso) return t.time.justNow;
    const ts = Date.parse(iso);
    if (!Number.isFinite(ts)) return t.time.justNow;
    const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1e3));
    if (diffSec < 60) return t.time.secondsAgo(diffSec);
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return t.time.minutesAgo(diffMin);
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return t.time.hoursAgo(diffHrs);
    return new Date(ts).toLocaleDateString(rawLocale || "en", {
      day: "2-digit",
      month: "short"
    });
  }

  // spicetify-cronotofy/src/styles.ts
  var STYLE_ID = "cronotofy-spicetify-styles";
  var CSS_TEXT = `
.cronotofy-page {
  position: relative;
  min-height: 100%;
  overflow-x: clip;
  font-family: var(--encore-body-font-stack, SpotifyMixUI, sans-serif);
}

.cronotofy-page button,
.cronotofy-page input {
  font-family: inherit;
}

.cronotofy-island-anchor {
  position: sticky;
  top: 10px;
  z-index: 60;
  height: 0;
  overflow: visible;
  pointer-events: none;
}

.cronotofy-island-wrap {
  width: 100%;
  display: flex;
  justify-content: center;
  padding: 0 12px;
  pointer-events: none;
  container-type: inline-size;
  container-name: cronotofy-nav;
}

.cronotofy-island {
  pointer-events: none;
  visibility: hidden;
  opacity: 0;
  transform: translate3d(0, -18px, 0) scale(0.92);
  transform-origin: top center;
  will-change: transform, opacity;
  backface-visibility: hidden;
  max-width: 100%;
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 12px;
  padding: 6px 12px;
  border-radius: 9999px;
  background: rgba(var(--cronotofy-bg-card-rgb, 17, 23, 34), 0.34);
  backdrop-filter: blur(10px) saturate(170%) brightness(0.92);
  -webkit-backdrop-filter: blur(10px) saturate(170%) brightness(0.92);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow:
    0 14px 36px -10px rgba(0, 0, 0, 0.56),
    inset 0 1px 0 rgba(255, 255, 255, 0.28),
    inset 0 -1px 0 rgba(255, 255, 255, 0.05);
  transition:
    transform 0.24s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.18s ease-out,
    visibility 0s linear 0.24s;
}

.cronotofy-page.is-island-open .cronotofy-island {
  pointer-events: auto;
  visibility: visible;
  opacity: 1;
  transform: translate3d(0, 0, 0) scale(1);
  transition:
    transform 0.44s cubic-bezier(0.22, 1.12, 0.36, 1),
    opacity 0.24s cubic-bezier(0.22, 1, 0.36, 1),
    visibility 0s linear 0s;
}

.cronotofy-island-brand {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  padding: 0 2px;
  cursor: pointer;
  flex-shrink: 0;
}

.cronotofy-island-svg {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  transition: transform 0.16s ease;
}

.cronotofy-island-brand:hover .cronotofy-island-svg {
  transform: scale(1.06);
}

.cronotofy-island-title {
  font-family: var(--encore-title-font-stack, var(--encore-body-font-stack, SpotifyMixUITitle, SpotifyMixUI, sans-serif));
  font-size: 15.5px;
  font-weight: 800;
  letter-spacing: -0.02em;
  white-space: nowrap;
  line-height: 1.1;
  background: linear-gradient(135deg, #ffffff 10%, var(--cronotofy-accent-soft, #e2e8f0) 55%, var(--cronotofy-accent-2, #94a3b8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.cronotofy-root-shell {
  width: 100%;
  container-type: inline-size;
  container-name: cronotofy;
}

.cronotofy-root {
  position: relative;
  z-index: 1;
  color: #f8fafc;
  padding: 0 28px 48px;
  max-width: 1320px;
  margin: 0 auto;
  font-family: var(--encore-body-font-stack, SpotifyMixUI, sans-serif);
}

.cronotofy-header-inline {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0 14px;
  margin-bottom: 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: opacity 0.22s ease, transform 0.26s cubic-bezier(0.22, 1, 0.36, 1);
}

.cronotofy-page.is-island-open .cronotofy-header-inline {
  opacity: 0;
  transform: translate3d(0, -6px, 0);
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .cronotofy-island {
    transform: none;
    transition: opacity 0.15s ease, visibility 0s linear 0.15s;
  }

  .cronotofy-page.is-island-open .cronotofy-island {
    transform: none;
    transition: opacity 0.15s ease, visibility 0s linear 0s;
  }

  .cronotofy-header-inline,
  .cronotofy-page.is-island-open .cronotofy-header-inline {
    transform: none;
    transition: opacity 0.15s ease;
  }
}

.cronotofy-brand-title,
.cronotofy-kpi-value,
.cronotofy-section-title {
  font-family: var(--encore-title-font-stack, var(--encore-body-font-stack, SpotifyMixUITitle, SpotifyMixUI, sans-serif));
  text-shadow: 0 1px 8px rgba(0, 0, 0, 0.45);
}

.cronotofy-island,
.cronotofy-island *,
.cronotofy-root * {
  box-sizing: border-box;
}

.cronotofy-brand {
  display: flex;
  align-items: center;
  gap: 11px;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
  flex-shrink: 0;
  min-width: 0;
  max-width: 100%;
}

.cronotofy-brand-text {
  min-width: 0;
}

.cronotofy-brand-svg {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  transition: transform 0.16s ease;
}

.cronotofy-brand:hover .cronotofy-brand-svg {
  transform: scale(1.06);
}

.cronotofy-brand-heading {
  display: flex;
  align-items: baseline;
  gap: 7px;
  min-width: 0;
}

.cronotofy-brand-title {
  font-size: 22px;
  font-weight: 800;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #ffffff 10%, var(--cronotofy-accent-soft, #e2e8f0) 55%, var(--cronotofy-accent-2, #94a3b8) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  line-height: 1.1;
}

.cronotofy-brand-credit {
  font-size: 9.5px;
  font-weight: 700;
  letter-spacing: 0.04em;
  white-space: nowrap;
  flex-shrink: 0;
  color: var(--cronotofy-accent-soft, #f1f5f9);
  text-shadow:
    0 0 6px rgba(var(--cronotofy-accent-rgb, 226, 232, 240), 0.92),
    0 0 14px rgba(var(--cronotofy-accent-rgb, 226, 232, 240), 0.58);
}

.cronotofy-brand-sub {
  font-size: 11.5px;
  color: #cbd5e1;
  opacity: 0.82;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cronotofy-tabs {
  display: flex;
  flex-wrap: nowrap;
  overflow-x: auto;
  scrollbar-width: none;
  max-width: 100%;
  gap: 4px;
  padding: 4px;
  border-radius: 9999px;
  background: rgba(var(--cronotofy-bg-card-rgb, 17, 23, 34), 0.26);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow:
    0 10px 24px -8px rgba(0, 0, 0, 0.42),
    inset 0 1px 0 rgba(255, 255, 255, 0.26);
  backdrop-filter: blur(10px) saturate(170%) brightness(0.92);
  -webkit-backdrop-filter: blur(10px) saturate(170%) brightness(0.92);
}

.cronotofy-tabs::-webkit-scrollbar {
  display: none;
}

.cronotofy-island-tabs {
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  background: rgba(0, 0, 0, 0.16);
  border-color: rgba(255, 255, 255, 0.10);
  box-shadow: none;
  min-width: 0;
}

.cronotofy-tab {
  padding: 6px 13px;
  border-radius: 9999px;
  border: 1px solid transparent;
  background: transparent;
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.cronotofy-tab:hover {
  color: #ffffff;
}

.cronotofy-tab.active {
  background: rgba(var(--cronotofy-accent-rgb, 226, 232, 240), 0.26);
  color: #ffffff;
  border-color: rgba(var(--cronotofy-accent-rgb, 226, 232, 240), 0.44);
  box-shadow: none;
}

.cronotofy-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 9999px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  background: rgba(var(--cronotofy-bg-card-rgb, 17, 23, 34), 0.26);
  backdrop-filter: blur(10px) saturate(170%) brightness(0.92);
  -webkit-backdrop-filter: blur(10px) saturate(170%) brightness(0.92);
  box-shadow:
    0 8px 20px -6px rgba(0, 0, 0, 0.40),
    inset 0 1px 0 rgba(255, 255, 255, 0.26);
  color: #f8fafc;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.2s ease, background 0.2s ease;
}

.cronotofy-btn:hover {
  border-color: rgba(255, 255, 255, 0.28);
  transform: translateY(-1px);
}

.cronotofy-btn-primary {
  background: var(--cronotofy-accent, #e2e8f0);
  color: var(--cronotofy-accent-contrast, #060910);
  border: none;
  font-weight: 700;
}

.cronotofy-controls-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  margin-bottom: 18px;
}

.cronotofy-periods {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  border-radius: 14px;
  background: rgba(var(--cronotofy-bg-card-rgb, 17, 23, 34), 0.26);
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow:
    0 8px 22px -6px rgba(0, 0, 0, 0.40),
    inset 0 1px 0 rgba(255, 255, 255, 0.26);
  backdrop-filter: blur(10px) saturate(170%) brightness(0.92);
  -webkit-backdrop-filter: blur(10px) saturate(170%) brightness(0.92);
}

.cronotofy-period-btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.cronotofy-period-btn.active {
  background: linear-gradient(135deg, var(--cronotofy-accent, #e2e8f0), var(--cronotofy-accent-2, #94a3b8));
  color: var(--cronotofy-accent-contrast, #0b0f17);
}

.cronotofy-kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.cronotofy-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(155deg, rgba(var(--cronotofy-accent-rgb, 226, 232, 240), 0.07) 0%, rgba(var(--cronotofy-bg-card-rgb, 17, 23, 34), 0.22) 100%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 20px;
  padding: 16px;
  backdrop-filter: blur(8px) saturate(170%) brightness(0.92);
  -webkit-backdrop-filter: blur(8px) saturate(170%) brightness(0.92);
  box-shadow:
    0 12px 32px -10px rgba(0, 0, 0, 0.48),
    inset 0 1px 0 rgba(255, 255, 255, 0.26),
    inset 0 -1px 0 rgba(255, 255, 255, 0.05);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.cronotofy-card:hover {
  border-color: rgba(255, 255, 255, 0.24);
  box-shadow:
    0 14px 36px -10px rgba(0, 0, 0, 0.54),
    inset 0 1px 0 rgba(255, 255, 255, 0.34),
    inset 0 -1px 0 rgba(255, 255, 255, 0.06);
}

.cronotofy-kpi-label {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #cbd5e1;
  opacity: 0.8;
  font-weight: 700;
  margin-bottom: 8px;
}

.cronotofy-kpi-value {
  font-size: 24px;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cronotofy-kpi-sub {
  font-size: 12px;
  color: var(--cronotofy-accent-soft, #e2e8f0);
  margin-top: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cronotofy-kpi-sub-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.cronotofy-kpi-sub-row > span {
  min-width: 0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cronotofy-two-col {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.cronotofy-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.cronotofy-section-title {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  min-width: 0;
}

.cronotofy-link-btn {
  background: transparent;
  border: none;
  color: var(--cronotofy-accent-soft, #e2e8f0);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.cronotofy-link-btn:hover {
  text-decoration: underline;
}

.cronotofy-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cronotofy-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 10px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.06);
  box-shadow: none;
  transition: background 0.15s ease, border-color 0.15s ease;
}

.cronotofy-row:hover {
  background: rgba(var(--cronotofy-accent-rgb, 226, 232, 240), 0.12);
  border-color: rgba(var(--cronotofy-accent-rgb, 226, 232, 240), 0.26);
}

.cronotofy-row-left {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex: 1;
}

.cronotofy-rank {
  width: 24px;
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--cronotofy-accent-soft, #e2e8f0);
  flex-shrink: 0;
}

.cronotofy-thumb {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  object-fit: cover;
  background: rgba(30, 41, 59, 0.8);
  flex-shrink: 0;
}

.cronotofy-thumb.circle {
  border-radius: 9999px;
}

.cronotofy-row-text {
  min-width: 0;
  flex: 1;
}

.cronotofy-row-title {
  font-size: 13px;
  font-weight: 700;
  color: #f8fafc;
  text-shadow: 0 1px 6px rgba(0, 0, 0, 0.45);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cronotofy-row-sub {
  font-size: 11.5px;
  color: #cbd5e1;
  opacity: 0.78;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}

.cronotofy-row-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.cronotofy-track-duration {
  font-size: 11.5px;
  color: #cbd5e1;
  margin-right: 4px;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

/* Authentic Spotify Desktop Playback Buttons */
.cronotofy-sp-play-btn {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--cronotofy-accent, #e2e8f0);
  color: var(--cronotofy-accent-contrast, #0b0f17);
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.42);
  transition: transform 0.14s ease, background-color 0.15s ease, filter 0.15s ease;
}

.cronotofy-sp-play-btn:hover {
  transform: scale(1.07);
  filter: brightness(1.08);
}

.cronotofy-sp-play-btn:active {
  transform: scale(0.98);
}

.cronotofy-sp-play-btn.lg {
  width: 44px;
  height: 44px;
}

.cronotofy-sp-icon-btn {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: transparent;
  color: #cbd5e1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  transition: background-color 0.15s ease, color 0.15s ease, transform 0.14s ease;
}

.cronotofy-sp-icon-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #ffffff;
  transform: scale(1.06);
}

.cronotofy-card-cover-wrap {
  position: relative;
}

.cronotofy-card-play-overlay {
  position: absolute;
  right: 8px;
  bottom: 8px;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.cronotofy-entity-card:hover .cronotofy-card-play-overlay {
  opacity: 1;
  transform: translateY(0);
}

.cronotofy-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(185px, 1fr));
  gap: 14px;
}

.cronotofy-entity-card {
  position: relative;
  overflow: hidden;
  background: linear-gradient(155deg, rgba(var(--cronotofy-accent-rgb, 226, 232, 240), 0.07) 0%, rgba(var(--cronotofy-bg-card-rgb, 17, 23, 34), 0.22) 100%);
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 20px;
  padding: 14px;
  backdrop-filter: blur(8px) saturate(170%) brightness(0.92);
  -webkit-backdrop-filter: blur(8px) saturate(170%) brightness(0.92);
  box-shadow:
    0 12px 32px -10px rgba(0, 0, 0, 0.48),
    inset 0 1px 0 rgba(255, 255, 255, 0.26),
    inset 0 -1px 0 rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: transform 0.15s ease, border-color 0.2s ease, box-shadow 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cronotofy-entity-card:hover {
  transform: translateY(-2px);
  border-color: rgba(255, 255, 255, 0.24);
  box-shadow:
    0 14px 36px -10px rgba(0, 0, 0, 0.54),
    inset 0 1px 0 rgba(255, 255, 255, 0.34),
    inset 0 -1px 0 rgba(255, 255, 255, 0.06);
}

.cronotofy-entity-cover {
  width: 100%;
  aspect-ratio: 1 / 1;
  border-radius: 12px;
  object-fit: cover;
  display: block;
  background: rgba(30, 41, 59, 0.8);
}

.cronotofy-entity-cover.circle {
  border-radius: 9999px;
}

.cronotofy-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 9999px;
  font-size: 10.5px;
  font-weight: 700;
  background: rgba(var(--cronotofy-accent-rgb, 226, 232, 240), 0.18);
  color: var(--cronotofy-accent-soft, #f1f5f9);
  border: 1px solid rgba(var(--cronotofy-accent-rgb, 226, 232, 240), 0.34);
  box-shadow: none;
  white-space: nowrap;
  flex-shrink: 0;
}

.cronotofy-entity-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.cronotofy-entity-stat {
  font-size: 11px;
  color: #cbd5e1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cronotofy-genre-bar-bg {
  width: 100%;
  height: 7px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
  margin-top: 6px;
}

.cronotofy-genre-bar-fill {
  height: 100%;
  border-radius: 9999px;
  background: linear-gradient(90deg, var(--cronotofy-accent, #e2e8f0), var(--cronotofy-accent-2, #94a3b8));
}

.cronotofy-empty {
  text-align: center;
  padding: 36px 20px;
  color: #cbd5e1;
  opacity: 0.78;
  font-size: 13px;
}

/* Container-aware responsive rules for lower Spotify window resolutions */
@container cronotofy-nav (max-width: 740px) {
  .cronotofy-island-title {
    display: none;
  }

  .cronotofy-island {
    gap: 8px;
    padding: 5px 10px;
  }
}

@container cronotofy-nav (max-width: 560px) {
  .cronotofy-island .cronotofy-tab {
    padding: 5px 9px;
    font-size: 11px;
  }

  .cronotofy-island-svg {
    width: 22px;
    height: 22px;
  }
}

@container cronotofy-nav (max-width: 440px) {
  .cronotofy-island {
    gap: 6px;
    padding: 4px 8px;
  }

  .cronotofy-island-tabs {
    flex: 1 1 auto;
  }
}

@container cronotofy (max-width: 900px) {
  .cronotofy-kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .cronotofy-header-inline {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}

@container cronotofy (max-width: 780px) {
  .cronotofy-two-col {
    grid-template-columns: 1fr;
  }

  .cronotofy-root {
    padding: 0 18px 36px;
  }
}

@container cronotofy (max-width: 620px) {
  .cronotofy-root {
    padding: 0 14px 32px;
  }

  .cronotofy-card {
    padding: 13px;
    border-radius: 16px;
  }

  .cronotofy-kpi-value {
    font-size: 20px;
  }

  .cronotofy-brand-title {
    font-size: 19px;
  }

  .cronotofy-brand-credit {
    font-size: 8.5px;
  }

  .cronotofy-brand-svg {
    width: 30px;
    height: 30px;
  }

  .cronotofy-brand-sub {
    display: none;
  }

  .cronotofy-tab {
    padding: 5px 10px;
    font-size: 11.5px;
  }

  .cronotofy-controls-row {
    justify-content: flex-start;
    margin-bottom: 14px;
  }

  .cronotofy-cards-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
  }

  .cronotofy-entity-card {
    padding: 10px;
    border-radius: 16px;
    gap: 8px;
  }

  .cronotofy-row {
    gap: 8px;
    padding: 7px 8px;
  }

  .cronotofy-row-left {
    gap: 8px;
  }

  .cronotofy-rank {
    width: 20px;
    font-size: 11px;
  }

  .cronotofy-thumb {
    width: 36px;
    height: 36px;
  }

  .cronotofy-sp-play-btn {
    width: 30px;
    height: 30px;
  }

  .cronotofy-sp-icon-btn {
    width: 28px;
    height: 28px;
  }
}

@container cronotofy (max-width: 480px) {
  .cronotofy-root {
    padding: 0 10px 26px;
  }

  .cronotofy-kpi-grid {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .cronotofy-periods {
    width: 100%;
  }

  .cronotofy-period-btn {
    flex: 1;
    padding: 6px 8px;
    font-size: 11.5px;
    white-space: nowrap;
  }

  .cronotofy-track-duration {
    display: none;
  }

  .cronotofy-cards-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .cronotofy-badge {
    font-size: 10px;
    padding: 2px 6px;
  }
}
`;
  function ensureCronotofyStyles() {
    if (typeof document === "undefined") return;
    const existing = document.getElementById(STYLE_ID);
    if (existing) {
      if (existing.textContent !== CSS_TEXT) {
        existing.textContent = CSS_TEXT;
      }
      return;
    }
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = CSS_TEXT;
    document.head.appendChild(style);
  }

  // spicetify-cronotofy/src/app.tsx
  var FALLBACK_ARTIST_GENRES = {
    "rauw alejandro": ["reggaeton", "synth-pop", "urbano latino"],
    "bad bunny": ["reggaeton", "trap latino", "urbano latino"],
    tainy: ["reggaeton", "electronica latina", "urbano latino"],
    jhayco: ["reggaeton", "urbano latino", "trap latino"],
    "jhay cortez": ["reggaeton", "urbano latino", "trap latino"],
    "milo j": ["rap argentino", "indie urbano", "trap argentino"],
    "myke towers": ["reggaeton", "trap latino", "urbano latino"],
    "omar courtz": ["urbano latino", "reggaeton", "trap latino"],
    feid: ["reggaeton", "pop urbano", "urbano latino"],
    "karol g": ["reggaeton", "pop latino", "urbano latino"],
    "eladio carrion": ["trap latino", "hip hop latino", "urbano latino"],
    "anuel aa": ["reggaeton", "trap latino", "urbano latino"],
    "young miko": ["urbano latino", "trap latino"],
    "dei v": ["urbano latino", "reggaeton"],
    mora: ["reggaeton", "urbano latino"],
    quevedo: ["pop urbano", "reggaeton"],
    "alvaro diaz": ["urbano latino", "trap latino", "alt-latin"],
    "kendrick lamar": ["hip hop", "conscious rap", "west coast rap"],
    "the weeknd": ["synth-pop", "r&b", "pop"],
    "travis scott": ["trap", "hip hop", "psychedelic rap"],
    drake: ["hip hop", "rap", "r&b"],
    "daft punk": ["electronic", "french house", "synth-pop"],
    "dua lipa": ["pop", "dance pop", "disco"],
    "billie eilish": ["alt-pop", "indie pop"],
    "taylor swift": ["pop", "synth-pop"],
    "j balvin": ["reggaeton", "urbano latino"],
    yandel: ["reggaeton", "urbano latino"],
    arcangel: ["reggaeton", "trap latino"]
  };
  function normalizeLookupName(name) {
    return (name || "").toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }
  function getFallbackGenresForArtist(name) {
    const norm = normalizeLookupName(name);
    if (!norm) return [];
    if (FALLBACK_ARTIST_GENRES[norm]) return FALLBACK_ARTIST_GENRES[norm];
    for (const [key, genres] of Object.entries(FALLBACK_ARTIST_GENRES)) {
      if (norm.includes(key) || key.includes(norm)) return genres;
    }
    return [];
  }
  function formatDurationMs(ms) {
    const totalSec = Math.max(0, Math.floor((ms || 0) / 1e3));
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }
  function CronotofyBrandSvg({
    accent,
    accent2,
    gradId = "crono-app-grad",
    className = "cronotofy-brand-svg"
  }) {
    return /* @__PURE__ */ Spicetify.React.createElement(
      "svg",
      {
        className,
        viewBox: "0 0 128 128",
        fill: "none",
        "aria-label": "Cronotofy Logo"
      },
      /* @__PURE__ */ Spicetify.React.createElement("defs", null, /* @__PURE__ */ Spicetify.React.createElement("linearGradient", { id: gradId, x1: "4", y1: "64", x2: "124", y2: "64", gradientUnits: "userSpaceOnUse" }, /* @__PURE__ */ Spicetify.React.createElement("stop", { offset: "0%", stopColor: accent }), /* @__PURE__ */ Spicetify.React.createElement("stop", { offset: "100%", stopColor: accent2 }))),
      /* @__PURE__ */ Spicetify.React.createElement("rect", { x: "66", y: "54", width: "6", height: "20", rx: "3", fill: `url(#${gradId})` }),
      /* @__PURE__ */ Spicetify.React.createElement("rect", { x: "76", y: "46", width: "6", height: "36", rx: "3", fill: `url(#${gradId})` }),
      /* @__PURE__ */ Spicetify.React.createElement("rect", { x: "86", y: "36", width: "6", height: "56", rx: "3", fill: `url(#${gradId})` }),
      /* @__PURE__ */ Spicetify.React.createElement("rect", { x: "96", y: "20", width: "6", height: "88", rx: "3", fill: `url(#${gradId})` }),
      /* @__PURE__ */ Spicetify.React.createElement("rect", { x: "106", y: "34", width: "6", height: "60", rx: "3", fill: `url(#${gradId})` }),
      /* @__PURE__ */ Spicetify.React.createElement("rect", { x: "116", y: "50", width: "6", height: "28", rx: "3", fill: `url(#${gradId})` }),
      /* @__PURE__ */ Spicetify.React.createElement(
        "path",
        {
          d: "M 92.28 112.98 A 56.56 56.56 0 1 1 92.28 15.02 L 87.88 22.64 A 47.76 47.76 0 1 0 87.88 105.36 Z",
          fill: `url(#${gradId})`
        }
      ),
      /* @__PURE__ */ Spicetify.React.createElement(
        "path",
        {
          d: "M 84.30 99.16 A 40.60 40.60 0 1 1 84.30 28.84 L 79.90 36.46 A 31.80 31.80 0 1 0 79.90 91.54 Z",
          fill: `url(#${gradId})`
        }
      )
    );
  }
  function SpotifyPlayButton({
    isPlayingThis,
    size = "sm",
    playLabel,
    pauseLabel,
    onPress
  }) {
    const iconSize = size === "lg" ? 18 : 15;
    return /* @__PURE__ */ Spicetify.React.createElement(
      "button",
      {
        type: "button",
        className: `cronotofy-sp-play-btn ${size === "lg" ? "lg" : ""}`,
        onClick: (e) => {
          e.stopPropagation();
          onPress();
        },
        title: isPlayingThis ? pauseLabel : playLabel,
        "aria-label": isPlayingThis ? pauseLabel : playLabel
      },
      isPlayingThis ? /* @__PURE__ */ Spicetify.React.createElement("svg", { width: iconSize, height: iconSize, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true" }, /* @__PURE__ */ Spicetify.React.createElement("path", { d: "M5.7 3a.7.7 0 0 0-.7.7v16.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V3.7a.7.7 0 0 0-.7-.7H5.7zm10 0a.7.7 0 0 0-.7.7v16.6a.7.7 0 0 0 .7.7h2.6a.7.7 0 0 0 .7-.7V3.7a.7.7 0 0 0-.7-.7h-2.6z" })) : /* @__PURE__ */ Spicetify.React.createElement("svg", { width: iconSize, height: iconSize, viewBox: "0 0 24 24", fill: "currentColor", "aria-hidden": "true" }, /* @__PURE__ */ Spicetify.React.createElement("path", { d: "M7.05 3.606l13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z" }))
    );
  }
  function SpotifyQueueButton({
    tooltip,
    onQueue
  }) {
    return /* @__PURE__ */ Spicetify.React.createElement(
      "button",
      {
        type: "button",
        className: "cronotofy-sp-icon-btn",
        onClick: (e) => {
          e.stopPropagation();
          onQueue();
        },
        title: tooltip,
        "aria-label": tooltip
      },
      /* @__PURE__ */ Spicetify.React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "currentColor", "aria-hidden": "true" }, /* @__PURE__ */ Spicetify.React.createElement("path", { d: "M16 15H2v-1.5h14V15zm0-4.5H2V9h14v1.5zm-8.034-6A5.484 5.484 0 0 1 7.187 6H13.5a2.5 2.5 0 0 0 0-5H7.966c.159.474.255.978.278 1.5H13.5a1 1 0 1 1 0 2H7.966zM2 2V0h1.5v2h2v1.5h-2v2H2v-2H0V2h2z" }))
    );
  }
  var EMPTY_SNAPSHOT = {
    userId: "",
    totalSeconds: 0,
    todaySeconds: 0,
    todayDate: "",
    currentTrackSeconds: 0,
    tracks: [],
    recentPlays: []
  };
  function CronotofyApp() {
    ensureCronotofyStyles();
    ensureDynamicThemeStyle();
    const { useState, useEffect, useMemo, useCallback, useRef } = Spicetify.React;
    const { t, rawLocale } = useMemo(() => getTranslations(), []);
    const [activeTab, setActiveTab] = useState(CRONOTOFY_MOD_CONFIG.ui.defaultTab);
    const [timeRange, setTimeRange] = useState(CRONOTOFY_MOD_CONFIG.ui.defaultTimeRange);
    const [user, setUser] = useState(null);
    const [topTracks, setTopTracks] = useState([]);
    const [topArtists, setTopArtists] = useState([]);
    const [recentApiCount, setRecentApiCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [liveTrack, setLiveTrack] = useState(
      () => window.__CRONOTOFY_MOD__?.getLiveTrack() ?? extractLiveTrackFromPlayer()
    );
    const [snapshot, setSnapshot] = useState(
      () => window.__CRONOTOFY_MOD__?.getTrackerSnapshot() ?? EMPTY_SNAPSHOT
    );
    const [palette, setPalette] = useState(
      () => window.__CRONOTOFY_MOD__?.getDynamicPalette?.() ?? DEFAULT_PALETTE
    );
    const pageRef = useRef(null);
    const headerRef = useRef(null);
    const islandRef = useRef(null);
    const syncIslandRef = useRef(null);
    useEffect(() => {
      document.documentElement.classList.add("cronotofy-route-active");
      return () => {
        document.documentElement.classList.remove("cronotofy-route-active");
      };
    }, []);
    useEffect(() => {
      const pageEl = pageRef.current;
      if (!pageEl) return;
      const findScrollParent = (el) => {
        let cur = el?.parentElement || null;
        while (cur) {
          const style = window.getComputedStyle(cur);
          if (style.overflowY === "auto" || style.overflowY === "scroll" || cur.hasAttribute("data-overlayscrollbars-viewport") || cur.classList.contains("os-viewport")) {
            return cur;
          }
          cur = cur.parentElement;
        }
        return document.querySelector(".Root__main-view [data-overlayscrollbars-viewport]") || document.querySelector(".main-view-container__scroll-node") || document.querySelector("[data-overlayscrollbars-viewport]");
      };
      const scrollContainer = findScrollParent(pageEl);
      let openThreshold = 60;
      let closeThreshold = 28;
      const measureThresholds = () => {
        openThreshold = Math.max(56, Math.round((headerRef.current?.offsetHeight || 72) - 12));
        closeThreshold = Math.max(20, openThreshold - 32);
      };
      let rafId = 0;
      const syncNow = () => {
        const top = scrollContainer ? scrollContainer.scrollTop : window.scrollY;
        const isOpen = pageEl.classList.contains("is-island-open");
        const nextOpen = isOpen ? top > closeThreshold : top >= openThreshold;
        if (nextOpen !== isOpen) {
          pageEl.classList.toggle("is-island-open", nextOpen);
          islandRef.current?.setAttribute("aria-hidden", nextOpen ? "false" : "true");
        }
      };
      syncIslandRef.current = syncNow;
      const scheduleSync = () => {
        if (rafId) return;
        rafId = requestAnimationFrame(() => {
          rafId = 0;
          syncNow();
        });
      };
      const onResize = () => {
        measureThresholds();
        scheduleSync();
      };
      measureThresholds();
      syncNow();
      if (scrollContainer) {
        scrollContainer.addEventListener("scroll", scheduleSync, { passive: true });
      }
      window.addEventListener("scroll", scheduleSync, { passive: true });
      window.addEventListener("resize", onResize, { passive: true });
      return () => {
        if (rafId) cancelAnimationFrame(rafId);
        syncIslandRef.current = null;
        if (scrollContainer) {
          scrollContainer.removeEventListener("scroll", scheduleSync);
        }
        window.removeEventListener("scroll", scheduleSync);
        window.removeEventListener("resize", onResize);
      };
    }, []);
    useEffect(() => {
      const id = requestAnimationFrame(() => {
        syncIslandRef.current?.();
      });
      return () => cancelAnimationFrame(id);
    }, [activeTab]);
    const scrollToTop = useCallback(() => {
      const viewport = pageRef.current?.closest("#cronotofy-ext-host") || pageRef.current?.closest("[data-overlayscrollbars-viewport]") || document.querySelector(".Root__main-view [data-overlayscrollbars-viewport]") || document.querySelector(".main-view-container__scroll-node") || document.querySelector("[data-overlayscrollbars-viewport]");
      if (viewport && typeof viewport.scrollTo === "function") {
        viewport.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, []);
    useEffect(() => {
      const syncBridgeState = () => {
        const bridge = window.__CRONOTOFY_MOD__;
        if (bridge) {
          setLiveTrack(bridge.getLiveTrack());
          setSnapshot(bridge.getTrackerSnapshot());
          if (bridge.getDynamicPalette) {
            setPalette(bridge.getDynamicPalette());
          }
        } else {
          setLiveTrack(extractLiveTrackFromPlayer());
        }
      };
      syncBridgeState();
      const unsub = window.__CRONOTOFY_MOD__?.subscribe(syncBridgeState);
      const fallbackTimer = setInterval(syncBridgeState, 2e3);
      return () => {
        if (unsub) unsub();
        clearInterval(fallbackTimer);
      };
    }, []);
    const loadAnalyticsData = useCallback(async (range) => {
      setLoading(true);
      try {
        const bridgeUser = window.__CRONOTOFY_MOD__ ? await window.__CRONOTOFY_MOD__.getUser() : await resolveCurrentSpotifyUser();
        if (bridgeUser) {
          setUser(bridgeUser);
        }
        const [tracksRes, artistsRes, recentRes, savedRes] = await Promise.all([
          Spicetify?.CosmosAsync?.get(
            `https://api.spotify.com/v1/me/top/tracks?time_range=${range}&limit=50`
          ).catch(() => null),
          Spicetify?.CosmosAsync?.get(
            `https://api.spotify.com/v1/me/top/artists?time_range=${range}&limit=50`
          ).catch(() => null),
          Spicetify?.CosmosAsync?.get(
            "https://api.spotify.com/v1/me/player/recently-played?limit=50"
          ).catch(() => null),
          Spicetify?.CosmosAsync?.get(
            "https://api.spotify.com/v1/me/tracks?limit=50"
          ).catch(() => null)
        ]);
        if (recentRes && Array.isArray(recentRes.items)) {
          setRecentApiCount(recentRes.items.length);
        }
        const mappedTracks = [];
        const seenTrackIds = /* @__PURE__ */ new Set();
        const pushApiTrack = (tr) => {
          if (!tr || !tr.id) return;
          const id = String(tr.id);
          if (seenTrackIds.has(id)) return;
          seenTrackIds.add(id);
          const artistsArr = Array.isArray(tr.artists) ? tr.artists.filter((a) => a?.name).map((a) => ({
            id: a?.id ? String(a.id) : void 0,
            name: String(a.name)
          })) : [];
          mappedTracks.push({
            id,
            uri: String(tr.uri || `spotify:track:${id}`),
            name: String(tr.name || t.entities.untitled),
            artistName: artistsArr.map((a) => a.name).join(", ") || t.entities.unknownArtist,
            artistId: artistsArr[0]?.id,
            artistNamesList: artistsArr,
            albumId: tr.album?.id ? String(tr.album.id) : void 0,
            albumName: String(tr.album?.name || ""),
            albumImageUrl: normalizeSpotifyImage(tr.album?.images?.[0]?.url),
            durationMs: Number(tr.duration_ms || 0),
            popularity: Number(tr.popularity || 0)
          });
        };
        if (tracksRes && Array.isArray(tracksRes.items) && tracksRes.items.length > 0) {
          for (const tr of tracksRes.items) {
            pushApiTrack(tr);
          }
        }
        if (mappedTracks.length === 0 && recentRes && Array.isArray(recentRes.items)) {
          for (const item of recentRes.items) {
            pushApiTrack(item?.track);
            if (mappedTracks.length >= 50) break;
          }
        }
        if (mappedTracks.length === 0 && savedRes && Array.isArray(savedRes.items)) {
          for (const item of savedRes.items) {
            pushApiTrack(item?.track);
            if (mappedTracks.length >= 50) break;
          }
        }
        setTopTracks(mappedTracks);
        let mappedArtists = [];
        if (artistsRes && Array.isArray(artistsRes.items) && artistsRes.items.length > 0) {
          mappedArtists = artistsRes.items.filter((a) => a && a.id).map((a) => {
            const name = String(a.name || t.entities.unknownArtist);
            const rawGenres = Array.isArray(a.genres) && a.genres.length > 0 ? a.genres.map(String) : getFallbackGenresForArtist(name);
            return {
              id: String(a.id),
              uri: String(a.uri || `spotify:artist:${a.id}`),
              name,
              imageUrl: normalizeSpotifyImage(a.images?.[0]?.url) || "",
              genres: rawGenres,
              popularity: Number(a.popularity || 0),
              followers: Number(a.followers?.total || 0)
            };
          });
        }
        if (mappedArtists.length === 0) {
          const aggMap = /* @__PURE__ */ new Map();
          mappedTracks.forEach((track, idx) => {
            const baseWeight = Math.max(1, mappedTracks.length - idx);
            const list = track.artistNamesList && track.artistNamesList.length > 0 ? track.artistNamesList : [{ id: track.artistId, name: track.artistName }];
            list.forEach((art, artIdx) => {
              const cleanName = art.name.trim();
              if (!cleanName) return;
              const norm = normalizeLookupName(cleanName);
              const key = art.id || norm;
              const weight = artIdx === 0 ? baseWeight : Math.max(1, Math.round(baseWeight * 0.45));
              const existing = aggMap.get(key) || (art.id ? aggMap.get(norm) : void 0);
              if (existing) {
                existing.score += weight;
                if (art.id && !existing.id) existing.id = art.id;
                if (!existing.imageUrl && track.albumImageUrl) {
                  existing.imageUrl = track.albumImageUrl;
                }
              } else {
                aggMap.set(key, {
                  id: art.id,
                  name: cleanName,
                  score: weight,
                  imageUrl: track.albumImageUrl || "",
                  genres: getFallbackGenresForArtist(cleanName)
                });
              }
            });
          });
          const addSecondaryArtists = (items) => {
            if (!Array.isArray(items)) return;
            for (const item of items) {
              const tr = item?.track;
              if (!tr || !Array.isArray(tr.artists)) continue;
              for (const a of tr.artists) {
                if (!a?.name) continue;
                const norm = normalizeLookupName(String(a.name));
                const key = a.id ? String(a.id) : norm;
                const existing = aggMap.get(key) || aggMap.get(norm);
                if (existing) {
                  existing.score += 4;
                  if (a.id && !existing.id) existing.id = String(a.id);
                } else {
                  aggMap.set(key, {
                    id: a.id ? String(a.id) : void 0,
                    name: String(a.name),
                    score: 4,
                    imageUrl: normalizeSpotifyImage(tr.album?.images?.[0]?.url),
                    genres: getFallbackGenresForArtist(String(a.name))
                  });
                }
              }
            }
          };
          addSecondaryArtists(recentRes?.items);
          addSecondaryArtists(savedRes?.items);
          const aggregated = Array.from(aggMap.values()).sort((a, b) => b.score - a.score).slice(0, 40);
          const idsToEnrich = aggregated.map((a) => a.id).filter((id) => Boolean(id && /^[a-zA-Z0-9]+$/.test(id))).slice(0, 50);
          const enrichedById = /* @__PURE__ */ new Map();
          if (idsToEnrich.length > 0 && Spicetify?.CosmosAsync?.get) {
            try {
              const batchRes = await Spicetify.CosmosAsync.get(
                `https://api.spotify.com/v1/artists?ids=${idsToEnrich.join(",")}`
              );
              if (Array.isArray(batchRes?.artists)) {
                for (const ea of batchRes.artists) {
                  if (ea && ea.id) enrichedById.set(String(ea.id), ea);
                }
              }
            } catch {
            }
          }
          const maxScore = aggregated[0]?.score || 1;
          mappedArtists = aggregated.map((item) => {
            const ea = item.id ? enrichedById.get(item.id) : void 0;
            const genres = Array.isArray(ea?.genres) && ea.genres.length > 0 ? ea.genres.map(String) : item.genres.length > 0 ? item.genres : getFallbackGenresForArtist(item.name);
            const imageUrl = normalizeSpotifyImage(ea?.images?.[0]?.url) || item.imageUrl;
            const popularity = Number(
              ea?.popularity || Math.min(98, Math.max(45, Math.round(item.score / maxScore * 95)))
            );
            return {
              id: item.id || `local:${normalizeLookupName(item.name)}`,
              uri: item.id ? `spotify:artist:${item.id}` : "",
              name: String(ea?.name || item.name),
              imageUrl,
              genres,
              popularity,
              followers: Number(ea?.followers?.total || 0)
            };
          });
        }
        setTopArtists(mappedArtists);
        if (CRONOTOFY_MOD_CONFIG.ui.enableAlbumWall) {
          const seedCovers = [];
          const addSeedTrack = (tr) => {
            if (!tr) return;
            const img = normalizeSpotifyImage(tr?.album?.images?.[0]?.url);
            if (img) {
              seedCovers.push({
                id: String(tr.album?.id || tr.id || img),
                title: String(tr.album?.name || tr.name || ""),
                artistName: String(tr.artists?.[0]?.name || ""),
                imageUrl: img
              });
            }
          };
          for (const tr of mappedTracks) {
            if (tr.albumImageUrl) {
              seedCovers.push({
                id: tr.albumId || tr.id,
                title: tr.albumName || tr.name,
                artistName: tr.artistName,
                imageUrl: tr.albumImageUrl
              });
            }
          }
          if (Array.isArray(recentRes?.items)) {
            for (const item of recentRes.items) addSeedTrack(item?.track);
          }
          if (Array.isArray(savedRes?.items)) {
            for (const item of savedRes.items) addSeedTrack(item?.track);
          }
          if (seedCovers.length > 0) {
            window.__CRONOTOFY_MOD__?.updateWallCovers?.(seedCovers);
          }
          const artistCandidates = mappedArtists.slice(0, 14).map((a) => ({
            id: a.id.startsWith("local:") ? void 0 : a.id,
            name: a.name
          }));
          const enrichedWall = await collectFavoriteArtistCovers({
            userId: bridgeUser?.id || "default",
            artistCandidates,
            seedTrackCovers: seedCovers
          });
          if (enrichedWall.length > 0) {
            window.__CRONOTOFY_MOD__?.updateWallCovers?.(enrichedWall);
          }
        }
      } finally {
        setLoading(false);
      }
    }, [t]);
    useEffect(() => {
      void loadAnalyticsData(timeRange);
    }, [timeRange, loadAnalyticsData]);
    const handlePlayOrToggleUri = async (uri, title) => {
      try {
        if (liveTrack && liveTrack.uri === uri) {
          Spicetify?.Player?.togglePlay?.();
          return;
        }
        await Spicetify?.Player?.playUri?.(uri);
        Spicetify?.showNotification?.(t.actions.playingNowToast(title));
      } catch {
        Spicetify?.showNotification?.(t.actions.playbackErrorToast, true);
      }
    };
    const handleQueueTrack = async (uri, title) => {
      try {
        await Spicetify?.addToQueue?.([{ uri }]);
        Spicetify?.showNotification?.(t.actions.queuedToast(title));
      } catch {
        Spicetify?.showNotification?.(t.actions.queueErrorToast, true);
      }
    };
    const navigateToSpotifyEntity = (type, id) => {
      if (!id || id.startsWith("local:")) return;
      Spicetify?.Platform?.History?.push?.(`/${type}/${id}`);
    };
    const aggregatedAlbums = useMemo(() => {
      const map = /* @__PURE__ */ new Map();
      topTracks.forEach((tr, idx) => {
        if (!tr.albumName) return;
        const key = tr.albumId || `${tr.albumName}::${tr.artistName}`;
        const existing = map.get(key);
        if (existing) {
          existing.trackCount += 1;
        } else {
          map.set(key, {
            id: tr.albumId || key,
            uri: tr.albumId ? `spotify:album:${tr.albumId}` : void 0,
            name: tr.albumName,
            artistName: tr.artistName,
            imageUrl: tr.albumImageUrl,
            trackCount: 1,
            topRank: idx + 1
          });
        }
      });
      return Array.from(map.values()).sort(
        (a, b) => b.trackCount !== a.trackCount ? b.trackCount - a.trackCount : a.topRank - b.topRank
      );
    }, [topTracks]);
    const genreStats = useMemo(() => {
      const counts = /* @__PURE__ */ new Map();
      let totalTags = 0;
      topArtists.forEach((artist, idx) => {
        const weight = Math.max(1, topArtists.length - idx);
        for (const g of artist.genres.slice(0, 3)) {
          const clean = g.trim();
          if (!clean) continue;
          counts.set(clean, (counts.get(clean) || 0) + weight);
          totalTags += weight;
        }
      });
      return Array.from(counts.entries()).map(([genre, score]) => ({
        genre,
        pct: totalTags > 0 ? Math.round(score / totalTags * 100) : 0
      })).sort((a, b) => b.pct - a.pct).slice(0, 6);
    }, [topArtists]);
    const trackedArtistsSummary = useMemo(() => {
      const map = /* @__PURE__ */ new Map();
      for (const tr of snapshot.tracks) {
        const primary = tr.artistName.split(",")[0].trim() || tr.artistName;
        const prev = map.get(primary);
        if (prev) {
          prev.totalSeconds += tr.totalSeconds;
          prev.plays += tr.playCount;
        } else {
          map.set(primary, {
            name: primary,
            totalSeconds: tr.totalSeconds,
            plays: tr.playCount
          });
        }
      }
      return Array.from(map.values()).sort((a, b) => b.totalSeconds - a.totalSeconds).slice(0, 10);
    }, [snapshot.tracks]);
    const topGenre = genreStats[0];
    const topArtist = topArtists[0];
    const topTrack = topTracks[0];
    const periodLabels = {
      short_term: t.periods.short_term,
      medium_term: t.periods.medium_term,
      long_term: t.periods.long_term
    };
    const tabItems = [
      { id: "overview", label: t.tabs.overview },
      { id: "artists", label: t.tabs.artists },
      { id: "tracks", label: t.tabs.tracks },
      { id: "albums", label: t.tabs.albums },
      { id: "live", label: t.tabs.live }
    ];
    return /* @__PURE__ */ Spicetify.React.createElement("div", { ref: pageRef, className: "cronotofy-page" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-island-anchor" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-island-wrap" }, /* @__PURE__ */ Spicetify.React.createElement("div", { ref: islandRef, className: "cronotofy-island", "aria-hidden": "true" }, /* @__PURE__ */ Spicetify.React.createElement(
      "button",
      {
        type: "button",
        className: "cronotofy-island-brand",
        onClick: () => {
          setActiveTab("overview");
          scrollToTop();
        }
      },
      /* @__PURE__ */ Spicetify.React.createElement(
        CronotofyBrandSvg,
        {
          accent: palette.accent,
          accent2: palette.accent2,
          gradId: "crono-island-grad",
          className: "cronotofy-island-svg"
        }
      ),
      /* @__PURE__ */ Spicetify.React.createElement("span", { className: "cronotofy-island-title" }, "Cronotofy")
    ), /* @__PURE__ */ Spicetify.React.createElement("nav", { className: "cronotofy-tabs cronotofy-island-tabs" }, tabItems.map((tab) => /* @__PURE__ */ Spicetify.React.createElement(
      "button",
      {
        key: tab.id,
        type: "button",
        className: `cronotofy-tab ${activeTab === tab.id ? "active" : ""}`,
        onClick: () => {
          setActiveTab(tab.id);
          scrollToTop();
        }
      },
      tab.label
    )))))), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-root-shell" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-root" }, /* @__PURE__ */ Spicetify.React.createElement("header", { ref: headerRef, className: "cronotofy-header-inline" }, /* @__PURE__ */ Spicetify.React.createElement(
      "button",
      {
        type: "button",
        className: "cronotofy-brand",
        onClick: () => {
          setActiveTab("overview");
          scrollToTop();
        }
      },
      /* @__PURE__ */ Spicetify.React.createElement(
        CronotofyBrandSvg,
        {
          accent: palette.accent,
          accent2: palette.accent2,
          gradId: "crono-header-grad"
        }
      ),
      /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-brand-text" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-brand-heading" }, /* @__PURE__ */ Spicetify.React.createElement("h1", { className: "cronotofy-brand-title" }, "Cronotofy"), /* @__PURE__ */ Spicetify.React.createElement("span", { className: "cronotofy-brand-credit" }, "By EdwHtx")), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-brand-sub" }, t.brandSubtitle))
    ), /* @__PURE__ */ Spicetify.React.createElement("nav", { className: "cronotofy-tabs" }, tabItems.map((tab) => /* @__PURE__ */ Spicetify.React.createElement(
      "button",
      {
        key: tab.id,
        type: "button",
        className: `cronotofy-tab ${activeTab === tab.id ? "active" : ""}`,
        onClick: () => {
          setActiveTab(tab.id);
          scrollToTop();
        }
      },
      tab.label
    )))), activeTab !== "live" && /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-controls-row" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-periods" }, ["short_term", "medium_term", "long_term"].map((r) => /* @__PURE__ */ Spicetify.React.createElement(
      "button",
      {
        key: r,
        type: "button",
        className: `cronotofy-period-btn ${timeRange === r ? "active" : ""}`,
        onClick: () => setTimeRange(r)
      },
      periodLabels[r]
    )))), loading && topTracks.length === 0 && activeTab !== "live" ? /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-card cronotofy-empty" }, t.loadingAnalytics) : null, activeTab === "overview" && /* @__PURE__ */ Spicetify.React.createElement(Spicetify.React.Fragment, null, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-grid" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-card" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-label" }, t.kpis.recordedTime), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-value" }, formatSecondsHuman(snapshot.todaySeconds)), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-sub" }, t.kpis.todayLabel, " \xB7 ", t.kpis.totalMod(formatSecondsHuman(snapshot.totalSeconds)))), /* @__PURE__ */ Spicetify.React.createElement(
      "div",
      {
        className: "cronotofy-card",
        style: { cursor: topArtist && !topArtist.id.startsWith("local:") ? "pointer" : "default" },
        onClick: () => navigateToSpotifyEntity("artist", topArtist?.id)
      },
      /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-label" }, t.kpis.topArtist(periodLabels[timeRange])),
      /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-value" }, topArtist ? topArtist.name : "\u2014"),
      /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-sub" }, topArtist?.genres?.[0] ? topArtist.genres[0] : t.kpis.artistsAnalyzed(topArtists.length))
    ), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-card" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-label" }, t.kpis.topTrack(periodLabels[timeRange])), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-value" }, topTrack ? topTrack.name : "\u2014"), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-sub cronotofy-kpi-sub-row" }, /* @__PURE__ */ Spicetify.React.createElement("span", null, topTrack ? topTrack.artistName : t.kpis.noData), topTrack && /* @__PURE__ */ Spicetify.React.createElement(
      SpotifyPlayButton,
      {
        isPlayingThis: Boolean(liveTrack && liveTrack.uri === topTrack.uri && liveTrack.isPlaying),
        playLabel: t.actions.play,
        pauseLabel: t.actions.pause,
        onPress: () => void handlePlayOrToggleUri(topTrack.uri, topTrack.name)
      }
    ))), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-card" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-label" }, t.kpis.favoriteGenre), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-value", style: { textTransform: "capitalize" } }, topGenre ? topGenre.genre : t.kpis.varied), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-sub" }, topGenre ? t.kpis.affinityAndRecent(topGenre.pct, recentApiCount) : t.kpis.tracksInRanking(topTracks.length)))), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-two-col" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-card" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-section-header" }, /* @__PURE__ */ Spicetify.React.createElement("h2", { className: "cronotofy-section-title" }, t.sections.top5Artists), /* @__PURE__ */ Spicetify.React.createElement(
      "button",
      {
        type: "button",
        className: "cronotofy-link-btn",
        onClick: () => setActiveTab("artists")
      },
      t.sections.viewAll(topArtists.length)
    )), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-list" }, topArtists.slice(0, 5).map((artist, idx) => /* @__PURE__ */ Spicetify.React.createElement(
      "div",
      {
        key: artist.id,
        className: "cronotofy-row",
        style: { cursor: artist.id.startsWith("local:") ? "default" : "pointer" },
        onClick: () => navigateToSpotifyEntity("artist", artist.id)
      },
      /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-left" }, /* @__PURE__ */ Spicetify.React.createElement("span", { className: "cronotofy-rank" }, "#", idx + 1), artist.imageUrl && /* @__PURE__ */ Spicetify.React.createElement(
        "img",
        {
          src: artist.imageUrl,
          alt: artist.name,
          className: "cronotofy-thumb circle"
        }
      ), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-text" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-title" }, artist.name), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-sub" }, artist.genres.slice(0, 2).join(", ") || t.entities.spotifyArtist))),
      /* @__PURE__ */ Spicetify.React.createElement("span", { className: "cronotofy-badge" }, t.entities.popularityLabel(artist.popularity))
    )), topArtists.length === 0 && /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-empty" }, t.empty.noArtistsPeriod))), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-card" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-section-header" }, /* @__PURE__ */ Spicetify.React.createElement("h2", { className: "cronotofy-section-title" }, t.sections.top5Tracks), /* @__PURE__ */ Spicetify.React.createElement(
      "button",
      {
        type: "button",
        className: "cronotofy-link-btn",
        onClick: () => setActiveTab("tracks")
      },
      t.sections.viewAll(topTracks.length)
    )), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-list" }, topTracks.slice(0, 5).map((track, idx) => /* @__PURE__ */ Spicetify.React.createElement("div", { key: track.id, className: "cronotofy-row" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-left" }, /* @__PURE__ */ Spicetify.React.createElement("span", { className: "cronotofy-rank" }, "#", idx + 1), track.albumImageUrl && /* @__PURE__ */ Spicetify.React.createElement(
      "img",
      {
        src: track.albumImageUrl,
        alt: track.name,
        className: "cronotofy-thumb"
      }
    ), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-text" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-title" }, track.name), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-sub" }, track.artistName, " \xB7 ", formatDurationMs(track.durationMs)))), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-actions" }, /* @__PURE__ */ Spicetify.React.createElement(
      SpotifyPlayButton,
      {
        isPlayingThis: Boolean(liveTrack && liveTrack.uri === track.uri && liveTrack.isPlaying),
        playLabel: t.actions.play,
        pauseLabel: t.actions.pause,
        onPress: () => void handlePlayOrToggleUri(track.uri, track.name)
      }
    ), /* @__PURE__ */ Spicetify.React.createElement(
      SpotifyQueueButton,
      {
        tooltip: t.actions.addToQueue,
        onQueue: () => void handleQueueTrack(track.uri, track.name)
      }
    )))), topTracks.length === 0 && /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-empty" }, t.empty.noTracksPeriod))), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-card" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-section-header" }, /* @__PURE__ */ Spicetify.React.createElement("h2", { className: "cronotofy-section-title" }, t.sections.top4Albums), /* @__PURE__ */ Spicetify.React.createElement(
      "button",
      {
        type: "button",
        className: "cronotofy-link-btn",
        onClick: () => setActiveTab("albums")
      },
      t.sections.viewAll(aggregatedAlbums.length)
    )), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-list" }, aggregatedAlbums.slice(0, 4).map((album, idx) => /* @__PURE__ */ Spicetify.React.createElement(
      "div",
      {
        key: album.id,
        className: "cronotofy-row",
        style: { cursor: album.uri ? "pointer" : "default" },
        onClick: () => {
          if (album.uri) navigateToSpotifyEntity("album", album.id);
        }
      },
      /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-left" }, /* @__PURE__ */ Spicetify.React.createElement("span", { className: "cronotofy-rank" }, "#", idx + 1), album.imageUrl && /* @__PURE__ */ Spicetify.React.createElement("img", { src: album.imageUrl, alt: album.name, className: "cronotofy-thumb" }), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-text" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-title" }, album.name), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-sub" }, album.artistName))),
      /* @__PURE__ */ Spicetify.React.createElement("span", { className: "cronotofy-badge" }, t.entities.topTracksCount(album.trackCount))
    )), aggregatedAlbums.length === 0 && /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-empty" }, t.empty.noAlbumsPeriod))), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-card" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-section-header" }, /* @__PURE__ */ Spicetify.React.createElement("h2", { className: "cronotofy-section-title" }, t.sections.genreDna), /* @__PURE__ */ Spicetify.React.createElement("span", { className: "cronotofy-badge" }, t.sections.mainGenresBadge(genreStats.length))), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-list" }, genreStats.map((g) => /* @__PURE__ */ Spicetify.React.createElement("div", { key: g.genre, style: { padding: "4px 2px" } }, /* @__PURE__ */ Spicetify.React.createElement("div", { style: { display: "flex", justifyContent: "space-between", fontSize: 12.5 } }, /* @__PURE__ */ Spicetify.React.createElement("span", { style: { fontWeight: 600, textTransform: "capitalize", color: "#f1f5f9" } }, g.genre), /* @__PURE__ */ Spicetify.React.createElement("span", { style: { color: palette.accentSoft, fontWeight: 700 } }, g.pct, "%")), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-genre-bar-bg" }, /* @__PURE__ */ Spicetify.React.createElement(
      "div",
      {
        className: "cronotofy-genre-bar-fill",
        style: { width: `${Math.max(4, Math.min(100, g.pct * 2.2))}%` }
      }
    )))), genreStats.length === 0 && /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-empty" }, t.empty.noGenres))))), activeTab === "artists" && /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-cards-grid" }, topArtists.map((artist, idx) => /* @__PURE__ */ Spicetify.React.createElement(
      "div",
      {
        key: artist.id,
        className: "cronotofy-entity-card",
        onClick: () => navigateToSpotifyEntity("artist", artist.id)
      },
      /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-card-cover-wrap" }, artist.imageUrl ? /* @__PURE__ */ Spicetify.React.createElement(
        "img",
        {
          src: artist.imageUrl,
          alt: artist.name,
          className: "cronotofy-entity-cover circle"
        }
      ) : /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-entity-cover circle" }), artist.uri && /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-card-play-overlay" }, /* @__PURE__ */ Spicetify.React.createElement(
        SpotifyPlayButton,
        {
          size: "lg",
          playLabel: t.actions.play,
          pauseLabel: t.actions.pause,
          onPress: () => void handlePlayOrToggleUri(artist.uri, artist.name)
        }
      ))),
      /* @__PURE__ */ Spicetify.React.createElement("div", null, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-entity-meta" }, /* @__PURE__ */ Spicetify.React.createElement("span", { className: "cronotofy-badge" }, "#", idx + 1), /* @__PURE__ */ Spicetify.React.createElement("span", { className: "cronotofy-entity-stat" }, t.entities.popularityLabel(artist.popularity))), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-title", style: { marginTop: 8, fontSize: 14 } }, artist.name), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-sub" }, artist.genres.slice(0, 2).join(" \xB7 ") || t.entities.spotifyArtist)),
      /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-genre-bar-bg", style: { marginTop: "auto" } }, /* @__PURE__ */ Spicetify.React.createElement(
        "div",
        {
          className: "cronotofy-genre-bar-fill",
          style: { width: `${Math.min(100, Math.max(8, artist.popularity))}%` }
        }
      ))
    )), !loading && topArtists.length === 0 && /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-card cronotofy-empty", style: { gridColumn: "1 / -1" } }, t.empty.noArtistsFound)), activeTab === "tracks" && /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-card" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-section-header" }, /* @__PURE__ */ Spicetify.React.createElement("h2", { className: "cronotofy-section-title" }, t.sections.tracksRanking(periodLabels[timeRange])), /* @__PURE__ */ Spicetify.React.createElement("span", { className: "cronotofy-badge" }, t.sections.tracksBadge(topTracks.length))), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-list" }, topTracks.map((track, idx) => /* @__PURE__ */ Spicetify.React.createElement("div", { key: track.id, className: "cronotofy-row" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-left" }, /* @__PURE__ */ Spicetify.React.createElement("span", { className: "cronotofy-rank" }, "#", idx + 1), track.albumImageUrl && /* @__PURE__ */ Spicetify.React.createElement("img", { src: track.albumImageUrl, alt: track.name, className: "cronotofy-thumb" }), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-text" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-title" }, track.name), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-sub" }, track.artistName, track.albumName ? ` \xB7 ${track.albumName}` : ""))), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-actions" }, /* @__PURE__ */ Spicetify.React.createElement("span", { className: "cronotofy-track-duration" }, formatDurationMs(track.durationMs)), /* @__PURE__ */ Spicetify.React.createElement(
      SpotifyPlayButton,
      {
        isPlayingThis: Boolean(liveTrack && liveTrack.uri === track.uri && liveTrack.isPlaying),
        playLabel: t.actions.play,
        pauseLabel: t.actions.pause,
        onPress: () => void handlePlayOrToggleUri(track.uri, track.name)
      }
    ), /* @__PURE__ */ Spicetify.React.createElement(
      SpotifyQueueButton,
      {
        tooltip: t.actions.addToQueue,
        onQueue: () => void handleQueueTrack(track.uri, track.name)
      }
    )))), !loading && topTracks.length === 0 && /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-empty" }, t.empty.noTracksPeriod))), activeTab === "albums" && /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-cards-grid" }, aggregatedAlbums.map((album, idx) => /* @__PURE__ */ Spicetify.React.createElement(
      "div",
      {
        key: album.id,
        className: "cronotofy-entity-card",
        onClick: () => {
          if (album.uri) navigateToSpotifyEntity("album", album.id);
        }
      },
      /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-card-cover-wrap" }, album.imageUrl ? /* @__PURE__ */ Spicetify.React.createElement("img", { src: album.imageUrl, alt: album.name, className: "cronotofy-entity-cover" }) : /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-entity-cover" }), album.uri && /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-card-play-overlay" }, /* @__PURE__ */ Spicetify.React.createElement(
        SpotifyPlayButton,
        {
          size: "lg",
          playLabel: t.actions.play,
          pauseLabel: t.actions.pause,
          onPress: () => void handlePlayOrToggleUri(album.uri, album.name)
        }
      ))),
      /* @__PURE__ */ Spicetify.React.createElement("div", null, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-entity-meta" }, /* @__PURE__ */ Spicetify.React.createElement("span", { className: "cronotofy-badge" }, "#", idx + 1), /* @__PURE__ */ Spicetify.React.createElement("span", { className: "cronotofy-entity-stat", style: { color: palette.accentSoft, fontWeight: 700 } }, album.trackCount, " ", album.trackCount === 1 ? t.entities.songSingular : t.entities.songPlural)), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-title", style: { marginTop: 8, fontSize: 14 } }, album.name), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-sub" }, album.artistName))
    )), !loading && aggregatedAlbums.length === 0 && /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-card cronotofy-empty", style: { gridColumn: "1 / -1" } }, t.empty.noAlbumsPeriod)), activeTab === "live" && /* @__PURE__ */ Spicetify.React.createElement(Spicetify.React.Fragment, null, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-grid" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-card" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-label" }, t.sections.tracksListenedToday), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-value" }, formatSecondsHuman(snapshot.todaySeconds)), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-sub" }, t.sections.localDateLabel(snapshot.todayDate || t.today))), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-card" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-label" }, t.sections.accumulatedDesktop), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-value" }, formatSecondsHuman(snapshot.totalSeconds)), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-sub" }, t.sections.exactSecondBySecond)), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-card" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-label" }, t.sections.capturedTracks), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-value" }, snapshot.tracks.length), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-sub" }, t.sections.completedPlays(snapshot.recentPlays.length))), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-card" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-label" }, t.sections.lastSync), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-value", style: { fontSize: 18 } }, snapshot.lastSyncedAt ? formatRelativeTimeLocalized(snapshot.lastSyncedAt, t, rawLocale) : t.sections.pending), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-kpi-sub" }, user ? user.displayName : "Spotify Desktop"))), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-two-col" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-card" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-section-header" }, /* @__PURE__ */ Spicetify.React.createElement("h2", { className: "cronotofy-section-title" }, t.sections.topRealTimeTracks), /* @__PURE__ */ Spicetify.React.createElement("span", { className: "cronotofy-badge" }, t.sections.topNBadge(Math.min(15, snapshot.tracks.length)))), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-list" }, snapshot.tracks.slice(0, 15).map((tr, idx) => /* @__PURE__ */ Spicetify.React.createElement("div", { key: tr.id, className: "cronotofy-row" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-left" }, /* @__PURE__ */ Spicetify.React.createElement("span", { className: "cronotofy-rank" }, "#", idx + 1), tr.albumImageUrl && /* @__PURE__ */ Spicetify.React.createElement("img", { src: tr.albumImageUrl, alt: tr.name, className: "cronotofy-thumb" }), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-text" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-title" }, tr.name), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-sub" }, tr.artistName, " \xB7 ", tr.playCount, " ", tr.playCount === 1 ? t.entities.playSingular : t.entities.playPlural))), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-actions" }, /* @__PURE__ */ Spicetify.React.createElement("span", { className: "cronotofy-badge" }, formatSecondsHuman(tr.totalSeconds)), /* @__PURE__ */ Spicetify.React.createElement(
      SpotifyPlayButton,
      {
        isPlayingThis: Boolean(liveTrack && liveTrack.uri === tr.uri && liveTrack.isPlaying),
        playLabel: t.actions.play,
        pauseLabel: t.actions.pause,
        onPress: () => void handlePlayOrToggleUri(tr.uri, tr.name)
      }
    ), /* @__PURE__ */ Spicetify.React.createElement(
      SpotifyQueueButton,
      {
        tooltip: t.actions.addToQueue,
        onQueue: () => void handleQueueTrack(tr.uri, tr.name)
      }
    )))), snapshot.tracks.length === 0 && /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-empty" }, t.empty.noTrackedTimeYet))), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-card" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-section-header" }, /* @__PURE__ */ Spicetify.React.createElement("h2", { className: "cronotofy-section-title" }, t.sections.realArtistsAndRecent), snapshot.tracks.length > 0 && /* @__PURE__ */ Spicetify.React.createElement(
      "button",
      {
        type: "button",
        className: "cronotofy-link-btn",
        onClick: () => {
          window.__CRONOTOFY_MOD__?.clearLocalHistory();
          Spicetify?.showNotification?.(t.actions.historyClearedToast);
        }
      },
      t.sections.clearLocalHistory
    )), trackedArtistsSummary.length > 0 && /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-list", style: { marginBottom: 16 } }, trackedArtistsSummary.slice(0, 5).map((a, idx) => /* @__PURE__ */ Spicetify.React.createElement("div", { key: a.name, className: "cronotofy-row" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-left" }, /* @__PURE__ */ Spicetify.React.createElement("span", { className: "cronotofy-rank" }, "#", idx + 1), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-text" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-title" }, a.name), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-sub" }, t.sections.recordedPlays(a.plays)))), /* @__PURE__ */ Spicetify.React.createElement("span", { className: "cronotofy-badge" }, formatSecondsHuman(a.totalSeconds))))), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-section-header", style: { marginTop: 8 } }, /* @__PURE__ */ Spicetify.React.createElement("h3", { className: "cronotofy-section-title", style: { fontSize: 13.5 } }, t.sections.latestCapturedPlays)), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-list" }, snapshot.recentPlays.slice(0, 12).map((p, idx) => /* @__PURE__ */ Spicetify.React.createElement("div", { key: `${p.id}-${p.playedAt}-${idx}`, className: "cronotofy-row" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-left" }, p.albumImageUrl && /* @__PURE__ */ Spicetify.React.createElement("img", { src: p.albumImageUrl, alt: p.name, className: "cronotofy-thumb" }), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-text" }, /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-title" }, p.name), /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-row-sub" }, p.artistName, " \xB7 ", formatRelativeTimeLocalized(p.playedAt, t, rawLocale)))), /* @__PURE__ */ Spicetify.React.createElement("span", { className: "cronotofy-badge" }, formatSecondsHuman(p.listenedSeconds)))), snapshot.recentPlays.length === 0 && /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-empty" }, t.empty.noRecentPlaysYet))))))));
  }
  var cachedErrorBoundary = null;
  function getErrorBoundary() {
    if (cachedErrorBoundary) return cachedErrorBoundary;
    const BaseComponent = Spicetify.React.Component;
    class CronotofyErrorBoundary extends BaseComponent {
      constructor(props) {
        super(props);
        this.state = { hasError: false, message: "" };
      }
      static getDerivedStateFromError(error) {
        return {
          hasError: true,
          message: error instanceof Error ? error.message : String(error || "Unexpected error")
        };
      }
      render() {
        if (this.state.hasError) {
          ensureCronotofyStyles();
          const { t } = getTranslations();
          return /* @__PURE__ */ Spicetify.React.createElement("div", { className: "cronotofy-root" }, /* @__PURE__ */ Spicetify.React.createElement(
            "div",
            {
              className: "cronotofy-card",
              style: { maxWidth: 520, margin: "40px auto", textAlign: "center" }
            },
            /* @__PURE__ */ Spicetify.React.createElement("h2", { className: "cronotofy-section-title", style: { marginBottom: 8 } }, t.errorBoundary.title),
            /* @__PURE__ */ Spicetify.React.createElement("p", { style: { fontSize: 13, color: "#94a3b8", marginBottom: 16 } }, this.state.message || t.errorBoundary.fallbackMsg),
            /* @__PURE__ */ Spicetify.React.createElement(
              "button",
              {
                type: "button",
                className: "cronotofy-btn cronotofy-btn-primary",
                onClick: () => this.setState({ hasError: false, message: "" })
              },
              t.errorBoundary.retry
            )
          ));
        }
        return this.props.children;
      }
    }
    cachedErrorBoundary = CronotofyErrorBoundary;
    return cachedErrorBoundary;
  }
  function render() {
    const ErrorBoundary = getErrorBoundary();
    return Spicetify.React.createElement(
      ErrorBoundary,
      null,
      Spicetify.React.createElement(CronotofyApp, null)
    );
  }

  // spicetify-cronotofy/src/chromeWidgets.ts
  var NAV_BTN_ID = "cronotofy-nav-btn";
  var NPB_TELEMETRY_ID = "cronotofy-npb-telemetry";
  function isCronotofyRoute(pathname) {
    const path = pathname ?? (typeof Spicetify !== "undefined" ? Spicetify?.Platform?.History?.location?.pathname : "") ?? (typeof window !== "undefined" ? window.location.pathname : "");
    return typeof path === "string" && path.startsWith("/cronotofy");
  }
  function scrollCronotofyToTop() {
    const viewport = document.getElementById("cronotofy-ext-host") || document.querySelector(".Root__main-view [data-overlayscrollbars-viewport]") || document.querySelector(".main-view-container__scroll-node") || document.querySelector("[data-overlayscrollbars-viewport]");
    if (viewport && typeof viewport.scrollTo === "function") {
      viewport.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
  var CronotofyChromeWidgets = class {
    constructor(tracker, options = {}) {
      this.navBtn = null;
      this.telemetryEl = null;
      this.sessionPill = null;
      this.todayPill = null;
      this.lastSessionText = "";
      this.lastTodayText = "";
      this.observer = null;
      this.rafPending = false;
      this.initialized = false;
      this.tracker = tracker;
      this.options = options;
    }
    init() {
      if (this.initialized || typeof document === "undefined") return;
      this.initialized = true;
      this.ensureMounted();
      this.updateTelemetry();
      this.syncActiveRoute();
      this.tracker.subscribe(() => {
        this.updateTelemetry();
      });
      Spicetify?.Platform?.History?.listen?.((loc) => {
        this.syncActiveRoute(loc?.pathname);
      });
      if (document.body && typeof MutationObserver !== "undefined") {
        this.observer = new MutationObserver(() => {
          if (this.rafPending) return;
          this.rafPending = true;
          requestAnimationFrame(() => {
            this.rafPending = false;
            this.ensureMounted();
            this.syncActiveRoute();
          });
        });
        this.observer.observe(document.body, { childList: true, subtree: true });
      }
    }
    getOrCreateNavButton() {
      if (this.navBtn) return this.navBtn;
      const btn = document.createElement("button");
      btn.id = NAV_BTN_ID;
      btn.type = "button";
      btn.setAttribute("aria-label", "Cronotofy");
      btn.title = "Cronotofy";
      btn.innerHTML = `<svg width="22" height="22" viewBox="1.4 1.4 30 29.2" style="display:block" aria-hidden="true"><defs><linearGradient id="crono-nav-grad" x1="1.4" y1="16" x2="31.4" y2="16" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="var(--cronotofy-accent, #e2e8f0)"/><stop offset="100%" stop-color="var(--cronotofy-accent-2, #94a3b8)"/></linearGradient></defs><g class="cronotofy-nav-glyph" fill="currentColor"><rect x="14" y="13.5" width="2" height="5" rx="1"/><rect x="17" y="11.5" width="2" height="9" rx="1"/><rect x="20" y="9" width="2" height="14" rx="1"/><rect x="23" y="5" width="2" height="22" rx="1"/><rect x="26" y="8.5" width="2" height="15" rx="1"/><rect x="29" y="12.5" width="2" height="7" rx="1"/><path d="M 23.07 28.25 A 14.15 14.15 0 1 1 23.07 3.75 L 21.97 5.66 A 11.95 11.95 0 1 0 21.97 26.34 Z"/><path d="M 21.08 24.79 A 10.15 10.15 0 1 1 21.08 7.21 L 19.97 9.12 A 7.95 7.95 0 1 0 19.97 22.88 Z"/></g></svg>`;
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.options.onOpen) {
          this.options.onOpen();
        } else if (isCronotofyRoute()) {
          scrollCronotofyToTop();
        } else {
          Spicetify?.Platform?.History?.push?.("/cronotofy");
        }
      });
      this.navBtn = btn;
      return btn;
    }
    getOrCreateTelemetry() {
      if (this.telemetryEl) return this.telemetryEl;
      const wrap = document.createElement("button");
      wrap.id = NPB_TELEMETRY_ID;
      wrap.type = "button";
      wrap.title = "Cronotofy";
      wrap.setAttribute("aria-label", "Cronotofy");
      const sessionPill = document.createElement("span");
      sessionPill.className = "cronotofy-npb-pill";
      const todayPill = document.createElement("span");
      todayPill.className = "cronotofy-npb-pill";
      wrap.append(sessionPill, todayPill);
      wrap.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (this.options.onOpen) {
          this.options.onOpen();
        } else {
          Spicetify?.Platform?.History?.push?.("/cronotofy");
        }
      });
      this.telemetryEl = wrap;
      this.sessionPill = sessionPill;
      this.todayPill = todayPill;
      return wrap;
    }
    ensureMounted() {
      const searchContainer = document.querySelector(".main-globalNav-searchContainer");
      if (searchContainer) {
        const btn = this.getOrCreateNavButton();
        const orphan = document.getElementById(NAV_BTN_ID);
        if (orphan && orphan !== btn) orphan.remove();
        if (btn.parentElement !== searchContainer || searchContainer.lastElementChild !== btn) {
          searchContainer.appendChild(btn);
        }
      }
      const leftBar = document.querySelector(".main-nowPlayingBar-left");
      if (leftBar) {
        const telemetry = this.getOrCreateTelemetry();
        const orphan = document.getElementById(NPB_TELEMETRY_ID);
        if (orphan && orphan !== telemetry) orphan.remove();
        if (telemetry.parentElement !== leftBar || leftBar.lastElementChild !== telemetry) {
          leftBar.appendChild(telemetry);
        }
      }
    }
    syncActiveRoute(pathname) {
      const active = this.options.isOpen ? this.options.isOpen() : isCronotofyRoute(pathname);
      if (this.navBtn) {
        this.navBtn.classList.toggle("active", active);
      }
    }
    updateTelemetry() {
      this.getOrCreateTelemetry();
      const { t } = getTranslations();
      const snapshot = this.tracker.getSnapshot();
      const sessionText = `${t.currentSession}: ${formatSecondsHuman(snapshot.currentTrackSeconds)}`;
      const todayText = `${t.today}: ${formatSecondsHuman(snapshot.todaySeconds)}`;
      if (this.sessionPill && this.lastSessionText !== sessionText) {
        this.lastSessionText = sessionText;
        this.sessionPill.textContent = sessionText;
      }
      if (this.todayPill && this.lastTodayText !== todayText) {
        this.lastTodayText = todayText;
        this.todayPill.textContent = todayText;
      }
    }
    destroy() {
      this.observer?.disconnect();
      this.observer = null;
    }
  };

  // spicetify-cronotofy/src/globalWall.ts
  var GLOBAL_WALL_STYLE_ID = "cronotofy-global-wall-style";
  var GLOBAL_WALL_ROOT_ID = "cronotofy-global-wall";
  var GLOBAL_WALL_CSS = `
#${GLOBAL_WALL_ROOT_ID} {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
  contain: strict;
  user-select: none;
  background-color: var(--cronotofy-bg-main, #0b0f17);
}

.cronotofy-gwall-grid {
  position: absolute;
  inset: -140px -120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 18px;
  transform: rotate(-3deg) scale(1.12);
}

.cronotofy-gwall-row {
  display: flex;
  align-items: center;
  gap: 18px;
  width: max-content;
  will-change: transform;
}

.cronotofy-gwall-row.left {
  animation: cronotofyGlobalMarqueeLeft var(--cronotofy-gmarquee-duration, 92s) linear infinite;
}

.cronotofy-gwall-row.right {
  animation: cronotofyGlobalMarqueeRight var(--cronotofy-gmarquee-duration, 100s) linear infinite;
}

@keyframes cronotofyGlobalMarqueeLeft {
  0% {
    transform: translate3d(0, 0, 0);
  }
  100% {
    transform: translate3d(-50%, 0, 0);
  }
}

@keyframes cronotofyGlobalMarqueeRight {
  0% {
    transform: translate3d(-50%, 0, 0);
  }
  100% {
    transform: translate3d(0, 0, 0);
  }
}

.cronotofy-gwall-tile {
  width: 118px;
  height: 118px;
  border-radius: 14px;
  overflow: hidden;
  flex-shrink: 0;
  opacity: 0.68;
  filter: brightness(0.78) saturate(1.15);
  background: rgba(17, 23, 34, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.35);
}

.cronotofy-gwall-tile img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cronotofy-gwall-scrim {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(ellipse at 50% 25%, rgba(var(--cronotofy-accent-rgb, 226, 232, 240), 0.14) 0%, transparent 62%),
    radial-gradient(ellipse at 50% 100%, rgba(var(--cronotofy-accent-2-rgb, 148, 163, 184), 0.10) 0%, transparent 60%),
    linear-gradient(
      180deg,
      rgba(var(--cronotofy-bg-main-rgb, 11, 15, 23), 0.48) 0%,
      rgba(var(--cronotofy-bg-main-rgb, 11, 15, 23), 0.54) 50%,
      rgba(var(--cronotofy-bg-main-rgb, 11, 15, 23), 0.62) 100%
    );
  pointer-events: none;
}

/* Global Encore & Spice translucent variables (clean smoked Apple crystal) */
:root,
.encore-dark-theme,
.encore-dark-theme .encore-base-set {
  --background-base: rgba(var(--cronotofy-bg-main-rgb, 11, 15, 23), 0.18) !important;
  --background-elevated-base: rgba(var(--cronotofy-bg-card-rgb, 17, 23, 34), 0.24) !important;
  --background-elevated-highlight: rgba(var(--cronotofy-bg-card-rgb, 17, 23, 34), 0.36) !important;
  --background-highlight: rgba(255, 255, 255, 0.08) !important;
  --background-press: rgba(var(--cronotofy-bg-main-rgb, 11, 15, 23), 0.48) !important;
  --background-tinted-base: rgba(255, 255, 255, 0.06) !important;
  --background-tinted-highlight: rgba(255, 255, 255, 0.12) !important;
  --section-background-base: rgba(var(--cronotofy-bg-card-rgb, 17, 23, 34), 0.22) !important;
}

/* Transparent root shell so the animated album wall shows behind the entire app */
html,
body,
#main,
.Root__top-container {
  background: transparent !important;
  background-color: transparent !important;
}

#main,
.Root__top-container {
  position: relative;
  z-index: 1;
}

/* Top Global Nav Bar \u2014 Clean Dark Apple Liquid Glass
   Keep backdrop-filter on ::before so .Root__globalNav stays above .Root__main-view
   and descendants (Recent Searches dropdown) are not trapped behind a Backdrop Root */
.Root__globalNav {
  position: relative !important;
  z-index: 100 !important;
  background: transparent !important;
  background-color: transparent !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  border: none !important;
  box-shadow: none !important;
  overflow: visible !important;
}

.Root__globalNav::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  pointer-events: none;
  background: rgba(var(--cronotofy-bg-sidebar-rgb, 11, 15, 23), 0.26) !important;
  backdrop-filter: blur(10px) saturate(170%) brightness(0.88) !important;
  -webkit-backdrop-filter: blur(10px) saturate(170%) brightness(0.88) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.14) !important;
  box-shadow:
    0 10px 28px -8px rgba(0, 0, 0, 0.48),
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    inset 0 -1px 0 rgba(255, 255, 255, 0.05) !important;
}

/* Search / Recent Searches dropdown over Liquid Glass */
.Root__globalNav [role="listbox"],
.qGPO5O89umT0jc_uov5X {
  z-index: 100 !important;
}

.Root__globalNav [role="listbox"] > div,
.main-globalNav-searchInputSection [role="listbox"] > div,
.ATzSlFakPhgCcp6m2wgQ {
  background: rgba(var(--cronotofy-bg-card-rgb, 17, 23, 34), 0.62) !important;
  backdrop-filter: blur(18px) saturate(175%) brightness(0.84) !important;
  -webkit-backdrop-filter: blur(18px) saturate(175%) brightness(0.84) !important;
  border: 1px solid rgba(255, 255, 255, 0.16) !important;
  border-radius: 18px !important;
  box-shadow:
    0 20px 48px -8px rgba(0, 0, 0, 0.68),
    inset 0 1px 0 rgba(255, 255, 255, 0.26),
    inset 0 -1px 0 rgba(255, 255, 255, 0.05) !important;
}

.main-topBar-searchBar,
.Root__globalNav .main-globalNav-navLink {
  background: rgba(var(--cronotofy-bg-card-rgb, 17, 23, 34), 0.24) !important;
  border: 1px solid rgba(255, 255, 255, 0.14) !important;
  box-shadow:
    0 10px 28px -8px rgba(0, 0, 0, 0.48),
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    inset 0 -1px 0 rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(8px) saturate(170%) brightness(0.90) !important;
  -webkit-backdrop-filter: blur(8px) saturate(170%) brightness(0.90) !important;
}

/* Left Sidebar ("Your Library") \u2014 Clean Dark Apple Liquid Glass */
.Root__nav-bar {
  background: rgba(var(--cronotofy-bg-sidebar-rgb, 11, 15, 23), 0.26) !important;
  backdrop-filter: blur(10px) saturate(170%) brightness(0.88) !important;
  -webkit-backdrop-filter: blur(10px) saturate(170%) brightness(0.88) !important;
  border: 1px solid rgba(255, 255, 255, 0.14) !important;
  border-radius: 20px !important;
  box-shadow:
    0 10px 28px -8px rgba(0, 0, 0, 0.48),
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    inset 0 -1px 0 rgba(255, 255, 255, 0.05) !important;
  overflow: hidden !important;
}

.main-yourLibraryX-libraryContainer,
.main-yourLibraryX-entryPoints,
.main-yourLibraryX-library,
#Desktop_LeftSidebar_Id,
#Desktop_LeftSidebar_Id > div {
  background: transparent !important;
  background-color: transparent !important;
}

/* Right Sidebar ("Now Playing View") \u2014 Clean Dark Apple Liquid Glass */
.Root__right-sidebar,
.Root__right-sidebar-peek {
  background: rgba(var(--cronotofy-bg-sidebar-rgb, 11, 15, 23), 0.26) !important;
  backdrop-filter: blur(10px) saturate(170%) brightness(0.88) !important;
  -webkit-backdrop-filter: blur(10px) saturate(170%) brightness(0.88) !important;
  border: 1px solid rgba(255, 255, 255, 0.14) !important;
  border-radius: 20px !important;
  box-shadow:
    0 10px 28px -8px rgba(0, 0, 0, 0.48),
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    inset 0 -1px 0 rgba(255, 255, 255, 0.05) !important;
  overflow: hidden !important;
}

.Root__right-sidebar > div,
.Root__right-sidebar aside,
[data-testid="NPV_Panel_OpenDiv"],
.Root__right-sidebar [data-overlayscrollbars-viewport] {
  background: transparent !important;
  background-color: transparent !important;
}

.main-nowPlayingView-section,
.main-nowPlayingView-aboutArtist,
.tMptdCSOI4gCghRCF74n,
[data-testid="NPV_Panel_OpenDiv"] section {
  background: rgba(var(--cronotofy-bg-card-rgb, 17, 23, 34), 0.24) !important;
  border: 1px solid rgba(255, 255, 255, 0.14) !important;
  box-shadow:
    0 10px 28px -8px rgba(0, 0, 0, 0.48),
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    inset 0 -1px 0 rgba(255, 255, 255, 0.05) !important;
  backdrop-filter: blur(8px) saturate(170%) brightness(0.90) !important;
  -webkit-backdrop-filter: blur(8px) saturate(170%) brightness(0.90) !important;
  border-radius: 18px !important;
}

/* Bottom Player Bar \u2014 Clean Dark Apple Liquid Glass Dock */
.Root__now-playing-bar {
  background: rgba(var(--cronotofy-bg-sidebar-rgb, 11, 15, 23), 0.26) !important;
  backdrop-filter: blur(10px) saturate(170%) brightness(0.88) !important;
  -webkit-backdrop-filter: blur(10px) saturate(170%) brightness(0.88) !important;
  border-top: 1px solid rgba(255, 255, 255, 0.14) !important;
  box-shadow:
    0 -10px 28px -8px rgba(0, 0, 0, 0.48),
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    inset 0 -1px 0 rgba(255, 255, 255, 0.05) !important;
}

.Root__now-playing-bar footer,
[data-testid="now-playing-bar"],
.main-nowPlayingBar-container {
  background: transparent !important;
  background-color: transparent !important;
}

/* Center Panel (.Root__main-view) \u2014 Near-invisible shell so cards float cleanly */
.Root__main-view {
  background-color: rgba(var(--cronotofy-bg-main-rgb, 11, 15, 23), 0.12) !important;
  border: 1px solid rgba(255, 255, 255, 0.09) !important;
  border-radius: 20px !important;
  box-shadow: none !important;
}

html.cronotofy-route-active .Root__main-view {
  background-color: rgba(var(--cronotofy-bg-main-rgb, 11, 15, 23), 0.04) !important;
}

.main-view-container,
.main-view-container__scroll-node,
.main-view-container__scroll-node-child,
.main-view-container__mh-footer-container,
.main-home-home,
.main-actionBarBackground-background,
.main-entityHeader-backgroundColor,
.main-entityHeader-overlay {
  background-color: transparent !important;
}

.main-card-card,
.view-homeShortcutsGrid-shortcut,
.main-contextMenu-menu,
[role="menu"],
.GenericModal,
.main-trackList-trackListHeader {
  background: rgba(var(--cronotofy-bg-card-rgb, 17, 23, 34), 0.24) !important;
  backdrop-filter: blur(8px) saturate(170%) brightness(0.90) !important;
  -webkit-backdrop-filter: blur(8px) saturate(170%) brightness(0.90) !important;
  border: 1px solid rgba(255, 255, 255, 0.14) !important;
  border-radius: 18px !important;
  box-shadow:
    0 10px 28px -8px rgba(0, 0, 0, 0.48),
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    inset 0 -1px 0 rgba(255, 255, 255, 0.05) !important;
}

/* Hide Spotify's black scroll topbar cleanly when inside Cronotofy */
html.cronotofy-route-active .main-topBar-container,
html.cronotofy-route-active .main-topBar-background,
html.cronotofy-route-active .main-topBar-overlay {
  display: none !important;
  opacity: 0 !important;
  background: transparent !important;
  pointer-events: none !important;
}

/* Hide Spicetify's left-side Cronotofy link without mutating its React tree */
.custom-navlinks-scrollable_container .custom-navlink[aria-label="Cronotofy"] {
  display: none !important;
}

/* Centered Cronotofy nav button to the right of Spotify's search bar */
.main-globalNav-searchContainer {
  align-items: center !important;
}

#cronotofy-nav-btn {
  width: 48px;
  height: 48px;
  min-width: 48px;
  min-height: 48px;
  border-radius: 50%;
  margin-inline-start: 8px;
  flex-shrink: 0;
  padding: 0;
  line-height: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: var(--text-subdued, #b3b3b3);
  background: rgba(var(--cronotofy-bg-card-rgb, 17, 23, 34), 0.24);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    0 10px 28px -8px rgba(0, 0, 0, 0.48),
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    inset 0 -1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px) saturate(170%) brightness(0.90);
  -webkit-backdrop-filter: blur(8px) saturate(170%) brightness(0.90);
  -webkit-app-region: no-drag;
  transition: transform 0.16s ease, color 0.16s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

#cronotofy-nav-btn svg {
  display: block;
}

#cronotofy-nav-btn:hover {
  transform: scale(1.04);
  color: #ffffff;
  border-color: rgba(255, 255, 255, 0.24);
}

#cronotofy-nav-btn.active {
  color: #ffffff;
  border-color: rgba(var(--cronotofy-accent-rgb, 226, 232, 240), 0.42);
  box-shadow:
    0 10px 28px -8px rgba(0, 0, 0, 0.48),
    inset 0 1px 0 rgba(255, 255, 255, 0.30),
    inset 0 -1px 0 rgba(255, 255, 255, 0.06);
}

#cronotofy-nav-btn.active .cronotofy-nav-glyph {
  fill: url(#crono-nav-grad);
}

@media (max-width: 1100px) {
  .cronotofy-gwall-grid,
  .cronotofy-gwall-row {
    gap: 14px;
  }

  .cronotofy-gwall-tile {
    width: 92px;
    height: 92px;
    border-radius: 12px;
  }
}

@media (max-width: 980px) {
  #cronotofy-nav-btn {
    width: 40px;
    height: 40px;
    min-width: 40px;
    min-height: 40px;
    margin-inline-start: 6px;
  }

  #cronotofy-nav-btn svg {
    width: 19px;
    height: 19px;
  }
}

/* Bottom bar: place Current session & Today beside the active song */
.main-nowPlayingBar-left {
  display: flex !important;
  flex-direction: row !important;
  align-items: center !important;
  gap: 8px !important;
  overflow: clip !important;
  min-width: 0 !important;
}

.main-nowPlayingBar-left > :not(#cronotofy-npb-telemetry) {
  order: 0;
  flex: 0 1 auto;
  min-width: 0;
}

.main-nowPlayingBar-left [data-testid="now-playing-widget"] {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  overflow: hidden;
}

#cronotofy-npb-telemetry {
  order: 99 !important;
  font-family: var(--encore-body-font-stack, SpotifyMixUI, sans-serif);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex: 0 1 auto;
  min-width: 0;
  max-width: 46%;
  z-index: 2;
  cursor: pointer;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  text-align: left;
  color: inherit;
}

.cronotofy-npb-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1.25;
  white-space: nowrap;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  font-variant-numeric: tabular-nums;
  color: var(--cronotofy-accent-soft, #f1f5f9);
  background: rgba(var(--cronotofy-bg-card-rgb, 17, 23, 34), 0.24);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    0 10px 28px -8px rgba(0, 0, 0, 0.48),
    inset 0 1px 0 rgba(255, 255, 255, 0.24),
    inset 0 -1px 0 rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(8px) saturate(170%) brightness(0.90);
  -webkit-backdrop-filter: blur(8px) saturate(170%) brightness(0.90);
  transition: transform 0.15s ease, border-color 0.2s ease, background-color 0.2s ease;
}

#cronotofy-npb-telemetry:hover .cronotofy-npb-pill {
  border-color: rgba(255, 255, 255, 0.26);
  transform: translateY(-1px);
}

@media (max-width: 1440px) {
  #cronotofy-npb-telemetry {
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    max-width: 150px;
  }

  .cronotofy-npb-pill {
    padding: 2px 8px;
    font-size: 10px;
  }
}

@media (max-width: 1060px) {
  .main-nowPlayingBar-left {
    gap: 6px !important;
  }

  #cronotofy-npb-telemetry {
    gap: 2px;
    max-width: 118px;
  }

  .cronotofy-npb-pill {
    padding: 1.5px 6px;
    font-size: 9.5px;
  }
}

@media (max-width: 820px) {
  #cronotofy-npb-telemetry {
    display: none;
  }
}

#cronotofy-ext-host {
  position: absolute;
  inset: 0;
  z-index: 45;
  overflow-y: auto;
  overflow-x: hidden;
  background: transparent;
}

html.cronotofy-ext-open .Root__main-view .main-view-container__scroll-node,
html.cronotofy-ext-open .Root__main-view [data-overlayscrollbars-viewport] {
  visibility: hidden !important;
  pointer-events: none !important;
}
`;
  function ensureGlobalWallStyle() {
    if (typeof document === "undefined") return;
    const existing = document.getElementById(GLOBAL_WALL_STYLE_ID);
    if (existing) {
      if (existing.textContent !== GLOBAL_WALL_CSS) {
        existing.textContent = GLOBAL_WALL_CSS;
      }
      return;
    }
    const style = document.createElement("style");
    style.id = GLOBAL_WALL_STYLE_ID;
    style.textContent = GLOBAL_WALL_CSS;
    document.head.appendChild(style);
  }
  var GlobalAlbumWallController = class {
    constructor() {
      this.container = null;
      this.currentCovers = [];
      this.renderSignature = "";
      this.userId = "default";
      this.initialized = false;
    }
    async init() {
      if (this.initialized) return;
      this.initialized = true;
      ensureGlobalWallStyle();
      this.ensureMounted();
      const user = await resolveCurrentSpotifyUser();
      this.userId = user?.id || "default";
      this.loadCachedImmediately(this.userId);
      if (!CRONOTOFY_MOD_CONFIG.ui.enableAlbumWall) return;
      try {
        const [tracksRes, artistsRes, recentRes, savedRes] = await Promise.all([
          Spicetify?.CosmosAsync?.get(
            "https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=50"
          ).catch(() => null),
          Spicetify?.CosmosAsync?.get(
            "https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=25"
          ).catch(() => null),
          Spicetify?.CosmosAsync?.get(
            "https://api.spotify.com/v1/me/player/recently-played?limit=30"
          ).catch(() => null),
          Spicetify?.CosmosAsync?.get(
            "https://api.spotify.com/v1/me/tracks?limit=30"
          ).catch(() => null)
        ]);
        const seedCovers = [];
        const artistCandidates = [];
        const seenArtistKeys = /* @__PURE__ */ new Set();
        const pushArtist = (id, name) => {
          const clean = (name || "").trim();
          if (!clean) return;
          const key = id || clean.toLowerCase();
          if (seenArtistKeys.has(key)) return;
          seenArtistKeys.add(key);
          artistCandidates.push({ id, name: clean });
        };
        const pushTrackSeed = (tr) => {
          if (!tr) return;
          const img = normalizeSpotifyImage(tr?.album?.images?.[0]?.url);
          if (img) {
            seedCovers.push({
              id: String(tr.album?.id || tr.id || img),
              title: String(tr.album?.name || tr.name || ""),
              artistName: String(tr.artists?.[0]?.name || ""),
              imageUrl: img
            });
          }
          if (Array.isArray(tr?.artists)) {
            for (const a of tr.artists) {
              if (a?.name) pushArtist(a.id ? String(a.id) : void 0, String(a.name));
            }
          }
        };
        if (Array.isArray(artistsRes?.items)) {
          for (const a of artistsRes.items) {
            if (a?.name) pushArtist(a.id ? String(a.id) : void 0, String(a.name));
          }
        }
        if (Array.isArray(tracksRes?.items)) {
          for (const tr of tracksRes.items) pushTrackSeed(tr);
        }
        if (Array.isArray(recentRes?.items)) {
          for (const item of recentRes.items) pushTrackSeed(item?.track);
        }
        if (Array.isArray(savedRes?.items)) {
          for (const item of savedRes.items) pushTrackSeed(item?.track);
        }
        if (seedCovers.length > 0 && this.currentCovers.length === 0) {
          this.updateCovers(seedCovers, this.userId);
        }
        const enriched = await collectFavoriteArtistCovers({
          userId: this.userId,
          artistCandidates: artistCandidates.slice(0, 14),
          seedTrackCovers: seedCovers
        });
        if (enriched.length > 0) {
          this.updateCovers(enriched, this.userId);
        }
      } catch {
      }
    }
    ensureMounted() {
      if (typeof document === "undefined" || !document.body) return null;
      if (this.container && document.body.contains(this.container)) {
        return this.container;
      }
      const existing = document.getElementById(GLOBAL_WALL_ROOT_ID);
      if (existing) {
        this.container = existing;
        return existing;
      }
      const el = document.createElement("div");
      el.id = GLOBAL_WALL_ROOT_ID;
      el.setAttribute("aria-hidden", "true");
      document.body.prepend(el);
      this.container = el;
      return el;
    }
    loadCachedImmediately(uid) {
      try {
        const key = `${CRONOTOFY_MOD_CONFIG.albumWall.cachePrefix}_${uid || "default"}`;
        const raw = localStorage.getItem(key) || localStorage.getItem(`${CRONOTOFY_MOD_CONFIG.albumWall.cachePrefix}_default`);
        if (!raw) return;
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.covers) && parsed.covers.length > 0) {
          this.updateCovers(parsed.covers, uid);
        }
      } catch {
      }
    }
    updateCovers(covers, seedKey) {
      if (!Array.isArray(covers) || covers.length === 0) return;
      if (!CRONOTOFY_MOD_CONFIG.ui.enableAlbumWall) return;
      const cleanCovers = covers.filter((c) => Boolean(c && c.imageUrl));
      if (cleanCovers.length === 0) return;
      const firstId = cleanCovers[0]?.id || "";
      const lastId = cleanCovers[cleanCovers.length - 1]?.id || "";
      const sig = `${cleanCovers.length}:${firstId}:${lastId}`;
      if (this.renderSignature === sig) return;
      if (this.currentCovers.length >= cleanCovers.length && this.renderSignature !== "") {
        return;
      }
      this.currentCovers = cleanCovers;
      this.renderSignature = sig;
      if (seedKey) this.userId = seedKey;
      const container = this.ensureMounted();
      if (!container) return;
      const rows = buildAlbumWallRows(cleanCovers, this.userId || "cronotofy", 7);
      const speeds = ["88s", "104s", "80s", "98s", "84s", "110s", "94s"];
      const grid = document.createElement("div");
      grid.className = "cronotofy-gwall-grid";
      rows.forEach((rowItems, rowIndex) => {
        const row = document.createElement("div");
        const dir = rowIndex % 2 === 0 ? "left" : "right";
        row.className = `cronotofy-gwall-row ${dir}`;
        row.style.setProperty("--cronotofy-gmarquee-duration", speeds[rowIndex % speeds.length]);
        const doubled = [...rowItems, ...rowItems];
        for (const cover of doubled) {
          const tile = document.createElement("div");
          tile.className = "cronotofy-gwall-tile";
          const img = document.createElement("img");
          img.src = cover.imageUrl;
          img.alt = "";
          img.loading = "lazy";
          tile.appendChild(img);
          row.appendChild(tile);
        }
        grid.appendChild(row);
      });
      const scrim = document.createElement("div");
      scrim.className = "cronotofy-gwall-scrim";
      container.replaceChildren(grid, scrim);
    }
  };

  // spicetify-cronotofy/src/bootstrap.ts
  function bootstrapCronotofy(options = {}) {
    const tryStart = () => {
      if (typeof Spicetify === "undefined" || !Spicetify.Player || !Spicetify.CosmosAsync || !Spicetify.Platform) {
        setTimeout(tryStart, 300);
        return;
      }
      if (window.__CRONOTOFY_MOD__) {
        return;
      }
      const tracker = new ListeningTracker();
      const themeController = new DynamicThemeController();
      const globalWall = new GlobalAlbumWallController();
      const chromeWidgets = new CronotofyChromeWidgets(tracker, {
        onOpen: options.onOpen,
        isOpen: options.isOpen
      });
      let lastThemeKey = "";
      const syncThemeFromPlayer = () => {
        const live = tracker.getLiveTrack();
        if (!live || !live.albumImageUrl) return;
        const key = `${live.uri}|${live.albumImageUrl}`;
        if (key === lastThemeKey) return;
        lastThemeKey = key;
        void themeController.updateFromLiveTrack(live);
      };
      const seedThemeIfNeeded = async () => {
        if (themeController.getPalette().isDynamic) return;
        const snap = tracker.getSnapshot();
        const localCover = snap.recentPlays.find((p) => p.albumImageUrl) || snap.tracks.find((t) => t.albumImageUrl);
        if (localCover?.albumImageUrl) {
          await themeController.seedFromCoverIfNeeded(localCover.albumImageUrl, localCover.uri);
          if (themeController.getPalette().isDynamic) return;
        }
        try {
          const recent = await Spicetify.CosmosAsync?.get(
            "https://api.spotify.com/v1/me/player/recently-played?limit=1"
          ).catch(() => null);
          const recentTrack = recent?.items?.[0]?.track;
          const recentImg = normalizeSpotifyImage(recentTrack?.album?.images?.[0]?.url);
          if (recentImg) {
            await themeController.seedFromCoverIfNeeded(recentImg, recentTrack?.uri);
            if (themeController.getPalette().isDynamic) return;
          }
          const top = await Spicetify.CosmosAsync?.get(
            "https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=1"
          ).catch(() => null);
          const topTrack = top?.items?.[0];
          const topImg = normalizeSpotifyImage(topTrack?.album?.images?.[0]?.url);
          if (topImg) {
            await themeController.seedFromCoverIfNeeded(topImg, topTrack?.uri);
          }
        } catch {
        }
      };
      window.__CRONOTOFY_MOD__ = {
        version: CRONOTOFY_MOD_CONFIG.version,
        getUser: () => resolveCurrentSpotifyUser(),
        getTrackerSnapshot: () => tracker.getSnapshot(),
        getLiveTrack: () => tracker.getLiveTrack(),
        syncNow: () => tracker.syncNow(),
        subscribe: (fn) => {
          const unsubTracker = tracker.subscribe(fn);
          const unsubTheme = themeController.subscribe(fn);
          return () => {
            unsubTracker();
            unsubTheme();
          };
        },
        clearLocalHistory: () => tracker.clearLocalHistory(),
        getDynamicPalette: () => themeController.getPalette(),
        isDynamicThemeEnabled: () => themeController.isEnabled(),
        setDynamicThemeEnabled: (enabled) => {
          themeController.setEnabled(enabled);
          lastThemeKey = "";
          syncThemeFromPlayer();
        },
        setGeminiApiKey: (apiKey) => {
          setGeminiApiKey(apiKey);
          lastThemeKey = "";
          const live = tracker.getLiveTrack();
          if (live) {
            void themeController.updateFromLiveTrack(live);
          }
        },
        hasGeminiApiKey: () => Boolean(getConfiguredGeminiApiKey()),
        updateWallCovers: (covers) => {
          globalWall.updateCovers(covers);
          if (!themeController.getPalette().isDynamic && covers[0]?.imageUrl) {
            void themeController.seedFromCoverIfNeeded(covers[0].imageUrl);
          }
        }
      };
      void tracker.init().then(() => {
        syncThemeFromPlayer();
        void seedThemeIfNeeded();
      });
      void globalWall.init();
      chromeWidgets.init();
      options.onChromeReady?.(chromeWidgets);
      tracker.subscribe(syncThemeFromPlayer);
      Spicetify.Player.addEventListener?.("songchange", () => {
        tracker.onSongChange();
        syncThemeFromPlayer();
      });
      Spicetify.Player.addEventListener?.("onplaypause", () => {
        tracker.onPlayPause();
        syncThemeFromPlayer();
      });
      syncThemeFromPlayer();
    };
    tryStart();
  }

  // spicetify-cronotofy/src/marketplaceEntry.ts
  var EXT_HOST_ID = "cronotofy-ext-host";
  (function initCronotofyMarketplaceExtension() {
    let hostEl = null;
    let reactRoot = null;
    let isOpen = false;
    let widgetsRef = null;
    const setOpenClasses = (open) => {
      document.documentElement.classList.toggle("cronotofy-ext-open", open);
      document.documentElement.classList.toggle("cronotofy-route-active", open);
    };
    const closeView = () => {
      if (!isOpen && !hostEl) return;
      isOpen = false;
      setOpenClasses(false);
      try {
        if (reactRoot && typeof reactRoot.unmount === "function") {
          reactRoot.unmount();
        } else if (hostEl && typeof Spicetify !== "undefined") {
          Spicetify?.ReactDOM?.unmountComponentAtNode?.(hostEl);
        }
      } catch {
      }
      reactRoot = null;
      hostEl?.remove();
      hostEl = null;
      widgetsRef?.syncActiveRoute();
    };
    const mountView = () => {
      const mainView = document.querySelector(".Root__main-view");
      if (!mainView) return;
      if (!hostEl || !mainView.contains(hostEl)) {
        document.getElementById(EXT_HOST_ID)?.remove();
        hostEl = document.createElement("div");
        hostEl.id = EXT_HOST_ID;
        mainView.appendChild(hostEl);
      }
      setOpenClasses(true);
      const appElement = render();
      const createRoot = Spicetify?.ReactDOM?.createRoot || Spicetify?.ReactDOMClient?.createRoot;
      if (typeof createRoot === "function") {
        if (!reactRoot) {
          reactRoot = createRoot(hostEl);
        }
        reactRoot.render(appElement);
      } else {
        Spicetify?.ReactDOM?.render?.(appElement, hostEl);
      }
      isOpen = true;
      widgetsRef?.syncActiveRoute();
    };
    const handleOpenOrToggle = () => {
      if (isOpen) {
        if (hostEl && hostEl.scrollTop > 12) {
          hostEl.scrollTo({ top: 0, behavior: "smooth" });
        } else {
          closeView();
        }
        return;
      }
      mountView();
    };
    bootstrapCronotofy({
      onOpen: handleOpenOrToggle,
      isOpen: () => isOpen,
      onChromeReady: (widgets) => {
        widgetsRef = widgets;
        Spicetify?.Platform?.History?.listen?.(() => {
          if (isOpen) {
            closeView();
          }
        });
        if (typeof window !== "undefined") {
          window.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && isOpen) {
              closeView();
            }
          });
        }
      }
    });
  })();
})();

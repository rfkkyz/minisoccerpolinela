/**
 * Settings Service - POLISOCCER
 * Reads system configurations from the database with short-lived memory cache (60s).
 */
const { Setting } = require('../models');

let cache = {};
let lastFetched = 0;
const CACHE_TTL_MS = 60000;

async function getSettings(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && now - lastFetched < CACHE_TTL_MS && Object.keys(cache).length > 0) {
    return cache;
  }

  try {
    const rows = await Setting.findAll();
    const result = {};
    for (const r of rows) {
      result[r.key] = r.value;
    }
    cache = result;
    lastFetched = now;
    return cache;
  } catch (err) {
    console.error('Error fetching settings:', err);
    return cache; // fallback to stale cache
  }
}

async function getSetting(key, defaultValue = null) {
  const all = await getSettings();
  return all[key] !== undefined ? all[key] : defaultValue;
}

async function updateSetting(key, value, updatedBy = null) {
  await Setting.upsert({
    key,
    value: String(value),
    updated_by: updatedBy
  });
  cache[key] = String(value);
  lastFetched = Date.now();
}

function clearCache() {
  cache = {};
  lastFetched = 0;
}

module.exports = {
  getSettings,
  getSetting,
  updateSetting,
  clearCache
};


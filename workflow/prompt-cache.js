"use strict";

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

/**
 * Store prompt responses in a JSON file keyed by the prompt's SHA-256 hash.
 */
class PromptCache {
  /**
   * Create a prompt cache and ensure its storage file exists.
   *
   * @param {string} [cacheFilePath] Optional storage path, primarily for tests.
   */
  constructor(cacheFilePath = path.join(__dirname, "prompt-cache.json")) {
    if (typeof cacheFilePath !== "string" || cacheFilePath.trim() === "") {
      throw new TypeError("cacheFilePath must be a non-empty string.");
    }

    this.cacheFilePath = path.resolve(cacheFilePath);
    this._readCache();
  }

  /**
   * Get the cached response for a prompt.
   *
   * @param {string} prompt Prompt used as the cache key.
   * @returns {string|null} The cached response, or null when not found.
   */
  get(prompt) {
    this._requireString(prompt, "prompt");
    const cache = this._readCache();
    const entry = cache[this._hash(prompt)];
    return entry && entry.prompt === prompt ? entry.response : null;
  }

  /**
   * Save or replace the response for a prompt.
   *
   * @param {string} prompt Prompt used as the cache key.
   * @param {string} response Response to cache.
   * @returns {{prompt: string, response: string, timestamp: string}} Saved entry.
   */
  set(prompt, response) {
    this._requireString(prompt, "prompt");
    this._requireString(response, "response");

    const cache = this._readCache();
    const entry = {
      prompt,
      response,
      timestamp: new Date().toISOString(),
    };

    cache[this._hash(prompt)] = entry;
    this._writeCache(cache);
    return { ...entry };
  }

  /**
   * Check whether a response is cached for a prompt.
   *
   * @param {string} prompt Prompt used as the cache key.
   * @returns {boolean} True when the prompt has a cached response.
   */
  exists(prompt) {
    this._requireString(prompt, "prompt");
    const cache = this._readCache();
    const entry = cache[this._hash(prompt)];
    return Boolean(entry && entry.prompt === prompt);
  }

  /**
   * Remove the cached response for a prompt.
   *
   * @param {string} prompt Prompt used as the cache key.
   * @returns {boolean} True when an entry was removed.
   */
  remove(prompt) {
    this._requireString(prompt, "prompt");
    const cache = this._readCache();
    const hash = this._hash(prompt);
    const entry = cache[hash];

    if (!entry || entry.prompt !== prompt) {
      return false;
    }

    delete cache[hash];
    this._writeCache(cache);
    return true;
  }

  /**
   * Remove all cached responses.
   *
   * @returns {void}
   */
  clear() {
    this._writeCache({});
  }

  _hash(prompt) {
    return crypto.createHash("sha256").update(prompt, "utf8").digest("hex");
  }

  _readCache() {
    try {
      fs.mkdirSync(path.dirname(this.cacheFilePath), { recursive: true });
      if (!fs.existsSync(this.cacheFilePath)) {
        this._writeCache({});
      }

      const cache = JSON.parse(fs.readFileSync(this.cacheFilePath, "utf8"));
      if (!cache || typeof cache !== "object" || Array.isArray(cache)) {
        throw new TypeError("Prompt cache must contain a JSON object.");
      }

      for (const [hash, entry] of Object.entries(cache)) {
        if (
          !/^[a-f0-9]{64}$/.test(hash) ||
          !entry ||
          typeof entry !== "object" ||
          Array.isArray(entry) ||
          typeof entry.prompt !== "string" ||
          typeof entry.response !== "string" ||
          typeof entry.timestamp !== "string"
        ) {
          throw new TypeError(`Prompt cache entry "${hash}" is invalid.`);
        }
      }

      return cache;
    } catch (error) {
      this._logAndThrow("read prompt cache", error);
    }
  }

  _writeCache(cache) {
    try {
      fs.mkdirSync(path.dirname(this.cacheFilePath), { recursive: true });
      fs.writeFileSync(
        this.cacheFilePath,
        `${JSON.stringify(cache, null, 2)}\n`,
        "utf8"
      );
    } catch (error) {
      this._logAndThrow("write prompt cache", error);
    }
  }

  _requireString(value, name) {
    if (typeof value !== "string") {
      throw new TypeError(`${name} must be a string.`);
    }
  }

  _logAndThrow(action, error) {
    console.error(`Failed to ${action}: ${error.message}`);
    throw new Error(`Unable to ${action}: ${error.message}`);
  }
}

module.exports = PromptCache;

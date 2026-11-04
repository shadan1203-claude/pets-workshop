"use strict";

const assert = require("assert");
const crypto = require("crypto");
const fs = require("fs");
const os = require("os");
const path = require("path");
const PromptCache = require("./prompt-cache");

function withTemporaryCache(runTest) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "pets-prompt-cache-"));
  const cachePath = path.join(directory, "workflow", "prompt-cache.json");

  try {
    runTest(cachePath);
  } finally {
    fs.rmSync(directory, { recursive: true, force: true });
  }
}

function testCreatesCacheFileAndUsesSha256Keys() {
  withTemporaryCache((cachePath) => {
    const cache = new PromptCache(cachePath);
    assert.strictEqual(fs.existsSync(cachePath), true);
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(cachePath, "utf8")), {});

    const prompt = "Tell me about dogs";
    const saved = cache.set(prompt, "Dogs are great.");
    const hash = crypto.createHash("sha256").update(prompt, "utf8").digest("hex");
    const stored = JSON.parse(fs.readFileSync(cachePath, "utf8"));

    assert.deepStrictEqual(Object.keys(stored), [hash]);
    assert.deepStrictEqual(stored[hash], saved);
    assert.strictEqual(cache.get(prompt), "Dogs are great.");
    assert.strictEqual(cache.exists(prompt), true);
    assert.notStrictEqual(saved.timestamp, "");

    const reopened = new PromptCache(cachePath);
    assert.strictEqual(reopened.get(prompt), "Dogs are great.");
  });
}

function testRemovesAndClearsEntries() {
  withTemporaryCache((cachePath) => {
    const cache = new PromptCache(cachePath);
    cache.set("first", "one");
    cache.set("second", "two");

    assert.strictEqual(cache.remove("first"), true);
    assert.strictEqual(cache.remove("first"), false);
    assert.strictEqual(cache.get("first"), null);
    assert.strictEqual(cache.exists("second"), true);

    cache.clear();
    assert.deepStrictEqual(JSON.parse(fs.readFileSync(cachePath, "utf8")), {});
    assert.strictEqual(cache.exists("second"), false);
  });
}

function testRejectsInvalidArgumentsAndMalformedCache() {
  withTemporaryCache((cachePath) => {
    const cache = new PromptCache(cachePath);
    assert.throws(() => cache.get(null), /prompt must be a string/);
    assert.throws(() => cache.set("prompt", undefined), /response must be a string/);

    fs.writeFileSync(cachePath, "{ invalid json", "utf8");
    const originalError = console.error;
    console.error = () => {};
    try {
      assert.throws(() => cache.get("prompt"), /Unable to read prompt cache/);
    } finally {
      console.error = originalError;
    }
    assert.strictEqual(fs.readFileSync(cachePath, "utf8"), "{ invalid json");
  });
}

const tests = [
  testCreatesCacheFileAndUsesSha256Keys,
  testRemovesAndClearsEntries,
  testRejectsInvalidArgumentsAndMalformedCache,
];

for (const test of tests) {
  test();
  console.log(`PASS ${test.name}`);
}

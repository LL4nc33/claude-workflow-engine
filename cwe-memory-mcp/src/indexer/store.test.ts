import { describe, it, before, after } from "node:test";
import assert from "node:assert/strict";
import { Store } from "./store.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

describe("Store", () => {
  let store: Store;
  let dbDir: string;

  before(() => {
    dbDir = fs.mkdtempSync(path.join(os.tmpdir(), "cwe-store-test-"));
    store = new Store(dbDir, "test-project");
    store.init();
  });

  after(() => {
    store.close();
    fs.rmSync(dbDir, { recursive: true, force: true });
  });

  it("should create tables on init", () => {
    const tables = store.listTables();
    assert.ok(tables.includes("chunks"), "chunks table missing");
    assert.ok(tables.includes("files"), "files table missing");
    assert.ok(tables.includes("chunks_fts"), "chunks_fts table missing");
  });

  it("should upsert and retrieve chunks", () => {
    store.upsertChunks("memory/MEMORY.md", [
      {
        id: "chunk-1",
        text: "This is a test chunk about authentication patterns",
        startLine: 1,
        endLine: 10,
        hash: "abc123",
        embedding: new Float32Array(384).fill(0.1),
      },
    ]);
    const chunks = store.getChunksByPath("memory/MEMORY.md");
    assert.equal(chunks.length, 1);
    assert.equal(chunks[0].text, "This is a test chunk about authentication patterns");
  });

  it("should delete chunks by path", () => {
    store.upsertChunks("memory/old.md", [
      {
        id: "old-1",
        text: "Old content",
        startLine: 1,
        endLine: 5,
        hash: "old123",
        embedding: new Float32Array(384).fill(0.2),
      },
    ]);
    assert.equal(store.getChunksByPath("memory/old.md").length, 1);
    store.deleteChunksByPath("memory/old.md");
    assert.equal(store.getChunksByPath("memory/old.md").length, 0);
  });

  it("should search FTS5 with BM25", () => {
    store.upsertChunks("memory/patterns.md", [
      {
        id: "fts-1",
        text: "Authentication uses JWT tokens for session management",
        startLine: 1,
        endLine: 5,
        hash: "fts1",
        embedding: new Float32Array(384).fill(0.3),
      },
      {
        id: "fts-2",
        text: "Docker containers run in kubernetes pods",
        startLine: 6,
        endLine: 10,
        hash: "fts2",
        embedding: new Float32Array(384).fill(0.4),
      },
    ]);
    const results = store.searchBM25("authentication JWT", 5);
    assert.ok(results.length > 0, "BM25 should return results");
    assert.equal(results[0].id, "fts-1");
  });

  it("should track files", () => {
    store.upsertFile("memory/MEMORY.md", "hash1", 1000, 500);
    const file = store.getFile("memory/MEMORY.md");
    assert.ok(file, "file should exist");
    assert.equal(file!.hash, "hash1");
  });

  it("should search vectors with KNN", () => {
    const queryVec = new Float32Array(384).fill(0.1);
    const results = store.searchVector(queryVec, 5);
    assert.ok(Array.isArray(results));
  });
});

import Database from "better-sqlite3";
import * as sqliteVec from "sqlite-vec";
import path from "node:path";
import fs from "node:fs";

export interface ChunkInput {
  id: string;
  text: string;
  startLine: number;
  endLine: number;
  hash: string;
  embedding: Float32Array;
}

export interface ChunkRow {
  id: string;
  path: string;
  text: string;
  start_line: number;
  end_line: number;
  hash: string;
  updated_at: number;
}

export interface FileRow {
  path: string;
  hash: string;
  mtime: number;
  size: number;
}

export interface BM25Result {
  id: string;
  rank: number;
}

export interface VectorResult {
  id: string;
  distance: number;
}

export class Store {
  private db: Database.Database | null = null;
  private dbPath: string;
  private vectorEnabled = false;

  constructor(dbDir: string, projectSlug: string) {
    fs.mkdirSync(dbDir, { recursive: true });
    this.dbPath = path.join(dbDir, `${projectSlug}.sqlite`);
  }

  init(): void {
    this.db = new Database(this.dbPath);
    this.db.pragma("journal_mode = WAL");
    this.db.pragma("foreign_keys = ON");

    // Try to load sqlite-vec extension
    try {
      sqliteVec.load(this.db);
      this.vectorEnabled = true;
    } catch {
      console.error("[cwe-memory] sqlite-vec not available, vector search disabled");
      this.vectorEnabled = false;
    }

    this.createTables();
  }

  private createTables(): void {
    const db = this.getDb();

    db.exec(`
      CREATE TABLE IF NOT EXISTS chunks (
        id TEXT PRIMARY KEY,
        path TEXT NOT NULL,
        text TEXT NOT NULL,
        start_line INTEGER NOT NULL,
        end_line INTEGER NOT NULL,
        hash TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_chunks_path ON chunks(path);

      CREATE TABLE IF NOT EXISTS files (
        path TEXT PRIMARY KEY,
        hash TEXT NOT NULL,
        mtime INTEGER NOT NULL,
        size INTEGER NOT NULL
      );
    `);

    // FTS5 virtual table
    db.exec(`
      CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
        text, id UNINDEXED, path UNINDEXED
      );
    `);

    // Vector table (only if sqlite-vec loaded)
    if (this.vectorEnabled) {
      try {
        db.exec(`
          CREATE VIRTUAL TABLE IF NOT EXISTS chunks_vec USING vec0(
            id TEXT PRIMARY KEY,
            embedding float[384] distance_metric=cosine
          );
        `);
      } catch {
        console.error("[cwe-memory] Failed to create vector table");
        this.vectorEnabled = false;
      }
    }
  }

  private getDb(): Database.Database {
    if (!this.db) throw new Error("Store not initialized. Call init() first.");
    return this.db;
  }

  listTables(): string[] {
    const db = this.getDb();
    const rows = db.prepare(
      "SELECT name FROM sqlite_master WHERE type IN ('table', 'view') ORDER BY name"
    ).all() as Array<{ name: string }>;
    return rows.map((r) => r.name);
  }

  upsertChunks(filePath: string, chunks: ChunkInput[]): void {
    const db = this.getDb();
    const now = Date.now();

    const upsertChunk = db.prepare(`
      INSERT OR REPLACE INTO chunks (id, path, text, start_line, end_line, hash, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const transaction = db.transaction(() => {
      for (const chunk of chunks) {
        upsertChunk.run(chunk.id, filePath, chunk.text, chunk.startLine, chunk.endLine, chunk.hash, now);

        // FTS: delete old entry first, then insert
        db.prepare("DELETE FROM chunks_fts WHERE id = ?").run(chunk.id);
        db.prepare(
          "INSERT INTO chunks_fts (text, id, path) VALUES (?, ?, ?)"
        ).run(chunk.text, chunk.id, filePath);

        if (this.vectorEnabled) {
          db.prepare("DELETE FROM chunks_vec WHERE id = ?").run(chunk.id);
          db.prepare(
            "INSERT INTO chunks_vec (id, embedding) VALUES (?, ?)"
          ).run(chunk.id, Buffer.from(chunk.embedding.buffer));
        }
      }
    });

    transaction();
  }

  getChunksByPath(filePath: string): ChunkRow[] {
    const db = this.getDb();
    return db.prepare("SELECT * FROM chunks WHERE path = ?").all(filePath) as ChunkRow[];
  }

  getChunkById(id: string): ChunkRow | undefined {
    const db = this.getDb();
    return db.prepare("SELECT * FROM chunks WHERE id = ?").get(id) as ChunkRow | undefined;
  }

  deleteChunksByPath(filePath: string): void {
    const db = this.getDb();
    const chunkIds = db
      .prepare("SELECT id FROM chunks WHERE path = ?")
      .all(filePath) as Array<{ id: string }>;

    const transaction = db.transaction(() => {
      for (const { id } of chunkIds) {
        db.prepare("DELETE FROM chunks_fts WHERE id = ?").run(id);
        if (this.vectorEnabled) {
          db.prepare("DELETE FROM chunks_vec WHERE id = ?").run(id);
        }
      }
      db.prepare("DELETE FROM chunks WHERE path = ?").run(filePath);
    });

    transaction();
  }

  searchBM25(query: string, limit: number): BM25Result[] {
    const db = this.getDb();
    return db
      .prepare(
        `SELECT id, rank FROM chunks_fts WHERE text MATCH ? ORDER BY rank LIMIT ?`
      )
      .all(query, limit) as BM25Result[];
  }

  searchVector(queryVec: Float32Array, limit: number): VectorResult[] {
    if (!this.vectorEnabled) return [];
    const db = this.getDb();
    return db
      .prepare(
        `SELECT id, distance FROM chunks_vec WHERE embedding MATCH ? AND k = ?`
      )
      .all(Buffer.from(queryVec.buffer), limit) as VectorResult[];
  }

  upsertFile(filePath: string, hash: string, mtime: number, size: number): void {
    const db = this.getDb();
    db.prepare(
      `INSERT OR REPLACE INTO files (path, hash, mtime, size) VALUES (?, ?, ?, ?)`
    ).run(filePath, hash, mtime, size);
  }

  getFile(filePath: string): FileRow | undefined {
    const db = this.getDb();
    return db.prepare("SELECT * FROM files WHERE path = ?").get(filePath) as FileRow | undefined;
  }

  getAllFiles(): FileRow[] {
    const db = this.getDb();
    return db.prepare("SELECT * FROM files").all() as FileRow[];
  }

  deleteFile(filePath: string): void {
    const db = this.getDb();
    db.prepare("DELETE FROM files WHERE path = ?").run(filePath);
  }

  getStats(): { chunks: number; files: number; dbSizeBytes: number; vectorEnabled: boolean; ftsEnabled: boolean } {
    const db = this.getDb();
    const chunksCount = (db.prepare("SELECT COUNT(*) as count FROM chunks").get() as { count: number }).count;
    const filesCount = (db.prepare("SELECT COUNT(*) as count FROM files").get() as { count: number }).count;
    const stat = fs.statSync(this.dbPath);
    return {
      chunks: chunksCount,
      files: filesCount,
      dbSizeBytes: stat.size,
      vectorEnabled: this.vectorEnabled,
      ftsEnabled: true,
    };
  }

  isVectorEnabled(): boolean {
    return this.vectorEnabled;
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  destroy(): void {
    this.close();
    if (fs.existsSync(this.dbPath)) {
      fs.unlinkSync(this.dbPath);
    }
  }
}

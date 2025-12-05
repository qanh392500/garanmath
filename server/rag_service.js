// server/rag_service.js
import { KNOWLEDGE_BASE } from './knowledge_base.js';
import db from './database.js';

// Simple cosine similarity function
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    if (magA === 0 || magB === 0) return 0;
    return dotProduct / (magA * magB);
}

export class RAGService {
    constructor() {
        this.vectorDB = [];
        this.isInitialized = false;
    }

    async load() {
        console.log("⏳ Loading RAG Knowledge Base from DB...");
        try {
            const rows = await new Promise((resolve, reject) => {
                db.all("SELECT * FROM knowledge_vectors", (err, rows) => {
                    if (err) reject(err);
                    else resolve(rows || []);
                });
            });

            this.vectorDB = rows.map(row => ({
                info: { cmd: row.cmd, desc: row.desc, ex: row.ex },
                vec: JSON.parse(row.embedding)
            }));

            this.isInitialized = true;
            console.log(`✅ RAG Knowledge Base loaded with ${this.vectorDB.length} items.`);
        } catch (error) {
            console.error("❌ Failed to load RAG:", error);
        }
    }

    async sync(aiClient) {
        if (!aiClient) {
            console.warn("⚠️ Cannot sync RAG without API Client");
            return;
        }
        console.log("🔄 Syncing RAG Database...");

        const existingRows = await new Promise((resolve, reject) => {
            db.all("SELECT * FROM knowledge_vectors", (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });

        const existingCmds = new Map(existingRows.map(r => [r.cmd, r]));
        const kbCmds = new Set(KNOWLEDGE_BASE.map(k => k.cmd));

        // 1. Identify Missing (In KB, not in DB)
        const missingItems = KNOWLEDGE_BASE.filter(item => !existingCmds.has(item.cmd));

        // 2. Identify Obsolete (In DB, not in KB)
        const obsoleteItems = existingRows.filter(row => !kbCmds.has(row.cmd));

        // 3. Identify Changed (In both, but desc/ex changed)
        const changedItems = KNOWLEDGE_BASE.filter(item => {
            const existing = existingCmds.get(item.cmd);
            if (!existing) return false;
            return existing.desc !== item.desc || existing.ex !== item.ex;
        });

        console.log(`🔄 Sync Status: ${missingItems.length} new, ${obsoleteItems.length} obsolete, ${changedItems.length} changed.`);

        // 4. Remove Obsolete
        if (obsoleteItems.length > 0) {
            console.log(`🗑️ Removing ${obsoleteItems.length} obsolete items...`);
            for (const item of obsoleteItems) {
                await new Promise((resolve) => {
                    db.run("DELETE FROM knowledge_vectors WHERE cmd = ?", [item.cmd], resolve);
                });
            }
        }

        // 5. Add Missing & Update Changed
        const itemsToProcess = [...missingItems, ...changedItems];

        if (itemsToProcess.length > 0) {
            console.log(`⚡ Generating embeddings for ${itemsToProcess.length} items...`);
            for (const item of itemsToProcess) {
                try {
                    const text = `${item.desc} ${item.cmd}`;
                    const result = await aiClient.models.embedContent({
                        model: 'text-embedding-004',
                        contents: [{ parts: [{ text: text }] }],
                    });
                    const embedding = result.embeddings[0].values;

                    await new Promise((resolve, reject) => {
                        db.run(
                            `INSERT OR REPLACE INTO knowledge_vectors (cmd, desc, ex, embedding) VALUES (?, ?, ?, ?)`,
                            [item.cmd, item.desc, item.ex, JSON.stringify(embedding)],
                            (err) => {
                                if (err) reject(err);
                                else resolve();
                            }
                        );
                    });

                    // Small delay to avoid rate limits
                    await new Promise(resolve => setTimeout(resolve, 200));
                } catch (err) {
                    console.error(`❌ Failed to embed item: ${item.cmd}`, err.message);
                }
            }
        }

        // Reload after sync to update memory
        await this.load();
    }

    async search(query, aiClient, topK = 3) {
        if (!this.isInitialized) await this.load();
        if (!aiClient) return [];

        try {
            const result = await aiClient.models.embedContent({
                model: 'text-embedding-004',
                contents: [{ parts: [{ text: query }] }],
            });
            const queryVec = result.embeddings[0].values;

            const scores = this.vectorDB.map(item => ({
                score: cosineSimilarity(queryVec, item.vec),
                info: item.info
            }));

            scores.sort((a, b) => b.score - a.score);
            return scores.slice(0, topK).map(s => s.info);
        } catch (error) {
            console.error("⚠️ RAG Search Error:", error);
            return [];
        }
    }

    async searchBatch(queries, aiClient, topK = 1) {
        if (!this.isInitialized) await this.load();
        if (!aiClient || !queries || queries.length === 0) return [];

        try {
            const promises = queries.map(q => aiClient.models.embedContent({
                model: 'text-embedding-004',
                contents: [{ parts: [{ text: q }] }],
            }));

            const results = await Promise.all(promises);

            return results.map(result => {
                const queryVec = result.embeddings[0].values;
                const scores = this.vectorDB.map(item => ({
                    score: cosineSimilarity(queryVec, item.vec),
                    info: item.info
                }));
                scores.sort((a, b) => b.score - a.score);
                return scores.slice(0, topK).map(s => s.info);
            }).flat();

        } catch (error) {
            console.error("⚠️ RAG Batch Search Error:", error);
            return [];
        }
    }
}

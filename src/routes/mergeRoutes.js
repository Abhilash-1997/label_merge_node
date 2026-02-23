const express = require("express");
const multer = require("multer");
const { merge } = require("../services/pdfMergeService");
const logger = require("../logger");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/**
 * POST /api/merge
 * Accepts multiple PDF files under the field name "files",
 * merges them onto A4 pages (2×2 grid), and returns the result.
 */
router.post("/merge", upload.array("files"), async (req, res) => {
    try {
        const files = req.files;

        if (!files || files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }

        logger.info("Merge API called");
        logger.info(`Number of files received: ${files.length}`);

        const start = Date.now();

        const fileBuffers = files.map((f) => f.buffer);
        const pdfBuffer = await merge(fileBuffers);

        const elapsed = Date.now() - start;
        logger.info(
            `PDF generated successfully, size=${pdfBuffer.length} bytes, time=${elapsed} ms`
        );

        res.set({
            "Content-Type": "application/pdf",
            "Content-Disposition": 'attachment; filename="labels_A4.pdf"',
            "Content-Length": pdfBuffer.length,
        });

        return res.send(pdfBuffer);
    } catch (err) {
        logger.error("Merge failed", { error: err.message, stack: err.stack });
        return res.status(500).json({ error: "Failed to merge PDFs" });
    }
});

/**
 * GET /api/health
 */
router.get("/health", (_req, res) => {
    res.send("OK");
});

module.exports = router;

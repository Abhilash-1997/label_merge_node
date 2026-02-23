const { PDFDocument, rgb } = require("pdf-lib");

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const COLUMNS = 2;
const ROWS = 2;
const MARGIN = 20;
const GAP = 10;
const LABELS_PER_PAGE = COLUMNS * ROWS;

const USABLE_WIDTH = A4_WIDTH - 2 * MARGIN - GAP;
const USABLE_HEIGHT = A4_HEIGHT - 2 * MARGIN - GAP;
const CELL_WIDTH = USABLE_WIDTH / COLUMNS;
const CELL_HEIGHT = USABLE_HEIGHT / ROWS;

/**
 * Draw vertical and horizontal cut lines on a page.
 */
function drawCutLines(page) {
  const midX = A4_WIDTH / 2;
  const midY = A4_HEIGHT / 2;

  // Vertical cut line
  page.drawLine({
    start: { x: midX, y: MARGIN },
    end: { x: midX, y: A4_HEIGHT - MARGIN },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });

  // Horizontal cut line
  page.drawLine({
    start: { x: MARGIN, y: midY },
    end: { x: A4_WIDTH - MARGIN, y: midY },
    thickness: 0.5,
    color: rgb(0, 0, 0),
  });
}

/**
 * Merge multiple PDF label files onto A4 pages in a 2×2 grid.
 * @param {Buffer[]} fileBuffers - Array of PDF file buffers
 * @returns {Promise<Buffer>} - The merged PDF as a Buffer
 */
async function merge(fileBuffers) {
  const output = await PDFDocument.create();

  let page = null;
  let slot = 0;

  for (const buffer of fileBuffers) {
    // Start a new A4 page every 4 labels
    if (slot % LABELS_PER_PAGE === 0) {
      page = output.addPage([A4_WIDTH, A4_HEIGHT]);
      drawCutLines(page);
    }

    const srcDoc = await PDFDocument.load(buffer);
    const [embeddedPage] = await output.embedPdf(srcDoc, [0]);

    const srcWidth = embeddedPage.width;
    const srcHeight = embeddedPage.height;

    const index = slot % LABELS_PER_PAGE;
    const row = Math.floor(index / COLUMNS);
    const col = index % COLUMNS;

    const x = MARGIN + col * (CELL_WIDTH + GAP);
    const y =
      A4_HEIGHT - MARGIN - (row + 1) * CELL_HEIGHT - row * GAP;

    const scale = Math.min(
      CELL_WIDTH / srcWidth,
      CELL_HEIGHT / srcHeight
    );

    page.drawPage(embeddedPage, {
      x,
      y,
      xScale: scale,
      yScale: scale,
    });

    slot++;
  }

  const pdfBytes = await output.save();
  return Buffer.from(pdfBytes);
}

module.exports = { merge };

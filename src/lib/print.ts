/**
 * Universal Printing Utility for SIAK Desa
 * Handles direct hardware printing and standalone print documents.
 */

export interface PrintOptions {
  title?: string;
  orientation?: "portrait" | "landscape";
  pageSize?: "A4" | "Legal" | "Letter";
  margin?: string;
}

/**
 * Builds standalone self-contained printable HTML document string with full styling
 */
export function buildPrintableHtml(elementId: string, options: PrintOptions = {}): string | null {
  const sourceEl = document.getElementById(elementId);
  if (!sourceEl) return null;

  const {
    title = "Dokumen SIAK Desa",
    orientation = "portrait",
    pageSize = "A4",
    margin = "10mm"
  } = options;

  let stylesHtml = "";
  document.querySelectorAll("style, link[rel='stylesheet']").forEach((node) => {
    stylesHtml += node.outerHTML;
  });

  const contentHtml = sourceEl.innerHTML;

  return `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    ${stylesHtml}
    <style>
      @page {
        size: ${pageSize} ${orientation};
        margin: ${margin};
      }
      *, *::before, *::after {
        box-sizing: border-box;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
        visibility: visible !important;
      }
      html, body {
        background-color: #ffffff !important;
        color: #000000 !important;
        margin: 0 !important;
        padding: 16px !important;
        font-family: Arial, "Helvetica Neue", Helvetica, sans-serif !important;
        font-size: 11pt;
        line-height: 1.4;
        visibility: visible !important;
        -webkit-font-smoothing: antialiased;
      }
      /* Force ALL text to solid pure black */
      body, p, span, h1, h2, h3, h4, h5, h6, th, td, div, b, strong, em, i, a, li, label, dt, dd {
        color: #000000 !important;
      }
      a {
        color: #000000 !important;
        text-decoration: underline !important;
      }
      .no-print, .no-print * {
        display: none !important;
        visibility: hidden !important;
      }
      .print-content-container, .print-content-container * {
        visibility: visible !important;
        color: #000000 !important;
      }
      table, th, td, hr, .border, .border-b, .border-t, .border-l, .border-r, .border-b-4, .border-b-2 {
        border-color: #000000 !important;
      }
      table {
        width: 100% !important;
        border-collapse: collapse !important;
        page-break-inside: auto;
      }
      tr {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
      }
      thead {
        display: table-header-group;
      }
      tfoot {
        display: table-footer-group;
      }
      th, td {
        border: 1px solid #000000 !important;
        padding: 4px 6px !important;
        color: #000000 !important;
      }
      th {
        background-color: #f1f5f9 !important;
        font-weight: 700 !important;
        color: #000000 !important;
      }
      .signature-box, .signatures-row, .signature-block {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        color: #000000 !important;
      }
      .grid {
        display: grid !important;
      }
      .grid-cols-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
      }
      .grid-cols-3 {
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      }
      .gap-3 { gap: 0.75rem !important; }
      .gap-4 { gap: 1rem !important; }
      .gap-8 { gap: 2rem !important; }
      .standalone-toolbar {
        position: sticky;
        top: 0;
        left: 0;
        right: 0;
        z-index: 99999;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        background: #0f172a;
        color: #ffffff;
        padding: 12px 20px;
        border-radius: 10px;
        margin-bottom: 20px;
        box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3);
      }
      .standalone-toolbar button {
        cursor: pointer;
        font-weight: 600;
        font-size: 13px;
        padding: 8px 18px;
        border-radius: 8px;
        border: none;
        transition: all 0.15s ease;
      }
      .standalone-toolbar .btn-print {
        background: #059669;
        color: white;
      }
      .standalone-toolbar .btn-print:hover {
        background: #047857;
      }
      .standalone-toolbar .btn-close {
        background: #334155;
        color: #e2e8f0;
      }
      .standalone-toolbar .btn-close:hover {
        background: #475569;
      }
      @media print {
        .standalone-toolbar, .standalone-toolbar * {
          display: none !important;
          visibility: hidden !important;
        }
        body {
          padding: 0 !important;
          margin: 0 !important;
        }
      }
    </style>
  </head>
  <body>
    <div class="standalone-toolbar no-print">
      <div style="font-size: 13px; font-weight: bold;">
        📄 ${title}
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn-print" onclick="window.print()">🖨️ Cetak / Simpan PDF</button>
        <button class="btn-close" onclick="window.close()">Tutup Tab</button>
      </div>
    </div>
    <div class="print-content-container">
      ${contentHtml}
    </div>
    <script>
      window.addEventListener('load', function() {
        setTimeout(function() {
          try {
            window.focus();
            window.print();
          } catch(e) {
            console.error('Print trigger error:', e);
          }
        }, 500);
      });
    </script>
  </body>
</html>`;
}

/**
 * Open printable document in a dedicated new tab with standalone Blob URL
 */
export function openPrintWindow(elementId: string, options: PrintOptions = {}): boolean {
  const html = buildPrintableHtml(elementId, options);
  if (!html) {
    window.print();
    return false;
  }

  try {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const newTab = window.open(url, "_blank");
    if (newTab) {
      newTab.focus();
      return true;
    }
  } catch (err) {
    console.warn("Could not open blob print window, fallback to in-page print:", err);
  }
  return false;
}

/**
 * Direct in-page hardware print with complete DOM isolation
 * Guarantees zero dark background artifacts, no blank pages, and instant printer dialog.
 */
export function printElementById(elementId: string, options: PrintOptions = {}): Promise<boolean> {
  return new Promise((resolve) => {
    const sourceEl = document.getElementById(elementId);
    if (!sourceEl) {
      console.warn(`Print target #${elementId} not found, invoking window.print()`);
      window.print();
      resolve(false);
      return;
    }

    // 1. Get or create #print-mount-root attached directly to <body>
    let printRoot = document.getElementById("print-mount-root");
    if (!printRoot) {
      printRoot = document.createElement("div");
      printRoot.id = "print-mount-root";
      document.body.appendChild(printRoot);
    }

    // 2. Clone the printable sheet DOM tree into #print-mount-root
    printRoot.innerHTML = "";
    const clonedNode = sourceEl.cloneNode(true) as HTMLElement;
    // Remove duplicate ID to avoid DOM collisions
    clonedNode.removeAttribute("id");
    printRoot.appendChild(clonedNode);

    // 3. Set title for print filename
    const originalTitle = document.title;
    if (options.title) {
      document.title = options.title;
    }

    // 4. Activate printing CSS mode on body
    document.body.classList.add("is-printing-active");

    // 5. Cleanup handler
    let isCleanedUp = false;
    const cleanup = () => {
      if (isCleanedUp) return;
      isCleanedUp = true;
      document.body.classList.remove("is-printing-active");
      if (printRoot) {
        printRoot.innerHTML = "";
      }
      document.title = originalTitle;
      window.removeEventListener("afterprint", cleanup);
      resolve(true);
    };

    window.addEventListener("afterprint", cleanup);

    // 6. Wait for layout & image rendering, then trigger print dialog
    setTimeout(() => {
      try {
        window.focus();
        window.print();
      } catch (err) {
        console.error("Direct print error:", err);
      } finally {
        // Fallback cleanup in case afterprint does not fire in some browsers/iframes
        setTimeout(cleanup, 2500);
      }
    }, 200);
  });
}

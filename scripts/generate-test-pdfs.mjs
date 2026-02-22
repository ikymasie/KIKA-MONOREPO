#!/usr/bin/env node
/**
 * KIKA Test Case PDF Generator
 * Converts all markdown test case docs to styled PDFs using md-to-pdf.
 *
 * Run: node scripts/generate-test-pdfs.mjs
 */

import { mdToPdf } from 'md-to-pdf';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const INPUT_BASE = path.join(ROOT, 'Testing Docs');
const OUTPUT_BASE = path.join(ROOT, 'Testing Docs PDF');

// Custom CSS for a professional, branded look
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 10.5pt;
    line-height: 1.7;
    color: #1e293b;
    background: #fff;
  }

  /* ── Page header accent ── */
  body::before {
    content: '';
    display: block;
    height: 5px;
    background: linear-gradient(90deg, #0ea5e9, #8b5cf6, #ec4899);
    margin-bottom: 24px;
    border-radius: 0 0 3px 3px;
  }

  /* ── Headings ── */
  h1 {
    font-size: 20pt;
    font-weight: 700;
    color: #0f172a;
    border-bottom: 2px solid #0ea5e9;
    padding-bottom: 10px;
    margin: 24px 0 6px;
    letter-spacing: -0.3px;
  }
  h2 {
    font-size: 14pt;
    font-weight: 600;
    color: #1e40af;
    margin: 22px 0 8px;
    padding: 6px 10px;
    background: #eff6ff;
    border-left: 4px solid #3b82f6;
    border-radius: 0 4px 4px 0;
  }
  h3 {
    font-size: 10.5pt;
    font-weight: 600;
    color: #0f172a;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-left: 4px solid #0ea5e9;
    padding: 8px 12px;
    border-radius: 0 6px 6px 0;
    margin: 18px 0 6px;
  }
  h4 { font-size: 10pt; font-weight: 600; color: #475569; margin: 12px 0 4px; }

  /* ── Paragraph & intro ── */
  p { margin: 6px 0 10px; color: #334155; }

  /* ── Horizontal rule ── */
  hr {
    border: none;
    border-top: 1px solid #e2e8f0;
    margin: 20px 0;
  }

  /* ── Tables ── */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 10px 0 16px;
    font-size: 9.5pt;
    page-break-inside: avoid;
  }
  thead tr {
    background: #1e40af;
    color: #fff;
  }
  thead th {
    padding: 8px 12px;
    text-align: left;
    font-weight: 600;
    letter-spacing: 0.3px;
  }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody tr:nth-child(odd)  { background: #fff; }
  tbody td {
    padding: 7px 12px;
    border-bottom: 1px solid #e2e8f0;
    vertical-align: top;
  }
  /* First column (Field label) styling */
  tbody td:first-child {
    font-weight: 600;
    color: #1e40af;
    white-space: nowrap;
    width: 160px;
  }

  /* ── Code / inline code ── */
  code {
    font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace;
    font-size: 8.5pt;
    background: #f1f5f9;
    color: #be185d;
    padding: 1px 5px;
    border-radius: 3px;
    border: 1px solid #e2e8f0;
  }
  pre {
    background: #0f172a;
    color: #e2e8f0;
    padding: 14px 16px;
    border-radius: 6px;
    font-size: 8.5pt;
    overflow: auto;
    margin: 10px 0;
  }
  pre code {
    background: transparent;
    color: inherit;
    border: none;
    padding: 0;
  }

  /* ── Lists ── */
  ul, ol { padding-left: 22px; margin: 6px 0 10px; }
  li { margin: 3px 0; color: #334155; }

  /* ── Status badge coloring in tables ── */
  td:last-child { color: #374151; }

  /* ── Scope / intro block ── */
  blockquote {
    background: #fefce8;
    border-left: 4px solid #eab308;
    padding: 10px 14px;
    border-radius: 0 6px 6px 0;
    margin: 10px 0;
    font-size: 9.5pt;
    color: #713f12;
  }

  /* ── Sign-off table special styling ── */
  h2:last-of-type + table thead tr { background: #0f172a; }

  /* ── Page numbering ── */
  @page {
    margin: 15mm 16mm 20mm 16mm;
    @bottom-center {
      content: 'KIKA Platform — Confidential  |  Page ' counter(page) ' of ' counter(pages);
      font-family: 'Inter', sans-serif;
      font-size: 8pt;
      color: #94a3b8;
    }
    @top-right {
      content: 'Testing & Sign-Off Document';
      font-family: 'Inter', sans-serif;
      font-size: 8pt;
      color: #94a3b8;
    }
  }

  /* ── Avoid page breaks inside test case tables ── */
  h3, table { page-break-inside: avoid; }
`;

// Collect all .md files recursively, preserving sub-folder structure
function collectMdFiles(dir, base = dir) {
    const results = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            results.push(...collectMdFiles(full, base));
        } else if (entry.name.endsWith('.md')) {
            results.push({ full, rel: path.relative(base, full) });
        }
    }
    return results;
}

async function run() {
    const files = collectMdFiles(INPUT_BASE);
    console.log(`\n📄  Found ${files.length} markdown files to convert\n`);

    let ok = 0; let fail = 0;

    for (const { full, rel } of files) {
        const outRel = rel.replace(/\.md$/, '.pdf');
        const outFull = path.join(OUTPUT_BASE, outRel);
        fs.mkdirSync(path.dirname(outFull), { recursive: true });

        try {
            await mdToPdf(
                { path: full },
                {
                    dest: outFull,
                    css: CSS,
                    pdf_options: {
                        format: 'A4',
                        printBackground: true,
                        margin: { top: '15mm', right: '16mm', bottom: '20mm', left: '16mm' },
                        displayHeaderFooter: true,
                        headerTemplate: `
              <div style="width:100%;display:flex;justify-content:space-between;align-items:center;padding:0 16mm;font-family:Inter,-apple-system,sans-serif;font-size:8pt;color:#94a3b8;border-bottom:1px solid #e2e8f0;">
                <span style="font-weight:600;color:#1e40af;">KIKA</span>
                <span>Testing &amp; Sign-Off Document</span>
              </div>`,
                        footerTemplate: `
              <div style="width:100%;display:flex;justify-content:space-between;align-items:center;padding:0 16mm;font-family:Inter,-apple-system,sans-serif;font-size:8pt;color:#94a3b8;border-top:1px solid #e2e8f0;">
                <span>Confidential — Internal Use Only</span>
                <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
              </div>`,
                    },
                    launch_options: { args: ['--no-sandbox', '--disable-setuid-sandbox'] },
                }
            );
            console.log(`  ✅  ${rel}`);
            ok++;
        } catch (err) {
            console.error(`  ❌  ${rel} — ${err.message}`);
            fail++;
        }
    }

    console.log(`\n${'─'.repeat(55)}`);
    console.log(`  Done: ${ok} PDFs generated, ${fail} failed`);
    console.log(`  Output: ${OUTPUT_BASE}\n`);
}

run().catch(err => { console.error(err); process.exit(1); });

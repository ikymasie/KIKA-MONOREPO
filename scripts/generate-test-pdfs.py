#!/usr/bin/env python3
"""
KIKA — Generate Test Case PDFs
Converts all markdown test docs to PDFs using npx md-to-pdf CLI.
Run: python3 scripts/generate-test-pdfs.py
"""

import os, subprocess, sys, shutil, tempfile
from pathlib import Path

ROOT    = Path(__file__).parent.parent.resolve()
SRC     = ROOT / "Testing Docs"
OUT     = ROOT / "Testing Docs PDF"

CSS = """
* { box-sizing: border-box; }
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 10.5pt; line-height: 1.7; color: #1e293b; padding: 0 2mm;
}
h1 {
  font-size: 18pt; font-weight: 700; color: #0f172a;
  border-bottom: 3px solid #0ea5e9; padding-bottom: 8px; margin: 16px 0 4px;
}
h2 {
  font-size: 12pt; font-weight: 600; color: #1e40af;
  padding: 5px 10px; background: #eff6ff;
  border-left: 4px solid #3b82f6; margin: 20px 0 6px; border-radius: 0 4px 4px 0;
}
h3 {
  font-size: 10pt; font-weight: 600; background: #f8fafc;
  border: 1px solid #e2e8f0; border-left: 4px solid #0ea5e9;
  padding: 6px 10px; margin: 14px 0 4px; border-radius: 0 4px 4px 0;
}
p { margin: 4px 0 8px; color: #334155; }
hr { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
table {
  width: 100%; border-collapse: collapse; margin: 6px 0 14px;
  font-size: 9pt; page-break-inside: avoid;
}
thead tr { background: #1e3a8a; color: #fff; }
thead th { padding: 7px 10px; text-align: left; font-weight: 600; }
tbody tr:nth-child(even) { background: #f8fafc; }
tbody td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
tbody td:first-child { font-weight: 600; color: #1e40af; width: 155px; white-space: nowrap; }
code {
  font-size: 8.5pt; background: #f1f5f9; color: #be185d;
  padding: 1px 4px; border-radius: 3px;
}
ul, ol { padding-left: 20px; margin: 4px 0 8px; }
li { margin: 2px 0; color: #334155; }
h3, table { page-break-inside: avoid; }
"""

def main():
    print(f"\n📄  KIKA Test Case PDF Generator")
    print(f"   Source : {SRC}")
    print(f"   Output : {OUT}\n")

    # Write temp CSS file
    css_file = tempfile.NamedTemporaryFile(suffix=".css", delete=False, mode="w")
    css_file.write(CSS)
    css_file.close()

    md_files = sorted(SRC.rglob("*.md"))
    ok = 0; fail = 0

    for mdfile in md_files:
        rel = mdfile.relative_to(SRC)
        out_pdf = OUT / rel.with_suffix(".pdf")
        out_pdf.parent.mkdir(parents=True, exist_ok=True)

        # md-to-pdf puts the PDF next to the source .md
        expected_pdf = mdfile.with_suffix(".pdf")

        try:
            result = subprocess.run(
                ["npx", "md-to-pdf", "--stylesheet", css_file.name, str(mdfile)],
                capture_output=True, text=True, timeout=60
            )
            if result.returncode == 0 and expected_pdf.exists():
                shutil.move(str(expected_pdf), str(out_pdf))
                print(f"  ✅  {rel}")
                ok += 1
            else:
                print(f"  ❌  {rel}")
                if result.stderr: print(f"       {result.stderr.strip()[:120]}")
                fail += 1
        except subprocess.TimeoutExpired:
            print(f"  ⏱️   TIMEOUT: {rel}")
            fail += 1
        except Exception as e:
            print(f"  ❌  ERROR: {rel} — {e}")
            fail += 1

    os.unlink(css_file.name)

    print(f"\n{'─'*50}")
    print(f"  ✅  {ok} PDFs generated")
    if fail: print(f"  ❌  {fail} failed")
    print(f"  📁  {OUT}\n")
    sys.exit(0 if fail == 0 else 1)

if __name__ == "__main__":
    main()

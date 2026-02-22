#!/usr/bin/env bash
# KIKA — Generate Test Case PDFs
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/Testing Docs"
OUT="$ROOT/Testing Docs PDF"

CSS=$(mktemp /tmp/kika.XXXXXX.css)
cat > "$CSS" << 'EOF'
* { box-sizing: border-box; }
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; font-size: 10.5pt; line-height: 1.7; color: #1e293b; padding: 0 2mm; }
h1 { font-size: 18pt; font-weight: 700; color: #0f172a; border-bottom: 3px solid #0ea5e9; padding-bottom: 8px; margin: 16px 0 4px; }
h2 { font-size: 12pt; font-weight: 600; color: #1e40af; padding: 5px 10px; background: #eff6ff; border-left: 4px solid #3b82f6; margin: 20px 0 6px; border-radius: 0 4px 4px 0; }
h3 { font-size: 10pt; font-weight: 600; background: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #0ea5e9; padding: 6px 10px; margin: 14px 0 4px; border-radius: 0 4px 4px 0; }
p { margin: 4px 0 8px; color: #334155; }
hr { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
table { width: 100%; border-collapse: collapse; margin: 6px 0 14px; font-size: 9pt; page-break-inside: avoid; }
thead tr { background: #1e3a8a; color: #fff; }
thead th { padding: 7px 10px; text-align: left; font-weight: 600; }
tbody tr:nth-child(even) { background: #f8fafc; }
tbody td { padding: 6px 10px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
tbody td:first-child { font-weight: 600; color: #1e40af; width: 155px; white-space: nowrap; }
code { font-size: 8.5pt; background: #f1f5f9; color: #be185d; padding: 1px 4px; border-radius: 3px; }
ul, ol { padding-left: 20px; margin: 4px 0 8px; }
li { margin: 2px 0; color: #334155; }
h3, table { page-break-inside: avoid; }
EOF

ok=0; fail=0

echo ""
echo "📄  KIKA Test Case PDF Generator"
echo "   Source : $SRC"
echo "   Output : $OUT"
echo ""

# Collect all .md files into an array BEFORE the loop (avoids stdin consumption issue)
mapfile -d '' FILES < <(find "$SRC" -name "*.md" -print0 | sort -z)

for mdfile in "${FILES[@]}"; do
  rel="${mdfile#"$SRC/"}"
  outfile="$OUT/${rel%.md}.pdf"
  outdir="$(dirname "$outfile")"
  mkdir -p "$outdir"
  default_pdf="${mdfile%.md}.pdf"

  # Close stdin for npx so it can't consume the loop's stdin
  if npx md-to-pdf --stylesheet "$CSS" "$mdfile" < /dev/null > /dev/null 2>&1 && [ -f "$default_pdf" ]; then
    mv "$default_pdf" "$outfile"
    echo "  ✅  $rel"
    ok=$((ok + 1))
  else
    echo "  ❌  FAILED: $rel"
    fail=$((fail + 1))
  fi
done

rm -f "$CSS"

echo ""
echo "──────────────────────────────────────────────────"
echo "  ✅  $ok PDFs generated"
if [ "$fail" -gt 0 ]; then echo "  ❌  $fail failed"; fi
echo "  📁  $OUT"
echo ""

const fs = require('fs');
const path = require('path');

const dir = '/Users/ikymasie/Documents/GitHub/KIKA/src/entities';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.ts'));
let changed = 0;

files.forEach(f => {
    const fp = path.join(dir, f);
    const original = fs.readFileSync(fp, 'utf8');
    const updated = original.replace(/([a-zA-Z_][a-zA-Z0-9_]*)!:/g, '$1?:');
    if (original !== updated) {
        fs.writeFileSync(fp, updated);
        changed++;
        console.log(' Modified:', f);
    }
});

console.log('\nDone. Files modified:', changed, '/', files.length);

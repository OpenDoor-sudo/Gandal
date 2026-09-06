const fs = require('fs');
const code = fs.readFileSync('antigravity_labs/omni_graph_engine/lib/jsxgraphcore.js', 'utf8');

const matches = [...code.matchAll(/createFunctiongraph\s*[:=]\s*function\s*\(([^)]*)\)/g)];
console.log('Matches:', matches.length);
for (const m of matches) {
  console.log('Match index:', m.index);
  console.log(code.substring(m.index, m.index + 500));
}

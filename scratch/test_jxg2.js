const fs = require('fs');
const code = fs.readFileSync('antigravity_labs/omni_graph_engine/lib/jsxgraphcore.js', 'utf8');

// Find Curve definition or functiongraph handling in Curve
const pos = code.indexOf('curvetype==="functiongraph"');
const pos2 = code.indexOf("curvetype === 'functiongraph'");
const p = pos !== -1 ? pos : pos2;
console.log('curvetype pos:', p);

// Let's search for "functiongraph" in the codebase
const regex = /["']functiongraph["']/g;
let match;
while ((match = regex.exec(code)) !== null) {
  console.log('Occur at:', match.index, code.substring(match.index - 50, match.index + 150));
}

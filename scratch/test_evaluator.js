function evaluateGraphFunction(x, expressionStr) {
    try {
        let expr = expressionStr.trim();
        expr = expr.replace(/\^/g, '**');
        if (/[^a-z0-9+\-*/().,\s]/i.test(expr.replace(/math\.[a-z]+/gi, ''))) {
            return null;
        }
        expr = expr.replace(/\bsin\b/gi, 'Math.sin')
                   .replace(/\bcos\b/gi, 'Math.cos')
                   .replace(/\btan\b/gi, 'Math.tan')
                   .replace(/\bsqrt\b/gi, 'Math.sqrt')
                   .replace(/\babs\b/gi, 'Math.abs')
                   .replace(/\bpow\b/gi, 'Math.pow')
                   .replace(/\bpi\b/gi, 'Math.PI')
                   .replace(/\be\b/gi, 'Math.E')
                   .replace(/\bln\b/gi, 'Math.log')
                   .replace(/\blog\b/gi, 'Math.log10');

        const evaluator = new Function('x', `try { return (${expr}); } catch(e) { return null; }`);
        const val = evaluator(x);
        return (typeof val === 'number' && !isNaN(val) && isFinite(val)) ? val : null;
    } catch (e) {
        return null;
    }
}

function cleanTextForSpeech(text) {
    if (!text) return "";
    let clean = text;

    // Verbalize common calculus math expressions
    clean = clean.replace(/\\begin\{(?:p|b|v|V)?matrix\}/g, " matrix: ");
    clean = clean.replace(/\\end\{(?:p|b|v|V)?matrix\}/g, " end matrix ");
    clean = clean.replace(/\\\\/g, ", next row, ");
    clean = clean.replace(/&/g, " and ");
    clean = clean.replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, " the integral from $1 to $2 of ");
    clean = clean.replace(/\\int/g, " the integral of ");
    clean = clean.replace(/\\lim_\{([^}]+)\\to\s*([^}]+)\}/g, " the limit as $1 approaches $2 of ");
    clean = clean.replace(/\\lim/g, " the limit ");
    clean = clean.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, " $1 over $2 ");
    clean = clean.replace(/\\sqrt\{([^}]+)\}/g, " the square root of $1 ");
    clean = clean.replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, " the sum from $1 to $2 of ");
    clean = clean.replace(/\\sum/g, " the sum of ");
    clean = clean.replace(/\\to/g, " approaches ");
    clean = clean.replace(/\\infty/g, " infinity ");
    clean = clean.replace(/\\pi/g, " pi ");
    clean = clean.replace(/\\theta/g, " theta ");
    clean = clean.replace(/\\cdot/g, " times ");
    clean = clean.replace(/\\le/g, " less than or equal to ");
    clean = clean.replace(/\\ge/g, " greater than or equal to ");
    clean = clean.replace(/\\neq/g, " not equal to ");
    clean = clean.replace(/f\(x\)/g, " f of x ");
    clean = clean.replace(/g\(x\)/g, " g of x ");
    clean = clean.replace(/dx/g, " d x ");
    clean = clean.replace(/dy/g, " d y ");

    // Strip brackets and LaTeX syntax markers
    clean = clean.replace(/\$\$/g, "");
    clean = clean.replace(/\$/g, "");
    clean = clean.replace(/\\/g, "");
    clean = clean.replace(/[{}[\]]/g, ""); // Strip curly braces and square brackets
    clean = clean.replace(/[_^]/g, " ");   // Strip subscript/superscript markers

    // Remove double spaces
    clean = clean.replace(/\s+/g, " ").trim();
    return clean;
}

// 1. Math Evaluator Tests
const evalTestCases = [
    { expr: "x^2", x: 2, expected: 4 },
    { expr: "x^2", x: -3, expected: 9 },
    { expr: "x^3 - 3*x", x: 2, expected: 2 },
    { expr: "sin(pi/2)", x: 0, expected: 1 },
    { expr: "cos(pi)", x: 0, expected: -1 }
];

let allPassed = true;
for (const tc of evalTestCases) {
    const actual = evaluateGraphFunction(tc.x, tc.expr);
    const diff = Math.abs(actual - tc.expected);
    if (diff > 1e-9 || actual === null) {
        console.error(`FAILED Graph Eval: expr="${tc.expr}", x=${tc.x} -> expected=${tc.expected}, got=${actual}`);
        allPassed = false;
    } else {
        console.log(`PASSED Graph Eval: expr="${tc.expr}", x=${tc.x} -> got=${actual}`);
    }
}

// 2. Speech Cleaner Tests
const speechTestCases = [
    {
        input: "The matrix is \\begin{pmatrix} 1 & 2 \\\\ 3 & 4 \\end{pmatrix}",
        expected: "The matrix is matrix: 1 and 2 , next row, 3 and 4 end matrix"
    },
    {
        input: "Evaluate \\lim_{x \\to 0} \\frac{f(x)}{x}",
        expected: "Evaluate the limit as x approaches 0 of f of x over x"
    }
];

for (const tc of speechTestCases) {
    const actual = cleanTextForSpeech(tc.input);
    if (actual !== tc.expected) {
        console.error(`FAILED Speech Clean:\n  Input: "${tc.input}"\n  Expected: "${tc.expected}"\n  Got:      "${actual}"`);
        allPassed = false;
    } else {
        console.log(`PASSED Speech Clean:\n  Input: "${tc.input}"\n  Got:   "${actual}"`);
    }
}

if (allPassed) {
    console.log("\nAll evaluateGraphFunction and cleanTextForSpeech test cases passed successfully!");
} else {
    process.exit(1);
}

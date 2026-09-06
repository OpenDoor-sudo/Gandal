/**
 * MathParser - High-performance Expression Parser & Variable Detector
 * Safely parses, tokenizes, and evaluates mathematical expressions in the browser
 */
export class MathParser {
  static RESERVED_WORDS = new Set([
    "x", "y", "t", "theta", "r",
    "sin", "cos", "tan", "asin", "acos", "atan",
    "sinh", "cosh", "tanh",
    "sqrt", "cbrt", "abs", "floor", "ceil", "round",
    "log", "ln", "log10", "log2", "exp",
    "pi", "e", "inf", "infinity"
  ]);

  /**
   * Identifies all variable parameters in an equation (e.g. 'a', 'b', 'k' in 'a*x^2 + b*sin(k*x)')
   */
  static extractVariables(expression) {
    if (!expression || typeof expression !== "string") return [];

    // Strip out standard equations prefix like 'y = ', 'f(x) = '
    let cleaned = expression.replace(/^[a-zA-Z]\s*\([a-zA-Z\s,]*\)\s*=\s*/, "");
    cleaned = cleaned.replace(/^[yY]\s*=\s*/, "");

    // Regex to match words/identifiers
    const identifierRegex = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/g;
    const matches = cleaned.match(identifierRegex) || [];

    const foundVars = new Set();
    for (const token of matches) {
      const lower = token.toLowerCase();
      if (!this.RESERVED_WORDS.has(lower)) {
        foundVars.add(token);
      }
    }

    return Array.from(foundVars).sort();
  }

  /**
   * Cleans and normalizes raw OCR text or LaTeX math strings into valid graphing expressions
   */
  static cleanOcrFormula(rawText) {
    if (!rawText || typeof rawText !== "string") return "";
    let str = rawText.trim();

    // Remove excess line breaks and spaces
    str = str.replace(/\r?\n|\r/g, " ").replace(/\s+/g, " ");

    // Remove standard LaTeX delimiters if present: $, $$, \(, \), \[, \]
    str = str.replace(/^\$+|\$+$/g, "").replace(/^\\\(|\\\)$/g, "").replace(/^\\\[|\\\]$/g, "");

    // Unicode superscripts to standard carat exponent
    str = str.replace(/[²]/g, "^2")
             .replace(/[³]/g, "^3")
             .replace(/[⁴]/g, "^4")
             .replace(/[⁵]/g, "^5")
             .replace(/[⁶]/g, "^6")
             .replace(/[⁷]/g, "^7")
             .replace(/[⁸]/g, "^8")
             .replace(/[⁹]/g, "^9")
             .replace(/[⁰]/g, "^0")
             .replace(/[⁻]/g, "^-")
             .replace(/[⁺]/g, "^+");

    // Unicode math symbols
    str = str.replace(/[≤⩽]/g, "<=")
             .replace(/[≥⩾]/g, ">=")
             .replace(/[≠]/g, "!=")
             .replace(/[×✕]/g, "*")
             .replace(/[÷]/g, "/")
             .replace(/[πΠ]/g, "pi")
             .replace(/[−–—]/g, "-");

    // LaTeX command translations
    str = str.replace(/\\left\s*/g, "")
             .replace(/\\right\s*/g, "")
             .replace(/\\sin\b/g, "sin")
             .replace(/\\cos\b/g, "cos")
             .replace(/\\tan\b/g, "tan")
             .replace(/\\sqrt\s*\{([^}]+)\}/g, "sqrt($1)")
             .replace(/\\frac\s*\{([^}]+)\}\s*\{([^}]+)\}/g, "($1)/($2)")
             .replace(/\\cdot/g, "*")
             .replace(/\\times/g, "*")
             .replace(/\\le\b/g, "<=")
             .replace(/\\ge\b/g, ">=")
             .replace(/\\pi\b/g, "pi")
             .replace(/\\theta\b/g, "theta")
             .replace(/\^\{([^}]+)\}/g, "^($1)");

    // Fix typical OCR space errors around exponents (e.g. 'x 2' -> 'x^2', 'x 3' -> 'x^3')
    str = str.replace(/\bx\s+2\b/g, "x^2");
    str = str.replace(/\bx\s+3\b/g, "x^3");

    // Standardize inequalities with equals
    str = str.replace(/<\s*=/g, "<=");
    str = str.replace(/>\s*=/g, ">=");

    // Strip leading "y =" or "f(x) =" for standard explicit functions, but keep for inequalities or implicit curves
    if (!str.includes("<") && !str.includes(">") && !str.includes("=") && !str.startsWith("area")) {
      str = str.replace(/^[a-zA-Z]\s*\([a-zA-Z\s,]*\)\s*=\s*/, "").replace(/^[yY]\s*=\s*/, "");
    }

    return str.trim();
  }

  /**
   * Splits multi-formula queries (e.g. 'sin(x), cos(x)' or 'y = 2x+1; y = -x+3')
   * without splitting on commas within parentheses or brackets like '(3, 4)'.
   */
  static splitExpressions(rawStr) {
    if (!rawStr || typeof rawStr !== "string") return [];
    const results = [];
    let current = "";
    let depthParen = 0;
    let depthBracket = 0;

    for (let i = 0; i < rawStr.length; i++) {
      const char = rawStr[i];
      if (char === "(") depthParen++;
      else if (char === ")") depthParen = Math.max(0, depthParen - 1);
      else if (char === "[") depthBracket++;
      else if (char === "]") depthBracket = Math.max(0, depthBracket - 1);

      if ((char === "," || char === ";" || char === "\n") && depthParen === 0 && depthBracket === 0) {
        const trimmed = current.trim();
        if (trimmed) results.push(trimmed);
        current = "";
      } else {
        current += char;
      }
    }

    const trimmed = current.trim();
    if (trimmed) results.push(trimmed);
    return results;
  }

  /**
   * Intelligently decomposes both symbolic expressions (a*x^2 + b) and concrete formulas (3x + 5, 2sin(2x))
   * into interactive parameter sliders (e.g. m=3, b=5; A=2, k=2).
   */
  static decomposeFormula(expr, suffix = "") {
    if (!expr || typeof expr !== "string") {
      return { formula: "0", variables: [], initialParams: {} };
    }

    let cleaned = expr.trim().replace(/^[a-zA-Z]\s*\([a-zA-Z\s,]*\)\s*=\s*/, "").replace(/^[yY]\s*=\s*/, "");
    const explicitVars = this.extractVariables(cleaned);

    // 1. If user already included symbolic parameters (e.g. 'a*x^2 + b*x + c', 'm*x + b')
    if (explicitVars.length > 0) {
      const initialParams = {};
      for (const v of explicitVars) {
        initialParams[v] = (v.startsWith("a") ? 1 : (v.startsWith("b") ? 0 : (v.startsWith("c") ? -4 : (v.startsWith("m") ? 1 : 1))));
      }
      return {
        formula: expr,
        variables: explicitVars,
        initialParams,
        isDecomposed: false
      };
    }

    const noSpace = cleaned.replace(/\s+/g, "");
    const varM = `m${suffix}`;
    const varB = `b${suffix}`;
    const varA = `a${suffix}`;
    const varC = `c${suffix}`;
    const varK = `k${suffix}`;
    const varAmp = `A${suffix}`;
    const varShift = `C${suffix}`;

    // 2. Concrete Linear: e.g. "3x + 5", "3*x - 2", "-x + 4", "x"
    const linearMatch = noSpace.match(/^([+-]?[\d.]*)?\*?x([+-][\d.]+)?$/i);
    if (linearMatch) {
      let mStr = linearMatch[1];
      let m = 1;
      if (mStr === "-" || mStr === "-1") m = -1;
      else if (mStr === "+" || mStr === "" || mStr === undefined) m = 1;
      else m = parseFloat(mStr);

      let b = linearMatch[2] ? parseFloat(linearMatch[2]) : 0;
      return {
        formula: `${varM}*x + ${varB}`,
        variables: [varM, varB],
        initialParams: { [varM]: m, [varB]: b },
        isDecomposed: true
      };
    }

    // 3. Concrete Quadratic: e.g. "2x^2 + 3x - 4", "x^2 - 4"
    const quadMatch = noSpace.match(/^([+-]?[\d.]*)?\*?x\^2(([+-][\d.]*)\*?x)?([+-][\d.]+)?$/i);
    if (quadMatch) {
      let aStr = quadMatch[1];
      let a = (aStr === "-" ? -1 : (aStr === "" || aStr === undefined ? 1 : parseFloat(aStr)));
      let bStr = quadMatch[3];
      let b = 0;
      if (bStr !== undefined) {
        b = (bStr === "+" || bStr === "" ? 1 : (bStr === "-" ? -1 : parseFloat(bStr)));
      }
      let c = quadMatch[4] ? parseFloat(quadMatch[4]) : 0;
      return {
        formula: `${varA}*x^2 + ${varB}*x + ${varC}`,
        variables: [varA, varB, varC],
        initialParams: { [varA]: a, [varB]: b, [varC]: c },
        isDecomposed: true
      };
    }

    // 4. Concrete Trigonometric: e.g. "2sin(2x)", "sin(x)", "3*cos(4x) + 1", "tan(0.5x)"
    const trigMatch = noSpace.match(/^([+-]?[\d.]*)?\*?(sin|cos|tan)\(?([+-]?[\d.]*)?\*?x([+-][\d.]+)?\)?([+-][\d.]+)?$/i);
    if (trigMatch) {
      let aStr = trigMatch[1];
      let A = 1;
      if (aStr === "-") A = -1;
      else if (aStr && aStr !== "+") A = parseFloat(aStr);

      const fn = trigMatch[2].toLowerCase();

      let kStr = trigMatch[3];
      let k = 1;
      if (kStr === "-") k = -1;
      else if (kStr && kStr !== "+") k = parseFloat(kStr);

      let C = trigMatch[5] ? parseFloat(trigMatch[5]) : 0;
      return {
        formula: `${varAmp}*${fn}(${varK}*x) + ${varShift}`,
        variables: [varAmp, varK, varShift],
        initialParams: { [varAmp]: A, [varK]: k, [varShift]: C },
        isDecomposed: true
      };
    }

    // 5. Concrete Rational: e.g. "1/x", "4/x", "-2/x"
    const ratMatch = noSpace.match(/^([+-]?[\d.]+)\/x$/i);
    if (ratMatch) {
      const k = parseFloat(ratMatch[1]);
      return {
        formula: `${varK}/x`,
        variables: [varK],
        initialParams: { [varK]: k },
        isDecomposed: true
      };
    }

    // 6. Universal Interactive Fallback: Ensure parameters NEVER disappear for any mathematical formula
    // Provides scale 'a' and vertical translation 'c' (e.g. a*f(x) + c)
    return {
      formula: `${varA}*(${cleaned}) + ${varC}`,
      variables: [varA, varC],
      initialParams: { [varA]: 1, [varC]: 0 },
      isDecomposed: true
    };
  }

  /**
   * Sanitizes and transforms standard math notation into valid JavaScript Math functions
   * e.g., '2x' -> '2*x', 'x^2' -> 'Math.pow(x,2)', 'sin(x)' -> 'Math.sin(x)', 'pi' -> 'Math.PI'
   */
  static normalizeExpression(rawExpr) {
    if (!rawExpr || typeof rawExpr !== "string") return "0";

    let expr = rawExpr.trim();

    // Remove 'y = ' or 'f(x) = '
    expr = expr.replace(/^[a-zA-Z]\s*\([a-zA-Z\s,]*\)\s*=\s*/, "");
    expr = expr.replace(/^[yY]\s*=\s*/, "");

    // Replace implicit multiplication: '2x' -> '2*x', '3(' -> '3*(', ')x' -> ')*x', ')(' -> ')*('
    expr = expr.replace(/(\d)([a-zA-Z_(])/g, "$1*$2");
    expr = expr.replace(/(\))([a-zA-Z0-9_(])/g, "$1*$2");
    expr = expr.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)\s*(\()/g, (m, p1, p2) => {
      const lower = p1.toLowerCase();
      if (this.RESERVED_WORDS.has(lower)) return m;
      return `${p1}*${p2}`;
    });

    // Replace constants
    expr = expr.replace(/\bpi\b/gi, "Math.PI");
    expr = expr.replace(/\be\b/g, "Math.E");

    // Replace power operator '^' with Math.pow() safely without infinite loops
    let safetyCounter = 0;
    while (expr.includes("^") && safetyCounter < 10) {
      safetyCounter++;
      const prev = expr;
      expr = expr.replace(/([a-zA-Z0-9_.]+|\([^\(\)]+\))\s*\^\s*([a-zA-Z0-9_.]+|\([^\(\)]+\))/, "Math.pow($1, $2)");
      if (expr === prev) {
        // Incomplete expression during typing (e.g. "x^"), strip trailing '^' to prevent syntax lock
        expr = expr.replace(/\^.*$/, "");
        break;
      }
    }

    // Replace common functions
    const mathFuncs = ["sin", "cos", "tan", "asin", "acos", "atan", "sinh", "cosh", "tanh", "sqrt", "cbrt", "abs", "floor", "ceil", "round", "exp"];
    for (const f of mathFuncs) {
      const reg = new RegExp(`\\b${f}\\s*\\(`, "gi");
      expr = expr.replace(reg, `Math.${f}(`);
    }

    // Logarithms
    expr = expr.replace(/\bln\s*\(/gi, "Math.log(");
    expr = expr.replace(/\blog\s*\(/gi, "Math.log10(");
    expr = expr.replace(/\blog10\s*\(/gi, "Math.log10(");
    expr = expr.replace(/\blog2\s*\(/gi, "Math.log2(");

    return expr;
  }

  /**
   * Compiles an expression into a callable Javascript function: (x, params) => number
   */
  static compileFunction(rawExpr) {
    const normalized = this.normalizeExpression(rawExpr);
    const variables = this.extractVariables(rawExpr);

    try {
      // Create function that takes (x, params = {})
      const fn = new Function("x", "params", `
        params = params || {};
        ${variables.map(v => `const ${v} = params['${v}'] !== undefined ? params['${v}'] : 1;`).join("\n")}
        try {
          const val = ${normalized};
          return isFinite(val) ? val : NaN;
        } catch(e) {
          return NaN;
        }
      `);

      // Pre-evaluate test sample to verify valid syntax
      const testVal = fn(1, {});
      const isValid = !isNaN(testVal) || isFinite(testVal);

      return { fn, variables, normalized, success: isValid };
    } catch (err) {
      return {
        fn: () => NaN,
        variables: [],
        normalized,
        success: false,
        error: err.message
      };
    }
  }

  /**
   * Classify input type: 'point', 'vector', 'explicit', 'implicit_circle', 'parametric', 'linear_eq'
   */
  static classifyInput(inputStr) {
    const str = (inputStr || "").trim();

    // Point: (x, y) or P = (x, y)
    const pointMatch = str.match(/^[a-zA-Z]?\s*=?\s*\(\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)$/);
    if (pointMatch) {
      return {
        type: "point",
        x: parseFloat(pointMatch[1]),
        y: parseFloat(pointMatch[2])
      };
    }

    // Vector: [x, y] or v = [x, y]
    const vecMatch = str.match(/^[a-zA-Z]?\s*=?\s*\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]$/);
    if (vecMatch) {
      return {
        type: "vector",
        x: parseFloat(vecMatch[1]),
        y: parseFloat(vecMatch[2])
      };
    }

    // Circle Inequality: x^2 + y^2 <= 25, x^2 + y^2 >= 16
    if (str.includes("x^2") && str.includes("y^2") && /(<=|>=|<|>)/.test(str)) {
      const op = str.match(/(<=|>=|<|>)/)[0];
      const match = str.match(/(?:<=|>=|<|>)\s*([\d.]+)/);
      const r2 = match ? parseFloat(match[1]) : 25;
      return {
        type: "circle_inequality",
        op,
        r: Math.sqrt(Math.max(0.1, r2)),
        raw: str
      };
    }

    // Circle: x^2 + y^2 = r^2 or (x-h)^2 + (y-k)^2 = r^2
    if (str.includes("x^2") && str.includes("y^2") && str.includes("=")) {
      return { type: "implicit_conic", raw: str };
    }

    // Definite Integral / Area under curve: area(f(x), a, b) or integral(f(x), a, b)
    const areaMatch = str.match(/^(?:area|integral|int)\s*\(\s*(.+?)\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)$/i);
    if (areaMatch) {
      return {
        type: "integral",
        baseExpr: areaMatch[1].trim(),
        a: parseFloat(areaMatch[2]),
        b: parseFloat(areaMatch[3]),
        raw: str
      };
    }

    // Standard Inequality: y <= f(x), y < f(x), y >= f(x), y > f(x)
    const ineqMatch = str.match(/^[yY]\s*(<=|>=|<|>)\s*(.+)$/);
    if (ineqMatch) {
      return {
        type: "inequality",
        op: ineqMatch[1],
        baseExpr: ineqMatch[2].trim(),
        raw: str
      };
    }

    // Flipped Inequality: f(x) >= y
    const revIneqMatch = str.match(/^(.+?)\s*(<=|>=|<|>)\s*[yY]$/);
    if (revIneqMatch) {
      const origOp = revIneqMatch[2];
      const flippedOp = origOp === "<=" ? ">=" : (origOp === ">=" ? "<=" : (origOp === "<" ? ">" : "<"));
      return {
        type: "inequality",
        op: flippedOp,
        baseExpr: revIneqMatch[1].trim(),
        raw: str
      };
    }

    // Standard explicit function y = f(x)
    return { type: "explicit", raw: str };
  }
}

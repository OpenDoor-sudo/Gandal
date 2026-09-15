import { n as __toESM, t as __commonJSMin } from "./rolldown-runtime-FDOR9p9I.js";
//#region core/sdk-ref.ts
var ref = null;
/** @internal 仅供 AvatarSDK 在自身模块求值时回填。 */
function setSDKRef(sdk) {
	ref = sdk;
}
/** @internal */
function requireSDK() {
	if (!ref) throw new Error("[AvatarKit] AvatarSDK module has not been evaluated");
	return ref;
}
//#endregion
//#region node_modules/.pnpm/stackframe@1.3.4/node_modules/stackframe/stackframe.js
var require_stackframe = /* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory) {
		"use strict";
		/* istanbul ignore next */
		if (typeof define === "function" && define.amd) define("stackframe", [], factory);
		else if (typeof exports === "object") module.exports = factory();
		else root.StackFrame = factory();
	})(exports, function() {
		"use strict";
		function _isNumber(n) {
			return !isNaN(parseFloat(n)) && isFinite(n);
		}
		function _capitalize(str) {
			return str.charAt(0).toUpperCase() + str.substring(1);
		}
		function _getter(p) {
			return function() {
				return this[p];
			};
		}
		var booleanProps = [
			"isConstructor",
			"isEval",
			"isNative",
			"isToplevel"
		];
		var numericProps = ["columnNumber", "lineNumber"];
		var stringProps = [
			"fileName",
			"functionName",
			"source"
		];
		var props = booleanProps.concat(numericProps, stringProps, ["args"], ["evalOrigin"]);
		function StackFrame(obj) {
			if (!obj) return;
			for (var i = 0; i < props.length; i++) if (obj[props[i]] !== void 0) this["set" + _capitalize(props[i])](obj[props[i]]);
		}
		StackFrame.prototype = {
			getArgs: function() {
				return this.args;
			},
			setArgs: function(v) {
				if (Object.prototype.toString.call(v) !== "[object Array]") throw new TypeError("Args must be an Array");
				this.args = v;
			},
			getEvalOrigin: function() {
				return this.evalOrigin;
			},
			setEvalOrigin: function(v) {
				if (v instanceof StackFrame) this.evalOrigin = v;
				else if (v instanceof Object) this.evalOrigin = new StackFrame(v);
				else throw new TypeError("Eval Origin must be an Object or StackFrame");
			},
			toString: function() {
				var fileName = this.getFileName() || "";
				var lineNumber = this.getLineNumber() || "";
				var columnNumber = this.getColumnNumber() || "";
				var functionName = this.getFunctionName() || "";
				if (this.getIsEval()) {
					if (fileName) return "[eval] (" + fileName + ":" + lineNumber + ":" + columnNumber + ")";
					return "[eval]:" + lineNumber + ":" + columnNumber;
				}
				if (functionName) return functionName + " (" + fileName + ":" + lineNumber + ":" + columnNumber + ")";
				return fileName + ":" + lineNumber + ":" + columnNumber;
			}
		};
		StackFrame.fromString = function StackFrame$$fromString(str) {
			var argsStartIndex = str.indexOf("(");
			var argsEndIndex = str.lastIndexOf(")");
			var functionName = str.substring(0, argsStartIndex);
			var args = str.substring(argsStartIndex + 1, argsEndIndex).split(",");
			var locationString = str.substring(argsEndIndex + 1);
			if (locationString.indexOf("@") === 0) {
				var parts = /@(.+?)(?::(\d+))?(?::(\d+))?$/.exec(locationString, "");
				var fileName = parts[1];
				var lineNumber = parts[2];
				var columnNumber = parts[3];
			}
			return new StackFrame({
				functionName,
				args: args || void 0,
				fileName,
				lineNumber: lineNumber || void 0,
				columnNumber: columnNumber || void 0
			});
		};
		for (var i = 0; i < booleanProps.length; i++) {
			StackFrame.prototype["get" + _capitalize(booleanProps[i])] = _getter(booleanProps[i]);
			StackFrame.prototype["set" + _capitalize(booleanProps[i])] = (function(p) {
				return function(v) {
					this[p] = Boolean(v);
				};
			})(booleanProps[i]);
		}
		for (var j = 0; j < numericProps.length; j++) {
			StackFrame.prototype["get" + _capitalize(numericProps[j])] = _getter(numericProps[j]);
			StackFrame.prototype["set" + _capitalize(numericProps[j])] = (function(p) {
				return function(v) {
					if (!_isNumber(v)) throw new TypeError(p + " must be a Number");
					this[p] = Number(v);
				};
			})(numericProps[j]);
		}
		for (var k = 0; k < stringProps.length; k++) {
			StackFrame.prototype["get" + _capitalize(stringProps[k])] = _getter(stringProps[k]);
			StackFrame.prototype["set" + _capitalize(stringProps[k])] = (function(p) {
				return function(v) {
					this[p] = String(v);
				};
			})(stringProps[k]);
		}
		return StackFrame;
	});
}));
//#endregion
//#region node_modules/.pnpm/pathe@2.0.3/node_modules/pathe/dist/shared/pathe.M-eThtNZ.mjs
var import_error_stack_parser = /* @__PURE__ */ __toESM((/* @__PURE__ */ __commonJSMin(((exports, module) => {
	(function(root, factory) {
		"use strict";
		/* istanbul ignore next */
		if (typeof define === "function" && define.amd) define("error-stack-parser", ["stackframe"], factory);
		else if (typeof exports === "object") module.exports = factory(require_stackframe());
		else root.ErrorStackParser = factory(root.StackFrame);
	})(exports, function ErrorStackParser(StackFrame) {
		"use strict";
		var FIREFOX_SAFARI_STACK_REGEXP = /(^|@)\S+:\d+/;
		var CHROME_IE_STACK_REGEXP = /^\s*at .*(\S+:\d+|\(native\))/m;
		var SAFARI_NATIVE_CODE_REGEXP = /^(eval@)?(\[native code])?$/;
		return {
			/**
			* Given an Error object, extract the most information from it.
			*
			* @param {Error} error object
			* @return {Array} of StackFrames
			*/
			parse: function ErrorStackParser$$parse(error) {
				if (typeof error.stacktrace !== "undefined" || typeof error["opera#sourceloc"] !== "undefined") return this.parseOpera(error);
				else if (error.stack && error.stack.match(CHROME_IE_STACK_REGEXP)) return this.parseV8OrIE(error);
				else if (error.stack) return this.parseFFOrSafari(error);
				else throw new Error("Cannot parse given Error object");
			},
			extractLocation: function ErrorStackParser$$extractLocation(urlLike) {
				if (urlLike.indexOf(":") === -1) return [urlLike];
				var parts = /(.+?)(?::(\d+))?(?::(\d+))?$/.exec(urlLike.replace(/[()]/g, ""));
				return [
					parts[1],
					parts[2] || void 0,
					parts[3] || void 0
				];
			},
			parseV8OrIE: function ErrorStackParser$$parseV8OrIE(error) {
				return error.stack.split("\n").filter(function(line) {
					return !!line.match(CHROME_IE_STACK_REGEXP);
				}, this).map(function(line) {
					if (line.indexOf("(eval ") > -1) line = line.replace(/eval code/g, "eval").replace(/(\(eval at [^()]*)|(,.*$)/g, "");
					var sanitizedLine = line.replace(/^\s+/, "").replace(/\(eval code/g, "(").replace(/^.*?\s+/, "");
					var location = sanitizedLine.match(/ (\(.+\)$)/);
					sanitizedLine = location ? sanitizedLine.replace(location[0], "") : sanitizedLine;
					var locationParts = this.extractLocation(location ? location[1] : sanitizedLine);
					return new StackFrame({
						functionName: location && sanitizedLine || void 0,
						fileName: ["eval", "<anonymous>"].indexOf(locationParts[0]) > -1 ? void 0 : locationParts[0],
						lineNumber: locationParts[1],
						columnNumber: locationParts[2],
						source: line
					});
				}, this);
			},
			parseFFOrSafari: function ErrorStackParser$$parseFFOrSafari(error) {
				return error.stack.split("\n").filter(function(line) {
					return !line.match(SAFARI_NATIVE_CODE_REGEXP);
				}, this).map(function(line) {
					if (line.indexOf(" > eval") > -1) line = line.replace(/ line (\d+)(?: > eval line \d+)* > eval:\d+:\d+/g, ":$1");
					if (line.indexOf("@") === -1 && line.indexOf(":") === -1) return new StackFrame({ functionName: line });
					else {
						var functionNameRegex = /((.*".+"[^@]*)?[^@]*)(?:@)/;
						var matches = line.match(functionNameRegex);
						var functionName = matches && matches[1] ? matches[1] : void 0;
						var locationParts = this.extractLocation(line.replace(functionNameRegex, ""));
						return new StackFrame({
							functionName,
							fileName: locationParts[0],
							lineNumber: locationParts[1],
							columnNumber: locationParts[2],
							source: line
						});
					}
				}, this);
			},
			parseOpera: function ErrorStackParser$$parseOpera(e) {
				if (!e.stacktrace || e.message.indexOf("\n") > -1 && e.message.split("\n").length > e.stacktrace.split("\n").length) return this.parseOpera9(e);
				else if (!e.stack) return this.parseOpera10(e);
				else return this.parseOpera11(e);
			},
			parseOpera9: function ErrorStackParser$$parseOpera9(e) {
				var lineRE = /Line (\d+).*script (?:in )?(\S+)/i;
				var lines = e.message.split("\n");
				var result = [];
				for (var i = 2, len = lines.length; i < len; i += 2) {
					var match = lineRE.exec(lines[i]);
					if (match) result.push(new StackFrame({
						fileName: match[2],
						lineNumber: match[1],
						source: lines[i]
					}));
				}
				return result;
			},
			parseOpera10: function ErrorStackParser$$parseOpera10(e) {
				var lineRE = /Line (\d+).*script (?:in )?(\S+)(?:: In function (\S+))?$/i;
				var lines = e.stacktrace.split("\n");
				var result = [];
				for (var i = 0, len = lines.length; i < len; i += 2) {
					var match = lineRE.exec(lines[i]);
					if (match) result.push(new StackFrame({
						functionName: match[3] || void 0,
						fileName: match[2],
						lineNumber: match[1],
						source: lines[i]
					}));
				}
				return result;
			},
			parseOpera11: function ErrorStackParser$$parseOpera11(error) {
				return error.stack.split("\n").filter(function(line) {
					return !!line.match(FIREFOX_SAFARI_STACK_REGEXP) && !line.match(/^Error created at/);
				}, this).map(function(line) {
					var tokens = line.split("@");
					var locationParts = this.extractLocation(tokens.pop());
					var functionCall = tokens.shift() || "";
					var functionName = functionCall.replace(/<anonymous function(: (\w+))?>/, "$2").replace(/\([^)]*\)/g, "") || void 0;
					var argsRaw;
					if (functionCall.match(/\(([^)]*)\)/)) argsRaw = functionCall.replace(/^[^(]+\(([^)]*)\)$/, "$1");
					return new StackFrame({
						functionName,
						args: argsRaw === void 0 || argsRaw === "[arguments not available]" ? void 0 : argsRaw.split(","),
						fileName: locationParts[0],
						lineNumber: locationParts[1],
						columnNumber: locationParts[2],
						source: line
					});
				}, this);
			}
		};
	});
})))(), 1);
var _lazyMatch = () => {
	var __lib__ = (() => {
		var m = Object.defineProperty, V = Object.getOwnPropertyDescriptor, G = Object.getOwnPropertyNames, T = Object.prototype.hasOwnProperty, q = (r, e) => {
			for (var n in e) m(r, n, {
				get: e[n],
				enumerable: true
			});
		}, H = (r, e, n, a) => {
			if (e && typeof e == "object" || typeof e == "function") for (let t of G(e)) !T.call(r, t) && t !== n && m(r, t, {
				get: () => e[t],
				enumerable: !(a = V(e, t)) || a.enumerable
			});
			return r;
		}, J = (r) => H(m({}, "__esModule", { value: true }), r), w = {};
		q(w, { default: () => re });
		var A = (r) => Array.isArray(r), d = (r) => typeof r == "function", Q = (r) => r.length === 0, W = (r) => typeof r == "number", K = (r) => typeof r == "object" && r !== null, X = (r) => r instanceof RegExp, b = (r) => typeof r == "string", h = (r) => r === void 0, Y = (r) => {
			const e = /* @__PURE__ */ new Map();
			return (n) => {
				const a = e.get(n);
				if (a) return a;
				const t = r(n);
				return e.set(n, t), t;
			};
		}, rr = (r, e, n = {}) => {
			const a = {
				cache: {},
				input: r,
				index: 0,
				indexMax: 0,
				options: n,
				output: []
			};
			if (v(e)(a) && a.index === r.length) return a.output;
			throw new Error(`Failed to parse at index ${a.indexMax}`);
		}, i = (r, e) => A(r) ? er(r, e) : b(r) ? ar(r, e) : nr(r, e), er = (r, e) => {
			const n = {};
			for (const a of r) {
				if (a.length !== 1) throw new Error(`Invalid character: "${a}"`);
				const t = a.charCodeAt(0);
				n[t] = true;
			}
			return (a) => {
				const t = a.index, o = a.input;
				for (; a.index < o.length && o.charCodeAt(a.index) in n;) a.index += 1;
				const u = a.index;
				if (u > t) {
					if (!h(e) && !a.options.silent) {
						const s = a.input.slice(t, u), c = d(e) ? e(s, o, String(t)) : e;
						h(c) || a.output.push(c);
					}
					a.indexMax = Math.max(a.indexMax, a.index);
				}
				return true;
			};
		}, nr = (r, e) => {
			const n = r.source, a = r.flags.replace(/y|$/, "y"), t = new RegExp(n, a);
			return g((o) => {
				t.lastIndex = o.index;
				const u = t.exec(o.input);
				if (u) {
					if (!h(e) && !o.options.silent) {
						const s = d(e) ? e(...u, o.input, String(o.index)) : e;
						h(s) || o.output.push(s);
					}
					return o.index += u[0].length, o.indexMax = Math.max(o.indexMax, o.index), true;
				} else return false;
			});
		}, ar = (r, e) => (n) => {
			if (n.input.startsWith(r, n.index)) {
				if (!h(e) && !n.options.silent) {
					const t = d(e) ? e(r, n.input, String(n.index)) : e;
					h(t) || n.output.push(t);
				}
				return n.index += r.length, n.indexMax = Math.max(n.indexMax, n.index), true;
			} else return false;
		}, C = (r, e, n, a) => {
			const t = v(r);
			return g(_(M((o) => {
				let u = 0;
				for (; u < n;) {
					const s = o.index;
					if (!t(o) || (u += 1, o.index === s)) break;
				}
				return u >= e;
			})));
		}, tr = (r, e) => C(r, 0, 1), f = (r, e) => C(r, 0, Infinity), x = (r, e) => {
			const n = r.map(v);
			return g(_(M((a) => {
				for (let t = 0, o = n.length; t < o; t++) if (!n[t](a)) return false;
				return true;
			})));
		}, l = (r, e) => {
			const n = r.map(v);
			return g(_((a) => {
				for (let t = 0, o = n.length; t < o; t++) if (n[t](a)) return true;
				return false;
			}));
		}, M = (r, e = false) => {
			const n = v(r);
			return (a) => {
				const t = a.index, o = a.output.length, u = n(a);
				return (!u || e) && (a.index = t, a.output.length !== o && (a.output.length = o)), u;
			};
		}, _ = (r, e) => {
			return v(r);
		}, g = (() => {
			let r = 0;
			return (e) => {
				const n = v(e), a = r += 1;
				return (t) => {
					var o;
					if (t.options.memoization === false) return n(t);
					const u = t.index, s = (o = t.cache)[a] || (o[a] = /* @__PURE__ */ new Map()), c = s.get(u);
					if (c === false) return false;
					if (W(c)) return t.index = c, true;
					if (c) return t.index = c.index, c.output?.length && t.output.push(...c.output), true;
					{
						const Z = t.output.length;
						if (n(t)) {
							const D = t.index, U = t.output.length;
							if (U > Z) {
								const ee = t.output.slice(Z, U);
								s.set(u, {
									index: D,
									output: ee
								});
							} else s.set(u, D);
							return true;
						} else return s.set(u, false), false;
					}
				};
			};
		})(), E = (r) => {
			let e;
			return (n) => (e || (e = v(r())), e(n));
		}, v = Y((r) => {
			if (d(r)) return Q(r) ? E(r) : r;
			if (b(r) || X(r)) return i(r);
			if (A(r)) return x(r);
			if (K(r)) return l(Object.values(r));
			throw new Error("Invalid rule");
		}), P = "abcdefghijklmnopqrstuvwxyz", ir = (r) => {
			let e = "";
			for (; r > 0;) e = P[(r - 1) % 26] + e, r = Math.floor((r - 1) / 26);
			return e;
		}, O = (r) => {
			let e = 0;
			for (let n = 0, a = r.length; n < a; n++) e = e * 26 + P.indexOf(r[n]) + 1;
			return e;
		}, S = (r, e) => {
			if (e < r) return S(e, r);
			const n = [];
			for (; r <= e;) n.push(r++);
			return n;
		}, or = (r, e, n) => S(r, e).map((a) => String(a).padStart(n, "0")), R = (r, e) => S(O(r), O(e)).map(ir), p = (r) => r, z = (r) => ur((e) => rr(e, r, { memoization: false }).join("")), ur = (r) => {
			const e = {};
			return (n) => e[n] ?? (e[n] = r(n));
		}, sr = i(/^\*\*\/\*$/, ".*"), cr = i(/^\*\*\/(\*)?([ a-zA-Z0-9._-]+)$/, (r, e, n) => `.*${e ? "" : "(?:^|/)"}${n.replaceAll(".", "\\.")}`), lr = i(/^\*\*\/(\*)?([ a-zA-Z0-9._-]*)\{([ a-zA-Z0-9._-]+(?:,[ a-zA-Z0-9._-]+)*)\}$/, (r, e, n, a) => `.*${e ? "" : "(?:^|/)"}${n.replaceAll(".", "\\.")}(?:${a.replaceAll(",", "|").replaceAll(".", "\\.")})`), y = i(/\\./, p), pr = i(/[$.*+?^(){}[\]\|]/, (r) => `\\${r}`), vr = i(/./, p), fr = l([i(/^(?:!!)*!(.*)$/, (r, e) => `(?!^${L(e)}$).*?`), i(/^(!!)+/, "")]), j = l([
			i(/\/(\*\*\/)+/, "(?:/.+/|/)"),
			i(/^(\*\*\/)+/, "(?:^|.*/)"),
			i(/\/(\*\*)$/, "(?:/.*|$)"),
			i(/\*\*/, ".*")
		]), N = l([i(/\*\/(?!\*\*\/)/, "[^/]*/"), i(/\*/, "[^/]*")]), k = i("?", "[^/]"), $r = i("[", p), wr = i("]", p), Ar = i(/[!^]/, "^/"), br = i(/[a-z]-[a-z]|[0-9]-[0-9]/i, p), Er = l([
			y,
			i(/[$.*+?^(){}[\|]/, (r) => `\\${r}`),
			br,
			i(/[^\]]/, p)
		]), B = x([
			$r,
			tr(Ar),
			f(Er),
			wr
		]), Pr = i("{", "(?:"), Or = i("}", ")"), I = x([
			Pr,
			l([
				i(/(\d+)\.\.(\d+)/, (r, e, n) => or(+e, +n, Math.min(e.length, n.length)).join("|")),
				i(/([a-z]+)\.\.([a-z]+)/, (r, e, n) => R(e, n).join("|")),
				i(/([A-Z]+)\.\.([A-Z]+)/, (r, e, n) => R(e.toLowerCase(), n.toLowerCase()).join("|").toUpperCase())
			]),
			Or
		]), kr = i("{", "(?:"), Br = i("}", ")"), Ir = i(",", "|"), Fr = i(/[$.*+?^(){[\]\|]/, (r) => `\\${r}`), Lr = i(/[^}]/, p), F = x([
			kr,
			f(l([
				j,
				N,
				k,
				B,
				I,
				E(() => F),
				y,
				Fr,
				Ir,
				Lr
			])),
			Br
		]), L = z(f(l([
			sr,
			cr,
			lr,
			fr,
			j,
			N,
			k,
			B,
			I,
			F,
			y,
			pr,
			vr
		]))), Tr = i(/\\./, p), qr = i(/./, p), Yr = z(f(l([
			Tr,
			i(/\*\*\*+/, "*"),
			i(/([^/{[(!])\*\*/, (r, e) => `${e}*`),
			i(/(^|.)\*\*(?=[^*/)\]}])/, (r, e) => `${e}*`),
			qr
		]))), $ = (r, e) => {
			const n = Array.isArray(r) ? r : [r];
			if (!n.length) return false;
			const a = n.map($.compile), t = n.every((s) => /(\/(?:\*\*)?|\[\/\])$/.test(s)), o = e.replace(/[\\\/]+/g, "/").replace(/\/$/, t ? "/" : "");
			return a.some((s) => s.test(o));
		};
		$.compile = (r) => new RegExp(`^${L(Yr(r))}$`, "s");
		var re = $;
		return J(w);
	})();
	return __lib__.default || __lib__;
};
var _match;
var zeptomatch = (path, pattern) => {
	if (!_match) {
		_match = _lazyMatch();
		_lazyMatch = null;
	}
	return _match(path, pattern);
};
var _DRIVE_LETTER_START_RE = /^[A-Za-z]:\//;
function normalizeWindowsPath(input = "") {
	if (!input) return input;
	return input.replace(/\\/g, "/").replace(_DRIVE_LETTER_START_RE, (r) => r.toUpperCase());
}
var _UNC_REGEX = /^[/\\]{2}/;
var _IS_ABSOLUTE_RE = /^[/\\](?![/\\])|^[/\\]{2}(?!\.)|^[A-Za-z]:[/\\]/;
var _DRIVE_LETTER_RE = /^[A-Za-z]:$/;
var _ROOT_FOLDER_RE = /^\/([A-Za-z]:)?$/;
var _EXTNAME_RE = /.(\.[^./]+|\.)$/;
var _PATH_ROOT_RE = /^[/\\]|^[a-zA-Z]:[/\\]/;
var normalize = function(path) {
	if (path.length === 0) return ".";
	path = normalizeWindowsPath(path);
	const isUNCPath = path.match(_UNC_REGEX);
	const isPathAbsolute = isAbsolute(path);
	const trailingSeparator = path[path.length - 1] === "/";
	path = normalizeString(path, !isPathAbsolute);
	if (path.length === 0) {
		if (isPathAbsolute) return "/";
		return trailingSeparator ? "./" : ".";
	}
	if (trailingSeparator) path += "/";
	if (_DRIVE_LETTER_RE.test(path)) path += "/";
	if (isUNCPath) {
		if (!isPathAbsolute) return `//./${path}`;
		return `//${path}`;
	}
	return isPathAbsolute && !isAbsolute(path) ? `/${path}` : path;
};
var join = function(...segments) {
	let path = "";
	for (const seg of segments) {
		if (!seg) continue;
		if (path.length > 0) {
			const pathTrailing = path[path.length - 1] === "/";
			const segLeading = seg[0] === "/";
			if (pathTrailing && segLeading) path += seg.slice(1);
			else path += pathTrailing || segLeading ? seg : `/${seg}`;
		} else path += seg;
	}
	return normalize(path);
};
function cwd() {
	if (typeof process !== "undefined" && typeof process.cwd === "function") return process.cwd().replace(/\\/g, "/");
	return "/";
}
var resolve = function(...arguments_) {
	arguments_ = arguments_.map((argument) => normalizeWindowsPath(argument));
	let resolvedPath = "";
	let resolvedAbsolute = false;
	for (let index = arguments_.length - 1; index >= -1 && !resolvedAbsolute; index--) {
		const path = index >= 0 ? arguments_[index] : cwd();
		if (!path || path.length === 0) continue;
		resolvedPath = `${path}/${resolvedPath}`;
		resolvedAbsolute = isAbsolute(path);
	}
	resolvedPath = normalizeString(resolvedPath, !resolvedAbsolute);
	if (resolvedAbsolute && !isAbsolute(resolvedPath)) return `/${resolvedPath}`;
	return resolvedPath.length > 0 ? resolvedPath : ".";
};
function normalizeString(path, allowAboveRoot) {
	let res = "";
	let lastSegmentLength = 0;
	let lastSlash = -1;
	let dots = 0;
	let char = null;
	for (let index = 0; index <= path.length; ++index) {
		if (index < path.length) char = path[index];
		else if (char === "/") break;
		else char = "/";
		if (char === "/") {
			if (lastSlash === index - 1 || dots === 1);
			else if (dots === 2) {
				if (res.length < 2 || lastSegmentLength !== 2 || res[res.length - 1] !== "." || res[res.length - 2] !== ".") {
					if (res.length > 2) {
						const lastSlashIndex = res.lastIndexOf("/");
						if (lastSlashIndex === -1) {
							res = "";
							lastSegmentLength = 0;
						} else {
							res = res.slice(0, lastSlashIndex);
							lastSegmentLength = res.length - 1 - res.lastIndexOf("/");
						}
						lastSlash = index;
						dots = 0;
						continue;
					} else if (res.length > 0) {
						res = "";
						lastSegmentLength = 0;
						lastSlash = index;
						dots = 0;
						continue;
					}
				}
				if (allowAboveRoot) {
					res += res.length > 0 ? "/.." : "..";
					lastSegmentLength = 2;
				}
			} else {
				if (res.length > 0) res += `/${path.slice(lastSlash + 1, index)}`;
				else res = path.slice(lastSlash + 1, index);
				lastSegmentLength = index - lastSlash - 1;
			}
			lastSlash = index;
			dots = 0;
		} else if (char === "." && dots !== -1) ++dots;
		else dots = -1;
	}
	return res;
}
var isAbsolute = function(p) {
	return _IS_ABSOLUTE_RE.test(p);
};
var toNamespacedPath = function(p) {
	return normalizeWindowsPath(p);
};
var extname = function(p) {
	if (p === "..") return "";
	const match = _EXTNAME_RE.exec(normalizeWindowsPath(p));
	return match && match[1] || "";
};
var relative = function(from, to) {
	const _from = resolve(from).replace(_ROOT_FOLDER_RE, "$1").split("/");
	const _to = resolve(to).replace(_ROOT_FOLDER_RE, "$1").split("/");
	if (_to[0][1] === ":" && _from[0][1] === ":" && _from[0] !== _to[0]) return _to.join("/");
	const _fromCopy = [..._from];
	for (const segment of _fromCopy) {
		if (_to[0] !== segment) break;
		_from.shift();
		_to.shift();
	}
	return [..._from.map(() => ".."), ..._to].join("/");
};
var dirname = function(p) {
	const segments = normalizeWindowsPath(p).replace(/\/$/, "").split("/").slice(0, -1);
	if (segments.length === 1 && _DRIVE_LETTER_RE.test(segments[0])) segments[0] += "/";
	return segments.join("/") || (isAbsolute(p) ? "/" : ".");
};
var format = function(p) {
	const ext = p.ext ? p.ext.startsWith(".") ? p.ext : `.${p.ext}` : "";
	const segments = [
		p.root,
		p.dir,
		p.base ?? (p.name ?? "") + ext
	].filter(Boolean);
	return normalizeWindowsPath(p.root ? resolve(...segments) : segments.join("/"));
};
var basename = function(p, extension) {
	const segments = normalizeWindowsPath(p).split("/");
	let lastSegment = "";
	for (let i = segments.length - 1; i >= 0; i--) {
		const val = segments[i];
		if (val) {
			lastSegment = val;
			break;
		}
	}
	return extension && lastSegment.endsWith(extension) ? lastSegment.slice(0, -extension.length) : lastSegment;
};
var parse = function(p) {
	const root = _PATH_ROOT_RE.exec(p)?.[0]?.replace(/\\/g, "/") || "";
	const base = basename(p);
	const extension = extname(base);
	return {
		root,
		dir: dirname(p),
		base,
		ext: extension,
		name: base.slice(0, base.length - extension.length)
	};
};
var matchesGlob = (path, pattern) => {
	return zeptomatch(pattern, normalize(path));
};
var _path = {
	__proto__: null,
	basename,
	dirname,
	extname,
	format,
	isAbsolute,
	join,
	matchesGlob,
	normalize,
	normalizeString,
	parse,
	relative,
	resolve,
	sep: "/",
	toNamespacedPath
};
//#endregion
//#region node_modules/.pnpm/pathe@2.0.3/node_modules/pathe/dist/index.mjs
var delimiter = /* @__PURE__ */ (() => globalThis.process?.platform === "win32" ? ";" : ":")();
var _platforms = {
	posix: void 0,
	win32: void 0
};
var mix = (del = delimiter) => {
	return new Proxy(_path, { get(_, prop) {
		if (prop === "delimiter") return del;
		if (prop === "posix") return posix;
		if (prop === "win32") return win32;
		return _platforms[prop] || _path[prop];
	} });
};
var posix = /* @__PURE__ */ mix(":");
var win32 = /* @__PURE__ */ mix(";");
//#endregion
//#region node_modules/.pnpm/@guiiai+logg@1.2.5/node_modules/@guiiai/logg/dist/index.mjs
var LogLevel$1 = /* @__PURE__ */ ((LogLevel2) => {
	LogLevel2[LogLevel2["Error"] = 0] = "Error";
	LogLevel2[LogLevel2["Warning"] = 1] = "Warning";
	LogLevel2[LogLevel2["Log"] = 2] = "Log";
	LogLevel2[LogLevel2["Verbose"] = 3] = "Verbose";
	LogLevel2[LogLevel2["Debug"] = 4] = "Debug";
	return LogLevel2;
})(LogLevel$1 || {});
var LogLevelString = /* @__PURE__ */ ((LogLevelString2) => {
	LogLevelString2["Error"] = "error";
	LogLevelString2["Warning"] = "warn";
	LogLevelString2["Log"] = "log";
	LogLevelString2["Verbose"] = "verbose";
	LogLevelString2["Debug"] = "debug";
	return LogLevelString2;
})(LogLevelString || {});
var Format = /* @__PURE__ */ ((Format2) => {
	Format2["JSON"] = "json";
	Format2["Pretty"] = "pretty";
	return Format2;
})(Format || {});
var isColorSupported = true;
function formatter(open, close, replace = open) {
	return (input) => {
		const string = `${input}`;
		const index = string.indexOf(close, open.length);
		return ~index ? open + replaceClose(string, close, replace, index) + close : open + string + close;
	};
}
function replaceClose(string, close, replace, index) {
	const start = string.substring(0, index) + replace;
	const end = string.substring(index + close.length);
	const nextIndex = end.indexOf(close);
	return ~nextIndex ? start + replaceClose(end, close, replace, nextIndex) : start + end;
}
function createColors(enabled = isColorSupported) {
	return {
		isColorSupported: enabled,
		reset: enabled ? (s) => `\x1B[0m${s}\x1B[0m` : String,
		bold: enabled ? formatter("\x1B[1m", "\x1B[22m", "\x1B[22m\x1B[1m") : String,
		dim: enabled ? formatter("\x1B[2m", "\x1B[22m", "\x1B[22m\x1B[2m") : String,
		italic: enabled ? formatter("\x1B[3m", "\x1B[23m") : String,
		underline: enabled ? formatter("\x1B[4m", "\x1B[24m") : String,
		inverse: enabled ? formatter("\x1B[7m", "\x1B[27m") : String,
		hidden: enabled ? formatter("\x1B[8m", "\x1B[28m") : String,
		strikethrough: enabled ? formatter("\x1B[9m", "\x1B[29m") : String,
		black: enabled ? formatter("\x1B[30m", "\x1B[39m") : String,
		red: enabled ? formatter("\x1B[31m", "\x1B[39m") : String,
		green: enabled ? formatter("\x1B[32m", "\x1B[39m") : String,
		yellow: enabled ? formatter("\x1B[33m", "\x1B[39m") : String,
		blue: enabled ? formatter("\x1B[34m", "\x1B[39m") : String,
		magenta: enabled ? formatter("\x1B[35m", "\x1B[39m") : String,
		cyan: enabled ? formatter("\x1B[36m", "\x1B[39m") : String,
		white: enabled ? formatter("\x1B[37m", "\x1B[39m") : String,
		gray: enabled ? formatter("\x1B[90m", "\x1B[39m") : String,
		bgBlack: enabled ? formatter("\x1B[40m", "\x1B[49m") : String,
		bgRed: enabled ? formatter("\x1B[41m", "\x1B[49m") : String,
		bgGreen: enabled ? formatter("\x1B[42m", "\x1B[49m") : String,
		bgYellow: enabled ? formatter("\x1B[43m", "\x1B[49m") : String,
		bgBlue: enabled ? formatter("\x1B[44m", "\x1B[49m") : String,
		bgMagenta: enabled ? formatter("\x1B[45m", "\x1B[49m") : String,
		bgCyan: enabled ? formatter("\x1B[46m", "\x1B[49m") : String,
		bgWhite: enabled ? formatter("\x1B[47m", "\x1B[49m") : String
	};
}
var pc = createColors();
var logLevelStringToLogLevelMap = {
	[LogLevelString.Error]: LogLevel$1.Error,
	[LogLevelString.Warning]: LogLevel$1.Warning,
	[LogLevelString.Log]: LogLevel$1.Log,
	[LogLevelString.Verbose]: LogLevel$1.Verbose,
	[LogLevelString.Debug]: LogLevel$1.Debug
};
var logLevelToLogLevelStringMap = {
	[LogLevel$1.Error]: LogLevelString.Error,
	[LogLevel$1.Warning]: LogLevelString.Warning,
	[LogLevel$1.Log]: LogLevelString.Log,
	[LogLevel$1.Verbose]: LogLevelString.Verbose,
	[LogLevel$1.Debug]: LogLevelString.Debug
};
var availableLogLevelStrings = [
	LogLevelString.Error,
	LogLevelString.Warning,
	LogLevelString.Log,
	LogLevelString.Verbose,
	LogLevelString.Debug
];
var logLevelToColorMap = {
	[LogLevel$1.Error]: pc.red,
	[LogLevel$1.Warning]: pc.yellow,
	[LogLevel$1.Log]: pc.blue,
	[LogLevel$1.Verbose]: pc.cyan,
	[LogLevel$1.Debug]: pc.green
};
var availableLogLevels = [
	LogLevel$1.Error,
	LogLevel$1.Warning,
	LogLevel$1.Log,
	LogLevel$1.Verbose,
	LogLevel$1.Debug
];
var availableFormats = [Format.JSON, Format.Pretty];
function parseErrorStacks(errorLike) {
	if (errorLike.stack == null) return [];
	return errorLike.stack.split("\n").map((item) => item.trim()).slice(1).filter((item) => {
		if (!/^at (.*)( \(.*:(\d+):(\d+)\))|at (.*)(:(\d+):(\d+))/i.exec(item)) return false;
		return true;
	}).map((item) => {
		const match = /at (.*)( \((.*):(\d+):(\d+)\))|at (.*)(:(\d+):(\d+))/i.exec(item);
		if (!match) return { invalid: true };
		if (typeof match[1] !== "undefined" && typeof match[2] !== "undefined" && typeof match[3] !== "undefined" && typeof match[4] !== "undefined" && typeof match[5] !== "undefined") return {
			invalid: false,
			function: match[1] ?? "",
			file: match[3] ?? "",
			line: Number.parseInt(match[4] ?? "0"),
			column: Number.parseInt(match[5] ?? "0")
		};
		else if (typeof match[6] !== "undefined" && typeof match[7] !== "undefined" && typeof match[8] !== "undefined" && typeof match[9] !== "undefined") return {
			invalid: false,
			function: match[6] ?? "",
			file: match[7] ?? "",
			line: Number.parseInt(match[8] ?? "0"),
			column: Number.parseInt(match[9] ?? "0")
		};
		else return { invalid: true };
	});
}
function isErrorLike(err) {
	if (err == null) return false;
	if (err instanceof Error) return true;
	return false;
}
function newLog(logLevel, context, fields, message, timeFormatter) {
	let fieldsObj = { context: "" };
	if (typeof fields !== "undefined" && fields !== null) fieldsObj = { ...fields };
	if (typeof context !== "undefined" && context !== null) fieldsObj.context = context;
	const now = /* @__PURE__ */ new Date();
	return {
		"@timestamp": now.getTime(),
		"@localetime": timeFormatter ? timeFormatter(now) : now.toISOString(),
		"level": logLevel,
		"fields": fieldsObj,
		"message": message
	};
}
function newErrorLog(logLevel, context, fields, message, errorStack, timeFormatter) {
	const log = newLog(logLevel, context, fields, message, timeFormatter);
	if (typeof errorStack !== "undefined" && errorStack !== null) {
		log.errored = true;
		log.error = { stack: errorStack };
	}
	return log;
}
function prettyFormatValue(value) {
	let valueString = "";
	switch (typeof value) {
		case "number":
			valueString = pc.yellow(value);
			break;
		case "object":
			valueString = pc.green(JSON.stringify(value));
			break;
		case "boolean":
			valueString = pc.yellow(String(value));
			break;
		case "undefined":
			valueString = pc.gray("undefined");
			break;
		default:
			valueString = String(value);
			break;
	}
	return valueString;
}
function toPrettyString(log) {
	const messagePartials = [];
	messagePartials.push(log["@localetime"]);
	messagePartials.push(logLevelToColorMap[logLevelStringToLogLevelMap[log.level]](`[${log.level}]`));
	let contextString = "";
	if (log.fields.isNestSystemModule != null) {
		contextString = pc.magenta(`[${log.fields.nestSystemModule}]`);
		delete log.fields.isNestSystemModule;
		delete log.fields.nestSystemModule;
	}
	if (log.fields.context != null) {
		contextString = pc.magenta(`[${log.fields.context}]`);
		delete log.fields.context;
	}
	if (contextString.length > 0) messagePartials.push(contextString);
	if ("module" in log.fields && log.fields.module != null) {
		messagePartials.push(pc.magenta(`[${log.fields.module}]`));
		delete log.fields.module;
	}
	messagePartials.push(log.message);
	const fieldsEntries = Object.entries(log.fields);
	if (fieldsEntries.length > 0) messagePartials.push(" {");
	for (const [key, value] of fieldsEntries) {
		let valueString = value;
		if (isErrorLike(value)) {
			if (value.message) valueString = prettyFormatValue(value.message);
			if (!valueString) valueString = "";
			if (value.cause != null) try {
				valueString += JSON.stringify(value.cause);
			} catch {
				valueString += String(value.cause);
			}
		} else valueString = prettyFormatValue(value);
		messagePartials.push(`${pc.gray(key)}${pc.gray("=")}${valueString}`);
	}
	if (fieldsEntries.length > 0) messagePartials.push("}");
	let message = messagePartials.join(" ");
	if (log.errored != null && log.errored && log.error && log.error.stack != null && log.error.stack) message += `
${log.error.stack}`;
	return message;
}
function shouldOutputDebugLevelLogWhenLogLevelIsOneOf(logLevel) {
	return logLevel >= LogLevel$1.Debug;
}
function shouldOutputVerboseLevelLogWhenLogLevelIsOneOf(logLevel) {
	return logLevel >= LogLevel$1.Verbose;
}
function shouldOutputLogLevelLogWhenLogLevelIsOneOf(logLevel) {
	return logLevel >= LogLevel$1.Log;
}
function shouldOutputWarningLevelLogWhenLogLevelIsOneOf(logLevel) {
	return logLevel >= LogLevel$1.Warning;
}
function shouldOutputErrorLevelLogWhenLogLevelIsOneOf(logLevel) {
	return logLevel >= LogLevel$1.Error;
}
function isBrowser() {
	return typeof window !== "undefined";
}
function shouldUseHyperlink() {
	return !isBrowser() && getGlobalFormat() === Format.Pretty;
}
function withHyperlink(basePath, context) {
	return shouldUseHyperlink() ? `\x1B]8;;file://${basePath}\x1B\\${context}\x1B]8;;\x1B\\` : context;
}
var GLOBAL_CONFIG = {
	configured: false,
	logLevel: LogLevel$1.Debug,
	format: Format.JSON,
	timeFormatter: (inputDate) => inputDate.toISOString()
};
function getGlobalLogLevel() {
	return GLOBAL_CONFIG.logLevel;
}
function setGlobalLogLevel(logLevel) {
	if (availableLogLevels.includes(logLevel)) GLOBAL_CONFIG.logLevel = logLevel;
	else throw new Error(`log level ${logLevel} is not available. available log levels are: ${availableLogLevels.join(", ")}`);
	GLOBAL_CONFIG.configured = true;
}
function getGlobalFormat() {
	return GLOBAL_CONFIG.format;
}
function getGlobalTimeFormatter() {
	return GLOBAL_CONFIG.timeFormatter;
}
function createLogg(context) {
	const logObj = {
		fields: {},
		context,
		logLevel: LogLevel$1.Debug,
		format: Format.JSON,
		shouldUseGlobalConfig: false,
		errorProcessor: (err) => err,
		timeFormatter: (inputDate) => inputDate.toISOString(),
		useGlobalConfig: () => {
			logObj.shouldUseGlobalConfig = true;
			logObj.format = getGlobalFormat();
			logObj.logLevel = getGlobalLogLevel();
			return logObj.child();
		},
		child: (fields) => {
			const logger = createLogg(logObj.context);
			if (fields != null) logger.fields = {
				...logObj.fields,
				...fields
			};
			else logger.fields = logObj.fields;
			if (logger.fields != null && "context" in logger.fields) logger.context = logger.fields.context;
			else logger.context = logObj.context;
			logger.logLevel = logObj.logLevel;
			logger.format = logObj.format;
			logger.shouldUseGlobalConfig = logObj.shouldUseGlobalConfig;
			return logger;
		},
		withContext: (context2) => {
			const logger = logObj.child();
			logger.context = context2;
			return logger;
		},
		withLogLevel: (logLevel) => {
			const logger = logObj.child();
			if (availableLogLevels.includes(logLevel)) {
				logger.logLevel = logLevel;
				logger.shouldUseGlobalConfig = false;
				logger.debug(`setting log level to ${logLevelToLogLevelStringMap[logLevel]} (${logLevel})`);
			} else throw new Error(`log level ${logLevel} is not available. available log levels are: ${availableLogLevels.join(", ")}`);
			return logger;
		},
		withLogLevelString: (logLevelString) => {
			const logger = logObj.child();
			if (availableLogLevelStrings.includes(logLevelString)) {
				logger.logLevel = logLevelStringToLogLevelMap[logLevelString];
				logger.shouldUseGlobalConfig = false;
				logger.debug(`setting log level to ${logLevelString} (${logLevelStringToLogLevelMap[logLevelString]})`);
			} else throw new Error(`log level ${logLevelString} is not available. available log levels are: ${availableLogLevelStrings.join(", ")}`);
			return logger;
		},
		withFormat: (format) => {
			const logger = logObj.child();
			if (availableFormats.includes(format)) {
				logger.format = format;
				logger.shouldUseGlobalConfig = false;
				logger.debug(`setting format to ${format}`);
			} else throw new Error(`format ${format} is not available. available formats are: ${availableFormats.join(", ")}`);
			return logger;
		},
		withFields: (fields) => {
			if (typeof fields === "undefined" || fields === null) return logObj.child({});
			return logObj.child(fields);
		},
		withField(key, value) {
			if (typeof key === "undefined" || key === null) throw new Error("key is required");
			return logObj.child({ [key]: value });
		},
		withError: (err) => {
			err = logObj.errorProcessor(err);
			if (!isErrorLike(err)) return logObj.withField("error", String(err));
			let logger = logObj;
			logger = logger.withField("error", err.message);
			if (err.stack != null) logger = logger.withField("stack", err.stack);
			if (err.cause != null) try {
				logger = logger.withField("cause", JSON.stringify(err.cause));
			} catch {
				logger = logger.withField("cause", String(err.cause));
			}
			return logger;
		},
		withCallStack(errorLike) {
			const stacks = parseErrorStacks(errorLike).slice(2).filter((item) => !item.invalid);
			if (stacks.length === 0) return logObj;
			return logObj.child({
				function: stacks[0].function,
				file: `${stacks[0].file}:${stacks[0].line}:${stacks[0].column}`,
				line: stacks[0].line,
				column: stacks[0].column
			});
		},
		debug: () => {},
		verbose: () => {},
		log: () => {},
		error: () => {},
		errorWithError: () => {},
		warn: () => {},
		withTimeFormat: (_) => {
			return logObj.child();
		},
		withTimeFormatter: (fn) => {
			const logger = logObj.child();
			logger.timeFormatter = fn;
			return logger;
		},
		withErrorProcessor: (fn) => {
			const logger = logObj.child();
			logger.errorProcessor = fn;
			return logger;
		}
	};
	const getEffectiveLogLevel = () => {
		return logObj.shouldUseGlobalConfig ? getGlobalLogLevel() : logObj.logLevel;
	};
	const getEffectiveFormat = () => {
		return logObj.shouldUseGlobalConfig ? getGlobalFormat() : logObj.format;
	};
	const getEffectiveTimeFormatter = () => {
		return logObj.shouldUseGlobalConfig ? getGlobalTimeFormatter() : logObj.timeFormatter ?? ((inputDate) => inputDate.toISOString());
	};
	const mergeOptionalParams = (optionalParams) => {
		if (optionalParams != null && optionalParams.length > 0) if (Object.keys(logObj.fields).length > 0) return [logObj.fields, ...optionalParams];
		else return optionalParams;
		return logObj.fields;
	};
	const outputToConsole = (raw, consoleMethod, mergedFields) => {
		const format = getEffectiveFormat();
		if (isBrowser() && format === Format.Pretty) {
			raw.fields = Object.fromEntries(Object.entries(raw.fields).filter(([key, value]) => {
				if (key === "isNestSystemModule" || key === "nestSystemModule" || key === "context") return [key, value];
			}));
			const fieldsToOutput = mergedFields ?? logObj.fields;
			if (Array.isArray(fieldsToOutput) && fieldsToOutput.length > 0) console[consoleMethod](toPrettyString(raw), ...fieldsToOutput);
			else if (Object.keys(fieldsToOutput).length > 0) console[consoleMethod](toPrettyString(raw), fieldsToOutput);
			else console[consoleMethod](toPrettyString(raw));
			return;
		}
		const output = format === Format.Pretty ? toPrettyString(raw) : JSON.stringify(raw);
		console[consoleMethod](output);
	};
	const logLevelCheckMap = {
		[LogLevelString.Debug]: shouldOutputDebugLevelLogWhenLogLevelIsOneOf,
		[LogLevelString.Verbose]: shouldOutputVerboseLevelLogWhenLogLevelIsOneOf,
		[LogLevelString.Log]: shouldOutputLogLevelLogWhenLogLevelIsOneOf,
		[LogLevelString.Warning]: shouldOutputWarningLevelLogWhenLogLevelIsOneOf
	};
	const consoleMethodMap = {
		[LogLevelString.Debug]: "debug",
		[LogLevelString.Verbose]: "log",
		[LogLevelString.Log]: "log",
		[LogLevelString.Warning]: "warn"
	};
	const logWithLevel = (levelString, message, optionalParams) => {
		const logLevel = getEffectiveLogLevel();
		const shouldOutput = logLevelCheckMap[levelString];
		if (!shouldOutput(logLevel)) return;
		const mergedFields = mergeOptionalParams(optionalParams);
		const raw = newLog(levelString, logObj.context, mergedFields, message, getEffectiveTimeFormatter());
		outputToConsole(raw, consoleMethodMap[levelString], mergedFields);
	};
	logObj.debug = (message, ...optionalParams) => {
		logWithLevel(LogLevelString.Debug, message, optionalParams);
	};
	logObj.verbose = (message, ...optionalParams) => {
		logWithLevel(LogLevelString.Verbose, message, optionalParams);
	};
	logObj.log = (message, ...optionalParams) => {
		logWithLevel(LogLevelString.Log, message, optionalParams);
	};
	logObj.warn = (message, ...optionalParams) => {
		logWithLevel(LogLevelString.Warning, message, optionalParams);
	};
	logObj.error = (message, stack, ...optionalParams) => {
		if (!shouldOutputErrorLevelLogWhenLogLevelIsOneOf(getEffectiveLogLevel())) return;
		const mergedFields = mergeOptionalParams(optionalParams);
		const raw = newErrorLog(LogLevelString.Error, logObj.context, mergedFields, message, stack, getEffectiveTimeFormatter());
		outputToConsole(raw, "error", mergedFields);
	};
	logObj.errorWithError = (message, err, ...optionalParams) => {
		return logObj.withError(err).error(message, void 0, ...optionalParams);
	};
	return logObj;
}
function createLogger(context) {
	const currentStack = import_error_stack_parser.default.parse(/* @__PURE__ */ new Error())[1];
	const basePath = currentStack.fileName?.replace("async", "").trim() ?? "";
	const fileName = posix.join(...basePath.split(posix.sep).slice(-2));
	context = context ?? `${fileName}:${currentStack.lineNumber}`;
	return createLogg(withHyperlink(basePath, context));
}
var useLogger = (context) => createLogger(context).useGlobalConfig();
//#endregion
//#region types/index.ts
/**
* Unified public types & interfaces
*/
var DrivingServiceMode = /* @__PURE__ */ function(DrivingServiceMode) {
	/** Driven by SDK directly */
	DrivingServiceMode["direct"] = "direct";
	/** Driven by host application */
	DrivingServiceMode["backend"] = "backend";
	/**
	* Use this **only** when driving the avatar through the companion RTC SDK,
	* `@spatius/avatarkit-rtc`. If you are not using that package, stay on
	* `direct` / `backend` — do not switch to this because it looks newer.
	*
	* **Telemetry dimension only — it gates no behaviour.** Every session reports
	* `dsm`; without a value of its own, RTC traffic would be indistinguishable
	* from plain `backend` traffic on the dashboards.
	*
	* It deliberately does not unlock any API. RTC drives the avatar frame by
	* frame through `AvatarView.renderFrame` / `renderFromProtobuf`, which put the
	* view into pure-rendering mode on their own — it never calls the host-driven
	* feeding path (`yieldAudioData` / `yieldFramesData`) that `backend` exists
	* for. So the `=== backend` checks guarding those methods are left untouched:
	* loosening them for `rtc` would widen the reachable API surface without
	* enabling anything RTC actually uses.
	*
	* Note the two concepts sit at different levels and are not interchangeable:
	* pure-rendering mode is a per-frame runtime state of the render loop, while
	* this is a session-wide value declared once at `initialize`.
	*/
	DrivingServiceMode["rtc"] = "rtc";
	return DrivingServiceMode;
}({});
/**
* Strategy for handling animation-frame starvation (animation frames can't keep up
* with the audio clock).
*
* - `audioIndependent` (default): audio keeps playing, animation catches up; starvation
*   is only reported as telemetry. This is the historical default behavior.
* - `strictSync`: pause audio and wait when frames run out, resume once new frames
*   arrive, notifying via `AvatarController.onPlaybackStall`.
*/
var FrameStarvationMode = /* @__PURE__ */ function(FrameStarvationMode) {
	FrameStarvationMode["audioIndependent"] = "audioIndependent";
	FrameStarvationMode["strictSync"] = "strictSync";
	return FrameStarvationMode;
}({});
var LogLevel = /* @__PURE__ */ function(LogLevel) {
	/** Disable all logs */
	LogLevel["off"] = "off";
	/** Error logs only */
	LogLevel["error"] = "error";
	/** Warning and error logs */
	LogLevel["warning"] = "warning";
	/** All logs (info, warning, error), default value */
	LogLevel["all"] = "all";
	return LogLevel;
}({});
/** Default Opus bitrate (bits/sec) when the SDK encodes the upstream to Opus and none is given. @internal */
var DEFAULT_OPUS_BITRATE = 48e3;
var RenderQuality = /* @__PURE__ */ function(RenderQuality) {
	RenderQuality["standard"] = "standard";
	RenderQuality["high"] = "high";
	RenderQuality["ultra"] = "ultra";
	return RenderQuality;
}({});
/** @internal */
var RENDER_QUALITY_PARAMS = {
	["standard"]: {
		renderScale: .55,
		splatRadius: 2
	},
	["high"]: {
		renderScale: .7,
		splatRadius: 2.5
	},
	["ultra"]: {
		renderScale: 1,
		splatRadius: 3
	}
};
/**
* 兜底真实 region：region 解析失败 / 需要具体区域时使用。
* 注意这不是"不填时的默认值"——不填时默认走 auto（见 DEFAULT_REGION_REQUEST）。
* @internal
*/
var DEFAULT_REGION = "us-west";
/**
* 不填 region 时的默认请求值：auto，触发 bootstrap 自动区域调度。
* @internal
*/
var DEFAULT_REGION_REQUEST = "auto";
var LoadProgress = /* @__PURE__ */ function(LoadProgress) {
	LoadProgress["downloading"] = "downloading";
	LoadProgress["completed"] = "completed";
	LoadProgress["failed"] = "failed";
	return LoadProgress;
}({});
var ConnectionState = /* @__PURE__ */ function(ConnectionState) {
	ConnectionState["disconnected"] = "disconnected";
	ConnectionState["connecting"] = "connecting";
	ConnectionState["connected"] = "connected";
	ConnectionState["failed"] = "failed";
	return ConnectionState;
}({});
var AnimationType = /* @__PURE__ */ function(AnimationType) {
	AnimationType["idle"] = "idle";
	AnimationType["mono"] = "mono";
	return AnimationType;
}({});
var TransitionType = /* @__PURE__ */ function(TransitionType) {
	TransitionType["none"] = "none";
	TransitionType["linear"] = "linear";
	TransitionType["bezier"] = "bezier";
	return TransitionType;
}({});
var ConversationState = /* @__PURE__ */ function(ConversationState) {
	/** Idle state (breathing animation) */
	ConversationState["idle"] = "idle";
	/** Playing state */
	ConversationState["playing"] = "playing";
	/** Paused state */
	ConversationState["paused"] = "paused";
	return ConversationState;
}({});
/**
* @internal
*/
var AvatarState = /* @__PURE__ */ function(AvatarState) {
	AvatarState["idle"] = "idle";
	AvatarState["active"] = "active";
	AvatarState["playing"] = "playing";
	AvatarState["paused"] = "paused";
	return AvatarState;
}({});
var ErrorCode = /* @__PURE__ */ function(ErrorCode) {
	/** AppID not recognized (reserved, future appID validation logic) */
	ErrorCode["appIDUnrecognized"] = "appIDUnrecognized";
	/** Session Token invalid (WebSocket close code 4010) */
	ErrorCode["sessionTokenInvalid"] = "sessionTokenInvalid";
	/** Session Token expired (WebSocket close code 4010) */
	ErrorCode["sessionTokenExpired"] = "sessionTokenExpired";
	/** Insufficient balance (WebSocket close code 4001) */
	ErrorCode["insufficientBalance"] = "insufficientBalance";
	/** Concurrent connection limit exceeded (WebSocket close code 4003) */
	ErrorCode["concurrentLimitExceeded"] = "concurrentLimitExceeded";
	/** AvatarID not recognized */
	ErrorCode["avatarIDUnrecognized"] = "avatarIDUnrecognized";
	/** Failed to fetch avatar metadata */
	ErrorCode["failedToFetchAvatarMetadata"] = "failedToFetchAvatarMetadata";
	/** Avatar metadata format invalid / failed to parse */
	ErrorCode["invalidAvatarMetadata"] = "invalidAvatarMetadata";
	/** Failed to download avatar assets */
	ErrorCode["failedToDownloadAvatarAssets"] = "failedToDownloadAvatarAssets";
	/** Avatar asset compatibility_flags not supported by this SDK version (upgrade SDK) */
	ErrorCode["unsupportedAvatarAsset"] = "unsupportedAvatarAsset";
	/** WebSocket connection error (handshake failure, network error) */
	ErrorCode["websocketError"] = "websocketError";
	/** WebSocket connection closed abnormally (close code 1006) */
	ErrorCode["websocketClosedAbnormally"] = "websocketClosedAbnormally";
	/** WebSocket closed with unexpected close code */
	ErrorCode["websocketClosedUnexpected"] = "websocketClosedUnexpected";
	/** Session timeout (WebSocket close code 4002) */
	ErrorCode["sessionTimeout"] = "sessionTimeout";
	/** Connection already in progress */
	ErrorCode["connectionInProgress"] = "connectionInProgress";
	/** Network layer not available (SDK mode required) */
	ErrorCode["networkLayerNotAvailable"] = "networkLayerNotAvailable";
	/** Failed to start playback */
	ErrorCode["playbackStartFailed"] = "playbackStartFailed";
	/** Playback initialization failed */
	ErrorCode["playbackInitFailed"] = "playbackInitFailed";
	/** Audio-only playback initialization failed */
	ErrorCode["audioOnlyInitFailed"] = "audioOnlyInitFailed";
	/** No audio data to play */
	ErrorCode["noAudio"] = "noAudio";
	/**
	* Audio handed to the SDK does not match `audioFormat.inputAudioFormat`.
	* Raised for Opus input that is neither Ogg Opus nor a bare Opus packet
	* (e.g. WebM or MP4, which the SDK does not demux), is stereo, or switches
	* shape mid-conversation. The error message names the specific problem.
	*/
	ErrorCode["invalidAudioInput"] = "invalidAudioInput";
	/** Audio context not initialized */
	ErrorCode["audioContextNotInitialized"] = "audioContextNotInitialized";
	/** Animation player not initialized */
	ErrorCode["animationPlayerNotInitialized"] = "animationPlayerNotInitialized";
	/** Server-side error */
	ErrorCode["serverError"] = "serverError";
	return ErrorCode;
}({});
var AvatarError = class extends Error {
	code;
	constructor(message, code) {
		super(message);
		this.code = code;
		this.name = "AvatarError";
	}
};
//#endregion
//#region node_modules/.pnpm/posthog-js@1.422.5_react@19.2.4/node_modules/posthog-js/dist/module.js
var t = "undefined" != typeof window ? window : void 0;
var i = "undefined" != typeof globalThis ? globalThis : t;
var e = null == i ? void 0 : i.navigator;
var r = null == i ? void 0 : i.document;
var s = null == i ? void 0 : i.location;
var n = null == i ? void 0 : i.fetch;
var o = null != i && i.XMLHttpRequest && "withCredentials" in new i.XMLHttpRequest() ? i.XMLHttpRequest : void 0;
var a = null == i ? void 0 : i.AbortController;
var l = null == i ? void 0 : i.CompressionStream;
var h = null == e ? void 0 : e.userAgent;
function u() {
	return !(!t || !1 === t.navigator.onLine);
}
var d = "undefined" != typeof globalThis ? globalThis : t;
d && "undefined" == typeof self && (d.self = d), d && "undefined" == typeof File && (d.File = function() {});
var v = null != t ? t : {};
var c = {
	DEBUG: !1,
	LIB_VERSION: "0.7.0",
	LIB_NAME: "browser-common"
};
function f(t, i, e, r, s, n, o) {
	try {
		var a = t[n](o), l = a.value;
	} catch (t) {
		e(t);
		return;
	}
	a.done ? i(l) : Promise.resolve(l).then(r, s);
}
function p(t) {
	return function() {
		var i = this, e = arguments;
		return new Promise((function(r, s) {
			var n = t.apply(i, e);
			function o(t) {
				f(n, r, s, o, a, "next", t);
			}
			function a(t) {
				f(n, r, s, o, a, "throw", t);
			}
			o(void 0);
		}));
	};
}
function _() {
	return _ = Object.assign ? Object.assign.bind() : function(t) {
		for (var i = 1; arguments.length > i; i++) {
			var e = arguments[i];
			for (var r in e) ({}).hasOwnProperty.call(e, r) && (t[r] = e[r]);
		}
		return t;
	}, _.apply(null, arguments);
}
function g(t, i) {
	if (null == t) return {};
	var e = {};
	for (var r in t) if ({}.hasOwnProperty.call(t, r)) {
		if (-1 !== i.indexOf(r)) continue;
		e[r] = t[r];
	}
	return e;
}
var m = (t) => {
	if ("string" != typeof t) return t;
	try {
		return JSON.parse(t);
	} catch (i) {
		return t;
	}
};
function y(t) {
	return "string" == typeof t || t;
}
function b(t) {
	return "string" == typeof t ? t : void 0;
}
var w = [
	"$feature_flag",
	"$feature_flag_response",
	"$feature_flag_has_experiment",
	"$feature_flag_id",
	"$feature_flag_version",
	"$feature_flag_reason",
	"$feature_flag_request_id",
	"$feature_flag_evaluated_at",
	"$feature_flag_error",
	"locally_evaluated",
	"$groups",
	"$process_person_profile",
	"$geoip_disable",
	"$current_url",
	"$pathname",
	"$referring_domain",
	"utm_source",
	"utm_medium",
	"utm_campaign",
	"utm_content",
	"utm_term",
	"gad_source",
	"mc_cid",
	"gclid",
	"gclsrc",
	"dclid",
	"gbraid",
	"wbraid",
	"fbclid",
	"msclkid",
	"twclid",
	"li_fat_id",
	"igshid",
	"ttclid",
	"rdt_cid",
	"epik",
	"qclid",
	"sccid",
	"irclid",
	"_kx",
	"$session_id",
	"$window_id",
	"$lib",
	"$lib_version",
	"$device_id",
	"$is_server"
];
var x = function(t) {
	return t.AnonymousId = "anonymous_id", t.DistinctId = "distinct_id", t.Props = "props", t.EnablePersonProcessing = "enable_person_processing", t.PersonMode = "person_mode", t.FeatureFlagDetails = "feature_flag_details", t.FeatureFlags = "feature_flags", t.FeatureFlagPayloads = "feature_flag_payloads", t.BootstrapFeatureFlagDetails = "bootstrap_feature_flag_details", t.BootstrapFeatureFlags = "bootstrap_feature_flags", t.BootstrapFeatureFlagPayloads = "bootstrap_feature_flag_payloads", t.OverrideFeatureFlags = "override_feature_flags", t.Queue = "queue", t.AiQueue = "ai_queue", t.AiCaptureQueue = "ai_capture_queue", t.LogsQueue = "logs_queue", t.OptedOut = "opted_out", t.SessionId = "session_id", t.SessionStartTimestamp = "session_start_timestamp", t.SessionLastTimestamp = "session_timestamp", t.PersonProperties = "person_properties", t.GroupProperties = "group_properties", t.InstalledAppBuild = "installed_app_build", t.InstalledAppVersion = "installed_app_version", t.SessionReplay = "session_replay", t.PushRegistered = "push_registered", t.SessionReplayEventTriggerActivatedSession = "session_replay_event_trigger_activated_session", t.SurveyLastSeenDate = "survey_last_seen_date", t.SurveysSeen = "surveys_seen", t.Surveys = "surveys", t.RemoteConfig = "remote_config", t.FlagsEndpointWasHit = "flags_endpoint_was_hit", t.DeviceId = "device_id", t;
}({});
var E = function(t) {
	return t.GZipJS = "gzip-js", t.Base64 = "base64", t;
}({});
var S = [
	"$snapshot",
	"$pageview",
	"$pageleave",
	"$set",
	"survey dismissed",
	"survey sent",
	"survey shown",
	"$identify",
	"$groupidentify",
	"$create_alias",
	"$$client_ingestion_warning",
	"$web_experiment_applied",
	"$feature_enrollment_update",
	"$feature_flag_called"
];
var k = ["token"];
var T = 20;
var P = 1e3;
var R = 1e4;
var C = "[Circular]";
var O = "[Truncated]";
var I = "[Unserializable]";
var A = "[Function]";
function F(t) {
	for (var i = "", e = 0; t.length > e; e++) {
		var r = t.charCodeAt(e);
		if (55296 > r || r > 56319) i += 56320 > r || r > 57343 ? t[e] : "�";
		else {
			var s = t.charCodeAt(e + 1);
			56320 > s || s > 57343 ? i += "�" : (i += t[e] + t[e + 1], e++);
		}
	}
	return i;
}
var M = [
	"amazonbot",
	"amazonproductbot",
	"app.hypefactors.com",
	"applebot",
	"archive.org_bot",
	"awariobot",
	"backlinksextendedbot",
	"baiduspider",
	"bingbot",
	"bingpreview",
	"chrome-lighthouse",
	"dataforseobot",
	"deepscan",
	"duckduckbot",
	"facebookexternal",
	"facebookcatalog",
	"http://yandex.com/bots",
	"hubspot",
	"ia_archiver",
	"leikibot",
	"linkedinbot",
	"meta-externalagent",
	"mj12bot",
	"msnbot",
	"nessus",
	"petalbot",
	"pinterestbot",
	"prerender",
	"rogerbot",
	"screaming frog",
	"sebot-wa",
	"sitebulb",
	"slackbot",
	"slurp",
	"trendictionbot",
	"turnitin",
	"twitterbot",
	"vercel-screenshot",
	"vercelbot",
	"yahoo! slurp",
	"yandexbot",
	"zoombot",
	"bot.htm",
	"bot.php",
	"(bot;",
	"bot/",
	"crawler",
	"ahrefsbot",
	"ahrefssiteaudit",
	"semrushbot",
	"siteauditbot",
	"splitsignalbot",
	"gptbot",
	"oai-searchbot",
	"chatgpt-user",
	"perplexitybot",
	"better uptime bot",
	"sentryuptimebot",
	"uptimerobot",
	"headlesschrome",
	"cypress",
	"google-hoteladsverifier",
	"adsbot-google",
	"apis-google",
	"duplexweb-google",
	"feedfetcher-google",
	"google favicon",
	"google web preview",
	"google-read-aloud",
	"googlebot",
	"googleother",
	"google-cloudvertexbot",
	"googleweblight",
	"mediapartners-google",
	"storebot-google",
	"google-inspectiontool",
	"bytespider"
];
var D = function(t, i) {
	if (void 0 === i && (i = []), !t) return !1;
	var e = t.toLowerCase();
	return M.concat(i).some(((t) => {
		var i = t.toLowerCase();
		return -1 !== e.indexOf(i);
	}));
};
function N(t, i) {
	return -1 !== t.indexOf(i);
}
var L = function(t) {
	return t.trim();
};
var U = function(t) {
	return t.replace(/^\$/, "");
};
function j(t) {
	var i, e = [];
	return null !== (i = JSON.stringify(t, (function(t, i) {
		if ("bigint" == typeof i) return i.toString();
		if ("function" != typeof i && "symbol" != typeof i) {
			if (i instanceof Error) return {
				name: i.name,
				message: i.message,
				stack: i.stack
			};
			if (i && "object" == typeof i) {
				for (; e.length > 0 && e[e.length - 1] !== this;) e.pop();
				if (e.includes(i)) return "[Circular]";
				e.push(i);
			}
			return i;
		}
	}))) && void 0 !== i ? i : "null";
}
var B = Object.prototype;
var z = B.hasOwnProperty;
var q = B.toString;
var H = Array.isArray || function(t) {
	return "[object Array]" === q.call(t);
};
var V = (t) => "function" == typeof t;
var W = (t) => t === Object(t) && !H(t);
var G = (t) => {
	if (W(t)) {
		for (var i in t) if (z.call(t, i)) return !1;
		return !0;
	}
	return !1;
};
var K = (t) => void 0 === t;
var J = (t) => "[object String]" == q.call(t);
var Y = (t) => J(t) && 0 === t.trim().length;
var Q = (t) => null === t;
var X = (t) => K(t) || Q(t);
var Z = (t) => "[object Number]" == q.call(t) && t == t;
var tt = (t) => Z(t) && t > 0;
var it = (t) => "[object Boolean]" === q.call(t);
var et = (t) => t instanceof FormData;
var rt = (t) => N(S, t);
var st = (t) => N(k, t);
function nt(t) {
	return null === t || "object" != typeof t;
}
function ot(t, i) {
	return {}.toString.call(t) === "[object " + i + "]";
}
function at(t) {
	switch ({}.toString.call(t)) {
		case "[object Error]":
		case "[object Exception]":
		case "[object DOMException]":
		case "[object DOMError]":
		case "[object WebAssembly.Exception]": return !0;
		default: return ht(t, Error);
	}
}
function lt(t) {
	return "undefined" != typeof Event && ht(t, Event);
}
function ht(t, i) {
	try {
		return t instanceof i;
	} catch (t) {
		return !1;
	}
}
var ut = [
	!0,
	"true",
	1,
	"1",
	"yes"
];
var dt = (t) => N(ut, t);
var vt = [
	!1,
	"false",
	0,
	"0",
	"no"
];
function ct(t, i, e, r, s) {
	return i > e && (r.warn("min cannot be greater than max."), i = e), Z(t) ? t > e ? (r.warn(" cannot be  greater than max: " + e + ". Using max value instead."), e) : i > t ? (r.warn(" cannot be less than min: " + i + ". Using min value instead."), i) : t : (r.warn(" must be a number. using max or fallback. max: " + e + ", fallback: " + s), ct(s || e, i, e, r));
}
var ft = class {
	constructor(t) {
		this.k = {}, this.S = t.S, this.C = ct(t.bucketSize, 0, 100, t.I), this.R = ct(t.refillRate, 0, this.C, t.I), this.A = ct(t.refillInterval, 0, 864e5, t.I);
	}
	O(t, i) {
		var e = Math.floor((i - t.lastAccess) / this.A);
		e > 0 && (t.tokens = Math.min(t.tokens + e * this.R, this.C), t.lastAccess = t.lastAccess + e * this.A);
	}
	consumeRateLimit(t) {
		var i, e = Date.now(), r = String(t), s = this.k[r];
		return s ? this.O(s, e) : this.k[r] = s = {
			tokens: this.C,
			lastAccess: e
		}, 0 === s.tokens || (s.tokens--, 0 === s.tokens && (null == (i = this.S) || i.call(this, t)), 0 === s.tokens);
	}
	stop() {
		this.k = {};
	}
};
var pt = "Mobile";
var _t = "iOS";
var gt = "Android";
var mt = "Tablet";
var yt = gt + " " + mt;
var bt = "iPad";
var wt = "Apple";
var xt = wt + " Watch";
var Et = "Safari";
var St = "BlackBerry";
var kt = "Samsung";
var Tt = kt + "Browser";
var $t = kt + " Internet";
var Pt = "Chrome";
var Rt = Pt + " OS";
var Ct = Pt + " " + _t;
var Ot = "Internet Explorer";
var It = Ot + " " + pt;
var At = "Opera";
var Ft = At + " Mini";
var Mt = "Edge";
var Dt = "Microsoft " + Mt;
var Nt = "Firefox";
var Lt = Nt + " " + _t;
var Ut = "Nintendo";
var jt = "PlayStation";
var Bt = "Xbox";
var zt = gt + " " + pt;
var qt = pt + " " + Et;
var Ht = "Windows";
var Vt = Ht + " Phone";
var Wt = "Nokia";
var Gt = "Ouya";
var Kt = "Generic";
var Jt = Kt + " " + pt.toLowerCase();
var Yt = Kt + " " + mt.toLowerCase();
var Qt = "Konqueror";
var Xt = "Oculus Browser";
var Zt = "Vivaldi";
var ti = "Yandex";
var ii = "Whale";
var ei = "DuckDuckGo";
var ri = "Pale Moon";
var si = "Waterfox";
var ni = "Brave";
var oi = "Google Search App";
var ai = "(\\d+(\\.\\d+)?)";
var li = new RegExp("Version/" + ai);
var hi = new RegExp(Bt, "i");
var ui = new RegExp(jt + " \\w+", "i");
var di = new RegExp(Ut + " \\w+", "i");
var vi = new RegExp(St + "|PlayBook|BB10", "i");
var ci = {
	"NT3.51": "NT 3.11",
	"NT4.0": "NT 4.0",
	"5.0": "2000",
	5.1: "XP",
	5.2: "XP",
	"6.0": "Vista",
	6.1: "7",
	6.2: "8",
	6.3: "8.1",
	6.4: "10",
	"10.0": "10"
};
var fi = function(t, i, e, r) {
	i = i || "";
	return function(t) {
		return null != t && t.brave ? ni : null;
	}(e) || (null != r && r.detectGoogleSearchApp && N(t, "GSA/") ? oi : N(t, " OPR/") && N(t, "Mini") ? Ft : N(t, " OPR/") ? At : vi.test(t) ? St : N(t, "IE" + pt) || N(t, "WPDesktop") ? It : N(t, "OculusBrowser") ? Xt : N(t, Tt) ? $t : N(t, Mt) || N(t, "Edg/") ? Dt : N(t, Zt + "/") ? Zt : N(t, "YaBrowser/") ? ti : N(t, ii + "/") ? ii : N(t, ei + "/") || N(t, "Ddg/") ? ei : N(t, "FBIOS") ? "Facebook " + pt : N(t, "UCWEB") || N(t, "UCBrowser") ? "UC Browser" : N(t, "CriOS") ? Ct : N(t, "CrMo") || N(t, Pt) ? Pt : N(t, gt) && N(t, Et) ? zt : N(t, "FxiOS") ? Lt : N(t.toLowerCase(), Qt.toLowerCase()) ? Qt : N(t, ni + "/") ? ni : ((t, i) => i && N(i, wt) || function(t) {
		return N(t, Et) && !N(t, Pt) && !N(t, gt);
	}(t))(t, i) ? N(t, pt) ? qt : Et : N(t, "PaleMoon/") ? ri : N(t, si + "/") ? si : N(t, Nt) ? Nt : N(t, "MSIE") || N(t, "Trident/") ? Ot : N(t, "Gecko") ? Nt : "");
};
var pi = {
	[It]: [new RegExp("rv:" + ai)],
	[Dt]: [new RegExp(Mt + "?\\/" + ai)],
	[Pt]: [new RegExp("(" + Pt + "|CrMo)\\/" + ai)],
	[Ct]: [new RegExp("CriOS\\/" + ai)],
	"UC Browser": [new RegExp("(UCBrowser|UCWEB)\\/" + ai)],
	[Et]: [li],
	[qt]: [li],
	[At]: [new RegExp("(Opera|OPR)\\/" + ai)],
	[Nt]: [new RegExp(Nt + "\\/" + ai)],
	[Lt]: [new RegExp("FxiOS\\/" + ai)],
	[Qt]: [new RegExp("Konqueror[:/]?" + ai, "i")],
	[St]: [new RegExp(St + " " + ai), li],
	[zt]: [new RegExp("android\\s" + ai, "i")],
	[$t]: [new RegExp(Tt + "\\/" + ai)],
	[Xt]: [new RegExp("OculusBrowser\\/" + ai)],
	[Zt]: [new RegExp(Zt + "\\/" + ai)],
	[ti]: [new RegExp("YaBrowser\\/" + ai)],
	[ii]: [new RegExp(ii + "\\/" + ai)],
	[ni]: [new RegExp(ni + "\\/" + ai)],
	[ei]: [new RegExp("(DuckDuckGo|Ddg)\\/" + ai)],
	[ri]: [new RegExp("PaleMoon\\/" + ai)],
	[si]: [new RegExp(si + "\\/" + ai)],
	[oi]: [new RegExp("GSA\\/" + ai)],
	[Ot]: [new RegExp("(rv:|MSIE )" + ai)],
	Mozilla: [new RegExp("rv:" + ai)]
};
var _i = function(t, i, e, r) {
	var n = pi[fi(t, i, e, r)];
	if (K(n)) return null;
	for (var o = 0; n.length > o; o++) {
		var a = t.match(n[o]);
		if (a) return parseFloat(a[a.length - 2]);
	}
	return null;
};
var gi = [
	[new RegExp(Bt + "; " + Bt + " (.*?)[);]", "i"), (t) => [Bt, t && t[1] || ""]],
	[new RegExp(Ut, "i"), [Ut, ""]],
	[new RegExp(jt, "i"), [jt, ""]],
	[vi, [St, ""]],
	[new RegExp(Ht, "i"), (t, i) => {
		if (/Phone/.test(i) || /WPDesktop/.test(i)) return [Vt, ""];
		if (new RegExp(pt).test(i) && !/IEMobile\b/.test(i)) return [Ht + " " + pt, ""];
		var e = /Windows NT ([0-9.]+)/i.exec(i);
		if (e && e[1]) {
			var r = ci[e[1]] || "";
			return /arm/i.test(i) && (r = "RT"), [Ht, r];
		}
		return [Ht, ""];
	}],
	[/((iPhone|iPad|iPod).*?OS (\d+)_(\d+)_?(\d+)?|iPhone)/, (t) => t && t[3] ? [_t, [
		t[3],
		t[4],
		t[5] || "0"
	].join(".")] : [_t, ""]],
	[/(watch.*\/(\d+\.\d+\.\d+)|watch os,(\d+\.\d+),)/i, (t) => {
		var i = "";
		return t && t.length >= 3 && (i = K(t[2]) ? t[3] : t[2]), ["watchOS", i];
	}],
	[new RegExp("(" + gt + " (\\d+)\\.(\\d+)\\.?(\\d+)?|" + gt + ")", "i"), (t) => t && t[2] ? [gt, [
		t[2],
		t[3],
		t[4] || "0"
	].join(".")] : [gt, ""]],
	[/Mac OS X (\d+)[_.](\d+)[_.]?(\d+)?/i, (t) => {
		var i = ["Mac OS X", ""];
		return t && t[1] && (i[1] = [
			t[1],
			t[2],
			t[3] || "0"
		].join(".")), i;
	}],
	[/Mac/i, ["Mac OS X", ""]],
	[/CrOS/, [Rt, ""]],
	[/Linux|debian/i, ["Linux", ""]]
];
var mi = function(t) {
	return di.test(t) ? Ut : ui.test(t) ? jt : hi.test(t) ? Bt : new RegExp(Gt, "i").test(t) ? Gt : new RegExp("(" + Vt + "|WPDesktop)", "i").test(t) ? Vt : /iPad/.test(t) ? bt : /iPod/.test(t) ? "iPod Touch" : /iPhone/.test(t) ? "iPhone" : /(watch)(?: ?os[,/]|\d,\d\/)[\d.]+/i.test(t) ? xt : vi.test(t) ? St : /(kobo)\s(ereader|touch)/i.test(t) ? "Kobo" : new RegExp(Wt, "i").test(t) ? Wt : /(kf[a-z]{2}wi|aeo[c-r]{2})( bui|\))/i.test(t) || /(kf[a-z]+)( bui|\)).+silk\//i.test(t) ? "Kindle Fire" : /(Android|ZTE)/i.test(t) ? new RegExp(pt).test(t) && !/(9138B|TB782B|Nexus [97]|pixel c|HUAWEISHT|BTV|noble nook|smart ultra 6)/i.test(t) || /pixel[\daxl ]{1,6}/i.test(t) && !/pixel c/i.test(t) || /(huaweimed-al00|tah-|APA|SM-G92|i980|zte|U304AA)/i.test(t) || /lmy47v/i.test(t) && !/QTAQZ3/i.test(t) ? gt : yt : new RegExp("(pda|" + pt + ")", "i").test(t) ? Jt : new RegExp(mt, "i").test(t) && !new RegExp(mt + " pc", "i").test(t) ? Yt : "";
};
var yi = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function bi(t, i) {
	return "string" == typeof (e = t) && yi.test(e) ? t : i();
	var e;
}
function wi(t, i) {
	var e = new Error(i);
	try {
		Object.defineProperty(e, "name", {
			value: t,
			writable: !0,
			enumerable: !0,
			configurable: !0
		});
	} catch (t) {}
	return e;
}
function xi(t) {
	return t ? t.split("#")[0] : t;
}
function Ei(t, i) {
	var e = setTimeout(t, i);
	return null != e && e.unref && e?.unref(), e;
}
function Si(t, i, e) {
	return ki.apply(this, arguments);
}
function ki() {
	return (ki = p((function* (t, i, e) {
		var r;
		try {
			return yield Promise.race([t, new Promise(((t, s) => {
				r = Ei((() => {
					try {
						e?.(), t();
					} catch (t) {
						s(t);
					}
				}), i);
			}))]);
		} finally {
			clearTimeout(r);
		}
	}))).apply(this, arguments);
}
var Ti;
var $i = "NativeGzipValidationError";
var Pi = (t) => t.length >= 2 && 31 === t[0] && 139 === t[1];
var Ri = (t, i) => t === E.GZipJS || i === E.GZipJS || "gzip" === i;
var Ci = (t) => !(!t || "object" != typeof t) && "NotReadableError" === ("name" in t ? String(t.name) : "");
var Oi = (t) => {
	throw wi($i, "Native gzip produced invalid output: " + t);
};
var Ii = function() {
	var t = p((function* (t, i) {
		18 > t.size && Oi("too-short");
		var e = new Uint8Array(yield t.slice(0, 10).arrayBuffer());
		Pi(e) && 8 === e[2] || Oi("invalid-header");
		var r = new DataView(yield t.slice(t.size - 8).arrayBuffer());
		r.getUint32(0, !0) !== ((t) => {
			for (var i = (() => {
				if (Ti) return Ti;
				Ti = [];
				for (var t = 0; 256 > t; t++) {
					for (var i = t, e = 0; 8 > e; e++) i = 1 & i ? 3988292384 ^ i >>> 1 : i >>> 1;
					Ti[t] = i >>> 0;
				}
				return Ti;
			})(), e = 4294967295, r = 0; t.length > r; r++) e = i[255 & (e ^ t[r])] ^ e >>> 8;
			return (4294967295 ^ e) >>> 0;
		})(i) && Oi("invalid-crc");
		var s = i.length >>> 0;
		r.getUint32(4, !0) !== s && Oi("invalid-size");
	}));
	return function(i, e) {
		return t.apply(this, arguments);
	};
}();
function Ai() {
	return Ai = p((function* (t, i, e) {
		void 0 === i && (i = !0);
		try {
			var r = new TextEncoder().encode(t), s = new globalThis.CompressionStream("gzip"), n = s.writable.getWriter(), o = n.write(r).then((() => n.close())).catch(function() {
				var t = p((function* (t) {
					try {
						yield n.abort(t);
					} catch (t) {}
					throw t;
				}));
				return function(i) {
					return t.apply(this, arguments);
				};
			}()), a = new Response(s.readable).blob(), l = (yield Promise.all([a, o]))[0];
			return yield Ii(l, r), l;
		} catch (t) {
			if (null != e && e.rethrow) throw t;
			return i && console.error("Failed to gzip compress data", t), null;
		}
	})), Ai.apply(this, arguments);
}
var Fi = {
	trace: {
		text: "TRACE",
		number: 1
	},
	debug: {
		text: "DEBUG",
		number: 5
	},
	info: {
		text: "INFO",
		number: 9
	},
	warn: {
		text: "WARN",
		number: 13
	},
	error: {
		text: "ERROR",
		number: 17
	},
	fatal: {
		text: "FATAL",
		number: 21
	}
};
var Mi = Fi.info;
var Di = 0x8000000000000000;
var Ni = {}.propertyIsEnumerable;
function Li(t, i) {
	try {
		return Bi(t, i, {
			ancestors: /* @__PURE__ */ new WeakSet(),
			remainingNodes: R
		}, 0);
	} catch (t) {
		return [];
	}
}
function Ui(t, i, e, r) {
	if (0 >= e.remainingNodes) return { stringValue: O };
	if (e.remainingNodes--, it(t)) return { boolValue: t };
	if ("number" == typeof t) {
		if (!Number.isFinite(t)) return { stringValue: String(t) };
		if (Number.isInteger(t)) {
			if (Number.isSafeInteger(t)) return { intValue: String(t) };
			if ("undefined" == typeof BigInt) return { stringValue: String(t) };
			var s = BigInt(t).toString();
			return t >= Di || -Di > t ? (i?.debug("Attribute " + s + " is outside the int64 range; encoding it as a string"), { stringValue: s }) : { intValue: s };
		}
		return { doubleValue: t };
	}
	if ("string" == typeof t) return { stringValue: F(t) };
	if ("function" == typeof t) return { stringValue: A };
	if ("symbol" == typeof t) return { stringValue: String(t) };
	if ("object" == typeof t && null !== t) {
		if (e.ancestors.has(t)) return { stringValue: C };
		if (r >= T) return { stringValue: O };
		if (t instanceof Date) {
			var n = t.getTime(), o = Number.isFinite(n) ? t.toISOString() : String(t);
			return { stringValue: "string" == typeof o ? F(o) : String(o) };
		}
		e.ancestors.add(t);
		try {
			try {
				var a = t.toJSON;
				if ("function" == typeof a) return Ui(a.call(t), i, e, r + 1);
			} catch (t) {}
			return H(t) ? { arrayValue: { values: ji(t, i, e, r + 1) } } : { kvlistValue: { values: Bi(t, i, e, r + 1) } };
		} finally {
			e.ancestors.delete(t);
		}
	}
	return { stringValue: F(String(t)) };
}
function ji(t, i, e, r) {
	for (var s = [], n = Math.min(t.length, P), o = 0; n > o && e.remainingNodes > 0; o++) try {
		var a = o in t ? t[o] : void 0;
		if (X(a)) continue;
		s.push(Ui(a, i, e, r));
	} catch (t) {
		s.push({ stringValue: I });
	}
	return t.length > o && s.push({ stringValue: O }), s;
}
function Bi(t, i, e, r) {
	var s = [];
	for (var n in t) if (Ni.call(t, n)) {
		if (s.length >= P || 0 >= e.remainingNodes) {
			i?.debug("Attributes truncated: the value exceeds the OTLP encoder budget");
			break;
		}
		try {
			var o = t[n];
			if (Q(o) || K(o)) continue;
			s.push({
				key: F(n),
				value: Ui(o, i, e, r)
			});
		} catch (t) {
			s.push({
				key: F(n),
				value: { stringValue: I }
			});
		}
	}
	return s;
}
function zi(t) {
	try {
		return F(String(t));
	} catch (t) {
		return I;
	}
}
function qi(t, i, e, r) {
	var s, n = Fi[t.level || "info"] || Mi, o = n.text, a = n.number, l = (void 0 === (s = Z(r) ? r : void 0) && (s = Date.now()), String(s) + "000000"), h = {};
	i.distinctId && (h.posthogDistinctId = i.distinctId), i.sessionId && (h.sessionId = i.sessionId), i.windowId && (h["window.id"] = i.windowId), X(i.sessionStartTimestamp) || (h.sessionStartTimestamp = String(i.sessionStartTimestamp)), X(i.lastActivityTimestamp) || (h.lastActivityTimestamp = String(i.lastActivityTimestamp)), i.currentUrl && (h["url.full"] = i.currentUrl), i.screenName && (h["screen.name"] = i.screenName), i.appState && (h["app.state"] = i.appState), i.activeFeatureFlags && i.activeFeatureFlags.length > 0 && (h.feature_flags = i.activeFeatureFlags);
	var u = _({}, h), d = t.attributes;
	if (d) {
		var v = [];
		try {
			v = Object.keys(d);
		} catch (t) {
			v = [];
		}
		for (var c of v) {
			var f = void 0;
			try {
				f = d[c];
			} catch (t) {
				f = I;
			}
			Object.defineProperty(u, c, {
				value: f,
				enumerable: !0,
				writable: !0,
				configurable: !0
			});
		}
	}
	var p = {
		timeUnixNano: l,
		observedTimeUnixNano: l,
		severityNumber: a,
		severityText: o,
		body: { stringValue: zi(t.body) },
		attributes: Li(u, e)
	};
	return t.trace_id && (p.traceId = t.trace_id), t.span_id && (p.spanId = t.span_id), K(t.trace_flags) || (p.flags = t.trace_flags), p;
}
function Hi(t, i, e) {
	return _({}, t.resourceAttributes, { "service.name": t.serviceName || "unknown_service" }, t.environment && { "deployment.environment": t.environment }, t.serviceVersion && { "service.version": t.serviceVersion }, {
		"telemetry.sdk.name": i,
		"telemetry.sdk.version": e
	});
}
function Vi(t, i, e, r) {
	return { resourceLogs: [{
		resource: { attributes: Li(i) },
		scopeLogs: [{
			scope: {
				name: e,
				version: r
			},
			logRecords: t
		}]
	}] };
}
var Wi = class {
	constructor(t, i, e, r, s, n, o) {
		var a;
		void 0 === n && (n = () => Promise.resolve()), this._instance = t, this.vn = i, this.I = e, this.Pn = r, this.An = s, this.Fn = n, this.On = o, this.Ln = null, this.Dn = 0, this.$n = 0, this.Nn = 0, this.qn = 0, this.jn = 0, this.Bn = !1, this.Hn = i.maxBufferSize, this.zn = Math.max(null !== (a = i.maxQueueSize) && void 0 !== a ? a : i.maxBufferSize, i.maxBufferSize), this.Un = i.flushIntervalMs, this.Wn = i.maxBatchRecordsPerPost, this.Vn = i.rateCapWindowMs, this.Gn = i.maxLogsPerInterval;
	}
	clearQueue() {
		this.$n++, this._instance.setPersistedProperty(x.LogsQueue, []);
	}
	reset() {
		this.Zn(), this.qn = 0, this.jn = 0, this.Bn = !1, this.Nn = 0, this.Wn = this.vn.maxBatchRecordsPerPost;
	}
	onReconnect() {
		this.Nn = 0, this.Qn();
	}
	captureLog(t, i) {
		var e;
		if (!this._instance.isDisabled && !this._instance.optedOut && null != t && t.body) {
			var r = this.Jn(t);
			if (null !== r) if (r.body) {
				if (this.Kn()) {
					var s = { record: qi(r, null !== (e = null == i ? void 0 : i.context) && void 0 !== e ? e : this.Pn(), this.I, null == i ? void 0 : i.occurredAtMs) };
					this.An((() => this.Yn(s)));
				}
			} else this.I.info("Log was rejected in beforeSend function");
		}
	}
	Jn(t) {
		var i = this.vn.beforeSend;
		if (!i) return t;
		var e = H(i) ? i : [i], r = t;
		for (var s of e) try {
			var n = s(r);
			if (!n) return this.I.info("Log was rejected in beforeSend function"), null;
			r = n;
		} catch (t) {
			return this.I.error("Error in beforeSend function for log:", t), null;
		}
		return r;
	}
	Kn() {
		if (void 0 === this.Gn) return !0;
		var t = Date.now(), i = t - this.qn;
		return this.Vn > i && i >= 0 || (this.qn = t, this.jn = 0, this.Bn = !1), this.Gn > this.jn ? (this.jn++, !0) : (this.Bn || (this.I.warn("captureLog dropping logs: exceeded " + this.Gn + " logs per " + this.Vn + "ms"), this.Bn = !0), !1);
	}
	flush() {
		var t = this;
		return p((function* () {
			if (!t._instance.isDisabled) return t.Ln || (t.Ln = t.Xn().finally((() => {
				t.Ln = null;
			}))), t.Ln;
		}))();
	}
	Xn() {
		var t = this;
		return p((function* () {
			var i;
			t.Zn();
			var e = null !== (i = t._instance.getPersistedProperty(x.LogsQueue)) && void 0 !== i ? i : [];
			if (0 !== e.length) for (var r = e.length, s = 0; e.length > 0 && r > s;) {
				var n, o, a = t.$n;
				t.Dn = 0;
				var h = e.slice(0, Math.min(e.length, t.Wn)), u = Vi(h.map(((t) => t.record)), t.ts(), null !== (n = t.On) && void 0 !== n ? n : t._instance.getLibraryId(), t._instance.getLibraryVersion()), d = yield t._instance.es(u);
				if (t.$n !== a) return;
				if ("too-large" === d.kind && h.length > 1) t.Wn = Math.max(1, Math.floor(h.length / 2)), t.I.warn("Received 413 when sending logs batch of size " + h.length + ", reducing batch size to " + t.Wn);
				else {
					if ("retry-later" === d.kind) throw d.error;
					if ("too-large" === d.kind ? t.I.warn("Dropping a single log record after 413 with batch size 1 — the record is larger than the server cap and cannot be split further.") : "ok" === d.kind && t.vn.maxBatchRecordsPerPost > t.Wn && (t.Wn = Math.min(t.vn.maxBatchRecordsPerPost, t.Wn + 1)), yield t.rs(h.length), e = null !== (o = t._instance.getPersistedProperty(x.LogsQueue)) && void 0 !== o ? o : [], s += h.length, "fatal" === d.kind) throw d.error;
				}
			}
		}))();
	}
	rs(t) {
		var i = this;
		return p((function* () {
			var e, r = Math.max(0, t - i.Dn), s = null !== (e = i._instance.getPersistedProperty(x.LogsQueue)) && void 0 !== e ? e : [];
			i._instance.setPersistedProperty(x.LogsQueue, s.slice(r)), yield i.Fn();
		}))();
	}
	ts() {
		return Hi(this.vn, this._instance.getLibraryId(), this._instance.getLibraryVersion());
	}
	Yn(t) {
		var i;
		if (!this._instance.optedOut) {
			var e = null !== (i = this._instance.getPersistedProperty(x.LogsQueue)) && void 0 !== i ? i : [];
			this.zn > e.length || (e.shift(), this.Dn++, this.I.info("Logs queue is full, dropping oldest record.")), e.push(t), this._instance.setPersistedProperty(x.LogsQueue, e), this.Hn > e.length ? this.ns() : this.Qn();
		}
	}
	ns(t) {
		void 0 === t && (t = this.Un), this.ss || (this.ss = Ei((() => {
			this.ss = void 0, this.Qn();
		}), t));
	}
	os() {
		var t = Math.min(Math.max(0, this.Nn - 1), 6);
		return this.Un * Math.pow(2, t);
	}
	ls() {
		var t = this._instance.getPersistedProperty(x.LogsQueue);
		return !!t && t.length > 0;
	}
	shutdown(t) {
		var i = this;
		return p((function* () {
			i.Zn();
			var e = i.flush().catch((() => {}));
			void 0 !== t ? yield Si(e, t) : yield e;
		}))();
	}
	flushWithTimeout(t) {
		var i = this;
		return p((function* () {
			var e = i.flush();
			yield Si(e, t, (() => {
				e.catch((() => {}));
			}));
		}))();
	}
	Qn() {
		this.flush().then((() => {
			this.Nn = 0;
		}), ((t) => {
			this.Nn++, this.I.error("PostHog logs flush failed:", t);
		})).finally((() => {
			!this._instance.isDisabled && this.ls() && this.ns(this.os());
		}));
	}
	Zn() {
		this.ss && (clearTimeout(this.ss), this.ss = void 0);
	}
};
var Gi = [
	0,
	5,
	10,
	25,
	50,
	75,
	100,
	250,
	500,
	750,
	1e3,
	2500,
	5e3,
	7500,
	1e4
];
function Ki(t) {
	return String(t) + "000000";
}
function Ji(t, i, e, r) {
	var s = "";
	return r && (s = Object.keys(r).sort().map(((t) => JSON.stringify(t) + ":" + JSON.stringify(r[t]))).join(",")), t + "\0" + i + "\0" + (null != e ? e : "") + "\0" + s;
}
var Yi = class {
	constructor(t, i, e) {
		this._instance = t, this.vn = i, this.I = e, this.us = /* @__PURE__ */ new Map(), this.Ln = null, this.hs = !1, this.ds = /* @__PURE__ */ new Map(), this.vs = /* @__PURE__ */ new Set(), this.cs = 0;
	}
	count(t, i, e) {
		void 0 === i && (i = 1), this.fs({
			name: t,
			type: "count",
			value: i,
			unit: null == e ? void 0 : e.unit,
			attributes: null == e ? void 0 : e.attributes
		});
	}
	gauge(t, i, e) {
		this.fs({
			name: t,
			type: "gauge",
			value: i,
			unit: null == e ? void 0 : e.unit,
			attributes: null == e ? void 0 : e.attributes
		});
	}
	histogram(t, i, e) {
		this.fs({
			name: t,
			type: "histogram",
			value: i,
			unit: null == e ? void 0 : e.unit,
			attributes: null == e ? void 0 : e.attributes
		});
	}
	flush() {
		var t = this, i = this.Ln, r = function() {
			var e = p((function* () {
				i && (yield i.catch((() => {}))), yield t.ps();
			}));
			return function() {
				return e.apply(this, arguments);
			};
		}()().finally((() => {
			this.Ln === r && (this.Ln = null);
		}));
		return this.Ln = r, r;
	}
	drainWindow() {
		if (0 === this.us.size) return null;
		var t = this.us;
		return this.us = /* @__PURE__ */ new Map(), this.hs = !1, this.ds = /* @__PURE__ */ new Map(), this.vs = /* @__PURE__ */ new Set(), this.gs(t);
	}
	reset() {
		this.cs++, this.Zn(), this.us = /* @__PURE__ */ new Map(), this.Ln = null, this.hs = !1, this.ds = /* @__PURE__ */ new Map(), this.vs = /* @__PURE__ */ new Set();
	}
	fs(t) {
		if (!this._instance.isDisabled && !this._instance.optedOut) {
			var i = this.Jn(t);
			if (null !== i) if (i.name && "string" == typeof i.name) if ("number" == typeof i.value && Number.isFinite(i.value)) if ("count" === i.type && 0 > i.value) this.I.warn("Dropping count '" + i.name + "': counters are monotonic, value must be >= 0");
			else {
				var e, r;
				try {
					e = i.attributes ? _({}, i.attributes) : void 0, r = Ji(i.type, i.name, i.unit, e);
				} catch (t) {
					this.I.warn("Dropping metric '" + i.name + "': attributes could not be serialized", t);
					return;
				}
				var s = this.us.get(r);
				if (!s) {
					if (!this.ys()) return;
					s = {
						name: i.name,
						type: i.type,
						unit: i.unit,
						attributes: e,
						windowStartMs: Date.now()
					}, this.us.set(r, s);
				}
				var n = this.ds.get(i.name);
				void 0 === n ? this.ds.set(i.name, i.type) : n === i.type || this.vs.has(i.name) || (this.vs.add(i.name), this.I.warn("Metric name '" + i.name + "' is already used as a " + n + "; recording it as a " + i.type + " too will blend both series in charts. Use a distinct name.")), this.bs(s, i.value), this.ns();
			}
			else this.I.warn("Dropping metric '" + i.name + "': value must be a finite number");
			else this.I.warn("Dropping metric with empty name");
		}
	}
	ys() {
		return this.vn.maxSeriesPerFlush > this.us.size || (this.hs || (this.hs = !0, this.I.warn("Metric series cap reached (" + this.vn.maxSeriesPerFlush + " per flush window); dropping new series until the next flush. Reduce attribute cardinality.")), !1);
	}
	bs(t, i) {
		var e;
		switch (t.type) {
			case "count":
				t.total = (null !== (e = t.total) && void 0 !== e ? e : 0) + i;
				break;
			case "gauge":
				t.last = i;
				break;
			case "histogram":
				t.hist || (t.hist = {
					count: 0,
					sum: 0,
					min: i,
					max: i,
					bucketCounts: new Array(Gi.length + 1).fill(0)
				});
				var r = t.hist;
				r.count += 1, r.sum += i, r.min = Math.min(r.min, i), r.max = Math.max(r.max, i), r.bucketCounts[function(t, i) {
					for (var e = 0; i.length > e; e++) if (i[e] >= t) return e;
					return i.length;
				}(i, Gi)] += 1;
		}
	}
	Jn(t) {
		var i = this.vn.beforeSend;
		if (!i) return t;
		var e = H(i) ? i : [i], r = t;
		for (var s of e) try {
			var n = s(r);
			if (!n) return this.I.info("Metric was rejected in beforeSend function"), null;
			r = n;
		} catch (t) {
			return this.I.error("Error in beforeSend function for metric:", t), null;
		}
		return r;
	}
	ns() {
		this.ss || (this.ss = Ei((() => {
			this.ss = void 0, this.flush().catch(((t) => {
				this.I.error("Metrics flush failed:", t);
			}));
		}), this.vn.flushIntervalMs));
	}
	Zn() {
		this.ss && (clearTimeout(this.ss), this.ss = void 0);
	}
	ps() {
		var t = this;
		return p((function* () {
			if (0 !== t.us.size) {
				var i = t.us;
				t.us = /* @__PURE__ */ new Map(), t.hs = !1, t.ds = /* @__PURE__ */ new Map(), t.vs = /* @__PURE__ */ new Set();
				var e = t.cs, r = yield t._instance._s(t.gs(i));
				if (e === t.cs) switch (r.kind) {
					case "ok": return;
					case "retry-later":
						t.ws(i), t.ns();
						return;
					case "too-large":
						t.I.warn("Metrics batch exceeded the server size limit and was dropped");
						return;
					case "fatal":
						t.I.error("Failed to send metrics batch:", r.error);
						return;
				}
			}
		}))();
	}
	gs(t) {
		return i = this.ks(t), e = function(t, i, e) {
			return _({}, t.resourceAttributes, { "service.name": t.serviceName || "unknown_service" }, t.environment && { "deployment.environment": t.environment }, t.serviceVersion && { "service.version": t.serviceVersion }, {
				"telemetry.sdk.name": i,
				"telemetry.sdk.version": e
			});
		}(this.vn, this._instance.getLibraryId(), this._instance.getLibraryVersion()), r = this._instance.getLibraryId(), s = this._instance.getLibraryVersion(), { resourceMetrics: [{
			resource: { attributes: Li(e) },
			scopeMetrics: [{
				scope: {
					name: r,
					version: s
				},
				metrics: i
			}]
		}] };
		var i, e, r, s;
	}
	ks(t) {
		var i = Ki(Date.now()), e = /* @__PURE__ */ new Map();
		for (var r of t.values()) {
			var s, n = Ji(r.type, r.name, r.unit, void 0), o = e.get(n);
			o || (o = _({ name: r.name }, r.unit && { unit: r.unit }), "count" === r.type ? o.sum = {
				aggregationTemporality: 1,
				isMonotonic: !0,
				dataPoints: []
			} : "gauge" === r.type ? o.gauge = { dataPoints: [] } : o.histogram = {
				aggregationTemporality: 1,
				dataPoints: []
			}, e.set(n, o));
			var a = Li(null !== (s = r.attributes) && void 0 !== s ? s : {}, this.I), l = Ki(r.windowStartMs);
			if ("count" === r.type) {
				var h, u = {
					attributes: a,
					startTimeUnixNano: l,
					timeUnixNano: i,
					asDouble: null !== (h = r.total) && void 0 !== h ? h : 0
				};
				o.sum.dataPoints.push(u);
			} else if ("gauge" === r.type) {
				var d, v = {
					attributes: a,
					timeUnixNano: i,
					asDouble: null !== (d = r.last) && void 0 !== d ? d : 0
				};
				o.gauge.dataPoints.push(v);
			} else r.hist && o.histogram.dataPoints.push({
				attributes: a,
				startTimeUnixNano: l,
				timeUnixNano: i,
				count: r.hist.count,
				sum: r.hist.sum,
				min: r.hist.min,
				max: r.hist.max,
				bucketCounts: r.hist.bucketCounts,
				explicitBounds: Gi
			});
		}
		return Array.from(e.values());
	}
	ws(t) {
		var i, e;
		for (var r of t) {
			var s = r[0], n = r[1], o = this.us.get(s);
			if (o) switch (o.windowStartMs = Math.min(o.windowStartMs, n.windowStartMs), o.type) {
				case "count":
					o.total = (null !== (i = o.total) && void 0 !== i ? i : 0) + (null !== (e = n.total) && void 0 !== e ? e : 0);
					break;
				case "gauge": break;
				case "histogram": if (n.hist) if (o.hist) {
					o.hist.count += n.hist.count, o.hist.sum += n.hist.sum, o.hist.min = Math.min(o.hist.min, n.hist.min), o.hist.max = Math.max(o.hist.max, n.hist.max);
					for (var a = 0; o.hist.bucketCounts.length > a; a++) o.hist.bucketCounts[a] += n.hist.bucketCounts[a];
				} else o.hist = n.hist;
			}
			else this.ys() && this.us.set(s, n);
		}
	}
};
var Qi;
var Xi;
var Zi;
function te(t) {
	var i = globalThis._posthogChunkIds;
	if (i) {
		var e = Object.keys(i);
		return Zi && e.length === Xi || (Xi = e.length, Zi = e.reduce(((e, r) => {
			Qi || (Qi = {});
			var s = Qi[r];
			if (s) e[s[0]] = s[1];
			else for (var n = t(r), o = n.length - 1; o >= 0; o--) {
				var a = n[o], l = null == a ? void 0 : a.filename, h = i[r];
				if (l && h) {
					e[l] = h, Qi[r] = [l, h];
					break;
				}
			}
			return e;
		}), {})), Zi;
	}
}
var ie = class {
	constructor(t, i, e) {
		void 0 === e && (e = []), this.coercers = t, this.stackParser = i, this.modifiers = e;
	}
	buildFromUnknown(t, i) {
		void 0 === i && (i = {});
		var e = i && i.mechanism || {
			handled: !0,
			type: "generic"
		}, r = this.buildCoercingContext(e, i, 0).apply(t), s = this.buildParsingContext(i), n = this.parseStacktrace(r, s);
		return {
			$exception_list: this.convertToExceptionList(n, e),
			$exception_level: "error"
		};
	}
	modifyFrames(t) {
		var i = this;
		return p((function* () {
			for (var e of t) e.stacktrace && e.stacktrace.frames && H(e.stacktrace.frames) && (e.stacktrace.frames = yield i.applyModifiers(e.stacktrace.frames));
			return t;
		}))();
	}
	coerceFallback(t) {
		var i;
		return {
			type: "Error",
			value: "Unknown error",
			stack: null == (i = t.syntheticException) ? void 0 : i.stack,
			synthetic: !0
		};
	}
	parseStacktrace(t, i) {
		var e, r;
		return null != t.cause && (e = this.parseStacktrace(t.cause, i)), "" != t.stack && null != t.stack && (r = this.applyChunkIds(this.stackParser(t.stack, t.synthetic ? i.skipFirstLines : 0), i.chunkIdMap)), _({}, t, {
			cause: e,
			stack: r
		});
	}
	applyChunkIds(t, i) {
		return t.map(((t) => (t.filename && i && (t.chunk_id = i[t.filename]), t)));
	}
	applyCoercers(t, i) {
		for (var e of this.coercers) if (e.match(t)) return e.coerce(t, i);
		return this.coerceFallback(i);
	}
	applyModifiers(t) {
		var i = this;
		return p((function* () {
			var e = t;
			for (var r of i.modifiers) e = yield r(e);
			return e;
		}))();
	}
	convertToExceptionList(t, i) {
		var e, r, s, n = {
			type: t.type,
			value: t.value,
			mechanism: {
				type: null !== (e = i.type) && void 0 !== e ? e : "generic",
				handled: null === (r = i.handled) || void 0 === r || r,
				synthetic: null !== (s = t.synthetic) && void 0 !== s && s
			}
		};
		t.stack && (n.stacktrace = {
			type: "raw",
			frames: t.stack
		});
		var o = [n];
		return null != t.cause && o.push(...this.convertToExceptionList(t.cause, _({}, i, { handled: !0 }))), o;
	}
	buildParsingContext(t) {
		var i;
		return {
			chunkIdMap: te(this.stackParser),
			skipFirstLines: null !== (i = t.skipFirstLines) && void 0 !== i ? i : 1
		};
	}
	buildCoercingContext(t, i, e) {
		void 0 === e && (e = 0);
		var r = (e, r) => {
			if (4 >= r) {
				var s = this.buildCoercingContext(t, i, r);
				return this.applyCoercers(e, s);
			}
		};
		return _({}, i, {
			syntheticException: 0 == e ? i.syntheticException : void 0,
			mechanism: t,
			apply: (t) => r(t, e),
			next: (t) => r(t, e + 1)
		});
	}
};
var ee = "?";
function re$1(t, i, e, r, s) {
	var n = {
		platform: t,
		filename: i,
		function: "<anonymous>" === e ? ee : e,
		in_app: !(null != i && i.startsWith("webkit-masked-url://")) && "<anonymous>" !== i
	};
	return K(r) || (n.lineno = r), K(s) || (n.colno = s), n;
}
var se = (t, i) => {
	var e = -1 !== t.indexOf("safari-extension"), r = -1 !== t.indexOf("safari-web-extension");
	return e || r ? [-1 !== t.indexOf("@") ? t.split("@")[0] : ee, e ? "safari-extension:" + i : "safari-web-extension:" + i] : [t, i];
};
var ne = /^\s*at (\S+?)(?::(\d+))(?::(\d+))\s*$/i;
var oe = /^\s*at (?:(.+?\)(?: \[.+\])?|.*?) ?\((?:address at )?)?(?:async )?((?:<anonymous>|[-a-z]+:|.*bundle|\/)?.*?)(?::(\d+))?(?::(\d+))?\)?\s*$/i;
var ae = /\((\S*)(?::(\d+))(?::(\d+))\)/;
var le = (t, i) => {
	var e = ne.exec(t);
	if (e) return re$1(i, e[1], ee, +e[2], +e[3]);
	var r = oe.exec(t);
	if (r) {
		if (r[2] && 0 === r[2].indexOf("eval")) {
			var s = ae.exec(r[2]);
			s && (r[2] = s[1], r[3] = s[2], r[4] = s[3]);
		}
		var n = se(r[1] || ee, r[2]);
		return re$1(i, n[1], n[0], r[3] ? +r[3] : void 0, r[4] ? +r[4] : void 0);
	}
};
var he = /^\s*(.*?)(?:\((.*?)\))?(?:^|@)?((?:[-a-z]+)?:\/.*?|\[native code\]|[^@]*(?:bundle|\d+\.js)|\/[\w\-. /=]+)(?::(\d+))?(?::(\d+))?\s*$/i;
var ue = /(\S+) line (\d+)(?: > eval line \d+)* > eval/i;
var de = (t, i) => {
	var e = he.exec(t);
	if (e) {
		if (e[3] && e[3].indexOf(" > eval") > -1) {
			var r = ue.exec(e[3]);
			r && (e[1] = e[1] || "eval", e[3] = r[1], e[4] = r[2], e[5] = "");
		}
		var s = e[3], n = e[1] || ee, o = se(n, s);
		return re$1(i, s = o[1], n = o[0], e[4] ? +e[4] : void 0, e[5] ? +e[5] : void 0);
	}
};
var ve = /\(error: (.*)\)/;
var ce = class {
	match(t) {
		return this.isDOMException(t) || this.isDOMError(t);
	}
	coerce(t, i) {
		var e = J(t.stack);
		return {
			type: this.getType(t),
			value: this.getValue(t),
			stack: e ? t.stack : void 0,
			cause: t.cause ? i.next(t.cause) : void 0,
			synthetic: !1
		};
	}
	getType(t) {
		return this.isDOMError(t) ? "DOMError" : "DOMException";
	}
	getValue(t) {
		var i = t.name || (this.isDOMError(t) ? "DOMError" : "DOMException");
		return t.message ? i + ": " + t.message : i;
	}
	isDOMException(t) {
		return ot(t, "DOMException");
	}
	isDOMError(t) {
		return ot(t, "DOMError");
	}
};
var fe = class {
	match(t) {
		return at(t);
	}
	coerce(t, i) {
		var e, r = this.getStack(t), s = void 0 === r;
		return {
			type: this.getType(t),
			value: this.getMessage(t, i),
			stack: null != r ? r : null == (e = i.syntheticException) ? void 0 : e.stack,
			cause: t.cause ? i.next(t.cause) : void 0,
			synthetic: s
		};
	}
	getType(t) {
		return t.name || t.constructor.name;
	}
	getMessage(t, i) {
		var e = t.message;
		return String(e.error && "string" == typeof e.error.message ? e.error.message : e);
	}
	getStack(t) {
		return t.stacktrace || t.stack || void 0;
	}
};
var pe = class {
	constructor() {}
	match(t) {
		return !!ot(t, "ErrorEvent") && (null != t.error || this.$i(t));
	}
	coerce(t, i) {
		var e;
		if (null != t.error) return i.apply(t.error);
		var r = i.apply(t.message);
		return _({}, r, {
			stack: null !== (e = this.Ui(t)) && void 0 !== e ? e : r.stack,
			synthetic: !0
		});
	}
	$i(t) {
		return J(t.message) && t.message.length > 0;
	}
	Ui(t) {
		var i, e, r = t, s = null !== (i = r.lineno) && void 0 !== i ? i : 0, n = null !== (e = r.colno) && void 0 !== e ? e : 0;
		if (J(r.filename) && 0 !== r.filename.length && 0 !== s) return "Error\n    at " + r.filename + ":" + s + ":" + n;
	}
};
var _e = /^(?:[Uu]ncaught (?:exception: )?)?(?:((?:Eval|Internal|Range|Reference|Syntax|Type|URI|)Error): )?(.*)$/i;
var ge = class {
	match(t) {
		return "string" == typeof t;
	}
	coerce(t, i) {
		var e, r = this.getInfos(t), s = r[0], n = r[1];
		return {
			type: null != s ? s : "Error",
			value: null != n ? n : t,
			stack: null == (e = i.syntheticException) ? void 0 : e.stack,
			synthetic: !0
		};
	}
	getInfos(t) {
		var i = "Error", e = t, r = t.match(_e);
		return r && (i = r[1], e = r[2]), [i, e];
	}
};
var me = [
	"fatal",
	"error",
	"warning",
	"log",
	"info",
	"debug"
];
function ye(t, i) {
	void 0 === i && (i = 40);
	var e = Object.keys(t);
	if (e.sort(), !e.length) return "[object has no keys]";
	for (var r = e.length; r > 0; r--) {
		var s = e.slice(0, r).join(", ");
		if (i >= s.length) return r === e.length ? s : s.length > i ? s.slice(0, i) + "..." : s;
	}
	return "";
}
var be = class {
	match(t) {
		return "object" == typeof t && null !== t;
	}
	coerce(t, i) {
		var e, r, s = this.getErrorPropertyFromObject(t);
		return s ? i.apply(s) : {
			type: this.getType(t),
			value: this.getValue(t),
			stack: null !== (e = this.getStack(t)) && void 0 !== e ? e : null == (r = i.syntheticException) ? void 0 : r.stack,
			level: this.isSeverityLevel(t.level) ? t.level : "error",
			synthetic: !0
		};
	}
	getType(t) {
		if (lt(t)) return t.constructor.name;
		var i = "name" in t ? t.name : void 0;
		return J(i) && !Y(i) ? i : "Error";
	}
	getValue(t) {
		if ("name" in t && "string" == typeof t.name) {
			var i = "'" + t.name + "' captured as exception";
			return "message" in t && "string" == typeof t.message && (i += " with message: '" + t.message + "'"), i;
		}
		if ("message" in t && "string" == typeof t.message) return t.message;
		var e = this.getObjectClassName(t);
		return (e && "Object" !== e ? "'" + e + "'" : "Object") + " captured as exception with keys: " + ye(t);
	}
	isSeverityLevel(t) {
		return J(t) && !Y(t) && me.indexOf(t) >= 0;
	}
	getStack(t) {
		try {
			return J(t.stacktrace) && t.stacktrace.length > 0 ? t.stacktrace : J(t.stack) && t.stack.length > 0 ? t.stack : void 0;
		} catch (t) {
			return;
		}
	}
	getErrorPropertyFromObject(t) {
		for (var i in t) if ({}.hasOwnProperty.call(t, i)) {
			var e = t[i];
			if (at(e)) return e;
		}
	}
	getObjectClassName(t) {
		try {
			var i = Object.getPrototypeOf(t);
			return i ? i.constructor.name : void 0;
		} catch (t) {
			return;
		}
	}
};
var we = class {
	match(t) {
		return lt(t);
	}
	coerce(t, i) {
		var e, r = t.constructor.name;
		return {
			type: r,
			value: r + " captured as exception with keys: " + ye(t),
			stack: null == (e = i.syntheticException) ? void 0 : e.stack,
			synthetic: !0
		};
	}
};
var xe = class {
	match(t) {
		return nt(t);
	}
	coerce(t, i) {
		var e;
		return {
			type: "Error",
			value: "Primitive value captured as exception: " + String(t),
			stack: null == (e = i.syntheticException) ? void 0 : e.stack,
			synthetic: !0
		};
	}
};
var Ee = class {
	match(t) {
		return ot(t, "PromiseRejectionEvent") || this.isCustomEventWrappingRejection(t);
	}
	isCustomEventWrappingRejection(t) {
		if (!lt(t)) return !1;
		try {
			var i = t.detail;
			return null != i && "object" == typeof i && "reason" in i;
		} catch (t) {
			return !1;
		}
	}
	coerce(t, i) {
		var e, r = this.getUnhandledRejectionReason(t);
		return nt(r) ? {
			type: "UnhandledRejection",
			value: "Non-Error promise rejection captured with value: " + String(r),
			stack: null == (e = i.syntheticException) ? void 0 : e.stack,
			synthetic: !0
		} : i.apply(r);
	}
	getUnhandledRejectionReason(t) {
		try {
			if ("reason" in t) return t.reason;
			if ("detail" in t && null != t.detail && "object" == typeof t.detail && "reason" in t.detail) return t.detail.reason;
		} catch (t) {}
		return t;
	}
};
var Se = "$message";
var ke = "$timestamp";
var Te = /* @__PURE__ */ new Set([Se, ke]);
var $e = {
	enabled: !0,
	max_bytes: 32768
};
function Pe(t) {
	var i;
	return t ? {
		enabled: null !== (i = t.enabled) && void 0 !== i ? i : $e.enabled,
		max_bytes: Ce(t.max_bytes, $e.max_bytes)
	} : _({}, $e);
}
var Re = class {
	constructor(t) {
		this.Ss = [], this.xs = 0, this.vn = Pe(t);
	}
	setConfig(t) {
		this.vn = Pe(t), this.Cs();
	}
	add(t) {
		var i = function(t) {
			var i;
			try {
				i = j(t);
			} catch (t) {
				return;
			}
			try {
				var e = JSON.parse(i);
				if (!W(e)) return;
				var r = e, s = r[Se], n = r[ke];
				if (!J(s) || 0 === s.trim().length) return;
				if (!J(n) && !Z(n)) return;
				return {
					step: r,
					json: i
				};
			} catch (t) {
				return;
			}
		}(t);
		if (i) {
			var e = function(t) {
				if ("undefined" != typeof TextEncoder) return new TextEncoder().encode(t).length;
				for (var i = encodeURIComponent(t), e = 0, r = 0; i.length > r; r++) "%" === i[r] ? (e += 1, r += 2) : e += 1;
				return e;
			}(i.json);
			e > this.vn.max_bytes || (this.Ss.push({
				step: i.step,
				bytes: e
			}), this.xs += e, this.Cs());
		}
	}
	getAttachable() {
		return this.Ss.map(((t) => t.step));
	}
	clear() {
		this.Ss = [], this.xs = 0;
	}
	size() {
		return this.Ss.length;
	}
	Cs() {
		for (; this.xs > this.vn.max_bytes && this.Ss.length > 0;) {
			var t = this.Ss.shift();
			t && (this.xs -= t.bytes);
		}
	}
};
function Ce(t, i) {
	if (!Z(t) || t === Infinity || t === -Infinity) return i;
	var e = Math.floor(t);
	return 0 > e ? i : e;
}
var Oe = function(i, e) {
	var r = (void 0 === e ? {} : e).debugEnabled, s = {
		P(e) {
			if (t && (c.DEBUG || t.POSTHOG_DEBUG || r) && !K(t.console) && t.console) {
				for (var s = ("__rrweb_original__" in t.console[e]) ? t.console[e].__rrweb_original__ : t.console[e], n = arguments.length, o = new Array(n > 1 ? n - 1 : 0), a = 1; n > a; a++) o[a - 1] = arguments[a];
				s(i, ...o);
			}
		},
		debug() {
			for (var t = arguments.length, i = new Array(t), e = 0; t > e; e++) i[e] = arguments[e];
			s.P("debug", ...i);
		},
		info() {
			for (var t = arguments.length, i = new Array(t), e = 0; t > e; e++) i[e] = arguments[e];
			s.P("log", ...i);
		},
		warn() {
			for (var t = arguments.length, i = new Array(t), e = 0; t > e; e++) i[e] = arguments[e];
			s.P("warn", ...i);
		},
		error() {
			for (var t = arguments.length, i = new Array(t), e = 0; t > e; e++) i[e] = arguments[e];
			s.P("error", ...i);
		},
		critical() {
			for (var t = arguments.length, e = new Array(t), r = 0; t > r; r++) e[r] = arguments[r];
			console.error(i, ...e);
		},
		uninitializedWarning(t) {
			s.error("You must initialize PostHog before calling " + t);
		},
		createLogger: (t, e) => Oe(i + " " + t, e)
	};
	return s;
};
var Ie = Oe("[PostHog.js]");
var Ae = Ie.createLogger;
var Fe = Ae("[ExternalScriptsLoader]");
var Me = (t) => {
	var i = null == r ? void 0 : r.querySelectorAll("script");
	if (i) {
		for (var e = 0; i.length > e; e++) if (i[e].src === t || i[e].getAttribute("src") === t) return i[e];
	}
};
var De = (t, i, e) => {
	if (t.config.disable_external_dependency_loading) return Fe.warn(i + " was requested but loading of external scripts is disabled."), e("Loading of external scripts is disabled");
	var s = Me(i);
	if (s) {
		if (s.__posthog_loading_callback_fired) return e();
		var n = s.__posthog_loading_error;
		return n ? e(n) : (s.addEventListener("load", ((t) => {
			s.__posthog_loading_callback_fired = !0, e(void 0, t);
		})), void s.addEventListener("error", ((t) => {
			s.__posthog_loading_error = t, e(t);
		})));
	}
	var o = () => {
		if (!r) return e("document not found");
		if (Me(i)) return De(t, i, e);
		var s = r.createElement("script");
		if (s.type = "text/javascript", s.crossOrigin = "anonymous", s.src = i, s.onload = (t) => {
			s.__posthog_loading_callback_fired = !0, e(void 0, t);
		}, s.onerror = (t) => {
			s.__posthog_loading_error = t, e(t);
		}, t.config.prepare_external_dependency_script && (s = t.config.prepare_external_dependency_script(s)), !s) return e("prepare_external_dependency_script returned null");
		if ("head" === t.config.external_scripts_inject_target) r.head.appendChild(s);
		else {
			var n, o = r.querySelectorAll("body > script");
			o.length > 0 ? null == (n = o[0].parentNode) || n.insertBefore(s, o[0]) : r.body.appendChild(s);
		}
	};
	null != r && r.body ? o() : r?.addEventListener("DOMContentLoaded", o);
};
var Ne = {};
var Le = (t, i) => {
	var e = "/static/" + i + ".js?v=" + t.version;
	if ("toolbar" === i) {
		var r = 3e5;
		e = e + "&t=" + Math.floor(Date.now() / r) * r;
	}
	return t.requestRouter.endpointFor("assets", e);
};
v.__PosthogExtensions__ = v.__PosthogExtensions__ || {}, v.__PosthogExtensions__.loadExternalDependency = (t, i, e) => {
	if ("remote-config" !== i) {
		var r = t.config.strict_script_versioning;
		if (r) {
			var s = t.requestRouter.endpointFor("assets", "/static/" + t.version + "/" + i + ".js"), n = Ne[s];
			if ("fallback" === r && n) {
				if (Me(n)) return void De(t, n, e);
				delete Ne[s];
			}
			De(t, s, "fallback" === r ? (r, n) => {
				if (r) if ("string" == typeof r) e(r);
				else {
					var o, a = Le(t, i);
					Ne[s] = a;
					var l = Me(s);
					null == l || null == (o = l.parentNode) || o.removeChild(l), De(t, a, e);
				}
				else e(void 0, n);
			} : e);
		} else De(t, Le(t, i), e);
	} else De(t, t.requestRouter.endpointFor("assets", "/array/" + t.config.token + "/config.js"), e);
}, v.__PosthogExtensions__.loadSiteApp = (t, i, e) => {
	De(t, t.requestRouter.endpointFor("api", i), e);
};
c.DEBUG = !1, c.LIB_VERSION = "1.422.5", c.LIB_NAME = "web";
var Ue = "$people_distinct_id";
var je = "distinct_id";
var Be = "$device_id";
var ze = "$device_model";
var qe = "__alias";
var He = "__timers";
var Ve = "$autocapture_disabled_server_side";
var We = "$heatmaps_enabled_server_side";
var Ge = "$exception_capture_enabled_server_side";
var Ke = "$error_tracking_suppression_rules";
var Je = "$error_tracking_capture_extension_exceptions";
var Ye = "$web_vitals_enabled_server_side";
var Qe = "$dead_clicks_enabled_server_side";
var Xe = "$product_tours_enabled_server_side";
var Ze = "$logs_capture_enabled_server_side";
var tr = "$web_vitals_allowed_metrics";
var ir = "$session_recording_remote_config";
var er = "$replay_sample_rate";
var rr = "$replay_override_sampling";
var sr = "$replay_override_linked_flag";
var nr = "$replay_override_url_trigger";
var or = "$replay_override_event_trigger";
var ar = "$sesid";
var lr = "$session_is_sampled";
var hr = "$enabled_feature_flags";
var ur = "$active_feature_flags";
var dr = "$early_access_features";
var vr = "$feature_flag_details";
var cr = "$feature_flag_payloads";
var fr = "$feature_flag_request_id";
var pr = "$minimal_flag_called_events";
var _r = "$override_feature_flags";
var gr = "$override_feature_flag_payloads";
var mr = "$stored_person_properties";
var yr = "$stored_group_properties";
var br = "$groups";
var wr = "$surveys";
var xr = "$surveys_loaded_at";
var Er = "$surveys_activated";
var Sr = "$surveys_activated_session";
var kr = "$surveys_activated_timestamps";
var Tr = "ph_product_tours";
var $r = "$flag_call_reported";
var Pr = "$flag_call_reported_session_id";
var Rr = "$feature_flag_errors";
var Cr = "$feature_flag_evaluated_at";
var Or = "$user_state";
var Ir = "$client_session_props";
var Ar = "$capture_rate_limit";
var Fr = "$initial_campaign_params";
var Mr = "$initial_referrer_info";
var Dr = "$initial_person_info";
var Nr = "$epp";
var Lr = "$posthog_cookieless";
var Ur = "$cookieless_mode";
var jr = "$sdk_debug_extensions_init_method";
var Br = "$sdk_debug_extensions_init_time_ms";
var zr = "$sdk_debug_recording_script_not_loaded";
var qr = "PostHog loadExternalDependency extension not found.";
var Hr = "on_reject";
var Vr = "always";
var Wr = "anonymous";
var Gr = "identified";
var Kr = "identified_only";
var Jr = "visibilitychange";
var Yr = "beforeunload";
var Qr = "$pageview";
var Xr = "$pageleave";
var Zr = "$identify";
var ts = "$groupidentify";
function is(t, i) {
	H(t) && t.forEach(i);
}
function es(t, i) {
	if (!X(t)) if (H(t)) t.forEach(i);
	else if (et(t)) t.forEach(((t, e) => i(t, e)));
	else for (var e in t) z.call(t, e) && i(t[e], e);
}
var rs = function(t) {
	for (var i = arguments.length, e = new Array(i > 1 ? i - 1 : 0), r = 1; i > r; r++) e[r - 1] = arguments[r];
	for (var s of e) for (var n in s) void 0 !== s[n] && (t[n] = s[n]);
	return t;
};
function ss(t) {
	for (var i = Object.keys(t), e = i.length, r = new Array(e); e--;) r[e] = [i[e], t[i[e]]];
	return r;
}
var ns = function(t) {
	try {
		return t();
	} catch (t) {
		return;
	}
};
var os = function(t) {
	return function() {
		try {
			for (var i = arguments.length, e = new Array(i), r = 0; i > r; r++) e[r] = arguments[r];
			return t.apply(this, e);
		} catch (t) {
			Ie.critical("Implementation error. Please turn on debug mode and open a ticket on https://app.posthog.com/home#panel=support%3Asupport%3A."), Ie.critical(t);
		}
	};
};
var as = function(t) {
	var i = {};
	return es(t, (function(t, e) {
		(J(t) && t.length > 0 || Z(t)) && (i[e] = t);
	})), i;
};
var ls = [
	"herokuapp.com",
	"vercel.app",
	"netlify.app"
];
function hs(t) {
	var i = null == t ? void 0 : t.hostname;
	if (!J(i)) return !1;
	var e = i.split(".").slice(-2).join(".");
	for (var r of ls) if (e === r) return !1;
	return !0;
}
function us(t, i, e, r) {
	var s = null != r ? r : {}, n = s.capture, o = s.passive;
	t?.addEventListener(i, e, {
		capture: void 0 !== n && n,
		passive: void 0 === o || o
	});
}
function ds(t) {
	return "ph_toolbar_internal" === t.name;
}
var vs = (t) => {
	if (r) {
		try {
			for (var i = t + "=", e = r.cookie.split(";").filter(((t) => t.length)), s = 0; e.length > s; s++) {
				for (var n = e[s]; " " == n.charAt(0);) n = n.substring(1, n.length);
				if (0 === n.indexOf(i)) return decodeURIComponent(n.substring(i.length, n.length));
			}
		} catch (t) {}
		return null;
	}
};
Math.trunc || (Math.trunc = function(t) {
	return 0 > t ? Math.ceil(t) : Math.floor(t);
}), Number.isInteger || (Number.isInteger = function(t) {
	return Z(t) && isFinite(t) && Math.floor(t) === t;
});
var cs = class cs {
	constructor(t) {
		if (this.bytes = t, 16 !== t.length) throw new TypeError("not 128-bit length");
	}
	static fromFieldsV7(t, i, e, r) {
		if (!Number.isInteger(t) || !Number.isInteger(i) || !Number.isInteger(e) || !Number.isInteger(r) || 0 > t || 0 > i || 0 > e || 0 > r || t > 0xffffffffffff || i > 4095 || e > 1073741823 || r > 4294967295) throw new RangeError("invalid field value");
		var s = /* @__PURE__ */ new Uint8Array(16);
		return s[0] = t / Math.pow(2, 40), s[1] = t / Math.pow(2, 32), s[2] = t / Math.pow(2, 24), s[3] = t / Math.pow(2, 16), s[4] = t / 256, s[5] = t, s[6] = 112 | i >>> 8, s[7] = i, s[8] = 128 | e >>> 24, s[9] = e >>> 16, s[10] = e >>> 8, s[11] = e, s[12] = r >>> 24, s[13] = r >>> 16, s[14] = r >>> 8, s[15] = r, new cs(s);
	}
	toString() {
		for (var t = "", i = 0; this.bytes.length > i; i++) t = t + (this.bytes[i] >>> 4).toString(16) + (15 & this.bytes[i]).toString(16), 3 !== i && 5 !== i && 7 !== i && 9 !== i || (t += "-");
		if (36 !== t.length) throw new Error("Invalid UUIDv7 was generated");
		return t;
	}
	clone() {
		return new cs(this.bytes.slice(0));
	}
	equals(t) {
		return 0 === this.compareTo(t);
	}
	compareTo(t) {
		for (var i = 0; 16 > i; i++) {
			var e = this.bytes[i] - t.bytes[i];
			if (0 !== e) return Math.sign(e);
		}
		return 0;
	}
};
var fs = class {
	generate() {
		var t = this.generateOrAbort();
		if (!K(t)) return t;
		this.Gr = 0;
		var i = this.generateOrAbort();
		if (K(i)) throw new Error("Could not generate UUID after timestamp reset");
		return i;
	}
	generateOrAbort() {
		var t = Date.now();
		if (t > this.Gr) this.Gr = t, this.Qr();
		else {
			if (this.Gr >= t + 1e4) return;
			this.Jr++, this.Jr > 4398046511103 && (this.Gr++, this.Qr());
		}
		return cs.fromFieldsV7(this.Gr, Math.trunc(this.Jr / Math.pow(2, 30)), this.Jr & Math.pow(2, 30) - 1, this.Yr.nextUint32());
	}
	Qr() {
		this.Jr = 1024 * this.Yr.nextUint32() + (1023 & this.Yr.nextUint32());
	}
	constructor() {
		this.Gr = 0, this.Jr = 0, this.Yr = new gs();
	}
};
var ps;
var _s = (t) => {
	if ("undefined" != typeof UUIDV7_DENY_WEAK_RNG && UUIDV7_DENY_WEAK_RNG) throw new Error("no cryptographically strong RNG available");
	for (var i = 0; t.length > i; i++) t[i] = 65536 * Math.trunc(65536 * Math.random()) + Math.trunc(65536 * Math.random());
	return t;
};
t && !K(t.crypto) && crypto.getRandomValues && (_s = (t) => crypto.getRandomValues(t));
var gs = class {
	nextUint32() {
		return this.At.length > this.Kr || (_s(this.At), this.Kr = 0), this.At[this.Kr++];
	}
	constructor() {
		this.At = /* @__PURE__ */ new Uint32Array(8), this.Kr = Infinity;
	}
};
var ms = () => ys().toString();
var ys = () => (ps || (ps = new fs())).generate();
var bs = "";
var ws = /[a-z0-9][a-z0-9-]+\.[a-z]{2,}$/i;
var xs = {
	Xr: () => !!r,
	ii(t) {
		Ie.error("cookieStore error: " + t);
	},
	ti: vs,
	ni(t) {
		var i;
		try {
			i = JSON.parse(xs.ti(t)) || {};
		} catch (t) {}
		return i;
	},
	ei(t, i, e, s, n) {
		if (!r) return !1;
		try {
			var o = "", a = "", l = function(t, i) {
				if (i) {
					var e = function(t, i) {
						if (void 0 === i && (i = r), bs) return bs;
						if (!i) return "";
						if (["localhost", "127.0.0.1"].includes(t)) return "";
						for (var e = t.split("."), s = Math.min(e.length, 8), n = "dmn_chk_" + ms(); !bs && s--;) {
							var o = e.slice(s).join("."), a = n + "=1;domain=." + o + ";path=/";
							i.cookie = a + ";max-age=3", i.cookie.includes(n) && (i.cookie = a + ";max-age=0", bs = o);
						}
						return bs;
					}(t);
					if (!e) {
						var s = ((t) => {
							var i = t.match(ws);
							return i ? i[0] : "";
						})(t);
						s !== e && Ie.info("Warning: cookie subdomain discovery mismatch", s, e), e = s;
					}
					return e ? "; domain=." + e : "";
				}
				return "";
			}(r.location.hostname, s);
			if (e) {
				var h = /* @__PURE__ */ new Date();
				h.setTime(h.getTime() + 864e5 * e), o = "; expires=" + h.toUTCString();
			}
			n && (a = "; secure");
			var u = t + "=" + encodeURIComponent(JSON.stringify(i)) + o + "; SameSite=Lax; path=/" + l + a;
			return u.length > 3686.4 && Ie.warn("cookieStore warning: large cookie, len=" + u.length), r.cookie = u, !0;
		} catch (t) {
			return !1;
		}
	},
	ri(t, i) {
		if (null != r && r.cookie) try {
			xs.ei(t, "", -1, i);
		} catch (t) {
			return;
		}
	}
};
var Es = null;
var Ss = {
	Xr() {
		if (!Q(Es)) return Es;
		var i = !0;
		if (K(t)) i = !1;
		else try {
			var e = "__mplssupport__";
			Ss.ei(e, "xyz"), "\"xyz\"" !== Ss.ti(e) && (i = !1), Ss.ri(e);
		} catch (t) {
			i = !1;
		}
		return i || Ie.error("localStorage unsupported; falling back to cookie store"), Es = i, i;
	},
	ii(t) {
		Ie.error("localStorage error: " + t);
	},
	ti(i) {
		try {
			return null == t ? void 0 : t.localStorage.getItem(i);
		} catch (t) {
			Ss.ii(t);
		}
		return null;
	},
	ni(t) {
		try {
			return JSON.parse(Ss.ti(t)) || {};
		} catch (t) {}
		return null;
	},
	ei(i, e) {
		try {
			return t?.localStorage.setItem(i, JSON.stringify(e)), !0;
		} catch (t) {
			Ss.ii(t);
		}
		return !1;
	},
	ri(i) {
		try {
			t?.localStorage.removeItem(i);
		} catch (t) {
			Ss.ii(t);
		}
	}
};
var ks = [
	mr,
	ur,
	hr,
	vr,
	cr,
	fr,
	Cr,
	Rr,
	$r
];
var Ts = [
	Be,
	je,
	ar,
	lr,
	Nr,
	Dr,
	Or
];
var $s = (t) => t + "_cpm";
var Ps = [
	"__proto__",
	"constructor",
	"prototype"
];
var Rs = (t) => {
	if (!W(t)) return {};
	var i = {};
	return Object.keys(t).forEach(((e) => {
		-1 === Ps.indexOf(e) && (i[e] = t[e]);
	})), i;
};
var Cs = function(t, i) {
	void 0 === i && (i = []);
	var e = {};
	return [...Ts, ...i].forEach(((i) => {
		var r = t[i];
		K(r) || Q(r) || "" === r || (e[i] = r);
	})), e;
};
var Os = (t) => {
	for (var i = 5381, e = 2166136261, r = 0; t.length > r; r++) {
		var s = t.charCodeAt(r);
		i = 33 * i ^ s, e = Math.imul(e ^ s, 16777619);
	}
	return t.length.toString(36) + "." + (i >>> 0).toString(36) + "." + (e >>> 0).toString(36);
};
var Is = (t, i) => ({
	p: i,
	f: Os(JSON.stringify(t))
});
var As = (t, i) => {
	if (!i) return {
		properties: [],
		isValid: !1
	};
	try {
		var e = xs.ni($s(t)), r = (null == e ? void 0 : e.f) === Os(i) && H(e.p);
		return {
			properties: r ? e.p : [],
			isValid: r
		};
	} catch (t) {
		return {
			properties: [],
			isValid: !1
		};
	}
};
var Fs = (t, i) => i + "|" + (xs.ti($s(t)) || "");
var Ms = {};
var Ds = {
	Xr: () => !0,
	ii(t) {
		Ie.error("memoryStorage error: " + t);
	},
	ti: (t) => Ms[t] || null,
	ni: (t) => Ms[t] || null,
	ei: (t, i) => (Ms[t] = i, !0),
	ri(t) {
		delete Ms[t];
	}
};
var Ns = null;
var Ls = {
	Xr() {
		if (!Q(Ns)) return Ns;
		if (Ns = !0, K(t)) Ns = !1;
		else try {
			var i = "__support__";
			Ls.ei(i, "xyz"), "\"xyz\"" !== Ls.ti(i) && (Ns = !1), Ls.ri(i);
		} catch (t) {
			Ns = !1;
		}
		return Ns;
	},
	ii(t) {
		Ie.error("sessionStorage error: ", t);
	},
	ti(i) {
		try {
			return null == t ? void 0 : t.sessionStorage.getItem(i);
		} catch (t) {
			Ls.ii(t);
		}
		return null;
	},
	ni(t) {
		try {
			return JSON.parse(Ls.ti(t)) || null;
		} catch (t) {}
		return null;
	},
	ei(i, e) {
		try {
			return t?.sessionStorage.setItem(i, JSON.stringify(e)), !0;
		} catch (t) {
			Ls.ii(t);
		}
		return !1;
	},
	ri(i) {
		try {
			t?.sessionStorage.removeItem(i);
		} catch (t) {
			Ls.ii(t);
		}
	}
};
var Us = class {
	constructor(t) {
		this._instance = t;
	}
	get vn() {
		return this._instance.config;
	}
	get consent() {
		return this.Hs() ? 0 : this.zs;
	}
	isOptedOut() {
		return this.vn.cookieless_mode === Vr || this.isRejected() || -1 === this.consent && this.vn.cookieless_mode === Hr;
	}
	isOptedIn() {
		return !this.isOptedOut();
	}
	isExplicitlyOptedOut() {
		return 0 === this.consent;
	}
	isRejected() {
		return 0 === this.consent || -1 === this.consent && this.vn.opt_out_capturing_by_default;
	}
	optInOut(t) {
		this.Us.ei(this.Ws, t ? 1 : 0, this.vn.cookie_expiration, this.vn.cross_subdomain_cookie, this.vn.secure_cookie);
	}
	reset() {
		this.Us.ri(this.Ws, this.vn.cross_subdomain_cookie);
	}
	get Ws() {
		var t = this._instance.config, i = t.token, e = t.opt_out_capturing_cookie_prefix;
		return t.consent_persistence_name || (e ? e + i : "__ph_opt_in_out_" + i);
	}
	get zs() {
		var t = this.Us.ti(this.Ws);
		return dt(t) ? 1 : N(vt, t) ? 0 : -1;
	}
	get Us() {
		var t = this.vn.opt_out_capturing_persistence_type, i = "localStorage" === t ? Ss : xs;
		if (!this.Vs || this.Vs !== i) {
			this.Vs = i;
			var e = "localStorage" === t ? xs : Ss;
			e.ti(this.Ws) && (this.Vs.ti(this.Ws) || this.optInOut(dt(e.ti(this.Ws))), e.ri(this.Ws, this.vn.cross_subdomain_cookie));
		}
		return this.Vs;
	}
	Hs() {
		return !!this.vn.respect_dnt && [
			null == e ? void 0 : e.doNotTrack,
			null == e ? void 0 : e.msDoNotTrack,
			v.doNotTrack
		].some(((t) => dt(t)));
	}
};
function js(t, i) {
	var e, r = null == t || null == (e = t.config) ? void 0 : e.get_current_url;
	if (!V(r)) return i;
	try {
		var s = r(i);
		return J(s) && s ? s : i;
	} catch (t) {
		return Ie.error("Error in get_current_url, falling back to window.location.href", t), i;
	}
}
var Bs = "__POSTHOG_TOOLBAR__";
var zs = 1;
var qs = 3;
var Hs = 11;
function Vs(t) {
	return t instanceof Element && (t.id === Bs || !(null == t.closest || !t.closest(".toolbar-global-fade-container")));
}
function Ws(t) {
	return !!t && t.nodeType === zs;
}
function Gs(t, i) {
	return !!t && !!t.tagName && t.tagName.toLowerCase() === i.toLowerCase();
}
function Ks(t) {
	return !!t && t.nodeType === qs;
}
function Js(t) {
	return !!t && t.nodeType === Hs && Ws(t.host);
}
var Ys = 1e3;
function Qs(t) {
	return t ? L(t).split(/\s+/) : [];
}
function Xs(i, e) {
	var r = function(i) {
		var e, r = null == t || null == (e = t.location) ? void 0 : e.href;
		return K(r) ? void 0 : js(i, r);
	}(e);
	return !!(r && i && i.some(((t) => r.match(t))));
}
function Zs(t) {
	var i = "";
	switch (typeof t.className) {
		case "string":
			i = t.className;
			break;
		case "object":
			i = (t.className && "baseVal" in t.className ? t.className.baseVal : null) || t.getAttribute("class") || "";
			break;
		default: i = "";
	}
	return Qs(i);
}
function tn(t) {
	return X(t) ? null : L(t).split(/(\s+)/).filter(((t) => kn(t))).join("").replace(/[\r\n]/g, " ").replace(/[ ]+/g, " ").substring(0, 255);
}
function en(t) {
	var i = "";
	return _n(t) && !gn(t) && t.childNodes && t.childNodes.length && es(t.childNodes, (function(t) {
		var e;
		Ks(t) && t.textContent && (i += null !== (e = tn(t.textContent)) && void 0 !== e ? e : "");
	})), L(i);
}
function rn(t) {
	var i;
	return K(t.target) ? t.srcElement || null : null != (i = t.target) && i.shadowRoot ? t.composedPath()[0] || null : t.target || null;
}
var sn = [
	"a",
	"button",
	"form",
	"input",
	"select",
	"textarea",
	"label"
];
function nn(t, i) {
	if (K(i)) return !0;
	var e, r = function(t) {
		if (i.some(((i) => function(t, i) {
			var e = t.matches || t.matchesSelector || t.msMatchesSelector || t.mozMatchesSelector || t.webkitMatchesSelector || t.oMatchesSelector;
			try {
				return !!e && e.call(t, i);
			} catch (t) {
				return !1;
			}
		}(t, i)))) return { v: !0 };
	};
	for (var s of t) if (e = r(s)) return e.v;
	return !1;
}
function on(t) {
	var i = t.parentNode;
	return !(!i || !Ws(i)) && i;
}
var an = [".ph-no-autocapture", "[data-ph-no-autocapture]"];
var ln = [
	"next",
	"previous",
	"prev",
	">",
	"<"
];
var hn = [
	...ln,
	"+",
	"-",
	"−",
	"–"
];
var un = (t, i) => /[a-z0-9]/i.test(i) ? t.includes(i) : t === i;
var dn = [".ph-no-rageclick", ".ph-no-capture"];
var vn = [
	"",
	"text",
	"search",
	"email",
	"password",
	"url",
	"tel",
	"number"
];
function cn(i, e) {
	if (!t || fn(i)) return !1;
	var r, s, n, o, a;
	if (it(e) ? (r = !!e && dn, s = void 0, n = !1) : (r = null !== (o = null == e ? void 0 : e.css_selector_ignorelist) && void 0 !== o ? o : dn, s = null == e ? void 0 : e.content_ignorelist, n = null !== (a = null == e ? void 0 : e.ignore_text_selection) && void 0 !== a && a), !1 === r) return !1;
	if (n && function(t) {
		return !(!t || !Ws(t)) && (!!Gs(t, "textarea") || (Gs(t, "input") ? N(vn, (t.getAttribute("type") || "").toLowerCase()) : function(t) {
			if (t.isContentEditable) return !0;
			var i = null == t.getAttribute ? void 0 : t.getAttribute("contenteditable");
			return "true" === i || "" === i;
		}(t)));
	}(i)) return !1;
	var l = pn(i, !1).targetElementList;
	return !function(t, i) {
		if (!1 === t || K(t)) return !1;
		var e;
		if (!0 === t) e = ln;
		else {
			if (!H(t)) return !1;
			if (t.length > 10) return Ie.error("[PostHog] content_ignorelist array cannot exceed 10 items. Use css_selector_ignorelist for more complex matching."), !1;
			e = t.map(((t) => t.toLowerCase()));
		}
		return i.some(((t) => {
			var i = t.safeText, r = t.ariaLabel;
			return e.some(((t) => un(i, t) || un(r, t)));
		}));
	}(s, l.map(((t) => {
		var i;
		return {
			safeText: en(t).toLowerCase(),
			ariaLabel: (null == (i = t.getAttribute("aria-label")) ? void 0 : i.toLowerCase().trim()) || ""
		};
	}))) && !nn(l, r);
}
var fn = (t) => !t || Gs(t, "html") || !Ws(t);
var pn = (i, e) => {
	if (!t || fn(i)) return {
		parentIsUsefulElement: !1,
		targetElementList: []
	};
	for (var r = !1, s = [i], n = i; n.parentNode && !Gs(n, "body");) if (Js(n.parentNode)) s.push(n.parentNode.host), n = n.parentNode.host;
	else {
		var o = on(n);
		if (!o) break;
		if (e || sn.indexOf(o.tagName.toLowerCase()) > -1) r = !0;
		else try {
			var a = t.getComputedStyle(o);
			a && "pointer" === a.getPropertyValue("cursor") && (r = !0);
		} catch (t) {}
		s.push(o), n = o;
	}
	return {
		parentIsUsefulElement: r,
		targetElementList: s
	};
};
function _n(t) {
	for (var i = /* @__PURE__ */ new Set(), e = 0, r = t; r.parentNode && !Gs(r, "body"); r = r.parentNode) {
		if (e++ >= Ys || i.has(r)) return !1;
		i.add(r);
		var s = Zs(r);
		if (N(s, "ph-sensitive") || N(s, "ph-no-capture")) return !1;
	}
	if (N(Zs(t), "ph-include")) return !0;
	var n = t.type || "";
	if (J(n)) switch (n.toLowerCase()) {
		case "hidden":
		case "password": return !1;
	}
	var o = t.name || t.id || "";
	return !J(o) || !/^cc|cardnum|ccnum|creditcard|csc|cvc|cvv|exp|pass|pwd|routing|seccode|securitycode|securitynum|socialsec|socsec|ssn/i.test(o.replace(/[^a-zA-Z0-9]/g, ""));
}
function gn(t) {
	return !!(Gs(t, "input") && ![
		"button",
		"checkbox",
		"submit",
		"reset"
	].includes(t.type) || Gs(t, "select") || Gs(t, "textarea") || "true" === t.getAttribute("contenteditable"));
}
var mn = /* @__PURE__ */ new RegExp("^(?:(4[0-9]{12}(?:[0-9]{3})?)|(5[1-5][0-9]{14})|(6(?:011|5[0-9]{2})[0-9]{12})|(3[47][0-9]{13})|(3(?:0[0-5]|[68][0-9])[0-9]{11})|((?:2131|1800|35[0-9]{3})[0-9]{11}))$");
var yn = /(^|[^0-9A-Za-z_])([0-9][0-9 -]*[0-9])(?=$|[^0-9A-Za-z_])/g;
var bn = [
	16,
	15,
	14,
	13
];
var wn = /* @__PURE__ */ new RegExp("^(\\d{3}-?\\d{2}-?\\d{4})$");
var xn = /* @__PURE__ */ new RegExp("(^|[^0-9])((?!000|666)[0-9]{3}-?(?!00)[0-9]{2}-?(?!0000)[0-9]{4})(?=$|([^0-9]))", "g");
var En = /[0-9A-Za-z_]/;
function Sn(t) {
	for (var i = 0, e = !1, r = t.length - 1; r >= 0; r--) {
		var s = t.charCodeAt(r) - 48;
		e && (s *= 2) > 9 && (s -= 9), i += s, e = !e;
	}
	return i % 10 == 0;
}
function kn(t, i) {
	if (void 0 === i && (i = !0), X(t)) return !1;
	if (J(t)) {
		t = L(t);
		if (i ? mn.test((t || "").replace(/[- ]/g, "")) : function(t) {
			var i;
			for (yn.lastIndex = 0; i = yn.exec(t);) {
				var e = i[2];
				if (e) for (var r = e.replace(/[- ]/g, ""), s = 0; r.length > s; s++) for (var n of bn) {
					var o = s + n;
					if (r.length >= o) {
						var a = r.slice(s, o);
						if (mn.test(a) && Sn(a)) return !0;
					}
				}
			}
			return !1;
		}(t)) return !1;
		if (i ? wn.test(t) : function(t) {
			var i;
			for (xn.lastIndex = 0; i = xn.exec(t);) {
				var e = i[1], r = i[3];
				if (!(e && r && En.test(e) && En.test(r))) return !0;
			}
			return !1;
		}(t)) return !1;
	}
	return !0;
}
function Tn(t) {
	var i = en(t);
	return kn(i = (i + " " + $n(t)).trim()) ? i : "";
}
function $n(t) {
	var i = "";
	return t && t.childNodes && t.childNodes.length && es(t.childNodes, (function(t) {
		var e;
		if (t && "span" === (null == (e = t.tagName) ? void 0 : e.toLowerCase())) try {
			var r = en(t);
			i = (i + " " + r).trim(), t.childNodes && t.childNodes.length && (i = (i + " " + $n(t)).trim());
		} catch (t) {
			Ie.error("[AutoCapture]", t);
		}
	})), i;
}
function Pn(t) {
	return t.replace(/"|\\"/g, "\\\"");
}
function Rn(t) {
	var i = t.attr__class;
	if (i) return H(i) ? i : Qs(i);
}
var Cn = Ae("[Dead Clicks]");
var On = () => !0;
var In = (t) => {
	var i, e = !(null == (i = t.instance.persistence) || !i.get_property(Qe)), r = t.instance.config.capture_dead_clicks;
	return it(r) ? r : !!W(r) || e;
};
var An = class {
	get lazyLoadedDeadClicksAutocapture() {
		return this.Gs;
	}
	constructor(t, i, e) {
		this.instance = t, this.isEnabled = i, this.onCapture = e, this.startIfEnabledOrStop();
	}
	onRemoteConfig(t) {
		if (t.ok) {
			var i = t.config;
			"captureDeadClicks" in i && (this.instance.persistence && this.instance.persistence.register({ [Qe]: i.captureDeadClicks }), this.startIfEnabledOrStop());
		}
	}
	startIfEnabledOrStop() {
		this.isEnabled(this) ? this.Zs((() => {
			this.Qs();
		})) : this.stop();
	}
	Zs(t) {
		var i, e;
		null != (i = v.__PosthogExtensions__) && i.initDeadClicksAutocapture ? t() : null == (e = v.__PosthogExtensions__) || null == e.loadExternalDependency || e.loadExternalDependency(this.instance, "dead-clicks-autocapture", ((i) => {
			i ? Cn.error("failed to load script", i) : t();
		}));
	}
	Qs() {
		var t;
		if (r) {
			if (!this.Gs && null != (t = v.__PosthogExtensions__) && t.initDeadClicksAutocapture) {
				var i = W(this.instance.config.capture_dead_clicks) ? _({}, this.instance.config.capture_dead_clicks) : {};
				i.__onCapture = this.onCapture, this.onCapture && (i.capture_dead_swipes = !1), this.Gs = v.__PosthogExtensions__.initDeadClicksAutocapture(this.instance, i), this.Gs.start(r), Cn.info("starting...");
			}
		} else Cn.error("`document` not found. Cannot start.");
	}
	stop() {
		this.Gs && (this.Gs.stop(), this.Gs = void 0, Cn.info("stopping..."));
	}
};
var Fn = Ae("[SegmentIntegration]");
var Mn = "posthog-js";
function Dn(t, i) {
	var e = void 0 === i ? {} : i, r = e.organization, s = e.projectId, n = e.prefix, o = e.severityAllowList, a = void 0 === o ? ["error"] : o, l = e.sendExceptionsToPostHog, h = void 0 === l || l;
	return (i) => {
		var e, o, l, u, d;
		if ("*" !== a && !a.includes(i.level) || !t.__loaded) return i;
		i.tags || (i.tags = {});
		var v = t.requestRouter.endpointFor("ui", "/project/" + t.config.token + "/person/" + t.get_distinct_id());
		i.tags["PostHog Person URL"] = v, t.sessionRecordingStarted() && (i.tags["PostHog Recording URL"] = t.get_session_replay_url({ withTimestamp: !0 }));
		var c, f = (null == (e = i.exception) ? void 0 : e.values) || [], p = f.map(((t) => _({}, t, { stacktrace: t.stacktrace ? _({}, t.stacktrace, {
			type: "raw",
			frames: (t.stacktrace.frames || []).map(((t) => _({}, t, { platform: "web:javascript" })))
		}) : void 0 }))), g = {
			$exception_message: (null == (o = f[0]) ? void 0 : o.value) || i.message,
			$exception_type: null == (l = f[0]) ? void 0 : l.type,
			$exception_level: i.level,
			$exception_list: p,
			$sentry_event_id: i.event_id,
			$sentry_exception: i.exception,
			$sentry_exception_message: (null == (u = f[0]) ? void 0 : u.value) || i.message,
			$sentry_exception_type: null == (d = f[0]) ? void 0 : d.type,
			$sentry_tags: i.tags
		};
		return r && s && (g.$sentry_url = (n || "https://sentry.io/organizations/") + r + "/issues/?project=" + s + "&query=" + i.event_id), h && (null == (c = t.exceptions) || c.sendExceptionEvent(g)), i;
	};
}
var Nn = class {
	constructor(t, i, e, r, s, n) {
		this.name = Mn, this.setupOnce = function(o) {
			o(Dn(t, {
				organization: i,
				projectId: e,
				prefix: r,
				severityAllowList: s,
				sendExceptionsToPostHog: null == n || n
			}));
		};
	}
};
var Ln = class {
	constructor(t) {
		this.Js = (t, i, e) => {
			e && (e.noSessionId || e.activityTimeout || e.sessionPastMaximumLength || e.crossTabAdoption) && (Ie.info("[PageViewManager] Session rotated, clearing pageview state", {
				sessionId: t,
				changeReason: e
			}), this.Ks = void 0, this._instance.scrollManager.resetContext());
		}, this._instance = t, this.Ys();
	}
	Ys() {
		var t;
		this.Xs = null == (t = this._instance.sessionManager) ? void 0 : t.onSessionId(this.Js);
	}
	destroy() {
		var t;
		null == (t = this.Xs) || t.call(this), this.Xs = void 0;
	}
	doPageView(i, e) {
		var r, s = this.ta(i, e);
		return this.Ks = {
			pathname: null !== (r = null == t ? void 0 : t.location.pathname) && void 0 !== r ? r : "",
			pageViewId: e,
			timestamp: i
		}, this._instance.scrollManager.resetContext(), s;
	}
	doPageLeave(t) {
		var i;
		return this.ta(t, null == (i = this.Ks) ? void 0 : i.pageViewId);
	}
	doEvent() {
		var t;
		return { $pageview_id: null == (t = this.Ks) ? void 0 : t.pageViewId };
	}
	ta(t, i) {
		var e = this.Ks;
		if (!e) return { $pageview_id: i };
		var r = {
			$pageview_id: i,
			$prev_pageview_id: e.pageViewId
		}, s = this._instance.scrollManager.getContext();
		if (s && !this._instance.config.disable_scroll_properties) {
			var n = s.maxScrollHeight, o = s.lastScrollY, a = s.maxScrollY, l = s.maxContentHeight, h = s.lastContentY, u = s.maxContentY;
			if (!(K(n) || K(o) || K(a) || K(l) || K(h) || K(u))) {
				n = Math.ceil(n), o = Math.ceil(o), a = Math.ceil(a), l = Math.ceil(l), h = Math.ceil(h), u = Math.ceil(u);
				var d = n > 1 ? ct(o / n, 0, 1, Ie) : 1, v = n > 1 ? ct(a / n, 0, 1, Ie) : 1, c = l > 1 ? ct(h / l, 0, 1, Ie) : 1, f = l > 1 ? ct(u / l, 0, 1, Ie) : 1;
				r = rs(r, {
					$prev_pageview_last_scroll: o,
					$prev_pageview_last_scroll_percentage: d,
					$prev_pageview_max_scroll: a,
					$prev_pageview_max_scroll_percentage: v,
					$prev_pageview_last_content: h,
					$prev_pageview_last_content_percentage: c,
					$prev_pageview_max_content: u,
					$prev_pageview_max_content_percentage: f
				});
			}
		}
		return e.pathname && (r.$prev_pageview_pathname = e.pathname), e.timestamp && (r.$prev_pageview_duration = (t.getTime() - e.timestamp.getTime()) / 1e3), r;
	}
};
var Un = ["flags", "surveys"];
var jn = {
	[Ue]: { exposure: "hidden" },
	[qe]: { exposure: "hidden" },
	__cmpns: { exposure: "hidden" },
	[He]: { exposure: "hidden" },
	[Ve]: { exposure: "event" },
	[We]: { exposure: "hidden" },
	[Ze]: { exposure: "hidden" },
	[Ge]: { exposure: "event" },
	[Ke]: { exposure: "hidden" },
	[Je]: { exposure: "event" },
	[Ye]: { exposure: "event" },
	[Qe]: { exposure: "event" },
	[Xe]: { exposure: "hidden" },
	[tr]: { exposure: "event" },
	[ir]: { exposure: "hidden" },
	$session_recording_enabled_server_side: { exposure: "hidden" },
	[ar]: { exposure: "hidden" },
	[lr]: { exposure: "event" },
	[er]: {
		exposure: "event",
		shouldSkipFromEventProperties: (t) => Q(t)
	},
	$session_past_minimum_duration: { exposure: "event" },
	$session_recording_url_trigger_activated_session: { exposure: "event" },
	$session_recording_event_trigger_activated_session: { exposure: "event" },
	$debug_first_full_snapshot_timestamp: { exposure: "event" },
	$sess_rec_flush_size: { exposure: "hidden" },
	[hr]: {
		exposure: "hidden",
		storageGroup: "flags"
	},
	[ur]: {
		exposure: "hidden",
		storageGroup: "flags"
	},
	[dr]: { exposure: "hidden" },
	[vr]: {
		exposure: "hidden",
		storageGroup: "flags"
	},
	[cr]: {
		exposure: "hidden",
		storageGroup: "flags"
	},
	[fr]: {
		exposure: "hidden",
		storageGroup: "flags",
		volatile: !0
	},
	[pr]: {
		exposure: "hidden",
		storageGroup: "flags"
	},
	[_r]: { exposure: "hidden" },
	[gr]: { exposure: "hidden" },
	[mr]: { exposure: "hidden" },
	[yr]: { exposure: "hidden" },
	[wr]: {
		exposure: "hidden",
		storageGroup: "surveys"
	},
	[xr]: {
		exposure: "hidden",
		storageGroup: "surveys",
		volatile: !0
	},
	[Er]: { exposure: "event" },
	[Sr]: { exposure: "hidden" },
	[kr]: { exposure: "hidden" },
	[Tr]: { exposure: "hidden" },
	$product_tours_activated: { exposure: "hidden" },
	$product_tours_activated_session: { exposure: "hidden" },
	$conversations_widget_session_id: { exposure: "event" },
	$conversations_ticket_id: { exposure: "event" },
	$conversations_widget_state: { exposure: "event" },
	$conversations_user_traits: { exposure: "event" },
	[$r]: { exposure: "hidden" },
	[Pr]: { exposure: "hidden" },
	[br]: { exposure: "event" },
	[Rr]: { exposure: "hidden" },
	[Cr]: {
		exposure: "hidden",
		storageGroup: "flags",
		volatile: !0
	},
	[Or]: { exposure: "hidden" },
	[Ir]: { exposure: "hidden" },
	[Ar]: { exposure: "hidden" },
	[Fr]: { exposure: "hidden" },
	[Mr]: { exposure: "hidden" },
	[Dr]: { exposure: "hidden" },
	[Nr]: { exposure: "hidden" },
	[rr]: { exposure: "event" },
	[sr]: { exposure: "event" },
	[nr]: { exposure: "event" },
	[or]: { exposure: "event" },
	[jr]: { exposure: "event" },
	[Br]: { exposure: "event" },
	[zr]: { exposure: "event" },
	$sdk_debug_replay_event_trigger_status: { exposure: "event" },
	$sdk_debug_replay_linked_flag_trigger_status: { exposure: "event" },
	$sdk_debug_replay_matched_recording_trigger_groups: { exposure: "event" },
	$sdk_debug_replay_pending_trigger_conditions: { exposure: "event" },
	$sdk_debug_replay_remote_trigger_matching_config: { exposure: "event" },
	$sdk_debug_replay_trigger_groups_count: { exposure: "event" },
	$sdk_debug_replay_url_trigger_status: { exposure: "event" },
	$session_recording_start_reason: { exposure: "event" }
};
var Bn = [
	["$posthog_sr_group_event_trigger_", { exposure: "hidden" }],
	["$posthog_sr_group_url_trigger_", { exposure: "hidden" }],
	["$posthog_sr_group_sampling_", { exposure: "hidden" }]
];
var zn = (t) => {
	var i = jn[t];
	if (i) return i;
	for (var e of Bn) {
		var r = e[1];
		if (0 === t.indexOf(e[0])) return r;
	}
};
var qn = (t, i) => {
	try {
		return JSON.stringify(t, ((t, i) => "bigint" == typeof i ? i.toString() : i), i);
	} catch (i) {
		return j(t);
	}
};
var Hn = (t) => {
	var i = null == r ? void 0 : r.createElement("a");
	return K(i) ? null : (i.href = t, i);
};
var Vn = function(t, i) {
	for (var e, r = ((t.split("#")[0] || "").split(/\?(.*)/)[1] || "").replace(/^\?+/g, "").split("&"), s = 0; r.length > s; s++) {
		var n = r[s].split("=");
		if (n[0] === i) {
			e = n;
			break;
		}
	}
	if (!H(e) || 2 > e.length) return "";
	var o = e[1];
	try {
		o = decodeURIComponent(o);
	} catch (t) {
		Ie.error("Skipping decoding for malformed query param: " + o);
	}
	return o.replace(/\+/g, " ");
};
var Wn = function(t, i, e) {
	if (!t || !i || !i.length) return t;
	for (var r = t.split("#"), s = r[1], n = (r[0] || "").split("?"), o = n[1], a = n[0], l = (o || "").split("&"), h = [], u = 0; l.length > u; u++) {
		var d = l[u].split("=");
		H(d) && (i.includes(d[0]) ? h.push(d[0] + "=" + e) : h.push(l[u]));
	}
	var v = a;
	return null != o && (v += "?" + h.join("&")), null != s && (v += "#" + s), v;
};
var Gn = function(t, i) {
	var e = t.match(new RegExp(i + "=([^&]*)"));
	return e ? e[1] : null;
};
var Kn = (t, i) => t >= i && u();
var Jn = (t, i, e, r) => {
	if (0 === t) {
		if (u()) {
			var s = i + 1;
			return s === e && r(), s;
		}
		return i;
	}
	return 0;
};
var Yn = "https?://(.*)";
var Qn = [
	"gclid",
	"gclsrc",
	"dclid",
	"gbraid",
	"wbraid",
	"fbclid",
	"msclkid",
	"twclid",
	"li_fat_id",
	"igshid",
	"ttclid",
	"rdt_cid",
	"epik",
	"qclid",
	"sccid",
	"irclid",
	"_kx"
];
var Xn = [
	"utm_source",
	"utm_medium",
	"utm_campaign",
	"utm_content",
	"utm_term",
	"gad_source",
	"mc_cid",
	...Qn
];
var Zn = "<masked>";
var to = ["li_fat_id"];
function io(t, i, e) {
	if (!r) return {};
	var s, n = i ? [...Qn, ...e || []] : [], o = eo(Wn(r.URL, n, Zn), t);
	return rs((s = {}, es(to, (function(t) {
		var i = vs(t);
		s[t] = i || null;
	})), s), o);
}
function eo(t, i) {
	var e = Xn.concat(i || []), r = {};
	return es(e, (function(i) {
		r[i] = Vn(t, i) || null;
	})), r;
}
function ro(t) {
	var i = function(t) {
		return t ? 0 === t.search(Yn + "google.([^/?]*)") ? "google" : 0 === t.search(Yn + "bing.com") ? "bing" : 0 === t.search(Yn + "yahoo.com") ? "yahoo" : 0 === t.search(Yn + "duckduckgo.com") ? "duckduckgo" : null : null;
	}(t), e = "yahoo" != i ? "q" : "p", s = {};
	if (!Q(i)) {
		s.$search_engine = i;
		var n = r ? Vn(r.referrer, e) : "";
		n.length && (s.ph_keyword = n);
	}
	return s;
}
function so() {
	return navigator.language || navigator.userLanguage;
}
var no = "$direct";
function oo() {
	return (null == r ? void 0 : r.referrer) || no;
}
function ao(t, i, e) {
	void 0 === e && (e = !1);
	var r = t ? [...Qn, ...i || []] : [], n = e ? xi(null == s ? void 0 : s.href) : null == s ? void 0 : s.href, o = null == n ? void 0 : n.substring(0, 1e3);
	return {
		r: oo().substring(0, 1e3),
		u: o ? Wn(o, r, Zn) : void 0
	};
}
function lo(t, i) {
	var e;
	void 0 === i && (i = !1);
	var r = t.r, s = t.u, n = i ? xi(s) : s, o = {
		$referrer: r,
		$referring_domain: null == r ? void 0 : r == no ? no : null == (e = Hn(r)) ? void 0 : e.host
	};
	if (n) {
		o.$current_url = n;
		var a = Hn(n);
		o.$host = null == a ? void 0 : a.host, o.$pathname = null == a ? void 0 : a.pathname;
		rs(o, eo(n));
	}
	if (r) rs(o, ro(r));
	return o;
}
function ho() {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone;
	} catch (t) {
		return;
	}
}
function uo() {
	try {
		return (/* @__PURE__ */ new Date()).getTimezoneOffset();
	} catch (t) {
		return;
	}
}
var vo = {
	flags: Cr,
	surveys: xr
};
var co = [
	"cookie",
	"localstorage",
	"localstorage+cookie",
	"sessionstorage",
	"memory"
];
var fo = (t) => t + "_cookie_identity_change_pending";
var po = "main";
var _o = (t, i) => {
	es(t, ((e, r) => {
		var s = zn(r);
		s && "event" !== s.exposure || {}.hasOwnProperty.call(i, r) || delete t[r];
	}));
};
var go = class {
	constructor(i, e, r) {
		if (void 0 === r && (r = !0), this.ea = {}, this.ia = !1, this.ra = !1, this.na = !1, this.sa = !1, this.vn = i, this.aa = r, this.props = {}, this.oa = void 0, this.la = ((t) => {
			var i = "";
			return t.token && (i = t.token.replace(/\+/g, "PL").replace(/\//g, "SL").replace(/=/g, "EQ")), t.persistence_name ? "ph_" + t.persistence_name : "ph_" + i + "_posthog";
		})(i), this.Us = this.ua(i), this.ra = this.ha(i), this.load(), i.debug && Ie.info("Persistence loaded", i.persistence, _({}, this.props)), this.update_config(i, i, e), this.save(), t) {
			var s = () => this.flush();
			us(t, "beforeunload", s, { capture: !1 }), us(t, "pagehide", s, { capture: !1 });
		}
	}
	da() {
		var t, i = null == (t = this.vn) ? void 0 : t.persistence_save_debounce_ms;
		return Z(i) && i > 0 ? i : 0;
	}
	va(t) {
		if (this.vn.cookieWinsOnConflict && "localstorage+cookie" === this.vn.persistence.toLowerCase()) if (t) try {
			var i = Cs(t, this.vn.cookie_persisted_properties || []), e = Is(i, this.vn.cookie_persisted_properties || []), r = JSON.stringify(i) + "|" + JSON.stringify(e), s = xs.ti(this.la) || void 0;
			s && Fs(this.la, s) === r && (this.ca = r, this.fa = s);
		} catch (t) {}
		else try {
			var n = xs.ti(this.la) || void 0;
			this.ca = n ? Fs(this.la, n) : void 0, this.fa = n;
		} catch (t) {}
	}
	syncCookieProperties() {
		return this.pa(this.vn);
	}
	pa(t, i) {
		if (void 0 === i && (i = !1), this.ga && !i || this.sa || !t.cookieWinsOnConflict || "localstorage+cookie" !== t.persistence.toLowerCase()) return !1;
		var e;
		try {
			e = xs.ti(this.la) || void 0;
		} catch (t) {}
		if (!e || e === this.fa) return !1;
		var r, s = Fs(this.la, e);
		try {
			r = Rs(JSON.parse(e));
		} catch (t) {
			return !1;
		}
		if ((xs.ti(this.la) || void 0) !== e) return !1;
		this.ca = s, this.fa = e;
		var n = As(this.la, e), o = [...Ts, ...n.properties], a = {};
		if (Object.keys(r).forEach(((t) => {
			var i = r[t];
			(K(i) || Q(i) || "" === i || t === Or && i !== Wr && i !== Gr) && (a[t] = !0, delete r[t]);
		})), G(r)) return !1;
		var l = je in r || r[Or] === Wr || r[Or] === Gr, h = this.props[je], u = this.props[Or], d = rs({}, this.props);
		[...Ts, ...t.cookie_persisted_properties || []].forEach(((t) => {
			if (-1 !== o.indexOf(t) && !(t in r) && !a[t] && (l || t !== je && t !== Or)) {
				var i = d[t];
				!n.isValid && -1 !== Ts.indexOf(t) && (!1 === i || 0 === i) || delete d[t];
			}
		})), this.props = rs(d, r), !l || Or in r || Or in this.props || this.ma(Or, Wr);
		var v = this.props[je], c = this.props[Or];
		return !l || v === h && c === u || (this.na = !0, Ls.ei(fo(this.la), !0), this.ya(mr), this.ya(ur), this.ya(hr), this.ya(vr), this.ya(cr), this.ya(fr), this.ya(Cr), this.ya(Rr), this.ya($r), c === Wr && (u === Gr || r[Or] === Wr || !K(h) && v !== h) && (_o(this.props, r), this.ya(yr)), c === Gr ? this.props.$user_id = v : delete this.props.$user_id, this.ya(qe)), !0;
	}
	consumeCookieIdentityChange() {
		var t = fo(this.la), i = this.na || !!Ls.ti(t);
		return this.na = !1, i && Ls.ri(t), i;
	}
	ba(t) {
		return void 0 === t && (t = !1), !(this.sa || this.ga && !t || !this.vn.cookieWinsOnConflict || "localstorage+cookie" !== this.vn.persistence.toLowerCase() || (this.sa = !0, 0));
	}
	_a() {
		this.sa && (K(this.wa) || (clearTimeout(this.wa), this.wa = void 0), delete this.ea[po], this.ka(!0));
	}
	Sa(t) {
		if (void 0 === t && (t = !0), this.sa) try {
			t ? this._a() : K(this.wa) || (clearTimeout(this.wa), this.wa = void 0);
		} finally {
			this.sa = !1;
		}
	}
	isDisabled() {
		return !!this.ga;
	}
	ua(i) {
		-1 === co.indexOf(i.persistence.toLowerCase()) && (Ie.critical("Unknown persistence type " + i.persistence + "; falling back to localStorage+cookie"), i.persistence = "localStorage+cookie");
		var e, r = function(i, e) {
			void 0 === i && (i = []), void 0 === e && (e = !1);
			var r = [...Ts, ...i];
			return _({}, Ss, {
				ni(t) {
					try {
						var i, s = {};
						try {
							i = xs.ti(t) || void 0, s = i ? Rs(JSON.parse(i)) : {};
						} catch (t) {}
						var n, o = JSON.parse(Ss.ti(t) || "{}");
						if (e) {
							var a = As(t, i), l = [...Ts, ...a.properties], h = {};
							Object.keys(s).forEach(((t) => {
								var i = s[t];
								Q(i) || "" === i || t === Or && i !== Wr && i !== Gr || (h[t] = i);
							}));
							var u = je in h || h[Or] === Wr || h[Or] === Gr;
							if (Object.keys(h).length > 0) {
								var d, v = o[je], c = null !== (d = o[Or]) && void 0 !== d ? d : Wr;
								r.forEach(((t) => {
									if (-1 !== l.indexOf(t) && !(t in s) && (u || t !== je && t !== Or)) {
										var i = o[t];
										!a.isValid && -1 !== Ts.indexOf(t) && (!1 === i || 0 === i) || delete o[t];
									}
								})), !u || Or in s || Or in o || (o[Or] = Wr), !u || (je in h ? h[je] : o[je]) === v && (Or in h ? h[Or] : o[Or]) === c || (ks.forEach(((t) => delete o[t])), h[Or] === Gr && je in h ? o.$user_id = h[je] : delete o.$user_id, h[Or] !== Gr && (delete o[br], delete o[yr]), delete o.__alias);
							}
							n = rs(o, h);
						} else n = rs(s, o);
						return Ss.ei(t, n), n;
					} catch (t) {}
					return null;
				},
				ei(t, r, s, n, o, a) {
					var l = Ss.ei(t, r, void 0, void 0, a);
					try {
						var h = Cs(r, i);
						if (Object.keys(h).length) {
							if (e) {
								var u = $s(t), d = Is(h, i);
								if (xs.ei(u, d, s, n, o, a), xs.ti(u) !== JSON.stringify(d)) {
									xs.ri(u, n);
									var v = Cs(r);
									return xs.ei(t, v, s, n, o, a), l;
								}
							}
							xs.ei(t, h, s, n, o, a);
						}
					} catch (t) {
						Ss.ii(t);
					}
					return l;
				},
				ri(i, e) {
					try {
						t?.localStorage.removeItem(i), xs.ri(i, e), xs.ri($s(i), e);
					} catch (t) {
						Ss.ii(t);
					}
				}
			});
		}(i.cookie_persisted_properties || [], i.cookieWinsOnConflict), s = !1, n = i.persistence.toLowerCase();
		return "localstorage" === n && Ss.Xr() ? (e = Ss, s = !0) : "localstorage+cookie" === n && r.Xr() ? (e = r, s = !0) : "sessionstorage" === n && Ls.Xr() ? e = Ls : "memory" === n ? e = Ds : "cookie" === n ? e = xs : r.Xr() ? (e = r, s = !0) : e = xs, this.ia = s, e;
	}
	xa(t) {
		return this.la + "__" + t;
	}
	ha(t) {
		return this.ia && !!t.split_storage;
	}
	properties() {
		var t = {};
		return es(this.props, ((i, e) => {
			var r = zn(e);
			if (!r || "event" === r.exposure) {
				if (null != r && null != r.shouldSkipFromEventProperties && r.shouldSkipFromEventProperties(i)) return;
				t[e] = i;
			}
		})), t;
	}
	load(t) {
		if (void 0 === t && (t = !1), !this.ga || t) {
			var i = this.vn.cookieWinsOnConflict && "localstorage+cookie" === this.vn.persistence.toLowerCase(), e = i ? Ss.ni(this.la) : null, r = {};
			if (i) try {
				es(r = Rs(xs.ni(this.la)), ((t, i) => {
					(K(t) || Q(t) || "" === t) && delete r[i];
				}));
			} catch (t) {}
			var s = this.Us.ni(this.la);
			if (s && (this.props = rs({}, s)), this.ra && this.Ca(), i && s) {
				var n, o, a = null == e ? void 0 : e[je], l = null !== (n = null == e ? void 0 : e[Or]) && void 0 !== n ? n : Wr, h = s[je], u = null !== (o = s[Or]) && void 0 !== o ? o : Wr;
				if (h !== a || u !== l) {
					this.na = !0, Ls.ei(fo(this.la), !0);
					var d = rs({}, this.props);
					ks.forEach(((t) => delete d[t])), u === Wr && (l === Gr || r[Or] === Wr || !K(a) && h !== a) && (_o(d, r), delete d[yr]), this.props = d;
					var v = /* @__PURE__ */ new Set();
					ks.forEach(((t) => {
						var i, e = null == (i = zn(t)) ? void 0 : i.storageGroup;
						e && v.add(e);
					})), v.forEach(((t) => {
						var i = {};
						es(this.props, ((e, r) => {
							var s;
							(null == (s = zn(r)) ? void 0 : s.storageGroup) === t && (i[r] = e);
						})), G(i) ? (Ss.ri(this.xa(t)), this.ea[t] = {}) : Ss.ei(this.xa(t), i) && (this.ea[t] = {
							persisted: !0,
							fingerprint: this.Ta(i, t)
						});
					}));
				}
			}
			Ls.ti(fo(this.la)) && (this.na = !0);
		}
	}
	Ca() {
		for (var t of Un) {
			var i = Ss.ni(this.xa(t));
			if (i && !G(i)) {
				var e = this.Ma(t);
				e.persisted = !0, this.Ea(t) || (e.fingerprint = this.Ta(i, t)), this.Ia(t, i) || rs(this.props, i);
			}
		}
	}
	Ea(t) {
		return Object.keys(this.props).some(((i) => {
			var e;
			return (null == (e = zn(i)) ? void 0 : e.storageGroup) === t;
		}));
	}
	Ia(t, i) {
		var e = vo[t];
		if (!e) return !1;
		var r = i[e], s = this.props[e];
		return Z(r) && Z(s) && s > r;
	}
	refreshKey(t) {
		var i;
		if (!this.ga) {
			var e = this.ra ? null == (i = zn(t)) ? void 0 : i.storageGroup : void 0, r = e ? Ss.ni(this.xa(e)) : this.Us.ni(this.la);
			if (r && t in r) this.ma(t, r[t]);
			else {
				if (e) {
					var s = this.Us.ni(this.la);
					if (s && t in s) return void this.ma(t, s[t]);
				}
				this.ya(t);
			}
		}
	}
	save() {
		if (!this.ga) {
			var t = this.da();
			t > 0 ? K(this.wa) && (this.wa = setTimeout((() => {
				this.wa = void 0, this.ka();
			}), t)) : this.ka();
		}
	}
	flush() {
		K(this.wa) || (clearTimeout(this.wa), this.wa = void 0, this.ka());
	}
	ka(t) {
		void 0 === t && (t = !1), this.ga || this.sa && !t || (t || this.syncCookieProperties(), this.ra ? this.Ra() : this.Pa(this.Us, this.la, this.props, po) && this.va(this.props));
	}
	Ra() {
		var t = this.Aa(), i = t.main, e = t.groups;
		for (var r of (this.Pa(this.Us, this.la, i, po) && this.va(i), Un)) {
			var s, n = e[r];
			(!G(n) || null != (s = this.ea[r]) && s.persisted) && this.Pa(Ss, this.xa(r), n, r);
		}
	}
	Aa() {
		var t = {}, i = {
			flags: {},
			surveys: {}
		};
		return es(this.props, ((e, r) => {
			var s, n = null == (s = zn(r)) ? void 0 : s.storageGroup;
			n ? i[n][r] = e : t[r] = e;
		})), {
			main: t,
			groups: i
		};
	}
	Ta(t, i) {
		if (i === po) return JSON.stringify(t) + "|" + this.Fa + "|" + this.Oa + "|" + this.La;
		var e = {};
		return es(t, ((t, i) => {
			var r;
			e[i] = null != (r = zn(i)) && r.volatile ? "__volatile__" : t;
		})), JSON.stringify(e);
	}
	Pa(t, i, e, r) {
		var s, n = this.Ma(r);
		if (r !== po && !n.dirty && !K(n.fingerprint)) return !1;
		try {
			if ((s = this.Ta(e, r)) === n.fingerprint) return n.dirty = !1, !1;
		} catch (t) {
			s = void 0;
		}
		return t.ei(i, e, this.Fa, this.Oa, this.La, this.vn.debug) ? (n.dirty = !1, r !== po && (n.persisted = !0), K(s) || (n.fingerprint = s), !0) : (this.vn.debug && Ie.warn("failed to persist storage entry \"" + i + "\"; will retry on next save"), !1);
	}
	remove(t) {
		var i = (void 0 === t ? {} : t).keepGroupEntries, e = void 0 !== i && i;
		if (K(this.wa) || (clearTimeout(this.wa), this.wa = void 0), this.Us.ri(this.la, !1), this.Us.ri(this.la, !0), !e && this.aa) for (var r of Un) Ss.ri(this.xa(r));
		e ? delete this.ea[po] : this.ea = {}, this.ca = void 0, this.fa = void 0;
	}
	clear() {
		this.remove(), this.props = {};
	}
	register_once(t, i, e) {
		if (W(t)) {
			this.syncCookieProperties(), K(i) && (i = "None"), this.Fa = K(e) ? this.Da : e;
			var r = !1;
			if (es(t, ((t, e) => {
				this.props.hasOwnProperty(e) && this.props[e] !== i || (this.ma(e, t), r = !0);
			})), r) return this.save(), !0;
		}
		return !1;
	}
	register(t, i) {
		if (W(t)) {
			this.syncCookieProperties(), this.Fa = K(i) ? this.Da : i;
			var e = !1;
			if (es(t, ((i, r) => {
				t.hasOwnProperty(r) && (this.props[r] !== i || W(i) || H(i)) && (this.ma(r, i), e = !0);
			})), e) return this.save(), !0;
		}
		return !1;
	}
	unregister(t) {
		this.syncCookieProperties();
		var i = "string" == typeof t ? [t] : t, e = !1;
		for (var r of i) r in this.props && (this.ya(r), e = !0);
		e && this.save();
	}
	update_campaign_params() {
		var t = null == r ? void 0 : r.URL;
		if (t !== this.oa) {
			var i = io(this.vn.custom_campaign_params, this.vn.mask_personal_data_properties, this.vn.custom_personal_data_properties);
			G(as(i)) || this.register(i), this.oa = t;
		}
	}
	update_search_keyword() {
		var t;
		this.register((t = null == r ? void 0 : r.referrer) ? ro(t) : {});
	}
	update_referrer_info() {
		var t;
		this.register_once({
			$referrer: oo(),
			$referring_domain: null != r && r.referrer && (null == (t = Hn(r.referrer)) ? void 0 : t.host) || no
		}, void 0);
	}
	set_initial_person_info() {
		this.props[Fr] || this.props[Mr] || this.register_once({ [Dr]: ao(this.vn.mask_personal_data_properties, this.vn.custom_personal_data_properties, this.vn.disable_capture_url_hashes) }, void 0);
	}
	get_initial_props() {
		var t = {};
		es([Mr, Fr], ((i) => {
			var e = this.props[i];
			e && es(e, (function(i, e) {
				t["$initial_" + U(e)] = i;
			}));
		}));
		var i = this.props[Dr];
		if (i) rs(t, function(t, i) {
			void 0 === i && (i = !1);
			var e = lo(t, i), r = {};
			return es(e, (function(t, i) {
				r["$initial_" + U(i)] = t;
			})), r;
		}(i, this.vn.disable_capture_url_hashes));
		return t;
	}
	safe_merge(t) {
		return es(this.props, (function(i, e) {
			e in t || (t[e] = i);
		})), t;
	}
	update_config(t, i, e) {
		var r = t.persistence !== i.persistence, s = !((t, i) => {
			if (t.length !== i.length) return !1;
			var e = [...t].sort(), r = [...i].sort();
			return e.every(((t, i) => t === r[i]));
		})(t.cookie_persisted_properties || [], i.cookie_persisted_properties || []), n = r || s, o = t.cookieWinsOnConflict !== i.cookieWinsOnConflict, a = t.disable_persistence || !!e, l = !!this.ga && !a;
		a || this.pa(i, l), this.vn = t, !a && (r || s || o) && (this.ca = void 0, this.fa = void 0, this.pa(_({}, t, { cookie_persisted_properties: i.cookie_persisted_properties }), l));
		var h = n || o ? this.ua(t) : this.Us, u = this.ha(t), d = n || u !== this.ra, v = !a && (d || t.cross_subdomain_cookie !== this.Oa || t.secure_cookie !== this.La) && this.ba(l);
		try {
			if (this.Da = this.Fa = t.cookie_expiration, this.set_disabled(a), this.set_cross_subdomain(t.cross_subdomain_cookie), this.set_secure(t.secure_cookie), d) {
				var c = this.props;
				this.clear(), this.Us = h, this.ra = u, this.props = c, this.save();
			} else o && (this.Us = h, a || (delete this.ea[po], this.ka()));
		} finally {
			v && this.Sa();
		}
	}
	set_disabled(t) {
		this.ga = t, this.ga ? this.remove() : this.save();
	}
	set_cross_subdomain(t) {
		t !== this.Oa && (this.Oa = t, this.remove({ keepGroupEntries: !0 }), this.save());
	}
	set_secure(t) {
		t !== this.La && (this.La = t, this.remove({ keepGroupEntries: !0 }), this.save());
	}
	set_event_timer(t, i) {
		var e = this.props[He] || {};
		e[t] = i, this.ma(He, e), this.save();
	}
	remove_event_timer(t) {
		var i = this.props[He] || {}, e = i[t];
		return K(e) || (delete i[t], this.ma(He, i), this.save()), e;
	}
	get_property(t) {
		return this.props[t];
	}
	set_property(t, i) {
		this.ma(t, i), this.save();
	}
	ma(t, i) {
		var e;
		this.props[t] = i, null != (e = zn(t)) && e.volatile || this.$a(t);
	}
	ya(t) {
		delete this.props[t], this.$a(t);
	}
	$a(t) {
		var i, e = null == (i = zn(t)) ? void 0 : i.storageGroup;
		e && (this.Ma(e).dirty = !0);
	}
	Ma(t) {
		return this.ea[t] || (this.ea[t] = {});
	}
};
function mo(t) {
	var i = !0;
	return { dispose() {
		if (i) {
			i = !1;
			var e = t();
			e && V(e.then) && e.then(void 0, (() => {}));
		}
	} };
}
var yo = {
	GZipJS: "gzip-js",
	Base64: "base64"
};
var bo = {
	Activation: "events",
	Cancellation: "cancelEvents"
};
var So = {
	Popover: "popover",
	API: "api",
	Widget: "widget",
	ExternalSurvey: "external_survey"
};
var Po = {
	SHOWN: "survey shown",
	DISMISSED: "survey dismissed",
	SENT: "survey sent",
	ABANDONED: "survey abandoned"
};
var Ro = {
	SURVEY_ID: "$survey_id",
	SURVEY_NAME: "$survey_name",
	SURVEY_RESPONSE: "$survey_response",
	SURVEY_ITERATION: "$survey_iteration",
	SURVEY_ITERATION_START_DATE: "$survey_iteration_start_date",
	SURVEY_PARTIALLY_COMPLETED: "$survey_partially_completed",
	SURVEY_SUBMISSION_ID: "$survey_submission_id",
	SURVEY_QUESTIONS: "$survey_questions",
	SURVEY_COMPLETED: "$survey_completed",
	PRODUCT_TOUR_ID: "$product_tour_id",
	SURVEY_LAST_SEEN_DATE: "$survey_last_seen_date",
	SURVEY_LANGUAGE: "$survey_language"
};
var Co = {
	Popover: "popover",
	Inline: "inline"
};
var Io = {
	SHOWN: "product tour shown",
	DISMISSED: "product tour dismissed",
	COMPLETED: "product tour completed",
	STEP_SHOWN: "product tour step shown",
	STEP_COMPLETED: "product tour step completed",
	BUTTON_CLICKED: "product tour button clicked",
	STEP_SELECTOR_FAILED: "product tour step selector failed",
	BANNER_CONTAINER_SELECTOR_FAILED: "product tour banner container selector failed",
	BANNER_ACTION_CLICKED: "product tour banner action clicked"
};
var Ao = {
	TOUR_ID: "$product_tour_id",
	TOUR_NAME: "$product_tour_name",
	TOUR_ITERATION: "$product_tour_iteration",
	TOUR_RENDER_REASON: "$product_tour_render_reason",
	TOUR_STEP_ID: "$product_tour_step_id",
	TOUR_STEP_ORDER: "$product_tour_step_order",
	TOUR_STEP_TYPE: "$product_tour_step_type",
	TOUR_DISMISS_REASON: "$product_tour_dismiss_reason",
	TOUR_BUTTON_TEXT: "$product_tour_button_text",
	TOUR_BUTTON_ACTION: "$product_tour_button_action",
	TOUR_BUTTON_LINK: "$product_tour_button_link",
	TOUR_BUTTON_TOUR_ID: "$product_tour_button_tour_id",
	TOUR_STEPS_COUNT: "$product_tour_steps_count",
	TOUR_STEP_SELECTOR: "$product_tour_step_selector",
	TOUR_STEP_SELECTOR_FOUND: "$product_tour_step_selector_found",
	TOUR_STEP_ELEMENT_TAG: "$product_tour_step_element_tag",
	TOUR_STEP_ELEMENT_ID: "$product_tour_step_element_id",
	TOUR_STEP_ELEMENT_CLASSES: "$product_tour_step_element_classes",
	TOUR_STEP_ELEMENT_TEXT: "$product_tour_step_element_text",
	TOUR_ERROR: "$product_tour_error",
	TOUR_MATCHES_COUNT: "$product_tour_matches_count",
	TOUR_FAILURE_PHASE: "$product_tour_failure_phase",
	TOUR_WAITED_FOR_ELEMENT: "$product_tour_waited_for_element",
	TOUR_WAIT_DURATION_MS: "$product_tour_wait_duration_ms",
	TOUR_BANNER_SELECTOR: "$product_tour_banner_selector",
	TOUR_LINKED_SURVEY_ID: "$product_tour_linked_survey_id",
	USE_MANUAL_SELECTOR: "$use_manual_selector",
	INFERENCE_DATA_PRESENT: "$inference_data_present",
	TOUR_LAST_SEEN_DATE: "$product_tour_last_seen_date",
	TOUR_TYPE: "$product_tour_type"
};
var Fo = Ae("[RateLimiter]");
var Mo = class {
	constructor(t) {
		this.serverLimits = {}, this.lastEventRateLimited = !1, this.checkForLimiting = (t) => {
			var i = t.text;
			if (i && i.length) try {
				(JSON.parse(i).quota_limited || []).forEach(((t) => {
					Fo.info((t || "events") + " is quota limited."), this.serverLimits[t] = (/* @__PURE__ */ new Date()).getTime() + 6e4;
				}));
			} catch (t) {
				Fo.warn("could not rate limit - continuing. Error: \"" + (null == t ? void 0 : t.message) + "\"", { text: i });
				return;
			}
		}, this.instance = t, this.lastEventRateLimited = this.clientRateLimitContext(!0).isRateLimited;
	}
	get captureEventsPerSecond() {
		var t;
		return (null == (t = this.instance.config.rate_limiting) ? void 0 : t.events_per_second) || 10;
	}
	get captureEventsBurstLimit() {
		var t;
		return Math.max((null == (t = this.instance.config.rate_limiting) ? void 0 : t.events_burst_limit) || 10 * this.captureEventsPerSecond, this.captureEventsPerSecond);
	}
	clientRateLimitContext(t) {
		var i, e, r;
		void 0 === t && (t = !1);
		var s = this.captureEventsBurstLimit, n = this.captureEventsPerSecond, o = (/* @__PURE__ */ new Date()).getTime(), a = null !== (i = null == (e = this.instance.persistence) ? void 0 : e.get_property(Ar)) && void 0 !== i ? i : {
			tokens: s,
			last: o
		};
		a.tokens += (o - a.last) / 1e3 * n, a.last = o, a.tokens > s && (a.tokens = s);
		var l = 1 > a.tokens;
		if (l || t || (a.tokens = Math.max(0, a.tokens - 1)), l && !t) {
			var h = (Z(a.dropped) ? a.dropped : 0) + 1;
			a.dropped = h, !this.lastEventRateLimited && this.Na(h) && (a.dropped = 0);
		}
		return this.lastEventRateLimited = l, null == (r = this.instance.persistence) || r.set_property(Ar, a), {
			isRateLimited: l,
			remainingTokens: a.tokens
		};
	}
	qa(t) {
		var i = this.instance.config.property_denylist;
		return !H(i) || !i.includes(t);
	}
	ja() {
		var t;
		if (this.qa("$current_url") && this.qa("$pathname") && null != s && s.pathname) return "" + (null !== (t = s.origin) && void 0 !== t ? t : "") + s.pathname;
	}
	Na(t) {
		var i, e, r = this.captureEventsBurstLimit, s = this.captureEventsPerSecond, n = this.ja(), o = this.qa("$session_id") ? null == (i = (e = this.instance).get_session_id) ? void 0 : i.call(e) : void 0, a = [
			t + " event(s) dropped since the last warning",
			n ? "triggered on " + n : void 0,
			o ? "session " + o : void 0
		].filter(Boolean).join(", ");
		return !!this.instance.capture("$$client_ingestion_warning", { $$client_ingestion_warning_message: "posthog-js client rate limited: " + a + ". Config is set to " + s + " events per second and " + r + " events burst limit." }, { skip_client_rate_limiting: !0 });
	}
	isServerRateLimited(t) {
		var i = this.serverLimits[t || "events"] || !1;
		return !1 !== i && (/* @__PURE__ */ new Date()).getTime() < i;
	}
};
var Do = Ae("[RemoteConfig]");
var No = class {
	constructor(t) {
		this._instance = t;
	}
	get remoteConfig() {
		var t;
		return null == (t = v._POSTHOG_REMOTE_CONFIG) || null == (t = t[this._instance.config.token]) ? void 0 : t.config;
	}
	Ba(t) {
		var i, e;
		null != (i = v.__PosthogExtensions__) && i.loadExternalDependency ? null == (e = v.__PosthogExtensions__) || null == e.loadExternalDependency || e.loadExternalDependency(this._instance, "remote-config", (() => t(this.remoteConfig))) : t();
	}
	Ha(t) {
		this._instance._send_request({
			method: "GET",
			url: this._instance.requestRouter.endpointFor("assets", "/array/" + this._instance.config.token + "/config"),
			callback: t
		});
	}
	load() {
		try {
			if (this.remoteConfig) return Do.info("Using preloaded remote config", this.remoteConfig), void this.za(this.remoteConfig);
			if (this._instance.Ua()) return void Do.warn("Remote config is disabled. Falling back to local config.");
			this.Ba(((t) => {
				if (!t) return Do.info("No config found after loading remote JS config. Falling back to JSON."), void this.Ha(((t) => {
					this.za(t.json, t);
				}));
				this.za(t);
			}));
		} catch (t) {
			Do.error("Error loading remote config", t), this.za();
		}
	}
	za(t, i) {
		!t && i && (0 === i.statusCode ? i.error || Do.warn("Failed to fetch remote config from PostHog.") : Do.error("Failed to fetch remote config from PostHog."));
		try {
			this._instance.za(t ? {
				ok: !0,
				config: t
			} : { ok: !1 });
		} catch (t) {
			Do.error("Error applying remote config", t);
		}
		if (!1 !== (null == t ? void 0 : t.hasFeatureFlags) && !this._instance.config.advanced_disable_feature_flags_on_first_load) try {
			var e;
			null == (e = this._instance.featureFlags) || e.ensureFlagsLoaded();
		} catch (t) {
			Do.error("Error loading feature flags", t);
		}
	}
};
var Uo = Uint8Array;
var jo = Uint16Array;
var Bo = Uint32Array;
var zo = new Uo([
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	2,
	2,
	2,
	2,
	3,
	3,
	3,
	3,
	4,
	4,
	4,
	4,
	5,
	5,
	5,
	5,
	0,
	0,
	0,
	0
]);
var qo = new Uo([
	0,
	0,
	0,
	0,
	1,
	1,
	2,
	2,
	3,
	3,
	4,
	4,
	5,
	5,
	6,
	6,
	7,
	7,
	8,
	8,
	9,
	9,
	10,
	10,
	11,
	11,
	12,
	12,
	13,
	13,
	0,
	0
]);
var Ho = new Uo([
	16,
	17,
	18,
	0,
	8,
	7,
	9,
	6,
	10,
	5,
	11,
	4,
	12,
	3,
	13,
	2,
	14,
	1,
	15
]);
var Vo = function(t, i) {
	for (var e = new jo(31), r = 0; 31 > r; ++r) e[r] = i += 1 << t[r - 1];
	var s = new Bo(e[30]);
	for (r = 1; 30 > r; ++r) for (var n = e[r]; e[r + 1] > n; ++n) s[n] = n - e[r] << 5 | r;
	return [e, s];
};
var Wo = Vo(zo, 2);
var Go = Wo[1];
Wo[0][28] = 258, Go[258] = 28;
for (var Ko = Vo(qo, 0)[1], Jo = new jo(32768), Yo = 0; 32768 > Yo; ++Yo) {
	var Qo = (43690 & Yo) >>> 1 | (21845 & Yo) << 1;
	Jo[Yo] = ((65280 & (Qo = (61680 & (Qo = (52428 & Qo) >>> 2 | (13107 & Qo) << 2)) >>> 4 | (3855 & Qo) << 4)) >>> 8 | (255 & Qo) << 8) >>> 1;
}
var Xo = function(t, i, e) {
	for (var r = t.length, s = 0, n = new jo(i); r > s; ++s) ++n[t[s] - 1];
	var o, a = new jo(i);
	for (s = 0; i > s; ++s) a[s] = a[s - 1] + n[s - 1] << 1;
	if (e) {
		o = new jo(1 << i);
		var l = 15 - i;
		for (s = 0; r > s; ++s) if (t[s]) for (var h = s << 4 | t[s], u = i - t[s], d = a[t[s] - 1]++ << u, v = d | (1 << u) - 1; v >= d; ++d) o[Jo[d] >>> l] = h;
	} else for (o = new jo(r), s = 0; r > s; ++s) o[s] = Jo[a[t[s] - 1]++] >>> 15 - t[s];
	return o;
};
var Zo = new Uo(288);
for (Yo = 0; 144 > Yo; ++Yo) Zo[Yo] = 8;
for (Yo = 144; 256 > Yo; ++Yo) Zo[Yo] = 9;
for (Yo = 256; 280 > Yo; ++Yo) Zo[Yo] = 7;
for (Yo = 280; 288 > Yo; ++Yo) Zo[Yo] = 8;
var ta = new Uo(32);
for (Yo = 0; 32 > Yo; ++Yo) ta[Yo] = 5;
var ia = Xo(Zo, 9, 0);
var ea = Xo(ta, 5, 0);
var ra = function(t) {
	return (t / 8 >> 0) + (7 & t && 1);
};
var sa = function(t, i, e) {
	(null == e || e > t.length) && (e = t.length);
	var r = new (t instanceof jo ? jo : t instanceof Bo ? Bo : Uo)(e - i);
	return r.set(t.subarray(i, e)), r;
};
var na = function(t, i, e) {
	var r = i / 8 >> 0;
	t[r] |= e <<= 7 & i, t[r + 1] |= e >>> 8;
};
var oa = function(t, i, e) {
	var r = i / 8 >> 0;
	t[r] |= e <<= 7 & i, t[r + 1] |= e >>> 8, t[r + 2] |= e >>> 16;
};
var aa = function(t, i) {
	for (var e = [], r = 0; t.length > r; ++r) t[r] && e.push({
		s: r,
		f: t[r]
	});
	var s = e.length, n = e.slice();
	if (!s) return [new Uo(0), 0];
	if (1 == s) {
		var o = new Uo(e[0].s + 1);
		return o[e[0].s] = 1, [o, 1];
	}
	e.sort((function(t, i) {
		return t.f - i.f;
	})), e.push({
		s: -1,
		f: 25001
	});
	var a = e[0], l = e[1], h = 0, u = 1, d = 2;
	for (e[0] = {
		s: -1,
		f: a.f + l.f,
		l: a,
		r: l
	}; u != s - 1;) a = e[e[d].f > e[h].f ? h++ : d++], l = e[h != u && e[d].f > e[h].f ? h++ : d++], e[u++] = {
		s: -1,
		f: a.f + l.f,
		l: a,
		r: l
	};
	var v = n[0].s;
	for (r = 1; s > r; ++r) n[r].s > v && (v = n[r].s);
	var c = new jo(v + 1), f = la(e[u - 1], c, 0);
	if (f > i) {
		r = 0;
		var p = 0, _ = f - i, g = 1 << _;
		for (n.sort((function(t, i) {
			return c[i.s] - c[t.s] || t.f - i.f;
		})); s > r; ++r) {
			var m = n[r].s;
			if (i >= c[m]) break;
			p += g - (1 << f - c[m]), c[m] = i;
		}
		for (p >>>= _; p > 0;) {
			var y = n[r].s;
			i > c[y] ? p -= 1 << i - c[y]++ - 1 : ++r;
		}
		for (; r >= 0 && p; --r) {
			var b = n[r].s;
			c[b] == i && (--c[b], ++p);
		}
		f = i;
	}
	return [new Uo(c), f];
};
var la = function(t, i, e) {
	return -1 == t.s ? Math.max(la(t.l, i, e + 1), la(t.r, i, e + 1)) : i[t.s] = e;
};
var ha = function(t) {
	for (var i = t.length; i && !t[--i];);
	for (var e = new jo(++i), r = 0, s = t[0], n = 1, o = function(t) {
		e[r++] = t;
	}, a = 1; i >= a; ++a) if (t[a] == s && a != i) ++n;
	else {
		if (!s && n > 2) {
			for (; n > 138; n -= 138) o(32754);
			n > 2 && (o(n > 10 ? n - 11 << 5 | 28690 : n - 3 << 5 | 12305), n = 0);
		} else if (n > 3) {
			for (o(s), --n; n > 6; n -= 6) o(8304);
			n > 2 && (o(n - 3 << 5 | 8208), n = 0);
		}
		for (; n--;) o(s);
		n = 1, s = t[a];
	}
	return [e.subarray(0, r), i];
};
var ua = function(t, i) {
	for (var e = 0, r = 0; i.length > r; ++r) e += t[r] * i[r];
	return e;
};
var da = function(t, i, e) {
	var r = e.length, s = ra(i + 2);
	t[s] = 255 & r, t[s + 1] = r >>> 8, t[s + 2] = 255 ^ t[s], t[s + 3] = 255 ^ t[s + 1];
	for (var n = 0; r > n; ++n) t[s + n + 4] = e[n];
	return 8 * (s + 4 + r);
};
var va = function(t, i, e, r, s, n, o, a, l, h, u) {
	na(i, u++, e), ++s[256];
	for (var d = aa(s, 15), v = d[0], c = d[1], f = aa(n, 15), p = f[0], _ = f[1], g = ha(v), m = g[0], y = g[1], b = ha(p), w = b[0], x = b[1], E = new jo(19), S = 0; m.length > S; ++S) E[31 & m[S]]++;
	for (S = 0; w.length > S; ++S) E[31 & w[S]]++;
	for (var k = aa(E, 7), T = k[0], P = k[1], R = 19; R > 4 && !T[Ho[R - 1]]; --R);
	var C, O, I, A, F = h + 5 << 3, M = ua(s, Zo) + ua(n, ta) + o, D = ua(s, v) + ua(n, p) + o + 14 + 3 * R + ua(E, T) + (2 * E[16] + 3 * E[17] + 7 * E[18]);
	if (M >= F && D >= F) return da(i, u, t.subarray(l, l + h));
	if (na(i, u, 1 + (M > D)), u += 2, M > D) {
		C = Xo(v, c, 0), O = v, I = Xo(p, _, 0), A = p;
		var N = Xo(T, P, 0);
		for (na(i, u, y - 257), na(i, u + 5, x - 1), na(i, u + 10, R - 4), u += 14, S = 0; R > S; ++S) na(i, u + 3 * S, T[Ho[S]]);
		u += 3 * R;
		for (var L = [m, w], U = 0; 2 > U; ++U) {
			var j = L[U];
			for (S = 0; j.length > S; ++S) na(i, u, N[B = 31 & j[S]]), u += T[B], B > 15 && (na(i, u, j[S] >>> 5 & 127), u += j[S] >>> 12);
		}
	} else C = ia, O = Zo, I = ea, A = ta;
	for (S = 0; a > S; ++S) if (r[S] > 255) {
		var B;
		oa(i, u, C[257 + (B = r[S] >>> 18 & 31)]), u += O[B + 257], B > 7 && (na(i, u, r[S] >>> 23 & 31), u += zo[B]);
		var z = 31 & r[S];
		oa(i, u, I[z]), u += A[z], z > 3 && (oa(i, u, r[S] >>> 5 & 8191), u += qo[z]);
	} else oa(i, u, C[r[S]]), u += O[r[S]];
	return oa(i, u, C[256]), u + O[256];
};
var ca = new Bo([
	65540,
	131080,
	131088,
	131104,
	262176,
	1048704,
	1048832,
	2114560,
	2117632
]);
var fa = function() {
	for (var t = new Bo(256), i = 0; 256 > i; ++i) {
		for (var e = i, r = 9; --r;) e = (1 & e && 3988292384) ^ e >>> 1;
		t[i] = e;
	}
	return t;
}();
var pa = function(t, i, e) {
	for (; e; ++i) t[i] = e, e >>>= 8;
};
function _a(t, i) {
	void 0 === i && (i = {});
	var e = function() {
		var t = 4294967295;
		return {
			p(i) {
				for (var e = t, r = 0; i.length > r; ++r) e = fa[255 & e ^ i[r]] ^ e >>> 8;
				t = e;
			},
			d() {
				return 4294967295 ^ t;
			}
		};
	}(), r = t.length;
	e.p(t);
	var s, n, o, a, l, h = (a = 10 + ((s = i).filename && s.filename.length + 1 || 0), l = 8, function(t, i, e, r, s, n) {
		var o = t.length, a = new Uo(r + o + 5 * (1 + Math.floor(o / 7e3)) + s), l = a.subarray(r, a.length - s), h = 0;
		if (!i || 8 > o) for (var u = 0; o >= u; u += 65535) {
			var d = u + 65535;
			o > d ? h = da(l, h, t.subarray(u, d)) : (l[u] = !0, h = da(l, h, t.subarray(u, o)));
		}
		else {
			for (var v = ca[i - 1], c = v >>> 13, f = 8191 & v, p = (1 << e) - 1, _ = new jo(32768), g = new jo(p + 1), m = Math.ceil(e / 3), y = 2 * m, b = function(i) {
				return (t[i] ^ t[i + 1] << m ^ t[i + 2] << y) & p;
			}, w = new Bo(25e3), x = new jo(288), E = new jo(32), S = 0, k = 0, T = (u = 0, 0), P = 0, R = 0; o > u; ++u) {
				var C = b(u), O = 32767 & u, I = g[C];
				if (_[O] = I, g[C] = O, u >= P) {
					var A = o - u;
					if ((S > 7e3 || T > 24576) && A > 423) {
						h = va(t, l, 0, w, x, E, k, T, R, u - R, h), T = S = k = 0, R = u;
						for (var F = 0; 286 > F; ++F) x[F] = 0;
						for (F = 0; 30 > F; ++F) E[F] = 0;
					}
					var M = 2, D = 0, N = f, L = O - I & 32767;
					if (A > 2 && C == b(u - L)) for (var U = Math.min(c, A) - 1, j = Math.min(32767, u), B = Math.min(258, A); j >= L && --N && O != I;) {
						if (t[u + M] == t[u + M - L]) {
							for (var z = 0; B > z && t[u + z] == t[u + z - L]; ++z);
							if (z > M) {
								if (M = z, D = L, z > U) break;
								var q = Math.min(L, z - 2), H = 0;
								for (F = 0; q > F; ++F) {
									var V = u - L + F + 32768 & 32767, W = V - _[V] + 32768 & 32767;
									W > H && (H = W, I = V);
								}
							}
						}
						L += (O = I) - (I = _[O]) + 32768 & 32767;
					}
					if (D) {
						w[T++] = 268435456 | Go[M] << 18 | Ko[D];
						var G = 31 & Go[M], K = 31 & Ko[D];
						k += zo[G] + qo[K], ++x[257 + G], ++E[K], P = u + M, ++S;
					} else w[T++] = t[u], ++x[t[u]];
				}
			}
			h = va(t, l, !0, w, x, E, k, T, R, u - R, h);
		}
		return sa(a, 0, r + ra(h) + s);
	}(n = t, null == (o = i).level ? 6 : o.level, null == o.mem ? Math.ceil(1.5 * Math.max(8, Math.min(13, Math.log(n.length)))) : 12 + o.mem, a, l)), u = h.length;
	return function(t, i) {
		var e = i.filename;
		if (t[0] = 31, t[1] = 139, t[2] = 8, t[8] = 2 > i.level ? 4 : 9 == i.level ? 2 : 0, t[9] = 3, 0 != i.mtime && pa(t, 4, Math.floor(new Date(i.mtime || Date.now()) / 1e3)), e) {
			t[3] = 8;
			for (var r = 0; e.length >= r; ++r) t[r + 10] = e.charCodeAt(r);
		}
	}(h, i), pa(h, u - 8, e.d()), pa(h, u - 4, r), h;
}
var ga = !!o || !!n;
var ma = "text/plain";
var ya = !1;
var ba = (t, i) => {
	var e = t.split("#"), r = e[1], s = e[0].split("?"), n = s[0], o = s[1];
	if (!o) return t;
	var a = o.split("&").filter(((t) => t.split("=")[0] !== i)).join("&");
	return n + (a ? "?" + a : "") + (r ? "#" + r : "");
};
var wa = function(t, i, e) {
	var r;
	void 0 === e && (e = !0);
	var s = t.split("?"), n = s[0], o = s[1], a = _({}, i), l = null !== (r = null == o ? void 0 : o.split("&").map(((t) => {
		var i, r = t.split("="), s = r[0], n = e && null !== (i = a[s]) && void 0 !== i ? i : r[1];
		return delete a[s], s + "=" + n;
	}))) && void 0 !== r ? r : [], h = function(t, i) {
		var e, r;
		void 0 === i && (i = "&");
		var s = [];
		return es(t, (function(t, i) {
			K(t) || K(i) || "undefined" === i || (e = encodeURIComponent(((t) => t instanceof File)(t) ? t.name : t.toString()), r = encodeURIComponent(i), s[s.length] = r + "=" + e);
		})), s.join(i);
	}(a);
	return h && l.push(h), l.length > 0 ? n + "?" + l.join("&") : n;
};
var xa = (t) => {
	if (t.Wa) return t.Wa;
	var i = t.data, e = t.compression;
	if (i) {
		if (e === yo.GZipJS) {
			var r = _a(function(t, i) {
				var e = t.length;
				if ("undefined" != typeof TextEncoder) return new TextEncoder().encode(t);
				for (var r = new Uo(t.length + (t.length >>> 1)), s = 0, n = function(t) {
					r[s++] = t;
				}, o = 0; e > o; ++o) {
					if (s + 5 > r.length) {
						var a = new Uo(s + 8 + (e - o << 1));
						a.set(r), r = a;
					}
					var l = t.charCodeAt(o);
					128 > l ? n(l) : 2048 > l ? (n(192 | l >>> 6), n(128 | 63 & l)) : l > 55295 && 57344 > l ? (n(240 | (l = 65536 + (1047552 & l) | 1023 & t.charCodeAt(++o)) >>> 18), n(128 | l >>> 12 & 63), n(128 | l >>> 6 & 63), n(128 | 63 & l)) : (n(224 | l >>> 12), n(128 | l >>> 6 & 63), n(128 | 63 & l));
				}
				return sa(r, 0, s);
			}(qn(i)), { mtime: 0 });
			return {
				contentType: ma,
				body: r.buffer.slice(r.byteOffset, r.byteOffset + r.byteLength),
				estimatedSize: r.byteLength
			};
		}
		if (e === yo.Base64) {
			var n = ((t) => "data=" + encodeURIComponent("string" == typeof t ? t : qn(t)))(function(t) {
				return t ? btoa(encodeURIComponent(t).replace(/%([0-9A-F]{2})/g, ((t, i) => String.fromCharCode(parseInt(i, 16))))) : t;
			}(qn(i)));
			return {
				contentType: "application/x-www-form-urlencoded",
				body: n,
				estimatedSize: new Blob([n]).size
			};
		}
		var o = qn(i);
		return {
			contentType: "application/json",
			body: o,
			estimatedSize: new Blob([o]).size
		};
	}
};
var Ea = (t) => {
	var i, e, r = () => "sendBeacon" === t.transport ? {
		url: wa(t.url, { compression: yo.Base64 }),
		encodedBody: xa(_({}, t, {
			compression: yo.Base64,
			Wa: void 0
		}))
	} : {
		url: ba(t.url, "compression"),
		encodedBody: xa(_({}, t, {
			compression: void 0,
			Wa: void 0
		}))
	};
	try {
		i = xa(t);
	} catch (i) {
		if (Ri(t.compression, Vn(t.url, "compression"))) return Ie.error("Failed to gzip request body, sending uncompressed payload", i), r();
		throw i;
	}
	return i && Ri(t.compression, Vn(t.url, "compression")) && !((e = i.body) instanceof ArrayBuffer ? Pi(new Uint8Array(e)) : ArrayBuffer.isView(e) && Pi(new Uint8Array(e.buffer, e.byteOffset, e.byteLength))) ? (ya = !0, r()) : {
		url: t.url,
		encodedBody: i
	};
};
var Sa = (t) => {
	try {
		return Ea(t);
	} catch (i) {
		Ie.error(i), null == t.callback || t.callback({
			statusCode: 0,
			error: i
		});
		return;
	}
};
var ka = function() {
	var t = p((function* (t) {
		var e = yield function(t, i, e) {
			return Ai.apply(this, arguments);
		}(qn(t.data), c.DEBUG, { rethrow: !0 });
		if (!e) return t;
		var r = yield e.arrayBuffer();
		return _({}, t, { Wa: {
			contentType: ma,
			body: r,
			estimatedSize: r.byteLength
		} });
	}));
	return function(i) {
		return t.apply(this, arguments);
	};
}();
var Ta = /Failed to fetch|NetworkError|Load failed/i;
var $a = (t) => "TypeError" === (null == t ? void 0 : t.name) && Ta.test((null == t ? void 0 : t.message) || "");
var Pa = (t) => {
	var i = Sa(t);
	if (i) {
		var e = i.url, r = i.encodedBody, s = null != r ? r : {}, o = s.contentType, l = s.body, h = s.estimatedSize, u = new Headers();
		es(t.headers, (function(t, i) {
			u.append(i, t);
		})), o && u.append("Content-Type", o);
		var d = null, v = !1;
		if (a) {
			var c = new a();
			d = {
				signal: c.signal,
				timeout: setTimeout((() => {
					var i;
					v = !0, c.abort(wi("AbortError", "PostHog request timed out" + ((i = t.timeout) ? " after " + i + "ms" : "")));
				}), t.timeout)
			};
		}
		var f = (i) => {
			v && "AbortError" === (null == i ? void 0 : i.name) || $a(i) ? Ie.warn(i) : Ie.error(i), null == t.callback || t.callback({
				statusCode: 0,
				error: i
			});
		};
		try {
			var p;
			n(e, _({
				method: (null == t ? void 0 : t.method) || "GET",
				headers: u,
				keepalive: "POST" === t.method && !t.Va && 52428.8 > (h || 0),
				body: l,
				signal: null == (p = d) ? void 0 : p.signal
			}, t.fetchOptions)).then(((i) => i.text().then(((e) => {
				var r = {
					statusCode: i.status,
					text: e
				};
				if (200 === i.status) try {
					r.json = JSON.parse(e);
				} catch (t) {
					Ie.error(t);
				}
				null == t.callback || t.callback(r);
			})))).catch(f).finally((() => d ? clearTimeout(d.timeout) : null));
		} catch (t) {
			d && clearTimeout(d.timeout), f(t);
		}
	}
};
var Ra = (t) => {
	try {
		var i, r = Ea(t), s = r.url, n = r.encodedBody, o = null != n ? n : {}, a = o.body, l = o.estimatedSize;
		if (!a) return;
		var h = a instanceof Blob ? a : new Blob([a], { type: o.contentType });
		if (e.sendBeacon(s, h)) return;
		var u = H(t.data) ? t.data : null == (i = t.data) ? void 0 : i.batch;
		if (H(u) && u.length > 1 && (null != l ? l : 0) > 16384) {
			var d = Math.ceil(u.length / 2), v = (i) => H(t.data) ? i : _({}, t.data, { batch: i });
			Ra(_({}, t, { data: v(u.slice(0, d)) })), Ra(_({}, t, { data: v(u.slice(d)) }));
			return;
		}
		Ie.warn("Beacon of ~" + (null != l ? l : 0) + " bytes was rejected by the browser, falling back to fetch"), Pa(_({}, t, { Va: !0 }));
	} catch (t) {
		Ie.warn("Beacon send failed", t);
	}
};
var Ca = (t, i, e, r) => {
	var s = "query" === r ? "POST" === i ? "sent_at" : "_" : void 0;
	return wa(e === yo.GZipJS ? ba(t, "compression") : t, _({}, s ? { [s]: Date.now().toString() } : {}, e === yo.GZipJS ? {} : { compression: e }));
};
var Oa = [];
n && Oa.push({
	transport: "fetch",
	method: Pa
}), o && Oa.push({
	transport: "XHR",
	method(t) {
		var i = Sa(t);
		if (i) {
			var e = new o(), r = i.encodedBody;
			e.open(t.method || "GET", i.url, !0);
			var s = null != r ? r : {}, n = s.contentType, a = s.body;
			es(t.headers, (function(t, i) {
				e.setRequestHeader(i, t);
			})), n && e.setRequestHeader("Content-Type", n), t.timeout && (e.timeout = t.timeout), e.onreadystatechange = () => {
				if (4 === e.readyState) {
					var i = {
						statusCode: e.status,
						text: e.responseText
					};
					if (200 === e.status) try {
						i.json = JSON.parse(e.responseText);
					} catch (t) {}
					null == t.callback || t.callback(i);
				}
			}, e.send(a);
		}
	}
}), null != e && e.sendBeacon && Oa.push({
	transport: "sendBeacon",
	method: Ra
});
var Ia = 3e3;
var Aa = class {
	constructor(t, i) {
		this.Ga = !0, this.Za = [], this.Qa = ct((null == i ? void 0 : i.flush_interval_ms) || Ia, 250, 5e3, Ie.createLogger("flush interval"), Ia), this.Ja = t;
	}
	enqueue(t) {
		this.Za.push(t), this.Ka || this.Ya();
	}
	unload() {
		this.Xa();
		var t = this.Za.length > 0 ? this.eo() : {}, i = Object.values(t);
		[...i.filter(((t) => 0 === t.url.indexOf("/e"))), ...i.filter(((t) => 0 !== t.url.indexOf("/e")))].map(((t) => {
			this.io(_({}, t, { transport: "sendBeacon" }));
		}));
	}
	enable() {
		this.Ga = !1, this.Ya();
	}
	Ya() {
		var t = this;
		this.Ga || (this.Ka = setTimeout((() => {
			if (this.Xa(), this.Za.length > 0) {
				var i = this.eo(), e = function() {
					var e = i[r], s = (/* @__PURE__ */ new Date()).getTime();
					e.data && H(e.data) && es(e.data, ((t) => {
						t.offset = Math.abs(t.timestamp - s), delete t.timestamp;
					})), t.io(e);
				};
				for (var r in i) e();
			}
		}), this.Qa));
	}
	io(t) {
		try {
			this.Ja(t);
		} catch (t) {
			Ie.error(t);
		}
	}
	Xa() {
		clearTimeout(this.Ka), this.Ka = void 0;
	}
	eo() {
		var t = {};
		return es(this.Za, ((i) => {
			var e, r = i, s = (r ? r.batchKey : null) || r.url;
			K(t[s]) && (t[s] = _({}, r, { data: [] })), null == (e = t[s].data) || e.push(r.data);
		})), this.Za = [], t;
	}
};
var Fa = ["retriesPerformedSoFar"];
var Ma = class {
	constructor(i) {
		this.ro = !1, this.no = 3e3, this.Za = [], this._instance = i, this.Za = [], this.so = !0, !K(t) && "onLine" in t.navigator && (this.so = t.navigator.onLine, this.ao = () => {
			this.so = !0, this.oo();
		}, this.lo = () => {
			this.so = !1;
		}, us(t, "online", this.ao), us(t, "offline", this.lo));
	}
	get length() {
		return this.Za.length;
	}
	retriableRequest(t) {
		var i = t.retriesPerformedSoFar, e = g(t, Fa);
		tt(i) && (e.url = wa(e.url, { retry_count: i })), this._instance._send_request(_({}, e, { callback: (t) => {
			if (200 !== t.statusCode && (400 > t.statusCode || t.statusCode >= 500)) {
				if ((0 === t.statusCode ? 3 : 10) > (null != i ? i : 0)) return void this.Yn(_({ retriesPerformedSoFar: i }, e));
				0 === t.statusCode && Ie.warn("Request failed before receiving an HTTP response; this can happen due to network issues, CORS, browser blocking, or ad blockers. Stopped retrying after " + (null != i ? i : 0) + " retries.");
			}
			null == e.callback || e.callback(t);
		} }));
	}
	Yn(t) {
		var i = t.retriesPerformedSoFar || 0;
		t.retriesPerformedSoFar = i + 1;
		var e = function(t) {
			var i = 3e3 * Math.pow(2, t), e = i / 2, r = Math.min(18e5, i), s = Math.random() - .5;
			return Math.ceil(r + s * (r - e));
		}(i), r = Date.now() + e;
		this.Za.push({
			retryAt: r,
			requestOptions: t
		});
		var s = "Enqueued failed request for retry in " + e;
		navigator.onLine || (s += " (Browser is offline)"), Ie.warn(s), this.ro || (this.ro = !0, this.uo());
	}
	uo() {
		if (this.ho && clearTimeout(this.ho), 0 === this.Za.length) return this.ro = !1, void (this.ho = void 0);
		this.ho = setTimeout((() => {
			this.so && this.Za.length > 0 && this.oo(), this.uo();
		}), this.no);
	}
	oo() {
		var t = Date.now(), i = [], e = this.Za.filter(((e) => t > e.retryAt || (i.push(e), !1)));
		if (this.Za = i, e.length > 0) for (var r of e) this.retriableRequest(r.requestOptions);
	}
	unload() {
		for (var i of (this.ho && (clearTimeout(this.ho), this.ho = void 0), this.ro = !1, K(t) || (this.ao && (t.removeEventListener("online", this.ao), this.ao = void 0), this.lo && (t.removeEventListener("offline", this.lo), this.lo = void 0)), this.Za)) {
			var e = i.requestOptions;
			try {
				this._instance._send_request(_({}, e, { transport: "sendBeacon" }));
			} catch (t) {
				Ie.error(t);
			}
		}
		this.Za = [];
	}
};
var Da = class {
	constructor(t) {
		this.do = () => {
			var t, i, e, r;
			this.vo || (this.vo = {});
			var s = this.scrollElement(), n = this.scrollY(), o = s ? Math.max(0, s.scrollHeight - s.clientHeight) : 0, a = n + ((null == s ? void 0 : s.clientHeight) || 0), l = (null == s ? void 0 : s.scrollHeight) || 0;
			this.vo.lastScrollY = Math.ceil(n), this.vo.maxScrollY = Math.max(n, null !== (t = this.vo.maxScrollY) && void 0 !== t ? t : 0), this.vo.maxScrollHeight = Math.max(o, null !== (i = this.vo.maxScrollHeight) && void 0 !== i ? i : 0), this.vo.lastContentY = a, this.vo.maxContentY = Math.max(a, null !== (e = this.vo.maxContentY) && void 0 !== e ? e : 0), this.vo.maxContentHeight = Math.max(l, null !== (r = this.vo.maxContentHeight) && void 0 !== r ? r : 0);
		}, this._instance = t;
	}
	get co() {
		return this._instance.config.scroll_root_selector;
	}
	getContext() {
		return this.vo;
	}
	resetContext() {
		var t = this.vo;
		return setTimeout(this.do, 0), t;
	}
	startMeasuringScrollPosition() {
		us(t, "scroll", this.do, { capture: !0 }), us(t, "scrollend", this.do, { capture: !0 }), us(t, "resize", this.do);
	}
	scrollElement() {
		if (!this.co) return null == t ? void 0 : t.document.documentElement;
		for (var e of H(this.co) ? this.co : [this.co]) {
			var r = null == t ? void 0 : t.document.querySelector(e);
			if (r) return r;
		}
	}
	fo(i) {
		var e = "y" === i ? "scrollTop" : "scrollLeft";
		if (this.co) {
			var r = this.scrollElement();
			return r && r[e] || 0;
		}
		return t ? "y" === i ? t.scrollY || t.pageYOffset || t.document.documentElement.scrollTop || 0 : t.scrollX || t.pageXOffset || t.document.documentElement.scrollLeft || 0 : 0;
	}
	scrollY() {
		return this.fo("y");
	}
	scrollX() {
		return this.fo("x");
	}
};
var Na = (t) => ao(null == t ? void 0 : t.config.mask_personal_data_properties, null == t ? void 0 : t.config.custom_personal_data_properties, null == t ? void 0 : t.config.disable_capture_url_hashes);
var La = class {
	constructor(t, i, e, r) {
		this.xt = (t) => {
			var i = this.po();
			if (!i || i.sessionId !== t) {
				var e = {
					sessionId: t,
					props: this.mo(this._instance)
				};
				this.yo.register({ [Ir]: e });
			}
		}, this._instance = t, this.bo = i, this.yo = e, this.mo = r || Na, this.bo.onSessionId(this.xt);
	}
	po() {
		return this.yo.props[Ir];
	}
	getSetOnceProps() {
		var t, i = null == (t = this.po()) ? void 0 : t.props;
		return i ? "r" in i ? lo(i, this._instance.config.disable_capture_url_hashes) : {
			$referring_domain: i.referringDomain,
			$pathname: i.initialPathName,
			utm_source: i.utm_source,
			utm_campaign: i.utm_campaign,
			utm_medium: i.utm_medium,
			utm_content: i.utm_content,
			utm_term: i.utm_term
		} : {};
	}
	getSessionProps() {
		var t = {};
		return es(as(this.getSetOnceProps()), ((i, e) => {
			"$current_url" === e && (e = "url"), t["$session_entry_" + U(e)] = i;
		})), t;
	}
};
var Ua = class {
	on(t, i) {
		return this._o[t] || (this._o[t] = []), this._o[t].push(i), () => {
			this._o[t] = this._o[t].filter(((t) => t !== i));
		};
	}
	emit(t, i) {
		for (var e of this._o[t] || []) e(i);
		for (var r of this._o["*"] || []) r(t, i);
	}
	constructor() {
		this._o = {};
	}
};
var ja = Ae("[SessionId]");
var Ba = 864e5;
var za = class {
	on(t, i) {
		return this.wo.on(t, i);
	}
	constructor(t, i, e) {
		var r;
		if (this.ko = null, this.So = null, this.xo = [], this.Co = void 0, this.To = !1, this.wo = new Ua(), this.Mo = (t, i) => !(!tt(t) || !tt(i)) && Math.abs(t - i) > this.sessionTimeoutMs, !t.persistence) throw new Error("SessionIdManager requires a PostHogPersistence instance");
		if (t.config.cookieless_mode === Vr) throw new Error("SessionIdManager cannot be used with cookieless_mode=\"always\"");
		this.vn = t.config, this.yo = t.persistence, this.Ct = void 0, this.Le = void 0, this._sessionStartTimestamp = null, this.Eo = void 0, this._sessionActivityTimestamp = null, this.Io = i || ms, this.Ro = e || ms;
		var s = this.vn.persistence_name || this.vn.token;
		if (this._sessionTimeoutMs = 1e3 * ct(this.vn.session_idle_timeout_seconds || 1800, 60, 36e3, ja.createLogger("session_idle_timeout_seconds"), 1800), t.register({ $configured_session_timeout_ms: this._sessionTimeoutMs }), this.Po(), this.Ao = "ph_" + s + "_window_id", this.Fo = "ph_" + s + "_primary_window_exists", this.Oo()) {
			var n = Ls.ni(this.Ao), o = Ls.ni(this.Fo);
			n && !o ? this.Ct = n : Ls.ri(this.Ao), Ls.ei(this.Fo, !0);
		}
		null != (r = this.vn.bootstrap) && r.sessionID && this.setBootstrapSessionId(this.vn.bootstrap.sessionID), this.Lo();
	}
	get sessionTimeoutMs() {
		return this._sessionTimeoutMs;
	}
	onSessionId(t) {
		return K(this.xo) && (this.xo = []), this.xo.push(t), this.Le && t(this.Le, this.Ct), () => {
			this.xo = this.xo.filter(((i) => i !== t));
		};
	}
	Oo() {
		return "memory" !== this.vn.persistence && !this.yo.ga && Ls.Xr();
	}
	Do(t) {
		t !== this.Ct && (this.Ct = t, this.Oo() && Ls.ei(this.Ao, t));
	}
	$o() {
		return this.Ct ? this.Ct : this.Oo() ? Ls.ni(this.Ao) : null;
	}
	No(t) {
		var i = this.ko;
		return !Q(i) && !Q(t) && 5e3 > Math.abs(t - i);
	}
	qo(t, i, e) {
		var r = i !== this._sessionActivityTimestamp, s = !(t !== this.Le || e !== this._sessionStartTimestamp);
		this._sessionStartTimestamp = e, this._sessionActivityTimestamp = i, this.Le = t, s && !r || s && this.No(i) || (this.ko = i, this.yo.register({ [ar]: [
			i,
			t,
			e
		] }));
	}
	jo() {
		var t, i = null == (t = this.vn) ? void 0 : t.persistence_save_debounce_ms;
		return tt(i) && i > 0;
	}
	Bo() {
		this.jo() ? this.yo.refreshKey(ar) : (this.yo.flush(), this.yo.load());
	}
	Ho() {
		var t;
		if (!Q(this._sessionActivityTimestamp) && this._sessionActivityTimestamp !== this.ko) {
			this.Bo();
			var i = this.zo();
			i[1] === this.Le && i[2] === this._sessionStartTimestamp && (this.ko = this._sessionActivityTimestamp, this.yo.register({ [ar]: [
				this._sessionActivityTimestamp,
				null !== (t = this.Le) && void 0 !== t ? t : null,
				this._sessionStartTimestamp
			] }), this.yo.flush());
		}
	}
	Uo() {
		var t = this.zo()[0], i = tt(t) ? t : 0, e = tt(this._sessionActivityTimestamp) ? this._sessionActivityTimestamp : 0;
		return Math.max(i, e);
	}
	Wo(t) {
		return this.Bo(), this.Mo(t, this.Uo());
	}
	zo() {
		var t = this.yo.props[ar];
		return H(t) && 2 === t.length && t.push(t[0]), t || [
			0,
			null,
			0
		];
	}
	resetSessionId() {
		this.ko = null, this.Eo = void 0, clearTimeout(this.Vo), this.Vo = void 0, this.qo(null, null, null);
	}
	setBootstrapSessionId(t, i) {
		void 0 === i && (i = !1);
		var e = function(t, i) {
			void 0 === i && (i = (/* @__PURE__ */ new Date()).getTime());
			try {
				var e = ((t) => {
					var i = t.replace(/-/g, "");
					if (32 !== i.length) throw new Error("Not a valid UUID");
					if ("7" !== i[12]) throw new Error("Not a UUIDv7");
					return parseInt(i.substring(0, 12), 16);
				})(t);
				return e > i + 6e4 ? void ja.error("Bootstrap sessionID cannot be in the future") : e;
			} catch (t) {
				ja.error("Invalid sessionID in bootstrap", t);
				return;
			}
		}(t);
		return !K(e) && (i ? this.Eo = {
			sessionId: t,
			sessionStartTimestamp: e
		} : this.qo(t, (/* @__PURE__ */ new Date()).getTime(), e), !0);
	}
	destroy() {
		this.To = !0, this.Ho(), clearTimeout(this.Vo), this.Vo = void 0, this.Co && t && (t.removeEventListener(Yr, this.Co, { capture: !1 }), this.Co = void 0), this.xo = [];
	}
	Lo() {
		this.Co = () => {
			this.Ho(), this.Oo() && Ls.ri(this.Fo);
		}, us(t, Yr, this.Co, { capture: !1 });
	}
	checkAndGetSessionAndWindowId(t, i, e) {
		if (void 0 === t && (t = !1), void 0 === i && (i = null), void 0 === e && (e = !1), this.vn.cookieless_mode === Vr) throw new Error("checkAndGetSessionAndWindowId should not be called with cookieless_mode=\"always\"");
		var r = i || (/* @__PURE__ */ new Date()).getTime(), s = this.Le;
		if (e) this.So = r;
		else if (Q(this.So) || this.So > r || r - this.So >= 1e3) {
			var n, o;
			null == (n = (o = this.yo).syncCookieProperties) || n.call(o), this.So = r;
		}
		var a = this.zo(), l = a[1], h = a[2], u = !K(s) && l !== s, d = this.Uo(), v = this.$o(), c = this.Eo, f = !!c && (c.sessionStartTimestamp > r + 6e4 || r - c.sessionStartTimestamp > Ba), p = c ? f : tt(h) && Math.abs(r - h) > Ba, _ = !1, g = u, m = !l || !!c, y = l, b = !m && !t && this.Mo(r, d);
		if (b) {
			(b = this.Wo(r)) || ja.info("cross-tab refresh kept the session alive", { sessionId: l });
			var w = this.zo();
			l = w[1], h = w[2];
		}
		if (m || b || p) {
			g = !1;
			var x = c && !f;
			l = x ? c.sessionId : this.Io(), v = this.Ro(), ja.info("new session ID assigned", {
				sessionId: l,
				windowId: v,
				bootstrapped: !!x,
				changeReason: {
					noSessionId: m,
					activityTimeout: b,
					sessionPastMaximumLength: p
				}
			}), h = x ? c.sessionStartTimestamp : r, this.Eo = void 0, _ = !0;
		} else v || (v = this.Ro(), _ = !0), (g = g || l !== y) && (ja.info("adopted cross-tab session id", {
			sessionId: l,
			windowId: v
		}), _ = !0);
		var E = tt(d) && t && !p ? d : r, S = tt(h) ? h : (/* @__PURE__ */ new Date()).getTime();
		this.Do(v), this.qo(l, E, S), t || this.Po();
		var k = {
			noSessionId: m,
			activityTimeout: b,
			sessionPastMaximumLength: p,
			crossTabAdoption: g
		};
		return _ && this.xo.forEach(((t) => t(l, v, k))), {
			sessionId: l,
			windowId: v,
			sessionStartTimestamp: S,
			changeReason: _ ? k : void 0,
			lastActivityTimestamp: d
		};
	}
	Po() {
		this.To || (clearTimeout(this.Vo), this.Vo = setTimeout((() => {
			if (!this.To) if (this.Wo((/* @__PURE__ */ new Date()).getTime())) {
				var t = this.Le;
				this.resetSessionId(), this.wo.emit("forcedIdleReset", { idleSessionId: t });
			} else this.Po();
		}), 1.1 * this.sessionTimeoutMs));
	}
};
var qa = function(t, i) {
	if (!t) return !1;
	var e = t.userAgent;
	if (e && D(e, i)) return !0;
	try {
		var r = null == t ? void 0 : t.userAgentData;
		if (null != r && r.brands && r.brands.some(((t) => D(null == t ? void 0 : t.brand, i)))) return !0;
	} catch (t) {}
	return !!t.webdriver;
};
function Ha() {
	return (Ha = p((function* () {
		var t = null == e ? void 0 : e.userAgentData;
		if (null != t && t.getHighEntropyValues) try {
			var i = yield t.getHighEntropyValues(["model"]), r = null == i ? void 0 : i.model;
			return J(r) && r.length > 0 ? r : void 0;
		} catch (t) {
			Ie.info("Unable to resolve $device_model from userAgentData.getHighEntropyValues", t);
			return;
		}
	}))).apply(this, arguments);
}
function Va(t) {
	var i;
	return !(null == (i = t.conditions) || null == (i = i.events) || null == (i = i.values) || !i.length);
}
var Wa = (t, i) => {
	if (!((t) => {
		try {
			new RegExp(t);
		} catch (t) {
			return !1;
		}
		return !0;
	})(i)) return !1;
	try {
		return new RegExp(i).test(t);
	} catch (t) {
		return !1;
	}
};
var Ga = (t) => t.toLowerCase();
var Ka = {
	exact: (t, i) => i.some(((i) => t.some(((t) => i === t)))),
	is_not: (t, i) => i.every(((i) => t.every(((t) => i !== t)))),
	regex: (t, i) => i.some(((i) => t.some(((t) => Wa(i, t))))),
	not_regex: (t, i) => i.every(((i) => t.every(((t) => !Wa(i, t))))),
	icontains: (t, i) => i.map(Ga).some(((i) => t.map(Ga).some(((t) => i.includes(t))))),
	not_icontains: (t, i) => i.map(Ga).every(((i) => t.map(Ga).every(((t) => !i.includes(t))))),
	gt: (t, i) => i.some(((i) => {
		var e = parseFloat(i);
		return !isNaN(e) && t.some(((t) => e > parseFloat(t)));
	})),
	lt: (t, i) => i.some(((i) => {
		var e = parseFloat(i);
		return !isNaN(e) && t.some(((t) => e < parseFloat(t)));
	}))
};
function Ja(t, i) {
	return !t || Object.entries(t).every(((t) => {
		var e = t[1], r = null == i ? void 0 : i[t[0]];
		if (null == r) return !1;
		var s = Ka[e.operator];
		return !!s && s(e.values, [String(r)]);
	}));
}
function Ya(t, i, e) {
	return qn({
		distinct_id: t,
		userPropertiesToSet: i,
		userPropertiesToSetOnce: e
	});
}
var Qa = "custom";
var Xa = "i.posthog.com";
var Za = /^\/static\//;
var tl = [
	"/s/",
	"/e/",
	"/i/"
];
var il = class {
	constructor(t) {
		this.Go = {}, this.instance = t;
	}
	get apiHost() {
		var t = this.instance.config.api_host.trim().replace(/\/$/, "");
		return "https://app.posthog.com" === t ? "https://us.i.posthog.com" : t;
	}
	get flagsApiHost() {
		var t = this.instance.config.flags_api_host;
		return t ? t.trim().replace(/\/$/, "") : this.apiHost;
	}
	get uiHost() {
		var t, i = null == (t = this.instance.config.ui_host) ? void 0 : t.replace(/\/$/, "");
		return i || (i = this.apiHost.replace("." + Xa, ".posthog.com")), "https://app.posthog.com" === i ? "https://us.posthog.com" : i;
	}
	get region() {
		return this.Go[this.apiHost] || (this.Go[this.apiHost] = /https:\/\/(app|us|us-assets)(\.i)?\.posthog\.com/i.test(this.apiHost) ? "us" : /https:\/\/(eu|eu-assets)(\.i)?\.posthog\.com/i.test(this.apiHost) ? "eu" : Qa), this.Go[this.apiHost];
	}
	Zo(t) {
		if (Za.test(t)) {
			var i = this.instance.config.asset_host;
			if ("string" == typeof i) return i.trim().replace(/\/$/, "") || void 0;
		}
	}
	Qo(t) {
		var i = Hn(t);
		return i ? i.protocol + "//" + i.host + i.pathname : void 0;
	}
	Jo(t, i, e) {
		if ("ui" === t) return e;
		var r = e, s = this.instance.config.rewriteRequestPath;
		if (s) {
			var n, o = (null == (n = Hn(e)) ? void 0 : n.href) || e;
			r = s(new URL(o)).toString();
		}
		if (s && "api" === t && tl.some(((t) => 0 === i.indexOf(t)))) {
			var a = this.Qo(r);
			if (a) {
				var l, h = this.apiHost, u = this.Ko;
				(null == (l = u) ? void 0 : l.apiHost) === h && u.rewriteRequestPath === s || (u = {
					apiHost: h,
					rewriteRequestPath: s,
					urls: /* @__PURE__ */ new Set()
				}, this.Ko = u), u.urls.add(a);
			}
		}
		return r;
	}
	isIngestionEndpoint(t) {
		var i = this.Ko, e = this.Qo(t);
		return (null == i ? void 0 : i.apiHost) === this.apiHost && i.rewriteRequestPath === this.instance.config.rewriteRequestPath && !!e && i.urls.has(e);
	}
	endpointFor(t, i) {
		if (void 0 === i && (i = ""), i && (i = "/" === i[0] ? i : "/" + i), "ui" === t) return this.Jo(t, i, this.uiHost + i);
		if ("flags" === t) return this.Jo(t, i, this.flagsApiHost + i);
		if ("assets" === t) {
			var e = this.Zo(i);
			if (e) return this.Jo(t, i, "" + e + i);
		}
		if (this.region === Qa) return this.Jo(t, i, this.apiHost + i);
		var r = Xa + i;
		switch (t) {
			case "assets": return this.Jo(t, i, "https://" + this.region + "-assets." + r);
			case "api": return this.Jo(t, i, "https://" + this.region + "." + r);
		}
	}
};
var el = Ae("[Surveys]");
var rl = "seenSurvey_";
var sl = (t) => {
	try {
		var i = ((t) => ((t, i) => "" + rl + function(t) {
			return t.current_iteration && t.current_iteration > 0 ? t.id + "_" + t.current_iteration : t.id;
		}(i))(0, t))(t);
		if (localStorage.getItem(i)) return;
		localStorage.setItem(i, "true");
	} catch (t) {
		el.error("Failed to persist survey seen state", t);
	}
};
var nl = [
	So.Popover,
	So.Widget,
	So.API
];
var ol = {
	ignoreConditions: !1,
	ignoreDelay: !1,
	displayType: Co.Popover
};
var al = Ae("[PostHog ExternalIntegrations]");
var ll = {
	intercom: "intercom-integration",
	crispChat: "crisp-chat-integration"
};
var hl = class {
	constructor(t) {
		this._instance = t;
	}
	Zs(t, i) {
		var e;
		null == (e = v.__PosthogExtensions__) || null == e.loadExternalDependency || e.loadExternalDependency(this._instance, t, ((t) => {
			if (t) return al.error("failed to load script", t);
			i();
		}));
	}
	startIfEnabledOrStop() {
		var t = this, i = function() {
			var i, r, s, n = e[0], o = e[1];
			!o || null != (i = v.__PosthogExtensions__) && null != (i = i.integrations) && i[n] || t.Zs(ll[n], (() => {
				var i;
				null == (i = v.__PosthogExtensions__) || null == (i = i.integrations) || null == (i = i[n]) || i.start(t._instance);
			})), !o && null != (r = v.__PosthogExtensions__) && null != (r = r.integrations) && r[n] && (null == (s = v.__PosthogExtensions__) || null == (s = s.integrations) || null == (s = s[n]) || s.stop());
		};
		for (var e of Object.entries(null !== (r = this._instance.config.integrations) && void 0 !== r ? r : {})) {
			var r;
			i();
		}
	}
};
var ul = class {
	constructor(t, i) {
		this.I = t, this.Os = i, this.Yo = /* @__PURE__ */ new Map(), this.Rs = !1;
	}
	add(t) {
		var i = this;
		return p((function* () {
			if (i.Rs) throw new Error("Cannot add an extension to a disposed ExtensionRuntime");
			if (i.Yo.has(t.name)) throw new Error("Browser extension \"" + t.name + "\" is already registered");
			i.Yo.set(t.name, t);
			try {
				var e = t.setup(i.Os);
				e && (yield e);
			} catch (e) {
				var r = i.Yo.get(t.name) === t;
				r && i.Yo.delete(t.name), i.I.error("Failed to set up browser extension \"" + t.name + "\"", e), r && i.Xo(t);
			}
		}))();
	}
	getExtension(t) {
		return this.Yo.get(t);
	}
	dispose() {
		if (!this.Rs) {
			this.Rs = !0;
			var t = Array.from(this.Yo.values()).reverse();
			for (var i of (this.Yo.clear(), t)) this.Xo(i);
		}
	}
	Xo(t) {
		try {
			var i = null == t.dispose ? void 0 : t.dispose();
			i && V(i.then) && i.then(void 0, ((i) => {
				this.I.error("Failed to dispose browser extension \"" + t.name + "\"", i);
			}));
		} catch (i) {
			this.I.error("Failed to dispose browser extension \"" + t.name + "\"", i);
		}
	}
};
var dl = class {
	constructor(t) {
		this._instance = t;
	}
	initialize() {}
	get(t) {
		var i = this._instance.persistence;
		if ("string" == typeof t) return null == i ? void 0 : i.get_property(t);
		var e = {};
		for (var r of t) {
			var s = null == i ? void 0 : i.get_property(r);
			K(s) || (e[r] = s);
		}
		return e;
	}
	set(t, i) {
		var e;
		null == (e = this._instance.persistence) || e.register("string" == typeof t ? { [t]: i } : t);
	}
	remove(t) {
		var i;
		null == (i = this._instance.persistence) || i.unregister(t);
	}
};
var vl = "extensionsRemoteConfig";
var cl = class {
	constructor(t) {
		this.Rs = !1, this.instance = t, this.I = Ie, this.tl = t.el, this.kv = new dl(t), this.onEvent = (t) => mo(this.instance.on("eventCaptured", ((i) => {
			try {
				t({
					event: i.event,
					properties: i.properties
				});
			} catch (t) {
				this.I.error("Browser extension event listener failed", t);
			}
		}))), this.onRemoteConfig = (t) => {
			if (this.Rs) return mo((() => {}));
			var i = (i) => {
				try {
					t(i);
				} catch (t) {
					this.I.error("Browser extension remote config listener failed", t);
				}
			}, e = this.instance.il.on(vl, i);
			return this.tl && i(this.tl), mo(e);
		}, this.rl = new ul(Ie.createLogger("[BrowserExtensions]"), this);
	}
	get logger() {
		return this.I;
	}
	get distinctId() {
		return this.instance.get_distinct_id();
	}
	get anonymousId() {
		var t;
		return null !== (t = this.instance.get_property(Be)) && void 0 !== t ? t : this.distinctId;
	}
	get deviceId() {
		var t = this.instance.get_property(Be);
		return "string" == typeof t ? t : void 0;
	}
	get library() {
		return {
			name: c.LIB_NAME,
			version: c.LIB_VERSION
		};
	}
	get initialPersonProperties() {
		var t, i;
		return null !== (t = null == (i = this.instance.persistence) ? void 0 : i.get_initial_props()) && void 0 !== t ? t : {};
	}
	get groups() {
		return this.instance.getGroups();
	}
	get session() {
		try {
			var t, i, e, r, s = null == (t = this.instance.sessionManager) ? void 0 : t.checkAndGetSessionAndWindowId(!0);
			return {
				sessionId: null !== (i = null == s ? void 0 : s.sessionId) && void 0 !== i ? i : "",
				windowId: null !== (e = null == s ? void 0 : s.windowId) && void 0 !== e ? e : "",
				sessionStartTimestamp: null !== (r = null == s ? void 0 : s.sessionStartTimestamp) && void 0 !== r ? r : 0
			};
		} catch (t) {
			return {
				sessionId: "",
				windowId: "",
				sessionStartTimestamp: 0
			};
		}
	}
	get canCapture() {
		return this.instance.is_capturing();
	}
	get projectToken() {
		return this.instance.config.token;
	}
	add(t) {
		return this.rl.add(t);
	}
	getExtension(t) {
		return this.rl.getExtension(t);
	}
	capture(t, i, e) {
		var r = this;
		return p((function* () {
			e ? r.instance.capture(t, i, {
				timestamp: e.timestamp,
				uuid: e.uuid,
				$set: e.set,
				$set_once: e.setOnce
			}) : r.instance.capture(t, i);
		}))();
	}
	registerDynamicEventProperties(t) {
		return mo(this.instance.nl(t));
	}
	handleRemoteConfig(t) {
		this.Rs || (this.tl = t, this.instance.il.emit(vl, t));
	}
	sendRequest(t, i) {
		var e = this;
		return p((function* () {
			var r;
			void 0 === i && (i = {});
			var s = e.instance.requestRouter.endpointFor(null !== (r = i.target) && void 0 !== r ? r : "api", t), n = {
				method: i.method,
				url: i.query ? wa(s, i.query) : s,
				data: i.body,
				headers: i.headers,
				timeout: i.timeoutMs,
				fireCallbackOnDrop: !0,
				transport: i.transport,
				compression: i.compression,
				compressionFallback: "flags" === i.target && "best-available" === i.compression ? E.Base64 : void 0,
				timestampMode: i.sentAt
			};
			return "sendBeacon" === i.transport ? (e.instance._send_request(n), { statusCode: 202 }) : new Promise(((t) => {
				n.callback = t, e.instance._send_request(n);
			}));
		}))();
	}
	dispose() {
		this.Rs || (this.Rs = !0, this.rl.dispose());
	}
};
var fl = {};
var pl = 0;
var _l = () => {};
var gl = "Consent opt in/out is not valid with cookieless_mode=\"always\" and will be ignored";
var ml = "Surveys module not available";
var yl = "sanitize_properties is deprecated. Use before_send instead";
var bl = "Invalid value for property_denylist config: ";
var wl = [
	"token",
	"distinct_id",
	Ur
];
var xl = "posthog";
var El = !ga && -1 === (null == h ? void 0 : h.indexOf("MSIE")) && -1 === (null == h ? void 0 : h.indexOf("Mozilla"));
var Sl = (t) => {
	var i = {};
	return t && "unset" !== t ? ("2025-11-30" > t || (i.strictMinimumDuration = !0), "2026-05-30" > t || (i.canvasCapture = { resolutionScale: .6 }), "2026-06-25" > t || (i.streamNetworkBody = !0), "2026-08-30" > t || (i.captureJsonLd = !0), i) : i;
};
var kl = (i) => {
	var e;
	return _({
		api_host: "https://us.i.posthog.com",
		flags_api_host: null,
		ui_host: null,
		asset_host: null,
		token: "",
		autocapture: !0,
		cross_subdomain_cookie: hs(null == r ? void 0 : r.location),
		persistence: "localStorage+cookie",
		persistence_name: "",
		cookie_persisted_properties: [],
		loaded: _l,
		save_campaign_params: !0,
		custom_campaign_params: [],
		custom_blocked_useragents: [],
		save_referrer: !0,
		capture_pageleave: "if_capture_pageview",
		defaults: null != i ? i : "unset",
		__preview_deferred_init_extensions: !1,
		__preview_external_dependency_versioned_paths: !1,
		__preview_cookie_wins_on_conflict: !1,
		debug: s && J(null == s ? void 0 : s.search) && -1 !== s.search.indexOf("__posthog_debug=true") || !1,
		cookie_expiration: 365,
		upgrade: !1,
		disable_session_recording: !1,
		disable_persistence: !1,
		disable_web_experiments: !0,
		disable_surveys: !1,
		disable_surveys_automatic_display: !1,
		disable_conversations: !1,
		disable_product_tours: !1,
		disableDeviceModel: !1,
		disable_external_dependency_loading: !1,
		strict_script_versioning: "fallback",
		enable_recording_console_log: void 0,
		secure_cookie: "https:" === (null == t || null == (e = t.location) ? void 0 : e.protocol),
		ip: !1,
		opt_out_capturing_by_default: !1,
		opt_out_persistence_by_default: !1,
		opt_out_useragent_filter: !1,
		opt_out_capturing_persistence_type: "localStorage",
		consent_persistence_name: null,
		opt_out_capturing_cookie_prefix: null,
		opt_in_site_apps: !1,
		property_denylist: [],
		respect_dnt: !1,
		sanitize_properties: null,
		request_headers: {},
		request_batching: !0,
		properties_string_max_length: 65535,
		mask_all_element_attributes: !1,
		mask_all_text: !1,
		mask_personal_data_properties: !1,
		custom_personal_data_properties: [],
		advanced_disable_flags: !1,
		advanced_disable_decide: !1,
		advanced_disable_feature_flags: !1,
		advanced_disable_feature_flags_on_first_load: !1,
		advanced_only_evaluate_survey_feature_flags: !1,
		advanced_feature_flags_dedup_per_session: !1,
		advanced_enable_surveys: !1,
		advanced_disable_toolbar_metrics: !1,
		feature_flag_request_timeout_ms: 3e3,
		surveys_request_timeout_ms: 1e4,
		on_request_error(t) {
			Ie.error("Bad HTTP status: " + t.statusCode + " " + t.text);
		},
		get_device_id: (t) => t,
		capture_performance: void 0,
		name: "posthog",
		bootstrap: {},
		disable_compression: !1,
		session_idle_timeout_seconds: 1800,
		person_profiles: Kr,
		before_send: void 0,
		get_current_url: void 0,
		request_queue_config: { flush_interval_ms: Ia },
		error_tracking: {},
		_onCapture: _l
	}, ((t) => ({
		rageclick: t && t >= "2026-05-30" ? {
			content_ignorelist: hn,
			ignore_text_selection: !0
		} : !t || "2025-11-30" > t || { content_ignorelist: !0 },
		capture_pageview: !t || "2025-05-24" > t || "history_change",
		session_recording: Sl(t),
		external_scripts_inject_target: t && t >= "2026-01-30" ? "head" : "body",
		internal_or_test_user_hostname: t && t >= "2026-01-30" ? /^(localhost|127\.0\.0\.1)$/ : void 0,
		persistence_save_debounce_ms: t && t >= "2026-05-30" ? 250 : 0,
		split_storage: !(!t || "2026-05-30" > t),
		detect_google_search_app: !(!t || "2026-05-30" > t),
		disable_capture_url_hashes: !(!t || "2026-06-25" > t),
		cookieWinsOnConflict: !(!t || "unset" === t || "2026-08-29" > t)
	}))(i));
};
var Tl = [
	["process_person", "person_profiles"],
	["xhr_headers", "request_headers"],
	["cookie_name", "persistence_name"],
	["disable_cookie", "disable_persistence"],
	["__preview_disable_beacon", "disable_beacon"],
	["store_google", "save_campaign_params"],
	["verbose", "debug"],
	["__preview_cookie_wins_on_conflict", "cookieWinsOnConflict"]
];
var $l = (t) => {
	var i = {};
	for (var e of Tl) {
		var r = e[0], s = e[1];
		K(t[r]) || (i[s] = t[r]);
	}
	var n = rs({}, i, t), o = t.__preview_external_dependency_versioned_paths;
	return K(o) || (K(t.strict_script_versioning) && (n.strict_script_versioning = !!o), J(o) && K(t.asset_host) && (n.asset_host = o)), H(t.property_blacklist) && (K(t.property_denylist) ? n.property_denylist = t.property_blacklist : H(t.property_denylist) ? n.property_denylist = [...t.property_blacklist, ...t.property_denylist] : Ie.error(bl + t.property_denylist)), n;
};
var Pl = class {
	constructor() {
		this.__forceAllowLocalhost = !1;
	}
	get sl() {
		return this.__forceAllowLocalhost;
	}
	set sl(t) {
		Ie.error("WebPerformanceObserver is deprecated and has no impact on network capture. Use `_forceAllowLocalhostNetworkCapture` on `posthog.sessionRecording`"), this.__forceAllowLocalhost = t;
	}
};
var Rl = class Rl {
	al(t, i) {
		if (t) {
			var e = this.Yo.indexOf(t);
			-1 !== e && this.Yo.splice(e, 1);
		}
		return this.Yo.push(i), null == i.initialize || i.initialize(), i;
	}
	ol() {
		return this.config.cookieless_mode === Vr || this.config.cookieless_mode === Hr && this.consent.isRejected();
	}
	ll() {
		if (!this.ol() && this.get_distinct_id() === Lr) {
			var t = this.persistence;
			if (t) {
				this.ul() || t.load(!0);
				var i = this.get_distinct_id();
				if (!i || i === Lr) {
					var e = this.config.get_device_id(ms());
					this.register({
						distinct_id: e,
						$device_id: e
					}), t.set_property(Or, Wr);
				}
				this.hl();
			}
		}
	}
	get decideEndpointWasHit() {
		var t, i;
		return null !== (t = null == (i = this.featureFlags) ? void 0 : i.hasLoadedFlags) && void 0 !== t && t;
	}
	get flagsEndpointWasHit() {
		var t, i;
		return null !== (t = null == (i = this.featureFlags) ? void 0 : i.hasLoadedFlags) && void 0 !== t && t;
	}
	constructor() {
		var t;
		this.webPerformance = new Pl(), this.dl = !1, this.version = c.LIB_VERSION, this.vl = /* @__PURE__ */ new Set(), this.cl = "", this.il = new Ua(), this.Yo = [], this.fl = [], this._calculate_event_properties = this.calculateEventProperties.bind(this), this.config = kl(), this.SentryIntegration = Nn, this.sentryIntegration = (t) => function(t, i) {
			var e = Dn(t, i);
			return {
				name: Mn,
				processEvent: (t) => e(t)
			};
		}(this, t), this.__request_queue = [], this.__loaded = !1, this.analyticsDefaultEndpoint = "/e/", this.pl = !1, this.gl = null, this.ml = null, this.yl = null, this.scrollManager = new Da(this), this.pageViewManager = new Ln(this), this.rateLimiter = new Mo(this), this.requestRouter = new il(this), this.consent = new Us(this), this.externalIntegrations = new hl(this);
		var i = null !== (t = Rl.__defaultExtensionClasses) && void 0 !== t ? t : {};
		this.featureFlags = i.featureFlags && new i.featureFlags(this), this.toolbar = i.toolbar && new i.toolbar(this), this.surveys = i.surveys && new i.surveys(this), this.conversations = i.conversations && new i.conversations(this), this.logs = i.logs && new i.logs(this), this.metrics = i.metrics && new i.metrics(this), this.experiments = i.experiments && new i.experiments(this), this.exceptions = i.exceptions && new i.exceptions(this), this.people = {
			set: (t, i, e) => {
				var r = J(t) ? { [t]: i } : t;
				this.setPersonProperties(r), e?.({});
			},
			set_once: (t, i, e) => {
				var r = J(t) ? { [t]: i } : t;
				this.setPersonProperties(void 0, r), e?.({});
			}
		}, this.on("eventCaptured", ((t) => Ie.info("send \"" + (null == t ? void 0 : t.event) + "\"", t)));
	}
	init(t, i, e) {
		if (e && e !== xl) {
			var r, s = null !== (r = fl[e]) && void 0 !== r ? r : new Rl();
			return s._init(t, i, e), fl[e] = s, fl[xl][e] = s, s;
		}
		return this._init(t, i, e);
	}
	_init(i, e, r) {
		var s, n;
		void 0 === e && (e = {});
		var o, a = J(i) ? i.trim() : "";
		if (!a) return Ie.critical("PostHog was initialized without a token. This likely indicates a misconfiguration. Please check the first argument passed to posthog.init()"), this;
		if (this.__loaded) return a !== (null == (o = this.config) ? void 0 : o.token) ? console.warn("[PostHog.js]", "You have already initialized PostHog with a different project token! Re-initializing is a no-op, so events will keep going to the project this instance was initialized with. To capture into a second project, load PostHog once, then initialize a named instance after the SDK has loaded, e.g. posthog.init('" + a + "', { ... }, 'project2')") : console.warn("[PostHog.js]", "You have already initialized PostHog! Re-initializing is a no-op"), this;
		this.__loaded = !0, this.config = kl(e.defaults), e.debug = this.bl(e.debug), this._l = e, this.wl = [], e.person_profiles ? this.ml = e.person_profiles : e.process_person && (this.ml = e.process_person);
		var l = kl(e.defaults), h = $l(e), u = rs({}, l, h, {
			name: r,
			token: a
		});
		W(l.rageclick) && W(h.rageclick) && (u.rageclick = rs({}, l.rageclick, h.rageclick)), W(l.session_recording) && W(h.session_recording) && (u.session_recording = rs({}, l.session_recording, h.session_recording)), this.set_config(u), this.config.on_xhr_error && Ie.error("on_xhr_error is deprecated. Use on_request_error instead"), this.compression = e.disable_compression ? void 0 : yo.GZipJS;
		var d = this.ul();
		if (this.persistence = new go(this.config, d), this.sessionPersistence = "sessionStorage" === this.config.persistence || "memory" === this.config.persistence ? this.persistence : new go(_({}, this.config, { persistence: "sessionStorage" }), d, !1), this.cl = "ph_" + (this.config.persistence_name || this.config.token) + "_session_registered_properties", "memory" !== this.config.persistence && !d && Ls.Xr()) {
			var v = Ls.ni(this.cl);
			H(v) && v.forEach(((t) => {
				J(t) && this.vl.add(t);
			}));
		} else Ls.ri(this.cl);
		var f = _({}, this.persistence.props), p = _({}, this.sessionPersistence.props);
		this.register({ $initialization_time: (/* @__PURE__ */ new Date()).toISOString() }), this.kl = new Aa(((t) => this.Sl(t)), this.config.request_queue_config), this.xl = new Ma(this), this.__request_queue = [];
		var g = this.ol();
		if (g || (this.sessionManager = new za(this), this.sessionPropsManager = new La(this, this.sessionManager, this.persistence), this.sessionManager.onSessionId(((t, i, e) => {
			(null != e && e.activityTimeout || null != e && e.sessionPastMaximumLength || null != e && e.crossTabAdoption) && this.Cl();
		}))), this.Tl(), this.config.__preview_deferred_init_extensions ? (Ie.info("Deferring extension initialization to improve startup performance"), setTimeout((() => {
			this.Ml(g);
		}), 0)) : (Ie.info("Initializing extensions synchronously"), this.Ml(g)), c.DEBUG = c.DEBUG || this.config.debug, c.DEBUG && Ie.info("Starting in debug mode", {
			this: this,
			config: e,
			thisC: _({}, this.config),
			p: f,
			s: p
		}), !this.config.identity_distinct_id || null != (s = e.bootstrap) && s.distinctID || (e.bootstrap = _({}, e.bootstrap, {
			distinctID: this.config.identity_distinct_id,
			isIdentifiedID: !0
		})), void 0 !== (null == (n = e.bootstrap) ? void 0 : n.distinctID)) {
			var m = e.bootstrap.distinctID, y = this.get_distinct_id(), b = this.persistence.get_property(Or);
			if (e.bootstrap.isIdentifiedID && null != y && y !== m && b === Wr) this.identify(m);
			else if (e.bootstrap.isIdentifiedID && null != y && y !== m && b === Gr) Ie.warn("Bootstrap distinctID differs from an already-identified user. The existing identity is preserved. Call reset() before reinitializing if you intend to switch users.");
			else {
				var w = this.config.get_device_id(ms()), x = e.bootstrap.isIdentifiedID ? w : m;
				this.persistence.set_property(Or, e.bootstrap.isIdentifiedID ? Gr : Wr), this.register({
					distinct_id: m,
					$device_id: x
				});
			}
		}
		if (g) this.register_once({
			distinct_id: Lr,
			$device_id: null
		}, "");
		else if (!this.get_distinct_id()) {
			var E = this.config.get_device_id(ms());
			this.register_once({
				distinct_id: E,
				$device_id: E
			}, ""), this.persistence.set_property(Or, Wr);
		}
		return us(t, "onpagehide" in self ? "pagehide" : "unload", this._handle_unload.bind(this), { passive: !1 }), e.segment ? function(t, i) {
			var e = t.config.segment;
			if (!e) return i();
			(function(t, i) {
				var e = t.config.segment;
				if (!e) return i();
				var r = (e) => {
					var r = () => e.anonymousId() || ms();
					t.config.get_device_id = r, e.id() && (t.register({
						distinct_id: e.id(),
						$device_id: r()
					}), t.persistence.set_property(Or, Gr)), i();
				}, s = e.user();
				"then" in s && V(s.then) ? s.then(r) : r(s);
			})(t, (() => {
				e.register(((t) => {
					"undefined" != typeof Promise && Promise.resolve || Fn.warn("This browser does not have Promise support, and can not use the segment integration");
					var i = (i, e) => {
						if (!e) return i;
						i.event.userId || i.event.anonymousId === t.get_distinct_id() || (Fn.info("No userId set, resetting PostHog"), t.reset()), i.event.userId && i.event.userId !== t.get_distinct_id() && (Fn.info("UserId set, identifying with PostHog"), t.identify(i.event.userId));
						var r = t.calculateEventProperties(e, i.event.properties);
						return i.event.properties = Object.assign({}, r, i.event.properties), i;
					};
					return {
						name: "PostHog JS",
						type: "enrichment",
						version: "1.0.0",
						isLoaded: () => !0,
						load: () => Promise.resolve(),
						track: (t) => i(t, t.event.event),
						page: (t) => i(t, Qr),
						identify: (t) => i(t, Zr),
						screen: (t) => i(t, "$screen")
					};
				})(t)).then((() => {
					i();
				}));
			}));
		}(this, (() => this.El())) : this.El(), V(this.config._onCapture) && this.config._onCapture !== _l && (Ie.warn("onCapture is deprecated. Please use `before_send` instead"), this.on("eventCaptured", ((t) => this.config._onCapture(t.event, t)))), this.config.ip && Ie.warn("The `ip` config option has NO EFFECT AT ALL and has been deprecated. Use a custom transformation or \"Discard IP data\" project setting instead. See https://posthog.com/tutorials/web-redact-properties#hiding-customer-ip-address for more information."), this.config.disableDeviceModel || function() {
			return Ha.apply(this, arguments);
		}().then(((t) => {
			t && this.register({ [ze]: t });
		})).catch(_l), this;
	}
	Il(t) {
		var i = t;
		return J(i.name) && V(i.setup);
	}
	Rl(t, i) {
		this.Il(t) ? i.push((() => {
			this.Pl().add(t).catch((() => null == t.dispose ? void 0 : t.dispose())).catch(((i) => {
				Ie.error("Failed to dispose browser extension \"" + t.name + "\"", i);
			}));
		})) : this.Yo.push(t);
	}
	Tl() {
		var t, i, e, r, s, n, o = null !== (t = null == (i = this.config.__extensionClasses) ? void 0 : i.featureFlags) && void 0 !== t ? t : null == (e = Rl.__defaultExtensionClasses) ? void 0 : e.featureFlags;
		o && (this.featureFlags && this.featureFlags instanceof o || (null == (r = this.Al) || r.call(this), this.Al = void 0, this.featureFlags = new o(this)), V(this.featureFlags.onReloading) && V(this.featureFlags.setup) ? this.Al || (this.Al = this.featureFlags.onReloading((() => {
			this.il.emit("featureFlagsReloading", !0);
		})), this.Pl().add(this.featureFlags)) : null == (s = (n = this.featureFlags).initialize) || s.call(n));
	}
	Ml(t) {
		var i, e, r, s, n, o, a, l = performance.now(), h = _({}, Rl.__defaultExtensionClasses, this.config.__extensionClasses), u = [];
		h.exceptions && this.Yo.push(this.exceptions = null !== (i = this.exceptions) && void 0 !== i ? i : new h.exceptions(this)), h.historyAutocapture && this.Yo.push(this.historyAutocapture = new h.historyAutocapture(this)), h.tracingHeaders && this.Yo.push(this.tracingHeaders = new h.tracingHeaders(this)), h.siteApps && this.Yo.push(this.siteApps = new h.siteApps(this)), h.sessionRecording && !t && this.Yo.push(this.sessionRecording = new h.sessionRecording(this)), this.config.disable_scroll_properties || u.push((() => {
			this.scrollManager.startMeasuringScrollPosition();
		})), h.autocapture && this.Rl(this.autocapture = new h.autocapture(this), u), h.surveys && this.Rl(this.surveys = null !== (e = this.surveys) && void 0 !== e ? e : new h.surveys(this), u), h.logs && this.Rl(this.logs = null !== (r = this.logs) && void 0 !== r ? r : new h.logs(this), u), h.metrics && this.Yo.push(this.metrics = null !== (s = this.metrics) && void 0 !== s ? s : new h.metrics(this)), h.conversations && this.Yo.push(this.conversations = null !== (n = this.conversations) && void 0 !== n ? n : new h.conversations(this)), h.productTours && this.Yo.push(this.productTours = new h.productTours(this)), h.heatmaps && this.Yo.push(this.heatmaps = new h.heatmaps(this)), h.webVitalsAutocapture && this.Yo.push(this.webVitalsAutocapture = new h.webVitalsAutocapture(this)), h.exceptionObserver && this.Yo.push(this.exceptionObserver = new h.exceptionObserver(this)), h.deadClicksAutocapture && this.Yo.push(this.deadClicksAutocapture = new h.deadClicksAutocapture(this, In)), h.toolbar && this.Yo.push(this.toolbar = null !== (o = this.toolbar) && void 0 !== o ? o : new h.toolbar(this)), h.experiments && this.Yo.push(this.experiments = null !== (a = this.experiments) && void 0 !== a ? a : new h.experiments(this)), this.Yo.forEach(((t) => {
			t.initialize && u.push((() => {
				null == t.initialize || t.initialize();
			}));
		})), u.push((() => {
			if (this.Fl) {
				var t = this.Fl;
				this.Fl = void 0, this.Yo.forEach(((i) => null == i.onRemoteConfig ? void 0 : i.onRemoteConfig(t)));
			}
		})), this.Ol(u, l);
	}
	Ol(t, i) {
		for (; t.length > 0;) {
			if (this.config.__preview_deferred_init_extensions && performance.now() - i >= 30 && t.length > 0) return void setTimeout((() => {
				this.Ol(t, i);
			}), 0);
			var e = t.shift();
			if (e) try {
				e();
			} catch (t) {
				Ie.error("Error initializing extension:", t);
			}
		}
		var r = Math.round(performance.now() - i);
		this.register_for_session({
			[jr]: this.config.__preview_deferred_init_extensions ? "deferred" : "synchronous",
			[Br]: r
		}), this.config.__preview_deferred_init_extensions && Ie.info("PostHog extensions initialized (" + r + "ms)");
	}
	za(t) {
		var i;
		if (!r || !r.body) return Ie.info("document not ready yet, trying again in 500 milliseconds..."), void setTimeout((() => {
			this.za(t);
		}), 500);
		if (this.config.__preview_deferred_init_extensions && (this.Fl = t), this.el = t, this.compression = void 0, t.ok) {
			var e, s = t.config;
			s.supportedCompression && !this.config.disable_compression && (this.compression = N(s.supportedCompression, yo.GZipJS) ? yo.GZipJS : N(s.supportedCompression, yo.Base64) ? yo.Base64 : void 0), null != (e = s.analytics) && e.endpoint && (this.analyticsDefaultEndpoint = s.analytics.endpoint);
		}
		this.set_config({ person_profiles: this.ml ? this.ml : Kr }), null == (i = this.Ll) || i.handleRemoteConfig(t), this.Yo.forEach(((i) => null == i.onRemoteConfig ? void 0 : i.onRemoteConfig(t)));
	}
	El() {
		try {
			this.config.loaded(this);
		} catch (t) {
			Ie.critical("`loaded` function failed", t);
		}
		if (this.Dl(), this.config.internal_or_test_user_hostname && null != s && s.hostname) {
			var t = s.hostname, i = this.config.internal_or_test_user_hostname;
			("string" == typeof i ? t === i : i.test(t)) && this.setInternalOrTestUser();
		}
		this.config.capture_pageview && setTimeout((() => {
			(this.consent.isOptedIn() || this.ol()) && this.$l();
		}), 1), this.Nl = new No(this), this.Nl.load();
	}
	Dl() {
		var t;
		this.is_capturing() && this.config.request_batching && (null == (t = this.kl) || t.enable());
	}
	_dom_loaded() {
		this.is_capturing() && is(this.__request_queue, ((t) => this.Sl(t))), this.__request_queue = [], this.Dl();
	}
	_handle_unload() {
		var t, i, e, r, s;
		null == (t = this.surveys) || null == t.handlePageUnload || t.handlePageUnload(), null == (i = this.metrics) || i.flush("sendBeacon"), this.config.request_batching ? (this.ql() && this.capture(Xr), null == (e = this.logs) || e.flushLogs("sendBeacon"), null == (r = this.kl) || r.unload(), null == (s = this.xl) || s.unload()) : this.ql() && this.capture(Xr, null, { transport: "sendBeacon" });
	}
	_send_request(t) {
		var i;
		this.__loaded ? El ? this.__request_queue.push(t) : this.rateLimiter.isServerRateLimited(t.batchKey) ? t.fireCallbackOnDrop && (null == t.callback || t.callback({ statusCode: 429 })) : (t.transport = t.transport || this.config.api_transport, t.headers = _({}, this.config.request_headers, t.headers), t.compression = "best-available" === t.compression ? null !== (i = this.compression) && void 0 !== i ? i : t.compressionFallback : t.compression, (K(this.config.disable_beacon) ? this.config.__preview_disable_beacon : this.config.disable_beacon) && (t.disableTransport = ["sendBeacon"]), t.fetchOptions = t.fetchOptions || this.config.fetch_options, ((t) => {
			var i, e, r, s = _({}, t);
			s.timeout = s.timeout || 6e4;
			var n, o, a, h, u, d = null !== (i = s.transport) && void 0 !== i ? i : "fetch";
			"sendBeacon" === d && K(s.compression) && s.data && (s.compression = yo.Base64), "POST" === s.method && s.data && ("capture-body" === s.timestampMode ? s.data = {
				api_key: null !== (o = null == (u = (h = (H(n = s.data) ? n : [n]).map(((t) => _({}, t, t.timestamp instanceof Date && !isNaN(t.timestamp.getTime()) ? { timestamp: t.timestamp.toISOString() } : {}))))[0]) || null == (a = u.properties) ? void 0 : a.token) && void 0 !== o ? o : null == u ? void 0 : u.token,
				batch: h,
				sent_at: (/* @__PURE__ */ new Date()).toISOString()
			} : "body" === s.timestampMode && (s.data = function(t, i) {
				return void 0 === i && (i = (/* @__PURE__ */ new Date()).toISOString()), H(t) ? t.map(((t) => _({}, t, { sent_at: i }))) : _({}, t, { sent_at: i });
			}(s.data))), s.url = Ca(s.url, s.method, s.compression, s.timestampMode);
			var v = Oa.filter(((t) => !s.disableTransport || !t.transport || !s.disableTransport.includes(t.transport))), c = null !== (e = null == (r = function(t, i) {
				for (var e = 0; t.length > e; e++) if (t[e].transport === d) return t[e];
			}(v)) ? void 0 : r.method) && void 0 !== e ? e : v[0].method;
			if (!c) throw new Error("No available transport method");
			var f = (t) => {
				try {
					c(t);
				} catch (t) {
					$a(t) ? Ie.warn(t) : Ie.error(t), null == s.callback || s.callback({
						statusCode: 0,
						error: t
					});
				}
			};
			"sendBeacon" !== d && s.data && s.compression === yo.GZipJS && l && "undefined" != typeof Promise && !ya ? ka(s).then(((t) => {
				f(t);
			})).catch(((i) => {
				if (Ci(i)) return ya = !0, void f(_({}, s, {
					compression: void 0,
					url: Ca(t.url, t.method, void 0, t.timestampMode)
				}));
				((t) => {
					if (!t || "object" != typeof t) return !1;
					var i = "name" in t ? String(t.name) : "";
					return Ci(t) || i === $i;
				})(i) && (ya = !0), f(s);
			})) : c(s);
		})(_({}, t, { callback: (i) => {
			var e, r;
			this.rateLimiter.checkForLimiting(i), 400 > i.statusCode || null == (e = (r = this.config).on_request_error) || e.call(r, i), null == t.callback || t.callback(i);
		} }))) : t.fireCallbackOnDrop && (null == t.callback || t.callback({ statusCode: 0 }));
	}
	Sl(t) {
		this.xl ? this.xl.retriableRequest(t) : this._send_request(t);
	}
	_execute_array(t) {
		pl++;
		try {
			var i, e = [], r = [], s = [];
			is(t, ((t) => {
				if (t) if (H(i = t[0])) s.push(t);
				else if (V(t)) try {
					t.call(this);
				} catch (i) {
					Ie.error("Error executing queued PostHog call", t, i);
				}
				else H(t) && "alias" === i ? e.push(t) : H(t) && -1 !== i.indexOf("capture") && V(this[i]) ? s.push(t) : r.push(t);
			}));
			var n = function(t, i) {
				is(t, (function(t) {
					try {
						if (H(t[0])) {
							var e = i;
							es(t, (function(t) {
								e = e[t[0]].apply(e, t.slice(1));
							}));
						} else i[t[0]].apply(i, t.slice(1));
					} catch (i) {
						Ie.error("Error executing queued PostHog call", t, i);
					}
				}));
			};
			n(e, this), n(r, this), n(s, this);
		} finally {
			pl--;
		}
	}
	push(t) {
		if (pl > 0 && H(t) && J(t[0])) {
			var i = Rl.prototype[t[0]];
			V(i) && i.apply(this, t.slice(1));
		} else this._execute_array([t]);
	}
	capture(t, i, e) {
		var r, s, n, o, a;
		if (this.__loaded && this.persistence && this.sessionPersistence && this.kl) {
			if (this.is_capturing()) if (!K(t) && J(t)) {
				this.ll();
				var l = !this.config.opt_out_useragent_filter && this._is_bot();
				if (!l || this.config.__preview_capture_bot_pageviews) {
					var h = null != e && e.skip_client_rate_limiting ? void 0 : this.rateLimiter.clientRateLimitContext();
					if (null == h || !h.isRateLimited) {
						null != i && i.$current_url && !J(null == i ? void 0 : i.$current_url) && (Ie.error("Invalid `$current_url` property provided to `posthog.capture`. Input must be a string. Ignoring provided value."), null == i || delete i.$current_url), "$exception" !== t || null != e && e.jl || Ie.warn("Using `posthog.capture('$exception')` is unreliable because it does not attach required metadata. Use `posthog.captureException(error)` instead, which attaches required metadata automatically."), this.sessionPersistence.update_search_keyword(), this.config.save_campaign_params && this.sessionPersistence.update_campaign_params(), this.config.save_referrer && this.sessionPersistence.update_referrer_info(), (this.config.save_campaign_params || this.config.save_referrer) && this.persistence.set_initial_person_info();
						var u = /* @__PURE__ */ new Date(), d = (null == e ? void 0 : e.timestamp) || u, v = bi(null == e ? void 0 : e.uuid, ms), c = {
							uuid: v,
							event: t,
							properties: this.calculateEventProperties(t, i || {}, d, v)
						};
						t === Qr && this.config.__preview_capture_bot_pageviews && l && (c.event = "$bot_pageview", c.properties.$browser_type = "bot"), h && (c.properties.$lib_rate_limit_remaining_tokens = h.remainingTokens);
						var f = "$feature_flag_called" === t && !1 === c.properties.$feature_flag_has_experiment && !0 === this.get_property(pr);
						null != e && e.$set && !f && (c.$set = null == e ? void 0 : e.$set);
						var p = null == e ? void 0 : e.$unset;
						p && (c.$unset = p);
						var g, m, y, b = f ? void 0 : this.Bl(null == e ? void 0 : e.$set_once, t !== ts, t === Zr);
						if (b && (c.$set_once = b), null != e && e._noTruncate || (s = this.config.properties_string_max_length, n = c, o = (t) => J(t) ? t.slice(0, s) : t, a = /* @__PURE__ */ new Set(), c = function t(i, e) {
							if (i !== Object(i)) return o ? o(i) : i;
							if (!a.has(i)) {
								var r;
								if (a.add(i), H(i)) r = [], is(i, ((i) => {
									r.push(t(i));
								}));
								else {
									var s = {};
									es(i, ((i, e) => {
										a.has(i) || (s[e] = t(i, e));
									})), r = s;
								}
								return r;
							}
						}(n)), c.timestamp = d, K(null == e ? void 0 : e.timestamp) || (c.properties.$event_time_override_provided = !0, c.properties.$event_time_override_system_time = u), f && (c.properties = function(t, i) {
							void 0 === i && (i = []);
							var e = {}, r = (i) => {
								void 0 !== t[i] && (e[i] = t[i]);
							};
							return w.forEach(r), i.forEach(r), e;
						}(c.properties, wl)), t === Po.DISMISSED || t === Po.SENT) {
							var x = null == i ? void 0 : i[Ro.SURVEY_ID], E = null == i ? void 0 : i[Ro.SURVEY_ITERATION];
							sl({
								id: x,
								current_iteration: E
							}), c.$set = _({}, c.$set, { [(g = {
								id: x,
								current_iteration: E
							}, m = t === Po.SENT ? "responded" : "dismissed", y = "$survey_" + m + "/" + g.id, g.current_iteration && g.current_iteration > 0 && (y = "$survey_" + m + "/" + g.id + "/" + g.current_iteration), y)]: !0 });
						} else t === Po.SHOWN && (c.$set = _({}, c.$set, { [Ro.SURVEY_LAST_SEEN_DATE]: (/* @__PURE__ */ new Date()).toISOString() }));
						if (t === Io.SHOWN) {
							var S = null == i ? void 0 : i[Ao.TOUR_TYPE];
							S && (c.$set = _({}, c.$set, { [Ao.TOUR_LAST_SEEN_DATE + "/" + S]: (/* @__PURE__ */ new Date()).toISOString() }));
						}
						var k = _({}, c.properties.$set, c.$set);
						if (G(k) || this.setPersonPropertiesForFlags(k), !X(this.config.before_send)) {
							var T = this.Jn(c);
							if (!T) return;
							(c = T).uuid = bi(c.uuid, ms);
						}
						this.il.emit("eventCaptured", c);
						var P = null !== (r = null == e ? void 0 : e._url) && void 0 !== r ? r : this.requestRouter.endpointFor("api", this.analyticsDefaultEndpoint), R = {
							method: "POST",
							url: P,
							data: c,
							compression: "best-available",
							timestampMode: "recordings" === (null == e ? void 0 : e._batchKey) || /\/s\/(?:\?|$)/.test(P) ? "body" : "capture-body",
							batchKey: null == e ? void 0 : e._batchKey,
							transport: null == e ? void 0 : e.transport
						};
						return !this.config.request_batching || e && (null == e || !e._batchKey) || null != e && e.send_instantly ? this.Sl(R) : this.kl.enqueue(R), c;
					}
					Ie.critical("This capture call is ignored due to client rate limiting.");
				}
			} else Ie.error("No event name provided to posthog.capture");
		} else Ie.uninitializedWarning("posthog.capture");
	}
	_addCaptureHook(t) {
		return this.on("eventCaptured", ((i) => t(i.event, i)));
	}
	getExtension(t) {
		var i;
		return null == (i = this.Ll) ? void 0 : i.getExtension(t);
	}
	Pl() {
		var t;
		return null !== (t = this.Ll) && void 0 !== t ? t : this.Ll = new cl(this);
	}
	nl(t) {
		this.fl.push(t);
		var i = !0;
		return () => {
			if (i) {
				i = !1;
				var e = this.fl.indexOf(t);
				-1 !== e && this.fl.splice(e, 1);
			}
		};
	}
	Hl(t) {
		var i, e, r;
		return void 0 === t && (t = !0), !(null == (i = this.persistence) || !i.consumeCookieIdentityChange()) && (this.yl = null, this.persistence.get_property(Or) === Wr && (null == (r = this.sessionPersistence) || r.clear(), this.vl.clear(), this.zl()), null == (e = this.featureFlags) || e.reset(), t && this.reloadFeatureFlags(), !0);
	}
	calculateEventProperties(i, e, n, o, a) {
		if (n = n || /* @__PURE__ */ new Date(), !this.persistence || !this.sessionPersistence) return e;
		this.persistence.syncCookieProperties(), this.Hl();
		var l = a ? void 0 : this.persistence.remove_event_timer(i), u = _({}, e);
		if (u.token = this.config.token, u.$config_defaults = this.config.defaults, this.ol() && (u[Ur] = !0), "$snapshot" === i) {
			var d = _({}, this.persistence.properties(), this.sessionPersistence.properties());
			return u.distinct_id = d.distinct_id, (!J(u.distinct_id) && !Z(u.distinct_id) || Y(u.distinct_id)) && Ie.error("Invalid distinct_id for replay event. This indicates a bug in your implementation"), u;
		}
		var v, f = function(i, e, r, n) {
			var o, a, l, u;
			if (void 0 === n && (n = !1), !h) return {};
			var d, v = i ? [...Qn, ...e || []] : [], f = function(t) {
				for (var i = 0; gi.length > i; i++) {
					var e = gi[i], r = e[1], s = e[0].exec(t), n = s && (V(r) ? r(s, t) : r);
					if (n) return n;
				}
				return ["", ""];
			}(h), p = f[0], _ = f[1], g = null != (d = "undefined" != typeof navigator ? navigator : void 0) && d.brave ? { brave: !0 } : {}, m = {};
			K(r) || (m.detectGoogleSearchApp = r);
			var y = {}, b = null == (o = navigator) || null == (o = o.userAgentData) ? void 0 : o.platform, w = null == (a = navigator) ? void 0 : a.maxTouchPoints, x = null == t || null == (l = t.screen) ? void 0 : l.width, E = null == t || null == (u = t.screen) ? void 0 : u.height, S = null == t ? void 0 : t.devicePixelRatio;
			K(b) || (y.userAgentDataPlatform = b), K(w) || (y.maxTouchPoints = w), K(x) || (y.screenWidth = x), K(E) || (y.screenHeight = E), K(S) || (y.devicePixelRatio = S);
			var k, T, P, R, C, O, I, A, F = rs(as({
				$os: p,
				$os_version: _,
				$browser: fi(h, navigator.vendor, g, m),
				$device: mi(h),
				$device_type: (T = h, P = y, A = mi(T), A === bt || A === yt || "Kobo" === A || "Kindle Fire" === A || A === Yt ? mt : A === Ut || A === Bt || A === jt || A === Gt ? "Console" : A === xt ? "Wearable" : A ? pt : "Android" === (null == P ? void 0 : P.userAgentDataPlatform) && (null !== (R = null == P ? void 0 : P.maxTouchPoints) && void 0 !== R ? R : 0) > 0 ? 600 > Math.min(null !== (C = null == P ? void 0 : P.screenWidth) && void 0 !== C ? C : 0, null !== (O = null == P ? void 0 : P.screenHeight) && void 0 !== O ? O : 0) / (null !== (I = null == P ? void 0 : P.devicePixelRatio) && void 0 !== I ? I : 1) ? pt : mt : "Desktop"),
				$timezone: ho(),
				$timezone_offset: uo()
			}), {
				$current_url: Wn(n ? xi(null == s ? void 0 : s.href) : null == s ? void 0 : s.href, v, Zn),
				$host: null == s ? void 0 : s.host,
				$pathname: null == s ? void 0 : s.pathname,
				$raw_user_agent: h.length > 1e3 ? h.substring(0, 997) + "..." : h,
				$browser_version: _i(h, navigator.vendor, g, m),
				$browser_language: so(),
				$browser_language_prefix: (k = so(), "string" == typeof k ? k.split("-")[0] : void 0),
				$screen_height: null == t ? void 0 : t.screen.height,
				$screen_width: null == t ? void 0 : t.screen.width,
				$viewport_height: null == t ? void 0 : t.innerHeight,
				$viewport_width: null == t ? void 0 : t.innerWidth,
				$lib: c.LIB_NAME,
				$lib_version: c.LIB_VERSION,
				$insert_id: Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10),
				$time: Date.now() / 1e3
			});
			return c.SDK_DIST_CHANNEL && (F.$sdk_dist_channel = c.SDK_DIST_CHANNEL), F;
		}(this.config.mask_personal_data_properties, this.config.custom_personal_data_properties, this.config.detect_google_search_app, this.config.disable_capture_url_hashes);
		if (this.sessionManager) {
			var p = this.sessionManager.checkAndGetSessionAndWindowId(a, n.getTime(), !0), g = p.windowId;
			u.$session_id = p.sessionId, u.$window_id = g;
		}
		this.sessionPropsManager && rs(u, this.sessionPropsManager.getSessionProps());
		try {
			var m;
			this.sessionRecording && rs(u, this.sessionRecording.sdkDebugProperties), u.$sdk_debug_retry_queue_size = null == (m = this.xl) ? void 0 : m.length;
		} catch (t) {
			u.$sdk_debug_error_capturing_properties = String(t);
		}
		if (this.requestRouter.region === Qa && (u.$lib_custom_api_host = this.config.api_host), v = i !== Qr || a ? i !== Xr || a ? this.pageViewManager.doEvent() : this.pageViewManager.doPageLeave(n) : this.pageViewManager.doPageView(n, o), u = rs(u, v), i === Qr && r && (u.title = r.title), !K(l)) {
			var y = n.getTime() - l;
			u.$duration = parseFloat((y / 1e3).toFixed(3));
		}
		h && this.config.opt_out_useragent_filter && (u.$browser_type = this._is_bot() ? "bot" : "browser");
		var b = this.persistence.properties(), w = this.sessionPersistence.properties();
		es(["$referrer", "$referring_domain"], ((t) => {
			t in b && delete w[t];
		}));
		var x = {};
		if (this.fl.length > 0) for (var E of this.fl.slice()) try {
			rs(x, E());
		} catch (t) {
			Ie.error("Failed to produce browser extension event properties", t);
		}
		(u = rs({}, f, b, w, _({}, x, u))).$is_identified = this._isIdentified(), H(this.config.property_denylist) ? es(this.config.property_denylist, (function(t) {
			delete u[t];
		})) : Ie.error(bl + this.config.property_denylist + " or property_blacklist config: " + this.config.property_blacklist);
		var S = this.config.sanitize_properties;
		S && (Ie.error(yl), u = S(u, i));
		var k = this.Ul();
		return u.$process_person_profile = k, k && !a && this.Wl("_calculate_event_properties"), u;
	}
	Bl(t, i, e) {
		var r;
		if (void 0 === i && (i = !0), void 0 === e && (e = !1), !this.persistence || !this.Ul()) return t;
		if (this.dl && !e) return t;
		var o = rs({}, this.persistence.get_initial_props(), (null == (r = this.sessionPropsManager) ? void 0 : r.getSetOnceProps()) || {}, t || {}), a = this.config.sanitize_properties;
		return a && (Ie.error(yl), o = a(o, "$set_once")), i && (this.dl = !0), G(o) ? void 0 : o;
	}
	register(t, i) {
		var e;
		null == (e = this.persistence) || e.register(t, i);
	}
	register_once(t, i, e) {
		var r;
		null == (r = this.persistence) || r.register_once(t, i, e);
	}
	register_for_session(t) {
		var i, e;
		null == (i = this.persistence) || i.syncCookieProperties(), this.Hl(), null == (e = this.sessionPersistence) || e.register(t), Object.keys(t).forEach(((t) => this.vl.add(t))), this.zl();
	}
	unregister(t) {
		var i;
		null == (i = this.persistence) || i.unregister(t);
	}
	unregister_for_session(t) {
		var i;
		null == (i = this.sessionPersistence) || i.unregister(t), this.vl.delete(t), this.zl();
	}
	Vl(t, i) {
		this.register({ [t]: i });
	}
	Cl() {
		this.vl.forEach(((t) => {
			var i;
			null == (i = this.sessionPersistence) || i.unregister(t);
		})), this.vl.clear(), this.zl();
	}
	zl() {
		var t;
		if (this.cl) if ("memory" === this.config.persistence || null != (t = this.sessionPersistence) && t.ga || !Ls.Xr()) Ls.ri(this.cl);
		else {
			var i = [];
			this.vl.forEach(((t) => i.push(t))), i.length > 0 ? Ls.ei(this.cl, i) : Ls.ri(this.cl);
		}
	}
	getFeatureFlag(t, i) {
		var e;
		return null == (e = this.featureFlags) ? void 0 : e.getFeatureFlag(t, i);
	}
	getFeatureFlagPayload(t) {
		var i;
		return null == (i = this.featureFlags) ? void 0 : i.getFeatureFlagPayload(t);
	}
	getFeatureFlagResult(t, i) {
		var e;
		return null == (e = this.featureFlags) ? void 0 : e.getFeatureFlagResult(t, i);
	}
	getAllFeatureFlags() {
		var t, i;
		return null !== (t = null == (i = this.featureFlags) ? void 0 : i.getAllFeatureFlags()) && void 0 !== t ? t : [];
	}
	isFeatureEnabled(t, i) {
		var e, r;
		return null !== (e = null == (r = this.featureFlags) ? void 0 : r.isFeatureEnabled(t, i)) && void 0 !== e ? e : null == i ? void 0 : i.defaultValue;
	}
	reloadFeatureFlags() {
		var t;
		null == (t = this.featureFlags) || t.reloadFeatureFlags();
	}
	updateFlags(t, i, e) {
		var r;
		null == (r = this.featureFlags) || r.updateFlags(t, i, e);
	}
	updateEarlyAccessFeatureEnrollment(t, i, e) {
		var r;
		null == (r = this.featureFlags) || r.updateEarlyAccessFeatureEnrollment(t, i, e);
	}
	getEarlyAccessFeatures(t, i, e) {
		var r;
		return void 0 === i && (i = !1), null == (r = this.featureFlags) ? void 0 : r.getEarlyAccessFeatures(t, i, e);
	}
	on(t, i) {
		return this.il.on(t, i);
	}
	onFeatureFlags(t) {
		return this.featureFlags ? this.featureFlags.onFeatureFlags(t) : (t([], {}, { errorsLoading: !0 }), () => {});
	}
	onSurveysLoaded(t) {
		return this.surveys ? this.surveys.onSurveysLoaded(t) : (t([], {
			isLoaded: !1,
			error: ml
		}), () => {});
	}
	onSessionId(t) {
		var i, e;
		return null !== (i = null == (e = this.sessionManager) ? void 0 : e.onSessionId(t)) && void 0 !== i ? i : () => {};
	}
	getSurveys(t, i) {
		void 0 === i && (i = !1), this.surveys ? this.surveys.getSurveys(t, i) : t([], {
			isLoaded: !1,
			error: ml
		});
	}
	getActiveMatchingSurveys(t, i) {
		void 0 === i && (i = !1), this.surveys ? this.surveys.getActiveMatchingSurveys(t, i) : t([], {
			isLoaded: !1,
			error: ml
		});
	}
	renderSurvey(t, i) {
		var e;
		null == (e = this.surveys) || e.renderSurvey(t, i);
	}
	displaySurvey(t, i) {
		var e;
		void 0 === i && (i = ol), null == (e = this.surveys) || e.displaySurvey(t, i);
	}
	cancelPendingSurvey(t) {
		var i;
		null == (i = this.surveys) || i.cancelPendingSurvey(t);
	}
	canRenderSurvey(t) {
		var i, e;
		return null !== (i = null == (e = this.surveys) ? void 0 : e.canRenderSurvey(t)) && void 0 !== i ? i : {
			visible: !1,
			disabledReason: ml
		};
	}
	canRenderSurveyAsync(t, i) {
		var e, r;
		return void 0 === i && (i = !1), null !== (e = null == (r = this.surveys) ? void 0 : r.canRenderSurveyAsync(t, i)) && void 0 !== e ? e : Promise.resolve({
			visible: !1,
			disabledReason: ml
		});
	}
	Gl(t) {
		return !t || Y(t) ? (Ie.critical("Unique user id has not been set in posthog.identify"), !1) : t === Lr ? (Ie.critical("The string \"" + t + "\" was set in posthog.identify which indicates an error. This ID is only used as a sentinel value."), !1) : !["distinct_id", "distinctid"].includes(t.toLowerCase()) && !["undefined", "null"].includes(t.toLowerCase()) || (Ie.critical("The string \"" + t + "\" was set in posthog.identify which indicates an error. This ID should be unique to the user and not a hardcoded string."), !1);
	}
	identify(t, i, e) {
		if (!this.__loaded || !this.persistence) return Ie.uninitializedWarning("posthog.identify");
		if (Z(t) && (t = t.toString(), Ie.warn("The first argument to posthog.identify was a number, but it should be a string. It has been converted to a string.")), this.Gl(t) && this.Wl("posthog.identify")) {
			this.ll();
			var r = this.get_distinct_id(), s = this.persistence.syncCookieProperties() && this.get_distinct_id() !== r, n = this.Hl(!1), o = this.persistence.ba(), a = !1;
			try {
				var l = this.get_distinct_id();
				this.register({ $user_id: t }), this.get_property(Be) || this.register_once({
					$had_persisted_distinct_id: !0,
					$device_id: l
				}, ""), t !== l && t !== this.get_property(qe) && (this.unregister(qe), this.register({ distinct_id: t }));
				var h, u = (this.persistence.get_property(Or) || Wr) === Wr, d = t !== l, v = !d && u;
				if (d && u) this.persistence.set_property(Or, Gr), this.setPersonPropertiesForFlags({
					$set: i || {},
					$set_once: e || {}
				}, !1), this.config.cookieWinsOnConflict && this.persistence._a(), this.capture(Zr, {
					distinct_id: t,
					$anon_distinct_id: l
				}, {
					$set: i || {},
					$set_once: e || {}
				}), this.yl = Ya(t, i, e), null == (h = this.featureFlags) || h.setAnonymousDistinctId(l);
				else if (v) {
					this.persistence.set_property(Or, Gr);
					var c = i || {}, f = e || {};
					this.setPersonPropertiesForFlags({
						$set: c,
						$set_once: f
					}, !1), this.config.cookieWinsOnConflict && this.persistence._a(), this.capture("$set", {
						$set: c,
						$set_once: f
					}), this.yl = Ya(t, i, e);
				} else (i || e) && this.setPersonProperties(i, e);
				d || s || n ? (this.reloadFeatureFlags(), this.featureFlags ? this.featureFlags.resetFlagCallReported() : this.unregister($r)) : v && (i || e) && this.reloadFeatureFlags(), a = !0;
			} finally {
				o && this.persistence.Sa(a);
			}
		}
	}
	setPersonProperties(t, i) {
		if ((t || i) && this.Wl("posthog.setPersonProperties")) {
			var e = Ya(this.get_distinct_id(), t, i);
			this.yl !== e ? (this.setPersonPropertiesForFlags({
				$set: t || {},
				$set_once: i || {}
			}, !0), this.capture("$set", {
				$set: t || {},
				$set_once: i || {}
			}), this.yl = e) : Ie.info("A duplicate setPersonProperties call was made with the same properties. It has been ignored.");
		}
	}
	unsetPersonProperties(t) {
		var i, e = (H(t) ? t : [t]).filter(((t) => J(t) && t.length > 0));
		0 !== e.length && this.Wl("posthog.unsetPersonProperties") && (null == (i = this.featureFlags) || i.unsetPersonPropertiesForFlags(e, !0), this.capture("$set", { $unset: e }), this.yl = null);
	}
	group(t, i, e) {
		var r;
		if (t && i) {
			null == (r = this.persistence) || r.syncCookieProperties(), this.Hl();
			var s = this.getGroups(), n = s[t] !== i;
			if (n && this.resetGroupPropertiesForFlags(t), this.register({ $groups: _({}, s, { [t]: i }) }), n || e) {
				var o = {
					$group_type: t,
					$group_key: i
				};
				e && (o.$group_set = e), this.capture(ts, o);
			}
			e && this.setGroupPropertiesForFlags({ [t]: e }), n && !e && this.reloadFeatureFlags();
		} else Ie.error("posthog.group requires a group type and group key");
	}
	resetGroups() {
		this.register({ $groups: {} }), this.resetGroupPropertiesForFlags(), this.reloadFeatureFlags();
	}
	setPersonPropertiesForFlags(t, i) {
		var e;
		void 0 === i && (i = !0), null == (e = this.featureFlags) || e.setPersonPropertiesForFlags(t, i);
	}
	resetPersonPropertiesForFlags(t) {
		var i;
		void 0 === t && (t = !0), null == (i = this.featureFlags) || i.resetPersonPropertiesForFlags(t);
	}
	setGroupPropertiesForFlags(t, i) {
		var e;
		void 0 === i && (i = !0), this.Wl("posthog.setGroupPropertiesForFlags") && (null == (e = this.featureFlags) || e.setGroupPropertiesForFlags(t, i));
	}
	resetGroupPropertiesForFlags(t) {
		var i;
		null == (i = this.featureFlags) || i.resetGroupPropertiesForFlags(t);
	}
	reset(t) {
		var i = it(t) ? t : null == t ? void 0 : t.resetDeviceID, e = it(t) || null == t ? void 0 : t.bootstrap;
		this.Zl(i, !1, e);
	}
	Zl(t, i, e) {
		var r, s, n;
		if (void 0 === i && (i = !1), Ie.info("reset"), !this.__loaded) return Ie.uninitializedWarning("posthog.reset");
		var o = null == e ? void 0 : e.sessionID;
		this.config.bootstrap = e || (null == (r = this._l) ? void 0 : r.bootstrap) || {}, null == (s = this.featureFlags) || null == s.updateConfig || s.updateConfig(this.config, this.Ua());
		var a = this.get_property(Be), l = this.get_property(ze), h = this.get_property(ir), u = this.is_capturing();
		this.consent.reset(), i || !u || this.is_capturing() || console.warn("[PostHog.js]", "reset() cleared the stored consent, and capturing is now off because of `opt_out_capturing_by_default`. Call opt_in_capturing() again, and prefer calling reset() before opting in rather than after.");
		var d = null == (n = this.persistence) || null == n.ba ? void 0 : n.ba(), v = !1;
		try {
			var c, f, p, g, m, y, b, w, x, E, S, k, T;
			if (null == (c = this.persistence) || c.clear(), null == (f = this.sessionPersistence) || f.clear(), this.vl.clear(), this.zl(), K(h) || null == (E = this.persistence) || E.register({ [ir]: h }), null == (p = this.surveys) || p.reset(), null == (g = this.featureFlags) || g.reset(), null == (m = this.conversations) || m.reset(), null == (y = this.logs) || y.reset(), null == (b = this.metrics) || b.reset(), null == (w = this.persistence) || w.set_property(Or, Wr), null == (x = this.sessionManager) || x.resetSessionId(), this.yl = null, this.config.cookieless_mode === Vr) this.register_once({
				distinct_id: Lr,
				$device_id: null
			}, "");
			else {
				var P = this.config.get_device_id(ms());
				this.register_once({
					distinct_id: P,
					$device_id: t ? P : a
				}, ""), t || K(l) || this.register({ [ze]: l });
			}
			if (this.register({ $last_posthog_reset: (/* @__PURE__ */ new Date()).toISOString() }, 1), e) {
				if (void 0 === e.distinctID || this.ol() || (null == (T = this.persistence) || T.set_property(Or, e.isIdentifiedID ? Gr : Wr), this.register({ distinct_id: e.distinctID })), null == (S = this.featureFlags) || S.initialize(), !(K(o) || null != (k = this.sessionManager) && k.setBootstrapSessionId(o, !0))) {
					var R = _({}, e);
					delete R.sessionID, this.config.bootstrap = R;
				}
			}
			delete this.config.identity_distinct_id, delete this.config.identity_hash, v = !0;
		} finally {
			var C;
			d && (null == (C = this.persistence) || null == C.Sa || C.Sa(v));
		}
		this.reloadFeatureFlags();
	}
	shutdown(t) {
		var i = this;
		return p((function* () {
			var t, e, r, s, n;
			if (i.__loaded) {
				i.Pl().dispose(), null == (t = i.sessionRecording) || t.dispose(), null == (e = i.logs) || e.flushLogs("sendBeacon"), null == (r = i.metrics) || r.flush("sendBeacon"), null == (s = i.kl) || s.unload(), null == (n = i.xl) || n.unload();
				try {
					var o;
					null == (o = i.featureFlags) || o.destroy();
				} catch (t) {
					Ie.error("Error while destroying feature flags", t);
				}
			} else Ie.uninitializedWarning("posthog.shutdown");
		}))();
	}
	setIdentity(t, i) {
		var e;
		this.config.identity_distinct_id = t, this.config.identity_hash = i, this.alias(t), null == (e = this.conversations) || e.Ql();
	}
	clearIdentity() {
		var t;
		delete this.config.identity_distinct_id, delete this.config.identity_hash, null == (t = this.conversations) || t.Jl();
	}
	get_distinct_id() {
		return this.get_property("distinct_id");
	}
	getGroups() {
		return this.get_property("$groups") || {};
	}
	get_session_id() {
		var t, i;
		return null !== (t = null == (i = this.sessionManager) ? void 0 : i.checkAndGetSessionAndWindowId(!0).sessionId) && void 0 !== t ? t : "";
	}
	get_session_replay_url(t) {
		if (!this.sessionManager) return "";
		var i = this.sessionManager.checkAndGetSessionAndWindowId(!0), e = i.sessionStartTimestamp, r = this.requestRouter.endpointFor("ui", "/project/" + this.config.token + "/replay/" + i.sessionId);
		if (null != t && t.withTimestamp && e) {
			var s, n = null !== (s = t.timestampLookBack) && void 0 !== s ? s : 10;
			if (!e) return r;
			r += "?t=" + Math.max(Math.floor(((/* @__PURE__ */ new Date()).getTime() - e) / 1e3) - n, 0);
		}
		return r;
	}
	alias(t, i) {
		return t === this.get_property(Ue) ? (Ie.critical("Attempting to create alias for existing People user - aborting."), -2) : this.Wl("posthog.alias") ? (K(i) && (i = this.get_distinct_id()), t !== i ? (this.Vl(qe, t), this.capture("$create_alias", {
			alias: t,
			distinct_id: i
		})) : (Ie.warn("alias matches current distinct_id - skipping api call."), this.identify(t), -1)) : void 0;
	}
	set_config(t) {
		var i = _({}, this.config);
		if (W(t)) {
			var e, r, s, n, o, a, l, h, u, d, v, f;
			rs(this.config, $l(t));
			var p = this.ul();
			null == (e = this.persistence) || e.update_config(this.config, i, p), this.sessionPersistence = "sessionStorage" === this.config.persistence || "memory" === this.config.persistence ? this.persistence : new go(_({}, this.config, { persistence: "sessionStorage" }), p, !1);
			var g, m = this.bl(this.config.debug);
			it(m) && (this.config.debug = m), it(this.config.debug) && (this.config.debug ? (c.DEBUG = !0, Ss.Xr() && Ss.ei("ph_debug", !0), Ie.info("set_config", {
				config: t,
				oldConfig: i,
				newConfig: _({}, this.config)
			})) : (c.DEBUG = !1, Ss.Xr() && Ss.ri("ph_debug"))), null == (r = this.featureFlags) || null == r.updateConfig || r.updateConfig(this.config, this.Ua()), null == (s = this.exceptionObserver) || s.onConfigChange(), null == (n = this.exceptions) || n.onConfigChange(), null == (o = this.sessionRecording) || o.startIfEnabledOrStop(), null == (a = this.tracingHeaders) || a.startIfEnabledOrStop(), null == (l = this.autocapture) || l.startIfEnabled(), null == (h = this.heatmaps) || h.startIfEnabled(), ("capture_pageview" in t || "disable_capture_url_hashes" in t) && (null == (g = this.historyAutocapture) || g.startIfEnabledOrStop()), null == (u = this.exceptionObserver) || u.startIfEnabledOrStop(), null == (d = this.deadClicksAutocapture) || d.startIfEnabledOrStop(), null == (v = this.surveys) || v.loadIfEnabled(), this.hl(), null == (f = this.externalIntegrations) || f.startIfEnabledOrStop();
		}
	}
	_overrideSDKInfo(t, i) {
		c.LIB_NAME = t, c.LIB_VERSION = i;
	}
	startSessionRecording(t) {
		var i, e, r, s, n, o = !0 === t, a = {
			sampling: o || !(null == t || !t.sampling),
			linked_flag: o || !(null == t || !t.linked_flag),
			url_trigger: o || !(null == t || !t.url_trigger),
			event_trigger: o || !(null == t || !t.event_trigger)
		};
		Object.values(a).some(Boolean) && (null == (i = this.sessionManager) || i.checkAndGetSessionAndWindowId(), a.sampling && (null == (e = this.sessionRecording) || e.overrideSampling()), a.linked_flag && (null == (r = this.sessionRecording) || r.overrideLinkedFlag()), a.url_trigger && (null == (s = this.sessionRecording) || s.overrideTrigger("url")), a.event_trigger && (null == (n = this.sessionRecording) || n.overrideTrigger("event")));
		this.set_config({ disable_session_recording: !1 });
	}
	stopSessionRecording() {
		this.set_config({ disable_session_recording: !0 });
	}
	sessionRecordingStarted() {
		var t;
		return !(null == (t = this.sessionRecording) || !t.started);
	}
	captureException(t, i) {
		if (this.exceptions) {
			var e = /* @__PURE__ */ new Error("PostHog syntheticException"), r = this.exceptions.buildProperties(t, {
				handled: !0,
				syntheticException: e
			});
			return this.exceptions.sendExceptionEvent(_({}, r, i));
		}
	}
	addExceptionStep(t, i) {
		var e;
		null == (e = this.exceptions) || e.addExceptionStep(t, i);
	}
	captureLog(t) {
		var i;
		null == (i = this.logs) || i.captureLog(t);
	}
	get logger() {
		var t, i;
		return null !== (t = null == (i = this.logs) ? void 0 : i.logger) && void 0 !== t ? t : Rl.Kl;
	}
	startExceptionAutocapture(t) {
		this.set_config({ capture_exceptions: null == t || t });
	}
	stopExceptionAutocapture() {
		this.set_config({ capture_exceptions: !1 });
	}
	loadToolbar(t) {
		var i, e;
		return null !== (i = null == (e = this.toolbar) ? void 0 : e.loadToolbar(t)) && void 0 !== i && i;
	}
	get_property(t) {
		var i;
		return null == (i = this.persistence) ? void 0 : i.props[t];
	}
	getSessionProperty(t) {
		var i;
		return null == (i = this.sessionPersistence) ? void 0 : i.props[t];
	}
	toString() {
		var t, i = null !== (t = this.config.name) && void 0 !== t ? t : xl;
		return i !== xl && (i = xl + "." + i), i;
	}
	_isIdentified() {
		var t, i;
		return (null == (t = this.persistence) ? void 0 : t.get_property(Or)) === Gr || (null == (i = this.sessionPersistence) ? void 0 : i.get_property(Or)) === Gr;
	}
	Ul() {
		var t, i;
		return !("never" === this.config.person_profiles || this.config.person_profiles === Kr && !this._isIdentified() && G(this.getGroups()) && (null == (t = this.persistence) || null == (t = t.props) || !t[qe]) && (null == (i = this.persistence) || null == (i = i.props) || !i[Nr]));
	}
	ql() {
		return !0 === this.config.capture_pageleave || "if_capture_pageview" === this.config.capture_pageleave && !!this.config.capture_pageview;
	}
	createPersonProfile() {
		this.Ul() || this.Wl("posthog.createPersonProfile") && this.setPersonProperties({}, {});
	}
	setInternalOrTestUser() {
		this.Wl("posthog.setInternalOrTestUser") && this.setPersonProperties({ $internal_or_test_user: !0 });
	}
	Wl(t) {
		return "never" === this.config.person_profiles ? (Ie.error(t + " was called, but process_person is set to \"never\". This call will be ignored."), !1) : (this.Vl(Nr, !0), !0);
	}
	ul() {
		if ("always" === this.config.cookieless_mode) return !0;
		var t = this.consent.isOptedOut();
		return this.config.disable_persistence || t && !(!this.config.opt_out_persistence_by_default && this.config.cookieless_mode !== Hr);
	}
	hl() {
		var t, i, e, r, s, n = this.ul();
		return this.is_capturing() || null == (e = this.logs) || e.Yl(), (null == (t = this.persistence) ? void 0 : t.ga) !== n && (null == (r = this.persistence) || r.set_disabled(n)), (null == (i = this.sessionPersistence) ? void 0 : i.ga) !== n && (null == (s = this.sessionPersistence) || s.set_disabled(n)), n && (this.vl.clear(), this.zl()), n;
	}
	opt_in_capturing(t) {
		var i;
		if (this.config.cookieless_mode !== Vr) {
			if (this.ol()) {
				var e, r, s, n, o;
				this.Zl(!0, !0), null == (e = this.sessionManager) || e.destroy(), null == (r = this.pageViewManager) || r.destroy(), this.sessionManager = new za(this), this.pageViewManager = new Ln(this), this.persistence && (this.sessionPropsManager = new La(this, this.sessionManager, this.persistence));
				var a, l = null !== (s = null == (n = this.config.__extensionClasses) ? void 0 : n.sessionRecording) && void 0 !== s ? s : null == (o = Rl.__defaultExtensionClasses) ? void 0 : o.sessionRecording;
				l && (this.sessionRecording = this.al(this.sessionRecording, new l(this)), this.el && (null == (a = this.sessionRecording) || null == a.onRemoteConfig || a.onRemoteConfig(this.el)));
			}
			var h, u;
			this.consent.optInOut(!0), this.hl(), this.Dl(), null == (i = this.sessionRecording) || i.startIfEnabledOrStop(), this.config.cookieless_mode == Hr && (null == (h = this.surveys) || h.loadIfEnabled()), (K(null == t ? void 0 : t.captureEventName) || null != t && t.captureEventName) && this.capture(null !== (u = null == t ? void 0 : t.captureEventName) && void 0 !== u ? u : "$opt_in", null == t ? void 0 : t.captureProperties, { send_instantly: !0 }), this.config.capture_pageview && this.$l();
		} else Ie.warn(gl);
	}
	opt_out_capturing() {
		var t, i, e;
		this.config.cookieless_mode !== Vr ? (this.config.cookieless_mode === Hr && this.consent.isOptedIn() && this.Zl(!0, !0), this.consent.optInOut(!1), this.hl(), this.config.cookieless_mode === Hr && (this.register({
			distinct_id: Lr,
			$device_id: null
		}), null == (t = this.sessionRecording) || t.stopRecording(), this.sessionRecording = void 0, null == (i = this.sessionManager) || i.destroy(), null == (e = this.pageViewManager) || e.destroy(), this.sessionManager = void 0, this.sessionPropsManager = void 0, this.config.capture_pageview && this.$l(), this.Dl())) : Ie.warn(gl);
	}
	has_opted_in_capturing() {
		return this.consent.isOptedIn();
	}
	has_opted_out_capturing() {
		return this.consent.isOptedOut();
	}
	get_explicit_consent_status() {
		var t = this.consent.consent;
		return 1 === t ? "granted" : 0 === t ? "denied" : "pending";
	}
	is_capturing() {
		return this.config.cookieless_mode === Vr || (this.config.cookieless_mode === Hr ? this.consent.isRejected() || this.consent.isOptedIn() : !this.has_opted_out_capturing());
	}
	clear_opt_in_out_capturing() {
		this.consent.reset(), this.hl();
	}
	_is_bot() {
		return e ? qa(e, this.config.custom_blocked_useragents) : void 0;
	}
	$l() {
		r && ("visible" === r.visibilityState ? this.pl || (this.pl = !0, this.capture(Qr, { title: r.title }, { send_instantly: !0 }), this.gl && (r.removeEventListener(Jr, this.gl), this.gl = null)) : this.gl || (this.gl = this.$l.bind(this), us(r, Jr, this.gl)));
	}
	debug(i) {
		!1 === i ? (t?.console.log("You've disabled debug mode."), this.set_config({ debug: !1 })) : (t?.console.log("You're now in debug mode. All calls to PostHog will be logged in your console.\nYou can disable this with `posthog.debug(false)`."), this.set_config({ debug: !0 }));
	}
	Ua() {
		var t = this._l || {};
		return "advanced_disable_flags" in t ? !!t.advanced_disable_flags : !1 !== this.config.advanced_disable_flags ? !!this.config.advanced_disable_flags : !0 === this.config.advanced_disable_decide ? (Ie.warn("Config field 'advanced_disable_decide' is deprecated. Please use 'advanced_disable_flags' instead. The old field will be removed in a future major version."), !0) : function(t, i, e, r, s) {
			var n = i in t && !X(t[i]), o = e in t && !X(t[e]);
			return n ? t[i] : !!o && (s && s.warn("Config field '" + e + "' is deprecated. Please use '" + i + "' instead. The old field will be removed in a future major version."), t[e]);
		}(t, "advanced_disable_flags", "advanced_disable_decide", 0, Ie);
	}
	Jn(t) {
		var i;
		if (X(this.config.before_send)) return t;
		var e = Object.keys(null !== (i = t.properties) && void 0 !== i ? i : {}).filter(st), r = H(this.config.before_send) ? this.config.before_send : [this.config.before_send], s = t;
		for (var n of r) try {
			if (s = n(s), X(s)) {
				var o = "Event '" + t.event + "' was rejected in beforeSend function";
				return rt(t.event) ? Ie.warn(o + ". This can cause unexpected behavior.") : Ie.info(o), null;
			}
			s.properties && !G(s.properties) || Ie.warn("Event '" + t.event + "' has no properties after beforeSend function, this is likely an error.");
		} catch (i) {
			return Ie.error("Error in beforeSend function for event '" + t.event + "':", i), null;
		}
		for (var a of e) if (s.properties && X(s.properties[a])) return Ie.warn("Event '" + t.event + "' had its '" + a + "' property removed in a beforeSend function. This property is required for ingestion, so the event will be dropped."), null;
		return s;
	}
	getPageViewId() {
		var t;
		return null == (t = this.pageViewManager.Ks) ? void 0 : t.pageViewId;
	}
	captureTraceFeedback(t, i) {
		this.capture("$ai_feedback", {
			$ai_trace_id: String(t),
			$ai_feedback_text: i
		});
	}
	captureTraceMetric(t, i, e) {
		this.capture("$ai_metric", {
			$ai_trace_id: String(t),
			$ai_metric_name: i,
			$ai_metric_value: String(e)
		});
	}
	bl(t) {
		var i = it(t) && !t, e = Ss.Xr() && "true" === Ss.ti("ph_debug");
		return !i && (!!e || t);
	}
};
Rl.__defaultExtensionClasses = {}, Rl.Kl = (() => {
	var t = () => {};
	return {
		trace: t,
		debug: t,
		info: t,
		warn: t,
		error: t,
		fatal: t
	};
})(), function(t, i) {
	for (var e = 0; i.length > e; e++) t.prototype[i[e]] = os(t.prototype[i[e]]);
}(Rl, ["identify"]);
var Cl = class {
	constructor(t) {
		this.disabled = !1 === t;
		var i = W(t) ? t : {};
		this.thresholdPx = i.threshold_px || 30, this.timeoutMs = i.timeout_ms || 1e3, this.clickCount = i.click_count || 3, this.clicks = [];
	}
	isRageClick(t, i, e) {
		if (this.disabled) return !1;
		var r = this.clicks[this.clicks.length - 1];
		if (r && Math.abs(t - r.x) + Math.abs(i - r.y) < this.thresholdPx && this.timeoutMs > e - r.timestamp) {
			if (this.clicks.push({
				x: t,
				y: i,
				timestamp: e
			}), this.clicks.length === this.clickCount) return !0;
		} else this.clicks = [{
			x: t,
			y: i,
			timestamp: e
		}];
		return !1;
	}
};
var Ol = "$copy_autocapture";
var Il = Ae("[AutoCapture]");
function Al(t, i) {
	return i.length > t ? i.slice(0, t) + "..." : i;
}
function Fl(t) {
	if (t.previousElementSibling) return t.previousElementSibling;
	var i = t;
	do
		i = i.previousSibling;
	while (i && !Ws(i));
	return i;
}
function Ml(i, e) {
	var r, s, n = e.e, o = e.maskAllElementAttributes, a = e.maskAllText, l = e.elementAttributeIgnoreList, h = e.elementsChainAsString, u = e.disableCaptureUrlHashes;
	if (!Ws(i)) return { props: {} };
	for (var d = [i], v = /* @__PURE__ */ new Set([i]), c = i; c.parentNode && !Gs(c, "body") && Ys > d.length;) if (Js(c.parentNode)) {
		var f = c.parentNode.host;
		if (v.has(f)) break;
		v.add(f), d.push(f), c = f;
	} else {
		if (!Ws(c.parentNode)) break;
		if (v.has(c.parentNode)) break;
		v.add(c.parentNode), d.push(c.parentNode), c = c.parentNode;
	}
	var p, g, m = [], y = {}, b = !1, w = !1;
	if (es(d, ((t) => {
		var i = _n(t);
		if (Gs(t, "a")) {
			var e = t.getAttribute("href");
			b = !!(i && e && kn(e)) && (u ? xi(e) : e);
		}
		N(Zs(t), "ph-no-capture") && (w = !0), m.push(function(t, i, e, r, s) {
			void 0 === s && (s = !1);
			var n = t.tagName.toLowerCase(), o = { tag_name: n };
			sn.indexOf(n) > -1 && !e && (o.$el_text = "a" === n.toLowerCase() || "button" === n.toLowerCase() ? Al(1024, Tn(t)) : Al(1024, en(t)));
			var a = Zs(t);
			a.length > 0 && (o.classes = a.filter((function(t) {
				return "" !== t;
			}))), es(t.attributes, (function(e) {
				var n;
				if ((!gn(t) || -1 !== [
					"name",
					"id",
					"class",
					"aria-label"
				].indexOf(e.name)) && (null == r || !r.includes(e.name)) && !i && kn(e.value) && (!J(n = e.name) || "_ngcontent" !== n.substring(0, 10) && "_nghost" !== n.substring(0, 7))) {
					var a = e.value;
					"class" === e.name && (a = Qs(a).join(" ")), o["attr__" + e.name] = Al(1024, "href" === e.name && s ? xi(a) : a);
				}
			}));
			for (var l = 1, h = 1, u = t; u = Fl(u);) l++, u.tagName === t.tagName && h++;
			return o.nth_child = l, o.nth_of_type = h, o;
		}(t, o, a, l, u));
		rs(y, function(t) {
			if (!_n(t)) return {};
			var i = {};
			return es(t.attributes, (function(t) {
				if (t.name && 0 === t.name.indexOf("data-ph-capture-attribute")) {
					var e = t.name.replace("data-ph-capture-attribute-", ""), r = t.value;
					e && r && kn(r) && (i[e] = r);
				}
			})), i;
		}(t));
	})), w) return {
		props: {},
		explicitNoCapture: w
	};
	if (a || (m[0].$el_text = Gs(i, "a") || Gs(i, "button") ? Tn(i) : en(i)), b) {
		var x, E;
		m[0].attr__href = b;
		var S = null == (x = Hn(b)) ? void 0 : x.host, k = null == t || null == (E = t.location) ? void 0 : E.host;
		S && k && S !== k && (p = b);
	}
	return { props: rs({
		$event_type: n.type,
		$ce_version: 1
	}, h ? {} : { $elements: m }, { $elements_chain: (g = m, function(t) {
		return t.map(((t) => {
			var i, e, r = "";
			if (t.tag_name && (r += t.tag_name), t.attr_class) for (var s of (t.attr_class.sort(), t.attr_class)) r += "." + s.replace(/"/g, "");
			var n = _({}, t.text ? { text: t.text } : {}, {
				"nth-child": null !== (i = t.nth_child) && void 0 !== i ? i : 0,
				"nth-of-type": null !== (e = t.nth_of_type) && void 0 !== e ? e : 0
			}, t.href ? { href: t.href } : {}, t.attr_id ? { attr_id: t.attr_id } : {}, t.attributes), o = {};
			return ss(n).sort(((t, i) => {
				return (r = i[0]) > (e = t[0]) ? -1 : e > r ? 1 : 0;
				var e, r;
			})).forEach(((t) => {
				var i = t[1];
				return o[Pn(t[0].toString())] = Pn(i.toString());
			})), (r += ":") + ss(o).map(((t) => t[0] + "=\"" + t[1] + "\"")).join("");
		})).join(";");
	}(function(t) {
		return t.map(((t) => {
			var i, e, r = {
				text: null == (i = t.$el_text) ? void 0 : i.slice(0, 400),
				tag_name: t.tag_name,
				href: null == (e = t.attr__href) ? void 0 : e.slice(0, 2048),
				attr_class: Rn(t),
				attr_id: t.attr__id,
				nth_child: t.nth_child,
				nth_of_type: t.nth_of_type,
				attributes: {}
			};
			return ss(t).filter(((t) => 0 === t[0].indexOf("attr__"))).forEach(((t) => r.attributes[t[0]] = t[1])), r;
		}));
	}(g))) }, null != (r = m[0]) && r.$el_text ? { $el_text: null == (s = m[0]) ? void 0 : s.$el_text } : {}, p && "click" === n.type ? { $external_click_url: p } : {}, y) };
}
var Dl = class {
	constructor(t) {
		this.name = "autocapture", this.Ts = !1, this.Ms = null, this.Es = !1, this.Is = !1, this.vn = {
			enabled: !1,
			rageclick: !1,
			maskAllElementAttributes: !1,
			maskAllText: !1,
			disableCaptureUrlHashes: !1,
			remoteRequestsDisabled: !1
		}, this.Rs = !1, this.Ps = t, this.Ps.refresh(this.vn), this.rageclicks = new Cl(this.vn.rageclick), this.As = null;
	}
	setup(t) {
		this.Fs(), this.Os = t;
		var i = t.onRemoteConfig(this.onRemoteConfig.bind(this));
		this.Rs ? i.dispose() : (this.Ls = i, this.startIfEnabled());
	}
	dispose() {
		var t;
		this.Rs || (this.Rs = !0, this.Os = void 0, null == (t = this.Ls) || t.dispose(), this.Ls = void 0, this.Ds());
	}
	$s() {
		return this.Ps.refresh(this.vn), this.vn;
	}
	Fs() {
		var t, i;
		return this.$s(), this.vn.url_allowlist = null == (t = this.vn.url_allowlist) ? void 0 : t.map(((t) => new RegExp(t))), this.vn.url_ignorelist = null == (i = this.vn.url_ignorelist) ? void 0 : i.map(((t) => new RegExp(t))), this.vn;
	}
	Ns() {
		if (this.isBrowserSupported()) {
			if (t && r) {
				var i = this.qs = (i) => {
					i = i || (null == t ? void 0 : t.event);
					try {
						this.js(i);
					} catch (t) {
						Il.error("Failed to capture event", t);
					}
				};
				if (us(r, "submit", i, { capture: !0 }), us(r, "change", i, { capture: !0 }), us(r, "click", i, { capture: !0 }), this.$s().capture_copied_text) {
					var e = this.Bs = (i) => {
						i = i || (null == t ? void 0 : t.event);
						try {
							this.js(i, Ol);
						} catch (t) {
							Il.error("Failed to capture clipboard event", t);
						}
					};
					us(r, "copy", e, { capture: !0 }), us(r, "cut", e, { capture: !0 }), us(r, "paste", e, { capture: !0 });
				}
			}
		} else Il.info("Disabling Automatic Event Collection because this browser is not supported");
	}
	Ds() {
		this.qs && (r?.removeEventListener("submit", this.qs, !0), r?.removeEventListener("change", this.qs, !0), r?.removeEventListener("click", this.qs, !0), this.qs = void 0), this.Bs && (r?.removeEventListener("copy", this.Bs, !0), r?.removeEventListener("cut", this.Bs, !0), r?.removeEventListener("paste", this.Bs, !0), this.Bs = void 0), this.Ts = !1;
	}
	startIfEnabled() {
		!this.Rs && this.Os && this.isEnabled && !this.Ts && (this.Ns(), this.Ts = !0);
	}
	onRemoteConfig(t) {
		if (!this.Rs) if (this.Es = !0, t.ok) {
			var i = t.config;
			i.elementsChainAsString && (this.Is = i.elementsChainAsString);
			var e, r = i.autocapture_opt_out;
			it(r) && (null == (e = this.Os) || e.kv.set(Ve, r), this.Ms = r), this.startIfEnabled();
		} else this.startIfEnabled();
	}
	setElementSelectors(t) {
		this.As = t;
	}
	getElementSelectors(t) {
		var i, e = [];
		return null == (i = this.As) || i.forEach(((i) => {
			(null == r ? void 0 : r.querySelectorAll(i))?.forEach(((r) => {
				t === r && e.push(i);
			}));
		})), e;
	}
	get isEnabled() {
		var t, i;
		if (this.Rs) return !1;
		var e = null == (t = this.Os) ? void 0 : t.kv.get(Ve), r = this.Ms, s = this.$s(), n = s.remoteRequestsDisabled && !this.Es;
		if (Q(r) && !it(e) && !n) return !1;
		var o = null !== (i = this.Ms) && void 0 !== i ? i : !!e;
		return !!s.enabled && !o;
	}
	js(i, e) {
		if (void 0 === e && (e = "$autocapture"), this.isEnabled) {
			var r = rn(i);
			Ks(r) && (r = r.parentNode || null);
			var s, n = this.Fs();
			"$autocapture" === e && "click" === i.type && i instanceof MouseEvent && n.rageclick && null != (s = this.rageclicks) && s.isRageClick(i.clientX, i.clientY, i.timeStamp || (/* @__PURE__ */ new Date()).getTime()) && cn(r, n.rageclick) && this.js(i, "$rageclick");
			var o = e === Ol, a = o ? _({}, n, { dom_event_allowlist: void 0 }) : n;
			if (r && function(i, e, r, s, n, o) {
				var a;
				if (!t || fn(i)) return !1;
				if (null != r && r.url_allowlist && !Xs(r.url_allowlist, o)) return !1;
				if (null != r && r.url_ignorelist && Xs(r.url_ignorelist, o)) return !1;
				if (null != r && r.dom_event_allowlist) {
					var l = r.dom_event_allowlist;
					if (l && !l.some(((t) => e.type === t))) return !1;
				}
				var h = pn(i, s), u = h.parentIsUsefulElement, d = h.targetElementList;
				if (!function(t, i) {
					var e = null == i ? void 0 : i.element_allowlist;
					if (K(e)) return !0;
					var r, s = function(t) {
						if (e.some(((i) => t.tagName.toLowerCase() === i))) return { v: !0 };
					};
					for (var n of t) if (r = s(n)) return r.v;
					return !1;
				}(d, r)) return !1;
				if (!nn(d, null == r ? void 0 : r.css_selector_allowlist)) return !1;
				if (nn(d, null !== (a = null == r ? void 0 : r.css_selector_ignorelist) && void 0 !== a ? a : an)) return !1;
				try {
					var v = t.getComputedStyle(i);
					if (v && "pointer" === v.getPropertyValue("cursor") && "click" === e.type) return !0;
				} catch (t) {}
				var c = i.tagName.toLowerCase();
				switch (c) {
					case "html": return !1;
					case "form": return (n || ["submit"]).indexOf(e.type) >= 0;
					case "input":
					case "select":
					case "textarea": return (n || ["change", "click"]).indexOf(e.type) >= 0;
					default: return u ? (n || ["click"]).indexOf(e.type) >= 0 : (n || ["click"]).indexOf(e.type) >= 0 && (sn.indexOf(c) > -1 || "true" === i.getAttribute("contenteditable"));
				}
			}(r, i, a, o, o ? [
				"copy",
				"cut",
				"paste"
			] : void 0, { config: { get_current_url: n.getCurrentUrl } })) {
				var l, h = Ml(r, {
					e: i,
					maskAllElementAttributes: n.maskAllElementAttributes,
					maskAllText: n.maskAllText,
					elementAttributeIgnoreList: n.element_attribute_ignorelist,
					elementsChainAsString: this.Is,
					disableCaptureUrlHashes: n.disableCaptureUrlHashes
				}), u = h.props;
				if (h.explicitNoCapture) return !1;
				var d = this.getElementSelectors(r);
				if (d && d.length > 0 && (u.$element_selectors = d), e === Ol) {
					var v = i.type || "clipboard";
					if ("paste" !== v) {
						var c, f, p = null == t || null == (c = t.getSelection()) ? void 0 : c.toString(), g = tn(p);
						if (!g) return !1;
						u.$selected_content = g, u.$clipboard_text_length = null !== (f = null == p ? void 0 : p.length) && void 0 !== f ? f : 0;
					}
					u.$copy_type = v;
				}
				return null == (l = this.Os) || l.capture(e, u).catch(((t) => Il.error("Failed to capture event", t))), !0;
			}
		}
	}
	isBrowserSupported() {
		return V(null == r ? void 0 : r.querySelectorAll);
	}
};
var Nl = class {
	constructor(t) {
		this._instance = t;
	}
	refresh(t) {
		var i = this._instance.config, e = W(i.autocapture) ? i.autocapture : void 0;
		t.enabled = !!i.autocapture, t.rageclick = i.rageclick, t.maskAllElementAttributes = i.mask_all_element_attributes, t.maskAllText = i.mask_all_text, t.disableCaptureUrlHashes = i.disable_capture_url_hashes, t.getCurrentUrl = i.get_current_url, t.remoteRequestsDisabled = this._instance.Ua(), t.url_allowlist = null == e ? void 0 : e.url_allowlist, t.url_ignorelist = null == e ? void 0 : e.url_ignorelist, t.dom_event_allowlist = null == e ? void 0 : e.dom_event_allowlist, t.element_allowlist = null == e ? void 0 : e.element_allowlist, t.css_selector_allowlist = null == e ? void 0 : e.css_selector_allowlist, t.css_selector_ignorelist = null == e ? void 0 : e.css_selector_ignorelist, t.element_attribute_ignorelist = null == e ? void 0 : e.element_attribute_ignorelist, t.capture_copied_text = null == e ? void 0 : e.capture_copied_text;
	}
};
var Ll = Ae("[ExceptionAutocapture]");
var Ul = () => {};
var jl = (t) => {
	var i;
	if (V(t)) return null !== (i = t.__posthog_layer__) && void 0 !== i ? i : t.__rrweb_layer__;
};
function Bl(t, i, e) {
	try {
		if (!(i in t)) return Ul;
		var r = { next: t[i] }, s = e((function() {
			for (var t = arguments.length, i = new Array(t), e = 0; t > e; e++) i[e] = arguments[e];
			return r.next.apply(this, i);
		}));
		return V(s) && (s.prototype = s.prototype || {}, Object.defineProperties(s, {
			__posthog_wrapped__: {
				enumerable: !1,
				value: !0
			},
			__posthog_layer__: {
				enumerable: !1,
				value: r
			}
		})), t[i] = s, () => {
			if (t[i] !== s) for (var e = t[i], n = jl(e); n;) {
				if (n.next === s) return void (n.next = r.next);
				n = jl(e = n.next);
			}
			else t[i] = r.next;
		};
	} catch (t) {
		return Ul;
	}
}
var zl = Ae("[TracingHeaders]");
var ql = Ae("[Web Vitals]");
var Hl = 9e5;
var Vl = [
	"CLS",
	"FCP",
	"INP",
	"LCP"
];
var Wl = ["INP", "LCP"];
var Gl = [
	"interactionTarget",
	"interactionType",
	"inputDelay",
	"processingDuration",
	"presentationDelay",
	"loadState",
	"target",
	"url",
	"timeToFirstByte",
	"resourceLoadDelay",
	"resourceLoadDuration",
	"elementRenderDelay",
	"largestShiftTarget",
	"largestShiftTime",
	"largestShiftValue",
	"firstByteToFCP"
];
var Kl = "disabled";
var Jl = "lazy_loading";
var Yl = "awaiting_config";
var Ql = "missing_config";
Ae("[SessionRecording]"), Ae("[SessionRecording]");
var Xl = "[SessionRecording]";
var Zl = Ae(Xl);
var th = Ae("[Heatmaps]");
function ih(t) {
	return W(t) && "clientX" in t && "clientY" in t && Z(t.clientX) && Z(t.clientY);
}
var eh = Ae("[Product Tours]");
var rh = (t) => {
	var i;
	return !t.config.disable_product_tours && !(null == (i = t.persistence) || !i.get_property(Xe));
};
var sh = ["$set_once", "$set"];
var nh = Ae("[SiteApps]");
var oh = "Error while initializing PostHog app with config id ";
var ah = (t, i) => null != t && t.then ? t.then(i) : i(t);
var lh = "SDK is not enabled or survey functionality is not yet loaded";
var hh = "Disabled. Not loading surveys.";
var uh = class {
	constructor(t, i) {
		this.name = "surveys", this._surveyEventReceiver = null, this._surveyManager = null, this.Xl = !1, this.tu = [], this.eu = null, this.iu = null, this.Rs = !1, this.ru = /* @__PURE__ */ new Set(), this.onRemoteConfig = (t) => {
			if (!this.Rs && !this.vn.disableSurveys) {
				if (!t.ok) return el.warn("Remote config unavailable. Not loading surveys.");
				var i = t.config.surveys;
				if (X(i)) return el.warn("Flags not loaded yet. Not loading surveys.");
				this.nu = it(i) ? i : i.length > 0, el.info("flags response received, isSurveysEnabled: " + this.nu), this.loadIfEnabled();
			}
		}, this.Ps = t, this.su = i;
	}
	setup(t) {
		if (!this.Rs) return this.au = t, ah(t.kv.initialize(), (() => {
			if (this.au === t && !this.Rs) {
				this.au = void 0, this.Os = t;
				var i = t.onRemoteConfig(this.onRemoteConfig);
				this.Rs ? i.dispose() : (this.Ls = i, this.loadIfEnabled());
			}
		}));
	}
	dispose() {
		var t, i, e;
		this.Rs || (this.Rs = !0, this.au = void 0, this.Os = void 0, null == (t = this.Ls) || t.dispose(), this.Ls = void 0, null == (i = this._surveyEventReceiver) || i.dispose(), this._surveyEventReceiver = null, null == (e = this._surveyManager) || null == e.dispose || e.dispose(), this._surveyManager = null, this.tu = [], this.eu = null, this.ru.forEach(((t) => clearTimeout(t))), this.ru.clear());
	}
	get vn() {
		return this.Ps.get();
	}
	initialize() {
		this.loadIfEnabled();
	}
	reset() {
		try {
			var t;
			null == (t = this._surveyEventReceiver) || t.reset(), localStorage.removeItem("lastSeenSurveyDate");
			for (var i = [], e = 0; e < localStorage.length; e++) {
				var r = localStorage.key(e);
				(null != r && r.startsWith(rl) || null != r && r.startsWith("inProgressSurvey_")) && i.push(r);
			}
			i.forEach(((t) => localStorage.removeItem(t)));
		} catch (t) {}
	}
	loadIfEnabled() {
		if (!this.Rs && this.Os) {
			var t = this.vn;
			if (!this._surveyManager) if (this.Xl) el.info("Already initializing surveys, skipping...");
			else if (t.disableSurveys) el.info(hh);
			else if (t.cookielessMode && this.Ps.isOptedOut()) el.info("Not loading surveys in cookieless mode without consent.");
			else {
				var i = this.Ps.getExtensions();
				if (i) {
					if (!K(this.nu) || t.advancedEnableSurveys) {
						var e = this.nu || t.advancedEnableSurveys;
						this.Xl = !0;
						try {
							var r = i.generateSurveys;
							if (r) return this.ou(r, e), void (this.Xl = !1);
							var s = i.loadExternalDependency;
							if (!s) return this.lu(qr), void (this.Xl = !1);
							s(((t) => {
								try {
									if (this.Rs) return;
									var i = this.Ps.getExtensions();
									t || null == i || !i.generateSurveys ? this.lu("Could not load surveys script", t) : this.ou(i.generateSurveys, e);
								} finally {
									this.Xl = !1;
								}
							}));
						} catch (t) {
							throw this.Xl = !1, this.lu("Error initializing surveys", t), t;
						}
					}
				} else el.error("PostHog Extensions not found.");
			}
		}
	}
	ou(t, i) {
		this.Rs || (this._surveyManager = t(i), this._surveyEventReceiver = this.Ps.createEventReceiver(), el.info("Surveys loaded successfully"), this.uu({ isLoaded: !0 }));
	}
	lu(t, i) {
		el.error(t, i), this.uu({
			isLoaded: !1,
			error: t
		});
	}
	onSurveysLoaded(t) {
		return this.tu.push(t), this._surveyManager && this.uu({ isLoaded: !0 }), () => {
			this.tu = this.tu.filter(((i) => i !== t));
		};
	}
	getSurveys(t, i) {
		var e;
		void 0 === i && (i = !1);
		var r = null !== (e = this.Os) && void 0 !== e ? e : this.su;
		if (r && !this.Rs) {
			if (this.vn.disableSurveys) return el.info(hh), t([]);
			var s = r.kv.get(wr);
			if (s && !i) return t(s, { isLoaded: !0 }), void (this.hu() && this.getSurveys((() => {}), !0));
			if (this.eu) this.eu.then(((i) => {
				this.Rs || t(i.surveys, i.context);
			})).catch(((t) => el.error("Error in survey callback", t)));
			else {
				var n = this.du("/api/surveys/", {
					method: "GET",
					query: { token: r.projectToken },
					sentAt: "query",
					timeoutMs: this.vn.requestTimeoutMs
				}).then(((t) => {
					try {
						return this.vu(r, t);
					} catch (t) {
						return el.error("Error processing surveys response", t), this.vu(r, {
							statusCode: 0,
							error: t
						});
					}
				}), ((t) => this.vu(r, {
					statusCode: 0,
					error: t
				})));
				this.eu = n;
				var o = () => {
					this.eu === n && (this.eu = null);
				};
				n.then(((i) => {
					o(), this.Rs || t(i.surveys, i.context);
				}), o).catch(((t) => el.error("Error in survey callback", t)));
			}
		}
	}
	du(t, i) {
		var e = this.Os;
		return e ? e.sendRequest(t, i) : new Promise(((t) => t({
			statusCode: 0,
			error: new Error(lh)
		})));
	}
	vu(t, i) {
		if (this.Rs) return {
			surveys: [],
			context: {
				isLoaded: !1,
				error: lh
			}
		};
		var e = i.statusCode;
		if (200 !== e || !i.json) {
			var r = "Surveys API could not be loaded, status: " + e;
			return 0 !== e ? el.error(r) : i.error || el.warn(r), this.iu = Date.now(), {
				surveys: [],
				context: {
					isLoaded: !1,
					error: r
				}
			};
		}
		this.iu = null;
		var s, n = i.json.surveys || [], o = n.filter(((t) => function(t) {
			return !(!t.start_date || t.end_date);
		}(t) && (Va(t) || function(t) {
			var i;
			return !(null == (i = t.conditions) || null == (i = i.actions) || null == (i = i.values) || !i.length);
		}(t))));
		return o.length > 0 && (null == (s = this._surveyEventReceiver) || s.register(o)), t.kv.set({
			[wr]: n,
			[xr]: Date.now()
		}), {
			surveys: n,
			context: { isLoaded: !0 }
		};
	}
	hu() {
		return this.cu() && !this.eu && !this.fu();
	}
	cu() {
		var t, i, e = null == (t = null !== (i = this.Os) && void 0 !== i ? i : this.su) ? void 0 : t.kv.get(xr);
		return Z(e) && Date.now() - e > 3e5;
	}
	fu() {
		return Z(this.iu) && 3e5 > Date.now() - this.iu;
	}
	markSurveyAsSeen(t, i) {
		var e;
		sl({
			id: t,
			current_iteration: null !== (e = null == i ? void 0 : i.iteration) && void 0 !== e ? e : null
		});
		try {
			localStorage.setItem("lastSeenSurveyDate", (/* @__PURE__ */ new Date()).toISOString());
		} catch (t) {}
	}
	uu(t) {
		for (var i of this.tu) try {
			if (!t.isLoaded) return i([], t);
			this.getSurveys(i);
		} catch (t) {
			el.error("Error in survey callback", t);
		}
	}
	getActiveMatchingSurveys(t, i) {
		if (void 0 === i && (i = !1), !X(this._surveyManager)) return this._surveyManager.getActiveMatchingSurveys(t, i);
		el.warn("init was not called");
	}
	pu(t) {
		var i = null;
		return this.getSurveys(((e) => {
			var r;
			i = null !== (r = e.find(((i) => i.id === t))) && void 0 !== r ? r : null;
		})), i;
	}
	gu(t) {
		if (X(this._surveyManager)) return {
			eligible: !1,
			reason: lh
		};
		var i = "string" == typeof t ? this.pu(t) : t;
		return i ? this._surveyManager.checkSurveyEligibility(i) : {
			eligible: !1,
			reason: "Survey not found"
		};
	}
	mu(t) {
		if (X(this._surveyManager)) return {
			eligible: !1,
			reason: lh
		};
		var i = "string" == typeof t ? this.pu(t) : t;
		return i ? this._surveyManager.checkSurveyRenderability(i) : {
			eligible: !1,
			reason: "Survey not found"
		};
	}
	canRenderSurvey(t) {
		if (X(this._surveyManager)) return el.warn("init was not called"), {
			visible: !1,
			disabledReason: lh
		};
		var i = this.mu(t);
		return {
			visible: i.eligible,
			disabledReason: i.reason
		};
	}
	canRenderSurveyAsync(t, i) {
		return X(this._surveyManager) ? (el.warn("init was not called"), Promise.resolve({
			visible: !1,
			disabledReason: lh
		})) : new Promise(((e) => {
			this.getSurveys(((i) => {
				var r, s = null !== (r = i.find(((i) => i.id === t))) && void 0 !== r ? r : null;
				if (s) {
					var n = this.mu(s);
					e({
						visible: n.eligible,
						disabledReason: n.reason
					});
				} else e({
					visible: !1,
					disabledReason: "Survey not found"
				});
			}), i);
		}));
	}
	renderSurvey(t, i, e) {
		var s;
		if (X(this._surveyManager)) el.warn("init was not called");
		else {
			var n = "string" == typeof t ? this.pu(t) : t;
			if (null != n && n.id) if (nl.includes(n.type)) {
				var o = null == r ? void 0 : r.querySelector(i);
				if (o) if (null != (s = n.appearance) && s.surveyPopupDelaySeconds) {
					el.info("Rendering survey " + n.id + " with delay of " + n.appearance.surveyPopupDelaySeconds + " seconds");
					var a = setTimeout((() => {
						var t, i;
						this.ru.delete(a), this.Rs || (el.info("Rendering survey " + n.id + " with delay of " + (null == (t = n.appearance) ? void 0 : t.surveyPopupDelaySeconds) + " seconds"), null == (i = this._surveyManager) || i.renderSurvey(n, o, e), el.info("Survey " + n.id + " rendered"));
					}), 1e3 * n.appearance.surveyPopupDelaySeconds);
					this.ru.add(a);
				} else this._surveyManager.renderSurvey(n, o, e);
				else el.warn("Survey element not found");
			} else el.warn("Surveys of type " + n.type + " cannot be rendered in the app");
			else el.warn("Survey not found");
		}
	}
	displaySurvey(t, i) {
		var e;
		if (X(this._surveyManager)) el.warn("init was not called");
		else {
			var r = this.pu(t);
			if (r) {
				var s = r;
				if (null != (e = r.appearance) && e.surveyPopupDelaySeconds && i.ignoreDelay && (s = _({}, r, { appearance: _({}, r.appearance, { surveyPopupDelaySeconds: 0 }) })), i.displayType !== Co.Popover && i.initialResponses && el.warn("initialResponses is only supported for popover surveys. prefill will not be applied."), !1 === i.ignoreConditions) {
					var n = this.gu(r);
					if (!n.eligible) return void el.warn("Survey is not eligible to be displayed: ", n.reason);
				}
				i.displayType !== Co.Inline ? this._surveyManager.handlePopoverSurvey(s, i) : this.renderSurvey(s, i.selector, i.properties);
			} else el.warn("Survey not found");
		}
	}
	cancelPendingSurvey(t) {
		X(this._surveyManager) ? el.warn("init was not called") : this._surveyManager.cancelSurvey(t);
	}
	handlePageUnload() {
		var t;
		null == (t = this._surveyManager) || null == t.handlePageUnload || t.handlePageUnload();
	}
};
function dh(t, i, e) {
	if (X(t)) return !1;
	switch (e) {
		case "exact": return t === i;
		case "contains":
			var r = i.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/_/g, ".").replace(/%/g, ".*");
			return new RegExp(r, "i").test(t);
		case "regex": try {
			return new RegExp(i).test(t);
		} catch (t) {
			return !1;
		}
		default: return !1;
	}
}
var vh = class {
	constructor(t) {
		this.yu = /* @__PURE__ */ new Set(), this.bu = /* @__PURE__ */ new Set(), this._u = new Ua(), this.wu = (t, i) => this.ku(t, i) && this.Su(t, i) && this.xu(t, i) && this.Cu(t, i), this.ku = (t, i) => null == i || !i.event || (null == t ? void 0 : t.event) === (null == i ? void 0 : i.event), this._instance = t;
	}
	init() {
		var t, i;
		K(null == (t = this._instance) ? void 0 : t._addCaptureHook) || (this.Tu = null == (i = this._instance) ? void 0 : i._addCaptureHook(((t, i) => {
			this.on(t, i);
		})));
	}
	dispose() {
		var t;
		null == (t = this.Tu) || t.call(this), this.Tu = void 0, this._u = new Ua();
	}
	register(t) {
		var i, e;
		if (!K(null == (i = this._instance) ? void 0 : i._addCaptureHook) && (t.forEach(((t) => {
			var i;
			this.yu.add(t), null == (i = t.steps) || i.forEach(((t) => {
				this.bu.add((null == t ? void 0 : t.event) || "");
			}));
		})), null != (e = this._instance) && e.autocapture)) {
			var r = /* @__PURE__ */ new Set();
			this.yu.forEach(((t) => {
				var i;
				null == (i = t.steps) || i.forEach(((t) => {
					null != t && t.selector && r.add(t.selector);
				}));
			})), this._instance.autocapture.setElementSelectors(r);
		}
	}
	replace(t) {
		this.yu.clear(), this.bu.clear(), this.register(t);
	}
	on(t, i) {
		null != i && 0 != t.length && (this.bu.has(t) || this.bu.has(i.event)) && this.yu.forEach(((t) => {
			this.Mu(i, t) && this._u.emit("actionCaptured", t.name);
		}));
	}
	Eu(t) {
		this.onAction("actionCaptured", ((i) => t(i)));
	}
	Mu(t, i) {
		if (null == (null == i ? void 0 : i.steps)) return !1;
		for (var e of i.steps) if (this.wu(t, e)) return !0;
		return !1;
	}
	onAction(t, i) {
		return this._u.on(t, i);
	}
	Su(t, i) {
		if (null != i && i.url) {
			var e, r = null == t || null == (e = t.properties) ? void 0 : e.$current_url;
			if (!r || "string" != typeof r) return !1;
			if (!dh(r, i.url, i.url_matching || "contains")) return !1;
		}
		return !0;
	}
	xu(t, i) {
		return !!this.Iu(t, i) && !!this.Ru(t, i) && !!this.Pu(t, i);
	}
	Iu(t, i) {
		var e;
		if (null == i || !i.href) return !0;
		var r = this.Au(t);
		if (r.length > 0) return r.some(((t) => dh(t.href, i.href, i.href_matching || "exact")));
		var s, n = (null == t || null == (e = t.properties) ? void 0 : e.$elements_chain) || "";
		return !!n && dh((s = n.match(/(?::|")href="(.*?)"/)) ? s[1] : "", i.href, i.href_matching || "exact");
	}
	Ru(t, i) {
		var e;
		if (null == i || !i.text) return !0;
		var r = this.Au(t);
		if (r.length > 0) return r.some(((t) => dh(t.text, i.text, i.text_matching || "exact") || dh(t.$el_text, i.text, i.text_matching || "exact")));
		var s, n, o, a = (null == t || null == (e = t.properties) ? void 0 : e.$elements_chain) || "";
		return !!a && (s = function(t) {
			for (var i, e = [], r = /(?::|")text="(.*?)"/g; !X(i = r.exec(t));) e.includes(i[1]) || e.push(i[1]);
			return e;
		}(a), n = i.text, o = i.text_matching || "exact", s.some(((t) => dh(t, n, o))));
	}
	Pu(t, i) {
		var e, r;
		if (null == i || !i.selector) return !0;
		var s = null == t || null == (e = t.properties) ? void 0 : e.$element_selectors;
		if (null != s && s.includes(i.selector)) return !0;
		var n = (null == t || null == (r = t.properties) ? void 0 : r.$elements_chain) || "";
		if (i.selector_regex && n) try {
			return new RegExp(i.selector_regex).test(n);
		} catch (t) {
			return !1;
		}
		return !1;
	}
	Au(t) {
		var i;
		return null == (null == t || null == (i = t.properties) ? void 0 : i.$elements) ? [] : null == t ? void 0 : t.properties.$elements;
	}
	Cu(t, i) {
		return null == i || !i.properties || 0 === i.properties.length || Ja(i.properties.reduce(((t, i) => {
			return t[i.key] = {
				values: H(i.value) ? i.value.map(String) : null != i.value ? [String(i.value)] : [],
				operator: i.operator || "exact"
			}, t;
		}), {}), null == t ? void 0 : t.properties);
	}
};
var ch = class {
	constructor(t) {
		var i;
		this.Fu = [], this._instance = t, this.Ou = /* @__PURE__ */ new Map(), this.Lu = /* @__PURE__ */ new Map(), this.Du = /* @__PURE__ */ new Map(), this.$u = null == (i = this._instance) || null == i.onSessionId ? void 0 : i.onSessionId(((t) => this.Nu(t)));
	}
	qu(t) {
		return !1;
	}
	ju() {
		return null;
	}
	Bu(t) {}
	Hu() {}
	zu(t, i) {
		return !!t && Ja(t.propertyFilters, null == i ? void 0 : i.properties);
	}
	Uu(t, i) {
		var e = /* @__PURE__ */ new Map();
		return t.forEach(((t) => {
			var r;
			null == (r = t.conditions) || null == (r = r[i]) || null == (r = r.values) || r.forEach(((i) => {
				if (null != i && i.name) {
					var r = e.get(i.name) || [];
					r.push(t.id), e.set(i.name, r);
				}
			}));
		})), e;
	}
	Wu(t, i, e) {
		var r = (e === bo.Activation ? this.Ou : this.Lu).get(t), s = [];
		return this.Vu(((t) => {
			s = t.filter(((t) => null == r ? void 0 : r.includes(t.id)));
		})), s.filter(((r) => {
			var s, n = null == (s = r.conditions) || null == (s = s[e]) || null == (s = s.values) ? void 0 : s.find(((i) => i.name === t));
			return this.zu(n, i);
		}));
	}
	register(t) {
		this.Gu(t, !1);
	}
	replace(t) {
		this.Gu(t, !0);
	}
	Gu(t, i) {
		var e;
		K(null == (e = this._instance) ? void 0 : e._addCaptureHook) || (this.Zu(t, i), this.Qu(t, i));
	}
	Qu(t, i) {
		var e = t.filter(((t) => {
			var i;
			return null == (i = t.conditions) || null == (i = i.actions) || null == (i = i.values) ? void 0 : i.length;
		}));
		if (i && this.Du.clear(), 0 !== e.length) {
			this.Ju || (this.Ju = new vh(this._instance), this.Ju.init(), this.Ju.Eu(((t) => this.onAction(t))));
			var r = [];
			e.forEach(((t) => {
				var i;
				null == (i = t.conditions) || null == (i = i.actions) || i.values.forEach(((i) => {
					if (r.push(i), i.name) {
						var e, s = null !== (e = this.Du.get(i.name)) && void 0 !== e ? e : [];
						s.includes(t.id) || s.push(t.id), this.Du.set(i.name, s);
					}
				}));
			})), i ? this.Ju.replace(r) : this.Ju.register(r);
		} else {
			var s;
			i && (null == (s = this.Ju) || s.replace([]));
		}
	}
	Ku(t, i) {
		i.forEach(((i, e) => {
			var r, s = null !== (r = t.get(e)) && void 0 !== r ? r : [];
			i.forEach(((t) => {
				s.includes(t) || s.push(t);
			})), t.set(e, s);
		}));
	}
	Zu(t, i) {
		var e, r, s = t.filter(((t) => {
			var i, e;
			return (null == (i = t.conditions) ? void 0 : i.events) && (null == (e = t.conditions) || null == (e = e.events) || null == (e = e.values) ? void 0 : e.length) > 0;
		})), n = t.filter(((t) => {
			var i, e;
			return (null == (i = t.conditions) ? void 0 : i.cancelEvents) && (null == (e = t.conditions) || null == (e = e.cancelEvents) || null == (e = e.values) ? void 0 : e.length) > 0;
		})), o = this.Uu(t, bo.Activation), a = this.Uu(t, bo.Cancellation);
		i ? (this.Ou = o, this.Lu = a) : (this.Ku(this.Ou, o), this.Ku(this.Lu, a)), (0 !== s.length || 0 !== n.length) && (null !== (e = this.Tu) && void 0 !== e || (this.Tu = null == (r = this._instance) ? void 0 : r._addCaptureHook(((t, i) => {
			this.onEvent(t, i);
		}))));
	}
	onEvent(t, i) {
		var e, r, s = this.Yu(), n = (null == i || null == (e = i.properties) ? void 0 : e.$survey_id) || (null == i || null == (r = i.properties) ? void 0 : r.$product_tour_id);
		if (n && this.getActivatedIds().includes(n)) {
			var o = this.Xu(t, n);
			if ("consume" === o) return s.info("event consumed activated item, removing it", {
				event: t,
				itemId: n
			}), void this.th([n]);
			if ("persist" === o) return s.info("shown item promoted to persisted activation", {
				event: t,
				itemId: n
			}), this.eh(n), void this.ih([n]);
		}
		if (this.Lu.has(t)) {
			var a = this.Wu(t, i, bo.Cancellation);
			a.length > 0 && (s.info("cancel event matched, cancelling items", {
				event: t,
				itemsToCancel: a.map(((t) => t.id))
			}), this.th(a.map(((t) => t.id))), a.forEach(((t) => this.rh(t.id))));
		}
		if (this.Ou.has(t)) {
			s.info("event name matched", {
				event: t,
				eventPayload: i,
				items: this.Ou.get(t)
			});
			var l = this.Wu(t, i, bo.Activation);
			this.nh(l.map(((t) => t.id)));
		}
	}
	onAction(t) {
		this.Du.has(t) && this.nh(this.Du.get(t) || []);
	}
	nh(t) {
		var i;
		if (0 !== t.length) {
			var e = !(null == (i = this._instance) || null == i.get_session_id || !i.get_session_id()), r = [];
			for (var s of t) e && this.qu(s) ? this.eh(s) && this.sh(s) : r.push(s);
			r.length > 0 && (this.Fu = [.../* @__PURE__ */ new Set([...this.Fu, ...r])]), this.Yu().info("updating activated items", { activatedItems: this.getActivatedIds() });
		}
	}
	eh(t) {
		this.Fu = this.Fu.filter(((i) => i !== t));
		var i = this.ah();
		return !i.includes(t) && (this.oh([...i, t]), this.lh(), !0);
	}
	th(t) {
		var i = new Set(t);
		this.Fu = this.Fu.filter(((t) => !i.has(t)));
		var e = this.uh(), r = e.filter(((t) => !i.has(t)));
		r.length !== e.length && (this.oh(r), 0 === r.length && this.hh()), this.ih(t);
	}
	dh() {
		var t, i = this.ju();
		if (!i) return {};
		var e = null == (t = this._instance) || null == (t = t.persistence) ? void 0 : t.props[i];
		return e && "object" == typeof e ? e : {};
	}
	sh(t) {
		if (this.ju()) {
			var i = this.dh();
			this.Bu(_({}, i, { [t]: Date.now() }));
		}
	}
	ih(t) {
		if (this.ju()) {
			var i = this.dh(), e = {}, r = !1;
			for (var s of Object.entries(i)) {
				var n = s[0], o = s[1];
				t.includes(n) ? r = !0 : e[n] = o;
			}
			r && (G(e) ? this.Hu() : this.Bu(e));
		}
	}
	fh() {
		this.ju() && this.Hu();
	}
	getActivationTimestamp(t) {
		if (this.ah().includes(t)) {
			var i = this.dh()[t];
			return Z(i) ? i : void 0;
		}
	}
	uh() {
		var t, i = this.ph();
		return (null == (t = this._instance) || null == (t = t.persistence) ? void 0 : t.props[i]) || [];
	}
	ah() {
		var t, i, e = this.uh();
		if (0 === e.length) return [];
		var r = null == (t = this._instance) || null == (t = t.persistence) ? void 0 : t.props[this.gh()], s = null == (i = this._instance) || null == i.get_session_id ? void 0 : i.get_session_id();
		return s && r === s ? e : [];
	}
	lh() {
		var t, i = null == (t = this._instance) || null == t.get_session_id ? void 0 : t.get_session_id();
		i && this.mh(i);
	}
	hh() {
		this.yh();
	}
	Nu(t) {
		var i, e = null == (i = this._instance) || null == (i = i.persistence) ? void 0 : i.props[this.gh()];
		if (e && e !== t) {
			var r = this.uh(), s = this.dh();
			r.length > 0 && (this.oh([]), r.filter(((t) => Z(s[t]))).forEach(((t) => this.rh(t)))), this.hh(), this.fh();
		}
	}
	getActivatedIds() {
		return [.../* @__PURE__ */ new Set([...this.ah(), ...this.Fu])].filter(((t) => !this.bh(t)));
	}
	dispose() {
		var t, i, e;
		null == (t = this.$u) || t.call(this), this.$u = void 0, null == (i = this.Tu) || i.call(this), this.Tu = void 0, null == (e = this.Ju) || e.dispose(), this.Ju = void 0;
	}
	reset() {
		this.Fu = [], this.uh().length > 0 && this.oh([]), this.hh(), this.fh();
	}
	getEventToItemsMap() {
		return this.Ou;
	}
	_h() {
		return this.Ju;
	}
};
var fh = class extends ch {
	constructor(t) {
		super(t);
	}
	ph() {
		return Er;
	}
	gh() {
		return Sr;
	}
	ju() {
		return kr;
	}
	Bu(t) {
		var i;
		null == (i = this._instance) || null == (i = i.persistence) || i.register({ [kr]: t });
	}
	Hu() {
		var t;
		null == (t = this._instance) || null == (t = t.persistence) || t.unregister(kr);
	}
	qu(t) {
		var i, e;
		this.Vu(((i) => {
			e = i.find(((i) => i.id === t));
		}));
		var r = null == (i = e) || null == (i = i.appearance) ? void 0 : i.surveyPopupDelaySeconds;
		return Z(r) && r > 0;
	}
	wh() {
		return Po.SHOWN;
	}
	Vu(t) {
		var i;
		null == (i = this._instance) || i.getSurveys(t);
	}
	rh(t) {
		var i;
		null == (i = this._instance) || i.cancelPendingSurvey(t);
	}
	Yu() {
		return el;
	}
	oh(t) {
		var i;
		null == (i = this._instance) || null == (i = i.persistence) || i.register({ [Er]: t });
	}
	mh(t) {
		var i;
		null == (i = this._instance) || null == (i = i.persistence) || i.register({ [Sr]: t });
	}
	yh() {
		var t;
		null == (t = this._instance) || null == (t = t.persistence) || t.unregister(Sr);
	}
	bh() {
		return !1;
	}
	Xu(t, i) {
		var e;
		this.Vu(((t) => {
			e = t.find(((t) => t.id === i));
		}));
		return !e || function(t) {
			var i;
			return Va(t) && !(null == (i = t.conditions) || null == (i = i.events) || !i.repeatedActivation) || "always" === t.schedule;
		}(e) ? t === Po.SHOWN ? "consume" : "ignore" : t === Po.SHOWN ? "persist" : t === Po.DISMISSED || t === Po.SENT ? "consume" : "ignore";
	}
	getSurveys() {
		return this.getActivatedIds();
	}
	getEventToSurveys() {
		return this.getEventToItemsMap();
	}
};
var ph = class {
	constructor(t) {
		this._instance = t;
	}
	initialize() {}
	get(t) {
		if ("string" == typeof t) return this._instance.get_property(t);
		var i = {};
		for (var e of t) {
			var r = this._instance.get_property(e);
			K(r) || (i[e] = r);
		}
		return i;
	}
	set(t, i) {
		this._instance.register("string" == typeof t ? { [t]: i } : t);
	}
	remove(t) {
		"string" != typeof t ? t.forEach(((t) => this._instance.unregister(t))) : this._instance.unregister(t);
	}
};
var _h = class {
	constructor(t) {
		this._instance = t;
	}
	get() {
		var t = this._instance.config;
		return {
			disableSurveys: t.disable_surveys,
			cookielessMode: !!t.cookieless_mode,
			advancedEnableSurveys: t.advanced_enable_surveys,
			requestTimeoutMs: t.surveys_request_timeout_ms
		};
	}
	isOptedOut() {
		return this._instance.consent.isOptedOut();
	}
	getExtensions() {
		var t = null == v ? void 0 : v.__PosthogExtensions__;
		if (t) {
			var i = t.generateSurveys, e = t.loadExternalDependency;
			return {
				generateSurveys: i ? (t) => i(this._instance, t) : void 0,
				loadExternalDependency: e ? (t) => e(this._instance, "surveys", t) : void 0
			};
		}
	}
	createEventReceiver() {
		return new fh(this._instance);
	}
};
var gh = null != t && t.location ? Gn(t.location.hash, "__posthog") || Gn(location.hash, "state") : null;
var mh = "_postHogToolbarParams";
var yh = Ae("[Toolbar]");
var bh = Ae("[FeatureFlags]");
var wh = class {
	constructor(t, i) {
		void 0 === i && (i = !1), this.kh = !1, this.update(t, i);
	}
	update(t, i) {
		this.Sh = ((t, i) => {
			var e, r, s, n, o;
			return {
				bootstrap: {
					featureFlags: null == (e = t.bootstrap) ? void 0 : e.featureFlags,
					featureFlagPayloads: null == (r = t.bootstrap) ? void 0 : r.featureFlagPayloads
				},
				remoteRequestsDisabled: i,
				featureFlagsDisabled: !!t.advanced_disable_feature_flags,
				onlyEvaluateSurveyFeatureFlags: !!t.advanced_only_evaluate_survey_feature_flags,
				deduplicateCallsPerSession: !!t.advanced_feature_flags_dedup_per_session,
				cacheTtlMs: t.feature_flag_cache_ttl_ms,
				refreshIntervalMs: null !== (s = t.remote_config_refresh_interval_ms) && void 0 !== s ? s : 3e5,
				requestTimeoutMs: t.feature_flag_request_timeout_ms,
				compression: t.disable_compression ? void 0 : "best-available",
				evaluationContexts: null !== (n = null !== (o = t.evaluation_contexts) && void 0 !== o ? o : t.evaluation_environments) && void 0 !== n ? n : [],
				flagKeys: H(t.flag_keys) ? t.flag_keys : void 0
			};
		})(t, i), !t.evaluation_environments || t.evaluation_contexts || this.kh || (bh.warn("evaluation_environments is deprecated. Use evaluation_contexts instead. evaluation_environments will be removed in a future version."), this.kh = !0), K(t.flag_keys) || H(t.flag_keys) || bh.error("Invalid flag_keys found:", t.flag_keys, "Expected array of non-empty strings");
	}
	get() {
		return this.Sh;
	}
};
var xh = Ae("[FeatureFlags]");
var Eh = Ae("[FeatureFlags]", { debugEnabled: !0 });
var Sh = "\" failed. Feature flags didn't load in time.";
var kh = "connection_error";
var Th = (t) => {
	for (var i = {}, e = 0; t.length > e; e++) i[t[e]] = !0;
	return i;
};
var $h = (t) => {
	var i = {};
	for (var e of ss(t || {})) {
		var r = e[1];
		r && (i[e[0]] = r);
	}
	return i;
};
var Ph = Ae("[Error tracking]");
var Rh = [
	"chrome-extension://",
	"moz-extension://",
	"safari-extension:",
	"safari-web-extension:"
];
var Ch = ["__firefox__", "__gCrWeb"];
var Oh = "Refusing to render web experiment since the viewer is a likely bot";
var Ih = {
	icontains: (t, i) => i.toLowerCase().indexOf(t.toLowerCase()) > -1,
	not_icontains: (t, i) => -1 === i.toLowerCase().indexOf(t.toLowerCase()),
	regex: (t, i) => Wa(i, t),
	not_regex: (t, i) => !Wa(i, t),
	exact: (t, i) => i === t,
	is_not: (t, i) => i !== t
};
var Ah = class Ah {
	get vn() {
		return this._instance.config;
	}
	constructor(t) {
		var i = this;
		this.getWebExperimentsAndEvaluateDisplayLogic = function(t) {
			void 0 === t && (t = !1), i.getWebExperiments(((t) => {
				Ah.xh("retrieved web experiments from the server"), i.Ch = /* @__PURE__ */ new Map(), t.forEach(((t) => {
					if (t.feature_flag_key) {
						var e;
						i.Ch && (Ah.xh("setting flag key ", t.feature_flag_key, " to web experiment ", t), null == (e = i.Ch) || e.set(t.feature_flag_key, t));
						var r = i._instance.getFeatureFlag(t.feature_flag_key);
						J(r) && t.variants[r] && i.Th(t.name, r, t.variants[r].transforms);
					} else if (t.variants) for (var s in t.variants) {
						var n = t.variants[s];
						Ah.Mh(n, i._instance) && i.Th(t.name, s, n.transforms);
					}
				}));
			}), t);
		}, this._instance = t, this._instance.onFeatureFlags(((t) => {
			this.onFeatureFlags(t);
		}));
	}
	initialize() {}
	onFeatureFlags(t) {
		if (this._is_bot()) Ah.xh(Oh);
		else if (!this.vn.disable_web_experiments) {
			if (X(this.Ch)) return this.Ch = /* @__PURE__ */ new Map(), this.loadIfEnabled(), void this.previewWebExperiment();
			Ah.xh("applying feature flags", t), t.forEach(((t) => {
				var i;
				if (this.Ch && null != (i = this.Ch) && i.has(t)) {
					var e, r = this._instance.getFeatureFlag(t), s = null == (e = this.Ch) ? void 0 : e.get(t);
					r && null != s && s.variants[r] && this.Th(s.name, r, s.variants[r].transforms);
				}
			}));
		}
	}
	previewWebExperiment() {
		var t = Ah.getWindowLocation();
		if (null != t && t.search) {
			var i = Vn(null == t ? void 0 : t.search, "__experiment_id"), e = Vn(null == t ? void 0 : t.search, "__experiment_variant");
			i && e && (Ah.xh("previewing web experiments " + i + " && " + e), this.getWebExperiments(((t) => {
				this.Eh(parseInt(i), e, t);
			}), !1, !0));
		}
	}
	loadIfEnabled() {
		this.vn.disable_web_experiments || this.getWebExperimentsAndEvaluateDisplayLogic();
	}
	getWebExperiments(t, i, e) {
		if (this.vn.disable_web_experiments && !e) return t([]);
		var r = this._instance.get_property("$web_experiments");
		if (r && !i) return t(r);
		this._instance._send_request({
			url: this._instance.requestRouter.endpointFor("api", "/api/web_experiments/?token=" + this.vn.token),
			method: "GET",
			timestampMode: "query",
			callback: (i) => t(200 === i.statusCode && i.json && i.json.experiments || [])
		});
	}
	Eh(t, i, e) {
		var r = e.filter(((i) => i.id === t));
		r && r.length > 0 && (Ah.xh("Previewing web experiment [" + r[0].name + "] with variant [" + i + "]"), this.Th(r[0].name, i, r[0].variants[i].transforms));
	}
	static Mh(t, i) {
		return !X(t.conditions) && Ah.Ih(t, i) && Ah.Rh(t);
	}
	static Ih(t, i) {
		var e;
		if (X(t.conditions) || X(null == (e = t.conditions) ? void 0 : e.url)) return !0;
		var r = Ah.getWindowLocation();
		if (r) {
			var s, n, o, a = js(i, r.href);
			return null == (s = t.conditions) || !s.url || Ih[null !== (n = null == (o = t.conditions) ? void 0 : o.urlMatchType) && void 0 !== n ? n : "icontains"](t.conditions.url, a);
		}
		return !1;
	}
	static getWindowLocation() {
		return null == t ? void 0 : t.location;
	}
	static Rh(t) {
		var i;
		if (X(t.conditions) || X(null == (i = t.conditions) ? void 0 : i.utm)) return !0;
		var e = io();
		if (e.utm_source) {
			var r, s, n, o, a, l, h, u, d = null == (r = t.conditions) || null == (r = r.utm) || !r.utm_campaign || (null == (s = t.conditions) || null == (s = s.utm) ? void 0 : s.utm_campaign) == e.utm_campaign, v = null == (n = t.conditions) || null == (n = n.utm) || !n.utm_source || (null == (o = t.conditions) || null == (o = o.utm) ? void 0 : o.utm_source) == e.utm_source, c = null == (a = t.conditions) || null == (a = a.utm) || !a.utm_medium || (null == (l = t.conditions) || null == (l = l.utm) ? void 0 : l.utm_medium) == e.utm_medium, f = null == (h = t.conditions) || null == (h = h.utm) || !h.utm_term || (null == (u = t.conditions) || null == (u = u.utm) ? void 0 : u.utm_term) == e.utm_term;
			return d && c && f && v;
		}
		return !1;
	}
	static xh(t) {
		for (var i = arguments.length, e = new Array(i > 1 ? i - 1 : 0), r = 1; i > r; r++) e[r - 1] = arguments[r];
		Ie.info("[WebExperiments] " + t, e);
	}
	Th(t, i, e) {
		this._is_bot() ? Ah.xh(Oh) : "control" !== i ? e.forEach(((e) => {
			if (e.selector) {
				var r;
				Ah.xh("applying transform of variant " + i + " for experiment " + t + " ", e);
				(null == (r = document) ? void 0 : r.querySelectorAll(e.selector))?.forEach(((t) => {
					var i = t;
					e.html && (i.innerHTML = e.html), e.css && i.setAttribute("style", e.css);
				}));
			}
		})) : Ah.xh("Control variants leave the page unmodified.");
	}
	_is_bot() {
		return e && this._instance ? qa(e, this.vn.custom_blocked_useragents) : void 0;
	}
};
var Fh = Ae("[Conversations]");
var Mh = "Conversations not available yet.";
function Dh(t, i) {
	var e, r, s, n, o, a, l, h = null !== (e = null == t ? void 0 : t.flushIntervalMs) && void 0 !== e ? e : 3e3, u = null !== (r = null == t ? void 0 : t.maxBufferSize) && void 0 !== r ? r : 100, d = null != i && i.consoleCapture ? void 0 : null !== (s = null == t ? void 0 : t.maxLogsPerInterval) && void 0 !== s ? s : 1e3, v = K(d) ? Math.max(u, 2048) : Math.max(u, d), c = null == t ? void 0 : t.resourceAttributes;
	return {
		serviceName: null !== (n = null !== (o = null == c ? void 0 : c["service.name"]) && void 0 !== o ? o : null == t ? void 0 : t.serviceName) && void 0 !== n ? n : null == i ? void 0 : i.serviceNameDefault,
		serviceVersion: null !== (a = null == c ? void 0 : c["service.version"]) && void 0 !== a ? a : null == t ? void 0 : t.serviceVersion,
		environment: null !== (l = null == c ? void 0 : c["deployment.environment"]) && void 0 !== l ? l : null == t ? void 0 : t.environment,
		resourceAttributes: c,
		beforeSend: null == t ? void 0 : t.beforeSend,
		flushIntervalMs: h,
		maxBufferSize: u,
		maxQueueSize: v,
		maxBatchRecordsPerPost: 100,
		rateCapWindowMs: h,
		maxLogsPerInterval: d,
		backgroundFlushBudgetMs: 0,
		terminationFlushBudgetMs: 0
	};
}
var Nh = [
	"debug",
	"log",
	"warn",
	"error",
	"info"
];
var Lh = "console";
var Uh = "__posthogHandledLogsRequestError";
var jh = (t, i) => {
	var e = t instanceof Error ? t : new Error(i);
	return e[Uh] = !0, e;
};
var Bh = (t) => !!t && "object" == typeof t && !0 === t[Uh];
var zh = { featureFlags: class {
	constructor(t) {
		this.name = "featureFlags", this.Ph = !1, this.featureFlagEventHandlers = [], this.I = xh, this.Ah = {}, this.Fh = {}, this.Oh = [], this.Lh = !1, this.Dh = !1, this.$h = 0, this.Nh = !1, this.qh = !1, this.jh = !1, this.Bh = !1, this.Hh = 0, this.Ht = () => {
			var t = this.zh();
			this.Hh = 0, t && this.reloadFeatureFlags();
		}, this.Uh = () => {
			var t, i = this.Wh;
			K(i) || this.vn.remoteRequestsDisabled || !r || "hidden" === r.visibilityState || Date.now() - (null !== (t = this.Vh) && void 0 !== t ? t : 0) < i || (this.reloadFeatureFlags(), this.Gh());
		}, this.$t = () => {
			"visible" === (null == r ? void 0 : r.visibilityState) && this.Uh();
		}, "get" in t ? this.Ps = t : (this.Zh = new wh(t.config, t.Ua()), this.Ps = this.Zh);
	}
	updateConfig(t, i) {
		var e;
		null == (e = this.Zh) || e.update(t, i), this.Os && this.Qh();
	}
	setup(t) {
		return this.au = t, this.I = t.logger.createLogger("[FeatureFlags]"), ah(t.kv.initialize(), (() => {
			this.au === t && (this.au = void 0, this.Os = t, this.Jh(t));
		}));
	}
	Jh(i) {
		if (this.Os === i) return t && us(t, "online", this.Ht), this.Qh(), this.Kh = i.registerDynamicEventProperties((() => this.Yh() ? this.Ah : this.Fh)), this.Xh(), this.initialize();
	}
	Qh() {
		var t = this.vn.refreshIntervalMs, i = !this.vn.remoteRequestsDisabled && r && !K(t) && t > 0 ? t : void 0;
		i !== this.Wh && (this.td(), K(i) || (this.Wh = i, this.Gh(), null != r && r.addEventListener && us(r, Jr, this.$t)));
	}
	Gh() {
		K(this.Wh) || (K(this.ed) || clearInterval(this.ed), this.Vh = Date.now(), this.ed = setInterval(this.Uh, this.Wh));
	}
	td() {
		K(this.ed) || (clearInterval(this.ed), this.ed = void 0, null == r || null == r.removeEventListener || r.removeEventListener(Jr, this.$t)), this.Wh = void 0, this.Vh = void 0;
	}
	destroy() {
		this.rd();
	}
	dispose() {
		this.rd();
	}
	rd() {
		var i;
		this.td(), this.$h++, this.qh = !1, this.au = void 0, this.Os && (this.nd(), null == (i = this.Kh) || i.dispose(), this.Kh = void 0, this.Oh = [], t?.removeEventListener("online", this.Ht), this.Os = void 0);
	}
	get vn() {
		return this.Ps.get();
	}
	sd(t) {
		var i;
		return null == (i = this.Os) ? void 0 : i.kv.get(t);
	}
	ei(t) {
		this.ad((() => {
			var i;
			return null == (i = this.Os) ? void 0 : i.kv.set(t);
		}));
	}
	ri(t) {
		this.ad((() => {
			var i;
			return null == (i = this.Os) ? void 0 : i.kv.remove(t);
		}));
	}
	ad(t) {
		try {
			t();
		} catch (t) {
			this.I.error("Failed to update feature flag persistence", t);
		}
	}
	Xh() {
		var t = {};
		for (var i of [
			ur,
			cr,
			fr,
			_r
		]) {
			var e = this.sd(i);
			K(e) || (t[i] = e);
		}
		this.Ah = t;
		var r = _({}, t), s = this.sd(hr);
		if (s) for (var n of Object.entries(s)) r["$feature/" + n[0]] = n[1];
		this.Fh = r;
	}
	Yh() {
		var t = this.vn.cacheTtlMs;
		if (!t || 0 >= t) return !1;
		var i = this.sd(Cr);
		return "number" != typeof i || Date.now() - i > t;
	}
	od() {
		return !!this.Yh() && (this.Bh || this.Dh || (this.Bh = !0, this.I.warn("Feature flag cache is stale, triggering refresh..."), this.reloadFeatureFlags()), !0);
	}
	ld() {
		var t = this.vn.evaluationContexts;
		return null != t && t.length ? t.filter(((t) => {
			var i = t && "string" == typeof t && t.trim().length > 0;
			return i || this.I.error("Invalid evaluation context found:", t, "Expected non-empty string"), i;
		})) : [];
	}
	ud() {
		var t = this.vn.flagKeys;
		if (!K(t)) return t.filter(((t) => {
			var i = t && "string" == typeof t && t.trim().length > 0;
			return i || this.I.error("Invalid flag key found:", t, "Expected non-empty string"), i;
		}));
	}
	initialize() {
		var t, i, e = this.vn, r = null !== (t = null == (i = e.bootstrap) ? void 0 : i.featureFlags) && void 0 !== t ? t : {};
		if (Object.keys(r).length) {
			var s, n, o = null !== (s = null == (n = e.bootstrap) ? void 0 : n.featureFlagPayloads) && void 0 !== s ? s : {}, a = Object.keys(r).filter(((t) => !!r[t])).reduce(((t, i) => (t[i] = r[i] || !1, t)), {}), l = Object.keys(o).filter(((t) => a[t])).reduce(((t, i) => (t[i] = o[i], t)), {});
			return this.hd({
				featureFlags: a,
				featureFlagPayloads: l
			});
		}
	}
	updateFlags(t, i, e) {
		var r, s, n = null != e && e.merge && null !== (r = this.sd(hr)) && void 0 !== r ? r : {}, o = null != e && e.merge && null !== (s = this.sd(cr)) && void 0 !== s ? s : {}, a = _({}, n, t), l = _({}, o, i), h = {};
		for (var u of Object.entries(a)) {
			var d = u[0], v = u[1];
			h[d] = {
				key: d,
				enabled: y(v),
				variant: b(v),
				reason: void 0,
				metadata: K(null == l ? void 0 : l[d]) ? void 0 : {
					id: 0,
					version: void 0,
					description: void 0,
					payload: l[d]
				}
			};
		}
		this.hd({ flags: h });
	}
	get hasLoadedFlags() {
		return this.Lh;
	}
	getFlags() {
		return Object.keys(this.getFlagVariants());
	}
	getFlagsWithDetails() {
		var t = this.sd(vr), i = this.sd(_r), e = this.sd(gr);
		if (!e && !i) return t || {};
		var r = rs({}, t || {});
		for (var n of [.../* @__PURE__ */ new Set([...Object.keys(e || {}), ...Object.keys(i || {})])]) {
			var o, a, l = r[n], h = null == i ? void 0 : i[n], u = K(h) ? null !== (o = null == l ? void 0 : l.enabled) && void 0 !== o && o : !!h, d = K(h) ? null == l ? void 0 : l.variant : "string" == typeof h ? h : void 0, v = null == e ? void 0 : e[n], c = _({}, l, {
				enabled: u,
				variant: u ? null != d ? d : null == l ? void 0 : l.variant : void 0
			});
			u !== (null == l ? void 0 : l.enabled) && (c.original_enabled = null == l ? void 0 : l.enabled), d !== (null == l ? void 0 : l.variant) && (c.original_variant = null == l ? void 0 : l.variant), v && (c.metadata = _({}, null == l ? void 0 : l.metadata, {
				payload: v,
				original_payload: null == l || null == (a = l.metadata) ? void 0 : a.payload
			})), r[n] = c;
		}
		return this.Ph || (this.I.warn(" Overriding feature flag details!", {
			flagDetails: t,
			overriddenPayloads: e,
			finalDetails: r
		}), this.Ph = !0), r;
	}
	getAllFeatureFlags() {
		var t = this.getFlagVariants(), i = this.getFlagPayloads();
		return Object.keys(t).map(((e) => {
			var r = t[e];
			return {
				key: e,
				enabled: y(r),
				variant: b(r),
				payload: m(i[e])
			};
		}));
	}
	getFlagVariants() {
		var t = this.sd(hr), i = this.sd(_r);
		if (!i) return t || {};
		for (var e = rs({}, t || {}), r = Object.keys(i), s = 0; r.length > s; s++) e[r[s]] = i[r[s]];
		return this.Ph || (this.I.warn(" Overriding feature flags!", {
			enabledFlags: t,
			overriddenFlags: i,
			finalFlags: e
		}), this.Ph = !0), e;
	}
	getFlagPayloads() {
		var t = this.sd(cr), i = this.sd(gr);
		if (!i) return t || {};
		for (var e = rs({}, t || {}), r = Object.keys(i), s = 0; r.length > s; s++) e[r[s]] = i[r[s]];
		return this.Ph || (this.I.warn(" Overriding feature flag payloads!", {
			flagPayloads: t,
			overriddenPayloads: i,
			finalPayloads: e
		}), this.Ph = !0), e;
	}
	reloadFeatureFlags() {
		this.Nh || this.vn.featureFlagsDisabled || this.zh() || this.dd || (this.Oh.slice().forEach(((t) => {
			try {
				t();
			} catch (t) {
				this.I.error("Error while running feature flags reloading callback", t);
			}
		})), this.dd = setTimeout((() => {
			this.vd();
		}), 5));
	}
	nd() {
		clearTimeout(this.dd), this.dd = void 0;
	}
	onReloading(t) {
		return this.Oh.push(t), () => {
			this.Oh = this.Oh.filter(((i) => i !== t));
		};
	}
	ensureFlagsLoaded() {
		this.Lh || this.Dh || this.dd || this.reloadFeatureFlags();
	}
	setAnonymousDistinctId(t) {
		this.$anon_distinct_id = t;
	}
	setReloadingPaused(t) {
		this.Nh = t;
	}
	resetFlagCallReported() {
		this.ri($r);
	}
	vd(t) {
		this.nd();
		var i = this.Os;
		if (i && !this.vn.remoteRequestsDisabled && !this.zh()) if (this.Dh) this.qh = !0;
		else {
			var e = {
				token: i.projectToken,
				distinct_id: i.distinctId,
				groups: i.groups,
				$anon_distinct_id: this.$anon_distinct_id,
				person_properties: _({}, i.initialPersonProperties, this.sd(mr) || {}, {
					$lib: i.library.name,
					$lib_version: i.library.version
				}),
				group_properties: this.sd(yr),
				timezone: ho()
			};
			K(i.deviceId) || (e.$device_id = i.deviceId), (null != t && t.disableFlags || this.vn.featureFlagsDisabled) && (e.disable_flags = !0);
			var r = this.ld();
			r.length && (e.evaluation_contexts = r);
			var s = this.ud();
			K(s) || (e.flag_keys = s);
			var n = this.vn.onlyEvaluateSurveyFeatureFlags, o = "/flags/?v=2" + (n ? "&only_evaluate_survey_feature_flags=true" : ""), a = this.$h;
			this.Dh = !0;
			var l = () => {
				this.qh && (this.qh = !1, this.vd());
			}, h = (t) => {
				this.Dh = !1, a === this.$h ? (this.ei({ [Rr]: [kh] }), this.I.error("Feature flag request failed", t), l()) : l();
			};
			try {
				i.sendRequest(o, {
					target: "flags",
					method: "POST",
					body: e,
					compression: this.vn.compression,
					sentAt: "body",
					timeoutMs: this.vn.requestTimeoutMs
				}).then(((t) => {
					var i, r, s = null !== (i = t.json) && void 0 !== i ? i : {}, o = 200 !== t.statusCode;
					if (this.Dh = !1, a === this.$h) {
						if (this.fd(t.statusCode), o || this.qh || (this.$anon_distinct_id = void 0), !e.disable_flags || this.qh) {
							this.jh = !o;
							var h = [];
							t.error ? h.push(t.error instanceof Error && "AbortError" === t.error.name ? "timeout" : t.error instanceof Error ? kh : "unknown_error") : 200 !== t.statusCode && h.push("api_error_" + t.statusCode), s.errorsWhileComputingFlags && h.push("errors_while_computing_flags");
							var u = !(null == (r = s.quotaLimited) || !r.includes("feature_flags"));
							u && h.push("quota_limited"), this.ei({ [Rr]: h }), u ? this.I.warn("You have hit your feature flags quota limit, and will not be able to load feature flags until the quota is reset.  Please visit https://posthog.com/docs/billing/limits-alerts to learn more.") : e.disable_flags || this.hd(s, o, { partialResponse: n }), l();
						}
					} else l();
				})).catch(h);
			} catch (t) {
				h(t);
			}
		}
	}
	zh() {
		return Kn(this.Hh, 3);
	}
	fd(t) {
		this.Hh = Jn(t, this.Hh, 3, (() => this.I.warn("Feature flag requests are failing before receiving an HTTP response; this can happen due to network issues, CORS, browser blocking, or ad blockers. Stopped refreshing feature flags; will try again when connectivity changes.")));
	}
	getFeatureFlag(t, i) {
		var e;
		if (void 0 === i && (i = {}), !i.fresh || this.jh) if (this.Lh || this.getFlags() && this.getFlags().length > 0) {
			if (!this.od()) {
				var r = this.getFeatureFlagResult(t, i);
				return null !== (e = null == r ? void 0 : r.variant) && void 0 !== e ? e : null == r ? void 0 : r.enabled;
			}
		} else this.I.warn("getFeatureFlag for key \"" + t + Sh);
	}
	getFeatureFlagDetails(t) {
		return this.getFlagsWithDetails()[t];
	}
	getFeatureFlagPayload(t) {
		var i = this.getFeatureFlagResult(t, { send_event: !1 });
		return null == i ? void 0 : i.payload;
	}
	getFeatureFlagResult(t, i) {
		if (void 0 === i && (i = {}), !i.fresh || this.jh) if (this.Lh || this.getFlags() && this.getFlags().length > 0) {
			if (!this.od()) {
				var e, r = this.getFlagVariants(), s = t in r, n = r[t], o = this.getFlagPayloads()[t], a = String(n), l = this.sd(fr) || void 0, h = this.sd(Cr) || void 0, u = this.sd($r) || {};
				if (this.vn.deduplicateCallsPerSession) {
					var d, v = null == (d = this.Os) ? void 0 : d.session.sessionId, c = this.sd(Pr);
					v && v !== c && (u = {}, e = v);
				}
				if (i.send_event || !("send_event" in i)) if (t in u && u[t].includes(a)) e && this.ei({
					[$r]: u,
					[Pr]: e
				});
				else {
					var f, p, g, y, b, w, x, E, S, k, T, P;
					H(u[t]) ? u[t].push(a) : u[t] = [a], this.ei(_({ [$r]: u }, e ? { [Pr]: e } : {}));
					var R = this.getFeatureFlagDetails(t), C = [...null !== (f = this.sd(Rr)) && void 0 !== f ? f : []];
					K(n) && C.push("flag_missing");
					var O = {
						$feature_flag: t,
						$feature_flag_response: n,
						$feature_flag_payload: null != o ? o : null,
						$feature_flag_request_id: l,
						$feature_flag_evaluated_at: h,
						$feature_flag_bootstrapped_response: null !== (p = null == (g = this.vn.bootstrap) || null == (g = g.featureFlags) ? void 0 : g[t]) && void 0 !== p ? p : null,
						$feature_flag_bootstrapped_payload: null !== (y = null == (b = this.vn.bootstrap) || null == (b = b.featureFlagPayloads) ? void 0 : b[t]) && void 0 !== y ? y : null,
						$used_bootstrap_value: !this.jh
					};
					K(null == R || null == (w = R.metadata) ? void 0 : w.has_experiment) || (O.$feature_flag_has_experiment = R.metadata.has_experiment), K(null == R || null == (x = R.metadata) ? void 0 : x.version) || (O.$feature_flag_version = R.metadata.version);
					var I, A = null !== (E = null == R || null == (S = R.reason) ? void 0 : S.description) && void 0 !== E ? E : null == R || null == (k = R.reason) ? void 0 : k.code;
					A && (O.$feature_flag_reason = A), null != R && null != (T = R.metadata) && T.id && (O.$feature_flag_id = R.metadata.id), K(null == R ? void 0 : R.original_variant) && K(null == R ? void 0 : R.original_enabled) || (O.$feature_flag_original_response = K(R.original_variant) ? R.original_enabled : R.original_variant), null != R && null != (P = R.metadata) && P.original_payload && (O.$feature_flag_original_payload = null == R || null == (I = R.metadata) ? void 0 : I.original_payload), C.length && (O.$feature_flag_error = C.join(",")), this.pd(O);
				}
				else e && this.ei({
					[$r]: u,
					[Pr]: e
				});
				if (s) return {
					key: t,
					enabled: !!n,
					variant: "string" == typeof n ? n : void 0,
					payload: m(o)
				};
			}
		} else this.I.warn("getFeatureFlagResult for key \"" + t + Sh);
	}
	pd(t) {
		try {
			var i;
			null == (i = this.Os) || i.capture("$feature_flag_called", t).catch(((t) => {
				this.I.error("Failed to capture feature flag call", t);
			}));
		} catch (t) {
			this.I.error("Failed to capture feature flag call", t);
		}
	}
	getRemoteConfigPayload(t, i) {
		this.gd(t, i);
	}
	gd(t, i) {
		var e = this;
		return p((function* () {
			var r = e.Os;
			if (r) {
				var s = {
					distinct_id: r.distinctId,
					token: r.projectToken,
					person_properties: {
						$lib: r.library.name,
						$lib_version: r.library.version
					}
				}, n = e.ld();
				n.length && (s.evaluation_contexts = n);
				var o, a = e.ud();
				K(a) || (s.flag_keys = a);
				try {
					var l, h = null == (l = (yield r.sendRequest("/flags/?v=2", {
						target: "flags",
						method: "POST",
						body: s,
						compression: e.vn.compression,
						sentAt: "body",
						timeoutMs: e.vn.requestTimeoutMs
					})).json) ? void 0 : l.featureFlagPayloads;
					o = (null == h ? void 0 : h[t]) || void 0;
				} catch (t) {
					e.I.error("Remote config feature flag request failed", t);
					return;
				}
				try {
					i(o);
				} catch (t) {
					e.I.error("Remote config feature flag callback failed", t);
				}
			}
		}))();
	}
	isFeatureEnabled(t, i) {
		if (void 0 === i && (i = {}), i.fresh && !this.jh) return i.defaultValue;
		if (!(this.Lh || this.getFlags() && this.getFlags().length > 0)) return this.I.warn("isFeatureEnabled for key \"" + t + Sh), i.defaultValue;
		var e = this.getFeatureFlag(t, i);
		return K(e) ? i.defaultValue : !!e;
	}
	addFeatureFlagsHandler(t) {
		this.featureFlagEventHandlers.push(t);
	}
	removeFeatureFlagsHandler(t) {
		this.featureFlagEventHandlers = this.featureFlagEventHandlers.filter(((i) => i !== t));
	}
	receivedFeatureFlags(t, i, e) {
		this.hd(t, i, e);
	}
	hd(t, i, e) {
		if (this.Os) {
			this.Lh = !0;
			var r = function(t, i, e, r, s, n) {
				void 0 === i && (i = {}), void 0 === e && (e = {}), void 0 === r && (r = {}), void 0 === n && (n = xh);
				var o = ((t, i) => {
					var e = t.flags;
					return e ? _({}, t, {
						featureFlags: Object.fromEntries(Object.keys(e).map(((t) => {
							var i;
							return [t, null !== (i = e[t].variant) && void 0 !== i ? i : e[t].enabled];
						}))),
						featureFlagPayloads: Object.fromEntries(Object.keys(e).filter(((t) => e[t].enabled)).filter(((t) => {
							var i;
							return null == (i = e[t].metadata) ? void 0 : i.payload;
						})).map(((t) => {
							var i;
							return [t, null == (i = e[t].metadata) ? void 0 : i.payload];
						})))
					}) : (t.featureFlags && i.warn("Using an older version of the feature flags endpoint. Please upgrade your PostHog server to the latest version"), t);
				})(t, n), a = o.flags, l = o.featureFlags, h = o.featureFlagPayloads;
				if (l) {
					var u = t.requestId, d = t.evaluatedAt;
					if (H(l)) {
						n.warn("v1 of the feature flags endpoint is deprecated. Please use the latest version.");
						var v = {};
						if (l) for (var c = 0; l.length > c; c++) v[l[c]] = !0;
						return {
							[ur]: l,
							[hr]: v,
							[pr]: !1
						};
					}
					var f = l, p = h, g = a;
					if (null != s && s.partialResponse) f = _({}, i, f), p = _({}, e, p), g = _({}, r, g);
					else if (t.errorsWhileComputingFlags) if (a) {
						var m = new Set(Object.keys(a).filter(((t) => {
							var i;
							return !(null != (i = a[t]) && i.failed);
						})));
						f = _({}, i, Object.fromEntries(Object.entries(f).filter(((t) => m.has(t[0]))))), p = _({}, e, Object.fromEntries(Object.entries(p || {}).filter(((t) => m.has(t[0]))))), g = _({}, r, Object.fromEntries(Object.entries(g || {}).filter(((t) => m.has(t[0])))));
					} else f = _({}, i, f), p = _({}, e, p), g = _({}, r, g);
					return _({
						[ur]: Object.keys($h(f)),
						[hr]: f || {},
						[cr]: p || {},
						[vr]: g || {},
						[pr]: !0 === t.minimalFlagCalledEvents
					}, u ? { [fr]: u } : {}, d ? { [Cr]: d } : {});
				}
			}(t, this.getFlagVariants(), this.getFlagPayloads(), this.getFlagsWithDetails(), e, this.I);
			r && this.ei(r), i || (this.Bh = !1), this.md(i);
		}
	}
	override(t, i) {
		void 0 === i && (i = !1), this.I.warn("override is deprecated. Please use overrideFeatureFlags instead."), this.overrideFeatureFlags({
			flags: t,
			suppressWarning: i
		});
	}
	overrideFeatureFlags(t) {
		this.yd(t);
	}
	yd(t) {
		if (this.Os) {
			if (!1 === t) return this.ri([_r, gr]), this.md(), void Eh.info("All overrides cleared");
			if (H(t)) return this.ei({ [_r]: Th(t) }), this.md(), void Eh.info("Flag overrides set", { flags: t });
			if (t && "object" == typeof t && ("flags" in t || "payloads" in t)) {
				var i, e = t;
				this.Ph = Boolean(null !== (i = e.suppressWarning) && void 0 !== i && i);
				var r = {}, s = e.flags, n = e.payloads;
				s && (r[_r] = H(s) ? Th(s) : s), n && (r[gr] = n), Object.keys(r).length && this.ei(r), !1 === s && !1 === n ? this.ri([_r, gr]) : !1 === s ? this.ri(_r) : !1 === n && this.ri(gr), this.md(), !1 === s ? Eh.info("Flag overrides cleared") : s && Eh.info("Flag overrides set", { flags: s }), !1 === n ? Eh.info("Payload overrides cleared") : n && Eh.info("Payload overrides set", { payloads: n });
				return;
			}
			if (t && "object" == typeof t) return this.ei({ [_r]: t }), this.md(), void Eh.info("Flag overrides set", { flags: t });
			this.I.warn("Invalid overrideOptions provided to overrideFeatureFlags", { overrideOptions: t });
		} else this.I.warn("posthog.featureFlags.overrideFeatureFlags called before feature flags were ready");
	}
	onFeatureFlags(t) {
		if (this.addFeatureFlagsHandler(t), this.Lh) {
			var i = this.bd(), e = i.flags, r = i.flagVariants;
			try {
				t(e, r);
			} catch (t) {
				this.I.error("Error while running feature flags callback", t);
			}
		}
		return () => this.removeFeatureFlagsHandler(t);
	}
	updateEarlyAccessFeatureEnrollment(t, i, e) {
		var r = (this.sd(dr) || []).find(((i) => i.flagKey === t)), s = { ["$feature_enrollment/" + t]: i }, n = {
			$feature_flag: t,
			$feature_enrollment: i,
			$set: s
		};
		r && (n.$early_access_feature_name = r.name), e && (n.$feature_enrollment_stage = e);
		var o = _({}, this.getFlagVariants(), { [t]: i });
		this.ei({
			[ur]: Object.keys($h(o)),
			[hr]: o,
			[mr]: _({}, this.sd(mr) || {}, s)
		}), this.md();
		try {
			var a;
			null == (a = this.Os) || a.capture("$feature_enrollment_update", n).catch(((t) => {
				this.I.error("Failed to capture early access feature enrollment", t);
			}));
		} catch (t) {
			this.I.error("Failed to capture early access feature enrollment", t);
		}
	}
	getEarlyAccessFeatures(t, i, e) {
		void 0 === i && (i = !1);
		var r = this.sd(dr);
		!r || i ? this._d(t, e) : t(r);
	}
	_d(t, i) {
		var e = this;
		return p((function* () {
			var r = e.Os;
			if (r) {
				var s, n = i ? "&" + i.map(((t) => "stage=" + t)).join("&") : "";
				try {
					var o = yield r.sendRequest("/api/early_access_features/?token=" + r.projectToken + n, {
						target: "api",
						method: "GET",
						sentAt: "query"
					});
					if (!o.json) return;
					e.ei({ [dr]: s = o.json.earlyAccessFeatures });
				} catch (t) {
					e.I.error("Early access feature request failed", t);
					return;
				}
				try {
					t(s);
				} catch (t) {
					e.I.error("Early access feature callback failed", t);
				}
			}
		}))();
	}
	bd() {
		var t = this.getFlags(), i = this.getFlagVariants();
		return {
			flags: t.filter(((t) => i[t])),
			flagVariants: Object.keys(i).filter(((t) => i[t])).reduce(((t, e) => (t[e] = i[e], t)), {})
		};
	}
	md(t) {
		this.Xh();
		var i = this.bd(), e = i.flags, r = i.flagVariants;
		this.featureFlagEventHandlers.forEach(((i) => {
			try {
				i(e, r, { errorsLoading: t });
			} catch (t) {
				this.I.error("Error while running feature flags callback", t);
			}
		}));
	}
	setPersonPropertiesForFlags(t, i) {
		void 0 === i && (i = !0), this.wd(t, i);
	}
	wd(t, i) {
		void 0 === i && (i = !0);
		var e = this.sd(mr) || {}, r = (null == t ? void 0 : t.$set) || (null != t && t.$set_once ? {} : t), s = null == t ? void 0 : t.$set_once, n = {};
		if (s) for (var o in s) ({}).hasOwnProperty.call(s, o) && (o in e || (n[o] = s[o]));
		this.ei({ [mr]: _({}, e, n, r) }), i && this.reloadFeatureFlags();
	}
	unsetPersonPropertiesForFlags(t, i) {
		void 0 === i && (i = !0);
		var e = _({}, this.sd(mr) || {});
		t.forEach(((t) => {
			delete e[t];
		})), this.ei({ [mr]: e }), i && this.reloadFeatureFlags();
	}
	resetPersonPropertiesForFlags(t) {
		void 0 === t && (t = !0), this.ri(mr), t && this.reloadFeatureFlags();
	}
	setGroupPropertiesForFlags(t, i) {
		void 0 === i && (i = !0);
		var e = this.sd(yr) || {}, r = _({}, e);
		for (var s of Object.keys(t)) r[s] = _({}, e[s], t[s]);
		this.ei({ [yr]: r }), i && this.reloadFeatureFlags();
	}
	resetGroupPropertiesForFlags(t) {
		if (t) {
			var i = this.sd(yr) || {};
			this.ei({ [yr]: _({}, i, { [t]: {} }) });
		} else this.ri(yr);
	}
	reset() {
		this.$h++, this.qh = !1, this.Ah = {}, this.Fh = {}, this.Lh = !1, this.Nh = !1, this.jh = !1, this.$anon_distinct_id = void 0, this.nd(), this.Ph = !1, this.Hh = 0;
	}
} };
var qh = { sessionRecording: class {
	get vn() {
		return this._instance.config;
	}
	get yo() {
		return this._instance.persistence;
	}
	get started() {
		var t;
		return !(null == (t = this.kd) || !t.isStarted);
	}
	get status() {
		var t, i;
		return this.Sd === Yl || this.Sd === Ql ? this.Sd : null !== (t = null == (i = this.kd) ? void 0 : i.status) && void 0 !== t ? t : this.Sd;
	}
	constructor(i) {
		if (this._forceAllowLocalhostNetworkCapture = !1, this.Sd = Kl, this.xd = void 0, this.Cd = !1, this.Dt = (() => {
			var i;
			if (null == r || !r.visibilityState || "visible" === r.visibilityState) return !0;
			var e = null == t || null == (i = t.performance) || null == i.getEntriesByType ? void 0 : i.getEntriesByType("visibility-state");
			return !(null != e && e.length) || e.some(((t) => "visible" === t.name));
		})(), this.$t = () => {
			var t;
			"visible" === (null == r ? void 0 : r.visibilityState) && (this.Dt = !0, null == (t = this.kd) || null == t.setDocumentWasEverVisible || t.setDocumentWasEverVisible(!0));
		}, this._instance = i, !this._instance.sessionManager) throw Zl.error("started without valid sessionManager"), /* @__PURE__ */ new Error(Xl + " started without valid sessionManager. This is a bug.");
		if (this.vn.cookieless_mode === Vr) throw new Error(Xl + " cannot be used with cookieless_mode=\"always\"");
		null != r && r.addEventListener && us(r, "visibilitychange", this.$t);
	}
	initialize() {
		this.startIfEnabledOrStop();
	}
	dispose() {
		this.Cd = !0, null == r || null == r.removeEventListener || r.removeEventListener("visibilitychange", this.$t), this.stopRecording();
	}
	get Td() {
		var i, e = !(null == (i = this._instance.get_property(ir)) || !i.enabled), r = !this.vn.disable_session_recording, s = this.vn.disable_session_recording || this._instance.consent.isOptedOut();
		return t && e && r && !s;
	}
	startIfEnabledOrStop(t) {
		var i;
		if (!(this.Cd || this.Td && null != (i = this.kd) && i.isStarted)) {
			var e = !K(Object.assign) && !K(Array.from);
			this.Td && e ? (this.Md(t), Zl.info("starting")) : (this.Sd = Kl, this.stopRecording());
		}
	}
	Md(t) {
		var i, e, r;
		this.Td && (this.Sd !== Yl && this.Sd !== Ql && (this.Sd = Jl), null != v && null != (i = v.__PosthogExtensions__) && null != (i = i.rrweb) && i.record && null != (e = v.__PosthogExtensions__) && e.initSessionRecording ? this.Ed(t) : null == (r = v.__PosthogExtensions__) || null == r.loadExternalDependency || r.loadExternalDependency(this._instance, this.Id, ((i) => {
			if (i) return this._instance.register_for_session({ [zr]: !0 }), Zl.error("could not load recorder", i);
			this.Ed(t);
		})));
	}
	stopRecording() {
		var t, i;
		null == (t = this.xd) || t.call(this), this.xd = void 0, null == (i = this.kd) || i.stop();
	}
	Rd() {
		var t, i;
		null == (t = this.xd) || t.call(this), this.xd = void 0, null == (i = this.kd) || i.discard();
	}
	Pd() {
		var t, i;
		null == (t = this.yo) || t.unregister(lr), null == (i = this.yo) || i.unregister(er);
	}
	Ad(t, i) {
		if (X(t)) return null;
		var e, r = Z(t) ? t : parseFloat(t);
		return "number" != typeof (e = r) || !Number.isFinite(e) || 0 > e || e > 1 ? (Zl.warn(i + " must be between 0 and 1. Ignoring invalid value:", t), null) : r;
	}
	Fd(t) {
		if (this.yo) {
			var i, e, r = this.yo, s = () => {
				var i, e = !1 === t.sessionRecording ? void 0 : t.sessionRecording, s = this.Ad(null == (i = this.vn.session_recording) ? void 0 : i.sampleRate, "session_recording.sampleRate"), n = this.Ad(null == e ? void 0 : e.sampleRate, "remote config sampleRate"), o = null != s ? s : n;
				X(o) && this.Pd();
				var a = null == e ? void 0 : e.minimumDurationMilliseconds;
				r.register({ [ir]: _({
					cache_timestamp: Date.now(),
					enabled: !!e
				}, e, {
					networkPayloadCapture: _({ capturePerformance: t.capturePerformance }, null == e ? void 0 : e.networkPayloadCapture),
					canvasRecording: {
						enabled: null == e ? void 0 : e.recordCanvas,
						fps: null == e ? void 0 : e.canvasFps,
						quality: null == e ? void 0 : e.canvasQuality
					},
					sampleRate: o,
					minimumDurationMilliseconds: K(a) ? null : a,
					endpoint: null == e ? void 0 : e.endpoint,
					triggerMatchType: null == e ? void 0 : e.triggerMatchType,
					masking: null == e ? void 0 : e.masking,
					urlTriggers: null == e ? void 0 : e.urlTriggers,
					version: null == e ? void 0 : e.version,
					triggerGroups: null == e ? void 0 : e.triggerGroups
				}) });
			};
			s(), null == (i = this.xd) || i.call(this), this.xd = null == (e = this._instance.sessionManager) ? void 0 : e.onSessionId(s);
		}
	}
	onRemoteConfig(t) {
		var i = t.ok ? t.config : void 0;
		i && "sessionRecording" in i ? !1 === i.sessionRecording ? (this.Fd(i), this.Rd()) : (this.Fd(i), this.startIfEnabledOrStop()) : (this.Sd === Yl && (this.Sd = Ql, Zl.warn("config refresh failed, recording will not start until page reload")), this.startIfEnabledOrStop());
	}
	log(t, i) {
		var e;
		void 0 === i && (i = "log"), null != (e = this.kd) && e.log ? this.kd.log(t, i) : Zl.warn("log called before recorder was ready");
	}
	get Id() {
		var t, i, e = null == (t = this._instance) || null == (t = t.persistence) ? void 0 : t.get_property(ir);
		return (null == e || null == (i = e.scriptConfig) ? void 0 : i.script) || "lazy-recorder";
	}
	Od() {
		var t, i = this._instance.get_property(ir);
		if (!i) return !1;
		try {
			t = "object" == typeof i ? i : JSON.parse(i);
		} catch (t) {
			return Zl.warn("persisted remote config for session recording is invalid and will be ignored", t), !1;
		}
		return !X(t.cache_timestamp) && 36e5 >= Date.now() - t.cache_timestamp;
	}
	Ed(t) {
		var i, e, r;
		if (!this.Cd) {
			if (null == (i = v.__PosthogExtensions__) || !i.initSessionRecording) return Zl.warn("Called on script loaded before session recording is available. This can be caused by adblockers."), void this._instance.register_for_session({ [zr]: !0 });
			var s;
			if (this.kd || (this.kd = null == (s = v.__PosthogExtensions__) ? void 0 : s.initSessionRecording(this._instance, this.Dt), this.kd._forceAllowLocalhostNetworkCapture = this._forceAllowLocalhostNetworkCapture), !this.Od()) {
				if (this.Sd === Ql || this.Sd === Yl) return;
				this.Sd = Yl, Zl.info("persisted remote config is stale, requesting fresh config before starting"), new No(this._instance).load();
				return;
			}
			this.Sd = Jl, null == (e = (r = this.kd).setDocumentWasEverVisible) || e.call(r, this.Dt), this.kd.start(t);
		}
	}
	onRRwebEmit(t) {
		var i;
		null == (i = this.kd) || null == i.onRRwebEmit || i.onRRwebEmit(t);
	}
	overrideLinkedFlag() {
		var t, i;
		this.kd || null == (i = this.yo) || i.register({ [sr]: !0 }), null == (t = this.kd) || t.overrideLinkedFlag();
	}
	overrideSampling() {
		var t, i;
		this.kd || null == (i = this.yo) || i.register({ [rr]: !0 }), null == (t = this.kd) || t.overrideSampling();
	}
	overrideTrigger(t) {
		var i, e;
		this.kd || null == (e = this.yo) || e.register({ ["url" === t ? nr : or]: !0 }), null == (i = this.kd) || i.overrideTrigger(t);
	}
	get sdkDebugProperties() {
		var t;
		return (null == (t = this.kd) ? void 0 : t.sdkDebugProperties) || { $recording_status: this.status };
	}
	tryAddCustomEvent(t, i) {
		var e;
		return !(null == (e = this.kd) || !e.tryAddCustomEvent(t, i));
	}
} };
var Hh = {
	autocapture: class extends Dl {
		constructor(t) {
			super(new Nl(t)), this.instance = t;
		}
	},
	historyAutocapture: class {
		constructor(t) {
			this._instance = t, this.Ld = this.Dd();
		}
		initialize() {
			this.startIfEnabled();
		}
		get isEnabled() {
			var t = this.$d();
			return !!(t.path || t.search || this.Nd(t));
		}
		startIfEnabled() {
			this.isEnabled && (Ie.info("History API monitoring enabled, starting..."), this.monitorHistoryChanges());
		}
		startIfEnabledOrStop() {
			this.stop(), this.Ld = this.Dd(), this.startIfEnabled();
		}
		stop() {
			this.qd && this.qd(), this.qd = void 0, this.jd && this.jd(), this.jd = void 0, Ie.info("History API monitoring stopped");
		}
		monitorHistoryChanges() {
			t && t.history && (this.Bd("pushState"), this.Bd("replaceState"), this.Hd(), this.Nd() && this.zd());
		}
		Bd(i) {
			var e;
			if (t && (null == (e = t.history[i]) || !e.__posthog_wrapped__)) {
				var r = this;
				Bl(t.history, i, ((t) => function(e, s, n) {
					t.call(this, e, s, n), r.Ud(i);
				}));
			}
		}
		Dd() {
			var i = null == t ? void 0 : t.location;
			if (null != i && i.pathname) return {
				pathname: i.pathname,
				search: i.search,
				hash: i.hash
			};
		}
		$d() {
			var t = this._instance.config.capture_pageview;
			return "history_change" === t ? { path: !0 } : W(t) ? t : {};
		}
		Nd(t) {
			return void 0 === t && (t = this.$d()), !!t.hash && !this._instance.config.disable_capture_url_hashes;
		}
		Wd(t) {
			var i = this.$d(), e = this.Ld;
			return !(!e || !(i.path && t.pathname !== e.pathname || i.search && t.search !== e.search || this.Nd(i) && t.hash !== e.hash));
		}
		Ud(t) {
			try {
				var i = this.Dd();
				if (!i) return;
				this.Wd(i) && this._instance.capture(Qr, { navigation_type: t }), this.Ld = i;
			} catch (i) {
				Ie.error("Error capturing " + t + " pageview", i);
			}
		}
		Hd() {
			if (!this.qd) {
				var i = () => {
					this.Ud("popstate");
				};
				us(t, "popstate", i), this.qd = () => {
					t && t.removeEventListener("popstate", i);
				};
			}
		}
		zd() {
			if (!this.jd) {
				var i = () => {
					this.Ud("hashchange");
				};
				us(t, "hashchange", i), this.jd = () => {
					t && t.removeEventListener("hashchange", i);
				};
			}
		}
	},
	heatmaps: class {
		get vn() {
			return this.instance.config;
		}
		constructor(t) {
			var i;
			this.Vd = !1, this.Ts = !1, this.Gd = null, this.instance = t, this.Vd = !(null == (i = this.instance.persistence) || !i.props[We]), this.rageclicks = new Cl(t.config.rageclick);
		}
		initialize() {
			this.startIfEnabled();
		}
		get flushIntervalMilliseconds() {
			var t = 5e3;
			return W(this.vn.capture_heatmaps) && this.vn.capture_heatmaps.flush_interval_milliseconds && (t = this.vn.capture_heatmaps.flush_interval_milliseconds), t;
		}
		get isEnabled() {
			return X(this.vn.capture_heatmaps) ? X(this.vn.enable_heatmaps) ? this.Vd : this.vn.enable_heatmaps : !1 !== this.vn.capture_heatmaps;
		}
		startIfEnabled() {
			if (this.isEnabled) {
				if (this.Ts) return;
				th.info("starting..."), this.Zd(), this.$t();
			} else {
				var t;
				clearInterval(null !== (t = this.Gd) && void 0 !== t ? t : void 0), this.Qd(), this.getAndClearBuffer();
			}
		}
		onRemoteConfig(t) {
			if (t.ok) {
				var i = t.config;
				if ("heatmaps" in i) {
					var e = !!i.heatmaps;
					this.instance.persistence && this.instance.persistence.register({ [We]: e }), this.Vd = e, this.startIfEnabled();
				}
			}
		}
		getAndClearBuffer() {
			var t = this.At;
			return this.At = void 0, t;
		}
		Jd(t) {
			ih(t.originalEvent) && this.Qi(t.originalEvent, "deadclick");
		}
		$t() {
			this.Gd && clearInterval(this.Gd), this.Gd = "visible" === (null == r ? void 0 : r.visibilityState) ? setInterval(this.oo.bind(this), this.flushIntervalMilliseconds) : null;
		}
		Zd() {
			t && r && (this.Kd = this.oo.bind(this), us(t, Yr, this.Kd), this.Yd = (i) => this.Qi(i || (null == t ? void 0 : t.event)), us(r, "click", this.Yd, { capture: !0 }), this.Xd = (i) => this.tv(i || (null == t ? void 0 : t.event)), us(r, "mousemove", this.Xd, { capture: !0 }), this.ev = new An(this.instance, On, this.Jd.bind(this)), this.ev.startIfEnabledOrStop(), this.iv = this.$t.bind(this), us(r, Jr, this.iv), this.Ts = !0);
		}
		Qd() {
			var i;
			t && r && (this.Kd && t.removeEventListener(Yr, this.Kd), this.Yd && r.removeEventListener("click", this.Yd, { capture: !0 }), this.Xd && r.removeEventListener("mousemove", this.Xd, { capture: !0 }), this.iv && r.removeEventListener(Jr, this.iv), clearTimeout(this.rv), null == (i = this.ev) || i.stop(), this.Ts = !1);
		}
		nv(i, e) {
			var r = this.instance.scrollManager.scrollY(), s = this.instance.scrollManager.scrollX(), n = this.instance.scrollManager.scrollElement(), o = function(i, e, r) {
				for (var s = i; s && Ws(s) && !Gs(s, "body");) {
					if (s === r) return !1;
					var n = void 0;
					try {
						var o, a, l;
						n = null == (o = null !== (a = null == (l = s.ownerDocument) ? void 0 : l.defaultView) && void 0 !== a ? a : t) ? void 0 : o.getComputedStyle(s).position;
					} catch (t) {
						return !1;
					}
					if (N(e, n)) return !0;
					s = on(s);
				}
				return !1;
			}(rn(i), ["fixed", "sticky"], n);
			return {
				x: i.clientX + (o ? 0 : s),
				y: i.clientY + (o ? 0 : r),
				target_fixed: o,
				type: e
			};
		}
		Qi(t, i) {
			var e;
			if (void 0 === i && (i = "click"), !Vs(t.target) && ih(t)) {
				var r = this.nv(t, i);
				null != (e = this.rageclicks) && e.isRageClick(t.clientX, t.clientY, (/* @__PURE__ */ new Date()).getTime()) && cn(rn(t), this.instance.config.rageclick) && this.fs(_({}, r, { type: "rageclick" })), this.fs(r);
			}
		}
		tv(t) {
			!Vs(t.target) && ih(t) && (clearTimeout(this.rv), this.rv = setTimeout((() => {
				this.fs(this.nv(t, "mousemove"));
			}), 500));
		}
		fs(i) {
			if (t) {
				var e = this.vn.disable_capture_url_hashes ? xi(t.location.href) : t.location.href, r = this.vn.custom_personal_data_properties, n = Wn(e, this.vn.mask_personal_data_properties ? [...Qn, ...r || []] : [], Zn);
				this.At = this.At || {}, this.At[n] || (this.At[n] = []), this.At[n].push(i);
			}
		}
		oo() {
			this.At && !G(this.At) && this.instance.capture("$$heatmap", { $heatmap_data: this.getAndClearBuffer() });
		}
	},
	deadClicksAutocapture: An,
	webVitalsAutocapture: class {
		constructor(t) {
			var i;
			this.Vd = !1, this.Ts = !1, this.At = {
				navigationKey: void 0,
				url: void 0,
				metrics: [],
				firstMetricTimestamp: void 0
			}, this.sv = () => {
				clearTimeout(this.av), this.av = void 0, 0 !== this.At.metrics.length && (this._instance.capture("$web_vitals", _({ $current_url: this.At.url }, this.At.metrics.reduce(((t, i) => _({}, t, {
					["$web_vitals_" + i.name + "_event"]: _({}, i),
					["$web_vitals_" + i.name + "_value"]: i.value
				})), {}))), this.At = {
					navigationKey: void 0,
					url: void 0,
					metrics: [],
					firstMetricTimestamp: void 0
				});
			}, this.ov = (t) => {
				var i;
				if (this.At = this.At || {
					navigationKey: void 0,
					url: void 0,
					metrics: [],
					firstMetricTimestamp: void 0
				}, X(null == t ? void 0 : t.name) || X(null == t ? void 0 : t.value)) ql.error("Invalid metric received", t);
				else {
					var e = "string" == typeof t.navigationURL ? t.navigationURL : void 0, r = this.lv(e);
					if (!K(r)) {
						var s = Z(t.navigationId) || "string" == typeof t.navigationId ? "navigation:" + t.navigationId : "url:" + r;
						if (!this.uv || this.uv > t.value) {
							this.At.navigationKey !== s && (this.sv(), this.av = setTimeout(this.sv, this.flushToCaptureTimeoutMs)), K(this.At.navigationKey) && (this.At.navigationKey = s, this.At.url = r), this.At.firstMetricTimestamp = K(this.At.firstMetricTimestamp) ? Date.now() : this.At.firstMetricTimestamp;
							var n = null == (i = this._instance.sessionManager) ? void 0 : i.checkAndGetSessionAndWindowId(!0), o = _({}, t, e ? { navigationURL: r } : {}, {
								$current_url: r,
								timestamp: Date.now()
							});
							if (delete o.entries, W(t.attribution) && this.attributionMetrics.indexOf(t.name) > -1) {
								var a = {};
								for (var l of Gl) {
									var h = "url" === l && "string" == typeof t.attribution[l] ? this.lv(t.attribution[l]) : t.attribution[l];
									K(h) || (a[l] = h);
								}
								o.attribution = a;
							} else delete o.attribution;
							K(n) || (o.$session_id = n.sessionId, o.$window_id = n.windowId), this.At.metrics.push(o), this.At.metrics.length === this.allowedMetrics.length && this.sv();
						} else ql.error("Ignoring metric with value >= " + this.uv, t);
					}
				}
			}, this.hv = () => {
				if (!this.Ts) {
					var t, i, e, r, s = !1, n = v.__PosthogExtensions__, o = null == n ? void 0 : n.postHogWebVitalsCallbacksByFlavor, a = (null == o ? void 0 : o[this.dv]) || ("web-vitals" === this.dv && K(o) ? null == n ? void 0 : n.postHogWebVitalsCallbacks : void 0);
					if (!K(a)) {
						var l = a.withoutAttribution, h = this.attributionMetrics;
						s = !K(l), t = h.indexOf("LCP") > -1 ? a.onLCP : (null == l ? void 0 : l.onLCP) || a.onLCP, i = h.indexOf("CLS") > -1 ? a.onCLS : (null == l ? void 0 : l.onCLS) || a.onCLS, e = h.indexOf("FCP") > -1 ? a.onFCP : (null == l ? void 0 : l.onFCP) || a.onFCP, r = h.indexOf("INP") > -1 ? a.onINP : (null == l ? void 0 : l.onINP) || a.onINP;
					}
					if (t && i && e && r) {
						var u = { reportSoftNavs: this.useSoftNavs }, d = s && this.attributionMetrics.indexOf("INP") > -1 ? _({}, u, { includeProcessedEventEntries: !1 }) : u;
						this.allowedMetrics.indexOf("LCP") > -1 && t(this.ov.bind(this), u), this.allowedMetrics.indexOf("CLS") > -1 && i(this.ov.bind(this), u), this.allowedMetrics.indexOf("FCP") > -1 && e(this.ov.bind(this), u), this.allowedMetrics.indexOf("INP") > -1 && r(this.ov.bind(this), d), this.Ts = !0;
					} else ql.error("web vitals callbacks not loaded - not starting");
				}
			}, this._instance = t, this.Vd = !(null == (i = this._instance.persistence) || !i.props[Ye]), this.startIfEnabled();
		}
		get vv() {
			return this._instance.config.capture_performance;
		}
		get allowedMetrics() {
			var t, i, e = W(this.vv) ? null == (t = this.vv) ? void 0 : t.web_vitals_allowed_metrics : void 0;
			return X(e) ? (null == (i = this._instance.persistence) ? void 0 : i.props[tr]) || Vl : e;
		}
		get flushToCaptureTimeoutMs() {
			return (W(this.vv) ? this.vv.web_vitals_delayed_flush_ms : void 0) || 5e3;
		}
		get attributionMetrics() {
			var t = W(this.vv) ? this.vv.web_vitals_attribution : void 0;
			return it(t) ? t ? Vl : [] : H(t) ? t : Wl;
		}
		get useAttribution() {
			return this.attributionMetrics.length > 0;
		}
		get useSoftNavs() {
			var t = W(this.vv) ? this.vv.__preview_web_vitals_soft_navs : void 0;
			return null != t && t;
		}
		get uv() {
			var t = W(this.vv) && Z(this.vv.__web_vitals_max_value) ? this.vv.__web_vitals_max_value : Hl;
			return t > 0 && 6e4 >= t ? Hl : t;
		}
		get isEnabled() {
			var t = null == s ? void 0 : s.protocol;
			if ("http:" !== t && "https:" !== t) return ql.info("Web Vitals are disabled on non-http/https protocols"), !1;
			var i = W(this.vv) ? this.vv.web_vitals : it(this.vv) ? this.vv : void 0;
			return it(i) ? i : this.Vd;
		}
		startIfEnabled() {
			this.isEnabled && !this.Ts && (ql.info("enabled, starting..."), this.Zs(this.hv));
		}
		onRemoteConfig(t) {
			if (t.ok) {
				var i = t.config;
				if ("capturePerformance" in i) {
					var e = W(i.capturePerformance) && !!i.capturePerformance.web_vitals, r = W(i.capturePerformance) ? i.capturePerformance.web_vitals_allowed_metrics : void 0;
					this._instance.persistence && (this._instance.persistence.register({ [Ye]: e }), this._instance.persistence.register({ [tr]: r })), this.Vd = e, this.startIfEnabled();
				}
			}
		}
		get dv() {
			return this.useSoftNavs ? this.useAttribution ? "web-vitals-with-attribution-soft-navs" : "web-vitals-soft-navs" : this.useAttribution ? "web-vitals-with-attribution" : "web-vitals";
		}
		Zs(t) {
			var i = v.__PosthogExtensions__, e = this.dv, r = null == i ? void 0 : i.postHogWebVitalsCallbacksByFlavor;
			null != r && r[e] || "web-vitals" === e && K(r) && null != i && i.postHogWebVitalsCallbacks ? t() : null == i || null == i.loadExternalDependency || i.loadExternalDependency(this._instance, e, ((i) => {
				i ? ql.error("failed to load script", i) : t();
			}));
		}
		lv(i) {
			var e = i || (null == t ? void 0 : t.location.href);
			if (e) {
				var r = this._instance.config.disable_capture_url_hashes ? xi(e) : e, s = this._instance.config.custom_personal_data_properties;
				return Wn(r, this._instance.config.mask_personal_data_properties ? [...Qn, ...s || []] : [], Zn);
			}
			ql.error("Could not determine current URL");
		}
	}
};
var Vh = {
	exceptionObserver: class {
		constructor(i) {
			var e;
			this.hv = () => {
				var i;
				if (t && this.isEnabled && null != (i = v.__PosthogExtensions__) && i.errorWrappingFunctions) {
					var e = v.__PosthogExtensions__.errorWrappingFunctions.wrapOnError, r = v.__PosthogExtensions__.errorWrappingFunctions.wrapUnhandledRejection, s = v.__PosthogExtensions__.errorWrappingFunctions.wrapConsoleError;
					try {
						!this.fv && this.vn.capture_unhandled_errors && (this.fv = e(this.captureException.bind(this))), !this.pv && this.vn.capture_unhandled_rejections && (this.pv = r(this.captureException.bind(this))), !this.gv && this.vn.capture_console_errors && (this.gv = s(this.captureException.bind(this)));
					} catch (t) {
						Ll.error("failed to start", t), this.mv();
					}
				}
			}, this._instance = i, this.yv = !(null == (e = this._instance.persistence) || !e.props[Ge]), this.de = new ft(_({}, function(t) {
				var i, e, r, s;
				return void 0 === t && (t = {}), {
					refillRate: null !== (i = null !== (e = t.exceptionRateLimiterRefillRate) && void 0 !== e ? e : t.__exceptionRateLimiterRefillRate) && void 0 !== i ? i : 1,
					bucketSize: null !== (r = null !== (s = t.exceptionRateLimiterBucketSize) && void 0 !== s ? s : t.__exceptionRateLimiterBucketSize) && void 0 !== r ? r : 10
				};
			}(this._instance.config.error_tracking), {
				refillInterval: 1e4,
				I: Ll
			})), this.vn = this.bv(), this.startIfEnabledOrStop();
		}
		bv() {
			var t = this._instance.config.capture_exceptions, i = {
				capture_unhandled_errors: !1,
				capture_unhandled_rejections: !1,
				capture_console_errors: !1
			};
			return W(t) ? i = _({}, i, t) : (K(t) ? this.yv : t) && (i = _({}, i, {
				capture_unhandled_errors: !0,
				capture_unhandled_rejections: !0
			})), i;
		}
		get isEnabled() {
			return this.vn.capture_console_errors || this.vn.capture_unhandled_errors || this.vn.capture_unhandled_rejections;
		}
		startIfEnabledOrStop() {
			this.isEnabled ? (Ll.info("enabled"), this.mv(), this.Zs(this.hv)) : this.mv();
		}
		Zs(t) {
			var i, e;
			null != (i = v.__PosthogExtensions__) && i.errorWrappingFunctions ? t() : null == (e = v.__PosthogExtensions__) || null == e.loadExternalDependency || e.loadExternalDependency(this._instance, "exception-autocapture", ((i) => {
				if (i) return Ll.error("failed to load script", i);
				t();
			}));
		}
		mv() {
			var t, i, e;
			null == (t = this.fv) || t.call(this), this.fv = void 0, null == (i = this.pv) || i.call(this), this.pv = void 0, null == (e = this.gv) || e.call(this), this.gv = void 0;
		}
		onRemoteConfig(t) {
			if (t.ok) {
				var i = t.config;
				"autocaptureExceptions" in i && (this.yv = !!i.autocaptureExceptions || !1, this._instance.persistence && this._instance.persistence.register({ [Ge]: this.yv }), this.vn = this.bv(), this.startIfEnabledOrStop());
			}
		}
		onConfigChange() {
			this.vn = this.bv();
		}
		captureException(t) {
			var i, e, r, s = null !== (i = null == t || null == (e = t.$exception_list) || null == (e = e[0]) ? void 0 : e.type) && void 0 !== i ? i : "Exception";
			this.de.consumeRateLimit(s) ? Ll.info("Skipping exception capture because of client rate limiting.", { exception: s }) : null == (r = this._instance.exceptions) || r.sendExceptionEvent(t);
		}
	},
	exceptions: class {
		constructor(t) {
			var i, e;
			this._v = [], this.wv = new ie([
				new ce(),
				new Ee(),
				new pe(),
				new fe(),
				new we(),
				new be(),
				new ge(),
				new xe()
			], function(t) {
				for (var i = arguments.length, e = new Array(i > 1 ? i - 1 : 0), r = 1; i > r; r++) e[r - 1] = arguments[r];
				return function(i, r) {
					void 0 === r && (r = 0);
					for (var s = [], n = i.split("\n"), o = r; n.length > o; o++) {
						var a = n[o];
						if (1024 >= a.length) {
							var l = ve.test(a) ? a.replace(ve, "$1") : a;
							if (!l.match(/\S*Error: /)) {
								for (var h of e) {
									var u = h(l, t);
									if (u) {
										s.push(u);
										break;
									}
								}
								if (s.length >= 50) break;
							}
						}
					}
					return function(t) {
						if (!t.length) return [];
						var i = Array.from(t);
						return i.reverse(), i.slice(0, 50).map(((t) => {
							return _({}, t, {
								filename: t.filename || (e = i, e[e.length - 1] || {}).filename,
								function: t.function || ee
							});
							var e;
						}));
					}(s);
				};
			}("web:javascript", le, de)), this._instance = t, this._v = null !== (i = null == (e = this._instance.persistence) ? void 0 : e.get_property(Ke)) && void 0 !== i ? i : [], this.Sv = Pe(this.xv()), this.Cv = new Re(this.Sv);
		}
		onConfigChange() {
			this.Sv = Pe(this.xv()), this.Cv.setConfig(this.Sv);
		}
		onRemoteConfig(t) {
			var i, e, r;
			if (t.ok) {
				var s = t.config;
				if ("errorTracking" in s) {
					var n = null !== (i = null == (e = s.errorTracking) ? void 0 : e.suppressionRules) && void 0 !== i ? i : [], o = null == (r = s.errorTracking) ? void 0 : r.captureExtensionExceptions;
					this._v = n, this._instance.persistence && this._instance.persistence.register({
						[Ke]: this._v,
						[Je]: o
					});
				}
			}
		}
		get Tv() {
			var t, i = !!this._instance.get_property(Je), e = this._instance.config.error_tracking.captureExtensionExceptions;
			return null !== (t = null != e ? e : i) && void 0 !== t && t;
		}
		buildProperties(t, i) {
			return this.wv.buildFromUnknown(t, {
				syntheticException: null == i ? void 0 : i.syntheticException,
				mechanism: { handled: null == i ? void 0 : i.handled }
			});
		}
		addExceptionStep(t, i) {
			if (this.Sv.enabled) try {
				if (!J(t) || 0 === t.trim().length) return void Ph.warn("Ignoring exception step because message must be a non-empty string");
				var e = function(t) {
					if (!t) return {
						sanitizedProperties: {},
						droppedKeys: []
					};
					var i = [];
					return {
						sanitizedProperties: Object.keys(t).reduce(((e, r) => Te.has(r) ? (i.push(r), e) : (e[r] = t[r], e)), {}),
						droppedKeys: i
					};
				}(this.Mv(i)), r = e.sanitizedProperties, s = e.droppedKeys;
				s.length > 0 && Ph.warn("Ignoring reserved exception step fields", { droppedKeys: s }), this.Cv.add(_({
					[Se]: t,
					[ke]: (/* @__PURE__ */ new Date()).toISOString()
				}, r));
			} catch (t) {
				Ph.error("Failed to add exception step. Ignoring breadcrumb.", t);
			}
		}
		sendExceptionEvent(t) {
			try {
				var i = t.$exception_list;
				if (this.Ev(i)) {
					if (this.Iv(i)) return this.Rv("Exception dropped: matched a suppression rule"), void Ph.info("Skipping exception capture because a suppression rule matched");
					if (!this.Tv && this.Pv(i)) return this.Rv("Exception dropped: thrown by a browser extension"), void Ph.info("Skipping exception capture because it was thrown by an extension");
					if (!this.Tv && this.Av(i)) return this.Rv("Exception dropped: thrown by an injected browser script"), void Ph.info("Skipping exception capture because it was thrown by an injected browser script");
					if (!this._instance.config.error_tracking.__capturePostHogExceptions && this.Fv(i)) return this.Rv("Exception dropped: thrown by the PostHog SDK"), void Ph.info("Skipping exception capture because it was thrown by the PostHog SDK");
				}
				var e = this.Sv.enabled && X(t.$exception_steps) ? this.Ov(t) : t, r = "string" == typeof (n = globalThis._posthogReleaseId) && n.length > 0 ? n : void 0;
				r && (e.$release_id = r);
				try {
					var s = this._instance.capture("$exception", e, {
						_noTruncate: !0,
						_batchKey: "exceptionEvent",
						jl: !0
					});
					return s && this.Cv.clear(), s;
				} catch (t) {
					Ph.error("Failed to capture exception event. Dropping this exception.", t), this.Cv.clear();
					return;
				}
			} catch (t) {
				Ph.error("Failed to process exception event. Ignoring this exception.", t);
				return;
			}
			var n;
		}
		Ov(t) {
			try {
				var i = this.Cv.getAttachable();
				return 0 === i.length ? t : _({}, t, { $exception_steps: i });
			} catch (i) {
				return Ph.error("Failed to read buffered exception steps. Capturing exception without steps.", i), t;
			}
		}
		Rv(t) {
			this.Sv.enabled && this.Cv.add({
				[Se]: t,
				[ke]: (/* @__PURE__ */ new Date()).toISOString()
			});
		}
		Mv(t) {
			return W(t) ? _({}, t) : {};
		}
		xv() {
			var t, i;
			return null !== (t = null == (i = this._instance.config.error_tracking) ? void 0 : i.exception_steps) && void 0 !== t ? t : {};
		}
		Iv(t) {
			if (0 === t.length) return !1;
			try {
				var i = t.reduce(((t, i) => {
					var e = i.type, r = i.value;
					return J(e) && e.length > 0 && t.$exception_types.push(e), J(r) && r.length > 0 && t.$exception_values.push(r), t;
				}), {
					$exception_types: [],
					$exception_values: []
				});
				return this._v.some(((t) => {
					var e = t.values.map(((t) => {
						var e = Ka[t.operator], r = i[t.key];
						if (!e || !r) return !1;
						var s = H(t.value) ? t.value : [t.value];
						return s.length > 0 && e(s, r);
					}));
					return "OR" === t.type ? e.some(Boolean) : e.every(Boolean);
				}));
			} catch (t) {
				return Ph.warn("Failed to evaluate suppression rules. Capturing the exception.", t), !1;
			}
		}
		Pv(t) {
			return t.flatMap(((t) => {
				var i, e;
				return null !== (i = null == (e = t.stacktrace) ? void 0 : e.frames) && void 0 !== i ? i : [];
			})).some(((t) => {
				var i = t.filename;
				return !!i && Rh.some(((t) => i.startsWith(t)));
			}));
		}
		Av(t) {
			return t.some(((t) => {
				var i = t.value;
				return J(i) && Ch.some(((t) => i.includes(t)));
			}));
		}
		Fv(t) {
			if (t.length > 0) {
				var i, e, r, s, n = null !== (i = null == (e = t[0].stacktrace) ? void 0 : e.frames) && void 0 !== i ? i : [], o = n[n.length - 1];
				return null !== (r = null == o || null == (s = o.filename) ? void 0 : s.includes("posthog.com/static")) && void 0 !== r && r;
			}
			return !1;
		}
		Ev(t) {
			return !X(t) && H(t);
		}
	}
};
var Wh = _({ productTours: class {
	get yo() {
		return this._instance.persistence;
	}
	constructor(t) {
		this.Lv = null, this.Dv = null, this._instance = t;
	}
	initialize() {
		this.loadIfEnabled();
	}
	onRemoteConfig(t) {
		if (t.ok) {
			var i = t.config;
			if ("productTours" in i) {
				var e, r;
				if (this.yo && this.yo.register({ [Xe]: !!i.productTours }), !rh(this._instance)) return !this.Lv && X(null == (e = this.yo) ? void 0 : e.props[Tr]) || eh.info("product tours disabled; stopping and clearing cached tours"), null == (r = this.Lv) || r.stop(), this.Lv = null, void this.clearCache();
				this.loadIfEnabled();
			}
		}
	}
	loadIfEnabled() {
		!this.Lv && rh(this._instance) && this.Zs((() => this.$v()));
	}
	Zs(t) {
		var i, e;
		null != (i = v.__PosthogExtensions__) && i.generateProductTours ? t() : null == (e = v.__PosthogExtensions__) || null == e.loadExternalDependency || e.loadExternalDependency(this._instance, "product-tours", ((i) => {
			i ? eh.error("Could not load product tours script", i) : t();
		}));
	}
	$v() {
		var t;
		!this.Lv && null != (t = v.__PosthogExtensions__) && t.generateProductTours && (this.Lv = v.__PosthogExtensions__.generateProductTours(this._instance, !0));
	}
	getProductTours(t, i) {
		if (void 0 === i && (i = !1), !H(this.Dv) || i) {
			var e = this.yo;
			if (e) {
				var r = e.props[Tr];
				if (H(r) && !i) return this.Dv = r, void t(r, { isLoaded: !0 });
			}
			this._instance._send_request({
				url: this._instance.requestRouter.endpointFor("api", "/api/product_tours/?token=" + this._instance.config.token),
				method: "GET",
				timestampMode: "query",
				callback: (i) => {
					if (rh(this._instance)) {
						var r = i.statusCode;
						if (200 !== r || !i.json) {
							var s = "Product Tours API could not be loaded, status: " + r;
							0 === r ? i.error || eh.warn(s) : eh.error(s), t([], {
								isLoaded: !1,
								error: s
							});
							return;
						}
						var n = H(i.json.product_tours) ? i.json.product_tours : [];
						this.Dv = n, e && e.register({ [Tr]: n }), t(n, { isLoaded: !0 });
					} else t([], { isLoaded: !0 });
				}
			});
		} else t(this.Dv, { isLoaded: !0 });
	}
	getActiveProductTours(t) {
		X(this.Lv) ? t([], {
			isLoaded: !1,
			error: "Product tours not loaded"
		}) : this.Lv.getActiveProductTours(t);
	}
	showProductTour(t) {
		var i;
		null == (i = this.Lv) || i.showTourById(t);
	}
	previewTour(t) {
		this.Lv ? this.Lv.previewTour(t) : this.Zs((() => {
			var i;
			this.$v(), null == (i = this.Lv) || i.previewTour(t);
		}));
	}
	dismissProductTour() {
		var t;
		null == (t = this.Lv) || t.dismissTour("user_clicked_skip");
	}
	nextStep() {
		var t;
		null == (t = this.Lv) || t.nextStep();
	}
	previousStep() {
		var t;
		null == (t = this.Lv) || t.previousStep();
	}
	clearCache() {
		var t;
		this.Dv = null, null == (t = this.yo) || t.unregister(Tr);
	}
	resetTour(t) {
		var i;
		null == (i = this.Lv) || i.resetTour(t);
	}
	resetAllTours() {
		var t;
		null == (t = this.Lv) || t.resetAllTours();
	}
	cancelPendingTour(t) {
		var i;
		null == (i = this.Lv) || i.cancelPendingTour(t);
	}
} }, zh);
var Gh = { siteApps: class {
	constructor(t) {
		this.Nv = 0, this._instance = t, this.qv = [], this.apps = {};
	}
	get isEnabled() {
		return !!this._instance.config.opt_in_site_apps;
	}
	jv(t, i) {
		if (i) {
			var e = this.globalsForEvent(i);
			this.qv.push(e), this.qv.length > 1e3 && (this.qv = this.qv.slice(10));
		}
	}
	get siteAppLoaders() {
		var t;
		return null == (t = v._POSTHOG_REMOTE_CONFIG) || null == (t = t[this._instance.config.token]) ? void 0 : t.siteApps;
	}
	initialize() {
		if (this.isEnabled) {
			var t = this._instance._addCaptureHook(this.jv.bind(this));
			this.Bv = () => {
				t(), this.qv = [], this.Bv = void 0;
			};
		}
	}
	globalsForEvent(t) {
		var i, e, r, s, n, o, a;
		if (!t) throw new Error("Event payload is required");
		var l = {}, h = this._instance.get_property("$groups") || [], u = this._instance.get_property("$stored_group_properties") || {};
		for (var d of Object.entries(u)) {
			var v = d[0];
			l[v] = {
				id: h[v],
				type: v,
				properties: d[1]
			};
		}
		var c = t.$set_once, f = t.$set;
		return {
			event: _({}, g(t, sh), {
				properties: _({}, t.properties, f ? { $set: _({}, null !== (i = null == (e = t.properties) ? void 0 : e.$set) && void 0 !== i ? i : {}, f) } : {}, c ? { $set_once: _({}, null !== (r = null == (s = t.properties) ? void 0 : s.$set_once) && void 0 !== r ? r : {}, c) } : {}),
				elements_chain: null !== (n = null == (o = t.properties) ? void 0 : o.$elements_chain) && void 0 !== n ? n : "",
				distinct_id: null == (a = t.properties) ? void 0 : a.distinct_id
			}),
			person: { properties: this._instance.get_property("$stored_person_properties") },
			groups: l
		};
	}
	Hv(t) {
		var i, e = null == (i = t.tagName) ? void 0 : i.toLowerCase();
		return "style" === e && this._instance.config.prepare_external_dependency_stylesheet ? this._instance.config.prepare_external_dependency_stylesheet(t) || (nh.error("prepare_external_dependency_stylesheet returned null"), null) : "script" === e && this._instance.config.prepare_external_dependency_script ? this._instance.config.prepare_external_dependency_script(t) || (nh.error("prepare_external_dependency_script returned null"), null) : t;
	}
	zv() {
		var t, i, e, s, n, o, a, l;
		if (!this._instance.config.prepare_external_dependency_stylesheet && !this._instance.config.prepare_external_dependency_script) return () => {};
		var h = null == r ? void 0 : r.defaultView, u = null == h || null == (t = h.Node) ? void 0 : t.prototype;
		if (!h || !u) return () => {};
		if (this.Nv++, this.Uv) return this.Wv();
		var d = [], v = this, c = /* @__PURE__ */ new WeakSet(), f = (t, i, e) => {
			if (null != t && t[i]) {
				var r = t[i];
				t[i] = e(r), d.push((() => {
					t[i] = r;
				}));
			}
		}, p = (t) => {
			if (c.has(t)) return t;
			var i = v.Hv(t);
			return i && c.add(i), i;
		}, _ = (t) => t.map(((t) => "string" == typeof t ? t : p(t))).filter(((t) => !Q(t)));
		return f(u, "appendChild", ((t) => function(i) {
			var e = p(i);
			return e ? t.call(this, e) : i;
		})), f(u, "insertBefore", ((t) => function(i, e) {
			var r = p(i);
			return r ? t.call(this, r, e) : i;
		})), f(u, "replaceChild", ((t) => function(i, e) {
			var r = p(i);
			return r ? t.call(this, r, e) : e;
		})), [
			null == (i = h.Element) ? void 0 : i.prototype,
			null == (e = h.Document) ? void 0 : e.prototype,
			null == (s = h.DocumentFragment) ? void 0 : s.prototype
		].forEach(((t) => {
			f(t, "append", ((t) => function() {
				for (var i = arguments.length, e = new Array(i), r = 0; i > r; r++) e[r] = arguments[r];
				return t.apply(this, _(e));
			})), f(t, "prepend", ((t) => function() {
				for (var i = arguments.length, e = new Array(i), r = 0; i > r; r++) e[r] = arguments[r];
				return t.apply(this, _(e));
			}));
		})), [
			null == (n = h.Element) ? void 0 : n.prototype,
			null == (o = h.CharacterData) ? void 0 : o.prototype,
			null == (a = h.DocumentType) ? void 0 : a.prototype
		].forEach(((t) => {
			f(t, "before", ((t) => function() {
				for (var i = arguments.length, e = new Array(i), r = 0; i > r; r++) e[r] = arguments[r];
				return t.apply(this, _(e));
			})), f(t, "after", ((t) => function() {
				for (var i = arguments.length, e = new Array(i), r = 0; i > r; r++) e[r] = arguments[r];
				return t.apply(this, _(e));
			})), f(t, "replaceWith", ((t) => function() {
				for (var i = arguments.length, e = new Array(i), r = 0; i > r; r++) e[r] = arguments[r];
				var s = _(e);
				return e.length && !s.length ? void 0 : t.apply(this, s);
			}));
		})), f(null == (l = h.Element) ? void 0 : l.prototype, "insertAdjacentElement", ((t) => function(i, e) {
			var r = p(e);
			return r ? t.call(this, i, r) : null;
		})), this.Uv = () => {
			d.forEach(((t) => t())), this.Uv = void 0;
		}, this.Wv();
	}
	Wv() {
		var t = !1;
		return () => {
			var i;
			t || (t = !0, this.Nv--, 0 === this.Nv && (null == (i = this.Uv) || i.call(this)));
		};
	}
	Vv(t, i) {
		void 0 === i && (i = !0);
		var e = this.zv();
		try {
			var r = t(e);
			return i && e(), r;
		} catch (t) {
			throw e(), t;
		}
	}
	setupSiteApp(t) {
		var i = this.apps[t.id], e = () => {
			var e;
			!i.errored && this.qv.length && (nh.info("Processing " + this.qv.length + " events for site app with id " + t.id), this.qv.forEach(((t) => this.Vv((() => null == i.processEvent ? void 0 : i.processEvent(t))))), i.processedBuffer = !0), Object.values(this.apps).every(((t) => t.processedBuffer || t.errored)) && (null == (e = this.Bv) || e.call(this));
		}, r = !1, s = (s) => {
			i.errored = !s, i.loaded = !0, nh.info("Site app with id " + t.id + " " + (s ? "loaded" : "errored")), r && e();
		};
		try {
			var n = this.Vv(((i) => t.init({
				posthog: this._instance,
				callback(t) {
					i(), s(t);
				}
			})), !1).processEvent;
			n && (i.processEvent = n), r = !0;
		} catch (i) {
			nh.error(oh + t.id, i), s(!1);
		}
		if (r && i.loaded) try {
			e();
		} catch (e) {
			nh.error("Error while processing buffered events PostHog app with config id " + t.id, e), i.errored = !0;
		}
	}
	Gv() {
		var t = this.siteAppLoaders || [];
		for (var i of t) this.apps[i.id] = {
			id: i.id,
			loaded: !1,
			errored: !1,
			processedBuffer: !1
		};
		for (var e of t) this.setupSiteApp(e);
	}
	Zv(t) {
		var i = this;
		if (0 !== Object.keys(this.apps).length) {
			var e = this.globalsForEvent(t), r = function(r) {
				try {
					i.Vv((() => null == r.processEvent ? void 0 : r.processEvent(e)));
				} catch (i) {
					nh.error("Error while processing event " + t.event + " for site app " + r.id, i);
				}
			};
			for (var s of Object.values(this.apps)) r(s);
		}
	}
	onRemoteConfig(t) {
		var i, e, r, s = this;
		if (null != (i = this.siteAppLoaders) && i.length) return this.isEnabled ? (this.Gv(), void this._instance.on("eventCaptured", ((t) => this.Zv(t)))) : void nh.error("PostHog site apps are disabled. Enable the \"opt_in_site_apps\" config to proceed.");
		if (null == (e = this.Bv) || e.call(this), t.ok) {
			var n = t.config;
			if (null != (r = n.siteApps) && r.length) if (this.isEnabled) {
				var o = function() {
					var t, i = a.id, e = a.url;
					v["__$$ph_site_app_" + i] = s._instance, null == (t = v.__PosthogExtensions__) || null == t.loadSiteApp || t.loadSiteApp(s._instance, e, ((t) => {
						if (t) return nh.error(oh + i, t);
					}));
				};
				for (var a of n.siteApps) o();
			} else nh.error("PostHog site apps are disabled. Enable the \"opt_in_site_apps\" config to proceed.");
		}
	}
} };
var Kh = { tracingHeaders: class {
	constructor(t) {
		this.Qv = void 0, this.Jv = void 0, this.Kv = void 0, this.hv = () => {
			var t, i, e = this.Yv();
			e ? (K(this.Qv) && (this.Qv = null == (t = v.__PosthogExtensions__) || null == (t = t.tracingHeadersPatchFns) ? void 0 : t._patchXHR(e, (() => this._instance.get_distinct_id()), this._instance.sessionManager)), K(this.Jv) && (this.Jv = null == (i = v.__PosthogExtensions__) || null == (i = i.tracingHeadersPatchFns) ? void 0 : i._patchFetch(e, (() => this._instance.get_distinct_id()), this._instance.sessionManager))) : this.mv();
		}, this._instance = t;
	}
	initialize() {
		this.startIfEnabledOrStop();
	}
	Zs(t) {
		var i, e;
		null != (i = v.__PosthogExtensions__) && i.tracingHeadersPatchFns ? t() : null == (e = v.__PosthogExtensions__) || null == e.loadExternalDependency || e.loadExternalDependency(this._instance, "tracing-headers", ((i) => {
			if (i) return zl.error("failed to load script", i);
			t();
		}));
	}
	Xv() {
		var t, i;
		return null !== (t = null !== (i = this._instance.config.tracing_headers) && void 0 !== i ? i : this._instance.config.addTracingHeaders) && void 0 !== t ? t : this._instance.config.__add_tracing_headers;
	}
	Yv() {
		var t = this.Xv();
		return H(t) ? (H(this.Kv) ? this.Kv.splice(0, this.Kv.length, ...t) : this.Kv = [...t], t.length > 0 ? this.Kv : void 0) : (H(this.Kv) && this.Kv.splice(0), this.Kv = t || void 0, this.Kv);
	}
	mv() {
		var t, i;
		null == (t = this.Qv) || t.call(this), null == (i = this.Jv) || i.call(this), this.Qv = void 0, this.Jv = void 0;
	}
	startIfEnabledOrStop() {
		this.Yv() ? this.Zs(this.hv) : this.mv();
	}
} };
var Jh = _({ surveys: class extends uh {
	constructor(t) {
		var i;
		super(new _h(t), {
			get projectToken() {
				return i.config.token;
			},
			kv: new ph(i = t)
		}), this._instance = t;
	}
	du(t, i) {
		var e = i.query ? wa(t, i.query) : t;
		return new Promise(((t) => {
			var r;
			this._instance._send_request({
				method: i.method,
				url: this._instance.requestRouter.endpointFor(null !== (r = i.target) && void 0 !== r ? r : "api", e),
				data: i.body,
				headers: i.headers,
				timeout: i.timeoutMs,
				fireCallbackOnDrop: !0,
				transport: i.transport,
				compression: i.compression,
				timestampMode: i.sentAt,
				callback: t
			});
		}));
	}
} }, zh);
var Yh = { toolbar: class {
	constructor(t) {
		this.instance = t;
	}
	tc(t) {
		v.ph_toolbar_state = t;
	}
	ec() {
		var t;
		return null !== (t = v.ph_toolbar_state) && void 0 !== t ? t : 0;
	}
	initialize() {
		return this.maybeLoadToolbar();
	}
	maybeLoadToolbar(i, e, s) {
		if (void 0 === i && (i = void 0), void 0 === e && (e = void 0), void 0 === s && (s = void 0), ds(this.instance.config)) return !1;
		if (!t || !r) return !1;
		i = null != i ? i : t.location, s = null != s ? s : t.history;
		try {
			if (!e) {
				try {
					t.localStorage.setItem("test", "test"), t.localStorage.removeItem("test");
				} catch (t) {
					return !1;
				}
				e = null == t ? void 0 : t.localStorage;
			}
			var n, o = gh || Gn(i.hash, "__posthog") || Gn(i.hash, "state"), a = o ? ns((() => JSON.parse(atob(decodeURIComponent(o))))) || ns((() => JSON.parse(decodeURIComponent(o)))) : null;
			return a && "ph_authorize" === a.action ? ((n = a).source = "url", n && Object.keys(n).length > 0 && (a.desiredHash ? i.hash = a.desiredHash : s ? s.replaceState(s.state, "", i.pathname + i.search) : i.hash = "")) : ((n = JSON.parse(e.getItem(mh) || "{}")).source = "localstorage", delete n.userIntent), !(!n.token || this.instance.config.token !== n.token || (this.loadToolbar(n), 0));
		} catch (t) {
			return !1;
		}
	}
	ic(t) {
		var i = v.ph_load_toolbar || v.ph_load_editor;
		!X(i) && V(i) ? i(t, this.instance) : yh.warn("No toolbar load function found");
	}
	loadToolbar(i) {
		var e = !(null == r || !r.getElementById(Bs));
		if (!t || e) return !1;
		var s = "custom" === this.instance.requestRouter.region && this.instance.config.advanced_disable_toolbar_metrics, n = _({ token: this.instance.config.token }, i, { apiURL: this.instance.requestRouter.endpointFor("ui") }, s ? { instrument: !1 } : {});
		if (t.localStorage.setItem(mh, JSON.stringify(_({}, n, { source: void 0 }))), 2 === this.ec()) this.ic(n);
		else if (0 === this.ec()) {
			var o;
			this.tc(1), null == (o = v.__PosthogExtensions__) || null == o.loadExternalDependency || o.loadExternalDependency(this.instance, "toolbar", ((t) => {
				if (t) return yh.error("[Toolbar] Failed to load", t), void this.tc(0);
				this.tc(2), this.ic(n);
			})), us(t, "turbolinks:load", (() => {
				this.tc(0), this.loadToolbar(n);
			}));
		}
		return !0;
	}
	rc(t) {
		return this.loadToolbar(t);
	}
	maybeLoadEditor(t, i, e) {
		return void 0 === t && (t = void 0), void 0 === i && (i = void 0), void 0 === e && (e = void 0), this.maybeLoadToolbar(t, i, e);
	}
} };
var Qh = _({ experiments: Ah }, zh);
var iu = _({}, zh, qh, Hh, Vh, Wh, Gh, Jh, Kh, Yh, Qh, { conversations: class {
	constructor(t) {
		this.nc = void 0, this._conversationsManager = null, this.sc = !1, this.Fe = null, this.ac = !1, this._instance = t;
	}
	initialize() {
		this.loadIfEnabled();
	}
	onRemoteConfig(t) {
		if (!this._instance.config.disable_conversations && (this.oc = t.ok, t.ok)) {
			var i = t.config.conversations;
			X(i) || (it(i) ? this.nc = i : (this.nc = i.enabled, this.Fe = i), this.loadIfEnabled());
		}
	}
	reset() {
		var t;
		null == (t = this._conversationsManager) || t.reset(), this._conversationsManager = null, this.nc = void 0, this.Fe = null, this.oc = void 0, this.ac = !1;
	}
	loadIfEnabled() {
		if (!(this._conversationsManager || this.sc || this._instance.config.disable_conversations || ds(this._instance.config) || this._instance.config.cookieless_mode && this._instance.consent.isOptedOut())) {
			var t = null == v ? void 0 : v.__PosthogExtensions__;
			if (t && !K(this.nc) && this.nc) if (this.Fe && this.Fe.token) {
				this.sc = !0;
				try {
					var i = t.initConversations;
					if (i) return this.lc(i), void (this.sc = !1);
					var e = t.loadExternalDependency;
					if (!e) return void this.uc(qr);
					e(this._instance, "conversations", ((i) => {
						i || !t.initConversations ? this.uc("Could not load conversations script", i) : this.lc(t.initConversations), this.sc = !1;
					}));
				} catch (t) {
					this.uc("Error initializing conversations", t), this.sc = !1;
				}
			} else Fh.error("Conversations enabled but missing token in remote config.");
		}
	}
	lc(t) {
		if (this.Fe) try {
			this._conversationsManager = t(this.Fe, this._instance), this.ac = !1, Fh.info("Conversations loaded successfully");
		} catch (t) {
			this.uc("Error completing conversations initialization", t);
		}
		else Fh.error("Cannot complete initialization: remote config is null");
	}
	uc(t, i) {
		Fh.error(t, i), this._conversationsManager = null, this.sc = !1, this.ac = !0;
	}
	show() {
		this._conversationsManager ? this._conversationsManager.show() : Fh.warn("Conversations not loaded yet.");
	}
	hide() {
		this._conversationsManager && this._conversationsManager.hide();
	}
	isAvailable() {
		return !0 === this.nc && !Q(this._conversationsManager);
	}
	getUnavailableReason() {
		return this.isAvailable() ? null : this._instance.config.disable_conversations ? "disabled_by_config" : ds(this._instance.config) ? "disabled_for_toolbar" : this._instance.config.cookieless_mode && this._instance.consent.isOptedOut() ? "consent_opted_out" : !1 === this.oc ? "remote_config_failed" : K(this.nc) ? this.oc ? "disabled_in_project" : "remote_config_pending" : this.nc ? X(this.Fe) || !this.Fe.token ? "missing_token" : null != v && v.__PosthogExtensions__ ? this.sc ? "initializing" : this.ac ? "load_failed" : "not_loaded" : "extensions_unavailable" : "disabled_in_project";
	}
	isVisible() {
		var t, i;
		return null !== (t = null == (i = this._conversationsManager) ? void 0 : i.isVisible()) && void 0 !== t && t;
	}
	sendMessage(t, i, e) {
		var r = this;
		return p((function* () {
			return r._conversationsManager ? r._conversationsManager.sendMessage(t, i, e) : (Fh.warn(Mh), null);
		}))();
	}
	getMessages(t, i) {
		var e = this;
		return p((function* () {
			return e._conversationsManager ? e._conversationsManager.getMessages(t, i) : (Fh.warn(Mh), null);
		}))();
	}
	markAsRead(t) {
		var i = this;
		return p((function* () {
			return i._conversationsManager ? i._conversationsManager.markAsRead(t) : (Fh.warn(Mh), null);
		}))();
	}
	getTickets(t) {
		var i = this;
		return p((function* () {
			return i._conversationsManager ? i._conversationsManager.getTickets(t) : (Fh.warn(Mh), null);
		}))();
	}
	requestRestoreLink(t) {
		var i = this;
		return p((function* () {
			return i._conversationsManager ? i._conversationsManager.requestRestoreLink(t) : (Fh.warn(Mh), null);
		}))();
	}
	restoreFromToken(t) {
		var i = this;
		return p((function* () {
			return i._conversationsManager ? i._conversationsManager.restoreFromToken(t) : (Fh.warn(Mh), null);
		}))();
	}
	restoreFromUrlToken() {
		var t = this;
		return p((function* () {
			return t._conversationsManager ? t._conversationsManager.restoreFromUrlToken() : (Fh.warn(Mh), null);
		}))();
	}
	getCurrentTicketId() {
		var t, i;
		return null !== (t = null == (i = this._conversationsManager) ? void 0 : i.getCurrentTicketId()) && void 0 !== t ? t : null;
	}
	getWidgetSessionId() {
		var t, i;
		return null !== (t = null == (i = this._conversationsManager) ? void 0 : i.getWidgetSessionId()) && void 0 !== t ? t : null;
	}
	Ql() {
		var t;
		null == (t = this._conversationsManager) || t.setIdentity();
	}
	Jl() {
		var t;
		null == (t = this._conversationsManager) || t.clearIdentity();
	}
} }, { logs: class {
	constructor(i) {
		var e, r = this;
		this.name = "logs", this.hc = !1, this.dc = !1, this.vc = !1, this.I = Ae("[logs]"), this.cc = _({}, this.I, { error() {
			for (var t = arguments.length, i = new Array(t), e = 0; t > e; e++) i[e] = arguments[e];
			i.some(Bh) || r.I.error(...i);
		} }), this.Za = [], this.fc = [], this.Hh = 0, this.Rs = !1, this.gc = [], this.mc = [], this.yc = !1, this.bc = !1, this._c = () => {
			var t, i;
			this.Rs || (this.Hh = 0, null == (t = this.wc) || t.onReconnect(), null == (i = this.kc) || i.onReconnect());
		}, this._instance = i, this._instance && null != (e = this._instance.config.logs) && e.captureConsoleLogs && (this.hc = !0), t && us(t, "online", this._c);
	}
	Sc(t, i, e, r) {
		var s, n = Dh(null == (s = this._instance) || null == (s = s.config) ? void 0 : s.logs, e);
		return [new Wi(this.xc(t, i), n, this.cc, (() => this.Cc()), ((t) => t()), void 0, r), n];
	}
	Tc() {
		var t, i = null == (t = this._instance) || null == (t = t.config) ? void 0 : t.logs;
		if (!this.wc || this.Mc !== i) {
			var e;
			null == (e = this.wc) || e.reset(), this.Mc = i;
			var r = this.Sc((() => this.Za), ((t) => {
				this.Za = t;
			}));
			this.wc = r[0], this.Ec = r[1];
		}
		return this.wc;
	}
	Ic() {
		var t, i = null == (t = this._instance) || null == (t = t.config) ? void 0 : t.logs;
		if (!this.kc || this.Rc !== i) {
			var e;
			null == (e = this.kc) || e.reset(), this.Rc = i;
			var r = this.Sc((() => this.fc), ((t) => {
				this.fc = t;
			}), {
				serviceNameDefault: "posthog-browser-logs",
				consoleCapture: !0
			}, Lh);
			this.kc = r[0], this.Pc = r[1];
		}
		return this.kc;
	}
	setup(t) {
		var i;
		if (!this.Rs) {
			this.Os = t, null != (i = this._instance) && null != (i = i.config) && null != (i = i.logs) && i.captureConsoleLogs && (this.hc = !0), (this.hc || this.Ac() && this.Fc()) && this.Oc();
			var e = !1, r = t.onRemoteConfig(((t) => {
				var i;
				e = t.ok && !0 === (null == (i = t.config.logs) ? void 0 : i.captureConsoleLogs), this.onRemoteConfig(t);
			}));
			this.Rs ? r.dispose() : (this.Ls = r, e || this.loadIfEnabled());
		}
	}
	dispose() {
		var i, e, r, s;
		this.Rs || (this.Rs = !0, this.Lc(), null == (i = this.Ls) || i.dispose(), this.Ls = void 0, this.Os = void 0, this.vc = !1, t?.removeEventListener("online", this._c), null == (e = this.Dc) || e.call(this), this.Dc = void 0, null == (r = this.wc) || r.reset(), null == (s = this.kc) || s.reset());
	}
	onRemoteConfig(t) {
		var i, e;
		if (!this.Rs) {
			var r = t.ok ? null == (i = t.config.logs) ? void 0 : i.captureConsoleLogs : void 0;
			X(r) ? this.$c() : (null == (e = this._instance) || null == (e = e.persistence) || e.register({ [Ze]: !!r }), r ? (this.hc = !0, this.dc || this.Oc(), this.loadIfEnabled()) : this.$c());
		}
	}
	reset() {
		var t, i, e, r;
		this.Lc(), null == (t = this.wc) || t.clearQueue(), this.Za = [], null == (i = this.wc) || i.reset(), null == (e = this.kc) || e.clearQueue(), this.fc = [], null == (r = this.kc) || r.reset(), this.Hh = 0;
	}
	captureLog(t) {
		this.Rs || this.Tc().captureLog(t);
	}
	captureConsoleLog(t) {
		this.Rs || this.Ic().captureLog(t);
	}
	captureBufferedConsoleLog(t, i, e) {
		this.Rs || this.Ic().captureLog(t, {
			context: i,
			occurredAtMs: e
		});
	}
	Fc() {
		var t;
		return !(null == (t = this._instance) || null == (t = t.persistence) || null == (t = t.props) || !t[Ze]);
	}
	Ac() {
		var t, i;
		return null == (t = this._instance) || null == t.Ua || !t.Ua() || !(null == (i = v._POSTHOG_REMOTE_CONFIG) || null == (i = i[this._instance.config.token]) || !i.config);
	}
	Yl() {
		var t;
		this.Lc(), null == (t = this.kc) || t.clearQueue(), this.fc = [];
	}
	$c() {
		this.hc || this.Lc();
	}
	Oc() {
		var t, i = this;
		if (!this.yc && null != v && v.console) {
			var e = Dh(null == (t = this._instance) || null == (t = t.config) ? void 0 : t.logs).maxBufferSize, r = function(t) {
				var r;
				try {
					r = ((t) => {
						for (; null != (i = t) && i.__rrweb_original__;) {
							var i;
							t = t.__rrweb_original__;
						}
						return t;
					})(v.console[t]);
				} catch (t) {
					return 0;
				}
				if (!r) return 0;
				i.mc.push(Bl(v.console, t, ((s) => {
					var n = function() {
						for (var r = arguments.length, n = new Array(r), o = 0; r > o; o++) n[o] = arguments[o];
						try {
							i.Nc(t, n, e);
						} catch (t) {}
						return s.apply(v.console, n);
					};
					return n.__rrweb_original__ = r, n;
				})));
			};
			for (var s of Nh) r(s);
			this.yc = !0, this.qc = setTimeout((() => {
				this.Lc();
			}), 3e4);
		}
	}
	Nc(t, i, e) {
		var r;
		if (this.yc && !this.bc && 0 !== i.length) if (null != (r = this._instance) && r.is_capturing()) {
			if (e > this.gc.length) {
				this.bc = !0;
				try {
					this.gc.push({
						level: t,
						args: i,
						occurredAtMs: Date.now(),
						context: this.Cc()
					});
				} finally {
					this.bc = !1;
				}
			}
		} else this.Lc();
	}
	Lc() {
		if (this.gc = [], this.yc) {
			for (var t of (this.yc = !1, this.qc && (clearTimeout(this.qc), this.qc = void 0), this.mc)) t();
			this.mc = [];
		}
	}
	jc() {
		var t = this.gc;
		return this.Lc(), t;
	}
	get logger() {
		return this.Bc || (this.Bc = {
			trace: (t, i) => this.captureLog({
				body: t,
				level: "trace",
				attributes: i
			}),
			debug: (t, i) => this.captureLog({
				body: t,
				level: "debug",
				attributes: i
			}),
			info: (t, i) => this.captureLog({
				body: t,
				level: "info",
				attributes: i
			}),
			warn: (t, i) => this.captureLog({
				body: t,
				level: "warn",
				attributes: i
			}),
			error: (t, i) => this.captureLog({
				body: t,
				level: "error",
				attributes: i
			}),
			fatal: (t, i) => this.captureLog({
				body: t,
				level: "fatal",
				attributes: i
			})
		}), this.Bc;
	}
	flushLogs(t) {
		t ? this.Hc(t) : (this.wc && this.wc.flush().catch(((t) => this.zc(t))), this.kc && this.kc.flush().catch(((t) => this.zc(t))));
	}
	zc(t) {
		Bh(t) || this.I.error("PostHog logs flush failed:", t);
	}
	loadIfEnabled() {
		if (!this.Rs && this.hc && !this.dc && !this.vc) {
			var t = null == v ? void 0 : v.__PosthogExtensions__;
			if (!t) return this.I.error("PostHog Extensions not found."), void this.Lc();
			var i = t.loadExternalDependency;
			if (!i) return this.I.error(qr), void this.Lc();
			this.vc = !0;
			try {
				i(this._instance, "logs", ((i) => {
					if (this.vc = !1, !this.Rs && this.hc) {
						var e = t.logs;
						if (i || null == e || !e.initializeLogs) this.I.error("Could not load logs script", i), this.Lc();
						else {
							var r, s, n = this.jc();
							this.Dc = e.initializeLogs(null !== (r = this.Os) && void 0 !== r ? r : this._instance), this.dc = !0, n.length > 0 && (null == e.replayConsoleBuffer || e.replayConsoleBuffer(null !== (s = this.Os) && void 0 !== s ? s : this._instance, n));
						}
					}
				}));
			} catch (t) {
				throw this.vc = !1, t;
			}
		}
	}
	xc(t, i) {
		var e = this._instance;
		return {
			get isDisabled() {
				return !1;
			},
			get optedOut() {
				return !e.is_capturing();
			},
			getPersistedProperty: (i) => i === x.LogsQueue ? t() : void 0,
			setPersistedProperty(t, e) {
				var r;
				t === x.LogsQueue && i(null !== (r = e) && void 0 !== r ? r : []);
			},
			es: (t) => this.es(t),
			getLibraryId: () => c.LIB_NAME,
			getLibraryVersion: () => c.LIB_VERSION
		};
	}
	es(t) {
		return new Promise(((i) => {
			if (Kn(this.Hh, 3)) i({
				kind: "fatal",
				error: jh(void 0, "logs endpoint is unreachable, dropping batch")
			});
			else {
				var e = !1, r = (t) => {
					e || (e = !0, clearTimeout(s), i(t));
				}, s = setTimeout((() => {
					this.I.warn("Logs request timed out before receiving a response"), r({
						kind: "retry-later",
						error: jh(void 0, "logs request timed out")
					});
				}), 9e4);
				this._instance._send_request({
					method: "POST",
					url: this.Uc(),
					data: t,
					compression: "best-available",
					batchKey: "logs",
					fireCallbackOnDrop: !0,
					callback: (t) => {
						var i = t.statusCode;
						if (this.Wc(i), i >= 200 && 300 > i) r({ kind: "ok" });
						else if (413 === i) r({ kind: "too-large" });
						else if (0 !== i && 408 !== i && 429 !== i && 500 > i) r({
							kind: "fatal",
							error: /* @__PURE__ */ new Error("logs request failed with status " + i)
						});
						else {
							var e;
							0 === i ? (t.error || this.I.warn("Logs request failed before receiving an HTTP response"), r({
								kind: "retry-later",
								error: jh(t.error, "logs request failed before receiving an HTTP response")
							})) : r({
								kind: "retry-later",
								error: null !== (e = t.error) && void 0 !== e ? e : /* @__PURE__ */ new Error("logs request failed with status " + i)
							});
						}
					}
				});
			}
		}));
	}
	Wc(t) {
		(0 !== t || this._instance.__loaded) && (this.Hh = Jn(t, this.Hh, 3, (() => this.I.warn("Log requests are failing before receiving an HTTP response; this can happen due to network issues, CORS, browser blocking, or ad blockers. Stopped sending logs; will try again when connectivity changes."))));
	}
	Hc(t) {
		this.Za.length > 0 && this.Vc(t, this.Za, this.Ec, c.LIB_NAME, ((t) => {
			this.Za = t;
		})), this.fc.length > 0 && this.Vc(t, this.fc, this.Pc, Lh, ((t) => {
			this.fc = t;
		}));
	}
	Vc(t, i, e, r, s) {
		if (0 !== i.length) {
			var n = i.map(((t) => t.record));
			s([]);
			var o = Vi(n, Hi(e, c.LIB_NAME, c.LIB_VERSION), r, c.LIB_VERSION);
			this._instance._send_request({
				method: "POST",
				url: this.Uc(),
				data: o,
				compression: "best-available",
				batchKey: "logs",
				transport: t
			});
		}
	}
	Uc() {
		return this._instance.requestRouter.endpointFor("api", "/i/v1/logs") + "?token=" + encodeURIComponent(this._instance.config.token);
	}
	Cc() {
		var t, i = {};
		if (i.distinctId = this._instance.get_distinct_id(), this._instance.sessionManager) {
			var e = this._instance.sessionManager.checkAndGetSessionAndWindowId(!0), r = e.windowId, s = e.sessionStartTimestamp, n = e.lastActivityTimestamp;
			i.sessionId = e.sessionId, i.windowId = r, X(s) || (i.sessionStartTimestamp = s), X(n) || (i.lastActivityTimestamp = n);
		}
		if (null != v && null != (t = v.location) && t.href && (i.currentUrl = this._instance.config.disable_capture_url_hashes ? xi(v.location.href) : v.location.href), this._instance.featureFlags) {
			var o = this._instance.featureFlags.getFlags();
			o && o.length > 0 && (i.activeFeatureFlags = o);
		}
		return i;
	}
} }, { metrics: class {
	constructor(t) {
		this.I = Ae("[metrics]"), this._instance = t;
	}
	initialize() {}
	Tc() {
		var t, i, e = null == (t = this._instance) || null == (t = t.config) ? void 0 : t.metrics;
		return this.wc && this.Mc === e || (null == (i = this.wc) || i.reset(), this.Mc = e, this.wc = new Yi(this.xc(), function(t) {
			var i, e, r, s, n, o = null == t ? void 0 : t.resourceAttributes;
			return {
				serviceName: null !== (i = null == o ? void 0 : o["service.name"]) && void 0 !== i ? i : null == t ? void 0 : t.serviceName,
				serviceVersion: null !== (e = null == o ? void 0 : o["service.version"]) && void 0 !== e ? e : null == t ? void 0 : t.serviceVersion,
				environment: null !== (r = null == o ? void 0 : o["deployment.environment"]) && void 0 !== r ? r : null == t ? void 0 : t.environment,
				resourceAttributes: o,
				beforeSend: null == t ? void 0 : t.beforeSend,
				flushIntervalMs: null !== (s = null == t ? void 0 : t.flushIntervalMs) && void 0 !== s ? s : 1e4,
				maxSeriesPerFlush: null !== (n = null == t ? void 0 : t.maxSeriesPerFlush) && void 0 !== n ? n : 1e3
			};
		}(e), this.I)), this.wc;
	}
	count(t, i, e) {
		void 0 === i && (i = 1), this.Tc().count(t, i, e);
	}
	gauge(t, i, e) {
		this.Tc().gauge(t, i, e);
	}
	histogram(t, i, e) {
		this.Tc().histogram(t, i, e);
	}
	flush(t) {
		if (!this.wc) return Promise.resolve();
		if (t) {
			var i = this.wc.drainWindow();
			return i && this._s(i, t), Promise.resolve();
		}
		return this.wc.flush().catch(((t) => this.I.error("PostHog metrics flush failed:", t)));
	}
	reset() {
		var t;
		null == (t = this.wc) || t.reset();
	}
	xc() {
		var t = this._instance, i = this;
		return {
			get isDisabled() {
				return !1;
			},
			get optedOut() {
				return !t.is_capturing();
			},
			_s: (t) => i._s(t),
			getLibraryId: () => c.LIB_NAME,
			getLibraryVersion: () => c.LIB_VERSION
		};
	}
	_s(t, i) {
		return new Promise(((e) => {
			var r = !1, s = (t) => {
				r || (r = !0, clearTimeout(n), e(t));
			}, n = setTimeout((() => s({
				kind: "retry-later",
				error: /* @__PURE__ */ new Error("metrics request timed out")
			})), 9e4);
			this._instance._send_request(_({
				method: "POST",
				url: this.Gc(),
				data: t,
				compression: "best-available",
				batchKey: "metrics"
			}, i && { transport: i }, {
				fireCallbackOnDrop: !0,
				callback(t) {
					var i = t.statusCode;
					if (i >= 200 && 300 > i) s({ kind: "ok" });
					else if (413 === i) s({ kind: "too-large" });
					else if (0 !== i && 408 !== i && 429 !== i && 500 > i) s({
						kind: "fatal",
						error: /* @__PURE__ */ new Error("metrics request failed with status " + i)
					});
					else {
						var e;
						s({
							kind: "retry-later",
							error: null !== (e = t.error) && void 0 !== e ? e : /* @__PURE__ */ new Error("metrics request failed with status " + i)
						});
					}
				}
			}));
		}));
	}
	Gc() {
		return this._instance.requestRouter.endpointFor("api", "/i/v1/metrics") + "?token=" + encodeURIComponent(this._instance.config.token);
	}
} });
Rl.__defaultExtensionClasses = _({}, iu);
var eu = function() {
	c.SDK_DIST_CHANNEL = "npm";
	var i = fl[xl] = new Rl();
	return function() {
		function i() {
			i.done || (i.done = !0, El = !1, es(fl, (function(t) {
				t._dom_loaded();
			})));
		}
		null != r && r.addEventListener ? "complete" === r.readyState ? i() : us(r, "DOMContentLoaded", i, { capture: !1 }) : t && Ie.error("Browser doesn't support `document.addEventListener` so PostHog couldn't be initialized");
	}(), i;
}();
//#endregion
//#region node_modules/.pnpm/nanoid@5.1.6/node_modules/nanoid/url-alphabet/index.js
var urlAlphabet = "useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict";
//#endregion
//#region node_modules/.pnpm/nanoid@5.1.6/node_modules/nanoid/index.browser.js
var random = (bytes) => crypto.getRandomValues(new Uint8Array(bytes));
var customRandom = (alphabet, defaultSize, getRandom) => {
	let mask = (2 << Math.log2(alphabet.length - 1)) - 1;
	let step = -~(1.6 * mask * defaultSize / alphabet.length);
	return (size = defaultSize) => {
		let id = "";
		while (true) {
			let bytes = getRandom(step);
			let j = step | 0;
			while (j--) {
				id += alphabet[bytes[j] & mask] || "";
				if (id.length >= size) return id;
			}
		}
	};
};
var customAlphabet = (alphabet, size = 21) => customRandom(alphabet, size | 0, random);
var nanoid$2 = (size = 21) => {
	let id = "";
	let bytes = crypto.getRandomValues(new Uint8Array(size |= 0));
	while (size--) id += urlAlphabet[bytes[size] & 63];
	return id;
};
//#endregion
//#region utils/client-id.ts
/**
* Client ID management utility
* Used to generate and persist unique device identifier
* @internal
*/
var CLIENT_ID_STORAGE_KEY = "spavatar_client_id";
/**
* Get or create client_id
* - If exists in localStorage, return existing client_id
* - If not exists, generate new client_id and store to localStorage
* @returns client_id string
* @internal
*/
function getOrCreateClientId() {
	try {
		const stored = localStorage.getItem(CLIENT_ID_STORAGE_KEY);
		if (stored) return stored;
		const clientId = nanoid$2(21);
		localStorage.setItem(CLIENT_ID_STORAGE_KEY, clientId);
		return clientId;
	} catch (error) {
		return `temp_${nanoid$2(21)}_${Date.now()}`;
	}
}
//#endregion
//#region utils/conversationId.ts
/**
* Conversation ID generation utility
* 
* Unified format: timestamp (UTC time, second-level, format: YYYYMMDDHHmmss) + underscore + 12-digit NanoID
* Example: 20251027143034_aB3dEf9hIjKl
* 
* Time part uses UTC time for easier cross-platform log troubleshooting with unified timezone conversion
* @internal
*/
/**
* Custom character set: only uppercase, lowercase letters and numbers (URL safe, no hyphens)
* Character set: A-Z, a-z, 0-9 (62 characters)
*/
var nanoid$1 = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", 12);
/**
* Generate unified conversation ID
* 
* Format: timestamp (UTC time, second-level, format: YYYYMMDDHHmmss) + underscore + 12-digit NanoID
* Time part uses UTC time for easier cross-platform log troubleshooting with unified timezone conversion
* 
* @returns Conversation ID in format YYYYMMDDHHmmss_nanoid
* @example
* generateConversationId() // "20251027143034_aB3dEf9hIjKl"
* @internal
*/
var generateTraceId = () => generateConversationId();
function generateConversationId() {
	const now = /* @__PURE__ */ new Date();
	return `${`${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}${String(now.getUTCHours()).padStart(2, "0")}${String(now.getUTCMinutes()).padStart(2, "0")}${String(now.getUTCSeconds()).padStart(2, "0")}`}_${nanoid$1()}`;
}
//#endregion
//#region utils/id-manager.ts
/**
* ID Manager
* Unified management of all types of IDs in SDK
* @internal
*/
/** 与 conversation_id 同字符集：URL 安全、无连字符。 */
var nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", 12);
var IdManager = class {
	ids = {
		clientId: "",
		sessionId: "",
		userId: null,
		appId: null,
		sessionToken: null,
		connectionId: null,
		conversationId: null
	};
	constructor() {
		this.ids.clientId = getOrCreateClientId();
	}
	getClientId() {
		return this.ids.clientId;
	}
	setUserId(userId) {
		this.ids.userId = userId;
	}
	getUserId() {
		return this.ids.userId;
	}
	setAppId(appId) {
		this.ids.appId = appId;
	}
	getAppId() {
		return this.ids.appId;
	}
	setSessionToken(token) {
		this.ids.sessionToken = token;
	}
	getSessionToken() {
		return this.ids.sessionToken;
	}
	/**
	* Generate new connectionId (for WebSocket connection)
	* @internal
	*/
	generateConnectionId() {
		this.ids.connectionId = generateConversationId();
		return this.ids.connectionId;
	}
	/**
	* Set connectionId (for connectionId received from server)
	* @internal
	*/
	setConnectionId(connectionId) {
		this.ids.connectionId = connectionId;
	}
	getConnectionId() {
		return this.ids.connectionId;
	}
	clearConnectionId() {
		this.ids.connectionId = null;
	}
	/**
	* Generate new conversationId (for each conversation)
	* @internal
	*/
	generateNewConversationId() {
		this.ids.conversationId = generateConversationId();
		return this.ids.conversationId;
	}
	getConversationId() {
		return this.ids.conversationId;
	}
	setConversationId(conversationId) {
		this.ids.conversationId = conversationId;
	}
	clearConversationId() {
		this.ids.conversationId = null;
	}
	/**
	* Get all IDs (for log reporting)
	* @internal
	*/
	getAllIds() {
		return { ...this.ids };
	}
	/**
	* Get public log parameters (contains all necessary IDs)
	* @internal
	*/
	getLogContext() {
		return {
			client_id: this.ids.clientId,
			session_id: this.ids.sessionId,
			user_id: this.ids.userId || "",
			app_id: this.ids.appId || ""
		};
	}
	/** 本次启动的 session id；首次调用时生成。 @internal */
	getSessionId() {
		if (!this.ids.sessionId) this.ids.sessionId = nanoid();
		return this.ids.sessionId;
	}
	/**
	* Clear all IDs (for testing or reset)
	* @internal
	*/
	clear() {
		this.ids.userId = null;
		this.ids.appId = null;
		this.ids.sessionToken = null;
		this.ids.connectionId = null;
		this.ids.conversationId = null;
	}
};
var idManager = new IdManager();
//#endregion
//#region config/constants.ts
var POSTHOG_HOST = "https://i.spatialwalk.ai";
var POSTHOG_API_KEY = "phc_IFTLa6Z6VhTaNvsxB7klvG2JeNwcSpnnwz8YvZRC96Q";
function getPostHogConfig() {
	return {
		host: POSTHOG_HOST,
		apiKey: POSTHOG_API_KEY,
		disableCompression: false
	};
}
var OTEL_ENDPOINT_BASE = "https://t.spatialwalk.top";
var OTEL_LOGS_ENDPOINT = `${OTEL_ENDPOINT_BASE}/v1/logs`;
var OTEL_METRICS_ENDPOINT = `${OTEL_ENDPOINT_BASE}/v1/metrics`;
var OTEL_TRACES_ENDPOINT = `${OTEL_ENDPOINT_BASE}/v1/traces`;
var OTEL_STREAM_NAME = "avatarkit";
var OTEL_TRACES_STREAM_NAME = "prod_traces";
/**
* Check if URL has debug=1 parameter
*/
function hasDebugParam() {
	if (typeof window === "undefined") return false;
	return new URLSearchParams(window.location.search).get("debug") === "1";
}
/**
* Comprehensive debug mode check
* Returns true if:
* - VITE_ENV_TEST is 'true', OR
* - Running in DEV mode, OR
* - URL has debug=1 parameter
*/
function isDebugMode() {
	return hasDebugParam();
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api-logs@0.218.0/node_modules/@opentelemetry/api-logs/build/esm/types/LogRecord.js
var SeverityNumber;
(function(SeverityNumber) {
	SeverityNumber[SeverityNumber["UNSPECIFIED"] = 0] = "UNSPECIFIED";
	SeverityNumber[SeverityNumber["TRACE"] = 1] = "TRACE";
	SeverityNumber[SeverityNumber["TRACE2"] = 2] = "TRACE2";
	SeverityNumber[SeverityNumber["TRACE3"] = 3] = "TRACE3";
	SeverityNumber[SeverityNumber["TRACE4"] = 4] = "TRACE4";
	SeverityNumber[SeverityNumber["DEBUG"] = 5] = "DEBUG";
	SeverityNumber[SeverityNumber["DEBUG2"] = 6] = "DEBUG2";
	SeverityNumber[SeverityNumber["DEBUG3"] = 7] = "DEBUG3";
	SeverityNumber[SeverityNumber["DEBUG4"] = 8] = "DEBUG4";
	SeverityNumber[SeverityNumber["INFO"] = 9] = "INFO";
	SeverityNumber[SeverityNumber["INFO2"] = 10] = "INFO2";
	SeverityNumber[SeverityNumber["INFO3"] = 11] = "INFO3";
	SeverityNumber[SeverityNumber["INFO4"] = 12] = "INFO4";
	SeverityNumber[SeverityNumber["WARN"] = 13] = "WARN";
	SeverityNumber[SeverityNumber["WARN2"] = 14] = "WARN2";
	SeverityNumber[SeverityNumber["WARN3"] = 15] = "WARN3";
	SeverityNumber[SeverityNumber["WARN4"] = 16] = "WARN4";
	SeverityNumber[SeverityNumber["ERROR"] = 17] = "ERROR";
	SeverityNumber[SeverityNumber["ERROR2"] = 18] = "ERROR2";
	SeverityNumber[SeverityNumber["ERROR3"] = 19] = "ERROR3";
	SeverityNumber[SeverityNumber["ERROR4"] = 20] = "ERROR4";
	SeverityNumber[SeverityNumber["FATAL"] = 21] = "FATAL";
	SeverityNumber[SeverityNumber["FATAL2"] = 22] = "FATAL2";
	SeverityNumber[SeverityNumber["FATAL3"] = 23] = "FATAL3";
	SeverityNumber[SeverityNumber["FATAL4"] = 24] = "FATAL4";
})(SeverityNumber || (SeverityNumber = {}));
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api-logs@0.218.0/node_modules/@opentelemetry/api-logs/build/esm/NoopLogger.js
var NoopLogger = class {
	emit(_logRecord) {}
	enabled() {
		return false;
	}
};
var NOOP_LOGGER = new NoopLogger();
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api-logs@0.218.0/node_modules/@opentelemetry/api-logs/build/esm/internal/global-utils.js
var GLOBAL_LOGS_API_KEY = Symbol.for("io.opentelemetry.js.api.logs");
var _global$1 = globalThis;
/**
* Make a function which accepts a version integer and returns the instance of an API if the version
* is compatible, or a fallback version (usually NOOP) if it is not.
*
* @param requiredVersion Backwards compatibility version which is required to return the instance
* @param instance Instance which should be returned if the required version is compatible
* @param fallback Fallback instance, usually NOOP, which will be returned if the required version is not compatible
*/
function makeGetter(requiredVersion, instance, fallback) {
	return (version) => version === requiredVersion ? instance : fallback;
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api-logs@0.218.0/node_modules/@opentelemetry/api-logs/build/esm/NoopLoggerProvider.js
var NoopLoggerProvider = class {
	getLogger(_name, _version, _options) {
		return new NoopLogger();
	}
};
var NOOP_LOGGER_PROVIDER = new NoopLoggerProvider();
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api-logs@0.218.0/node_modules/@opentelemetry/api-logs/build/esm/ProxyLogger.js
var ProxyLogger = class {
	constructor(provider, name, version, options) {
		this._provider = provider;
		this.name = name;
		this.version = version;
		this.options = options;
	}
	/**
	* Emit a log record. This method should only be used by log appenders.
	*
	* @param logRecord
	*/
	emit(logRecord) {
		this._getLogger().emit(logRecord);
	}
	enabled(options) {
		return this._getLogger().enabled(options);
	}
	/**
	* Try to get a logger from the proxy logger provider.
	* If the proxy logger provider has no delegate, return a noop logger.
	*/
	_getLogger() {
		if (this._delegate) return this._delegate;
		const logger = this._provider._getDelegateLogger(this.name, this.version, this.options);
		if (!logger) return NOOP_LOGGER;
		this._delegate = logger;
		return this._delegate;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api-logs@0.218.0/node_modules/@opentelemetry/api-logs/build/esm/ProxyLoggerProvider.js
var ProxyLoggerProvider = class {
	getLogger(name, version, options) {
		var _a;
		return (_a = this._getDelegateLogger(name, version, options)) !== null && _a !== void 0 ? _a : new ProxyLogger(this, name, version, options);
	}
	/**
	* Get the delegate logger provider.
	* Used by tests only.
	* @internal
	*/
	_getDelegate() {
		var _a;
		return (_a = this._delegate) !== null && _a !== void 0 ? _a : NOOP_LOGGER_PROVIDER;
	}
	/**
	* Set the delegate logger provider
	* @internal
	*/
	_setDelegate(delegate) {
		this._delegate = delegate;
	}
	/**
	* @internal
	*/
	_getDelegateLogger(name, version, options) {
		var _a;
		return (_a = this._delegate) === null || _a === void 0 ? void 0 : _a.getLogger(name, version, options);
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api-logs@0.218.0/node_modules/@opentelemetry/api-logs/build/esm/index.js
var logs = class LogsAPI {
	constructor() {
		this._proxyLoggerProvider = new ProxyLoggerProvider();
	}
	static getInstance() {
		if (!this._instance) this._instance = new LogsAPI();
		return this._instance;
	}
	setGlobalLoggerProvider(provider) {
		if (_global$1[GLOBAL_LOGS_API_KEY]) return this.getLoggerProvider();
		_global$1[GLOBAL_LOGS_API_KEY] = makeGetter(1, provider, NOOP_LOGGER_PROVIDER);
		this._proxyLoggerProvider._setDelegate(provider);
		return provider;
	}
	/**
	* Returns the global logger provider.
	*
	* @returns LoggerProvider
	*/
	getLoggerProvider() {
		var _a, _b;
		return (_b = (_a = _global$1[GLOBAL_LOGS_API_KEY]) === null || _a === void 0 ? void 0 : _a.call(_global$1, 1)) !== null && _b !== void 0 ? _b : this._proxyLoggerProvider;
	}
	/**
	* Returns a logger from the global logger provider.
	*
	* @returns Logger
	*/
	getLogger(name, version, options) {
		return this.getLoggerProvider().getLogger(name, version, options);
	}
	/** Remove the global logger provider */
	disable() {
		delete _global$1[GLOBAL_LOGS_API_KEY];
		this._proxyLoggerProvider = new ProxyLoggerProvider();
	}
}.getInstance();
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/version.js
var VERSION$4 = "1.9.1";
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/internal/semver.js
var re = /^(\d+)\.(\d+)\.(\d+)(-(.+))?$/;
/**
* Create a function to test an API version to see if it is compatible with the provided ownVersion.
*
* The returned function has the following semantics:
* - Exact match is always compatible
* - Major versions must match exactly
*    - 1.x package cannot use global 2.x package
*    - 2.x package cannot use global 1.x package
* - The minor version of the API module requesting access to the global API must be less than or equal to the minor version of this API
*    - 1.3 package may use 1.4 global because the later global contains all functions 1.3 expects
*    - 1.4 package may NOT use 1.3 global because it may try to call functions which don't exist on 1.3
* - If the major version is 0, the minor version is treated as the major and the patch is treated as the minor
* - Patch and build tag differences are not considered at this time
*
* @param ownVersion version which should be checked against
*/
function _makeCompatibilityCheck(ownVersion) {
	const acceptedVersions = /* @__PURE__ */ new Set([ownVersion]);
	const rejectedVersions = /* @__PURE__ */ new Set();
	const myVersionMatch = ownVersion.match(re);
	if (!myVersionMatch) return () => false;
	const ownVersionParsed = {
		major: +myVersionMatch[1],
		minor: +myVersionMatch[2],
		patch: +myVersionMatch[3],
		prerelease: myVersionMatch[4]
	};
	if (ownVersionParsed.prerelease != null) return function isExactmatch(globalVersion) {
		return globalVersion === ownVersion;
	};
	function _reject(v) {
		rejectedVersions.add(v);
		return false;
	}
	function _accept(v) {
		acceptedVersions.add(v);
		return true;
	}
	return function isCompatible(globalVersion) {
		if (acceptedVersions.has(globalVersion)) return true;
		if (rejectedVersions.has(globalVersion)) return false;
		const globalVersionMatch = globalVersion.match(re);
		if (!globalVersionMatch) return _reject(globalVersion);
		const globalVersionParsed = {
			major: +globalVersionMatch[1],
			minor: +globalVersionMatch[2],
			patch: +globalVersionMatch[3],
			prerelease: globalVersionMatch[4]
		};
		if (globalVersionParsed.prerelease != null) return _reject(globalVersion);
		if (ownVersionParsed.major !== globalVersionParsed.major) return _reject(globalVersion);
		if (ownVersionParsed.major === 0) {
			if (ownVersionParsed.minor === globalVersionParsed.minor && ownVersionParsed.patch <= globalVersionParsed.patch) return _accept(globalVersion);
			return _reject(globalVersion);
		}
		if (ownVersionParsed.minor <= globalVersionParsed.minor) return _accept(globalVersion);
		return _reject(globalVersion);
	};
}
/**
* Test an API version to see if it is compatible with this API.
*
* - Exact match is always compatible
* - Major versions must match exactly
*    - 1.x package cannot use global 2.x package
*    - 2.x package cannot use global 1.x package
* - The minor version of the API module requesting access to the global API must be less than or equal to the minor version of this API
*    - 1.3 package may use 1.4 global because the later global contains all functions 1.3 expects
*    - 1.4 package may NOT use 1.3 global because it may try to call functions which don't exist on 1.3
* - If the major version is 0, the minor version is treated as the major and the patch is treated as the minor
* - Patch and build tag differences are not considered at this time
*
* @param version version of the API requesting an instance of the global API
*/
var isCompatible = _makeCompatibilityCheck(VERSION$4);
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/internal/global-utils.js
var major = VERSION$4.split(".")[0];
var GLOBAL_OPENTELEMETRY_API_KEY = Symbol.for(`opentelemetry.js.api.${major}`);
var _global = typeof globalThis === "object" ? globalThis : typeof self === "object" ? self : typeof window === "object" ? window : typeof global === "object" ? global : {};
function registerGlobal(type, instance, diag, allowOverride = false) {
	var _a;
	const api = _global[GLOBAL_OPENTELEMETRY_API_KEY] = (_a = _global[GLOBAL_OPENTELEMETRY_API_KEY]) !== null && _a !== void 0 ? _a : { version: VERSION$4 };
	if (!allowOverride && api[type]) {
		const err = /* @__PURE__ */ new Error(`@opentelemetry/api: Attempted duplicate registration of API: ${type}`);
		diag.error(err.stack || err.message);
		return false;
	}
	if (api.version !== "1.9.1") {
		const err = /* @__PURE__ */ new Error(`@opentelemetry/api: Registration of version v${api.version} for ${type} does not match previously registered API v${VERSION$4}`);
		diag.error(err.stack || err.message);
		return false;
	}
	api[type] = instance;
	diag.debug(`@opentelemetry/api: Registered a global for ${type} v${VERSION$4}.`);
	return true;
}
function getGlobal(type) {
	var _a, _b;
	const globalVersion = (_a = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _a === void 0 ? void 0 : _a.version;
	if (!globalVersion || !isCompatible(globalVersion)) return;
	return (_b = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _b === void 0 ? void 0 : _b[type];
}
function unregisterGlobal(type, diag) {
	diag.debug(`@opentelemetry/api: Unregistering a global for ${type} v${VERSION$4}.`);
	const api = _global[GLOBAL_OPENTELEMETRY_API_KEY];
	if (api) delete api[type];
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/diag/ComponentLogger.js
/**
* Component Logger which is meant to be used as part of any component which
* will add automatically additional namespace in front of the log message.
* It will then forward all message to global diag logger
* @example
* const cLogger = diag.createComponentLogger({ namespace: '@opentelemetry/instrumentation-http' });
* cLogger.debug('test');
* // @opentelemetry/instrumentation-http test
*/
var DiagComponentLogger = class {
	constructor(props) {
		this._namespace = props.namespace || "DiagComponentLogger";
	}
	debug(...args) {
		return logProxy("debug", this._namespace, args);
	}
	error(...args) {
		return logProxy("error", this._namespace, args);
	}
	info(...args) {
		return logProxy("info", this._namespace, args);
	}
	warn(...args) {
		return logProxy("warn", this._namespace, args);
	}
	verbose(...args) {
		return logProxy("verbose", this._namespace, args);
	}
};
function logProxy(funcName, namespace, args) {
	const logger = getGlobal("diag");
	if (!logger) return;
	return logger[funcName](namespace, ...args);
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/diag/types.js
/**
* Defines the available internal logging levels for the diagnostic logger, the numeric values
* of the levels are defined to match the original values from the initial LogLevel to avoid
* compatibility/migration issues for any implementation that assume the numeric ordering.
*/
var DiagLogLevel;
(function(DiagLogLevel) {
	/** Diagnostic Logging level setting to disable all logging (except and forced logs) */
	DiagLogLevel[DiagLogLevel["NONE"] = 0] = "NONE";
	/** Identifies an error scenario */
	DiagLogLevel[DiagLogLevel["ERROR"] = 30] = "ERROR";
	/** Identifies a warning scenario */
	DiagLogLevel[DiagLogLevel["WARN"] = 50] = "WARN";
	/** General informational log message */
	DiagLogLevel[DiagLogLevel["INFO"] = 60] = "INFO";
	/** General debug log message */
	DiagLogLevel[DiagLogLevel["DEBUG"] = 70] = "DEBUG";
	/**
	* Detailed trace level logging should only be used for development, should only be set
	* in a development environment.
	*/
	DiagLogLevel[DiagLogLevel["VERBOSE"] = 80] = "VERBOSE";
	/** Used to set the logging level to include all logging */
	DiagLogLevel[DiagLogLevel["ALL"] = 9999] = "ALL";
})(DiagLogLevel || (DiagLogLevel = {}));
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/diag/internal/logLevelLogger.js
function createLogLevelDiagLogger(maxLevel, logger) {
	if (maxLevel < DiagLogLevel.NONE) maxLevel = DiagLogLevel.NONE;
	else if (maxLevel > DiagLogLevel.ALL) maxLevel = DiagLogLevel.ALL;
	logger = logger || {};
	function _filterFunc(funcName, theLevel) {
		const theFunc = logger[funcName];
		if (typeof theFunc === "function" && maxLevel >= theLevel) return theFunc.bind(logger);
		return function() {};
	}
	return {
		error: _filterFunc("error", DiagLogLevel.ERROR),
		warn: _filterFunc("warn", DiagLogLevel.WARN),
		info: _filterFunc("info", DiagLogLevel.INFO),
		debug: _filterFunc("debug", DiagLogLevel.DEBUG),
		verbose: _filterFunc("verbose", DiagLogLevel.VERBOSE)
	};
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/api/diag.js
var API_NAME$4 = "diag";
/**
* Singleton object which represents the entry point to the OpenTelemetry internal
* diagnostic API
*
* @since 1.0.0
*/
var DiagAPI = class DiagAPI {
	/** Get the singleton instance of the DiagAPI API */
	static instance() {
		if (!this._instance) this._instance = new DiagAPI();
		return this._instance;
	}
	/**
	* Private internal constructor
	* @private
	*/
	constructor() {
		function _logProxy(funcName) {
			return function(...args) {
				const logger = getGlobal("diag");
				if (!logger) return;
				return logger[funcName](...args);
			};
		}
		const self = this;
		const setLogger = (logger, optionsOrLogLevel = { logLevel: DiagLogLevel.INFO }) => {
			var _a, _b, _c;
			if (logger === self) {
				const err = /* @__PURE__ */ new Error("Cannot use diag as the logger for itself. Please use a DiagLogger implementation like ConsoleDiagLogger or a custom implementation");
				self.error((_a = err.stack) !== null && _a !== void 0 ? _a : err.message);
				return false;
			}
			if (typeof optionsOrLogLevel === "number") optionsOrLogLevel = { logLevel: optionsOrLogLevel };
			const oldLogger = getGlobal("diag");
			const newLogger = createLogLevelDiagLogger((_b = optionsOrLogLevel.logLevel) !== null && _b !== void 0 ? _b : DiagLogLevel.INFO, logger);
			if (oldLogger && !optionsOrLogLevel.suppressOverrideMessage) {
				const stack = (_c = (/* @__PURE__ */ new Error()).stack) !== null && _c !== void 0 ? _c : "<failed to generate stacktrace>";
				oldLogger.warn(`Current logger will be overwritten from ${stack}`);
				newLogger.warn(`Current logger will overwrite one already registered from ${stack}`);
			}
			return registerGlobal("diag", newLogger, self, true);
		};
		self.setLogger = setLogger;
		self.disable = () => {
			unregisterGlobal(API_NAME$4, self);
		};
		self.createComponentLogger = (options) => {
			return new DiagComponentLogger(options);
		};
		self.verbose = _logProxy("verbose");
		self.debug = _logProxy("debug");
		self.info = _logProxy("info");
		self.warn = _logProxy("warn");
		self.error = _logProxy("error");
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/baggage/internal/baggage-impl.js
var BaggageImpl = class BaggageImpl {
	constructor(entries) {
		this._entries = entries ? new Map(entries) : /* @__PURE__ */ new Map();
	}
	getEntry(key) {
		const entry = this._entries.get(key);
		if (!entry) return;
		return Object.assign({}, entry);
	}
	getAllEntries() {
		return Array.from(this._entries.entries());
	}
	setEntry(key, entry) {
		const newBaggage = new BaggageImpl(this._entries);
		newBaggage._entries.set(key, entry);
		return newBaggage;
	}
	removeEntry(key) {
		const newBaggage = new BaggageImpl(this._entries);
		newBaggage._entries.delete(key);
		return newBaggage;
	}
	removeEntries(...keys) {
		const newBaggage = new BaggageImpl(this._entries);
		for (const key of keys) newBaggage._entries.delete(key);
		return newBaggage;
	}
	clear() {
		return new BaggageImpl();
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/baggage/internal/symbol.js
/**
* Symbol used to make BaggageEntryMetadata an opaque type
*/
var baggageEntryMetadataSymbol = Symbol("BaggageEntryMetadata");
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/baggage/utils.js
var diag$1 = DiagAPI.instance();
/**
* Create a new Baggage with optional entries
*
* @param entries An array of baggage entries the new baggage should contain
*/
function createBaggage(entries = {}) {
	return new BaggageImpl(new Map(Object.entries(entries)));
}
/**
* Create a serializable BaggageEntryMetadata object from a string.
*
* @param str string metadata. Format is currently not defined by the spec and has no special meaning.
*
* @since 1.0.0
*/
function baggageEntryMetadataFromString(str) {
	if (typeof str !== "string") {
		diag$1.error(`Cannot create baggage metadata from unknown type: ${typeof str}`);
		str = "";
	}
	return {
		__TYPE__: baggageEntryMetadataSymbol,
		toString() {
			return str;
		}
	};
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/context/context.js
/**
* Get a key to uniquely identify a context value
*
* @since 1.0.0
*/
function createContextKey(description) {
	return Symbol.for(description);
}
/**
* The root context is used as the default parent context when there is no active context
*
* @since 1.0.0
*/
var ROOT_CONTEXT = new class BaseContext {
	/**
	* Construct a new context which inherits values from an optional parent context.
	*
	* @param parentContext a context from which to inherit values
	*/
	constructor(parentContext) {
		const self = this;
		self._currentContext = parentContext ? new Map(parentContext) : /* @__PURE__ */ new Map();
		self.getValue = (key) => self._currentContext.get(key);
		self.setValue = (key, value) => {
			const context = new BaseContext(self._currentContext);
			context._currentContext.set(key, value);
			return context;
		};
		self.deleteValue = (key) => {
			const context = new BaseContext(self._currentContext);
			context._currentContext.delete(key);
			return context;
		};
	}
}();
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/metrics/NoopMeter.js
/**
* NoopMeter is a noop implementation of the {@link Meter} interface. It reuses
* constant NoopMetrics for all of its methods.
*/
var NoopMeter = class {
	constructor() {}
	/**
	* @see {@link Meter.createGauge}
	*/
	createGauge(_name, _options) {
		return NOOP_GAUGE_METRIC;
	}
	/**
	* @see {@link Meter.createHistogram}
	*/
	createHistogram(_name, _options) {
		return NOOP_HISTOGRAM_METRIC;
	}
	/**
	* @see {@link Meter.createCounter}
	*/
	createCounter(_name, _options) {
		return NOOP_COUNTER_METRIC;
	}
	/**
	* @see {@link Meter.createUpDownCounter}
	*/
	createUpDownCounter(_name, _options) {
		return NOOP_UP_DOWN_COUNTER_METRIC;
	}
	/**
	* @see {@link Meter.createObservableGauge}
	*/
	createObservableGauge(_name, _options) {
		return NOOP_OBSERVABLE_GAUGE_METRIC;
	}
	/**
	* @see {@link Meter.createObservableCounter}
	*/
	createObservableCounter(_name, _options) {
		return NOOP_OBSERVABLE_COUNTER_METRIC;
	}
	/**
	* @see {@link Meter.createObservableUpDownCounter}
	*/
	createObservableUpDownCounter(_name, _options) {
		return NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC;
	}
	/**
	* @see {@link Meter.addBatchObservableCallback}
	*/
	addBatchObservableCallback(_callback, _observables) {}
	/**
	* @see {@link Meter.removeBatchObservableCallback}
	*/
	removeBatchObservableCallback(_callback) {}
};
var NoopMetric = class {};
var NoopCounterMetric = class extends NoopMetric {
	add(_value, _attributes) {}
};
var NoopUpDownCounterMetric = class extends NoopMetric {
	add(_value, _attributes) {}
};
var NoopGaugeMetric = class extends NoopMetric {
	record(_value, _attributes) {}
};
var NoopHistogramMetric = class extends NoopMetric {
	record(_value, _attributes) {}
};
var NoopObservableMetric = class {
	addCallback(_callback) {}
	removeCallback(_callback) {}
};
var NoopObservableCounterMetric = class extends NoopObservableMetric {};
var NoopObservableGaugeMetric = class extends NoopObservableMetric {};
var NoopObservableUpDownCounterMetric = class extends NoopObservableMetric {};
var NOOP_METER = new NoopMeter();
var NOOP_COUNTER_METRIC = new NoopCounterMetric();
var NOOP_GAUGE_METRIC = new NoopGaugeMetric();
var NOOP_HISTOGRAM_METRIC = new NoopHistogramMetric();
var NOOP_UP_DOWN_COUNTER_METRIC = new NoopUpDownCounterMetric();
var NOOP_OBSERVABLE_COUNTER_METRIC = new NoopObservableCounterMetric();
var NOOP_OBSERVABLE_GAUGE_METRIC = new NoopObservableGaugeMetric();
var NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = new NoopObservableUpDownCounterMetric();
/**
* Create a no-op Meter
*
* @since 1.3.0
*/
function createNoopMeter() {
	return NOOP_METER;
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/metrics/Metric.js
/**
* The Type of value. It describes how the data is reported.
*
* @since 1.3.0
*/
var ValueType;
(function(ValueType) {
	ValueType[ValueType["INT"] = 0] = "INT";
	ValueType[ValueType["DOUBLE"] = 1] = "DOUBLE";
})(ValueType || (ValueType = {}));
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/propagation/TextMapPropagator.js
/**
* @since 1.0.0
*/
var defaultTextMapGetter = {
	get(carrier, key) {
		if (carrier == null) return;
		return carrier[key];
	},
	keys(carrier) {
		if (carrier == null) return [];
		return Object.keys(carrier);
	}
};
/**
* @since 1.0.0
*/
var defaultTextMapSetter = { set(carrier, key, value) {
	if (carrier == null) return;
	carrier[key] = value;
} };
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/context/NoopContextManager.js
var NoopContextManager = class {
	active() {
		return ROOT_CONTEXT;
	}
	with(_context, fn, thisArg, ...args) {
		return fn.call(thisArg, ...args);
	}
	bind(_context, target) {
		return target;
	}
	enable() {
		return this;
	}
	disable() {
		return this;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/api/context.js
var API_NAME$3 = "context";
var NOOP_CONTEXT_MANAGER = new NoopContextManager();
/**
* Singleton object which represents the entry point to the OpenTelemetry Context API
*
* @since 1.0.0
*/
var ContextAPI = class ContextAPI {
	/** Empty private constructor prevents end users from constructing a new instance of the API */
	constructor() {}
	/** Get the singleton instance of the Context API */
	static getInstance() {
		if (!this._instance) this._instance = new ContextAPI();
		return this._instance;
	}
	/**
	* Set the current context manager.
	*
	* @returns true if the context manager was successfully registered, else false
	*/
	setGlobalContextManager(contextManager) {
		return registerGlobal(API_NAME$3, contextManager, DiagAPI.instance());
	}
	/**
	* Get the currently active context
	*/
	active() {
		return this._getContextManager().active();
	}
	/**
	* Execute a function with an active context
	*
	* @param context context to be active during function execution
	* @param fn function to execute in a context
	* @param thisArg optional receiver to be used for calling fn
	* @param args optional arguments forwarded to fn
	*/
	with(context, fn, thisArg, ...args) {
		return this._getContextManager().with(context, fn, thisArg, ...args);
	}
	/**
	* Bind a context to a target function or event emitter
	*
	* @param context context to bind to the event emitter or function. Defaults to the currently active context
	* @param target function or event emitter to bind
	*/
	bind(context, target) {
		return this._getContextManager().bind(context, target);
	}
	_getContextManager() {
		return getGlobal(API_NAME$3) || NOOP_CONTEXT_MANAGER;
	}
	/** Disable and remove the global context manager */
	disable() {
		this._getContextManager().disable();
		unregisterGlobal(API_NAME$3, DiagAPI.instance());
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace/trace_flags.js
/**
* @since 1.0.0
*/
var TraceFlags;
(function(TraceFlags) {
	/** Represents no flag set. */
	TraceFlags[TraceFlags["NONE"] = 0] = "NONE";
	/** Bit to represent whether trace is sampled in trace flags. */
	TraceFlags[TraceFlags["SAMPLED"] = 1] = "SAMPLED";
})(TraceFlags || (TraceFlags = {}));
/**
* @since 1.0.0
*/
var INVALID_SPAN_CONTEXT = {
	traceId: "00000000000000000000000000000000",
	spanId: "0000000000000000",
	traceFlags: TraceFlags.NONE
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace/NonRecordingSpan.js
/**
* The NonRecordingSpan is the default {@link Span} that is used when no Span
* implementation is available. All operations are no-op including context
* propagation.
*/
var NonRecordingSpan = class {
	constructor(spanContext = INVALID_SPAN_CONTEXT) {
		this._spanContext = spanContext;
	}
	spanContext() {
		return this._spanContext;
	}
	setAttribute(_key, _value) {
		return this;
	}
	setAttributes(_attributes) {
		return this;
	}
	addEvent(_name, _attributes) {
		return this;
	}
	addLink(_link) {
		return this;
	}
	addLinks(_links) {
		return this;
	}
	setStatus(_status) {
		return this;
	}
	updateName(_name) {
		return this;
	}
	end(_endTime) {}
	isRecording() {
		return false;
	}
	recordException(_exception, _time) {}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace/context-utils.js
/**
* span key
*/
var SPAN_KEY = createContextKey("OpenTelemetry Context Key SPAN");
/**
* Return the span if one exists
*
* @param context context to get span from
*/
function getSpan(context) {
	return context.getValue(SPAN_KEY) || void 0;
}
/**
* Gets the span from the current context, if one exists.
*/
function getActiveSpan() {
	return getSpan(ContextAPI.getInstance().active());
}
/**
* Set the span on a context
*
* @param context context to use as parent
* @param span span to set active
*/
function setSpan(context, span) {
	return context.setValue(SPAN_KEY, span);
}
/**
* Remove current span stored in the context
*
* @param context context to delete span from
*/
function deleteSpan(context) {
	return context.deleteValue(SPAN_KEY);
}
/**
* Wrap span context in a NoopSpan and set as span in a new
* context
*
* @param context context to set active span on
* @param spanContext span context to be wrapped
*/
function setSpanContext(context, spanContext) {
	return setSpan(context, new NonRecordingSpan(spanContext));
}
/**
* Get the span context of the span if it exists.
*
* @param context context to get values from
*/
function getSpanContext(context) {
	var _a;
	return (_a = getSpan(context)) === null || _a === void 0 ? void 0 : _a.spanContext();
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace/spancontext-utils.js
var isHex = new Uint8Array([
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	1,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	0,
	1,
	1,
	1,
	1,
	1,
	1
]);
function isValidHex(id, length) {
	if (typeof id !== "string" || id.length !== length) return false;
	let r = 0;
	for (let i = 0; i < id.length; i += 4) r += (isHex[id.charCodeAt(i)] | 0) + (isHex[id.charCodeAt(i + 1)] | 0) + (isHex[id.charCodeAt(i + 2)] | 0) + (isHex[id.charCodeAt(i + 3)] | 0);
	return r === length;
}
/**
* @since 1.0.0
*/
function isValidTraceId(traceId) {
	return isValidHex(traceId, 32) && traceId !== "00000000000000000000000000000000";
}
/**
* @since 1.0.0
*/
function isValidSpanId(spanId) {
	return isValidHex(spanId, 16) && spanId !== "0000000000000000";
}
/**
* Returns true if this {@link SpanContext} is valid.
* @return true if this {@link SpanContext} is valid.
*
* @since 1.0.0
*/
function isSpanContextValid(spanContext) {
	return isValidTraceId(spanContext.traceId) && isValidSpanId(spanContext.spanId);
}
/**
* Wrap the given {@link SpanContext} in a new non-recording {@link Span}
*
* @param spanContext span context to be wrapped
* @returns a new non-recording {@link Span} with the provided context
*/
function wrapSpanContext(spanContext) {
	return new NonRecordingSpan(spanContext);
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace/NoopTracer.js
var contextApi = ContextAPI.getInstance();
/**
* No-op implementations of {@link Tracer}.
*/
var NoopTracer = class {
	startSpan(name, options, context = contextApi.active()) {
		if (Boolean(options === null || options === void 0 ? void 0 : options.root)) return new NonRecordingSpan();
		const parentFromContext = context && getSpanContext(context);
		if (isSpanContext(parentFromContext) && isSpanContextValid(parentFromContext)) return new NonRecordingSpan(parentFromContext);
		else return new NonRecordingSpan();
	}
	startActiveSpan(name, arg2, arg3, arg4) {
		let opts;
		let ctx;
		let fn;
		if (arguments.length < 2) return;
		else if (arguments.length === 2) fn = arg2;
		else if (arguments.length === 3) {
			opts = arg2;
			fn = arg3;
		} else {
			opts = arg2;
			ctx = arg3;
			fn = arg4;
		}
		const parentContext = ctx !== null && ctx !== void 0 ? ctx : contextApi.active();
		const span = this.startSpan(name, opts, parentContext);
		const contextWithSpanSet = setSpan(parentContext, span);
		return contextApi.with(contextWithSpanSet, fn, void 0, span);
	}
};
function isSpanContext(spanContext) {
	return spanContext !== null && typeof spanContext === "object" && "spanId" in spanContext && typeof spanContext["spanId"] === "string" && "traceId" in spanContext && typeof spanContext["traceId"] === "string" && "traceFlags" in spanContext && typeof spanContext["traceFlags"] === "number";
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace/ProxyTracer.js
var NOOP_TRACER = new NoopTracer();
/**
* Proxy tracer provided by the proxy tracer provider
*
* @since 1.0.0
*/
var ProxyTracer = class {
	constructor(provider, name, version, options) {
		this._provider = provider;
		this.name = name;
		this.version = version;
		this.options = options;
	}
	startSpan(name, options, context) {
		return this._getTracer().startSpan(name, options, context);
	}
	startActiveSpan(_name, _options, _context, _fn) {
		const tracer = this._getTracer();
		return Reflect.apply(tracer.startActiveSpan, tracer, arguments);
	}
	/**
	* Try to get a tracer from the proxy tracer provider.
	* If the proxy tracer provider has no delegate, return a noop tracer.
	*/
	_getTracer() {
		if (this._delegate) return this._delegate;
		const tracer = this._provider.getDelegateTracer(this.name, this.version, this.options);
		if (!tracer) return NOOP_TRACER;
		this._delegate = tracer;
		return this._delegate;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace/NoopTracerProvider.js
/**
* An implementation of the {@link TracerProvider} which returns an impotent
* Tracer for all calls to `getTracer`.
*
* All operations are no-op.
*/
var NoopTracerProvider = class {
	getTracer(_name, _version, _options) {
		return new NoopTracer();
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace/ProxyTracerProvider.js
var NOOP_TRACER_PROVIDER = new NoopTracerProvider();
/**
* Tracer provider which provides {@link ProxyTracer}s.
*
* Before a delegate is set, tracers provided are NoOp.
*   When a delegate is set, traces are provided from the delegate.
*   When a delegate is set after tracers have already been provided,
*   all tracers already provided will use the provided delegate implementation.
*
* @deprecated This will be removed in the next major version.
* @since 1.0.0
*/
var ProxyTracerProvider = class {
	/**
	* Get a {@link ProxyTracer}
	*/
	getTracer(name, version, options) {
		var _a;
		return (_a = this.getDelegateTracer(name, version, options)) !== null && _a !== void 0 ? _a : new ProxyTracer(this, name, version, options);
	}
	getDelegate() {
		var _a;
		return (_a = this._delegate) !== null && _a !== void 0 ? _a : NOOP_TRACER_PROVIDER;
	}
	/**
	* Set the delegate tracer provider
	*/
	setDelegate(delegate) {
		this._delegate = delegate;
	}
	getDelegateTracer(name, version, options) {
		var _a;
		return (_a = this._delegate) === null || _a === void 0 ? void 0 : _a.getTracer(name, version, options);
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace/SamplingResult.js
/**
* @deprecated use the one declared in @opentelemetry/sdk-trace-base instead.
* A sampling decision that determines how a {@link Span} will be recorded
* and collected.
*
* @since 1.0.0
*/
var SamplingDecision$1;
(function(SamplingDecision) {
	/**
	* `Span.isRecording() === false`, span will not be recorded and all events
	* and attributes will be dropped.
	*/
	SamplingDecision[SamplingDecision["NOT_RECORD"] = 0] = "NOT_RECORD";
	/**
	* `Span.isRecording() === true`, but `Sampled` flag in {@link TraceFlags}
	* MUST NOT be set.
	*/
	SamplingDecision[SamplingDecision["RECORD"] = 1] = "RECORD";
	/**
	* `Span.isRecording() === true` AND `Sampled` flag in {@link TraceFlags}
	* MUST be set.
	*/
	SamplingDecision[SamplingDecision["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
})(SamplingDecision$1 || (SamplingDecision$1 = {}));
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace/span_kind.js
/**
* @since 1.0.0
*/
var SpanKind;
(function(SpanKind) {
	/** Default value. Indicates that the span is used internally. */
	SpanKind[SpanKind["INTERNAL"] = 0] = "INTERNAL";
	/**
	* Indicates that the span covers server-side handling of an RPC or other
	* remote request.
	*/
	SpanKind[SpanKind["SERVER"] = 1] = "SERVER";
	/**
	* Indicates that the span covers the client-side wrapper around an RPC or
	* other remote request.
	*/
	SpanKind[SpanKind["CLIENT"] = 2] = "CLIENT";
	/**
	* Indicates that the span describes producer sending a message to a
	* broker. Unlike client and server, there is no direct critical path latency
	* relationship between producer and consumer spans.
	*/
	SpanKind[SpanKind["PRODUCER"] = 3] = "PRODUCER";
	/**
	* Indicates that the span describes consumer receiving a message from a
	* broker. Unlike client and server, there is no direct critical path latency
	* relationship between producer and consumer spans.
	*/
	SpanKind[SpanKind["CONSUMER"] = 4] = "CONSUMER";
})(SpanKind || (SpanKind = {}));
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace/status.js
/**
* An enumeration of status codes.
*
* @since 1.0.0
*/
var SpanStatusCode;
(function(SpanStatusCode) {
	/**
	* The default status.
	*/
	SpanStatusCode[SpanStatusCode["UNSET"] = 0] = "UNSET";
	/**
	* The operation has been validated by an Application developer or
	* Operator to have completed successfully.
	*/
	SpanStatusCode[SpanStatusCode["OK"] = 1] = "OK";
	/**
	* The operation contains an error.
	*/
	SpanStatusCode[SpanStatusCode["ERROR"] = 2] = "ERROR";
})(SpanStatusCode || (SpanStatusCode = {}));
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/context-api.js
/**
* Entrypoint for context API
* @since 1.0.0
*/
var context = ContextAPI.getInstance();
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/diag-api.js
/**
* Entrypoint for Diag API.
* Defines Diagnostic handler used for internal diagnostic logging operations.
* The default provides a Noop DiagLogger implementation which may be changed via the
* diag.setLogger(logger: DiagLogger) function.
*
* @since 1.0.0
*/
var diag = DiagAPI.instance();
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/metrics/NoopMeterProvider.js
/**
* An implementation of the {@link MeterProvider} which returns an impotent Meter
* for all calls to `getMeter`
*/
var NoopMeterProvider = class {
	getMeter(_name, _version, _options) {
		return NOOP_METER;
	}
};
var NOOP_METER_PROVIDER = new NoopMeterProvider();
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/api/metrics.js
var API_NAME$2 = "metrics";
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/metrics-api.js
/**
* Entrypoint for metrics API
*
* @since 1.3.0
*/
var metrics = class MetricsAPI {
	/** Empty private constructor prevents end users from constructing a new instance of the API */
	constructor() {}
	/** Get the singleton instance of the Metrics API */
	static getInstance() {
		if (!this._instance) this._instance = new MetricsAPI();
		return this._instance;
	}
	/**
	* Set the current global meter provider.
	* Returns true if the meter provider was successfully registered, else false.
	*/
	setGlobalMeterProvider(provider) {
		return registerGlobal(API_NAME$2, provider, DiagAPI.instance());
	}
	/**
	* Returns the global meter provider.
	*/
	getMeterProvider() {
		return getGlobal(API_NAME$2) || NOOP_METER_PROVIDER;
	}
	/**
	* Returns a meter from the global meter provider.
	*/
	getMeter(name, version, options) {
		return this.getMeterProvider().getMeter(name, version, options);
	}
	/** Remove the global meter provider */
	disable() {
		unregisterGlobal(API_NAME$2, DiagAPI.instance());
	}
}.getInstance();
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/propagation/NoopTextMapPropagator.js
/**
* No-op implementations of {@link TextMapPropagator}.
*/
var NoopTextMapPropagator = class {
	/** Noop inject function does nothing */
	inject(_context, _carrier) {}
	/** Noop extract function does nothing and returns the input context */
	extract(context, _carrier) {
		return context;
	}
	fields() {
		return [];
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/baggage/context-helpers.js
/**
* Baggage key
*/
var BAGGAGE_KEY = createContextKey("OpenTelemetry Baggage Key");
/**
* Retrieve the current baggage from the given context
*
* @param {Context} Context that manage all context values
* @returns {Baggage} Extracted baggage from the context
*/
function getBaggage(context) {
	return context.getValue(BAGGAGE_KEY) || void 0;
}
/**
* Retrieve the current baggage from the active/current context
*
* @returns {Baggage} Extracted baggage from the context
*/
function getActiveBaggage() {
	return getBaggage(ContextAPI.getInstance().active());
}
/**
* Store a baggage in the given context
*
* @param {Context} Context that manage all context values
* @param {Baggage} baggage that will be set in the actual context
*/
function setBaggage(context, baggage) {
	return context.setValue(BAGGAGE_KEY, baggage);
}
/**
* Delete the baggage stored in the given context
*
* @param {Context} Context that manage all context values
*/
function deleteBaggage(context) {
	return context.deleteValue(BAGGAGE_KEY);
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/api/propagation.js
var API_NAME$1 = "propagation";
var NOOP_TEXT_MAP_PROPAGATOR = new NoopTextMapPropagator();
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/propagation-api.js
/**
* Entrypoint for propagation API
*
* @since 1.0.0
*/
var propagation = class PropagationAPI {
	/** Empty private constructor prevents end users from constructing a new instance of the API */
	constructor() {
		this.createBaggage = createBaggage;
		this.getBaggage = getBaggage;
		this.getActiveBaggage = getActiveBaggage;
		this.setBaggage = setBaggage;
		this.deleteBaggage = deleteBaggage;
	}
	/** Get the singleton instance of the Propagator API */
	static getInstance() {
		if (!this._instance) this._instance = new PropagationAPI();
		return this._instance;
	}
	/**
	* Set the current propagator.
	*
	* @returns true if the propagator was successfully registered, else false
	*/
	setGlobalPropagator(propagator) {
		return registerGlobal(API_NAME$1, propagator, DiagAPI.instance());
	}
	/**
	* Inject context into a carrier to be propagated inter-process
	*
	* @param context Context carrying tracing data to inject
	* @param carrier carrier to inject context into
	* @param setter Function used to set values on the carrier
	*/
	inject(context, carrier, setter = defaultTextMapSetter) {
		return this._getGlobalPropagator().inject(context, carrier, setter);
	}
	/**
	* Extract context from a carrier
	*
	* @param context Context which the newly created context will inherit from
	* @param carrier Carrier to extract context from
	* @param getter Function used to extract keys from a carrier
	*/
	extract(context, carrier, getter = defaultTextMapGetter) {
		return this._getGlobalPropagator().extract(context, carrier, getter);
	}
	/**
	* Return a list of all fields which may be used by the propagator.
	*/
	fields() {
		return this._getGlobalPropagator().fields();
	}
	/** Remove the global propagator */
	disable() {
		unregisterGlobal(API_NAME$1, DiagAPI.instance());
	}
	_getGlobalPropagator() {
		return getGlobal(API_NAME$1) || NOOP_TEXT_MAP_PROPAGATOR;
	}
}.getInstance();
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/api/trace.js
var API_NAME = "trace";
//#endregion
//#region node_modules/.pnpm/@opentelemetry+api@1.9.1/node_modules/@opentelemetry/api/build/esm/trace-api.js
/**
* Entrypoint for trace API
*
* @since 1.0.0
*/
var trace = class TraceAPI {
	/** Empty private constructor prevents end users from constructing a new instance of the API */
	constructor() {
		this._proxyTracerProvider = new ProxyTracerProvider();
		this.wrapSpanContext = wrapSpanContext;
		this.isSpanContextValid = isSpanContextValid;
		this.deleteSpan = deleteSpan;
		this.getSpan = getSpan;
		this.getActiveSpan = getActiveSpan;
		this.getSpanContext = getSpanContext;
		this.setSpan = setSpan;
		this.setSpanContext = setSpanContext;
	}
	/** Get the singleton instance of the Trace API */
	static getInstance() {
		if (!this._instance) this._instance = new TraceAPI();
		return this._instance;
	}
	/**
	* Set the current global tracer.
	*
	* @returns true if the tracer provider was successfully registered, else false
	*/
	setGlobalTracerProvider(provider) {
		const success = registerGlobal(API_NAME, this._proxyTracerProvider, DiagAPI.instance());
		if (success) this._proxyTracerProvider.setDelegate(provider);
		return success;
	}
	/**
	* Returns the global tracer provider.
	*/
	getTracerProvider() {
		return getGlobal(API_NAME) || this._proxyTracerProvider;
	}
	/**
	* Returns a tracer from the global tracer provider.
	*/
	getTracer(name, version) {
		return this.getTracerProvider().getTracer(name, version);
	}
	/** Remove the global tracer provider */
	disable() {
		unregisterGlobal(API_NAME, DiagAPI.instance());
		this._proxyTracerProvider = new ProxyTracerProvider();
	}
}.getInstance();
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/trace/suppress-tracing.js
var SUPPRESS_TRACING_KEY = createContextKey("OpenTelemetry SDK Context Key SUPPRESS_TRACING");
function suppressTracing(context) {
	return context.setValue(SUPPRESS_TRACING_KEY, true);
}
function isTracingSuppressed(context) {
	return context.getValue(SUPPRESS_TRACING_KEY) === true;
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/baggage/constants.js
var BAGGAGE_HEADER = "baggage";
var BAGGAGE_MAX_PER_NAME_VALUE_PAIRS = 4096;
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/baggage/utils.js
function serializeKeyPairs(keyPairs) {
	return keyPairs.reduce((hValue, current) => {
		const value = `${hValue}${hValue !== "" ? "," : ""}${current}`;
		return value.length > 8192 ? hValue : value;
	}, "");
}
function getKeyPairs(baggage) {
	return baggage.getAllEntries().map(([key, value]) => {
		let entry = `${encodeURIComponent(key)}=${encodeURIComponent(value.value)}`;
		if (value.metadata !== void 0) entry += ";" + value.metadata.toString();
		return entry;
	});
}
function parsePairKeyValue(entry) {
	if (!entry) return;
	const metadataSeparatorIndex = entry.indexOf(";");
	const keyPairPart = metadataSeparatorIndex === -1 ? entry : entry.substring(0, metadataSeparatorIndex);
	const separatorIndex = keyPairPart.indexOf("=");
	if (separatorIndex <= 0) return;
	const rawKey = keyPairPart.substring(0, separatorIndex).trim();
	const rawValue = keyPairPart.substring(separatorIndex + 1).trim();
	if (!rawKey || !rawValue) return;
	let key;
	let value;
	try {
		key = decodeURIComponent(rawKey);
		value = decodeURIComponent(rawValue);
	} catch {
		return;
	}
	let metadata;
	if (metadataSeparatorIndex !== -1 && metadataSeparatorIndex < entry.length - 1) metadata = baggageEntryMetadataFromString(entry.substring(metadataSeparatorIndex + 1));
	return {
		key,
		value,
		metadata
	};
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/baggage/propagation/W3CBaggagePropagator.js
/**
* Propagates {@link Baggage} through Context format propagation.
*
* Based on the Baggage specification:
* https://w3c.github.io/baggage/
*/
var W3CBaggagePropagator = class {
	inject(context, carrier, setter) {
		const baggage = propagation.getBaggage(context);
		if (!baggage || isTracingSuppressed(context)) return;
		const headerValue = serializeKeyPairs(getKeyPairs(baggage).filter((pair) => {
			return pair.length <= BAGGAGE_MAX_PER_NAME_VALUE_PAIRS;
		}).slice(0, 180));
		if (headerValue.length > 0) setter.set(carrier, BAGGAGE_HEADER, headerValue);
	}
	extract(context, carrier, getter) {
		const headerValue = getter.get(carrier, BAGGAGE_HEADER);
		const baggageString = Array.isArray(headerValue) ? headerValue.join(",") : headerValue;
		if (!baggageString) return context;
		const baggage = {};
		if (baggageString.length === 0) return context;
		baggageString.split(",").forEach((entry) => {
			const keyPair = parsePairKeyValue(entry);
			if (keyPair) {
				const baggageEntry = { value: keyPair.value };
				if (keyPair.metadata) baggageEntry.metadata = keyPair.metadata;
				baggage[keyPair.key] = baggageEntry;
			}
		});
		if (Object.entries(baggage).length === 0) return context;
		return propagation.setBaggage(context, propagation.createBaggage(baggage));
	}
	fields() {
		return [BAGGAGE_HEADER];
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/common/attributes.js
function sanitizeAttributes(attributes) {
	const out = {};
	if (typeof attributes !== "object" || attributes == null) return out;
	for (const key in attributes) {
		if (!Object.prototype.hasOwnProperty.call(attributes, key)) continue;
		if (!isAttributeKey(key)) {
			diag.warn(`Invalid attribute key: ${key}`);
			continue;
		}
		const val = attributes[key];
		if (!isAttributeValue(val)) {
			diag.warn(`Invalid attribute value set for key: ${key}`);
			continue;
		}
		if (Array.isArray(val)) out[key] = val.slice();
		else out[key] = val;
	}
	return out;
}
function isAttributeKey(key) {
	return typeof key === "string" && key !== "";
}
function isAttributeValue(val) {
	if (val == null) return true;
	if (Array.isArray(val)) return isHomogeneousAttributeValueArray(val);
	return isValidPrimitiveAttributeValueType(typeof val);
}
function isHomogeneousAttributeValueArray(arr) {
	let type;
	for (const element of arr) {
		if (element == null) continue;
		const elementType = typeof element;
		if (elementType === type) continue;
		if (!type) {
			if (isValidPrimitiveAttributeValueType(elementType)) {
				type = elementType;
				continue;
			}
			return false;
		}
		return false;
	}
	return true;
}
function isValidPrimitiveAttributeValueType(valType) {
	switch (valType) {
		case "number":
		case "boolean":
		case "string": return true;
	}
	return false;
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/common/logging-error-handler.js
/**
* Returns a function that logs an error using the provided logger, or a
* console logger if one was not provided.
*/
function loggingErrorHandler() {
	return (ex) => {
		diag.error(stringifyException(ex));
	};
}
/**
* Converts an exception into a string representation
* @param {Exception} ex
*/
function stringifyException(ex) {
	if (typeof ex === "string") return ex;
	else return JSON.stringify(flattenException(ex));
}
/**
* Flattens an exception into key-value pairs by traversing the prototype chain
* and coercing values to strings. Duplicate properties will not be overwritten;
* the first insert wins.
*/
function flattenException(ex) {
	const result = {};
	let current = ex;
	while (current !== null) {
		Object.getOwnPropertyNames(current).forEach((propertyName) => {
			if (result[propertyName]) return;
			const value = current[propertyName];
			if (value) result[propertyName] = String(value);
		});
		current = Object.getPrototypeOf(current);
	}
	return result;
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/common/global-error-handler.js
/** The global error handler delegate */
var delegateHandler = loggingErrorHandler();
/**
* Return the global error handler
* @param {Exception} ex
*/
function globalErrorHandler(ex) {
	try {
		delegateHandler(ex);
	} catch {}
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/version.js
var VERSION$3 = "2.7.1";
//#endregion
//#region node_modules/.pnpm/@opentelemetry+semantic-conventions@1.41.1/node_modules/@opentelemetry/semantic-conventions/build/esm/stable_attributes.js
/**
* The exception message.
*
* @example Division by zero
* @example Can't convert 'int' object to str implicitly
*
* @note > [!WARNING]
*
* > This attribute may contain sensitive information.
*/
var ATTR_EXCEPTION_MESSAGE = "exception.message";
/**
* A stacktrace as a string in the natural representation for the language runtime. The representation is to be determined and documented by each language SIG.
*
* @example "Exception in thread "main" java.lang.RuntimeException: Test exception\\n at com.example.GenerateTrace.methodB(GenerateTrace.java:13)\\n at com.example.GenerateTrace.methodA(GenerateTrace.java:9)\\n at com.example.GenerateTrace.main(GenerateTrace.java:5)\\n"
*/
var ATTR_EXCEPTION_STACKTRACE = "exception.stacktrace";
/**
* The type of the exception (its fully-qualified class name, if applicable). The dynamic type of the exception should be preferred over the static type in languages that support it.
*
* @example java.net.ConnectException
* @example OSError
*
* @note If the recorded exception type is a wrapper that is not meaningful for
* failure classification, instrumentation **MAY** use the type of the inner
* exception instead. For example, in Go, errors created with `fmt.Errorf`
* using `%w` **MAY** be unwrapped when the wrapper type does not help
* classify the failure.
*/
var ATTR_EXCEPTION_TYPE = "exception.type";
/**
* Logical name of the service.
*
* @example shoppingcart
*
* @note **MUST** be the same for all instances of horizontally scaled services. If the value was not specified, SDKs **MUST** fallback to `unknown_service:` concatenated with the process executable name, e.g. `unknown_service:bash`. If the process executable name is not available, the value **MUST** be set to `unknown_service`.
* The process executable name is the name of the process executable, the same value as described by the [`process.executable.name`](process.md) resource attribute.
*/
var ATTR_SERVICE_NAME = "service.name";
/**
* The language of the telemetry SDK.
*/
var ATTR_TELEMETRY_SDK_LANGUAGE = "telemetry.sdk.language";
/**
* Enum value "webjs" for attribute {@link ATTR_TELEMETRY_SDK_LANGUAGE}.
*/
var TELEMETRY_SDK_LANGUAGE_VALUE_WEBJS = "webjs";
/**
* The name of the telemetry SDK as defined above.
*
* @example opentelemetry
*
* @note The OpenTelemetry SDK **MUST** set the `telemetry.sdk.name` attribute to `opentelemetry`.
* If another SDK, like a fork or a vendor-provided implementation, is used, this SDK **MUST** set the
* `telemetry.sdk.name` attribute to the fully-qualified class or module name of this SDK's main entry point
* or another suitable identifier depending on the language.
* The identifier `opentelemetry` is reserved and **MUST NOT** be used in this case.
* All custom identifiers **SHOULD** be stable across different versions of an implementation.
*/
var ATTR_TELEMETRY_SDK_NAME = "telemetry.sdk.name";
/**
* The version string of the telemetry SDK.
*
* @example 1.2.3
*/
var ATTR_TELEMETRY_SDK_VERSION = "telemetry.sdk.version";
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/semconv.js
/**
* The name of the runtime of this process.
*
* @example OpenJDK Runtime Environment
*
* @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
*/
var ATTR_PROCESS_RUNTIME_NAME = "process.runtime.name";
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/platform/browser/sdk-info.js
/** Constants describing the SDK in use */
var SDK_INFO = {
	[ATTR_TELEMETRY_SDK_NAME]: "opentelemetry",
	[ATTR_PROCESS_RUNTIME_NAME]: "browser",
	[ATTR_TELEMETRY_SDK_LANGUAGE]: TELEMETRY_SDK_LANGUAGE_VALUE_WEBJS,
	[ATTR_TELEMETRY_SDK_VERSION]: VERSION$3
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/platform/browser/index.js
/**
* @deprecated Use performance directly.
*/
var otperformance = performance;
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/common/time.js
var NANOSECOND_DIGITS = 9;
var MILLISECONDS_TO_NANOSECONDS = Math.pow(10, 6);
var SECOND_TO_NANOSECONDS = Math.pow(10, NANOSECOND_DIGITS);
/**
* Converts a number of milliseconds from epoch to HrTime([seconds, remainder in nanoseconds]).
* @param epochMillis
*/
function millisToHrTime(epochMillis) {
	const epochSeconds = epochMillis / 1e3;
	return [Math.trunc(epochSeconds), Math.round(epochMillis % 1e3 * MILLISECONDS_TO_NANOSECONDS)];
}
/**
* Returns an hrtime calculated via performance component.
* @param performanceNow
*/
function hrTime(performanceNow) {
	return addHrTimes(millisToHrTime(otperformance.timeOrigin), millisToHrTime(typeof performanceNow === "number" ? performanceNow : otperformance.now()));
}
/**
*
* Converts a TimeInput to an HrTime, defaults to _hrtime().
* @param time
*/
function timeInputToHrTime(time) {
	if (isTimeInputHrTime(time)) return time;
	else if (typeof time === "number") if (time < otperformance.timeOrigin) return hrTime(time);
	else return millisToHrTime(time);
	else if (time instanceof Date) return millisToHrTime(time.getTime());
	else throw TypeError("Invalid input type");
}
/**
* Returns a duration of two hrTime.
* @param startTime
* @param endTime
*/
function hrTimeDuration(startTime, endTime) {
	let seconds = endTime[0] - startTime[0];
	let nanos = endTime[1] - startTime[1];
	if (nanos < 0) {
		seconds -= 1;
		nanos += SECOND_TO_NANOSECONDS;
	}
	return [seconds, nanos];
}
/**
* Convert hrTime to nanoseconds.
* @param time
*/
function hrTimeToNanoseconds(time) {
	return time[0] * SECOND_TO_NANOSECONDS + time[1];
}
/**
* Convert hrTime to microseconds.
* @param time
*/
function hrTimeToMicroseconds(time) {
	return time[0] * 1e6 + time[1] / 1e3;
}
/**
* check if time is HrTime
* @param value
*/
function isTimeInputHrTime(value) {
	return Array.isArray(value) && value.length === 2 && typeof value[0] === "number" && typeof value[1] === "number";
}
/**
* check if input value is a correct types.TimeInput
* @param value
*/
function isTimeInput(value) {
	return isTimeInputHrTime(value) || typeof value === "number" || value instanceof Date;
}
/**
* Given 2 HrTime formatted times, return their sum as an HrTime.
*/
function addHrTimes(time1, time2) {
	const out = [time1[0] + time2[0], time1[1] + time2[1]];
	if (out[1] >= SECOND_TO_NANOSECONDS) {
		out[1] -= SECOND_TO_NANOSECONDS;
		out[0] += 1;
	}
	return out;
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/ExportResult.js
var ExportResultCode;
(function(ExportResultCode) {
	ExportResultCode[ExportResultCode["SUCCESS"] = 0] = "SUCCESS";
	ExportResultCode[ExportResultCode["FAILED"] = 1] = "FAILED";
})(ExportResultCode || (ExportResultCode = {}));
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/propagation/composite.js
/** Combines multiple propagators into a single propagator. */
var CompositePropagator = class {
	_propagators;
	_fields;
	/**
	* Construct a composite propagator from a list of propagators.
	*
	* @param [config] Configuration object for composite propagator
	*/
	constructor(config = {}) {
		this._propagators = config.propagators ?? [];
		const fields = /* @__PURE__ */ new Set();
		for (const propagator of this._propagators) {
			const propagatorFields = typeof propagator.fields === "function" ? propagator.fields() : [];
			for (const field of propagatorFields) fields.add(field);
		}
		this._fields = Array.from(fields);
	}
	/**
	* Run each of the configured propagators with the given context and carrier.
	* Propagators are run in the order they are configured, so if multiple
	* propagators write the same carrier key, the propagator later in the list
	* will "win".
	*
	* @param context Context to inject
	* @param carrier Carrier into which context will be injected
	*/
	inject(context, carrier, setter) {
		for (const propagator of this._propagators) try {
			propagator.inject(context, carrier, setter);
		} catch (err) {
			diag.warn(`Failed to inject with ${propagator.constructor.name}. Err: ${err.message}`);
		}
	}
	/**
	* Run each of the configured propagators with the given context and carrier.
	* Propagators are run in the order they are configured, so if multiple
	* propagators write the same context key, the propagator later in the list
	* will "win".
	*
	* @param context Context to add values to
	* @param carrier Carrier from which to extract context
	*/
	extract(context, carrier, getter) {
		return this._propagators.reduce((ctx, propagator) => {
			try {
				return propagator.extract(ctx, carrier, getter);
			} catch (err) {
				diag.warn(`Failed to extract with ${propagator.constructor.name}. Err: ${err.message}`);
			}
			return ctx;
		}, context);
	}
	fields() {
		return this._fields.slice();
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/internal/validators.js
var VALID_KEY_CHAR_RANGE = "[_0-9a-z-*/]";
var VALID_KEY_REGEX = new RegExp(`^(?:${`[a-z]${VALID_KEY_CHAR_RANGE}{0,255}`}|${`[a-z0-9]${VALID_KEY_CHAR_RANGE}{0,240}@[a-z]${VALID_KEY_CHAR_RANGE}{0,13}`})$`);
var VALID_VALUE_BASE_REGEX = /^[ -~]{0,255}[!-~]$/;
var INVALID_VALUE_COMMA_EQUAL_REGEX = /,|=/;
/**
* Key is opaque string up to 256 characters printable. It MUST begin with a
* lowercase letter, and can only contain lowercase letters a-z, digits 0-9,
* underscores _, dashes -, asterisks *, and forward slashes /.
* For multi-tenant vendor scenarios, an at sign (@) can be used to prefix the
* vendor name. Vendors SHOULD set the tenant ID at the beginning of the key.
* see https://www.w3.org/TR/trace-context/#key
*/
function validateKey(key) {
	return VALID_KEY_REGEX.test(key);
}
/**
* Value is opaque string up to 256 characters printable ASCII RFC0020
* characters (i.e., the range 0x20 to 0x7E) except comma , and =.
*/
function validateValue(value) {
	return VALID_VALUE_BASE_REGEX.test(value) && !INVALID_VALUE_COMMA_EQUAL_REGEX.test(value);
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/trace/TraceState.js
var MAX_TRACE_STATE_ITEMS = 32;
var MAX_TRACE_STATE_LEN = 512;
var LIST_MEMBERS_SEPARATOR = ",";
var LIST_MEMBER_KEY_VALUE_SPLITTER = "=";
/**
* TraceState must be a class and not a simple object type because of the spec
* requirement (https://www.w3.org/TR/trace-context/#tracestate-field).
*
* Here is the list of allowed mutations:
* - New key-value pair should be added into the beginning of the list
* - The value of any key can be updated. Modified keys MUST be moved to the
* beginning of the list.
*/
var TraceState = class TraceState {
	_length;
	_rawTraceState;
	_internalState;
	constructor(rawTraceState) {
		this._rawTraceState = typeof rawTraceState === "string" ? rawTraceState : "";
		this._length = this._rawTraceState.length;
	}
	set(key, value) {
		if (!validateKey(key) || !validateValue(value)) return this;
		const currState = this._getState();
		const currValue = currState.get(key);
		let newLength = this._length;
		if (typeof currValue === "string") newLength += value.length - currValue.length;
		else newLength += key.length + value.length + (currState.size > 0 ? 2 : 1);
		if (newLength > MAX_TRACE_STATE_LEN) return this;
		const newState = new Map(currState);
		newState.delete(key);
		newState.set(key, value);
		return this._fromState(newState, newLength);
	}
	unset(key) {
		const currState = this._getState();
		const currValue = currState.get(key);
		if (typeof currValue !== "string") return this;
		let newLength = this._length - (key.length + currValue.length + 1);
		if (currState.size > 1) newLength = newLength - 1;
		const newState = new Map(currState);
		newState.delete(key);
		return this._fromState(newState, newLength);
	}
	get(key) {
		return this._getState().get(key);
	}
	serialize() {
		let serialized = "";
		let index = 0;
		for (const entry of this._getState()) {
			if (index > 0) serialized = LIST_MEMBERS_SEPARATOR + serialized;
			serialized = `${entry[0]}${LIST_MEMBER_KEY_VALUE_SPLITTER}${entry[1]}` + serialized;
			index++;
		}
		return serialized;
	}
	_getState() {
		if (this._internalState) return this._internalState;
		const vendorMembers = this._rawTraceState.split(LIST_MEMBERS_SEPARATOR);
		const vendorEntries = /* @__PURE__ */ new Map();
		let currentLength = 0;
		for (const member of vendorMembers) {
			const m = member.trim();
			const idx = m.indexOf(LIST_MEMBER_KEY_VALUE_SPLITTER);
			if (idx === -1) continue;
			const key = m.slice(0, idx);
			const value = m.slice(idx + 1);
			if (!validateKey(key) || !validateValue(value)) continue;
			const futureLength = currentLength + m.length + (vendorEntries.size > 0 ? 1 : 0);
			if (futureLength > MAX_TRACE_STATE_LEN) continue;
			vendorEntries.set(key, value);
			currentLength = futureLength;
			if (vendorEntries.size >= MAX_TRACE_STATE_ITEMS) break;
		}
		this._length = currentLength;
		this._internalState = new Map(Array.from(vendorEntries.entries()).reverse());
		return this._internalState;
	}
	_fromState(state, length) {
		const traceState = Object.create(TraceState.prototype);
		traceState._internalState = state;
		traceState._length = length;
		return traceState;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/trace/W3CTraceContextPropagator.js
var TRACE_PARENT_HEADER = "traceparent";
var TRACE_STATE_HEADER = "tracestate";
var VERSION$2 = "00";
var TRACE_PARENT_REGEX = new RegExp(`^\\s?((?!ff)[\\da-f]{2})-((?![0]{32})[\\da-f]{32})-((?![0]{16})[\\da-f]{16})-([\\da-f]{2})(-.*)?\\s?$`);
/**
* Parses information from the [traceparent] span tag and converts it into {@link SpanContext}
* @param traceParent - A meta property that comes from server.
*     It should be dynamically generated server side to have the server's request trace Id,
*     a parent span Id that was set on the server's request span,
*     and the trace flags to indicate the server's sampling decision
*     (01 = sampled, 00 = not sampled).
*     for example: '{version}-{traceId}-{spanId}-{sampleDecision}'
*     For more information see {@link https://www.w3.org/TR/trace-context/}
*/
function parseTraceParent(traceParent) {
	const match = TRACE_PARENT_REGEX.exec(traceParent);
	if (!match) return null;
	if (match[1] === "00" && match[5]) return null;
	return {
		traceId: match[2],
		spanId: match[3],
		traceFlags: parseInt(match[4], 16)
	};
}
/**
* Propagates {@link SpanContext} through Trace Context format propagation.
*
* Based on the Trace Context specification:
* https://www.w3.org/TR/trace-context/
*/
var W3CTraceContextPropagator = class {
	inject(context, carrier, setter) {
		const spanContext = trace.getSpanContext(context);
		if (!spanContext || isTracingSuppressed(context) || !isSpanContextValid(spanContext)) return;
		const traceParent = `${VERSION$2}-${spanContext.traceId}-${spanContext.spanId}-0${Number(spanContext.traceFlags || TraceFlags.NONE).toString(16)}`;
		setter.set(carrier, TRACE_PARENT_HEADER, traceParent);
		if (spanContext.traceState) setter.set(carrier, TRACE_STATE_HEADER, spanContext.traceState.serialize());
	}
	extract(context, carrier, getter) {
		const traceParentHeader = getter.get(carrier, TRACE_PARENT_HEADER);
		if (!traceParentHeader) return context;
		const traceParent = Array.isArray(traceParentHeader) ? traceParentHeader[0] : traceParentHeader;
		if (typeof traceParent !== "string") return context;
		const spanContext = parseTraceParent(traceParent);
		if (!spanContext) return context;
		spanContext.isRemote = true;
		const traceStateHeader = getter.get(carrier, TRACE_STATE_HEADER);
		if (traceStateHeader) {
			const state = Array.isArray(traceStateHeader) ? traceStateHeader.join(",") : traceStateHeader;
			spanContext.traceState = new TraceState(typeof state === "string" ? state : void 0);
		}
		return trace.setSpanContext(context, spanContext);
	}
	fields() {
		return [TRACE_PARENT_HEADER, TRACE_STATE_HEADER];
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/utils/lodash.merge.js
/**
* based on lodash in order to support esm builds without esModuleInterop.
* lodash is using MIT License.
**/
var objectTag = "[object Object]";
var nullTag = "[object Null]";
var undefinedTag = "[object Undefined]";
var funcToString = Function.prototype.toString;
var objectCtorString = funcToString.call(Object);
var getPrototypeOf = Object.getPrototypeOf;
var objectProto = Object.prototype;
var hasOwnProperty = objectProto.hasOwnProperty;
var symToStringTag = Symbol ? Symbol.toStringTag : void 0;
var nativeObjectToString = objectProto.toString;
/**
* Checks if `value` is a plain object, that is, an object created by the
* `Object` constructor or one with a `[[Prototype]]` of `null`.
*
* @static
* @memberOf _
* @since 0.8.0
* @category Lang
* @param {*} value The value to check.
* @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
* @example
*
* function Foo() {
*   this.a = 1;
* }
*
* _.isPlainObject(new Foo);
* // => false
*
* _.isPlainObject([1, 2, 3]);
* // => false
*
* _.isPlainObject({ 'x': 0, 'y': 0 });
* // => true
*
* _.isPlainObject(Object.create(null));
* // => true
*/
function isPlainObject(value) {
	if (!isObjectLike(value) || baseGetTag(value) !== objectTag) return false;
	const proto = getPrototypeOf(value);
	if (proto === null) return true;
	const Ctor = hasOwnProperty.call(proto, "constructor") && proto.constructor;
	return typeof Ctor == "function" && Ctor instanceof Ctor && funcToString.call(Ctor) === objectCtorString;
}
/**
* Checks if `value` is object-like. A value is object-like if it's not `null`
* and has a `typeof` result of "object".
*
* @static
* @memberOf _
* @since 4.0.0
* @category Lang
* @param {*} value The value to check.
* @returns {boolean} Returns `true` if `value` is object-like, else `false`.
* @example
*
* _.isObjectLike({});
* // => true
*
* _.isObjectLike([1, 2, 3]);
* // => true
*
* _.isObjectLike(_.noop);
* // => false
*
* _.isObjectLike(null);
* // => false
*/
function isObjectLike(value) {
	return value != null && typeof value == "object";
}
/**
* The base implementation of `getTag` without fallbacks for buggy environments.
*
* @private
* @param {*} value The value to query.
* @returns {string} Returns the `toStringTag`.
*/
function baseGetTag(value) {
	if (value == null) return value === void 0 ? undefinedTag : nullTag;
	return symToStringTag && symToStringTag in Object(value) ? getRawTag(value) : objectToString(value);
}
/**
* A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
*
* @private
* @param {*} value The value to query.
* @returns {string} Returns the raw `toStringTag`.
*/
function getRawTag(value) {
	const isOwn = hasOwnProperty.call(value, symToStringTag), tag = value[symToStringTag];
	let unmasked = false;
	try {
		value[symToStringTag] = void 0;
		unmasked = true;
	} catch {}
	const result = nativeObjectToString.call(value);
	if (unmasked) if (isOwn) value[symToStringTag] = tag;
	else delete value[symToStringTag];
	return result;
}
/**
* Converts `value` to a string using `Object.prototype.toString`.
*
* @private
* @param {*} value The value to convert.
* @returns {string} Returns the converted string.
*/
function objectToString(value) {
	return nativeObjectToString.call(value);
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/utils/merge.js
var MAX_LEVEL = 20;
/**
* Merges objects together
* @param args - objects / values to be merged
*/
function merge(...args) {
	let result = args.shift();
	const objects = /* @__PURE__ */ new WeakMap();
	while (args.length > 0) result = mergeTwoObjects(result, args.shift(), 0, objects);
	return result;
}
function takeValue(value) {
	if (isArray(value)) return value.slice();
	return value;
}
/**
* Merges two objects
* @param one - first object
* @param two - second object
* @param level - current deep level
* @param objects - objects holder that has been already referenced - to prevent
* cyclic dependency
*/
function mergeTwoObjects(one, two, level = 0, objects) {
	let result;
	if (level > MAX_LEVEL) return;
	level++;
	if (isPrimitive(one) || isPrimitive(two) || isFunction(two)) result = takeValue(two);
	else if (isArray(one)) {
		result = one.slice();
		if (isArray(two)) for (let i = 0, j = two.length; i < j; i++) result.push(takeValue(two[i]));
		else if (isObject$2(two)) {
			const keys = Object.keys(two);
			for (let i = 0, j = keys.length; i < j; i++) {
				const key = keys[i];
				if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
				result[key] = takeValue(two[key]);
			}
		}
	} else if (isObject$2(one)) if (isObject$2(two)) {
		if (!shouldMerge(one, two)) return two;
		result = Object.assign({}, one);
		const keys = Object.keys(two);
		for (let i = 0, j = keys.length; i < j; i++) {
			const key = keys[i];
			if (key === "__proto__" || key === "constructor" || key === "prototype") continue;
			const twoValue = two[key];
			if (isPrimitive(twoValue)) if (typeof twoValue === "undefined") delete result[key];
			else result[key] = twoValue;
			else {
				const obj1 = result[key];
				const obj2 = twoValue;
				if (wasObjectReferenced(one, key, objects) || wasObjectReferenced(two, key, objects)) delete result[key];
				else {
					if (isObject$2(obj1) && isObject$2(obj2)) {
						const arr1 = objects.get(obj1) || [];
						const arr2 = objects.get(obj2) || [];
						arr1.push({
							obj: one,
							key
						});
						arr2.push({
							obj: two,
							key
						});
						objects.set(obj1, arr1);
						objects.set(obj2, arr2);
					}
					result[key] = mergeTwoObjects(result[key], twoValue, level, objects);
				}
			}
		}
	} else result = two;
	return result;
}
/**
* Function to check if object has been already reference
* @param obj
* @param key
* @param objects
*/
function wasObjectReferenced(obj, key, objects) {
	const arr = objects.get(obj[key]) || [];
	for (let i = 0, j = arr.length; i < j; i++) {
		const info = arr[i];
		if (info.key === key && info.obj === obj) return true;
	}
	return false;
}
function isArray(value) {
	return Array.isArray(value);
}
function isFunction(value) {
	return typeof value === "function";
}
function isObject$2(value) {
	return !isPrimitive(value) && !isArray(value) && !isFunction(value) && typeof value === "object";
}
function isPrimitive(value) {
	return typeof value === "string" || typeof value === "number" || typeof value === "boolean" || typeof value === "undefined" || value instanceof Date || value instanceof RegExp || value === null;
}
function shouldMerge(one, two) {
	if (!isPlainObject(one) || !isPlainObject(two)) return false;
	return true;
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/utils/timeout.js
/**
* Error that is thrown on timeouts.
*/
var TimeoutError$1 = class TimeoutError$1 extends Error {
	constructor(message) {
		super(message);
		Object.setPrototypeOf(this, TimeoutError$1.prototype);
	}
};
/**
* Adds a timeout to a promise and rejects if the specified timeout has elapsed. Also rejects if the specified promise
* rejects, and resolves if the specified promise resolves.
*
* <p> NOTE: this operation will continue even after it throws a {@link TimeoutError}.
*
* @param promise promise to use with timeout.
* @param timeout the timeout in milliseconds until the returned promise is rejected.
*/
function callWithTimeout$1(promise, timeout) {
	let timeoutHandle;
	const timeoutPromise = new Promise(function timeoutFunction(_resolve, reject) {
		timeoutHandle = setTimeout(function timeoutHandler() {
			reject(new TimeoutError$1("Operation timed out."));
		}, timeout);
	});
	return Promise.race([promise, timeoutPromise]).then((result) => {
		clearTimeout(timeoutHandle);
		return result;
	}, (reason) => {
		clearTimeout(timeoutHandle);
		throw reason;
	});
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/utils/promise.js
var Deferred = class {
	_promise;
	_resolve;
	_reject;
	constructor() {
		this._promise = new Promise((resolve, reject) => {
			this._resolve = resolve;
			this._reject = reject;
		});
	}
	get promise() {
		return this._promise;
	}
	resolve(val) {
		this._resolve(val);
	}
	reject(err) {
		this._reject(err);
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/utils/callback.js
/**
* Bind the callback and only invoke the callback once regardless how many times `BindOnceFuture.call` is invoked.
*/
var BindOnceFuture = class {
	_isCalled = false;
	_deferred = new Deferred();
	_callback;
	_that;
	constructor(callback, that) {
		this._callback = callback;
		this._that = that;
	}
	get isCalled() {
		return this._isCalled;
	}
	get promise() {
		return this._deferred.promise;
	}
	call(...args) {
		if (!this._isCalled) {
			this._isCalled = true;
			try {
				Promise.resolve(this._callback.call(this._that, ...args)).then((val) => this._deferred.resolve(val), (err) => this._deferred.reject(err));
			} catch (err) {
				this._deferred.reject(err);
			}
		}
		return this._deferred.promise;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/internal/exporter.js
/**
* @internal
* Shared functionality used by Exporters while exporting data, including suppression of Traces.
*/
function _export(exporter, arg) {
	return new Promise((resolve) => {
		context.with(suppressTracing(context.active()), () => {
			exporter.export(arg, resolve);
		});
	});
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+core@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/core/build/esm/index.js
var internal = { _export };
//#endregion
//#region node_modules/.pnpm/@opentelemetry+resources@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/resources/build/esm/default-service-name.js
var serviceName;
/**
* Returns the default service name for OpenTelemetry resources.
* In Node.js environments, returns "unknown_service:<process.argv0>".
* In browser/edge environments, returns "unknown_service".
*/
function defaultServiceName() {
	if (serviceName === void 0) try {
		const argv0 = globalThis.process.argv0;
		serviceName = argv0 ? `unknown_service:${argv0}` : "unknown_service";
	} catch {
		serviceName = "unknown_service";
	}
	return serviceName;
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+resources@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/resources/build/esm/utils.js
var isPromiseLike = (val) => {
	return val !== null && typeof val === "object" && typeof val.then === "function";
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+resources@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/resources/build/esm/ResourceImpl.js
var ResourceImpl = class ResourceImpl {
	_rawAttributes;
	_asyncAttributesPending = false;
	_schemaUrl;
	_memoizedAttributes;
	static FromAttributeList(attributes, options) {
		const res = new ResourceImpl({}, options);
		res._rawAttributes = guardedRawAttributes(attributes);
		res._asyncAttributesPending = attributes.filter(([_, val]) => isPromiseLike(val)).length > 0;
		return res;
	}
	constructor(resource, options) {
		const attributes = resource.attributes ?? {};
		this._rawAttributes = Object.entries(attributes).map(([k, v]) => {
			if (isPromiseLike(v)) this._asyncAttributesPending = true;
			return [k, v];
		});
		this._rawAttributes = guardedRawAttributes(this._rawAttributes);
		this._schemaUrl = validateSchemaUrl(options?.schemaUrl);
	}
	get asyncAttributesPending() {
		return this._asyncAttributesPending;
	}
	async waitForAsyncAttributes() {
		if (!this.asyncAttributesPending) return;
		for (let i = 0; i < this._rawAttributes.length; i++) {
			const [k, v] = this._rawAttributes[i];
			this._rawAttributes[i] = [k, isPromiseLike(v) ? await v : v];
		}
		this._asyncAttributesPending = false;
	}
	get attributes() {
		if (this.asyncAttributesPending) diag.error("Accessing resource attributes before async attributes settled");
		if (this._memoizedAttributes) return this._memoizedAttributes;
		const attrs = {};
		for (const [k, v] of this._rawAttributes) {
			if (isPromiseLike(v)) {
				diag.debug(`Unsettled resource attribute ${k} skipped`);
				continue;
			}
			if (v != null) attrs[k] ??= v;
		}
		if (!this._asyncAttributesPending) this._memoizedAttributes = attrs;
		return attrs;
	}
	getRawAttributes() {
		return this._rawAttributes;
	}
	get schemaUrl() {
		return this._schemaUrl;
	}
	merge(resource) {
		if (resource == null) return this;
		const mergedSchemaUrl = mergeSchemaUrl(this, resource);
		const mergedOptions = mergedSchemaUrl ? { schemaUrl: mergedSchemaUrl } : void 0;
		return ResourceImpl.FromAttributeList([...resource.getRawAttributes(), ...this.getRawAttributes()], mergedOptions);
	}
};
function resourceFromAttributes(attributes, options) {
	return ResourceImpl.FromAttributeList(Object.entries(attributes), options);
}
function defaultResource() {
	return resourceFromAttributes({
		[ATTR_SERVICE_NAME]: defaultServiceName(),
		[ATTR_TELEMETRY_SDK_LANGUAGE]: SDK_INFO[ATTR_TELEMETRY_SDK_LANGUAGE],
		[ATTR_TELEMETRY_SDK_NAME]: SDK_INFO[ATTR_TELEMETRY_SDK_NAME],
		[ATTR_TELEMETRY_SDK_VERSION]: SDK_INFO[ATTR_TELEMETRY_SDK_VERSION]
	});
}
function guardedRawAttributes(attributes) {
	return attributes.map(([k, v]) => {
		if (isPromiseLike(v)) return [k, v.catch((err) => {
			diag.debug("promise rejection for resource attribute: %s - %s", k, err);
		})];
		return [k, v];
	});
}
function validateSchemaUrl(schemaUrl) {
	if (typeof schemaUrl === "string" || schemaUrl === void 0) return schemaUrl;
	diag.warn("Schema URL must be string or undefined, got %s. Schema URL will be ignored.", schemaUrl);
}
function mergeSchemaUrl(old, updating) {
	const oldSchemaUrl = old?.schemaUrl;
	const updatingSchemaUrl = updating?.schemaUrl;
	const isOldEmpty = oldSchemaUrl === void 0 || oldSchemaUrl === "";
	const isUpdatingEmpty = updatingSchemaUrl === void 0 || updatingSchemaUrl === "";
	if (isOldEmpty) return updatingSchemaUrl;
	if (isUpdatingEmpty) return oldSchemaUrl;
	if (oldSchemaUrl === updatingSchemaUrl) return oldSchemaUrl;
	diag.warn("Schema URL merge conflict: old resource has \"%s\", updating resource has \"%s\". Resulting resource will have undefined Schema URL.", oldSchemaUrl, updatingSchemaUrl);
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-logs@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-logs/build/esm/utils/validation.js
/**
* Validates if a value is a valid AnyValue for Log Attributes according to OpenTelemetry spec.
* Log Attributes support a superset of standard Attributes and must support:
* - Scalar values: string, boolean, signed 64 bit integer, or double precision floating point
* - Byte arrays (Uint8Array)
* - Arrays of any values (heterogeneous arrays allowed)
* - Maps from string to any value (nested objects)
* - Empty values (null/undefined)
*
* @param val - The value to validate
* @returns true if the value is a valid AnyValue, false otherwise
*/
function isLogAttributeValue(val) {
	return isLogAttributeValueInternal(val, /* @__PURE__ */ new WeakSet());
}
function isLogAttributeValueInternal(val, visited) {
	if (val == null) return true;
	if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") return true;
	if (val instanceof Uint8Array) return true;
	if (typeof val === "object") {
		if (visited.has(val)) return false;
		visited.add(val);
		if (Array.isArray(val)) return val.every((item) => isLogAttributeValueInternal(item, visited));
		const obj = val;
		if (obj.constructor !== Object && obj.constructor !== void 0) return false;
		return Object.values(obj).every((item) => isLogAttributeValueInternal(item, visited));
	}
	return false;
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-logs@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-logs/build/esm/LogRecordImpl.js
var LogRecordImpl = class {
	hrTime;
	hrTimeObserved;
	spanContext;
	resource;
	instrumentationScope;
	attributes = {};
	_severityText;
	_severityNumber;
	_body;
	_eventName;
	_attributesCount = 0;
	_droppedAttributesCount = 0;
	_isReadonly = false;
	_logRecordLimits;
	set severityText(severityText) {
		if (this._isLogRecordReadonly()) return;
		this._severityText = severityText;
	}
	get severityText() {
		return this._severityText;
	}
	set severityNumber(severityNumber) {
		if (this._isLogRecordReadonly()) return;
		this._severityNumber = severityNumber;
	}
	get severityNumber() {
		return this._severityNumber;
	}
	set body(body) {
		if (this._isLogRecordReadonly()) return;
		this._body = body;
	}
	get body() {
		return this._body;
	}
	get eventName() {
		return this._eventName;
	}
	set eventName(eventName) {
		if (this._isLogRecordReadonly()) return;
		this._eventName = eventName;
	}
	get droppedAttributesCount() {
		return this._droppedAttributesCount;
	}
	constructor(_sharedState, instrumentationScope, logRecord) {
		const { timestamp, observedTimestamp, eventName, severityNumber, severityText, body, attributes = {}, exception, context } = logRecord;
		const now = Date.now();
		this.hrTime = timeInputToHrTime(timestamp ?? now);
		this.hrTimeObserved = timeInputToHrTime(observedTimestamp ?? now);
		if (context) {
			const spanContext = trace.getSpanContext(context);
			if (spanContext && isSpanContextValid(spanContext)) this.spanContext = spanContext;
		}
		this.severityNumber = severityNumber;
		this.severityText = severityText;
		this.body = body;
		this.resource = _sharedState.resource;
		this.instrumentationScope = instrumentationScope;
		this._logRecordLimits = _sharedState.logRecordLimits;
		this._eventName = eventName;
		this.setAttributes(attributes);
		if (exception != null) this._setException(exception);
	}
	setAttribute(key, value) {
		if (this._isLogRecordReadonly()) return this;
		if (key.length === 0) {
			diag.warn(`Invalid attribute key: ${key}`);
			return this;
		}
		if (!isLogAttributeValue(value)) {
			diag.warn(`Invalid attribute value set for key: ${key}`);
			return this;
		}
		const isNewKey = !Object.prototype.hasOwnProperty.call(this.attributes, key);
		if (isNewKey && this._attributesCount >= this._logRecordLimits.attributeCountLimit) {
			this._droppedAttributesCount++;
			if (this._droppedAttributesCount === 1) diag.warn("Dropping extra attributes.");
			return this;
		}
		this.attributes[key] = this._truncateToSize(value);
		if (isNewKey) this._attributesCount++;
		return this;
	}
	setAttributes(attributes) {
		for (const [k, v] of Object.entries(attributes)) this.setAttribute(k, v);
		return this;
	}
	setBody(body) {
		this.body = body;
		return this;
	}
	setEventName(eventName) {
		this.eventName = eventName;
		return this;
	}
	setSeverityNumber(severityNumber) {
		this.severityNumber = severityNumber;
		return this;
	}
	setSeverityText(severityText) {
		this.severityText = severityText;
		return this;
	}
	/**
	* @internal
	* A LogRecordProcessor may freely modify logRecord for the duration of the OnEmit call.
	* If logRecord is needed after OnEmit returns (i.e. for asynchronous processing) only reads are permitted.
	*/
	_makeReadonly() {
		this._isReadonly = true;
	}
	_truncateToSize(value) {
		const limit = this._logRecordLimits.attributeValueLengthLimit;
		if (limit <= 0) {
			diag.warn(`Attribute value limit must be positive, got ${limit}`);
			return value;
		}
		if (value == null) return value;
		if (typeof value === "string") return this._truncateToLimitUtil(value, limit);
		if (value instanceof Uint8Array) return value;
		if (Array.isArray(value)) return value.map((val) => this._truncateToSize(val));
		if (typeof value === "object") {
			const truncatedObj = {};
			for (const [k, v] of Object.entries(value)) truncatedObj[k] = this._truncateToSize(v);
			return truncatedObj;
		}
		return value;
	}
	_setException(exception) {
		let hasMinimumAttributes = false;
		if (typeof exception === "string" || typeof exception === "number") {
			if (!Object.hasOwn(this.attributes, "exception.message")) this.setAttribute(ATTR_EXCEPTION_MESSAGE, String(exception));
			hasMinimumAttributes = true;
		} else if (exception && typeof exception === "object") {
			const exceptionObj = exception;
			if (exceptionObj.code) {
				if (!Object.hasOwn(this.attributes, "exception.type")) this.setAttribute(ATTR_EXCEPTION_TYPE, exceptionObj.code.toString());
				hasMinimumAttributes = true;
			} else if (exceptionObj.name) {
				if (!Object.hasOwn(this.attributes, "exception.type")) this.setAttribute(ATTR_EXCEPTION_TYPE, exceptionObj.name);
				hasMinimumAttributes = true;
			}
			if (exceptionObj.message) {
				if (!Object.hasOwn(this.attributes, "exception.message")) this.setAttribute(ATTR_EXCEPTION_MESSAGE, exceptionObj.message);
				hasMinimumAttributes = true;
			}
			if (exceptionObj.stack) {
				if (!Object.hasOwn(this.attributes, "exception.stacktrace")) this.setAttribute(ATTR_EXCEPTION_STACKTRACE, exceptionObj.stack);
				hasMinimumAttributes = true;
			}
		}
		if (!hasMinimumAttributes) diag.warn(`Failed to record an exception ${exception}`);
	}
	_truncateToLimitUtil(value, limit) {
		if (value.length <= limit) return value;
		return value.substring(0, limit);
	}
	_isLogRecordReadonly() {
		if (this._isReadonly) diag.warn("Can not execute the operation on emitted log record");
		return this._isReadonly;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-logs@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-logs/build/esm/Logger.js
var Logger = class {
	instrumentationScope;
	_sharedState;
	_loggerConfig;
	constructor(instrumentationScope, sharedState) {
		this.instrumentationScope = instrumentationScope;
		this._sharedState = sharedState;
		this._loggerConfig = this._sharedState.getLoggerConfig(this.instrumentationScope);
	}
	emit(logRecord) {
		const currentContext = logRecord.context || context.active();
		if (!this.enabled(logRecord)) return;
		/**
		* If a Logger was obtained with include_trace_context=true,
		* the LogRecords it emits MUST automatically include the Trace Context from the active Context,
		* if Context has not been explicitly set.
		*/
		const logRecordInstance = new LogRecordImpl(this._sharedState, this.instrumentationScope, {
			context: currentContext,
			...logRecord
		});
		this._sharedState.loggerMetrics.emitLog();
		/**
		* the explicitly passed Context,
		* the current Context, or an empty Context if the Logger was obtained with include_trace_context=false
		*/
		this._sharedState.activeProcessor.onEmit(logRecordInstance, currentContext);
		/**
		* A LogRecordProcessor may freely modify logRecord for the duration of the OnEmit call.
		* If logRecord is needed after OnEmit returns (i.e. for asynchronous processing) only reads are permitted.
		*/
		logRecordInstance._makeReadonly();
	}
	enabled(options) {
		const loggerConfig = this._loggerConfig;
		if (loggerConfig.disabled) return false;
		const severityNumber = options?.severityNumber;
		if (typeof severityNumber === "number" && severityNumber !== SeverityNumber.UNSPECIFIED && severityNumber < loggerConfig.minimumSeverity) return false;
		const currentContext = options?.context || context.active();
		if (loggerConfig.traceBased) {
			const spanContext = trace.getSpanContext(currentContext);
			if (spanContext && isSpanContextValid(spanContext)) {
				if (!((spanContext.traceFlags & TraceFlags.SAMPLED) === TraceFlags.SAMPLED)) return false;
			}
		}
		const enabledOpts = {
			context: currentContext,
			instrumentationScope: this.instrumentationScope,
			severityNumber: options?.severityNumber,
			eventName: options?.eventName
		};
		for (const processor of this._sharedState.processors) if (!processor.enabled || processor.enabled(enabledOpts)) return true;
		return false;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-logs@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-logs/build/esm/export/NoopLogRecordProcessor.js
var NoopLogRecordProcessor = class {
	forceFlush() {
		return Promise.resolve();
	}
	onEmit(_logRecord, _context) {}
	shutdown() {
		return Promise.resolve();
	}
	enabled(_options) {
		return false;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-logs@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-logs/build/esm/MultiLogRecordProcessor.js
/**
* Implementation of the {@link LogRecordProcessor} that simply forwards all
* received events to a list of {@link LogRecordProcessor}s.
*/
var MultiLogRecordProcessor = class {
	processors;
	forceFlushTimeoutMillis;
	constructor(processors, forceFlushTimeoutMillis) {
		this.processors = processors;
		this.forceFlushTimeoutMillis = forceFlushTimeoutMillis;
	}
	async forceFlush() {
		const timeout = this.forceFlushTimeoutMillis;
		await Promise.all(this.processors.map((processor) => callWithTimeout$1(processor.forceFlush(), timeout)));
	}
	onEmit(logRecord, context) {
		this.processors.forEach((processors) => processors.onEmit(logRecord, context));
	}
	async shutdown() {
		await Promise.all(this.processors.map((processor) => processor.shutdown()));
	}
	enabled(options) {
		for (const processor of this.processors) if (!processor.enabled || processor.enabled(options)) return true;
		return false;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-logs@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-logs/build/esm/internal/utils.js
/**
* Converting the instrumentation scope object to a unique identifier string.
* @param scope - The instrumentation scope to convert
* @returns A unique string identifier for the scope
*/
function getInstrumentationScopeKey(scope) {
	return `${scope.name}@${scope.version || ""}:${scope.schemaUrl || ""}`;
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-logs@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-logs/build/esm/semconv.js
/**
* The number of logs submitted to enabled SDK Loggers.
*
* @experimental This metric is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
*/
var METRIC_OTEL_SDK_LOG_CREATED = "otel.sdk.log.created";
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-logs@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-logs/build/esm/LoggerMetrics.js
/**
* Generates `otel.sdk.log.*` metrics.
* https://opentelemetry.io/docs/specs/semconv/otel/sdk-metrics/#log-metrics
*/
var LoggerMetrics = class {
	createdLogs;
	constructor(meter) {
		this.createdLogs = meter.createCounter(METRIC_OTEL_SDK_LOG_CREATED, {
			unit: "{log_record}",
			description: "The number of logs submitted to enabled SDK Loggers."
		});
	}
	emitLog() {
		this.createdLogs.add(1);
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-logs@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-logs/build/esm/version.js
var VERSION$1 = "0.218.0";
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-logs@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-logs/build/esm/internal/LoggerProviderSharedState.js
var DEFAULT_LOGGER_CONFIG = {
	disabled: false,
	minimumSeverity: SeverityNumber.UNSPECIFIED,
	traceBased: false
};
/**
* Default LoggerConfigurator that returns the default config for all loggers
*/
var DEFAULT_LOGGER_CONFIGURATOR = () => ({ ...DEFAULT_LOGGER_CONFIG });
var LoggerProviderSharedState = class {
	loggers = /* @__PURE__ */ new Map();
	activeProcessor;
	registeredLogRecordProcessors = [];
	resource;
	forceFlushTimeoutMillis;
	logRecordLimits;
	processors;
	loggerMetrics;
	_loggerConfigurator;
	_loggerConfigs = /* @__PURE__ */ new Map();
	constructor(resource, forceFlushTimeoutMillis, logRecordLimits, processors, loggerConfigurator, meterProvider) {
		this.resource = resource;
		this.forceFlushTimeoutMillis = forceFlushTimeoutMillis;
		this.logRecordLimits = logRecordLimits;
		this.processors = processors;
		if (processors.length > 0) {
			this.registeredLogRecordProcessors = processors;
			this.activeProcessor = new MultiLogRecordProcessor(this.registeredLogRecordProcessors, this.forceFlushTimeoutMillis);
		} else this.activeProcessor = new NoopLogRecordProcessor();
		this._loggerConfigurator = loggerConfigurator ?? DEFAULT_LOGGER_CONFIGURATOR;
		const meter = meterProvider ? meterProvider.getMeter("@opentelemetry/sdk-logs", VERSION$1) : createNoopMeter();
		this.loggerMetrics = new LoggerMetrics(meter);
	}
	/**
	* Get the LoggerConfig for a given instrumentation scope.
	* Uses the LoggerConfigurator function to compute the config on first access
	* and caches the result.
	*
	* @experimental This feature is in development as per the OpenTelemetry specification.
	*/
	getLoggerConfig(instrumentationScope) {
		const key = getInstrumentationScopeKey(instrumentationScope);
		let config = this._loggerConfigs.get(key);
		if (config) return config;
		config = this._loggerConfigurator(instrumentationScope);
		this._loggerConfigs.set(key, config);
		return config;
	}
};
var LoggerProvider = class {
	_shutdownOnce;
	_sharedState;
	constructor(config = {}) {
		const mergedConfig = {
			resource: config.resource ?? defaultResource(),
			forceFlushTimeoutMillis: config.forceFlushTimeoutMillis ?? 3e4,
			logRecordLimits: {
				attributeCountLimit: config.logRecordLimits?.attributeCountLimit ?? 128,
				attributeValueLengthLimit: config.logRecordLimits?.attributeValueLengthLimit ?? Infinity
			},
			loggerConfigurator: config.loggerConfigurator ?? DEFAULT_LOGGER_CONFIGURATOR,
			processors: config.processors ?? [],
			meterProvider: config.meterProvider
		};
		this._sharedState = new LoggerProviderSharedState(mergedConfig.resource, mergedConfig.forceFlushTimeoutMillis, mergedConfig.logRecordLimits, mergedConfig.processors, mergedConfig.loggerConfigurator, mergedConfig.meterProvider);
		this._shutdownOnce = new BindOnceFuture(this._shutdown, this);
	}
	/**
	* Get a logger with the configuration of the LoggerProvider.
	*/
	getLogger(name, version, options) {
		if (this._shutdownOnce.isCalled) {
			diag.warn("A shutdown LoggerProvider cannot provide a Logger");
			return NOOP_LOGGER;
		}
		if (!name) diag.warn("Logger requested without instrumentation scope name.");
		const loggerName = name || "unknown";
		const key = `${loggerName}@${version || ""}:${options?.schemaUrl || ""}`;
		if (!this._sharedState.loggers.has(key)) this._sharedState.loggers.set(key, new Logger({
			name: loggerName,
			version,
			schemaUrl: options?.schemaUrl
		}, this._sharedState));
		return this._sharedState.loggers.get(key);
	}
	/**
	* Notifies all registered LogRecordProcessor to flush any buffered data.
	*
	* Returns a promise which is resolved when all flushes are complete.
	*/
	forceFlush() {
		if (this._shutdownOnce.isCalled) {
			diag.warn("invalid attempt to force flush after LoggerProvider shutdown");
			return this._shutdownOnce.promise;
		}
		return this._sharedState.activeProcessor.forceFlush();
	}
	/**
	* Flush all buffered data and shut down the LoggerProvider and all registered
	* LogRecordProcessor.
	*
	* Returns a promise which is resolved when all flushes are complete.
	*/
	shutdown() {
		if (this._shutdownOnce.isCalled) {
			diag.warn("shutdown may only be called once per LoggerProvider");
			return this._shutdownOnce.promise;
		}
		return this._shutdownOnce.call();
	}
	_shutdown() {
		return this._sharedState.activeProcessor.shutdown();
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-logs@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-logs/build/esm/export/BatchLogRecordProcessorBase.js
/**
* Waits for all pending async resources in the log records to be resolved.
*/
async function waitForResources(logRecords) {
	const pendingResources = [];
	for (let i = 0, len = logRecords.length; i < len; i++) {
		const logRecord = logRecords[i];
		if (logRecord.resource.asyncAttributesPending && logRecord.resource.waitForAsyncAttributes) pendingResources.push(logRecord.resource.waitForAsyncAttributes());
	}
	if (pendingResources != null && pendingResources.length > 0) await Promise.all(pendingResources);
}
/**
* Represents an export operation that handles the entire export workflow.
*/
var ExportOperation = class {
	_exportCompleted;
	_exportScheduledPromise;
	_exportScheduledResolve;
	constructor(exporter, logRecords, exportTimeoutMillis) {
		this._exportScheduledPromise = new Promise((resolve) => {
			this._exportScheduledResolve = resolve;
		});
		this._exportCompleted = this._executeExport(exporter, logRecords, exportTimeoutMillis);
	}
	/** Get the promise that resolves when the export completes */
	get exportCompleted() {
		return this._exportCompleted;
	}
	/** Get the promise that resolves when exporter.export() has been called */
	get exportScheduled() {
		return this._exportScheduledPromise;
	}
	async _executeExport(exporter, logRecords, exportTimeoutMillis) {
		try {
			await waitForResources(logRecords);
			await context.with(suppressTracing(context.active()), async () => {
				return this._exportWithTimeout(exporter, logRecords, exportTimeoutMillis);
			});
		} catch (e) {
			globalErrorHandler(e);
			this._exportScheduledResolve();
		}
	}
	async _exportWithTimeout(exporter, logRecords, exportTimeoutMillis) {
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				reject(/* @__PURE__ */ new Error("Timeout"));
			}, exportTimeoutMillis);
			exporter.export(logRecords, (result) => {
				clearTimeout(timer);
				if (result.code === ExportResultCode.SUCCESS) resolve();
				else reject(result.error ?? /* @__PURE__ */ new Error("BatchLogRecordProcessor: log record export failed"));
			});
			this._exportScheduledResolve();
		});
	}
};
var BatchLogRecordProcessorBase = class {
	_maxExportBatchSize;
	_maxQueueSize;
	_scheduledDelayMillis;
	_exportTimeoutMillis;
	_exporter;
	_currentExport = null;
	_finishedLogRecords = [];
	_timer;
	_shutdownOnce;
	_flushing = false;
	constructor(exporter, config) {
		this._exporter = exporter;
		this._maxExportBatchSize = config?.maxExportBatchSize ?? 512;
		this._maxQueueSize = config?.maxQueueSize ?? 2048;
		this._scheduledDelayMillis = config?.scheduledDelayMillis ?? 5e3;
		this._exportTimeoutMillis = config?.exportTimeoutMillis ?? 3e4;
		this._shutdownOnce = new BindOnceFuture(this._shutdown, this);
		if (this._maxExportBatchSize > this._maxQueueSize) {
			diag.warn("BatchLogRecordProcessor: maxExportBatchSize must be smaller or equal to maxQueueSize, setting maxExportBatchSize to match maxQueueSize");
			this._maxExportBatchSize = this._maxQueueSize;
		}
	}
	onEmit(logRecord) {
		if (this._shutdownOnce.isCalled) return;
		this._addToBuffer(logRecord);
	}
	forceFlush() {
		if (this._shutdownOnce.isCalled) return this._shutdownOnce.promise;
		return this._flushAll();
	}
	/** Add a LogRecord in the buffer. */
	_addToBuffer(logRecord) {
		if (this._finishedLogRecords.length >= this._maxQueueSize) return;
		this._finishedLogRecords.push(logRecord);
		this._maybeStartTimer();
	}
	shutdown() {
		return this._shutdownOnce.call();
	}
	async _shutdown() {
		this.onShutdown();
		await this._flushAll();
		await this._exporter.shutdown();
	}
	/**
	* Send all LogRecords to the exporter respecting the batch size limit
	* This function is used only on forceFlush or shutdown,
	* for all other cases _exportOneBatch should be used
	* */
	async _flushAll() {
		if (this._flushing) return;
		this._flushing = true;
		let toFlush = this._finishedLogRecords;
		this._finishedLogRecords = [];
		this._clearTimer();
		if (this._currentExport !== null) {
			await this._exporter.forceFlush();
			await this._currentExport.exportCompleted;
			this._currentExport = null;
		}
		while (toFlush.length > 0) {
			let batch;
			if (toFlush.length <= this._maxExportBatchSize) {
				batch = toFlush;
				toFlush = [];
			} else batch = toFlush.splice(0, this._maxExportBatchSize);
			const exportOp = new ExportOperation(this._exporter, batch, this._exportTimeoutMillis);
			this._currentExport = exportOp;
			try {
				await exportOp.exportScheduled;
				await this._exporter.forceFlush();
				await exportOp.exportCompleted;
			} catch (e) {
				globalErrorHandler(e);
			} finally {
				this._currentExport = null;
			}
		}
		this._flushing = false;
		this._maybeStartTimer();
	}
	/**
	* Extracts one batch from the buffer.
	* Returns null if buffer is empty.
	*/
	_extractBatch() {
		if (this._finishedLogRecords.length === 0) return null;
		if (this._finishedLogRecords.length <= this._maxExportBatchSize) {
			const batch = this._finishedLogRecords;
			this._finishedLogRecords = [];
			return batch;
		} else return this._finishedLogRecords.splice(0, this._maxExportBatchSize);
	}
	_exportOneBatch() {
		this._clearTimer();
		const logRecords = this._extractBatch();
		if (logRecords === null) return;
		const exportOp = new ExportOperation(this._exporter, logRecords, this._exportTimeoutMillis);
		this._currentExport = exportOp;
		exportOp.exportCompleted.then(() => {
			this._currentExport = null;
			this._maybeStartTimer();
		}).catch((error) => {
			this._currentExport = null;
			globalErrorHandler(error);
			this._maybeStartTimer();
		});
	}
	_maybeStartTimer() {
		if (this._shutdownOnce.isCalled) return;
		if (this._flushing) return;
		if (this._finishedLogRecords.length === 0) return;
		if (this._currentExport !== null) return;
		if (this._finishedLogRecords.length >= this._maxExportBatchSize) {
			this._exportOneBatch();
			return;
		}
		if (this._timer !== void 0) return;
		this._timer = setTimeout(() => {
			this._timer = void 0;
			this._exportOneBatch();
		}, this._scheduledDelayMillis);
		if (typeof this._timer !== "number") this._timer.unref();
	}
	_clearTimer() {
		if (this._timer !== void 0) {
			clearTimeout(this._timer);
			this._timer = void 0;
		}
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-logs@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-logs/build/esm/platform/browser/export/BatchLogRecordProcessor.js
var BatchLogRecordProcessor = class extends BatchLogRecordProcessorBase {
	_visibilityChangeListener;
	_pageHideListener;
	constructor(exporter, config) {
		super(exporter, config);
		this._onInit(config);
	}
	onShutdown() {
		if (typeof document === "undefined") return;
		if (this._visibilityChangeListener) document.removeEventListener("visibilitychange", this._visibilityChangeListener);
		if (this._pageHideListener) document.removeEventListener("pagehide", this._pageHideListener);
	}
	_onInit(config) {
		if (config?.disableAutoFlushOnDocumentHide === true || typeof document === "undefined") return;
		this._visibilityChangeListener = () => {
			if (document.visibilityState === "hidden") this.forceFlush();
		};
		this._pageHideListener = () => {
			this.forceFlush();
		};
		document.addEventListener("visibilitychange", this._visibilityChangeListener);
		document.addEventListener("pagehide", this._pageHideListener);
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-exporter-base/build/esm/OTLPExporterBase.js
var OTLPExporterBase = class {
	_delegate;
	constructor(delegate) {
		this._delegate = delegate;
	}
	/**
	* Export items.
	* @param items
	* @param resultCallback
	*/
	export(items, resultCallback) {
		this._delegate.export(items, resultCallback);
	}
	forceFlush() {
		return this._delegate.forceFlush();
	}
	shutdown() {
		return this._delegate.shutdown();
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-exporter-base/build/esm/types.js
/**
* Interface for handling error
*/
var OTLPExporterError = class extends Error {
	code;
	name = "OTLPExporterError";
	data;
	constructor(message, code, data) {
		super(message);
		this.data = data;
		this.code = code;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-exporter-base/build/esm/configuration/shared-configuration.js
function validateTimeoutMillis(timeoutMillis) {
	if (Number.isFinite(timeoutMillis) && timeoutMillis > 0) return timeoutMillis;
	throw new Error(`Configuration: timeoutMillis is invalid, expected number greater than 0 (actual: '${timeoutMillis}')`);
}
function wrapStaticHeadersInFunction(headers) {
	if (headers == null) return;
	return async () => headers;
}
/**
* @param userProvidedConfiguration  Configuration options provided by the user in code.
* @param fallbackConfiguration Fallback to use when the {@link userProvidedConfiguration} does not specify an option.
* @param defaultConfiguration The defaults as defined by the exporter specification
*/
function mergeOtlpSharedConfigurationWithDefaults(userProvidedConfiguration, fallbackConfiguration, defaultConfiguration) {
	return {
		timeoutMillis: validateTimeoutMillis(userProvidedConfiguration.timeoutMillis ?? fallbackConfiguration.timeoutMillis ?? defaultConfiguration.timeoutMillis),
		concurrencyLimit: userProvidedConfiguration.concurrencyLimit ?? fallbackConfiguration.concurrencyLimit ?? defaultConfiguration.concurrencyLimit,
		compression: userProvidedConfiguration.compression ?? fallbackConfiguration.compression ?? defaultConfiguration.compression
	};
}
function getSharedConfigurationDefaults() {
	return {
		timeoutMillis: 1e4,
		concurrencyLimit: 30,
		compression: "none"
	};
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-exporter-base/build/esm/bounded-queue-export-promise-handler.js
var BoundedQueueExportPromiseHandler = class {
	_concurrencyLimit;
	_sendingPromises = [];
	/**
	* @param concurrencyLimit maximum promises allowed in a queue at the same time.
	*/
	constructor(concurrencyLimit) {
		this._concurrencyLimit = concurrencyLimit;
	}
	pushPromise(promise) {
		if (this.hasReachedLimit()) throw new Error("Concurrency Limit reached");
		this._sendingPromises.push(promise);
		const popPromise = () => {
			const index = this._sendingPromises.indexOf(promise);
			this._sendingPromises.splice(index, 1);
		};
		promise.then(popPromise, popPromise);
	}
	hasReachedLimit() {
		return this._sendingPromises.length >= this._concurrencyLimit;
	}
	async awaitAll() {
		await Promise.all(this._sendingPromises);
	}
};
/**
* Promise queue for keeping track of export promises. Finished promises will be auto-dequeued.
* Allows for awaiting all promises in the queue.
*/
function createBoundedQueueExportPromiseHandler(options) {
	return new BoundedQueueExportPromiseHandler(options.concurrencyLimit);
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-exporter-base/build/esm/logging-response-handler.js
function isPartialSuccessResponse(response) {
	return Object.prototype.hasOwnProperty.call(response, "partialSuccess");
}
/**
* Default response handler that logs a partial success to the console.
*/
function createLoggingPartialSuccessResponseHandler() {
	return { handleResponse(response) {
		if (response == null || !isPartialSuccessResponse(response) || response.partialSuccess == null || Object.keys(response.partialSuccess).length === 0) return;
		diag.warn("Received Partial Success response:", JSON.stringify(response.partialSuccess));
	} };
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-exporter-base/build/esm/otlp-export-delegate.js
var OTLPExportDelegate = class {
	_diagLogger;
	_transport;
	_serializer;
	_responseHandler;
	_promiseQueue;
	_timeout;
	constructor(transport, serializer, responseHandler, promiseQueue, timeout) {
		this._transport = transport;
		this._serializer = serializer;
		this._responseHandler = responseHandler;
		this._promiseQueue = promiseQueue;
		this._timeout = timeout;
		this._diagLogger = diag.createComponentLogger({ namespace: "OTLPExportDelegate" });
	}
	export(internalRepresentation, resultCallback) {
		this._diagLogger.debug("items to be sent", internalRepresentation);
		if (this._promiseQueue.hasReachedLimit()) {
			resultCallback({
				code: ExportResultCode.FAILED,
				error: /* @__PURE__ */ new Error("Concurrent export limit reached")
			});
			return;
		}
		const serializedRequest = this._serializer.serializeRequest(internalRepresentation);
		if (serializedRequest == null) {
			resultCallback({
				code: ExportResultCode.FAILED,
				error: /* @__PURE__ */ new Error("Nothing to send")
			});
			return;
		}
		this._promiseQueue.pushPromise(this._transport.send(serializedRequest, this._timeout).then((response) => {
			if (response.status === "success") {
				if (response.data != null) try {
					this._responseHandler.handleResponse(this._serializer.deserializeResponse(response.data));
				} catch (e) {
					this._diagLogger.warn("Export succeeded but could not deserialize response - is the response specification compliant?", e, response.data);
				}
				resultCallback({ code: ExportResultCode.SUCCESS });
				return;
			} else if (response.status === "failure" && response.error) {
				resultCallback({
					code: ExportResultCode.FAILED,
					error: response.error
				});
				return;
			} else if (response.status === "retryable") resultCallback({
				code: ExportResultCode.FAILED,
				error: response.error ?? new OTLPExporterError("Export failed with retryable status")
			});
			else resultCallback({
				code: ExportResultCode.FAILED,
				error: new OTLPExporterError("Export failed with unknown error")
			});
		}, (reason) => resultCallback({
			code: ExportResultCode.FAILED,
			error: reason
		})));
	}
	forceFlush() {
		return this._promiseQueue.awaitAll();
	}
	async shutdown() {
		this._diagLogger.debug("shutdown started");
		await this.forceFlush();
		this._transport.shutdown();
	}
};
/**
* Creates a generic delegate for OTLP exports which only contains parts of the OTLP export that are shared across all
* signals.
*/
function createOtlpExportDelegate(components, settings) {
	return new OTLPExportDelegate(components.transport, components.serializer, createLoggingPartialSuccessResponseHandler(), components.promiseHandler, settings.timeout);
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-exporter-base/build/esm/otlp-network-export-delegate.js
function createOtlpNetworkExportDelegate(options, serializer, transport) {
	return createOtlpExportDelegate({
		transport,
		serializer,
		promiseHandler: createBoundedQueueExportPromiseHandler(options)
	}, { timeout: options.timeoutMillis });
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/export/AggregationTemporality.js
/**
* AggregationTemporality indicates the way additive quantities are expressed.
*/
var AggregationTemporality;
(function(AggregationTemporality) {
	AggregationTemporality[AggregationTemporality["DELTA"] = 0] = "DELTA";
	AggregationTemporality[AggregationTemporality["CUMULATIVE"] = 1] = "CUMULATIVE";
})(AggregationTemporality || (AggregationTemporality = {}));
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/export/MetricData.js
/**
* Supported types of metric instruments.
*/
var InstrumentType;
(function(InstrumentType) {
	InstrumentType["COUNTER"] = "COUNTER";
	InstrumentType["GAUGE"] = "GAUGE";
	InstrumentType["HISTOGRAM"] = "HISTOGRAM";
	InstrumentType["UP_DOWN_COUNTER"] = "UP_DOWN_COUNTER";
	InstrumentType["OBSERVABLE_COUNTER"] = "OBSERVABLE_COUNTER";
	InstrumentType["OBSERVABLE_GAUGE"] = "OBSERVABLE_GAUGE";
	InstrumentType["OBSERVABLE_UP_DOWN_COUNTER"] = "OBSERVABLE_UP_DOWN_COUNTER";
})(InstrumentType || (InstrumentType = {}));
/**
* The aggregated point data type.
*/
var DataPointType;
(function(DataPointType) {
	/**
	* A histogram data point contains a histogram statistics of collected
	* values with a list of explicit bucket boundaries and statistics such
	* as min, max, count, and sum of all collected values.
	*/
	DataPointType[DataPointType["HISTOGRAM"] = 0] = "HISTOGRAM";
	/**
	* An exponential histogram data point contains a histogram statistics of
	* collected values where bucket boundaries are automatically calculated
	* using an exponential function, and statistics such as min, max, count,
	* and sum of all collected values.
	*/
	DataPointType[DataPointType["EXPONENTIAL_HISTOGRAM"] = 1] = "EXPONENTIAL_HISTOGRAM";
	/**
	* A gauge metric data point has only a single numeric value.
	*/
	DataPointType[DataPointType["GAUGE"] = 2] = "GAUGE";
	/**
	* A sum metric data point has a single numeric value and a
	* monotonicity-indicator.
	*/
	DataPointType[DataPointType["SUM"] = 3] = "SUM";
})(DataPointType || (DataPointType = {}));
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/utils.js
/**
* Converting the unordered attributes into unique identifier string.
* @param attributes user provided unordered Attributes.
*/
function hashAttributes(attributes) {
	let keys = Object.keys(attributes);
	if (keys.length === 0) return "";
	keys = keys.sort();
	return JSON.stringify(keys.map((key) => [key, attributes[key]]));
}
/**
* Converting the instrumentation scope object to a unique identifier string.
* @param instrumentationScope
*/
function instrumentationScopeId(instrumentationScope) {
	return `${instrumentationScope.name}:${instrumentationScope.version ?? ""}:${instrumentationScope.schemaUrl ?? ""}`;
}
/**
* Error that is thrown on timeouts.
*/
var TimeoutError = class TimeoutError extends Error {
	constructor(message) {
		super(message);
		Object.setPrototypeOf(this, TimeoutError.prototype);
	}
};
/**
* Adds a timeout to a promise and rejects if the specified timeout has elapsed. Also rejects if the specified promise
* rejects, and resolves if the specified promise resolves.
*
* <p> NOTE: this operation will continue even after it throws a {@link TimeoutError}.
*
* @param promise promise to use with timeout.
* @param timeout the timeout in milliseconds until the returned promise is rejected.
*/
function callWithTimeout(promise, timeout) {
	let timeoutHandle;
	const timeoutPromise = new Promise(function timeoutFunction(_resolve, reject) {
		timeoutHandle = setTimeout(function timeoutHandler() {
			reject(new TimeoutError("Operation timed out."));
		}, timeout);
	});
	return Promise.race([promise, timeoutPromise]).then((result) => {
		clearTimeout(timeoutHandle);
		return result;
	}, (reason) => {
		clearTimeout(timeoutHandle);
		throw reason;
	});
}
function setEquals(lhs, rhs) {
	if (lhs.size !== rhs.size) return false;
	for (const item of lhs) if (!rhs.has(item)) return false;
	return true;
}
/**
* Binary search the sorted array to the find upper bound for the value.
* @param arr
* @param value
* @returns
*/
function binarySearchUB(arr, value) {
	let lo = 0;
	let hi = arr.length - 1;
	let ret = arr.length;
	while (hi >= lo) {
		const mid = lo + Math.trunc((hi - lo) / 2);
		if (arr[mid] < value) lo = mid + 1;
		else {
			ret = mid;
			hi = mid - 1;
		}
	}
	return ret;
}
function equalsCaseInsensitive(lhs, rhs) {
	return lhs.toLowerCase() === rhs.toLowerCase();
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/aggregator/types.js
/** The kind of aggregator. */
var AggregatorKind;
(function(AggregatorKind) {
	AggregatorKind[AggregatorKind["DROP"] = 0] = "DROP";
	AggregatorKind[AggregatorKind["SUM"] = 1] = "SUM";
	AggregatorKind[AggregatorKind["LAST_VALUE"] = 2] = "LAST_VALUE";
	AggregatorKind[AggregatorKind["HISTOGRAM"] = 3] = "HISTOGRAM";
	AggregatorKind[AggregatorKind["EXPONENTIAL_HISTOGRAM"] = 4] = "EXPONENTIAL_HISTOGRAM";
})(AggregatorKind || (AggregatorKind = {}));
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/aggregator/Drop.js
/** Basic aggregator for None which keeps no recorded value. */
var DropAggregator = class {
	kind = AggregatorKind.DROP;
	createAccumulation() {}
	merge(_previous, _delta) {}
	diff(_previous, _current) {}
	toMetricData(_descriptor, _aggregationTemporality, _accumulationByAttributes, _endTime) {}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/aggregator/Histogram.js
function createNewEmptyCheckpoint(boundaries) {
	const counts = boundaries.map(() => 0);
	counts.push(0);
	return {
		buckets: {
			boundaries,
			counts
		},
		sum: 0,
		count: 0,
		hasMinMax: false,
		min: Infinity,
		max: -Infinity
	};
}
var HistogramAccumulation = class {
	startTime;
	_boundaries;
	_recordMinMax;
	_current;
	constructor(startTime, boundaries, recordMinMax = true, current = createNewEmptyCheckpoint(boundaries)) {
		this.startTime = startTime;
		this._boundaries = boundaries;
		this._recordMinMax = recordMinMax;
		this._current = current;
	}
	record(value) {
		if (Number.isNaN(value)) return;
		this._current.count += 1;
		this._current.sum += value;
		if (this._recordMinMax) {
			this._current.min = Math.min(value, this._current.min);
			this._current.max = Math.max(value, this._current.max);
			this._current.hasMinMax = true;
		}
		const idx = binarySearchUB(this._boundaries, value);
		this._current.buckets.counts[idx] += 1;
	}
	setStartTime(startTime) {
		this.startTime = startTime;
	}
	toPointValue() {
		return this._current;
	}
};
/**
* Basic aggregator which observes events and counts them in pre-defined buckets
* and provides the total sum and count of all observations.
*/
var HistogramAggregator = class {
	kind = AggregatorKind.HISTOGRAM;
	_boundaries;
	_recordMinMax;
	/**
	* @param _boundaries sorted upper bounds of recorded values.
	* @param _recordMinMax If set to true, min and max will be recorded. Otherwise, min and max will not be recorded.
	*/
	constructor(boundaries, recordMinMax) {
		this._boundaries = boundaries;
		this._recordMinMax = recordMinMax;
	}
	createAccumulation(startTime) {
		return new HistogramAccumulation(startTime, this._boundaries, this._recordMinMax);
	}
	/**
	* Return the result of the merge of two histogram accumulations. As long as one Aggregator
	* instance produces all Accumulations with constant boundaries we don't need to worry about
	* merging accumulations with different boundaries.
	*/
	merge(previous, delta) {
		const previousValue = previous.toPointValue();
		const deltaValue = delta.toPointValue();
		const previousCounts = previousValue.buckets.counts;
		const deltaCounts = deltaValue.buckets.counts;
		const mergedCounts = new Array(previousCounts.length);
		for (let idx = 0; idx < previousCounts.length; idx++) mergedCounts[idx] = previousCounts[idx] + deltaCounts[idx];
		let min = Infinity;
		let max = -Infinity;
		if (this._recordMinMax) {
			if (previousValue.hasMinMax && deltaValue.hasMinMax) {
				min = Math.min(previousValue.min, deltaValue.min);
				max = Math.max(previousValue.max, deltaValue.max);
			} else if (previousValue.hasMinMax) {
				min = previousValue.min;
				max = previousValue.max;
			} else if (deltaValue.hasMinMax) {
				min = deltaValue.min;
				max = deltaValue.max;
			}
		}
		return new HistogramAccumulation(previous.startTime, previousValue.buckets.boundaries, this._recordMinMax, {
			buckets: {
				boundaries: previousValue.buckets.boundaries,
				counts: mergedCounts
			},
			count: previousValue.count + deltaValue.count,
			sum: previousValue.sum + deltaValue.sum,
			hasMinMax: this._recordMinMax && (previousValue.hasMinMax || deltaValue.hasMinMax),
			min,
			max
		});
	}
	/**
	* Returns a new DELTA aggregation by comparing two cumulative measurements.
	*/
	diff(previous, current) {
		const previousValue = previous.toPointValue();
		const currentValue = current.toPointValue();
		const previousCounts = previousValue.buckets.counts;
		const currentCounts = currentValue.buckets.counts;
		const diffedCounts = new Array(previousCounts.length);
		for (let idx = 0; idx < previousCounts.length; idx++) diffedCounts[idx] = currentCounts[idx] - previousCounts[idx];
		return new HistogramAccumulation(current.startTime, previousValue.buckets.boundaries, this._recordMinMax, {
			buckets: {
				boundaries: previousValue.buckets.boundaries,
				counts: diffedCounts
			},
			count: currentValue.count - previousValue.count,
			sum: currentValue.sum - previousValue.sum,
			hasMinMax: false,
			min: Infinity,
			max: -Infinity
		});
	}
	toMetricData(descriptor, aggregationTemporality, accumulationByAttributes, endTime) {
		return {
			descriptor,
			aggregationTemporality,
			dataPointType: DataPointType.HISTOGRAM,
			dataPoints: accumulationByAttributes.map(([attributes, accumulation]) => {
				const pointValue = accumulation.toPointValue();
				return {
					attributes,
					startTime: accumulation.startTime,
					endTime,
					value: {
						min: pointValue.hasMinMax ? pointValue.min : void 0,
						max: pointValue.hasMinMax ? pointValue.max : void 0,
						sum: !(descriptor.type === InstrumentType.GAUGE || descriptor.type === InstrumentType.UP_DOWN_COUNTER || descriptor.type === InstrumentType.OBSERVABLE_GAUGE || descriptor.type === InstrumentType.OBSERVABLE_UP_DOWN_COUNTER) ? pointValue.sum : void 0,
						buckets: pointValue.buckets,
						count: pointValue.count
					}
				};
			})
		};
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/aggregator/exponential-histogram/Buckets.js
var Buckets = class Buckets {
	backing;
	indexBase;
	indexStart;
	indexEnd;
	/**
	* The term index refers to the number of the exponential histogram bucket
	* used to determine its boundaries. The lower boundary of a bucket is
	* determined by base ** index and the upper boundary of a bucket is
	* determined by base ** (index + 1). index values are signed to account
	* for values less than or equal to 1.
	*
	* indexBase is the index of the 0th position in the
	* backing array, i.e., backing[0] is the count
	* in the bucket with index `indexBase`.
	*
	* indexStart is the smallest index value represented
	* in the backing array.
	*
	* indexEnd is the largest index value represented in
	* the backing array.
	*/
	constructor(backing = new BucketsBacking(), indexBase = 0, indexStart = 0, indexEnd = 0) {
		this.backing = backing;
		this.indexBase = indexBase;
		this.indexStart = indexStart;
		this.indexEnd = indexEnd;
	}
	/**
	* Offset is the bucket index of the smallest entry in the counts array
	* @returns {number}
	*/
	get offset() {
		return this.indexStart;
	}
	/**
	* Buckets is a view into the backing array.
	* @returns {number}
	*/
	get length() {
		if (this.backing.length === 0) return 0;
		if (this.indexEnd === this.indexStart && this.at(0) === 0) return 0;
		return this.indexEnd - this.indexStart + 1;
	}
	/**
	* An array of counts, where count[i] carries the count
	* of the bucket at index (offset+i).  count[i] is the count of
	* values greater than base^(offset+i) and less than or equal to
	* base^(offset+i+1).
	* @returns {number} The logical counts based on the backing array
	*/
	counts() {
		return Array.from({ length: this.length }, (_, i) => this.at(i));
	}
	/**
	* At returns the count of the bucket at a position in the logical
	* array of counts.
	* @param position
	* @returns {number}
	*/
	at(position) {
		const bias = this.indexBase - this.indexStart;
		if (position < bias) position += this.backing.length;
		position -= bias;
		return this.backing.countAt(position);
	}
	/**
	* incrementBucket increments the backing array index by `increment`
	* @param bucketIndex
	* @param increment
	*/
	incrementBucket(bucketIndex, increment) {
		this.backing.increment(bucketIndex, increment);
	}
	/**
	* decrementBucket decrements the backing array index by `decrement`
	* if decrement is greater than the current value, it's set to 0.
	* @param bucketIndex
	* @param decrement
	*/
	decrementBucket(bucketIndex, decrement) {
		this.backing.decrement(bucketIndex, decrement);
	}
	/**
	* trim removes leading and / or trailing zero buckets (which can occur
	* after diffing two histos) and rotates the backing array so that the
	* smallest non-zero index is in the 0th position of the backing array
	*/
	trim() {
		for (let i = 0; i < this.length; i++) if (this.at(i) !== 0) {
			this.indexStart += i;
			break;
		} else if (i === this.length - 1) {
			this.indexStart = this.indexEnd = this.indexBase = 0;
			return;
		}
		for (let i = this.length - 1; i >= 0; i--) if (this.at(i) !== 0) {
			this.indexEnd -= this.length - i - 1;
			break;
		}
		this._rotate();
	}
	/**
	* downscale first rotates, then collapses 2**`by`-to-1 buckets.
	* @param by
	*/
	downscale(by) {
		this._rotate();
		const size = 1 + this.indexEnd - this.indexStart;
		const each = 1 << by;
		let inpos = 0;
		let outpos = 0;
		for (let pos = this.indexStart; pos <= this.indexEnd;) {
			let mod = pos % each;
			if (mod < 0) mod += each;
			for (let i = mod; i < each && inpos < size; i++) {
				this._relocateBucket(outpos, inpos);
				inpos++;
				pos++;
			}
			outpos++;
		}
		this.indexStart >>= by;
		this.indexEnd >>= by;
		this.indexBase = this.indexStart;
	}
	/**
	* Clone returns a deep copy of Buckets
	* @returns {Buckets}
	*/
	clone() {
		return new Buckets(this.backing.clone(), this.indexBase, this.indexStart, this.indexEnd);
	}
	/**
	* _rotate shifts the backing array contents so that indexStart ==
	* indexBase to simplify the downscale logic.
	*/
	_rotate() {
		const bias = this.indexBase - this.indexStart;
		if (bias === 0) return;
		else if (bias > 0) {
			this.backing.reverse(0, this.backing.length);
			this.backing.reverse(0, bias);
			this.backing.reverse(bias, this.backing.length);
		} else {
			this.backing.reverse(0, this.backing.length);
			this.backing.reverse(0, this.backing.length + bias);
		}
		this.indexBase = this.indexStart;
	}
	/**
	* _relocateBucket adds the count in counts[src] to counts[dest] and
	* resets count[src] to zero.
	*/
	_relocateBucket(dest, src) {
		if (dest === src) return;
		this.incrementBucket(dest, this.backing.emptyBucket(src));
	}
};
/**
* BucketsBacking holds the raw buckets and some utility methods to
* manage them.
*/
var BucketsBacking = class BucketsBacking {
	_counts;
	constructor(counts = [0]) {
		this._counts = counts;
	}
	/**
	* length returns the physical size of the backing array, which
	* is >= buckets.length()
	*/
	get length() {
		return this._counts.length;
	}
	/**
	* countAt returns the count in a specific bucket
	*/
	countAt(pos) {
		return this._counts[pos];
	}
	/**
	* growTo grows a backing array and copies old entries
	* into their correct new positions.
	*/
	growTo(newSize, oldPositiveLimit, newPositiveLimit) {
		const tmp = new Array(newSize).fill(0);
		tmp.splice(newPositiveLimit, this._counts.length - oldPositiveLimit, ...this._counts.slice(oldPositiveLimit));
		tmp.splice(0, oldPositiveLimit, ...this._counts.slice(0, oldPositiveLimit));
		this._counts = tmp;
	}
	/**
	* reverse the items in the backing array in the range [from, limit).
	*/
	reverse(from, limit) {
		const num = Math.floor((from + limit) / 2) - from;
		for (let i = 0; i < num; i++) {
			const tmp = this._counts[from + i];
			this._counts[from + i] = this._counts[limit - i - 1];
			this._counts[limit - i - 1] = tmp;
		}
	}
	/**
	* emptyBucket empties the count from a bucket, for
	* moving into another.
	*/
	emptyBucket(src) {
		const tmp = this._counts[src];
		this._counts[src] = 0;
		return tmp;
	}
	/**
	* increments a bucket by `increment`
	*/
	increment(bucketIndex, increment) {
		this._counts[bucketIndex] += increment;
	}
	/**
	* decrements a bucket by `decrement`
	*/
	decrement(bucketIndex, decrement) {
		if (this._counts[bucketIndex] >= decrement) this._counts[bucketIndex] -= decrement;
		else this._counts[bucketIndex] = 0;
	}
	/**
	* clone returns a deep copy of BucketsBacking
	*/
	clone() {
		return new BucketsBacking([...this._counts]);
	}
};
/**
* EXPONENT_MASK is set to 1 for the hi 32-bits of an IEEE 754
* floating point exponent: 0x7ff00000.
*/
var EXPONENT_MASK = 2146435072;
/**
* SIGNIFICAND_MASK is the mask for the significand portion of the hi 32-bits
* of an IEEE 754 double-precision floating-point value: 0xfffff
*/
var SIGNIFICAND_MASK = 1048575;
/**
* EXPONENT_BIAS is the exponent bias specified for encoding
* the IEEE 754 double-precision floating point exponent: 1023
*/
var EXPONENT_BIAS = 1023;
/**
* MIN_NORMAL_EXPONENT is the minimum exponent of a normalized
* floating point: -1022.
*/
var MIN_NORMAL_EXPONENT = -1022;
/**
* MAX_NORMAL_EXPONENT is the maximum exponent of a normalized
* floating point: 1023.
*/
var MAX_NORMAL_EXPONENT = EXPONENT_BIAS;
/**
* MIN_VALUE is the smallest normal number
*/
var MIN_VALUE = Math.pow(2, -1022);
/**
* getNormalBase2 extracts the normalized base-2 fractional exponent.
* This returns k for the equation f x 2**k where f is
* in the range [1, 2).  Note that this function is not called for
* subnormal numbers.
* @param {number} value - the value to determine normalized base-2 fractional
*    exponent for
* @returns {number} the normalized base-2 exponent
*/
function getNormalBase2(value) {
	const dv = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8));
	dv.setFloat64(0, value);
	return ((dv.getUint32(0) & EXPONENT_MASK) >> 20) - EXPONENT_BIAS;
}
/**
* GetSignificand returns the 52 bit (unsigned) significand as a signed value.
* @param {number} value - the floating point number to extract the significand from
* @returns {number} The 52-bit significand
*/
function getSignificand(value) {
	const dv = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8));
	dv.setFloat64(0, value);
	const hiBits = dv.getUint32(0);
	const loBits = dv.getUint32(4);
	return (hiBits & SIGNIFICAND_MASK) * Math.pow(2, 32) + loBits;
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/aggregator/exponential-histogram/util.js
/**
* Note: other languages provide this as a built in function. This is
* a naive, but functionally correct implementation. This is used sparingly,
* when creating a new mapping in a running application.
*
* ldexp returns frac × 2**exp. With the following special cases:
*   ldexp(±0, exp) = ±0
*   ldexp(±Inf, exp) = ±Inf
*   ldexp(NaN, exp) = NaN
* @param frac
* @param exp
* @returns {number}
*/
function ldexp(frac, exp) {
	if (frac === 0 || frac === Number.POSITIVE_INFINITY || frac === Number.NEGATIVE_INFINITY || Number.isNaN(frac)) return frac;
	return frac * Math.pow(2, exp);
}
/**
* Computes the next power of two that is greater than or equal to v.
* This implementation more efficient than, but functionally equivalent
* to Math.pow(2, Math.ceil(Math.log(x)/Math.log(2))).
* @param v
* @returns {number}
*/
function nextGreaterSquare(v) {
	v--;
	v |= v >> 1;
	v |= v >> 2;
	v |= v >> 4;
	v |= v >> 8;
	v |= v >> 16;
	v++;
	return v;
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/aggregator/exponential-histogram/mapping/types.js
var MappingError = class extends Error {};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/aggregator/exponential-histogram/mapping/ExponentMapping.js
/**
* ExponentMapping implements exponential mapping functions for
* scales <=0. For scales > 0 LogarithmMapping should be used.
*/
var ExponentMapping = class {
	_shift;
	constructor(scale) {
		this._shift = -scale;
	}
	/**
	* Maps positive floating point values to indexes corresponding to scale
	* @param value
	* @returns {number} index for provided value at the current scale
	*/
	mapToIndex(value) {
		if (value < MIN_VALUE) return this._minNormalLowerBoundaryIndex();
		return getNormalBase2(value) + this._rightShift(getSignificand(value) - 1, 52) >> this._shift;
	}
	/**
	* Returns the lower bucket boundary for the given index for scale
	*
	* @param index
	* @returns {number}
	*/
	lowerBoundary(index) {
		const minIndex = this._minNormalLowerBoundaryIndex();
		if (index < minIndex) throw new MappingError(`underflow: ${index} is < minimum lower boundary: ${minIndex}`);
		const maxIndex = this._maxNormalLowerBoundaryIndex();
		if (index > maxIndex) throw new MappingError(`overflow: ${index} is > maximum lower boundary: ${maxIndex}`);
		return ldexp(1, index << this._shift);
	}
	/**
	* The scale used by this mapping
	* @returns {number}
	*/
	get scale() {
		if (this._shift === 0) return 0;
		return -this._shift;
	}
	_minNormalLowerBoundaryIndex() {
		let index = MIN_NORMAL_EXPONENT >> this._shift;
		if (this._shift < 2) index--;
		return index;
	}
	_maxNormalLowerBoundaryIndex() {
		return MAX_NORMAL_EXPONENT >> this._shift;
	}
	_rightShift(value, shift) {
		return Math.floor(value * Math.pow(2, -shift));
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/aggregator/exponential-histogram/mapping/LogarithmMapping.js
/**
* LogarithmMapping implements exponential mapping functions for scale > 0.
* For scales <= 0 the exponent mapping should be used.
*/
var LogarithmMapping = class {
	_scale;
	_scaleFactor;
	_inverseFactor;
	constructor(scale) {
		this._scale = scale;
		this._scaleFactor = ldexp(Math.LOG2E, scale);
		this._inverseFactor = ldexp(Math.LN2, -scale);
	}
	/**
	* Maps positive floating point values to indexes corresponding to scale
	* @param value
	* @returns {number} index for provided value at the current scale
	*/
	mapToIndex(value) {
		if (value <= MIN_VALUE) return this._minNormalLowerBoundaryIndex() - 1;
		if (getSignificand(value) === 0) return (getNormalBase2(value) << this._scale) - 1;
		const index = Math.floor(Math.log(value) * this._scaleFactor);
		const maxIndex = this._maxNormalLowerBoundaryIndex();
		if (index >= maxIndex) return maxIndex;
		return index;
	}
	/**
	* Returns the lower bucket boundary for the given index for scale
	*
	* @param index
	* @returns {number}
	*/
	lowerBoundary(index) {
		const maxIndex = this._maxNormalLowerBoundaryIndex();
		if (index >= maxIndex) {
			if (index === maxIndex) return 2 * Math.exp((index - (1 << this._scale)) / this._scaleFactor);
			throw new MappingError(`overflow: ${index} is > maximum lower boundary: ${maxIndex}`);
		}
		const minIndex = this._minNormalLowerBoundaryIndex();
		if (index <= minIndex) {
			if (index === minIndex) return MIN_VALUE;
			else if (index === minIndex - 1) return Math.exp((index + (1 << this._scale)) / this._scaleFactor) / 2;
			throw new MappingError(`overflow: ${index} is < minimum lower boundary: ${minIndex}`);
		}
		return Math.exp(index * this._inverseFactor);
	}
	/**
	* The scale used by this mapping
	* @returns {number}
	*/
	get scale() {
		return this._scale;
	}
	_minNormalLowerBoundaryIndex() {
		return MIN_NORMAL_EXPONENT << this._scale;
	}
	_maxNormalLowerBoundaryIndex() {
		return (MAX_NORMAL_EXPONENT + 1 << this._scale) - 1;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/aggregator/exponential-histogram/mapping/getMapping.js
var MIN_SCALE = -10;
var MAX_SCALE$1 = 20;
var PREBUILT_MAPPINGS = Array.from({ length: 31 }, (_, i) => {
	if (i > 10) return new LogarithmMapping(i - 10);
	return new ExponentMapping(i - 10);
});
/**
* getMapping returns an appropriate mapping for the given scale. For scales -10
* to 0 the underlying type will be ExponentMapping. For scales 1 to 20 the
* underlying type will be LogarithmMapping.
* @param scale a number in the range [-10, 20]
* @returns {Mapping}
*/
function getMapping(scale) {
	if (scale > MAX_SCALE$1 || scale < MIN_SCALE) throw new MappingError(`expected scale >= ${MIN_SCALE} && <= ${MAX_SCALE$1}, got: ${scale}`);
	return PREBUILT_MAPPINGS[scale + 10];
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/aggregator/ExponentialHistogram.js
var HighLow = class HighLow {
	static combine(h1, h2) {
		return new HighLow(Math.min(h1.low, h2.low), Math.max(h1.high, h2.high));
	}
	low;
	high;
	constructor(low, high) {
		this.low = low;
		this.high = high;
	}
};
var MAX_SCALE = 20;
var DEFAULT_MAX_SIZE = 160;
var MIN_MAX_SIZE = 2;
var ExponentialHistogramAccumulation = class ExponentialHistogramAccumulation {
	startTime;
	_maxSize;
	_recordMinMax;
	_sum;
	_count;
	_zeroCount;
	_min;
	_max;
	_positive;
	_negative;
	_mapping;
	constructor(startTime, maxSize = DEFAULT_MAX_SIZE, recordMinMax = true, sum = 0, count = 0, zeroCount = 0, min = Number.POSITIVE_INFINITY, max = Number.NEGATIVE_INFINITY, positive = new Buckets(), negative = new Buckets(), mapping = getMapping(MAX_SCALE)) {
		this.startTime = startTime;
		this._maxSize = maxSize;
		this._recordMinMax = recordMinMax;
		this._sum = sum;
		this._count = count;
		this._zeroCount = zeroCount;
		this._min = min;
		this._max = max;
		this._positive = positive;
		this._negative = negative;
		this._mapping = mapping;
		if (this._maxSize < MIN_MAX_SIZE) {
			diag.warn(`Exponential Histogram Max Size set to ${this._maxSize}, \
                changing to the minimum size of: ${MIN_MAX_SIZE}`);
			this._maxSize = MIN_MAX_SIZE;
		}
	}
	/**
	* record updates a histogram with a single count
	* @param {Number} value
	*/
	record(value) {
		this.updateByIncrement(value, 1);
	}
	/**
	* Sets the start time for this accumulation
	* @param {HrTime} startTime
	*/
	setStartTime(startTime) {
		this.startTime = startTime;
	}
	/**
	* Returns the datapoint representation of this accumulation
	* @param {HrTime} startTime
	*/
	toPointValue() {
		return {
			hasMinMax: this._recordMinMax,
			min: this.min,
			max: this.max,
			sum: this.sum,
			positive: {
				offset: this.positive.offset,
				bucketCounts: this.positive.counts()
			},
			negative: {
				offset: this.negative.offset,
				bucketCounts: this.negative.counts()
			},
			count: this.count,
			scale: this.scale,
			zeroCount: this.zeroCount
		};
	}
	/**
	* @returns {Number} The sum of values recorded by this accumulation
	*/
	get sum() {
		return this._sum;
	}
	/**
	* @returns {Number} The minimum value recorded by this accumulation
	*/
	get min() {
		return this._min;
	}
	/**
	* @returns {Number} The maximum value recorded by this accumulation
	*/
	get max() {
		return this._max;
	}
	/**
	* @returns {Number} The count of values recorded by this accumulation
	*/
	get count() {
		return this._count;
	}
	/**
	* @returns {Number} The number of 0 values recorded by this accumulation
	*/
	get zeroCount() {
		return this._zeroCount;
	}
	/**
	* @returns {Number} The scale used by this accumulation
	*/
	get scale() {
		if (this._count === this._zeroCount) return 0;
		return this._mapping.scale;
	}
	/**
	* positive holds the positive values
	* @returns {Buckets}
	*/
	get positive() {
		return this._positive;
	}
	/**
	* negative holds the negative values by their absolute value
	* @returns {Buckets}
	*/
	get negative() {
		return this._negative;
	}
	/**
	* updateByIncr supports updating a histogram with a non-negative
	* increment.
	* @param value
	* @param increment
	*/
	updateByIncrement(value, increment) {
		if (Number.isNaN(value)) return;
		if (value > this._max) this._max = value;
		if (value < this._min) this._min = value;
		this._count += increment;
		if (value === 0) {
			this._zeroCount += increment;
			return;
		}
		this._sum += value * increment;
		if (value > 0) this._updateBuckets(this._positive, value, increment);
		else this._updateBuckets(this._negative, -value, increment);
	}
	/**
	* merge combines data from previous value into self
	* @param {ExponentialHistogramAccumulation} previous
	*/
	merge(previous) {
		if (this._count === 0) {
			this._min = previous.min;
			this._max = previous.max;
		} else if (previous.count !== 0) {
			if (previous.min < this.min) this._min = previous.min;
			if (previous.max > this.max) this._max = previous.max;
		}
		this.startTime = previous.startTime;
		this._sum += previous.sum;
		this._count += previous.count;
		this._zeroCount += previous.zeroCount;
		const minScale = this._minScale(previous);
		this._downscale(this.scale - minScale);
		this._mergeBuckets(this.positive, previous, previous.positive, minScale);
		this._mergeBuckets(this.negative, previous, previous.negative, minScale);
	}
	/**
	* diff subtracts other from self
	* @param {ExponentialHistogramAccumulation} other
	*/
	diff(other) {
		this._min = Infinity;
		this._max = -Infinity;
		this._sum -= other.sum;
		this._count -= other.count;
		this._zeroCount -= other.zeroCount;
		const minScale = this._minScale(other);
		this._downscale(this.scale - minScale);
		this._diffBuckets(this.positive, other, other.positive, minScale);
		this._diffBuckets(this.negative, other, other.negative, minScale);
	}
	/**
	* clone returns a deep copy of self
	* @returns {ExponentialHistogramAccumulation}
	*/
	clone() {
		return new ExponentialHistogramAccumulation(this.startTime, this._maxSize, this._recordMinMax, this._sum, this._count, this._zeroCount, this._min, this._max, this.positive.clone(), this.negative.clone(), this._mapping);
	}
	/**
	* _updateBuckets maps the incoming value to a bucket index for the current
	* scale. If the bucket index is outside of the range of the backing array,
	* it will rescale the backing array and update the mapping for the new scale.
	*/
	_updateBuckets(buckets, value, increment) {
		let index = this._mapping.mapToIndex(value);
		let rescalingNeeded = false;
		let high = 0;
		let low = 0;
		if (buckets.length === 0) {
			buckets.indexStart = index;
			buckets.indexEnd = buckets.indexStart;
			buckets.indexBase = buckets.indexStart;
		} else if (index < buckets.indexStart && buckets.indexEnd - index >= this._maxSize) {
			rescalingNeeded = true;
			low = index;
			high = buckets.indexEnd;
		} else if (index > buckets.indexEnd && index - buckets.indexStart >= this._maxSize) {
			rescalingNeeded = true;
			low = buckets.indexStart;
			high = index;
		}
		if (rescalingNeeded) {
			const change = this._changeScale(high, low);
			this._downscale(change);
			index = this._mapping.mapToIndex(value);
		}
		this._incrementIndexBy(buckets, index, increment);
	}
	/**
	* _incrementIndexBy increments the count of the bucket specified by `index`.
	* If the index is outside of the range [buckets.indexStart, buckets.indexEnd]
	* the boundaries of the backing array will be adjusted and more buckets will
	* be added if needed.
	*/
	_incrementIndexBy(buckets, index, increment) {
		if (increment === 0) return;
		if (buckets.length === 0) buckets.indexStart = buckets.indexEnd = buckets.indexBase = index;
		if (index < buckets.indexStart) {
			const span = buckets.indexEnd - index;
			if (span >= buckets.backing.length) this._grow(buckets, span + 1);
			buckets.indexStart = index;
		} else if (index > buckets.indexEnd) {
			const span = index - buckets.indexStart;
			if (span >= buckets.backing.length) this._grow(buckets, span + 1);
			buckets.indexEnd = index;
		}
		let bucketIndex = index - buckets.indexBase;
		if (bucketIndex < 0) bucketIndex += buckets.backing.length;
		buckets.incrementBucket(bucketIndex, increment);
	}
	/**
	* grow resizes the backing array by doubling in size up to maxSize.
	* This extends the array with a bunch of zeros and copies the
	* existing counts to the same position.
	*/
	_grow(buckets, needed) {
		const size = buckets.backing.length;
		const bias = buckets.indexBase - buckets.indexStart;
		const oldPositiveLimit = size - bias;
		let newSize = nextGreaterSquare(needed);
		if (newSize > this._maxSize) newSize = this._maxSize;
		const newPositiveLimit = newSize - bias;
		buckets.backing.growTo(newSize, oldPositiveLimit, newPositiveLimit);
	}
	/**
	* _changeScale computes how much downscaling is needed by shifting the
	* high and low values until they are separated by no more than size.
	*/
	_changeScale(high, low) {
		let change = 0;
		while (high - low >= this._maxSize) {
			high >>= 1;
			low >>= 1;
			change++;
		}
		return change;
	}
	/**
	* _downscale subtracts `change` from the current mapping scale.
	*/
	_downscale(change) {
		if (change === 0) return;
		if (change < 0) throw new Error(`impossible change of scale: ${this.scale}`);
		const newScale = this._mapping.scale - change;
		this._positive.downscale(change);
		this._negative.downscale(change);
		this._mapping = getMapping(newScale);
	}
	/**
	* _minScale is used by diff and merge to compute an ideal combined scale
	*/
	_minScale(other) {
		const minScale = Math.min(this.scale, other.scale);
		const highLowPos = HighLow.combine(this._highLowAtScale(this.positive, this.scale, minScale), this._highLowAtScale(other.positive, other.scale, minScale));
		const highLowNeg = HighLow.combine(this._highLowAtScale(this.negative, this.scale, minScale), this._highLowAtScale(other.negative, other.scale, minScale));
		return Math.min(minScale - this._changeScale(highLowPos.high, highLowPos.low), minScale - this._changeScale(highLowNeg.high, highLowNeg.low));
	}
	/**
	* _highLowAtScale is used by diff and merge to compute an ideal combined scale.
	*/
	_highLowAtScale(buckets, currentScale, newScale) {
		if (buckets.length === 0) return new HighLow(0, -1);
		const shift = currentScale - newScale;
		return new HighLow(buckets.indexStart >> shift, buckets.indexEnd >> shift);
	}
	/**
	* _mergeBuckets translates index values from another histogram and
	* adds the values into the corresponding buckets of this histogram.
	*/
	_mergeBuckets(ours, other, theirs, scale) {
		const theirOffset = theirs.offset;
		const theirChange = other.scale - scale;
		for (let i = 0; i < theirs.length; i++) this._incrementIndexBy(ours, theirOffset + i >> theirChange, theirs.at(i));
	}
	/**
	* _diffBuckets translates index values from another histogram and
	* subtracts the values in the corresponding buckets of this histogram.
	*/
	_diffBuckets(ours, other, theirs, scale) {
		const theirOffset = theirs.offset;
		const theirChange = other.scale - scale;
		for (let i = 0; i < theirs.length; i++) {
			let bucketIndex = (theirOffset + i >> theirChange) - ours.indexBase;
			if (bucketIndex < 0) bucketIndex += ours.backing.length;
			ours.decrementBucket(bucketIndex, theirs.at(i));
		}
		ours.trim();
	}
};
/**
* Aggregator for ExponentialHistogramAccumulations
*/
var ExponentialHistogramAggregator = class {
	kind = AggregatorKind.EXPONENTIAL_HISTOGRAM;
	_maxSize;
	_recordMinMax;
	/**
	* @param _maxSize Maximum number of buckets for each of the positive
	*    and negative ranges, exclusive of the zero-bucket.
	* @param _recordMinMax If set to true, min and max will be recorded.
	*    Otherwise, min and max will not be recorded.
	*/
	constructor(maxSize, recordMinMax) {
		this._maxSize = maxSize;
		this._recordMinMax = recordMinMax;
	}
	createAccumulation(startTime) {
		return new ExponentialHistogramAccumulation(startTime, this._maxSize, this._recordMinMax);
	}
	/**
	* Return the result of the merge of two exponential histogram accumulations.
	*/
	merge(previous, delta) {
		const result = delta.clone();
		result.merge(previous);
		return result;
	}
	/**
	* Returns a new DELTA aggregation by comparing two cumulative measurements.
	*/
	diff(previous, current) {
		const result = current.clone();
		result.diff(previous);
		return result;
	}
	toMetricData(descriptor, aggregationTemporality, accumulationByAttributes, endTime) {
		return {
			descriptor,
			aggregationTemporality,
			dataPointType: DataPointType.EXPONENTIAL_HISTOGRAM,
			dataPoints: accumulationByAttributes.map(([attributes, accumulation]) => {
				const pointValue = accumulation.toPointValue();
				return {
					attributes,
					startTime: accumulation.startTime,
					endTime,
					value: {
						min: pointValue.hasMinMax ? pointValue.min : void 0,
						max: pointValue.hasMinMax ? pointValue.max : void 0,
						sum: !(descriptor.type === InstrumentType.GAUGE || descriptor.type === InstrumentType.UP_DOWN_COUNTER || descriptor.type === InstrumentType.OBSERVABLE_GAUGE || descriptor.type === InstrumentType.OBSERVABLE_UP_DOWN_COUNTER) ? pointValue.sum : void 0,
						positive: {
							offset: pointValue.positive.offset,
							bucketCounts: pointValue.positive.bucketCounts
						},
						negative: {
							offset: pointValue.negative.offset,
							bucketCounts: pointValue.negative.bucketCounts
						},
						count: pointValue.count,
						scale: pointValue.scale,
						zeroCount: pointValue.zeroCount
					}
				};
			})
		};
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/aggregator/LastValue.js
var LastValueAccumulation = class {
	startTime;
	_current;
	sampleTime;
	constructor(startTime, current = 0, sampleTime = [0, 0]) {
		this.startTime = startTime;
		this._current = current;
		this.sampleTime = sampleTime;
	}
	record(value) {
		this._current = value;
		this.sampleTime = millisToHrTime(Date.now());
	}
	setStartTime(startTime) {
		this.startTime = startTime;
	}
	toPointValue() {
		return this._current;
	}
};
/** Basic aggregator which calculates a LastValue from individual measurements. */
var LastValueAggregator = class {
	kind = AggregatorKind.LAST_VALUE;
	createAccumulation(startTime) {
		return new LastValueAccumulation(startTime);
	}
	/**
	* Returns the result of the merge of the given accumulations.
	*
	* Return the newly captured (delta) accumulation for LastValueAggregator.
	*/
	merge(previous, delta) {
		const latestAccumulation = hrTimeToMicroseconds(delta.sampleTime) >= hrTimeToMicroseconds(previous.sampleTime) ? delta : previous;
		return new LastValueAccumulation(previous.startTime, latestAccumulation.toPointValue(), latestAccumulation.sampleTime);
	}
	/**
	* Returns a new DELTA aggregation by comparing two cumulative measurements.
	*
	* A delta aggregation is not meaningful to LastValueAggregator, just return
	* the newly captured (delta) accumulation for LastValueAggregator.
	*/
	diff(previous, current) {
		const latestAccumulation = hrTimeToMicroseconds(current.sampleTime) >= hrTimeToMicroseconds(previous.sampleTime) ? current : previous;
		return new LastValueAccumulation(current.startTime, latestAccumulation.toPointValue(), latestAccumulation.sampleTime);
	}
	toMetricData(descriptor, aggregationTemporality, accumulationByAttributes, endTime) {
		return {
			descriptor,
			aggregationTemporality,
			dataPointType: DataPointType.GAUGE,
			dataPoints: accumulationByAttributes.map(([attributes, accumulation]) => {
				return {
					attributes,
					startTime: accumulation.startTime,
					endTime,
					value: accumulation.toPointValue()
				};
			})
		};
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/aggregator/Sum.js
var SumAccumulation = class {
	startTime;
	monotonic;
	_current;
	reset;
	constructor(startTime, monotonic, current = 0, reset = false) {
		this.startTime = startTime;
		this.monotonic = monotonic;
		this._current = current;
		this.reset = reset;
	}
	record(value) {
		if (this.monotonic && value < 0) return;
		this._current += value;
	}
	setStartTime(startTime) {
		this.startTime = startTime;
	}
	toPointValue() {
		return this._current;
	}
};
/** Basic aggregator which calculates a Sum from individual measurements. */
var SumAggregator = class {
	kind = AggregatorKind.SUM;
	monotonic;
	constructor(monotonic) {
		this.monotonic = monotonic;
	}
	createAccumulation(startTime) {
		return new SumAccumulation(startTime, this.monotonic);
	}
	/**
	* Returns the result of the merge of the given accumulations.
	*/
	merge(previous, delta) {
		const prevPv = previous.toPointValue();
		const deltaPv = delta.toPointValue();
		if (delta.reset) return new SumAccumulation(delta.startTime, this.monotonic, deltaPv, delta.reset);
		return new SumAccumulation(previous.startTime, this.monotonic, prevPv + deltaPv);
	}
	/**
	* Returns a new DELTA aggregation by comparing two cumulative measurements.
	*/
	diff(previous, current) {
		const prevPv = previous.toPointValue();
		const currPv = current.toPointValue();
		/**
		* If the SumAggregator is a monotonic one and the previous point value is
		* greater than the current one, a reset is deemed to be happened.
		* Return the current point value to prevent the value from been reset.
		*/
		if (this.monotonic && prevPv > currPv) return new SumAccumulation(current.startTime, this.monotonic, currPv, true);
		return new SumAccumulation(current.startTime, this.monotonic, currPv - prevPv);
	}
	toMetricData(descriptor, aggregationTemporality, accumulationByAttributes, endTime) {
		return {
			descriptor,
			aggregationTemporality,
			dataPointType: DataPointType.SUM,
			dataPoints: accumulationByAttributes.map(([attributes, accumulation]) => {
				return {
					attributes,
					startTime: accumulation.startTime,
					endTime,
					value: accumulation.toPointValue()
				};
			}),
			isMonotonic: this.monotonic
		};
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/view/Aggregation.js
/**
* The default drop aggregation.
*/
var DropAggregation = class DropAggregation {
	static DEFAULT_INSTANCE = new DropAggregator();
	createAggregator(_instrument) {
		return DropAggregation.DEFAULT_INSTANCE;
	}
};
/**
* The default sum aggregation.
*/
var SumAggregation = class SumAggregation {
	static MONOTONIC_INSTANCE = new SumAggregator(true);
	static NON_MONOTONIC_INSTANCE = new SumAggregator(false);
	createAggregator(instrument) {
		switch (instrument.type) {
			case InstrumentType.COUNTER:
			case InstrumentType.OBSERVABLE_COUNTER:
			case InstrumentType.HISTOGRAM: return SumAggregation.MONOTONIC_INSTANCE;
			default: return SumAggregation.NON_MONOTONIC_INSTANCE;
		}
	}
};
/**
* The default last value aggregation.
*/
var LastValueAggregation = class LastValueAggregation {
	static DEFAULT_INSTANCE = new LastValueAggregator();
	createAggregator(_instrument) {
		return LastValueAggregation.DEFAULT_INSTANCE;
	}
};
/**
* The default histogram aggregation.

*/
var HistogramAggregation = class HistogramAggregation {
	static DEFAULT_INSTANCE = new HistogramAggregator([
		0,
		5,
		10,
		25,
		50,
		75,
		100,
		250,
		500,
		750,
		1e3,
		2500,
		5e3,
		7500,
		1e4
	], true);
	createAggregator(_instrument) {
		return HistogramAggregation.DEFAULT_INSTANCE;
	}
};
/**
* The explicit bucket histogram aggregation.
*/
var ExplicitBucketHistogramAggregation = class {
	_boundaries;
	_recordMinMax;
	/**
	* @param boundaries the bucket boundaries of the histogram aggregation
	* @param _recordMinMax If set to true, min and max will be recorded. Otherwise, min and max will not be recorded.
	*/
	constructor(boundaries, recordMinMax = true) {
		if (boundaries == null) throw new Error("ExplicitBucketHistogramAggregation should be created with explicit boundaries, if a single bucket histogram is required, please pass an empty array");
		boundaries = boundaries.concat();
		boundaries = boundaries.sort((a, b) => a - b);
		const minusInfinityIndex = boundaries.lastIndexOf(-Infinity);
		let infinityIndex = boundaries.indexOf(Infinity);
		if (infinityIndex === -1) infinityIndex = void 0;
		this._boundaries = boundaries.slice(minusInfinityIndex + 1, infinityIndex);
		this._recordMinMax = recordMinMax;
	}
	createAggregator(_instrument) {
		return new HistogramAggregator(this._boundaries, this._recordMinMax);
	}
};
var ExponentialHistogramAggregation = class {
	_maxSize;
	_recordMinMax;
	constructor(maxSize = 160, recordMinMax = true) {
		this._maxSize = maxSize;
		this._recordMinMax = recordMinMax;
	}
	createAggregator(_instrument) {
		return new ExponentialHistogramAggregator(this._maxSize, this._recordMinMax);
	}
};
/**
* The default aggregation.
*/
var DefaultAggregation = class {
	_resolve(instrument) {
		switch (instrument.type) {
			case InstrumentType.COUNTER:
			case InstrumentType.UP_DOWN_COUNTER:
			case InstrumentType.OBSERVABLE_COUNTER:
			case InstrumentType.OBSERVABLE_UP_DOWN_COUNTER: return SUM_AGGREGATION;
			case InstrumentType.GAUGE:
			case InstrumentType.OBSERVABLE_GAUGE: return LAST_VALUE_AGGREGATION;
			case InstrumentType.HISTOGRAM:
				if (instrument.advice.explicitBucketBoundaries) return new ExplicitBucketHistogramAggregation(instrument.advice.explicitBucketBoundaries);
				return HISTOGRAM_AGGREGATION;
		}
		diag.warn(`Unable to recognize instrument type: ${instrument.type}`);
		return DROP_AGGREGATION;
	}
	createAggregator(instrument) {
		return this._resolve(instrument).createAggregator(instrument);
	}
};
var DROP_AGGREGATION = new DropAggregation();
var SUM_AGGREGATION = new SumAggregation();
var LAST_VALUE_AGGREGATION = new LastValueAggregation();
var HISTOGRAM_AGGREGATION = new HistogramAggregation();
new ExponentialHistogramAggregation();
var DEFAULT_AGGREGATION$1 = new DefaultAggregation();
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/view/AggregationOption.js
var AggregationType;
(function(AggregationType) {
	AggregationType[AggregationType["DEFAULT"] = 0] = "DEFAULT";
	AggregationType[AggregationType["DROP"] = 1] = "DROP";
	AggregationType[AggregationType["SUM"] = 2] = "SUM";
	AggregationType[AggregationType["LAST_VALUE"] = 3] = "LAST_VALUE";
	AggregationType[AggregationType["EXPLICIT_BUCKET_HISTOGRAM"] = 4] = "EXPLICIT_BUCKET_HISTOGRAM";
	AggregationType[AggregationType["EXPONENTIAL_HISTOGRAM"] = 5] = "EXPONENTIAL_HISTOGRAM";
})(AggregationType || (AggregationType = {}));
function toAggregation(option) {
	switch (option.type) {
		case AggregationType.DEFAULT: return DEFAULT_AGGREGATION$1;
		case AggregationType.DROP: return DROP_AGGREGATION;
		case AggregationType.SUM: return SUM_AGGREGATION;
		case AggregationType.LAST_VALUE: return LAST_VALUE_AGGREGATION;
		case AggregationType.EXPONENTIAL_HISTOGRAM: {
			const expOption = option;
			return new ExponentialHistogramAggregation(expOption.options?.maxSize, expOption.options?.recordMinMax);
		}
		case AggregationType.EXPLICIT_BUCKET_HISTOGRAM: {
			const expOption = option;
			if (expOption.options == null) return HISTOGRAM_AGGREGATION;
			else return new ExplicitBucketHistogramAggregation(expOption.options?.boundaries, expOption.options?.recordMinMax);
		}
		default: throw new Error("Unsupported Aggregation");
	}
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/export/AggregationSelector.js
var DEFAULT_AGGREGATION_SELECTOR = (_instrumentType) => {
	return { type: AggregationType.DEFAULT };
};
var DEFAULT_AGGREGATION_TEMPORALITY_SELECTOR = (_instrumentType) => AggregationTemporality.CUMULATIVE;
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/export/MetricReader.js
/**
* A registered reader of metrics that, when linked to a {@link MetricProducer}, offers global
* control over metrics.
*/
var MetricReader = class {
	_shutdown = false;
	_metricProducers;
	_sdkMetricProducer;
	_aggregationTemporalitySelector;
	_aggregationSelector;
	_cardinalitySelector;
	constructor(options) {
		this._aggregationSelector = options?.aggregationSelector ?? DEFAULT_AGGREGATION_SELECTOR;
		this._aggregationTemporalitySelector = options?.aggregationTemporalitySelector ?? DEFAULT_AGGREGATION_TEMPORALITY_SELECTOR;
		this._metricProducers = options?.metricProducers ?? [];
		this._cardinalitySelector = options?.cardinalitySelector;
	}
	setMetricProducer(metricProducer) {
		if (this._sdkMetricProducer) throw new Error("MetricReader can not be bound to a MeterProvider again.");
		this._sdkMetricProducer = metricProducer;
		this.onInitialized();
	}
	selectAggregation(instrumentType) {
		return this._aggregationSelector(instrumentType);
	}
	selectAggregationTemporality(instrumentType) {
		return this._aggregationTemporalitySelector(instrumentType);
	}
	selectCardinalityLimit(instrumentType) {
		return this._cardinalitySelector ? this._cardinalitySelector(instrumentType) : 2e3;
	}
	/**
	* Handle once the SDK has initialized this {@link MetricReader}
	* Overriding this method is optional.
	*/
	onInitialized() {}
	async collect(options) {
		if (this._sdkMetricProducer === void 0) throw new Error("MetricReader is not bound to a MetricProducer");
		if (this._shutdown) throw new Error("MetricReader is shutdown");
		const [sdkCollectionResults, ...additionalCollectionResults] = await Promise.all([this._sdkMetricProducer.collect({ timeoutMillis: options?.timeoutMillis }), ...this._metricProducers.map((producer) => producer.collect({ timeoutMillis: options?.timeoutMillis }))]);
		const errors = sdkCollectionResults.errors.concat(additionalCollectionResults.flatMap((result) => result.errors));
		return {
			resourceMetrics: {
				resource: sdkCollectionResults.resourceMetrics.resource,
				scopeMetrics: sdkCollectionResults.resourceMetrics.scopeMetrics.concat(additionalCollectionResults.flatMap((result) => result.resourceMetrics.scopeMetrics))
			},
			errors
		};
	}
	async shutdown(options) {
		if (this._shutdown) {
			diag.error("Cannot call shutdown twice.");
			return;
		}
		if (options?.timeoutMillis == null) await this.onShutdown();
		else await callWithTimeout(this.onShutdown(), options.timeoutMillis);
		this._shutdown = true;
	}
	async forceFlush(options) {
		if (this._shutdown) {
			diag.warn("Cannot forceFlush on already shutdown MetricReader.");
			return;
		}
		if (options?.timeoutMillis == null) {
			await this.onForceFlush();
			return;
		}
		await callWithTimeout(this.onForceFlush(), options.timeoutMillis);
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/export/PeriodicExportingMetricReader.js
/**
* {@link MetricReader} which collects metrics based on a user-configurable time interval, and passes the metrics to
* the configured {@link PushMetricExporter}
*/
var PeriodicExportingMetricReader = class extends MetricReader {
	_interval;
	_exporter;
	_exportInterval;
	_exportTimeout;
	constructor(options) {
		const { exporter, exportIntervalMillis = 6e4, metricProducers, cardinalityLimits } = options;
		let { exportTimeoutMillis = 3e4 } = options;
		super({
			aggregationSelector: exporter.selectAggregation?.bind(exporter),
			aggregationTemporalitySelector: exporter.selectAggregationTemporality?.bind(exporter),
			metricProducers,
			cardinalitySelector: (instrumentType) => {
				const limits = {
					default: 2e3,
					...cardinalityLimits
				};
				switch (instrumentType) {
					case InstrumentType.COUNTER: return limits.counter ?? limits.default;
					case InstrumentType.GAUGE: return limits.gauge ?? limits.default;
					case InstrumentType.HISTOGRAM: return limits.histogram ?? limits.default;
					case InstrumentType.OBSERVABLE_COUNTER: return limits.observableCounter ?? limits.default;
					case InstrumentType.OBSERVABLE_UP_DOWN_COUNTER: return limits.observableUpDownCounter ?? limits.default;
					case InstrumentType.OBSERVABLE_GAUGE: return limits.observableGauge ?? limits.default;
					case InstrumentType.UP_DOWN_COUNTER: return limits.upDownCounter ?? limits.default;
					default: return limits.default;
				}
			}
		});
		if (exportIntervalMillis <= 0) throw Error("exportIntervalMillis must be greater than 0");
		if (exportTimeoutMillis <= 0) throw Error("exportTimeoutMillis must be greater than 0");
		if (exportIntervalMillis < exportTimeoutMillis) if ("exportIntervalMillis" in options && "exportTimeoutMillis" in options) throw Error("exportIntervalMillis must be greater than or equal to exportTimeoutMillis");
		else {
			diag.info(`Timeout of ${exportTimeoutMillis} exceeds the interval of ${exportIntervalMillis}. Clamping timeout to interval duration.`);
			exportTimeoutMillis = exportIntervalMillis;
		}
		this._exportInterval = exportIntervalMillis;
		this._exportTimeout = exportTimeoutMillis;
		this._exporter = exporter;
	}
	async _runOnce() {
		try {
			await callWithTimeout(this._doRun(), this._exportTimeout);
		} catch (err) {
			if (err instanceof TimeoutError) {
				diag.error("Export took longer than %s milliseconds and timed out.", this._exportTimeout);
				return;
			}
			globalErrorHandler(err);
		}
	}
	async _doRun() {
		const { resourceMetrics, errors } = await this.collect({ timeoutMillis: this._exportTimeout });
		if (errors.length > 0) diag.error("PeriodicExportingMetricReader: metrics collection errors", ...errors);
		if (resourceMetrics.resource.asyncAttributesPending) try {
			await resourceMetrics.resource.waitForAsyncAttributes?.();
		} catch (e) {
			diag.debug("Error while resolving async portion of resource: ", e);
			globalErrorHandler(e);
		}
		if (resourceMetrics.scopeMetrics.length === 0) return;
		const result = await internal._export(this._exporter, resourceMetrics);
		if (result.code !== ExportResultCode.SUCCESS) throw new Error(`PeriodicExportingMetricReader: metrics export failed (error ${result.error})`);
	}
	onInitialized() {
		this._interval = setInterval(() => {
			this._runOnce();
		}, this._exportInterval);
		if (typeof this._interval !== "number") this._interval.unref();
	}
	async onForceFlush() {
		await this._runOnce();
		await this._exporter.forceFlush();
	}
	async onShutdown() {
		if (this._interval) clearInterval(this._interval);
		await this.onForceFlush();
		await this._exporter.shutdown();
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/view/ViewRegistry.js
var ViewRegistry = class {
	_registeredViews = [];
	addView(view) {
		this._registeredViews.push(view);
	}
	findViews(instrument, meter) {
		return this._registeredViews.filter((registeredView) => {
			return this._matchInstrument(registeredView.instrumentSelector, instrument) && this._matchMeter(registeredView.meterSelector, meter);
		});
	}
	_matchInstrument(selector, instrument) {
		return (selector.getType() === void 0 || instrument.type === selector.getType()) && selector.getNameFilter().match(instrument.name) && selector.getUnitFilter().match(instrument.unit);
	}
	_matchMeter(selector, meter) {
		return selector.getNameFilter().match(meter.name) && (meter.version === void 0 || selector.getVersionFilter().match(meter.version)) && (meter.schemaUrl === void 0 || selector.getSchemaUrlFilter().match(meter.schemaUrl));
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/InstrumentDescriptor.js
function createInstrumentDescriptor(name, type, options) {
	if (!isValidName(name)) diag.warn(`Invalid metric name: "${name}". The metric name should be a ASCII string with a length no greater than 255 characters.`);
	return {
		name,
		type,
		description: options?.description ?? "",
		unit: options?.unit ?? "",
		valueType: options?.valueType ?? ValueType.DOUBLE,
		advice: options?.advice ?? {}
	};
}
function createInstrumentDescriptorWithView(view, instrument) {
	return {
		name: view.name ?? instrument.name,
		description: view.description ?? instrument.description,
		type: instrument.type,
		unit: instrument.unit,
		valueType: instrument.valueType,
		advice: instrument.advice
	};
}
function isDescriptorCompatibleWith(descriptor, otherDescriptor) {
	return equalsCaseInsensitive(descriptor.name, otherDescriptor.name) && descriptor.unit === otherDescriptor.unit && descriptor.type === otherDescriptor.type && descriptor.valueType === otherDescriptor.valueType;
}
var NAME_REGEXP = /^[a-z][a-z0-9_.\-/]{0,254}$/i;
function isValidName(name) {
	return NAME_REGEXP.test(name);
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/Instruments.js
var SyncInstrument = class {
	_writableMetricStorage;
	_descriptor;
	constructor(writableMetricStorage, descriptor) {
		this._writableMetricStorage = writableMetricStorage;
		this._descriptor = descriptor;
	}
	_record(value, attributes = {}, context$2 = context.active()) {
		if (typeof value !== "number") {
			diag.warn(`non-number value provided to metric ${this._descriptor.name}: ${value}`);
			return;
		}
		if (this._descriptor.valueType === ValueType.INT && !Number.isInteger(value)) {
			diag.warn(`INT value type cannot accept a floating-point value for ${this._descriptor.name}, ignoring the fractional digits.`);
			value = Math.trunc(value);
			if (!Number.isInteger(value)) return;
		}
		this._writableMetricStorage.record(value, attributes, context$2, millisToHrTime(Date.now()));
	}
};
/**
* The class implements {@link UpDownCounter} interface.
*/
var UpDownCounterInstrument = class extends SyncInstrument {
	/**
	* Increment value of counter by the input. Inputs may be negative.
	*/
	add(value, attributes, ctx) {
		this._record(value, attributes, ctx);
	}
};
/**
* The class implements {@link Counter} interface.
*/
var CounterInstrument = class extends SyncInstrument {
	/**
	* Increment value of counter by the input. Inputs may not be negative.
	*/
	add(value, attributes, ctx) {
		if (value < 0) {
			diag.warn(`negative value provided to counter ${this._descriptor.name}: ${value}`);
			return;
		}
		this._record(value, attributes, ctx);
	}
};
/**
* The class implements {@link Gauge} interface.
*/
var GaugeInstrument = class extends SyncInstrument {
	/**
	* Records a measurement.
	*/
	record(value, attributes, ctx) {
		this._record(value, attributes, ctx);
	}
};
/**
* The class implements {@link Histogram} interface.
*/
var HistogramInstrument = class extends SyncInstrument {
	/**
	* Records a measurement. Value of the measurement must not be negative.
	*/
	record(value, attributes, ctx) {
		if (value < 0) {
			diag.warn(`negative value provided to histogram ${this._descriptor.name}: ${value}`);
			return;
		}
		this._record(value, attributes, ctx);
	}
};
var ObservableInstrument = class {
	/** @internal */
	_metricStorages;
	/** @internal */
	_descriptor;
	_observableRegistry;
	constructor(descriptor, metricStorages, observableRegistry) {
		this._descriptor = descriptor;
		this._metricStorages = metricStorages;
		this._observableRegistry = observableRegistry;
	}
	/**
	* @see {Observable.addCallback}
	*/
	addCallback(callback) {
		this._observableRegistry.addCallback(callback, this);
	}
	/**
	* @see {Observable.removeCallback}
	*/
	removeCallback(callback) {
		this._observableRegistry.removeCallback(callback, this);
	}
};
var ObservableCounterInstrument = class extends ObservableInstrument {};
var ObservableGaugeInstrument = class extends ObservableInstrument {};
var ObservableUpDownCounterInstrument = class extends ObservableInstrument {};
function isObservableInstrument(it) {
	return it instanceof ObservableInstrument;
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/Meter.js
/**
* This class implements the {@link IMeter} interface.
*/
var Meter = class {
	_meterSharedState;
	constructor(meterSharedState) {
		this._meterSharedState = meterSharedState;
	}
	/**
	* Create a {@link Gauge} instrument.
	*/
	createGauge(name, options) {
		const descriptor = createInstrumentDescriptor(name, InstrumentType.GAUGE, options);
		return new GaugeInstrument(this._meterSharedState.registerMetricStorage(descriptor), descriptor);
	}
	/**
	* Create a {@link Histogram} instrument.
	*/
	createHistogram(name, options) {
		const descriptor = createInstrumentDescriptor(name, InstrumentType.HISTOGRAM, options);
		return new HistogramInstrument(this._meterSharedState.registerMetricStorage(descriptor), descriptor);
	}
	/**
	* Create a {@link Counter} instrument.
	*/
	createCounter(name, options) {
		const descriptor = createInstrumentDescriptor(name, InstrumentType.COUNTER, options);
		return new CounterInstrument(this._meterSharedState.registerMetricStorage(descriptor), descriptor);
	}
	/**
	* Create a {@link UpDownCounter} instrument.
	*/
	createUpDownCounter(name, options) {
		const descriptor = createInstrumentDescriptor(name, InstrumentType.UP_DOWN_COUNTER, options);
		return new UpDownCounterInstrument(this._meterSharedState.registerMetricStorage(descriptor), descriptor);
	}
	/**
	* Create a {@link ObservableGauge} instrument.
	*/
	createObservableGauge(name, options) {
		const descriptor = createInstrumentDescriptor(name, InstrumentType.OBSERVABLE_GAUGE, options);
		return new ObservableGaugeInstrument(descriptor, this._meterSharedState.registerAsyncMetricStorage(descriptor), this._meterSharedState.observableRegistry);
	}
	/**
	* Create a {@link ObservableCounter} instrument.
	*/
	createObservableCounter(name, options) {
		const descriptor = createInstrumentDescriptor(name, InstrumentType.OBSERVABLE_COUNTER, options);
		return new ObservableCounterInstrument(descriptor, this._meterSharedState.registerAsyncMetricStorage(descriptor), this._meterSharedState.observableRegistry);
	}
	/**
	* Create a {@link ObservableUpDownCounter} instrument.
	*/
	createObservableUpDownCounter(name, options) {
		const descriptor = createInstrumentDescriptor(name, InstrumentType.OBSERVABLE_UP_DOWN_COUNTER, options);
		return new ObservableUpDownCounterInstrument(descriptor, this._meterSharedState.registerAsyncMetricStorage(descriptor), this._meterSharedState.observableRegistry);
	}
	/**
	* @see {@link Meter.addBatchObservableCallback}
	*/
	addBatchObservableCallback(callback, observables) {
		this._meterSharedState.observableRegistry.addBatchCallback(callback, observables);
	}
	/**
	* @see {@link Meter.removeBatchObservableCallback}
	*/
	removeBatchObservableCallback(callback, observables) {
		this._meterSharedState.observableRegistry.removeBatchCallback(callback, observables);
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/state/MetricStorage.js
/**
* Internal interface.
*
* Represents a storage from which we can collect metrics.
*/
var MetricStorage = class {
	_instrumentDescriptor;
	constructor(instrumentDescriptor) {
		this._instrumentDescriptor = instrumentDescriptor;
	}
	getInstrumentDescriptor() {
		return this._instrumentDescriptor;
	}
	updateDescription(description) {
		this._instrumentDescriptor = createInstrumentDescriptor(this._instrumentDescriptor.name, this._instrumentDescriptor.type, {
			description,
			valueType: this._instrumentDescriptor.valueType,
			unit: this._instrumentDescriptor.unit,
			advice: this._instrumentDescriptor.advice
		});
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/state/HashMap.js
var HashMap = class {
	_valueMap = /* @__PURE__ */ new Map();
	_keyMap = /* @__PURE__ */ new Map();
	_hash;
	constructor(hash) {
		this._hash = hash;
	}
	get(key, hashCode) {
		hashCode ??= this._hash(key);
		return this._valueMap.get(hashCode);
	}
	getOrDefault(key, defaultFactory) {
		const hash = this._hash(key);
		if (this._valueMap.has(hash)) return this._valueMap.get(hash);
		const val = defaultFactory();
		if (!this._keyMap.has(hash)) this._keyMap.set(hash, key);
		this._valueMap.set(hash, val);
		return val;
	}
	set(key, value, hashCode) {
		hashCode ??= this._hash(key);
		if (!this._keyMap.has(hashCode)) this._keyMap.set(hashCode, key);
		this._valueMap.set(hashCode, value);
	}
	has(key, hashCode) {
		hashCode ??= this._hash(key);
		return this._valueMap.has(hashCode);
	}
	*keys() {
		const keyIterator = this._keyMap.entries();
		let next = keyIterator.next();
		while (next.done !== true) {
			yield [next.value[1], next.value[0]];
			next = keyIterator.next();
		}
	}
	*entries() {
		const valueIterator = this._valueMap.entries();
		let next = valueIterator.next();
		while (next.done !== true) {
			yield [
				this._keyMap.get(next.value[0]),
				next.value[1],
				next.value[0]
			];
			next = valueIterator.next();
		}
	}
	get size() {
		return this._valueMap.size;
	}
};
var AttributeHashMap = class extends HashMap {
	constructor() {
		super(hashAttributes);
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/state/DeltaMetricProcessor.js
/**
* Internal interface.
*
* Allows synchronous collection of metrics. This processor should allow
* allocation of new aggregation cells for metrics and convert cumulative
* recording to delta data points.
*/
var DeltaMetricProcessor = class {
	_activeCollectionStorage = new AttributeHashMap();
	_cumulativeMemoStorage = new AttributeHashMap();
	_cardinalityLimit;
	_overflowAttributes = { "otel.metric.overflow": true };
	_overflowHashCode;
	_aggregator;
	constructor(aggregator, aggregationCardinalityLimit) {
		this._aggregator = aggregator;
		this._cardinalityLimit = (aggregationCardinalityLimit ?? 2e3) - 1;
		this._overflowHashCode = hashAttributes(this._overflowAttributes);
	}
	record(value, attributes, _context, collectionTime) {
		let accumulation = this._activeCollectionStorage.get(attributes);
		if (!accumulation) {
			if (this._activeCollectionStorage.size >= this._cardinalityLimit) {
				this._activeCollectionStorage.getOrDefault(this._overflowAttributes, () => this._aggregator.createAccumulation(collectionTime))?.record(value);
				return;
			}
			accumulation = this._aggregator.createAccumulation(collectionTime);
			this._activeCollectionStorage.set(attributes, accumulation);
		}
		accumulation?.record(value);
	}
	batchCumulate(measurements, collectionTime) {
		for (const [originalAttributes, value, originalHashCode] of measurements.entries()) {
			let attributes = originalAttributes;
			let hashCode = originalHashCode;
			const accumulation = this._aggregator.createAccumulation(collectionTime);
			accumulation?.record(value);
			let delta = accumulation;
			if (this._cumulativeMemoStorage.has(attributes, hashCode)) {
				const previous = this._cumulativeMemoStorage.get(attributes, hashCode);
				delta = this._aggregator.diff(previous, accumulation);
			} else if (this._cumulativeMemoStorage.size >= this._cardinalityLimit) {
				attributes = this._overflowAttributes;
				hashCode = this._overflowHashCode;
				if (this._cumulativeMemoStorage.has(attributes, hashCode)) {
					const previous = this._cumulativeMemoStorage.get(attributes, hashCode);
					delta = this._aggregator.diff(previous, accumulation);
				}
			}
			if (this._activeCollectionStorage.has(attributes, hashCode)) {
				const active = this._activeCollectionStorage.get(attributes, hashCode);
				delta = this._aggregator.merge(active, delta);
			}
			this._cumulativeMemoStorage.set(attributes, accumulation, hashCode);
			this._activeCollectionStorage.set(attributes, delta, hashCode);
		}
	}
	/**
	* Returns a collection of delta metrics. Start time is the when first
	* time event collected.
	*/
	collect() {
		const unreportedDelta = this._activeCollectionStorage;
		this._activeCollectionStorage = new AttributeHashMap();
		return unreportedDelta;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/state/TemporalMetricProcessor.js
/**
* Internal interface.
*
* Provides unique reporting for each collector. Allows synchronous collection
* of metrics and reports given temporality values.
*/
var TemporalMetricProcessor = class TemporalMetricProcessor {
	_aggregator;
	_unreportedAccumulations = /* @__PURE__ */ new Map();
	_reportHistory = /* @__PURE__ */ new Map();
	constructor(aggregator, collectorHandles) {
		this._aggregator = aggregator;
		collectorHandles.forEach((handle) => {
			this._unreportedAccumulations.set(handle, []);
		});
	}
	/**
	* Builds the {@link MetricData} streams to report against a specific MetricCollector.
	* @param collector The information of the MetricCollector.
	* @param collectors The registered collectors.
	* @param instrumentDescriptor The instrumentation descriptor that these metrics generated with.
	* @param currentAccumulations The current accumulation of metric data from instruments.
	* @param collectionTime The current collection timestamp.
	* @returns The {@link MetricData} points or `null`.
	*/
	buildMetrics(collector, instrumentDescriptor, currentAccumulations, collectionTime) {
		this._stashAccumulations(currentAccumulations);
		const unreportedAccumulations = this._getMergedUnreportedAccumulations(collector);
		let result = unreportedAccumulations;
		let aggregationTemporality;
		if (this._reportHistory.has(collector)) {
			const last = this._reportHistory.get(collector);
			const lastCollectionTime = last.collectionTime;
			aggregationTemporality = last.aggregationTemporality;
			if (aggregationTemporality === AggregationTemporality.CUMULATIVE) result = TemporalMetricProcessor.merge(last.accumulations, unreportedAccumulations, this._aggregator);
			else result = TemporalMetricProcessor.calibrateStartTime(last.accumulations, unreportedAccumulations, lastCollectionTime);
		} else aggregationTemporality = collector.selectAggregationTemporality(instrumentDescriptor.type);
		this._reportHistory.set(collector, {
			accumulations: result,
			collectionTime,
			aggregationTemporality
		});
		const accumulationRecords = AttributesMapToAccumulationRecords(result);
		if (accumulationRecords.length === 0) return;
		return this._aggregator.toMetricData(instrumentDescriptor, aggregationTemporality, accumulationRecords, collectionTime);
	}
	_stashAccumulations(currentAccumulation) {
		const registeredCollectors = this._unreportedAccumulations.keys();
		for (const collector of registeredCollectors) {
			let stash = this._unreportedAccumulations.get(collector);
			if (stash === void 0) {
				stash = [];
				this._unreportedAccumulations.set(collector, stash);
			}
			stash.push(currentAccumulation);
		}
	}
	_getMergedUnreportedAccumulations(collector) {
		let result = new AttributeHashMap();
		const unreportedList = this._unreportedAccumulations.get(collector);
		this._unreportedAccumulations.set(collector, []);
		if (unreportedList === void 0) return result;
		for (const it of unreportedList) result = TemporalMetricProcessor.merge(result, it, this._aggregator);
		return result;
	}
	static merge(last, current, aggregator) {
		const result = last;
		const iterator = current.entries();
		let next = iterator.next();
		while (next.done !== true) {
			const [key, record, hash] = next.value;
			if (last.has(key, hash)) {
				const lastAccumulation = last.get(key, hash);
				const accumulation = aggregator.merge(lastAccumulation, record);
				result.set(key, accumulation, hash);
			} else result.set(key, record, hash);
			next = iterator.next();
		}
		return result;
	}
	/**
	* Calibrate the reported metric streams' startTime to lastCollectionTime. Leaves
	* the new stream to be the initial observation time unchanged.
	*/
	static calibrateStartTime(last, current, lastCollectionTime) {
		for (const [key, hash] of last.keys()) current.get(key, hash)?.setStartTime(lastCollectionTime);
		return current;
	}
};
function AttributesMapToAccumulationRecords(map) {
	return Array.from(map.entries());
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/state/AsyncMetricStorage.js
/**
* Internal interface.
*
* Stores and aggregates {@link MetricData} for asynchronous instruments.
*/
var AsyncMetricStorage = class extends MetricStorage {
	_aggregationCardinalityLimit;
	_deltaMetricStorage;
	_temporalMetricStorage;
	_attributesProcessor;
	constructor(_instrumentDescriptor, aggregator, attributesProcessor, collectorHandles, aggregationCardinalityLimit) {
		super(_instrumentDescriptor);
		this._aggregationCardinalityLimit = aggregationCardinalityLimit;
		this._deltaMetricStorage = new DeltaMetricProcessor(aggregator, this._aggregationCardinalityLimit);
		this._temporalMetricStorage = new TemporalMetricProcessor(aggregator, collectorHandles);
		this._attributesProcessor = attributesProcessor;
	}
	record(measurements, observationTime) {
		const processed = new AttributeHashMap();
		for (const [attributes, value] of measurements.entries()) processed.set(this._attributesProcessor.process(attributes), value);
		this._deltaMetricStorage.batchCumulate(processed, observationTime);
	}
	/**
	* Collects the metrics from this storage. The ObservableCallback is invoked
	* during the collection.
	*
	* Note: This is a stateful operation and may reset any interval-related
	* state for the MetricCollector.
	*/
	collect(collector, collectionTime) {
		const accumulations = this._deltaMetricStorage.collect();
		return this._temporalMetricStorage.buildMetrics(collector, this._instrumentDescriptor, accumulations, collectionTime);
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/view/RegistrationConflicts.js
function getIncompatibilityDetails(existing, otherDescriptor) {
	let incompatibility = "";
	if (existing.unit !== otherDescriptor.unit) incompatibility += `\t- Unit '${existing.unit}' does not match '${otherDescriptor.unit}'\n`;
	if (existing.type !== otherDescriptor.type) incompatibility += `\t- Type '${existing.type}' does not match '${otherDescriptor.type}'\n`;
	if (existing.valueType !== otherDescriptor.valueType) incompatibility += `\t- Value Type '${existing.valueType}' does not match '${otherDescriptor.valueType}'\n`;
	if (existing.description !== otherDescriptor.description) incompatibility += `\t- Description '${existing.description}' does not match '${otherDescriptor.description}'\n`;
	return incompatibility;
}
function getValueTypeConflictResolutionRecipe(existing, otherDescriptor) {
	return `\t- use valueType '${existing.valueType}' on instrument creation or use an instrument name other than '${otherDescriptor.name}'`;
}
function getUnitConflictResolutionRecipe(existing, otherDescriptor) {
	return `\t- use unit '${existing.unit}' on instrument creation or use an instrument name other than '${otherDescriptor.name}'`;
}
function getTypeConflictResolutionRecipe(existing, otherDescriptor) {
	const selectorString = JSON.stringify({
		name: otherDescriptor.name,
		type: otherDescriptor.type,
		unit: otherDescriptor.unit
	});
	return `\t- create a new view with a name other than '${existing.name}' and InstrumentSelector '${selectorString}'`;
}
function getDescriptionResolutionRecipe(existing, otherDescriptor) {
	const selectorString = JSON.stringify({
		name: otherDescriptor.name,
		type: otherDescriptor.type,
		unit: otherDescriptor.unit
	});
	return `\t- create a new view with a name other than '${existing.name}' and InstrumentSelector '${selectorString}'
    \t- OR - create a new view with the name ${existing.name} and description '${existing.description}' and InstrumentSelector ${selectorString}
    \t- OR - create a new view with the name ${otherDescriptor.name} and description '${existing.description}' and InstrumentSelector ${selectorString}`;
}
function getConflictResolutionRecipe(existing, otherDescriptor) {
	if (existing.valueType !== otherDescriptor.valueType) return getValueTypeConflictResolutionRecipe(existing, otherDescriptor);
	if (existing.unit !== otherDescriptor.unit) return getUnitConflictResolutionRecipe(existing, otherDescriptor);
	if (existing.type !== otherDescriptor.type) return getTypeConflictResolutionRecipe(existing, otherDescriptor);
	if (existing.description !== otherDescriptor.description) return getDescriptionResolutionRecipe(existing, otherDescriptor);
	return "";
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/state/MetricStorageRegistry.js
/**
* Internal class for storing {@link MetricStorage}
*/
var MetricStorageRegistry = class MetricStorageRegistry {
	_sharedRegistry = /* @__PURE__ */ new Map();
	_perCollectorRegistry = /* @__PURE__ */ new Map();
	static create() {
		return new MetricStorageRegistry();
	}
	getStorages(collector) {
		let storages = [];
		for (const metricStorages of this._sharedRegistry.values()) storages = storages.concat(metricStorages);
		const perCollectorStorages = this._perCollectorRegistry.get(collector);
		if (perCollectorStorages != null) for (const metricStorages of perCollectorStorages.values()) storages = storages.concat(metricStorages);
		return storages;
	}
	register(storage) {
		this._registerStorage(storage, this._sharedRegistry);
	}
	registerForCollector(collector, storage) {
		let storageMap = this._perCollectorRegistry.get(collector);
		if (storageMap == null) {
			storageMap = /* @__PURE__ */ new Map();
			this._perCollectorRegistry.set(collector, storageMap);
		}
		this._registerStorage(storage, storageMap);
	}
	findOrUpdateCompatibleStorage(expectedDescriptor) {
		const storages = this._sharedRegistry.get(expectedDescriptor.name);
		if (storages === void 0) return null;
		return this._findOrUpdateCompatibleStorage(expectedDescriptor, storages);
	}
	findOrUpdateCompatibleCollectorStorage(collector, expectedDescriptor) {
		const storageMap = this._perCollectorRegistry.get(collector);
		if (storageMap === void 0) return null;
		const storages = storageMap.get(expectedDescriptor.name);
		if (storages === void 0) return null;
		return this._findOrUpdateCompatibleStorage(expectedDescriptor, storages);
	}
	_registerStorage(storage, storageMap) {
		const descriptor = storage.getInstrumentDescriptor();
		const storages = storageMap.get(descriptor.name);
		if (storages === void 0) {
			storageMap.set(descriptor.name, [storage]);
			return;
		}
		storages.push(storage);
	}
	_findOrUpdateCompatibleStorage(expectedDescriptor, existingStorages) {
		let compatibleStorage = null;
		for (const existingStorage of existingStorages) {
			const existingDescriptor = existingStorage.getInstrumentDescriptor();
			if (isDescriptorCompatibleWith(existingDescriptor, expectedDescriptor)) {
				if (existingDescriptor.description !== expectedDescriptor.description) {
					if (expectedDescriptor.description.length > existingDescriptor.description.length) existingStorage.updateDescription(expectedDescriptor.description);
					diag.warn("A view or instrument with the name ", expectedDescriptor.name, " has already been registered, but has a different description and is incompatible with another registered view.\n", "Details:\n", getIncompatibilityDetails(existingDescriptor, expectedDescriptor), "The longer description will be used.\nTo resolve the conflict:", getConflictResolutionRecipe(existingDescriptor, expectedDescriptor));
				}
				compatibleStorage = existingStorage;
			} else diag.warn("A view or instrument with the name ", expectedDescriptor.name, " has already been registered and is incompatible with another registered view.\n", "Details:\n", getIncompatibilityDetails(existingDescriptor, expectedDescriptor), "To resolve the conflict:\n", getConflictResolutionRecipe(existingDescriptor, expectedDescriptor));
		}
		return compatibleStorage;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/state/MultiWritableMetricStorage.js
/**
* Internal interface.
*/
var MultiMetricStorage = class {
	_backingStorages;
	constructor(backingStorages) {
		this._backingStorages = backingStorages;
	}
	record(value, attributes, context, recordTime) {
		const storages = this._backingStorages;
		for (let i = 0; i < storages.length; i++) storages[i].record(value, attributes, context, recordTime);
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/ObservableResult.js
/**
* The class implements {@link ObservableResult} interface.
*/
var ObservableResultImpl = class {
	/**
	* @internal
	*/
	_buffer = new AttributeHashMap();
	_instrumentName;
	_valueType;
	constructor(instrumentName, valueType) {
		this._instrumentName = instrumentName;
		this._valueType = valueType;
	}
	/**
	* Observe a measurement of the value associated with the given attributes.
	*/
	observe(value, attributes = {}) {
		if (typeof value !== "number") {
			diag.warn(`non-number value provided to metric ${this._instrumentName}: ${value}`);
			return;
		}
		if (this._valueType === ValueType.INT && !Number.isInteger(value)) {
			diag.warn(`INT value type cannot accept a floating-point value for ${this._instrumentName}, ignoring the fractional digits.`);
			value = Math.trunc(value);
			if (!Number.isInteger(value)) return;
		}
		this._buffer.set(attributes, value);
	}
};
/**
* The class implements {@link BatchObservableCallback} interface.
*/
var BatchObservableResultImpl = class {
	/**
	* @internal
	*/
	_buffer = /* @__PURE__ */ new Map();
	/**
	* Observe a measurement of the value associated with the given attributes.
	*/
	observe(metric, value, attributes = {}) {
		if (!isObservableInstrument(metric)) return;
		let map = this._buffer.get(metric);
		if (map == null) {
			map = new AttributeHashMap();
			this._buffer.set(metric, map);
		}
		if (typeof value !== "number") {
			diag.warn(`non-number value provided to metric ${metric._descriptor.name}: ${value}`);
			return;
		}
		if (metric._descriptor.valueType === ValueType.INT && !Number.isInteger(value)) {
			diag.warn(`INT value type cannot accept a floating-point value for ${metric._descriptor.name}, ignoring the fractional digits.`);
			value = Math.trunc(value);
			if (!Number.isInteger(value)) return;
		}
		map.set(attributes, value);
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/state/ObservableRegistry.js
/**
* An internal interface for managing ObservableCallbacks.
*
* Every registered callback associated with a set of instruments are be evaluated
* exactly once during collection prior to reading data for that instrument.
*/
var ObservableRegistry = class {
	_callbacks = [];
	_batchCallbacks = [];
	addCallback(callback, instrument) {
		if (this._findCallback(callback, instrument) >= 0) return;
		this._callbacks.push({
			callback,
			instrument
		});
	}
	removeCallback(callback, instrument) {
		const idx = this._findCallback(callback, instrument);
		if (idx < 0) return;
		this._callbacks.splice(idx, 1);
	}
	addBatchCallback(callback, instruments) {
		const observableInstruments = new Set(instruments.filter(isObservableInstrument));
		if (observableInstruments.size === 0) {
			diag.error("BatchObservableCallback is not associated with valid instruments", instruments);
			return;
		}
		if (this._findBatchCallback(callback, observableInstruments) >= 0) return;
		this._batchCallbacks.push({
			callback,
			instruments: observableInstruments
		});
	}
	removeBatchCallback(callback, instruments) {
		const observableInstruments = new Set(instruments.filter(isObservableInstrument));
		const idx = this._findBatchCallback(callback, observableInstruments);
		if (idx < 0) return;
		this._batchCallbacks.splice(idx, 1);
	}
	/**
	* @returns a promise of rejected reasons for invoking callbacks.
	*/
	async observe(collectionTime, timeoutMillis) {
		const callbackFutures = this._observeCallbacks(collectionTime, timeoutMillis);
		const batchCallbackFutures = this._observeBatchCallbacks(collectionTime, timeoutMillis);
		return (await Promise.allSettled([...callbackFutures, ...batchCallbackFutures])).filter((result) => result.status === "rejected").map((result) => result.reason);
	}
	_observeCallbacks(observationTime, timeoutMillis) {
		return this._callbacks.map(async ({ callback, instrument }) => {
			const observableResult = new ObservableResultImpl(instrument._descriptor.name, instrument._descriptor.valueType);
			let callPromise = Promise.resolve(callback(observableResult));
			if (timeoutMillis != null) callPromise = callWithTimeout(callPromise, timeoutMillis);
			await callPromise;
			instrument._metricStorages.forEach((metricStorage) => {
				metricStorage.record(observableResult._buffer, observationTime);
			});
		});
	}
	_observeBatchCallbacks(observationTime, timeoutMillis) {
		return this._batchCallbacks.map(async ({ callback, instruments }) => {
			const observableResult = new BatchObservableResultImpl();
			let callPromise = Promise.resolve(callback(observableResult));
			if (timeoutMillis != null) callPromise = callWithTimeout(callPromise, timeoutMillis);
			await callPromise;
			instruments.forEach((instrument) => {
				const buffer = observableResult._buffer.get(instrument);
				if (buffer == null) return;
				instrument._metricStorages.forEach((metricStorage) => {
					metricStorage.record(buffer, observationTime);
				});
			});
		});
	}
	_findCallback(callback, instrument) {
		return this._callbacks.findIndex((record) => {
			return record.callback === callback && record.instrument === instrument;
		});
	}
	_findBatchCallback(callback, instruments) {
		return this._batchCallbacks.findIndex((record) => {
			return record.callback === callback && setEquals(record.instruments, instruments);
		});
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/state/SyncMetricStorage.js
/**
* Internal interface.
*
* Stores and aggregates {@link MetricData} for synchronous instruments.
*/
var SyncMetricStorage = class extends MetricStorage {
	_aggregationCardinalityLimit;
	_deltaMetricStorage;
	_temporalMetricStorage;
	_attributesProcessor;
	constructor(instrumentDescriptor, aggregator, attributesProcessor, collectorHandles, aggregationCardinalityLimit) {
		super(instrumentDescriptor);
		this._aggregationCardinalityLimit = aggregationCardinalityLimit;
		this._deltaMetricStorage = new DeltaMetricProcessor(aggregator, this._aggregationCardinalityLimit);
		this._temporalMetricStorage = new TemporalMetricProcessor(aggregator, collectorHandles);
		this._attributesProcessor = attributesProcessor;
	}
	record(value, attributes, context, recordTime) {
		attributes = this._attributesProcessor.process(attributes, context);
		this._deltaMetricStorage.record(value, attributes, context, recordTime);
	}
	/**
	* Collects the metrics from this storage.
	*
	* Note: This is a stateful operation and may reset any interval-related
	* state for the MetricCollector.
	*/
	collect(collector, collectionTime) {
		const accumulations = this._deltaMetricStorage.collect();
		return this._temporalMetricStorage.buildMetrics(collector, this._instrumentDescriptor, accumulations, collectionTime);
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/view/AttributesProcessor.js
var NoopAttributesProcessor = class {
	process(incoming, _context) {
		return incoming;
	}
};
var MultiAttributesProcessor = class {
	_processors;
	constructor(processors) {
		this._processors = processors;
	}
	process(incoming, context) {
		let filteredAttributes = incoming;
		for (const processor of this._processors) filteredAttributes = processor.process(filteredAttributes, context);
		return filteredAttributes;
	}
};
/**
* @internal
*
* Create an {@link IAttributesProcessor} that acts as a simple pass-through for attributes.
*/
function createNoopAttributesProcessor() {
	return NOOP;
}
/**
* @internal
*
* Create an {@link IAttributesProcessor} that applies all processors from the provided list in order.
*
* @param processors Processors to apply in order.
*/
function createMultiAttributesProcessor(processors) {
	return new MultiAttributesProcessor(processors);
}
var NOOP = new NoopAttributesProcessor();
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/state/MeterSharedState.js
/**
* An internal record for shared meter provider states.
*/
var MeterSharedState = class {
	metricStorageRegistry = new MetricStorageRegistry();
	observableRegistry = new ObservableRegistry();
	meter;
	_meterProviderSharedState;
	_instrumentationScope;
	constructor(meterProviderSharedState, instrumentationScope) {
		this.meter = new Meter(this);
		this._meterProviderSharedState = meterProviderSharedState;
		this._instrumentationScope = instrumentationScope;
	}
	registerMetricStorage(descriptor) {
		const storages = this._registerMetricStorage(descriptor, SyncMetricStorage);
		if (storages.length === 1) return storages[0];
		return new MultiMetricStorage(storages);
	}
	registerAsyncMetricStorage(descriptor) {
		return this._registerMetricStorage(descriptor, AsyncMetricStorage);
	}
	/**
	* @param collector opaque handle of {@link MetricCollector} which initiated the collection.
	* @param collectionTime the HrTime at which the collection was initiated.
	* @param options options for collection.
	* @returns the list of metric data collected.
	*/
	async collect(collector, collectionTime, options) {
		/**
		* 1. Call all observable callbacks first.
		* 2. Collect metric result for the collector.
		*/
		const errors = await this.observableRegistry.observe(collectionTime, options?.timeoutMillis);
		const storages = this.metricStorageRegistry.getStorages(collector);
		if (storages.length === 0) return null;
		const metricDataList = [];
		storages.forEach((metricStorage) => {
			const metricData = metricStorage.collect(collector, collectionTime);
			if (metricData != null) metricDataList.push(metricData);
		});
		if (metricDataList.length === 0) return { errors };
		return {
			scopeMetrics: {
				scope: this._instrumentationScope,
				metrics: metricDataList
			},
			errors
		};
	}
	_registerMetricStorage(descriptor, MetricStorageType) {
		let storages = this._meterProviderSharedState.viewRegistry.findViews(descriptor, this._instrumentationScope).map((view) => {
			const viewDescriptor = createInstrumentDescriptorWithView(view, descriptor);
			const compatibleStorage = this.metricStorageRegistry.findOrUpdateCompatibleStorage(viewDescriptor);
			if (compatibleStorage != null) return compatibleStorage;
			const viewStorage = new MetricStorageType(viewDescriptor, view.aggregation.createAggregator(viewDescriptor), view.attributesProcessor, this._meterProviderSharedState.metricCollectors, view.aggregationCardinalityLimit);
			this.metricStorageRegistry.register(viewStorage);
			return viewStorage;
		});
		if (storages.length === 0) {
			const collectorStorages = this._meterProviderSharedState.selectAggregations(descriptor.type).map(([collector, aggregation]) => {
				const compatibleStorage = this.metricStorageRegistry.findOrUpdateCompatibleCollectorStorage(collector, descriptor);
				if (compatibleStorage != null) return compatibleStorage;
				const aggregator = aggregation.createAggregator(descriptor);
				const cardinalityLimit = collector.selectCardinalityLimit(descriptor.type);
				const storage = new MetricStorageType(descriptor, aggregator, createNoopAttributesProcessor(), [collector], cardinalityLimit);
				this.metricStorageRegistry.registerForCollector(collector, storage);
				return storage;
			});
			storages = storages.concat(collectorStorages);
		}
		return storages;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/state/MeterProviderSharedState.js
/**
* An internal record for shared meter provider states.
*/
var MeterProviderSharedState = class {
	viewRegistry = new ViewRegistry();
	metricCollectors = [];
	meterSharedStates = /* @__PURE__ */ new Map();
	resource;
	constructor(resource) {
		this.resource = resource;
	}
	getMeterSharedState(instrumentationScope) {
		const id = instrumentationScopeId(instrumentationScope);
		let meterSharedState = this.meterSharedStates.get(id);
		if (meterSharedState == null) {
			meterSharedState = new MeterSharedState(this, instrumentationScope);
			this.meterSharedStates.set(id, meterSharedState);
		}
		return meterSharedState;
	}
	selectAggregations(instrumentType) {
		const result = [];
		for (const collector of this.metricCollectors) result.push([collector, toAggregation(collector.selectAggregation(instrumentType))]);
		return result;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/state/MetricCollector.js
/**
* An internal opaque interface that the MetricReader receives as
* MetricProducer. It acts as the storage key to the internal metric stream
* state for each MetricReader.
*/
var MetricCollector = class {
	_sharedState;
	_metricReader;
	constructor(sharedState, metricReader) {
		this._sharedState = sharedState;
		this._metricReader = metricReader;
	}
	async collect(options) {
		const collectionTime = millisToHrTime(Date.now());
		const scopeMetrics = [];
		const errors = [];
		const meterCollectionPromises = Array.from(this._sharedState.meterSharedStates.values()).map(async (meterSharedState) => {
			const current = await meterSharedState.collect(this, collectionTime, options);
			if (current?.scopeMetrics != null) scopeMetrics.push(current.scopeMetrics);
			if (current?.errors != null) errors.push(...current.errors);
		});
		await Promise.all(meterCollectionPromises);
		return {
			resourceMetrics: {
				resource: this._sharedState.resource,
				scopeMetrics
			},
			errors
		};
	}
	/**
	* Delegates for MetricReader.forceFlush.
	*/
	async forceFlush(options) {
		await this._metricReader.forceFlush(options);
	}
	/**
	* Delegates for MetricReader.shutdown.
	*/
	async shutdown(options) {
		await this._metricReader.shutdown(options);
	}
	selectAggregationTemporality(instrumentType) {
		return this._metricReader.selectAggregationTemporality(instrumentType);
	}
	selectAggregation(instrumentType) {
		return this._metricReader.selectAggregation(instrumentType);
	}
	/**
	* Select the cardinality limit for the given {@link InstrumentType} for this
	* collector.
	*/
	selectCardinalityLimit(instrumentType) {
		return this._metricReader.selectCardinalityLimit?.(instrumentType) ?? 2e3;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/view/Predicate.js
var ESCAPE = /[\^$\\.+?()[\]{}|]/g;
/**
* Wildcard pattern predicate, supports patterns like `*`, `foo*`, `*bar`.
*/
var PatternPredicate = class PatternPredicate {
	_matchAll;
	_regexp;
	constructor(pattern) {
		if (pattern === "*") {
			this._matchAll = true;
			this._regexp = /.*/;
		} else {
			this._matchAll = false;
			this._regexp = new RegExp(PatternPredicate.escapePattern(pattern));
		}
	}
	match(str) {
		if (this._matchAll) return true;
		return this._regexp.test(str);
	}
	static escapePattern(pattern) {
		return `^${pattern.replace(ESCAPE, "\\$&").replace("*", ".*")}$`;
	}
	static hasWildcard(pattern) {
		return pattern.includes("*");
	}
};
var ExactPredicate = class {
	_matchAll;
	_pattern;
	constructor(pattern) {
		this._matchAll = pattern === void 0;
		this._pattern = pattern;
	}
	match(str) {
		if (this._matchAll) return true;
		if (str === this._pattern) return true;
		return false;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/view/InstrumentSelector.js
var InstrumentSelector = class {
	_nameFilter;
	_type;
	_unitFilter;
	constructor(criteria) {
		this._nameFilter = new PatternPredicate(criteria?.name ?? "*");
		this._type = criteria?.type;
		this._unitFilter = new ExactPredicate(criteria?.unit);
	}
	getType() {
		return this._type;
	}
	getNameFilter() {
		return this._nameFilter;
	}
	getUnitFilter() {
		return this._unitFilter;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/view/MeterSelector.js
var MeterSelector = class {
	_nameFilter;
	_versionFilter;
	_schemaUrlFilter;
	constructor(criteria) {
		this._nameFilter = new ExactPredicate(criteria?.name);
		this._versionFilter = new ExactPredicate(criteria?.version);
		this._schemaUrlFilter = new ExactPredicate(criteria?.schemaUrl);
	}
	getNameFilter() {
		return this._nameFilter;
	}
	/**
	* TODO: semver filter? no spec yet.
	*/
	getVersionFilter() {
		return this._versionFilter;
	}
	getSchemaUrlFilter() {
		return this._schemaUrlFilter;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/view/View.js
function isSelectorNotProvided(options) {
	return options.instrumentName == null && options.instrumentType == null && options.instrumentUnit == null && options.meterName == null && options.meterVersion == null && options.meterSchemaUrl == null;
}
function validateViewOptions(viewOptions) {
	if (isSelectorNotProvided(viewOptions)) throw new Error("Cannot create view with no selector arguments supplied");
	if (viewOptions.name != null && (viewOptions?.instrumentName == null || PatternPredicate.hasWildcard(viewOptions.instrumentName))) throw new Error("Views with a specified name must be declared with an instrument selector that selects at most one instrument per meter.");
}
/**
* Can be passed to a {@link MeterProvider} to select instruments and alter their metric stream.
*/
var View = class {
	name;
	description;
	aggregation;
	attributesProcessor;
	instrumentSelector;
	meterSelector;
	aggregationCardinalityLimit;
	/**
	* Create a new {@link View} instance.
	*
	* Parameters can be categorized as two types:
	*  Instrument selection criteria: Used to describe the instrument(s) this view will be applied to.
	*  Will be treated as additive (the Instrument has to meet all the provided criteria to be selected).
	*
	*  Metric stream altering: Alter the metric stream of instruments selected by instrument selection criteria.
	*
	* @param viewOptions {@link ViewOptions} for altering the metric stream and instrument selection.
	* @param viewOptions.name
	* Alters the metric stream:
	*  This will be used as the name of the metrics stream.
	*  If not provided, the original Instrument name will be used.
	* @param viewOptions.description
	* Alters the metric stream:
	*  This will be used as the description of the metrics stream.
	*  If not provided, the original Instrument description will be used by default.
	* @param viewOptions.attributesProcessors
	* Alters the metric stream:
	*  If provided, the attributes will be modified as defined by the added processors.
	*  If not provided, all attribute keys will be used by default.
	* @param viewOptions.aggregationCardinalityLimit
	* Alters the metric stream:
	*  Sets a limit on the number of unique attribute combinations (cardinality) that can be aggregated.
	*  If not provided, the default limit of 2000 will be used.
	* @param viewOptions.aggregation
	* Alters the metric stream:
	*  Alters the {@link Aggregation} of the metric stream.
	* @param viewOptions.instrumentName
	* Instrument selection criteria:
	*  Original name of the Instrument(s) with wildcard support.
	* @param viewOptions.instrumentType
	* Instrument selection criteria:
	*  The original type of the Instrument(s).
	* @param viewOptions.instrumentUnit
	* Instrument selection criteria:
	*  The unit of the Instrument(s).
	* @param viewOptions.meterName
	* Instrument selection criteria:
	*  The name of the Meter. No wildcard support, name must match the meter exactly.
	* @param viewOptions.meterVersion
	* Instrument selection criteria:
	*  The version of the Meter. No wildcard support, version must match exactly.
	* @param viewOptions.meterSchemaUrl
	* Instrument selection criteria:
	*  The schema URL of the Meter. No wildcard support, schema URL must match exactly.
	*
	* @example
	* // Create a view that changes the Instrument 'my.instrument' to use to an
	* // ExplicitBucketHistogramAggregation with the boundaries [20, 30, 40]
	* new View({
	*   aggregation: new ExplicitBucketHistogramAggregation([20, 30, 40]),
	*   instrumentName: 'my.instrument'
	* })
	*/
	constructor(viewOptions) {
		validateViewOptions(viewOptions);
		if (viewOptions.attributesProcessors != null) this.attributesProcessor = createMultiAttributesProcessor(viewOptions.attributesProcessors);
		else this.attributesProcessor = createNoopAttributesProcessor();
		this.name = viewOptions.name;
		this.description = viewOptions.description;
		this.aggregation = toAggregation(viewOptions.aggregation ?? { type: AggregationType.DEFAULT });
		this.instrumentSelector = new InstrumentSelector({
			name: viewOptions.instrumentName,
			type: viewOptions.instrumentType,
			unit: viewOptions.instrumentUnit
		});
		this.meterSelector = new MeterSelector({
			name: viewOptions.meterName,
			version: viewOptions.meterVersion,
			schemaUrl: viewOptions.meterSchemaUrl
		});
		this.aggregationCardinalityLimit = viewOptions.aggregationCardinalityLimit;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-metrics@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-metrics/build/esm/MeterProvider.js
/**
* This class implements the {@link MeterProvider} interface.
*/
var MeterProvider = class {
	_sharedState;
	_shutdown = false;
	constructor(options) {
		this._sharedState = new MeterProviderSharedState(options?.resource ?? defaultResource());
		if (options?.views != null && options.views.length > 0) for (const viewOption of options.views) this._sharedState.viewRegistry.addView(new View(viewOption));
		if (options?.readers != null && options.readers.length > 0) for (const metricReader of options.readers) {
			const collector = new MetricCollector(this._sharedState, metricReader);
			metricReader.setMetricProducer(collector);
			this._sharedState.metricCollectors.push(collector);
		}
	}
	/**
	* Get a meter with the configuration of the MeterProvider.
	*/
	getMeter(name, version = "", options = {}) {
		if (this._shutdown) {
			diag.warn("A shutdown MeterProvider cannot provide a Meter");
			return createNoopMeter();
		}
		return this._sharedState.getMeterSharedState({
			name,
			version,
			schemaUrl: options.schemaUrl
		}).meter;
	}
	/**
	* Shut down the MeterProvider and all registered
	* MetricReaders.
	*
	* Returns a promise which is resolved when all flushes are complete.
	*/
	async shutdown(options) {
		if (this._shutdown) {
			diag.warn("shutdown may only be called once per MeterProvider");
			return;
		}
		this._shutdown = true;
		await Promise.all(this._sharedState.metricCollectors.map((collector) => {
			return collector.shutdown(options);
		}));
	}
	/**
	* Notifies all registered MetricReaders to flush any buffered data.
	*
	* Returns a promise which is resolved when all flushes are complete.
	*/
	async forceFlush(options) {
		if (this._shutdown) {
			diag.warn("invalid attempt to force flush after MeterProvider shutdown");
			return;
		}
		await Promise.all(this._sharedState.metricCollectors.map((collector) => {
			return collector.forceFlush(options);
		}));
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-transformer@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-transformer/build/esm/common/internal.js
function createResource(resource, encoder) {
	const result = {
		attributes: toAttributes$1(resource.attributes, encoder),
		droppedAttributesCount: 0
	};
	const schemaUrl = resource.schemaUrl;
	if (schemaUrl && schemaUrl !== "") result.schemaUrl = schemaUrl;
	return result;
}
function createInstrumentationScope(scope) {
	return {
		name: scope.name,
		version: scope.version
	};
}
function toAttributes$1(attributes, encoder) {
	return Object.keys(attributes).map((key) => toKeyValue(key, attributes[key], encoder));
}
function toKeyValue(key, value, encoder) {
	return {
		key,
		value: toAnyValue$1(value, encoder)
	};
}
function toAnyValue$1(value, encoder) {
	const t = typeof value;
	if (t === "string") return { stringValue: value };
	if (t === "number") {
		if (!Number.isInteger(value)) return { doubleValue: value };
		return { intValue: value };
	}
	if (t === "boolean") return { boolValue: value };
	if (value instanceof Uint8Array) return { bytesValue: encoder.encodeUint8Array(value) };
	if (Array.isArray(value)) {
		const values = new Array(value.length);
		for (let i = 0; i < value.length; i++) values[i] = toAnyValue$1(value[i], encoder);
		return { arrayValue: { values } };
	}
	if (t === "object" && value != null) {
		const keys = Object.keys(value);
		const values = new Array(keys.length);
		for (let i = 0; i < keys.length; i++) values[i] = {
			key: keys[i],
			value: toAnyValue$1(value[keys[i]], encoder)
		};
		return { kvlistValue: { values } };
	}
	return {};
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-transformer@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-transformer/build/esm/logs/internal.js
function createExportLogsServiceRequest(logRecords, encoder) {
	return { resourceLogs: logRecordsToResourceLogs(logRecords, encoder) };
}
function createResourceMap$1(logRecords) {
	const resourceMap = /* @__PURE__ */ new Map();
	for (const record of logRecords) {
		const { resource, instrumentationScope: { name, version = "", schemaUrl = "" } } = record;
		let ismMap = resourceMap.get(resource);
		if (!ismMap) {
			ismMap = /* @__PURE__ */ new Map();
			resourceMap.set(resource, ismMap);
		}
		const ismKey = `${name}@${version}:${schemaUrl}`;
		let records = ismMap.get(ismKey);
		if (!records) {
			records = [];
			ismMap.set(ismKey, records);
		}
		records.push(record);
	}
	return resourceMap;
}
function logRecordsToResourceLogs(logRecords, encoder) {
	const resourceMap = createResourceMap$1(logRecords);
	return Array.from(resourceMap, ([resource, ismMap]) => {
		const processedResource = createResource(resource, encoder);
		return {
			resource: processedResource,
			scopeLogs: Array.from(ismMap, ([, scopeLogs]) => {
				return {
					scope: createInstrumentationScope(scopeLogs[0].instrumentationScope),
					logRecords: scopeLogs.map((log) => toLogRecord(log, encoder)),
					schemaUrl: scopeLogs[0].instrumentationScope.schemaUrl
				};
			}),
			schemaUrl: processedResource.schemaUrl
		};
	});
}
function toLogRecord(log, encoder) {
	return {
		timeUnixNano: encoder.encodeHrTime(log.hrTime),
		observedTimeUnixNano: encoder.encodeHrTime(log.hrTimeObserved),
		severityNumber: toSeverityNumber(log.severityNumber),
		severityText: log.severityText,
		body: toAnyValue$1(log.body, encoder),
		eventName: log.eventName,
		attributes: toLogAttributes(log.attributes, encoder),
		droppedAttributesCount: log.droppedAttributesCount,
		flags: log.spanContext?.traceFlags,
		traceId: encoder.encodeOptionalSpanContext(log.spanContext?.traceId),
		spanId: encoder.encodeOptionalSpanContext(log.spanContext?.spanId)
	};
}
function toSeverityNumber(severityNumber) {
	return severityNumber;
}
function toLogAttributes(attributes, encoder) {
	return Object.keys(attributes).map((key) => toKeyValue(key, attributes[key], encoder));
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-transformer@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-transformer/build/esm/common/utils.js
function hrTimeToNanos(hrTime) {
	const NANOSECONDS = BigInt(1e9);
	return BigInt(Math.trunc(hrTime[0])) * NANOSECONDS + BigInt(Math.trunc(hrTime[1]));
}
function encodeAsString(hrTime) {
	return hrTimeToNanos(hrTime).toString();
}
var encodeTimestamp = typeof BigInt !== "undefined" ? encodeAsString : hrTimeToNanoseconds;
function identity(value) {
	return value;
}
/**
* Encoder for JSON format.
* Uses string timestamps, hex for span/trace IDs, and base64 for Uint8Array.
*/
var JSON_ENCODER = {
	encodeHrTime: encodeTimestamp,
	encodeSpanContext: identity,
	encodeOptionalSpanContext: identity,
	encodeUint8Array: (bytes) => {
		if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
		const chars = new Array(bytes.length);
		for (let i = 0; i < bytes.length; i++) chars[i] = String.fromCharCode(bytes[i]);
		return btoa(chars.join(""));
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-transformer@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-transformer/build/esm/logs/json/logs.js
var JsonLogsSerializer = {
	serializeRequest: (arg) => {
		const request = createExportLogsServiceRequest(arg, JSON_ENCODER);
		return new TextEncoder().encode(JSON.stringify(request));
	},
	deserializeResponse: (arg) => {
		if (arg.length === 0) return {};
		const decoder = new TextDecoder();
		try {
			return JSON.parse(decoder.decode(arg));
		} catch (err) {
			diag.warn(`Failed to parse logs export response: ${err.message}. Returning empty response`);
			return {};
		}
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-transformer@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-transformer/build/esm/metrics/internal-types.js
/**
* AggregationTemporality defines how a metric aggregator reports aggregated
* values. It describes how those values relate to the time interval over
* which they are aggregated.
*/
var EAggregationTemporality;
(function(EAggregationTemporality) {
	EAggregationTemporality[EAggregationTemporality["AGGREGATION_TEMPORALITY_UNSPECIFIED"] = 0] = "AGGREGATION_TEMPORALITY_UNSPECIFIED";
	/** DELTA is an AggregationTemporality for a metric aggregator which reports
	changes since last report time. Successive metrics contain aggregation of
	values from continuous and non-overlapping intervals.
	
	The values for a DELTA metric are based only on the time interval
	associated with one measurement cycle. There is no dependency on
	previous measurements like is the case for CUMULATIVE metrics.
	
	For example, consider a system measuring the number of requests that
	it receives and reports the sum of these requests every second as a
	DELTA metric:
	
	1. The system starts receiving at time=t_0.
	2. A request is received, the system measures 1 request.
	3. A request is received, the system measures 1 request.
	4. A request is received, the system measures 1 request.
	5. The 1 second collection cycle ends. A metric is exported for the
	number of requests received over the interval of time t_0 to
	t_0+1 with a value of 3.
	6. A request is received, the system measures 1 request.
	7. A request is received, the system measures 1 request.
	8. The 1 second collection cycle ends. A metric is exported for the
	number of requests received over the interval of time t_0+1 to
	t_0+2 with a value of 2. */
	EAggregationTemporality[EAggregationTemporality["AGGREGATION_TEMPORALITY_DELTA"] = 1] = "AGGREGATION_TEMPORALITY_DELTA";
	/** CUMULATIVE is an AggregationTemporality for a metric aggregator which
	reports changes since a fixed start time. This means that current values
	of a CUMULATIVE metric depend on all previous measurements since the
	start time. Because of this, the sender is required to retain this state
	in some form. If this state is lost or invalidated, the CUMULATIVE metric
	values MUST be reset and a new fixed start time following the last
	reported measurement time sent MUST be used.
	
	For example, consider a system measuring the number of requests that
	it receives and reports the sum of these requests every second as a
	CUMULATIVE metric:
	
	1. The system starts receiving at time=t_0.
	2. A request is received, the system measures 1 request.
	3. A request is received, the system measures 1 request.
	4. A request is received, the system measures 1 request.
	5. The 1 second collection cycle ends. A metric is exported for the
	number of requests received over the interval of time t_0 to
	t_0+1 with a value of 3.
	6. A request is received, the system measures 1 request.
	7. A request is received, the system measures 1 request.
	8. The 1 second collection cycle ends. A metric is exported for the
	number of requests received over the interval of time t_0 to
	t_0+2 with a value of 5.
	9. The system experiences a fault and loses state.
	10. The system recovers and resumes receiving at time=t_1.
	11. A request is received, the system measures 1 request.
	12. The 1 second collection cycle ends. A metric is exported for the
	number of requests received over the interval of time t_1 to
	t_0+1 with a value of 1.
	
	Note: Even though, when reporting changes since last report time, using
	CUMULATIVE is valid, it is not recommended. This may cause problems for
	systems that do not use start_time to determine when the aggregation
	value was reset (e.g. Prometheus). */
	EAggregationTemporality[EAggregationTemporality["AGGREGATION_TEMPORALITY_CUMULATIVE"] = 2] = "AGGREGATION_TEMPORALITY_CUMULATIVE";
})(EAggregationTemporality || (EAggregationTemporality = {}));
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-transformer@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-transformer/build/esm/metrics/internal.js
function toResourceMetrics(resourceMetrics, encoder) {
	const processedResource = createResource(resourceMetrics.resource, encoder);
	return {
		resource: processedResource,
		schemaUrl: processedResource.schemaUrl,
		scopeMetrics: toScopeMetrics(resourceMetrics.scopeMetrics, encoder)
	};
}
function toScopeMetrics(scopeMetrics, encoder) {
	return Array.from(scopeMetrics.map((metrics) => ({
		scope: createInstrumentationScope(metrics.scope),
		metrics: metrics.metrics.map((metricData) => toMetric(metricData, encoder)),
		schemaUrl: metrics.scope.schemaUrl
	})));
}
function toMetric(metricData, encoder) {
	const out = {
		name: metricData.descriptor.name,
		description: metricData.descriptor.description,
		unit: metricData.descriptor.unit
	};
	const aggregationTemporality = toAggregationTemporality(metricData.aggregationTemporality);
	switch (metricData.dataPointType) {
		case DataPointType.SUM:
			out.sum = {
				aggregationTemporality,
				isMonotonic: metricData.isMonotonic,
				dataPoints: toSingularDataPoints(metricData, encoder)
			};
			break;
		case DataPointType.GAUGE:
			out.gauge = { dataPoints: toSingularDataPoints(metricData, encoder) };
			break;
		case DataPointType.HISTOGRAM:
			out.histogram = {
				aggregationTemporality,
				dataPoints: toHistogramDataPoints(metricData, encoder)
			};
			break;
		case DataPointType.EXPONENTIAL_HISTOGRAM:
			out.exponentialHistogram = {
				aggregationTemporality,
				dataPoints: toExponentialHistogramDataPoints(metricData, encoder)
			};
			break;
	}
	return out;
}
function toSingularDataPoint(dataPoint, valueType, encoder) {
	const out = {
		attributes: toAttributes$1(dataPoint.attributes, encoder),
		startTimeUnixNano: encoder.encodeHrTime(dataPoint.startTime),
		timeUnixNano: encoder.encodeHrTime(dataPoint.endTime)
	};
	switch (valueType) {
		case ValueType.INT:
			out.asInt = dataPoint.value;
			break;
		case ValueType.DOUBLE:
			out.asDouble = dataPoint.value;
			break;
	}
	return out;
}
function toSingularDataPoints(metricData, encoder) {
	return metricData.dataPoints.map((dataPoint) => {
		return toSingularDataPoint(dataPoint, metricData.descriptor.valueType, encoder);
	});
}
function toHistogramDataPoints(metricData, encoder) {
	return metricData.dataPoints.map((dataPoint) => {
		const histogram = dataPoint.value;
		return {
			attributes: toAttributes$1(dataPoint.attributes, encoder),
			bucketCounts: histogram.buckets.counts,
			explicitBounds: histogram.buckets.boundaries,
			count: histogram.count,
			sum: histogram.sum,
			min: histogram.min,
			max: histogram.max,
			startTimeUnixNano: encoder.encodeHrTime(dataPoint.startTime),
			timeUnixNano: encoder.encodeHrTime(dataPoint.endTime)
		};
	});
}
function toExponentialHistogramDataPoints(metricData, encoder) {
	return metricData.dataPoints.map((dataPoint) => {
		const histogram = dataPoint.value;
		return {
			attributes: toAttributes$1(dataPoint.attributes, encoder),
			count: histogram.count,
			min: histogram.min,
			max: histogram.max,
			sum: histogram.sum,
			positive: {
				offset: histogram.positive.offset,
				bucketCounts: histogram.positive.bucketCounts
			},
			negative: {
				offset: histogram.negative.offset,
				bucketCounts: histogram.negative.bucketCounts
			},
			scale: histogram.scale,
			zeroCount: histogram.zeroCount,
			startTimeUnixNano: encoder.encodeHrTime(dataPoint.startTime),
			timeUnixNano: encoder.encodeHrTime(dataPoint.endTime)
		};
	});
}
function toAggregationTemporality(temporality) {
	switch (temporality) {
		case AggregationTemporality.DELTA: return EAggregationTemporality.AGGREGATION_TEMPORALITY_DELTA;
		case AggregationTemporality.CUMULATIVE: return EAggregationTemporality.AGGREGATION_TEMPORALITY_CUMULATIVE;
	}
}
function createExportMetricsServiceRequest(resourceMetrics, encoder) {
	return { resourceMetrics: resourceMetrics.map((metrics) => toResourceMetrics(metrics, encoder)) };
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-transformer@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-transformer/build/esm/metrics/json/metrics.js
var JsonMetricsSerializer = {
	serializeRequest: (arg) => {
		const request = createExportMetricsServiceRequest([arg], JSON_ENCODER);
		return new TextEncoder().encode(JSON.stringify(request));
	},
	deserializeResponse: (arg) => {
		if (arg.length === 0) return {};
		const decoder = new TextDecoder();
		try {
			return JSON.parse(decoder.decode(arg));
		} catch (err) {
			diag.warn(`Failed to parse metrics export response: ${err.message}. Returning empty response`);
			return {};
		}
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-transformer@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-transformer/build/esm/trace/internal.js
var SPAN_FLAGS_CONTEXT_HAS_IS_REMOTE_MASK = 256;
var SPAN_FLAGS_CONTEXT_IS_REMOTE_MASK = 512;
/**
* Builds the 32-bit span flags value combining the low 8-bit W3C TraceFlags
* with the HAS_IS_REMOTE and IS_REMOTE bits according to the OTLP spec.
*/
function buildSpanFlagsFrom(traceFlags, isRemote) {
	let flags = traceFlags & 255 | SPAN_FLAGS_CONTEXT_HAS_IS_REMOTE_MASK;
	if (isRemote) flags |= SPAN_FLAGS_CONTEXT_IS_REMOTE_MASK;
	return flags;
}
function sdkSpanToOtlpSpan(span, encoder) {
	const ctx = span.spanContext();
	const status = span.status;
	const parentSpanId = span.parentSpanContext?.spanId ? encoder.encodeSpanContext(span.parentSpanContext?.spanId) : void 0;
	return {
		traceId: encoder.encodeSpanContext(ctx.traceId),
		spanId: encoder.encodeSpanContext(ctx.spanId),
		parentSpanId,
		traceState: ctx.traceState?.serialize(),
		name: span.name,
		kind: span.kind == null ? 0 : span.kind + 1,
		startTimeUnixNano: encoder.encodeHrTime(span.startTime),
		endTimeUnixNano: encoder.encodeHrTime(span.endTime),
		attributes: toAttributes$1(span.attributes, encoder),
		droppedAttributesCount: span.droppedAttributesCount,
		events: span.events.map((event) => toOtlpSpanEvent(event, encoder)),
		droppedEventsCount: span.droppedEventsCount,
		status: {
			code: status.code,
			message: status.message
		},
		links: span.links.map((link) => toOtlpLink(link, encoder)),
		droppedLinksCount: span.droppedLinksCount,
		flags: buildSpanFlagsFrom(ctx.traceFlags, span.parentSpanContext?.isRemote)
	};
}
function toOtlpLink(link, encoder) {
	return {
		attributes: link.attributes ? toAttributes$1(link.attributes, encoder) : [],
		spanId: encoder.encodeSpanContext(link.context.spanId),
		traceId: encoder.encodeSpanContext(link.context.traceId),
		traceState: link.context.traceState?.serialize(),
		droppedAttributesCount: link.droppedAttributesCount || 0,
		flags: buildSpanFlagsFrom(link.context.traceFlags, link.context.isRemote)
	};
}
function toOtlpSpanEvent(timedEvent, encoder) {
	return {
		attributes: timedEvent.attributes ? toAttributes$1(timedEvent.attributes, encoder) : [],
		name: timedEvent.name,
		timeUnixNano: encoder.encodeHrTime(timedEvent.time),
		droppedAttributesCount: timedEvent.droppedAttributesCount || 0
	};
}
function createExportTraceServiceRequest(spans, encoder) {
	return { resourceSpans: spanRecordsToResourceSpans(spans, encoder) };
}
function createResourceMap(readableSpans) {
	const resourceMap = /* @__PURE__ */ new Map();
	for (const record of readableSpans) {
		let ilsMap = resourceMap.get(record.resource);
		if (!ilsMap) {
			ilsMap = /* @__PURE__ */ new Map();
			resourceMap.set(record.resource, ilsMap);
		}
		const instrumentationScopeKey = `${record.instrumentationScope.name}@${record.instrumentationScope.version || ""}:${record.instrumentationScope.schemaUrl || ""}`;
		let records = ilsMap.get(instrumentationScopeKey);
		if (!records) {
			records = [];
			ilsMap.set(instrumentationScopeKey, records);
		}
		records.push(record);
	}
	return resourceMap;
}
function spanRecordsToResourceSpans(readableSpans, encoder) {
	const resourceMap = createResourceMap(readableSpans);
	const out = [];
	const entryIterator = resourceMap.entries();
	let entry = entryIterator.next();
	while (!entry.done) {
		const [resource, ilmMap] = entry.value;
		const scopeResourceSpans = [];
		const ilmIterator = ilmMap.values();
		let ilmEntry = ilmIterator.next();
		while (!ilmEntry.done) {
			const scopeSpans = ilmEntry.value;
			if (scopeSpans.length > 0) {
				const spans = scopeSpans.map((readableSpan) => sdkSpanToOtlpSpan(readableSpan, encoder));
				scopeResourceSpans.push({
					scope: createInstrumentationScope(scopeSpans[0].instrumentationScope),
					spans,
					schemaUrl: scopeSpans[0].instrumentationScope.schemaUrl
				});
			}
			ilmEntry = ilmIterator.next();
		}
		const processedResource = createResource(resource, encoder);
		out.push({
			resource: processedResource,
			scopeSpans: scopeResourceSpans,
			schemaUrl: processedResource.schemaUrl
		});
		entry = entryIterator.next();
	}
	return out;
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-transformer@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-transformer/build/esm/trace/json/trace.js
var JsonTraceSerializer = {
	serializeRequest: (arg) => {
		const request = createExportTraceServiceRequest(arg, JSON_ENCODER);
		return new TextEncoder().encode(JSON.stringify(request));
	},
	deserializeResponse: (arg) => {
		if (arg.length === 0) return {};
		const decoder = new TextDecoder();
		try {
			return JSON.parse(decoder.decode(arg));
		} catch (err) {
			diag.warn(`Failed to parse trace export response: ${err.message}. Returning empty response`);
			return {};
		}
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-exporter-base/build/esm/retrying-transport.js
var MAX_ATTEMPTS = 5;
var INITIAL_BACKOFF = 1e3;
var MAX_BACKOFF = 5e3;
var BACKOFF_MULTIPLIER = 1.5;
var JITTER = .2;
/**
* Get a pseudo-random jitter that falls in the range of [-JITTER, +JITTER]
*/
function getJitter() {
	return Math.random() * (2 * JITTER) - JITTER;
}
var RetryingTransport = class {
	_transport;
	constructor(transport) {
		this._transport = transport;
	}
	retry(data, timeoutMillis, inMillis) {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				this._transport.send(data, timeoutMillis).then(resolve, reject);
			}, inMillis);
		});
	}
	async send(data, timeoutMillis) {
		let attempts = MAX_ATTEMPTS;
		let nextBackoff = INITIAL_BACKOFF;
		const deadline = Date.now() + timeoutMillis;
		let result = await this._transport.send(data, timeoutMillis);
		while (result.status === "retryable" && attempts > 0) {
			attempts--;
			const backoff = Math.max(Math.min(nextBackoff * (1 + getJitter()), MAX_BACKOFF), 0);
			nextBackoff = nextBackoff * BACKOFF_MULTIPLIER;
			const retryInMillis = result.retryInMillis ?? backoff;
			const remainingTimeoutMillis = deadline - Date.now();
			if (retryInMillis > remainingTimeoutMillis) {
				diag.info(`Export retry time ${Math.round(retryInMillis)}ms exceeds remaining timeout ${Math.round(remainingTimeoutMillis)}ms, not retrying further.`);
				return result;
			}
			diag.verbose(`Scheduling export retry in ${Math.round(retryInMillis)}ms`);
			result = await this.retry(data, remainingTimeoutMillis, retryInMillis);
		}
		if (result.status === "success") diag.verbose(`Export succeeded after ${MAX_ATTEMPTS - attempts} retry attempts.`);
		else if (result.status === "retryable") diag.info(`Export failed after maximum retry attempts (${MAX_ATTEMPTS}).`);
		else diag.info(`Export failed with non-retryable error: ${result.error}`);
		return result;
	}
	shutdown() {
		return this._transport.shutdown();
	}
};
/**
* Creates an Exporter Transport that retries on 'retryable' response.
*/
function createRetryingTransport(options) {
	return new RetryingTransport(options.transport);
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-exporter-base/build/esm/is-export-retryable.js
function isExportHTTPErrorRetryable(statusCode) {
	return statusCode === 429 || statusCode === 502 || statusCode === 503 || statusCode === 504;
}
function parseRetryAfterToMills(retryAfter) {
	if (retryAfter == null) return;
	const seconds = Number.parseInt(retryAfter, 10);
	if (Number.isInteger(seconds)) return seconds > 0 ? seconds * 1e3 : -1;
	const delay = new Date(retryAfter).getTime() - Date.now();
	if (delay >= 0) return delay;
	return 0;
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-exporter-base/build/esm/transport/fetch-transport.js
/**
* Maximum total body size for concurrent keepalive requests.
* Browsers enforce a 64KiB cumulative limit across all pending keepalive requests.
* We use 60KB to leave headroom for headers.
* @see https://github.com/whatwg/fetch/issues/679
* @see https://blog.huli.tw/2025/01/06/en/navigator-sendbeacon-64kib-and-source-code/
*/
var MAX_KEEPALIVE_BODY_SIZE = 60 * 1024;
/**
* Maximum concurrent keepalive requests.
* Chrome enforces 9 concurrent keepalive fetch requests per renderer process.
* @see https://github.com/whatwg/fetch/issues/679
* Quote: "If the renderer process is processing more than 9 requests with keepalive set, we reject a new request"
*/
var MAX_KEEPALIVE_REQUESTS = 9;
/**
* Track cumulative pending body size across all in-flight keepalive requests.
* This is necessary because the 64KiB limit is cumulative, not per-request.
*/
var pendingBodySize = 0;
/**
* Track number of pending keepalive requests.
*/
var pendingKeepaliveCount = 0;
var FetchTransport = class {
	_parameters;
	constructor(parameters) {
		this._parameters = parameters;
	}
	async send(data, timeoutMillis) {
		const abortController = new AbortController();
		const timeout = setTimeout(() => abortController.abort(), timeoutMillis);
		let fetchApi = globalThis.fetch;
		if (typeof fetchApi.__original === "function") fetchApi = fetchApi.__original;
		const requestSize = data.byteLength;
		const wouldExceedSize = pendingBodySize + requestSize > MAX_KEEPALIVE_BODY_SIZE;
		const useKeepalive = !wouldExceedSize && !(pendingKeepaliveCount >= MAX_KEEPALIVE_REQUESTS);
		if (useKeepalive) {
			pendingBodySize += requestSize;
			pendingKeepaliveCount++;
		} else {
			const reason = wouldExceedSize ? "size limit" : "count limit";
			diag.debug(`keepalive disabled: ${(requestSize / 1024).toFixed(1)}KB payload, ${pendingKeepaliveCount} pending (${reason})`);
		}
		try {
			const url = new URL(this._parameters.url);
			const response = await fetchApi(url.href, {
				method: "POST",
				headers: await this._parameters.headers(),
				body: data,
				signal: abortController.signal,
				keepalive: useKeepalive,
				mode: globalThis.location ? globalThis.location.origin === url.origin ? "same-origin" : "cors" : "no-cors"
			});
			if (response.status >= 200 && response.status <= 299) {
				diag.debug(`export response success (status: ${response.status})`);
				return { status: "success" };
			} else if (isExportHTTPErrorRetryable(response.status)) {
				diag.warn(`export response retryable (status: ${response.status})`);
				return {
					status: "retryable",
					retryInMillis: parseRetryAfterToMills(response.headers.get("Retry-After"))
				};
			}
			diag.error(`export response failure (status: ${response.status})`);
			return {
				status: "failure",
				error: /* @__PURE__ */ new Error(`Fetch request failed with non-retryable status ${response.status}`)
			};
		} catch (error) {
			if (isFetchNetworkErrorRetryable(error)) {
				diag.warn(`export request retryable (network error: ${error})`);
				return {
					status: "retryable",
					error: new Error("Fetch request encountered a network error", { cause: error })
				};
			}
			diag.error(`export request failure (error: ${error})`);
			return {
				status: "failure",
				error: new Error("Fetch request errored", { cause: error })
			};
		} finally {
			clearTimeout(timeout);
			if (useKeepalive) {
				pendingBodySize -= requestSize;
				pendingKeepaliveCount--;
			}
		}
	}
	shutdown() {}
};
/**
* Creates an exporter transport that uses `fetch` to send the data
* @param parameters applied to each request made by transport
*/
function createFetchTransport(parameters) {
	return new FetchTransport(parameters);
}
function isFetchNetworkErrorRetryable(error) {
	return error instanceof TypeError && !error.cause;
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-exporter-base/build/esm/otlp-browser-http-export-delegate.js
function createOtlpFetchExportDelegate(options, serializer) {
	return createOtlpNetworkExportDelegate(options, serializer, createRetryingTransport({ transport: createFetchTransport(options) }));
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-exporter-base/build/esm/util.js
/**
* Parses headers from config leaving only those that have defined values
* @param partialHeaders
*/
function validateAndNormalizeHeaders(partialHeaders) {
	const headers = {};
	Object.entries(partialHeaders ?? {}).forEach(([key, value]) => {
		if (typeof value !== "undefined") headers[key] = String(value);
		else diag.warn(`Header "${key}" has invalid value (${value}) and will be ignored`);
	});
	return headers;
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-exporter-base/build/esm/configuration/otlp-http-configuration.js
function mergeHeaders(userProvidedHeaders, fallbackHeaders, defaultHeaders) {
	return async () => {
		const requiredHeaders = { ...await defaultHeaders() };
		const headers = {};
		if (fallbackHeaders != null) Object.assign(headers, await fallbackHeaders());
		if (userProvidedHeaders != null) Object.assign(headers, validateAndNormalizeHeaders(await userProvidedHeaders()));
		return Object.assign(headers, requiredHeaders);
	};
}
function validateUserProvidedUrl(url) {
	if (url == null) return;
	try {
		const base = globalThis.location?.href;
		return new URL(url, base).href;
	} catch {
		throw new Error(`Configuration: Could not parse user-provided export URL: '${url}'`);
	}
}
/**
* @param userProvidedConfiguration  Configuration options provided by the user in code.
* @param fallbackConfiguration Fallback to use when the {@link userProvidedConfiguration} does not specify an option.
* @param defaultConfiguration The defaults as defined by the exporter specification
*/
function mergeOtlpHttpConfigurationWithDefaults(userProvidedConfiguration, fallbackConfiguration, defaultConfiguration) {
	return {
		...mergeOtlpSharedConfigurationWithDefaults(userProvidedConfiguration, fallbackConfiguration, defaultConfiguration),
		headers: mergeHeaders(userProvidedConfiguration.headers, fallbackConfiguration.headers, defaultConfiguration.headers),
		url: validateUserProvidedUrl(userProvidedConfiguration.url) ?? fallbackConfiguration.url ?? defaultConfiguration.url
	};
}
function getHttpConfigurationDefaults(requiredHeaders, signalResourcePath) {
	return {
		...getSharedConfigurationDefaults(),
		headers: async () => requiredHeaders,
		url: "http://localhost:4318/" + signalResourcePath
	};
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-exporter-base/build/esm/configuration/convert-legacy-http-options.js
function convertLegacyHeaders(config) {
	if (typeof config.headers === "function") return config.headers;
	return wrapStaticHeadersInFunction(config.headers);
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-exporter-base/build/esm/configuration/convert-legacy-browser-http-options.js
/**
* @deprecated this will be removed in 2.0
*
* @param config
* @param signalResourcePath
* @param requiredHeaders
*/
function convertLegacyBrowserHttpOptions(config, signalResourcePath, requiredHeaders) {
	return mergeOtlpHttpConfigurationWithDefaults({
		url: config.url,
		timeoutMillis: config.timeoutMillis,
		headers: convertLegacyHeaders(config),
		concurrencyLimit: config.concurrencyLimit
	}, {}, getHttpConfigurationDefaults(requiredHeaders, signalResourcePath));
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+otlp-exporter-base@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/otlp-exporter-base/build/esm/configuration/create-legacy-browser-delegate.js
/**
* @deprecated
* @param config
* @param serializer
* @param signalResourcePath
* @param requiredHeaders
*/
function createLegacyOtlpBrowserExportDelegate(config, serializer, signalResourcePath, requiredHeaders) {
	return createOtlpFetchExportDelegate(convertLegacyBrowserHttpOptions(config, signalResourcePath, requiredHeaders), serializer);
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+exporter-logs-otlp-http@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/exporter-logs-otlp-http/build/esm/platform/browser/OTLPLogExporter.js
/**
* Collector Logs Exporter for Web
*/
var OTLPLogExporter = class extends OTLPExporterBase {
	constructor(config = {}) {
		super(createLegacyOtlpBrowserExportDelegate(config, JsonLogsSerializer, "v1/logs", { "Content-Type": "application/json" }));
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+exporter-metrics-otlp-http@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/exporter-metrics-otlp-http/build/esm/OTLPMetricExporterOptions.js
var AggregationTemporalityPreference;
(function(AggregationTemporalityPreference) {
	AggregationTemporalityPreference[AggregationTemporalityPreference["DELTA"] = 0] = "DELTA";
	AggregationTemporalityPreference[AggregationTemporalityPreference["CUMULATIVE"] = 1] = "CUMULATIVE";
	AggregationTemporalityPreference[AggregationTemporalityPreference["LOWMEMORY"] = 2] = "LOWMEMORY";
})(AggregationTemporalityPreference || (AggregationTemporalityPreference = {}));
//#endregion
//#region node_modules/.pnpm/@opentelemetry+exporter-metrics-otlp-http@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/exporter-metrics-otlp-http/build/esm/OTLPMetricExporterBase.js
var CumulativeTemporalitySelector = () => AggregationTemporality.CUMULATIVE;
var DeltaTemporalitySelector = (instrumentType) => {
	switch (instrumentType) {
		case InstrumentType.COUNTER:
		case InstrumentType.OBSERVABLE_COUNTER:
		case InstrumentType.GAUGE:
		case InstrumentType.HISTOGRAM:
		case InstrumentType.OBSERVABLE_GAUGE: return AggregationTemporality.DELTA;
		case InstrumentType.UP_DOWN_COUNTER:
		case InstrumentType.OBSERVABLE_UP_DOWN_COUNTER: return AggregationTemporality.CUMULATIVE;
	}
};
var LowMemoryTemporalitySelector = (instrumentType) => {
	switch (instrumentType) {
		case InstrumentType.COUNTER:
		case InstrumentType.HISTOGRAM: return AggregationTemporality.DELTA;
		case InstrumentType.GAUGE:
		case InstrumentType.UP_DOWN_COUNTER:
		case InstrumentType.OBSERVABLE_UP_DOWN_COUNTER:
		case InstrumentType.OBSERVABLE_COUNTER:
		case InstrumentType.OBSERVABLE_GAUGE: return AggregationTemporality.CUMULATIVE;
	}
};
function chooseTemporalitySelectorFromEnvironment() {
	"cumulative".toLowerCase();
	return CumulativeTemporalitySelector;
}
function chooseTemporalitySelector(temporalityPreference) {
	if (temporalityPreference != null) {
		if (temporalityPreference === AggregationTemporalityPreference.DELTA) return DeltaTemporalitySelector;
		else if (temporalityPreference === AggregationTemporalityPreference.LOWMEMORY) return LowMemoryTemporalitySelector;
		return CumulativeTemporalitySelector;
	}
	return chooseTemporalitySelectorFromEnvironment();
}
var DEFAULT_AGGREGATION = Object.freeze({ type: AggregationType.DEFAULT });
function chooseAggregationSelector(config) {
	return config?.aggregationPreference ?? (() => DEFAULT_AGGREGATION);
}
var OTLPMetricExporterBase = class extends OTLPExporterBase {
	_aggregationTemporalitySelector;
	_aggregationSelector;
	constructor(delegate, config) {
		super(delegate);
		this._aggregationSelector = chooseAggregationSelector(config);
		this._aggregationTemporalitySelector = chooseTemporalitySelector(config?.temporalityPreference);
	}
	selectAggregation(instrumentType) {
		return this._aggregationSelector(instrumentType);
	}
	selectAggregationTemporality(instrumentType) {
		return this._aggregationTemporalitySelector(instrumentType);
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+exporter-metrics-otlp-http@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/exporter-metrics-otlp-http/build/esm/platform/browser/OTLPMetricExporter.js
/**
* Collector Metric Exporter for Web
*/
var OTLPMetricExporter = class extends OTLPMetricExporterBase {
	constructor(config) {
		super(createLegacyOtlpBrowserExportDelegate(config ?? {}, JsonMetricsSerializer, "v1/metrics", { "Content-Type": "application/json" }), config);
	}
};
//#endregion
//#region utils/otel-identity.ts
var sdkPackage = "spatius-web-sdk";
var injectedSdkVersion = null;
/**
* 声明本次上报的归属身份。
*
* 与 Android `AvatarSDK.inject` 同语义:两个字段各自独立生效,只传其一时另一个
* 保持原值。版本覆盖的是 Resource 上的 `sdk.version`(scope 上的版本号另有来源,
* 不受影响)。
*
* @param identity - `sdkPackage` 形如 `spatius-web-rtc`;`sdkVersion` 为该包
*   自身的版本。空值忽略,避免误清成空字符串后整批记录失去归属。
* @internal
*/
function setSdkIdentity(identity) {
	if (identity.sdkPackage) sdkPackage = identity.sdkPackage;
	if (identity.sdkVersion) injectedSdkVersion = identity.sdkVersion;
}
/** 当前归属包名,供各通道构建 Resource 时读取。@internal */
function getSdkPackage() {
	return sdkPackage;
}
/**
* Resource 上应上报的版本号。
*
* @param hostVersion - 主库自己的版本,未被上层 SDK 声明时用它。
* @internal
*/
function resolveSdkVersion(hostVersion) {
	return injectedSdkVersion ?? hostVersion;
}
//#endregion
//#region utils/otel-metrics.ts
/**
* OpenTelemetry Metrics Tracker (Browser Version)
*
* 独立于 logs 通道的 OTel **Metric 信号**上报（OTLP `/v1/metrics`），目标后端 OpenObserve。
* 与 logs（otel-tracker.ts）分离：各自 provider、各自 exporter、各自失败/清理。
*
* 用途：SDK 的**数值度量**（延迟、帧率、卡顿时长/次数等）走真正的 Metric 信号，
* 由 OpenObserve/Grafana 聚合出 P95/均值/SLO。日志类事件仍走 logs 通道（otel-tracker）。
*
* 全部记录为 **Histogram**：单数值 + 低基数标签。高基数字段（conversation_id / avatar_id）
* 不得作标签（基数爆炸），明细留在对应的 log 事件里。
* @internal
*/
var OTEL_METER_NAME = "spatius-avatarkit";
/** OTel HTTP client duration 指标名。 */
var HTTP_CLIENT_DURATION_METRIC = "http.client.request.duration";
/**
* Network profile 桶（**毫秒**）。后台整个 metrics 体系用 ms，且 OpenObserve 存不进浮点数
* （浮点 duration 会被后端拒/丢），因此值与桶统一用整数毫秒，不用浮点秒。
* 桶经后台确认调整：去掉 100ms 以下分级（网络 rt 极少落在此区、无区分价值），
* 并在 1000~5000ms 高区段加密（2000/3000/4000）以便看清慢请求分布。（与 android/iOS 一致。）
*
* 5 秒之上再加 10/30/60/120 秒：这是所有 HTTP 请求共用的一条 metric（靠 operation
* 标签区分），其中 `/assets/template` 是几十 MB 的大文件下载，实测约三成样本超过
* 5 秒——原先全部挤进 +Inf，是 6 秒还是 60 秒完全看不出来。前段分档不变，API 请求
* 的分辨率不受影响。
*/
var HTTP_NETWORK_BUCKETS_MS = [
	100,
	200,
	500,
	1e3,
	2e3,
	3e3,
	4e3,
	5e3,
	1e4,
	3e4,
	6e4,
	12e4
];
/**
* 播放指标的桶。默认桶（0/5/10/25/50/…/10000）对这批指标毫无分辨率：
* 帧率只可能落在 0~25，缺帧数和卡顿次数几乎全部挤在第一个桶里，分位数因此毫无意义。
* 桶按各指标的实际值域给：
*
* - 帧率：每帧一个桶。25fps 与 21fps 的观感差别正是要看的，5 档分级会把两者归成一类。
* - 帧数：正常轮次对应播放时长桶、没上屏的帧对应卡顿时长桶，都按帧间隔换算。
* - 卡顿次数：数的是次数不是帧，自成一组。
* - 百分比：每 5% 一档，0~100。
* - 时长：分两组——整轮播放是秒级，单次卡顿是一帧起步的毫秒级。
* - 延迟：音频送入是等距（要看偏离整秒多少），动画到达是等比（两种用法差一个数量级）。
* - GPU 耗时：个位数毫秒，按帧预算设档。
*
* 本 SDK 与 @spatius/avatarkit-rtc（meter 名 spatius-avatarkit-rtc）两边的指标都在这里配：
* view 只能配在创建 MeterProvider 的这一侧，rtc 那批虽由另一个包发出，桶定义也得留在此处。
* 同名概念两边共用一组桶，好让两条链路的分布能直接叠着比。
*/
/**
* 上界给到 30 而非 25：25fps 是目标帧率，正常轮次全落在那一档，若把它当上界，
* 每一轮健康播放都会挤进 +Inf 溢出桶，与真正超发的异常轮次混在一起，
* 这条 metric 就只剩「是否达标」这一个比特的信息。25 单独成档、上面再留几格，
* 达标与超发才分得开。
*/
var RTC_FPS_BUCKETS = [
	0,
	1,
	2,
	3,
	4,
	5,
	6,
	7,
	8,
	9,
	10,
	11,
	12,
	13,
	14,
	15,
	16,
	17,
	18,
	19,
	20,
	21,
	22,
	23,
	24,
	25,
	26,
	27,
	28,
	30
];
/**
* 一轮播出的帧数。档位是播放时长桶除以帧间隔（40ms），和时长视角一一对应：
* 「播了 10s」与「播了 250 帧」落在同一档。
*/
var RTC_FRAME_COUNT_BUCKETS = [
	0,
	50,
	125,
	250,
	375,
	500,
	750,
	1500
];
/**
* 没能上屏的帧数（丢失/跳过/丢弃/过渡缺帧）：与正常帧数差一个数量级，
* 共用一组桶会让它们全挤在低位。档位是卡顿时长桶除以帧间隔（40ms），
* 于是「卡了 320ms」和「丢了 8 帧」落在同一档，两个视角能直接对上。
*/
var RTC_LOST_FRAME_BUCKETS = [
	0,
	1,
	2,
	4,
	8,
	16,
	32,
	64,
	128,
	256
];
/**
* 一轮里卡顿发生的次数。数的是次数不是帧，上面那套按帧间隔换算的档位对它没有意义。
* 低位逐个分档、高位翻倍：一轮几次和一轮几十次是两种情况，都要看得出来。
* 实测慢网络下一轮 35 次，因此高位必须留到三位数。
*/
var RTC_STALL_COUNT_BUCKETS = [
	0,
	1,
	2,
	3,
	4,
	5,
	10,
	20,
	40,
	80,
	160,
	320
];
var RTC_PERCENT_BUCKETS = [
	0,
	5,
	10,
	15,
	20,
	25,
	30,
	35,
	40,
	45,
	50,
	55,
	60,
	65,
	70,
	75,
	80,
	85,
	90,
	95,
	100
];
/** 一轮播放的时长，秒级量级。 */
var RTC_PLAYBACK_DURATION_BUCKETS_MS = [
	0,
	2e3,
	5e3,
	1e4,
	15e3,
	2e4,
	3e4,
	6e4
];
/**
* 卡顿时长：一帧（40ms）起步逐档翻倍到 10240ms。用播放时长那组秒级的桶，
* 绝大多数卡顿会挤进第一格。
*/
var RTC_STALL_DURATION_BUCKETS_MS = [
	0,
	40,
	80,
	160,
	320,
	640,
	1280,
	2560,
	5120,
	10240
];
/**
* 音频送入节奏：tap_N 是第 N 秒音频送入的时刻，metric 记的是相对首包（tap_0）的累计 Δ。
* 流式输入下 tap_1/2/4 天然聚在 1000/2000/4000 附近，偏离多少正是要看的——喂得比实时慢，
* 后台就攒不够音频、推理迟迟不触发。等距 200ms 让这三个中心各自落在档位边界上，
* 偏移一两档就能读出来；等比会把它们挤进同一格。
*
* 上界 6000 而非 4000：4000 是 tap_4 的理想值，拿理想值当上界，正常轮次会全部挤进
* +Inf 溢出桶，与真正喂得慢的轮次混在一起。
*/
var AUDIO_LATENCY_BUCKETS_MS = [
	0,
	200,
	400,
	600,
	800,
	1e3,
	1200,
	1400,
	1600,
	1800,
	2e3,
	2200,
	2400,
	2600,
	2800,
	3e3,
	3200,
	3400,
	3600,
	3800,
	4e3,
	4200,
	4400,
	4600,
	4800,
	5e3,
	5200,
	5400,
	5600,
	5800,
	6e3
];
/**
* 动画包到达：anim_N 是第 N 组动画包到达的时刻（同样相对 tap_0 的累计 Δ）。
* 后台攒够音频（2s/4s/4s）就推理下发，所以这个值等于「攒音频的等待 + 推理 + 网络下行」，
* 与播放进度无关：一次性灌入 10s 预制音频，三个包会连着回来，全落在低位；实时流式喂，
* 则要等音频攒够，anim_2 可以到十几秒。两种用法差一个数量级，同一个直方图要都装得下，
* 因此用等比而非等距——低位密到看清推理耗时，高位疏到兜住慢速流式。
*
* 200ms 起步：网络下行本身就要这个量级，再往下细分没有意义。
*/
var ANIM_LATENCY_BUCKETS_MS = [
	0,
	200,
	400,
	800,
	1600,
	3200,
	6400,
	12800,
	25600
];
/**
* 单帧 GPU 渲染耗时。实测中低端机器可以到 30ms 上下，因此值域按机型跨度给到 100ms，
* 每 5ms 一档——而不是只覆盖高端机那几毫秒。40ms 是一帧的总预算，越过就意味着 GPU
* 单独一项已经吃满整帧；再往上到 100ms 是给最差的机型留的观测空间。
*
* webgl 没有可移植的 GPU timer，取不到样本，那几轮整条 metric 不发（见 AvatarController），
* 所以这里的分布只含 webgpu 的真实数据，不会被一堆 0 压在第一格。
*/
var GPU_RENDER_BUCKETS_MS = [
	5,
	10,
	15,
	20,
	25,
	30,
	35,
	40,
	45,
	50,
	55,
	60,
	65,
	70,
	75,
	80,
	85,
	90,
	95,
	100
];
/** metric 名 → 桶，供下面的 views 展开。 */
var BUCKET_PROFILES = [
	["playback_avg_fps", RTC_FPS_BUCKETS],
	["playback_duration_ms", RTC_PLAYBACK_DURATION_BUCKETS_MS],
	["playback_audio_duration_ms", RTC_PLAYBACK_DURATION_BUCKETS_MS],
	["playback_animation_frame_count", RTC_FRAME_COUNT_BUCKETS],
	["playback_jank_frame_count", RTC_LOST_FRAME_BUCKETS],
	["playback_stall_count", RTC_STALL_COUNT_BUCKETS],
	["playback_stall_max_ms", RTC_STALL_DURATION_BUCKETS_MS],
	["playback_stall_total_ms", RTC_STALL_DURATION_BUCKETS_MS],
	["playback_audio_stall_count", RTC_STALL_COUNT_BUCKETS],
	["playback_audio_stall_max_ms", RTC_STALL_DURATION_BUCKETS_MS],
	["playback_audio_stall_total_ms", RTC_STALL_DURATION_BUCKETS_MS],
	["playback_gpu_render_p50_ms", GPU_RENDER_BUCKETS_MS],
	["playback_gpu_render_p90_ms", GPU_RENDER_BUCKETS_MS],
	["playback_gpu_render_p95_ms", GPU_RENDER_BUCKETS_MS],
	["playback_latency_tap_1_ms", AUDIO_LATENCY_BUCKETS_MS],
	["playback_latency_tap_2_ms", AUDIO_LATENCY_BUCKETS_MS],
	["playback_latency_tap_4_ms", AUDIO_LATENCY_BUCKETS_MS],
	["playback_latency_anim_0_ms", ANIM_LATENCY_BUCKETS_MS],
	["playback_latency_anim_1_ms", ANIM_LATENCY_BUCKETS_MS],
	["playback_latency_anim_2_ms", ANIM_LATENCY_BUCKETS_MS],
	["template_resources_load_measure", [
		1e3,
		1e4,
		2e4,
		3e4,
		6e4,
		12e4
	]],
	["rtc_playback_avg_fps", RTC_FPS_BUCKETS],
	["rtc_playback_frame_count", RTC_FRAME_COUNT_BUCKETS],
	["rtc_playback_skipped_frames", RTC_LOST_FRAME_BUCKETS],
	["rtc_playback_tail_discarded", RTC_LOST_FRAME_BUCKETS],
	["rtc_playback_stall_count", RTC_STALL_COUNT_BUCKETS],
	["rtc_playback_start_transition_missing", RTC_LOST_FRAME_BUCKETS],
	["rtc_playback_end_transition_missing", RTC_LOST_FRAME_BUCKETS],
	["rtc_playback_skip_rate_pct", RTC_PERCENT_BUCKETS],
	["rtc_playback_stall_rate_pct", RTC_PERCENT_BUCKETS],
	["rtc_playback_duration_ms", RTC_PLAYBACK_DURATION_BUCKETS_MS],
	["rtc_playback_stall_total_ms", RTC_STALL_DURATION_BUCKETS_MS],
	["rtc_playback_stall_max_ms", RTC_STALL_DURATION_BUCKETS_MS],
	["rtc_transport_packets_lost", RTC_LOST_FRAME_BUCKETS],
	["rtc_transport_packets_recovered", RTC_LOST_FRAME_BUCKETS],
	["rtc_transport_packets_dropped", RTC_LOST_FRAME_BUCKETS],
	["rtc_transport_packets_out_of_order", RTC_LOST_FRAME_BUCKETS],
	["rtc_transport_rtp_packets_lost", RTC_LOST_FRAME_BUCKETS],
	["rtc_transport_rtp_loss_rate_pct", RTC_PERCENT_BUCKETS],
	["rtc_transport_rtt_ms", [
		10,
		20,
		30,
		40,
		50,
		75,
		100,
		150,
		200,
		300,
		400,
		600,
		800,
		1e3
	]],
	["rtc_transport_jitter_ms", [
		1,
		2,
		3,
		5,
		8,
		12,
		16,
		20,
		25,
		30,
		40,
		60,
		80,
		120,
		200
	]]
];
var METRIC_EXPORT_INTERVAL_MS = 1e4;
var sdkVersion$3 = "1.0.0";
var isInitialized$3 = false;
var meterProvider = null;
var histograms = /* @__PURE__ */ new Map();
/**
* Initialize OTel MeterProvider.
* 与 initializeOtel（logs）平行：同一份 resource 语义、同一套门禁与鉴权。
* @internal
*/
function initializeOtelMetrics(version, resourceAttrs) {
	if (isInitialized$3) {
		logger.log("[OTel-Metrics] Already initialized, skipping");
		return;
	}
	sdkVersion$3 = version;
	try {
		meterProvider = new MeterProvider({
			resource: resourceFromAttributes({
				[ATTR_SERVICE_NAME]: "avatarkit",
				"sdk.version": resolveSdkVersion(sdkVersion$3),
				"sdk.platform": "web",
				"sdk.package": getSdkPackage(),
				"render_sdk_version": sdkVersion$3,
				"app_id": resourceAttrs.appId || "",
				"region": resourceAttrs.region,
				"dsm": resourceAttrs.dsm
			}),
			readers: [new PeriodicExportingMetricReader({
				exporter: observeExporter(new OTLPMetricExporter({
					url: OTEL_METRICS_ENDPOINT,
					headers: {},
					temporalityPreference: AggregationTemporality.DELTA
				}), "/v1/metrics", OTEL_METRICS_ENDPOINT),
				exportIntervalMillis: METRIC_EXPORT_INTERVAL_MS
			})],
			views: [{
				instrumentName: HTTP_CLIENT_DURATION_METRIC,
				aggregation: {
					type: AggregationType.EXPLICIT_BUCKET_HISTOGRAM,
					options: { boundaries: HTTP_NETWORK_BUCKETS_MS }
				}
			}, ...BUCKET_PROFILES.map(([instrumentName, boundaries]) => ({
				instrumentName,
				aggregation: {
					type: AggregationType.EXPLICIT_BUCKET_HISTOGRAM,
					options: { boundaries: [...boundaries] }
				}
			}))]
		});
		metrics.setGlobalMeterProvider(meterProvider);
		isInitialized$3 = true;
		logger.log(`[OTel-Metrics] Initialized - endpoint: ${OTEL_METRICS_ENDPOINT}`);
	} catch (error) {
		logger.warn("[OTel-Metrics] Failed to initialize:", error instanceof Error ? error.message : String(error));
	}
}
/**
* 懒取/建一个 Histogram。name 即 metric 名（如 `fetch_avatar_latency`）。
*/
function getHistogram(name) {
	if (!meterProvider) return null;
	let h = histograms.get(name);
	if (!h) {
		h = metrics.getMeter(OTEL_METER_NAME, sdkVersion$3).createHistogram(name);
		histograms.set(name, h);
	}
	return h;
}
/**
* 本周期内是否写入过**业务** metric。
*
* 观测遥测通道自身的那条记录（http.client.request.duration 的 /v1/* operation）有意
* 不弄脏它：那条记录本身产生于「导出」这个动作，若也算数，就成了
* 导出 → 写入 → 下周期非空 → 又导出 → 又写入 的永动机，用户什么都不做也每 10s 发一包。
*
* 只有真实业务 metric 才把它置真；metrics 导出前若为假就整轮跳过，观测记录攒着等下一趟
* 真有业务数据的车捎走。
*/
var hasBusinessMetric = false;
/** 供导出侧读取并复位。@internal */
function takeBusinessMetricFlag() {
	const v = hasBusinessMetric;
	hasBusinessMetric = false;
	return v;
}
/**
* 记录一个 metric 数据点（Histogram）。
* @param name metric 名
* @param value 数值（延迟 ms / 帧率 / 时长 / 次数 / 比率等）
* @param attributes 低基数标签（dsm / is_fallback / renderer_backend / region 等）。
*                   **不要**传高基数字段（conversation_id / avatar_id）——基数爆炸。
* @internal
*/
function recordMetric(name, value, attributes = {}) {
	if (!Number.isFinite(value)) return;
	const h = getHistogram(name);
	if (!h) return;
	try {
		if (name !== HTTP_CLIENT_DURATION_METRIC || !String(attributes.operation ?? "").startsWith("/v1/")) hasBusinessMetric = true;
		h.record(value, attributes);
	} catch (error) {
		logger.warn(`[OTel-Metrics] Failed to record ${name}:`, error instanceof Error ? error.message : String(error));
	}
}
/**
* 记录一次 HTTP client 请求的 duration（OTel 官方 `http.client.request.duration`，秒单位、
* Network profile 桶）。对齐公司级 Transaction 标准：只带低基数维度，成功判定由状态码统一裁定。
*
* @param operation  低基数 operation（URL template / 显式业务动作，如 `/bootstrap`、`/v2/avatar/{id}`）。
*                   **绝不传原始 URL / 真实 id**；不可用时传 `_OTHER`。
* @param method     HTTP 方法（GET/POST…）。
* @param durationMs 请求耗时（**整数毫秒**；调用方传入前已 Math.round，避免浮点上报失败）。
* @param statusCode HTTP 响应状态码；transport error（无响应）传 undefined。
* @param serverAddress 目标 host（低基数，如 global.spatialwalk.top）。
* @internal
*/
function recordHttpClientDuration(params) {
	const { operation, method, durationMs, statusCode, serverAddress } = params;
	const attrs = {
		"http.request.method": method,
		"operation": operation || "_OTHER"
	};
	if (serverAddress) attrs["server.address"] = serverAddress;
	if (typeof statusCode === "number") attrs["http.response.status_code"] = statusCode;
	else attrs["error.type"] = "transport_error";
	recordMetric(HTTP_CLIENT_DURATION_METRIC, durationMs, attrs);
}
/**
* Cleanup：flush 剩余 metric 并关闭 provider。
* @internal
*/
function cleanupOtelMetrics() {
	if (!isInitialized$3 || !meterProvider) return;
	try {
		meterProvider.forceFlush().catch(() => {});
		meterProvider.shutdown().catch((error) => {
			logger.warn("[OTel-Metrics] Shutdown error:", error instanceof Error ? error.message : String(error));
		});
	} catch (error) {
		logger.warn("[OTel-Metrics] Failed to cleanup:", error instanceof Error ? error.message : String(error));
	} finally {
		isInitialized$3 = false;
		meterProvider = null;
		histograms.clear();
	}
}
//#endregion
//#region utils/otel-export-observer.ts
/**
* 遥测通道自身的送达可观测性 —— 给 OTLP 导出请求做 Transaction 上报。
*
* 三条通道（logs / metrics / traces）此前把导出结果直接透传给 BatchProcessor 就丢了：
* 导出批量失败（网络、CDN 缓存、鉴权、后端 5xx）在后台侧只表现为「某个 app_id 数据变少」，
* 分不清是真没数据还是上报挂了。之前 EdgeOne 边缘缓存无 ACAO 头导致 CORS 全挂就是这类。
*
* 复用业务请求那套 `http.client.request.duration`（同 metric 名、同 Network profile 桶、
* 同成败判定），只是新增 operation 取值。后台不必为此建新看板。
*
* ## 自举局限（务必知悉）
*
* 这条上报**走的正是它要观测的通道**，所以：
* - 通道整体挂掉时，这条 metric 同样发不出去 —— 覆盖不了「全挂」场景。全挂在后台侧的
*   表现是该 app_id 数据整体消失，那本身才是信号。
* - 真正能观测到的是**部分失败**（三条通道各自独立 exporter，logs 挂了 metrics 可能还通）
*   与**间歇失败**（断续失败后恢复，失败计数随下一批发出）。
*
* ## 记录时机：暂存，等下一次导出搭车
*
* 导出结束时**不直接写 histogram**，只记进内存里的 pending 列表；等下一次导出发生时，
* 才在其**开始**把 pending 写进 histogram。
*
* 这样做是为了让 metrics 通道自己也能被观测。直接写会形成自反馈：metrics 的导出由
* `PeriodicExportingMetricReader` 周期驱动，写入产生数据点 → 下周期必须导出 → 导出
* 又写入 —— 空闲时也永不静默。改成暂存后，**写入本身不触发任何导出**，只是等下一次
* 本来就要发生的导出把它带走，环就断了。
*
* 代价是延迟一个周期：reader 先 `collect()` 快照、再 `_export()` 发送（见
* PeriodicExportingMetricReader 的 _runOnce），所以在导出时写入必然错过本轮快照，
* 数据落在下一轮。对成功率这种趋势指标，慢一个周期无妨。
*
* 副作用是最后一批 pending 会随页面关闭丢失（进程结束，没有"下一次导出"）。同样可接受：
* 丢的是最后 10s 的成功率样本，不是业务数据。
*
* @internal
*/
/**
* 已完成但尚未写进 histogram 的导出结果。上限用于兜底：正常情况下每个周期都会被
* 排空，只有在「导出彻底停止但仍有 record 进来」这类异常下才会堆积。
*/
var pending = [];
var PENDING_LIMIT = 256;
/** 暂存一次 OTLP 导出的结果，等下一次导出搭车写入（见文件头「记录时机」）。 */
function enqueueExportResult(p) {
	if (pending.length >= PENDING_LIMIT) pending.shift();
	pending.push(p);
}
/**
* 把暂存的导出结果写进 histogram。在**导出开始时**调用：此时 reader 已完成本轮
* collect 快照，写入的数据会随下一轮发出。
*/
function flushPendingExports() {
	if (pending.length === 0) return;
	const batch = pending.splice(0, pending.length);
	for (const p of batch) recordHttpClientDuration({
		operation: p.channel,
		method: "POST",
		durationMs: p.durationMs,
		statusCode: p.success ? 200 : void 0,
		serverAddress: p.serverAddress
	});
}
/** 从 OTLP endpoint URL 取 host（低基数），取不到时退回 `_OTHER`。 */
function hostOf(endpoint) {
	try {
		return new URL(endpoint).host;
	} catch {
		return "_OTHER";
	}
}
/**
* 给任意 OTLP exporter 包一层导出结果观测。原样透传参数与 callback，只在 callback
* 回来时把结果暂存 —— 不改变导出行为，也不吞异常。
*/
function observeExporter(inner, channel, endpoint) {
	const serverAddress = hostOf(endpoint);
	const wrapped = new Proxy(inner, { get(target, prop, receiver) {
		if (prop === "export") return observedExport;
		const value = Reflect.get(target, prop, receiver);
		return typeof value === "function" ? value.bind(target) : value;
	} });
	const observedExport = function(items, resultCallback) {
		try {
			flushPendingExports();
		} catch {}
		if (channel === "/v1/metrics" && !takeBusinessMetricFlag()) {
			resultCallback({ code: 0 });
			return;
		}
		const startMs = Date.now();
		inner.export(items, (result) => {
			try {
				enqueueExportResult({
					channel,
					durationMs: Math.round(Date.now() - startMs),
					success: result.code === 0,
					serverAddress
				});
			} catch {}
			resultCallback(result);
		});
	};
	return wrapped;
}
//#endregion
//#region utils/event-store.ts
/**
* Event Store - Persistent buffer for OTel telemetry events.
*
* Each emitted event is written here before being handed to the OTel
* BatchProcessor. When the wrapper exporter picks a batch up for HTTP
* upload it deletes those records — so anything still here on next
* startup is unsent and gets re-emitted (replay).
*
* Schema is intentionally minimal: no status / retry_count. A record's
* presence in the store means "not yet handed to inner.export".
* @internal
*/
var DB_NAME = "avatarkit_events";
var STORE_NAME = "events";
var DB_VERSION = 1;
var EventStore = class {
	db = null;
	initPromise = null;
	initialize() {
		if (this.db) return Promise.resolve();
		if (this.initPromise) return this.initPromise;
		this.initPromise = new Promise((resolve, reject) => {
			const req = indexedDB.open(DB_NAME, DB_VERSION);
			req.onerror = () => reject(/* @__PURE__ */ new Error("Failed to open avatarkit_events"));
			req.onsuccess = () => {
				this.db = req.result;
				resolve();
			};
			req.onupgradeneeded = (e) => {
				const db = e.target.result;
				if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME, {
					keyPath: "id",
					autoIncrement: true
				});
			};
		});
		return this.initPromise;
	}
	/**
	* Append a record, returning the auto-generated id.
	* Caller must use this id as the `_index` attribute when emitting to OTel.
	*/
	async add(record) {
		if (!this.db) await this.initialize();
		if (!this.db) throw new Error("event-store not available");
		return new Promise((resolve, reject) => {
			const req = this.db.transaction([STORE_NAME], "readwrite").objectStore(STORE_NAME).add(record);
			req.onsuccess = () => resolve(req.result);
			req.onerror = () => reject(/* @__PURE__ */ new Error("event-store add failed"));
		});
	}
	/**
	* Atomically: for each id, check whether it still exists in the store;
	* if so, delete it and include it in the returned set. Used by the
	* wrapper exporter to claim ownership of a batch — only records the
	* caller successfully "took" should be forwarded to inner.export.
	*
	* This is the multi-tab dedup mechanism: when Tab B starts and replays
	* records that Tab A also still has in memory, only one tab will win
	* the take and actually send.
	*
	* The get + delete pair runs inside a single readwrite transaction so
	* concurrent tabs see consistent state.
	*/
	async takeIfExists(ids) {
		const taken = /* @__PURE__ */ new Set();
		if (ids.length === 0) return taken;
		if (!this.db) await this.initialize();
		if (!this.db) return taken;
		return new Promise((resolve) => {
			const tx = this.db.transaction([STORE_NAME], "readwrite");
			const store = tx.objectStore(STORE_NAME);
			let pending = ids.length;
			const finish = () => {
				if (--pending === 0) resolve(taken);
			};
			for (const id of ids) {
				const req = store.get(id);
				req.onsuccess = () => {
					if (req.result !== void 0) {
						taken.add(id);
						store.delete(id);
					}
					finish();
				};
				req.onerror = () => finish();
			}
			tx.onerror = () => {
				logger.warn("[event-store] takeIfExists tx failed");
				resolve(taken);
			};
		});
	}
	/**
	* Return all stored records. Used on startup to replay anything left
	* over from a previous (possibly crashed) session.
	*/
	async getAll() {
		if (!this.db) await this.initialize();
		if (!this.db) return [];
		return new Promise((resolve) => {
			const req = this.db.transaction([STORE_NAME], "readonly").objectStore(STORE_NAME).getAll();
			req.onsuccess = () => resolve(req.result || []);
			req.onerror = () => {
				logger.warn("[event-store] getAll failed");
				resolve([]);
			};
		});
	}
};
var eventStore = new EventStore();
//#endregion
//#region utils/bootstrap.ts
/**
* Bootstrap 全球接入入口
*
* 单一出处：SDK 启动调用的全球调度接口，一次请求同时返回
* 接入 region（区域自动调度）与 time_sync（服务端时间校准）。
*
* 时钟校准（clock-sync）和 region 解析（region-resolver）各自按需调用本函数，
* 互不耦合——校准需要多次采样 + 周期重校，region 只需一次。
*
* @internal
*/
/** bootstrap 全球入口 */
var BOOTSTRAP_URL = "https://global.spatialwalk.top/bootstrap";
/** bootstrap 的低基数 operation / host（http.client.request.duration 维度）。 */
var BOOTSTRAP_OPERATION = "/bootstrap";
var BOOTSTRAP_HOST = "global.spatialwalk.top";
/**
* 发一次 bootstrap 请求。
*
* 不带 Content-Type 头：让请求保持"简单请求"，避免触发 CORS 预检
* （bootstrap 预检响应未放行 content-type 头）。body 仍是 JSON 字符串。
*
* @param opts 请求上下文
* @param signal 可选 AbortSignal（超时/取消）
* @param onResponse 响应头到达、body 解析之前的回调。时钟校准用它取 RTT 终点——
*   JSON 解析耗时必须排除在网络往返之外，否则 RTT 系统性偏大。
* @returns 解析后的响应；网络错/非 2xx/解析失败均抛出。
* @internal
*/
async function fetchBootstrap(opts, signal, onResponse) {
	const startMs = performance.now();
	let res;
	try {
		res = await fetch(BOOTSTRAP_URL, {
			method: "POST",
			body: JSON.stringify({
				app_id: opts.appId,
				sdk_version: opts.sdkVersion,
				region: opts.region ?? "auto",
				platform: opts.platform ?? "web"
			}),
			cache: "no-store",
			signal
		});
	} catch (e) {
		recordHttpClientDuration({
			operation: BOOTSTRAP_OPERATION,
			method: "POST",
			durationMs: Math.round(performance.now() - startMs),
			serverAddress: BOOTSTRAP_HOST
		});
		throw e;
	}
	recordHttpClientDuration({
		operation: BOOTSTRAP_OPERATION,
		method: "POST",
		durationMs: Math.round(performance.now() - startMs),
		statusCode: res.status,
		serverAddress: BOOTSTRAP_HOST
	});
	onResponse?.();
	if (!res.ok) throw new Error(`bootstrap HTTP ${res.status}`);
	return await res.json();
}
//#endregion
//#region utils/clock-sync.ts
/**
* Clock Sync (Browser)
*
* 时钟管理器：维护"本地基准"和"后台基准"两个绝对时间锚点，校准时一起刷新，
* 对外提供 localNow() / serverNow() 两个读数（= 基准 + 单调流逝）。
*
* - 本地时间戳字段（原有）：改用 localNow()，不再直接读 Date.now()。
* - 后台时间戳字段（新增）：serverNow()，未校准到后台时返回 null（上报留空）。
*
* 时间源：全球接入 bootstrap 接口的 time_sync（server_receive_ms / server_send_ms），
* 用 Cristian 四时间戳法估算后台基准（扣掉服务端内部处理耗时）。
*
* @internal
*/
/** 单次采样超时 */
var PROBE_TIMEOUT_MS = 5e3;
/** 采样次数（取 RTT 最小的一次，降低网络抖动误差） */
var SAMPLE_COUNT = 3;
/** 定时重校准间隔：20 分钟 */
var RECALIBRATE_INTERVAL_MS = 1200 * 1e3;
var ClockSync = class {
	localBase = Date.now();
	serverBase = null;
	monoAtCalibrate = performance.now();
	/** 首次校准是否已落定（落定前埋点应挂队列） */
	calibrated = false;
	appId = "";
	sdkVersion = "";
	platform = "web";
	timer = null;
	visibilityHandler = null;
	syncing = false;
	/** 首次校准落定后触发的回调（供上报层 flush 挂起队列） */
	readyCallbacks = [];
	/** 首次校准是否已完成（供上报闸门判断） */
	isReady() {
		return this.calibrated;
	}
	/**
	* 注册"首次校准落定"回调（成功或失败都算落定）。
	* 若已落定则立即同步触发一次。
	*/
	onReady(cb) {
		if (this.calibrated) {
			cb();
			return;
		}
		this.readyCallbacks.push(cb);
	}
	fireReady() {
		const cbs = this.readyCallbacks;
		this.readyCallbacks = [];
		for (const cb of cbs) try {
			cb();
		} catch {}
	}
	/** 本地时间戳：本地基准 + 单调流逝。一定有值。 */
	localNow() {
		return this.localAt(performance.now());
	}
	/** 后台时间戳：后台基准 + 单调流逝。未校准到后台时返回 null（上报留空）。 */
	serverNow() {
		return this.serverAt(performance.now());
	}
	/**
	* 仅供单测：直接设定基准，绕过真实网络校准。
	* @internal
	*/
	__setBaselineForTest(opts) {
		this.localBase = opts.localBase;
		this.serverBase = opts.serverBase;
		this.monoAtCalibrate = opts.monoAtCalibrate;
		this.calibrated = opts.calibrated ?? true;
	}
	/** 用"指定单调读数"算本地时间戳（供入队事件按入队时刻还原）。取整到毫秒。 */
	localAt(mono) {
		return Math.round(this.localBase + (mono - this.monoAtCalibrate));
	}
	/** 用"指定单调读数"算后台时间戳；未校准到后台时返回 null。取整到毫秒。 */
	serverAt(mono) {
		if (this.serverBase === null) return null;
		return Math.round(this.serverBase + (mono - this.monoAtCalibrate));
	}
	/**
	* 用时间戳做逻辑（端到端延迟 tap_N/anim_N 等）时用：优先后台时间戳，
	* 拿不到后台才退本地，保证与后台时刻同一时间线对齐。
	*/
	timelineNow() {
		return this.serverNow() ?? this.localNow();
	}
	/**
	* 把"采集时刻的单调读数"换算成时间线时刻（优先后台、退本地）。
	* 供标记解析用——采集时若校准未完成，先记单调读数，上报时再用最新基准换算。
	* @param mono 采集那一刻的 performance.now()
	*/
	resolveMono(mono) {
		const drift = mono - this.monoAtCalibrate;
		const base = this.serverBase ?? this.localBase;
		return Math.round(base + drift);
	}
	/**
	* 启动：立即校准一次，并注册定时 + 页面可见性重校准。
	* 幂等；fire-and-forget，不阻塞初始化。
	* @internal
	*/
	start(opts) {
		this.appId = opts.appId;
		this.sdkVersion = opts.sdkVersion;
		this.calibrate();
		if (this.timer === null) this.timer = setInterval(() => void this.calibrate(), RECALIBRATE_INTERVAL_MS);
		if (this.visibilityHandler === null && typeof document !== "undefined") {
			this.visibilityHandler = () => {
				if (document.visibilityState === "visible") this.calibrate();
			};
			document.addEventListener("visibilitychange", this.visibilityHandler);
		}
	}
	/**
	* 校准一次：多采样取最小 RTT 的样本，同时刷新本地/后台基准与单调零点。
	* - 拿到后台：serverBase 更新为估算值。
	* - 拿不到后台：serverBase 置空（后台时间戳留空），localBase 照常更新为当前墙钟。
	* 已校准过后若本次全失败：保留旧基准、跳过（不把好基准换成更差的）。
	* @internal
	*/
	async calibrate() {
		if (this.syncing) return;
		this.syncing = true;
		try {
			const samples = [];
			for (let i = 0; i < SAMPLE_COUNT; i++) {
				const s = await this.probe();
				if (s) samples.push(s);
			}
			if (samples.length > 0) {
				const best = samples.reduce((a, b) => b.rttNet < a.rttNet ? b : a);
				const firstCalibration = !this.calibrated;
				this.serverBase = best.serverBase;
				this.localBase = best.localBase;
				this.monoAtCalibrate = best.monoAtCalibrate;
				this.calibrated = true;
				if (firstCalibration) this.fireReady();
				logMetric("time_calibrated", Math.round(best.rttNet), { has_server: true });
				return;
			}
			if (this.calibrated) {
				logger.log("[ClockSync] recalibrate got no server time, keeping previous baseline");
				return;
			}
			this.localBase = Date.now();
			this.monoAtCalibrate = performance.now();
			this.serverBase = null;
			this.calibrated = true;
			this.fireReady();
			logEvent("time_calibrated", "info", { has_server: false });
		} finally {
			this.syncing = false;
		}
	}
	/** 单次采样：请求 bootstrap，返回一组 (rttNet, serverBase, monoAtCalibrate, localBase)；失败返回 null。 */
	async probe() {
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
		try {
			let t1 = 0;
			let localAtT1 = 0;
			const t0 = performance.now();
			const ts = (await fetchBootstrap({
				appId: this.appId,
				sdkVersion: this.sdkVersion,
				region: "auto",
				platform: this.platform
			}, controller.signal, () => {
				t1 = performance.now();
				localAtT1 = Date.now();
			}))?.time_sync;
			if (!ts || typeof ts.server_receive_ms !== "number" || typeof ts.server_send_ms !== "number") return null;
			const rttNet = t1 - t0 - (ts.server_send_ms - ts.server_receive_ms);
			const serverBase = ts.server_send_ms + rttNet / 2;
			return {
				rttNet: Math.max(0, rttNet),
				serverBase,
				monoAtCalibrate: t1,
				localBase: localAtT1
			};
		} catch {
			return null;
		} finally {
			clearTimeout(timer);
		}
	}
	/** 清理定时器与监听器。 */
	cleanup() {
		if (this.timer !== null) {
			clearInterval(this.timer);
			this.timer = null;
		}
		if (this.visibilityHandler !== null && typeof document !== "undefined") {
			document.removeEventListener("visibilitychange", this.visibilityHandler);
			this.visibilityHandler = null;
		}
	}
};
var clockSync = new ClockSync();
//#endregion
//#region utils/report-marks.ts
/**
* Report Marks（上报占位标记）
*
* 有些上报字段的最终值在"采集时刻"还算不出来（典型：时间戳，采集时时钟可能还没
* 校准完成）。这时采集端存一个**标记对象**占位，真正上报那一刻再统一解析成实际值。
*
* 目前只有一种标记：`mono`（单调读数 → 时间线时刻），但结构上可扩展更多标记类型，
* 解析逻辑（resolveMarks）共用。
*
* @internal
*/
/** 标记对象的判别字段 */
var MARK_KEY = "__mark";
/**
* 造一个"单调读数时间戳"标记：采集那一刻记下 performance.now()，
* 上报时由 resolveMarks 换算成时间线时刻（优先后台时间戳、退本地）。
* @internal
*/
function monoTimestamp() {
	return {
		[MARK_KEY]: "mono",
		value: performance.now()
	};
}
/**
* 把**已经取好**的 `performance.now()` 读数包成 MonoMark。
*
* 用于时刻不在当前线程/当前时机产生的场景：Opus 编解码在 Worker 里逐包打点，那些
* 时刻随结果回传后才到主线程手上，不能用 `monoTimestamp()` 重新取（那会变成
* 「整批结果回来」的时刻，把逐包的时间分布抹平）。
*
* ⚠️ 传进来的值必须已换算到**主线程**的 `performance.now()` 轴上。Worker 有自己的
* time origin，直接回传它的 `performance.now()` 会得到负的 dur_ms（实测 -8292）；
* 各 worker 均以 `timeOrigin + now()` 发绝对时刻，由 proxy 减去主线程 timeOrigin。
*/
function monoMarkFrom(value) {
	return {
		[MARK_KEY]: "mono",
		value
	};
}
function isMark(v) {
	return typeof v === "object" && v !== null && MARK_KEY in v;
}
function resolveMark(mark) {
	switch (mark[MARK_KEY]) {
		case "mono": return clockSync.resolveMono(mark.value);
	}
}
/**
* 递归遍历 contents，把其中的标记对象解析成实际值；非标记字段原样保留。
* 上报前调用一次。支持嵌套对象与数组（如 playback_quality.latency 内的 tap/anim 标记）；
* 无标记时原对象直接返回（零拷贝），有标记时只拷贝命中的层。
* @internal
*/
function resolveMarks(contents) {
	return resolveValue(contents);
}
function resolveValue(value) {
	if (isMark(value)) return resolveMark(value);
	if (Array.isArray(value)) {
		let out = null;
		for (let i = 0; i < value.length; i++) {
			const resolved = resolveValue(value[i]);
			if (resolved !== value[i]) {
				if (!out) out = [...value];
				out[i] = resolved;
			}
		}
		return out ?? value;
	}
	if (typeof value === "object" && value !== null) {
		const obj = value;
		let out = null;
		for (const [k, v] of Object.entries(obj)) {
			const resolved = resolveValue(v);
			if (resolved !== v) {
				if (!out) out = { ...obj };
				out[k] = resolved;
			}
		}
		return out ?? value;
	}
	return value;
}
//#endregion
//#region utils/otel-tracker.ts
/**
* OpenTelemetry Logs Tracker (Browser Version)
*
* 独立于 PostHog 的 OTel logs 上报通道，目标后端 OpenObserve。
* 与 PostHog 完全切割：独立初始化、独立失败、独立清理。
* @internal
*/
var OTEL_LOGGER_NAME = "spatius-avatarkit";
var sdkVersion$2 = "1.0.0";
var isInitialized$2 = false;
var loggerProvider = null;
var eventQueue$1 = [];
var preCalibrationQueue = [];
function severityFromLevel(level) {
	switch (level) {
		case "debug": return {
			severityNumber: SeverityNumber.DEBUG,
			severityText: "DEBUG"
		};
		case "info": return {
			severityNumber: SeverityNumber.INFO,
			severityText: "INFO"
		};
		case "warning": return {
			severityNumber: SeverityNumber.WARN,
			severityText: "WARN"
		};
		case "error": return {
			severityNumber: SeverityNumber.ERROR,
			severityText: "ERROR"
		};
	}
}
/**
* Initialize OTel logger provider.
* @internal
*/
function initializeOtel(version, resourceAttrs) {
	if (isInitialized$2) {
		logger.log("[OTel] Already initialized, skipping");
		return;
	}
	sdkVersion$2 = version;
	try {
		loggerProvider = new LoggerProvider({
			resource: resourceFromAttributes({
				[ATTR_SERVICE_NAME]: "avatarkit",
				"sdk.version": resolveSdkVersion(sdkVersion$2),
				"sdk.platform": "web",
				"sdk.package": getSdkPackage(),
				"render_sdk_version": sdkVersion$2,
				"app_id": resourceAttrs.appId || "",
				"region": resourceAttrs.region,
				"dsm": resourceAttrs.dsm
			}),
			processors: [new BatchLogRecordProcessor(new ReliableExporter(observeExporter(new OTLPLogExporter({
				url: OTEL_LOGS_ENDPOINT,
				headers: { "stream-name": OTEL_STREAM_NAME }
			}), "/v1/logs", OTEL_LOGS_ENDPOINT)))]
		});
		logs.setGlobalLoggerProvider(loggerProvider);
		isInitialized$2 = true;
		logger.log(`[OTel] Initialized successfully - endpoint: ${OTEL_LOGS_ENDPOINT}, stream: ${OTEL_STREAM_NAME}`);
		flushEventQueue$1();
		clockSync.onReady(() => flushPreCalibrationQueue());
		replayPersistedEvents().catch(() => {});
	} catch (error) {
		logger.warn("[OTel] Failed to initialize:", error instanceof Error ? error.message : String(error));
	}
}
function toAnyValue(value) {
	if (value === null || value === void 0) return null;
	const t = typeof value;
	if (t === "string" || t === "number" || t === "boolean") return value;
	if (Array.isArray(value)) return value.map(toAnyValue);
	if (t === "object") {
		const out = {};
		for (const [k, v] of Object.entries(value)) out[k] = toAnyValue(v);
		return out;
	}
	return String(value);
}
function toAttributes(input) {
	const out = {};
	for (const [k, v] of Object.entries(input)) out[k] = toAnyValue(v);
	return out;
}
function emitLogRecord(event, level, contents, timestamp) {
	if (!loggerProvider) return;
	const otelLogger = logs.getLogger(OTEL_LOGGER_NAME, sdkVersion$2);
	const logContext = idManager.getLogContext();
	const { severityNumber, severityText } = severityFromLevel(level);
	const sessionToken = idManager.getSessionToken() ?? "";
	const raw = {
		"event.name": event,
		"user_id": logContext.user_id || "",
		"client_id": logContext.client_id,
		"session_id": logContext.session_id,
		"session_token_suffix": sessionToken ? sessionToken.slice(-8) : "",
		...contents
	};
	const hrTime = [Math.trunc(timestamp / 1e3), timestamp % 1e3 * 1e6];
	otelLogger.emit({
		timestamp: hrTime,
		severityNumber,
		severityText,
		body: event,
		attributes: toAttributes(raw)
	});
}
function flushEventQueue$1() {
	if (!loggerProvider || eventQueue$1.length === 0) return;
	logger.log(`[OTel] Flushing ${eventQueue$1.length} queued events`);
	for (const { event, level, contents, timestamp } of eventQueue$1) try {
		emitLogRecord(event, level, contents, timestamp);
	} catch (error) {
		logger.warn(`[OTel] Failed to flush queued event ${event}:`, error instanceof Error ? error.message : String(error));
	}
	eventQueue$1.length = 0;
}
/**
* Report event to OTel.
*
* Implementation: persist to event-store first, then emit to OTel with the
* store id as `_index`. The wrapper exporter deletes the persisted record
* the moment it picks the batch up for HTTP upload — so any record still
* in the store on next startup is unsent and will be replayed.
* @internal
*/
function trackEventOtel(event, level = "info", contents = {}) {
	if (!clockSync.isReady()) {
		preCalibrationQueue.push({
			event,
			level,
			contents,
			enqueueMono: performance.now()
		});
		return;
	}
	emitOtelEvent(event, level, contents, performance.now());
}
/**
* 首次校准落定后，重放挂起的早期事件（用各自入队时刻还原时间戳）。
* @internal
*/
function flushPreCalibrationQueue() {
	if (preCalibrationQueue.length === 0) return;
	const pending = preCalibrationQueue.splice(0, preCalibrationQueue.length);
	for (const e of pending) emitOtelEvent(e.event, e.level, e.contents, e.enqueueMono);
}
/**
* 实际处理一条 OTel 事件：解析标记、算双时间戳、持久化 + emit。
* @param atMono 用于换算时间戳的单调读数（即时=当前，挂起重放=入队时刻）
* @internal
*/
function emitOtelEvent(event, level, contents, atMono) {
	contents = resolveMarks(contents);
	const timestamp = clockSync.localAt(atMono);
	const serverTs = clockSync.serverAt(atMono);
	if (serverTs !== null) contents = {
		...contents,
		server_timestamp: serverTs
	};
	eventStore.add({
		event,
		level,
		contents,
		timestamp
	}).then((id) => {
		const contentsWithIndex = {
			...contents,
			_index: id
		};
		if (!loggerProvider) return;
		try {
			emitLogRecord(event, level, contentsWithIndex, timestamp);
		} catch (error) {
			logger.warn("[OTel] Failed to track event:", error instanceof Error ? error.message : String(error));
		}
	}).catch((error) => {
		logger.warn("[OTel] event-store write failed, emitting without persistence:", error instanceof Error ? error.message : String(error));
		if (!loggerProvider) {
			eventQueue$1.push({
				event,
				level,
				contents,
				timestamp
			});
			return;
		}
		try {
			emitLogRecord(event, level, contents, timestamp);
		} catch (e) {
			logger.warn("[OTel] Failed to track event:", e instanceof Error ? e.message : String(e));
		}
	});
}
/**
* Wrapper around OTLPLogExporter that:
* 1. Extracts `_index` from each record's attributes (set by trackEventOtel).
* 2. Deletes the corresponding event-store rows immediately — the moment
*    we hand the batch off to the inner HTTP exporter we consider the
*    SDK done with persistence. (No retry, no failure-bookkeeping.)
* 3. Strips `_index` from a cloned record list before calling inner.export
*    so the attribute does not leak to OpenObserve.
*
* Rationale for "delete on handoff, not on success":
*   - If the HTTP POST fails after this point, we lose this batch. Accepted.
*   - If we keep the records and try to mark/sweep on success/failure, the
*     bookkeeping (status, retry, multi-tab orphans) blew up the complexity
*     vs. real-world value. Skipped.
*   - Records still in the store on next startup were never picked up at
*     all — those are the worthwhile replay candidates.
*/
var ReliableExporter = class {
	inner;
	constructor(inner) {
		this.inner = inner;
	}
	export(records, callback) {
		const ids = [];
		for (const r of records) {
			const id = r.attributes["_index"];
			if (typeof id === "number") ids.push(id);
		}
		const proceed = (taken) => {
			const remaining = new Set(taken);
			const toSend = records.filter((r) => {
				const id = r.attributes["_index"];
				if (typeof id !== "number") return true;
				if (remaining.has(id)) {
					remaining.delete(id);
					return true;
				}
				return false;
			});
			if (toSend.length === 0) {
				callback({ code: 0 });
				return;
			}
			for (const r of toSend) delete r.attributes["_index"];
			this.inner.export(toSend, callback);
		};
		if (ids.length === 0) {
			proceed(/* @__PURE__ */ new Set());
			return;
		}
		eventStore.takeIfExists(ids).then(proceed).catch((e) => {
			logger.warn("[OTel] takeIfExists failed, falling back to send-all:", e instanceof Error ? e.message : String(e));
			proceed(new Set(ids));
		});
	}
	shutdown() {
		return this.inner.shutdown();
	}
	forceFlush() {
		return this.inner.forceFlush();
	}
};
/**
* Replay events left in the store from a previous (possibly crashed) session.
* Called once during initializeOtel after loggerProvider is ready.
*/
async function replayPersistedEvents() {
	try {
		const pending = await eventStore.getAll();
		if (pending.length === 0) return;
		logger.log(`[OTel] Replaying ${pending.length} persisted events from previous session`);
		for (const e of pending) try {
			emitLogRecord(e.event, e.level, {
				...e.contents,
				_index: e.id
			}, e.timestamp);
		} catch (error) {
			logger.warn(`[OTel] Failed to replay event ${e.event}:`, error instanceof Error ? error.message : String(error));
		}
		if (loggerProvider) loggerProvider.forceFlush().catch(() => {});
	} catch (error) {
		logger.warn("[OTel] Failed to load persisted events:", error instanceof Error ? error.message : String(error));
	}
}
/**
* Cleanup OTel (flush remaining events and shutdown).
* @internal
*/
function cleanupOtel() {
	if (!isInitialized$2 || !loggerProvider) return;
	try {
		loggerProvider.shutdown().catch((error) => {
			logger.warn("[OTel] Shutdown error:", error instanceof Error ? error.message : String(error));
		});
		isInitialized$2 = false;
		loggerProvider = null;
		logger.log("[OTel] Cleaned up");
	} catch (error) {
		logger.warn("[OTel] Failed to cleanup:", error instanceof Error ? error.message : String(error));
		isInitialized$2 = false;
		loggerProvider = null;
	}
}
//#endregion
//#region utils/posthog-tracker.ts
/**
* PostHog Telemetry Tool (Browser Version)
* 
* Unified PostHog telemetry reporting, supports custom reporting
* Uses PostHog JS SDK for event tracking, suitable for browser environments
* @internal
*/
/**
* 构建时间戳字段：本地时间戳（校准基准+单调流逝）+ 后台时间戳（拿到才带）。
* @internal
*/
function timestampFields(enqueueMono) {
	const local = enqueueMono === void 0 ? clockSync.localNow() : clockSync.localAt(enqueueMono);
	const server = enqueueMono === void 0 ? clockSync.serverNow() : clockSync.serverAt(enqueueMono);
	const fields = { timestamp: local };
	if (server !== null) fields.server_timestamp = server;
	return fields;
}
/**
* 客户端环境字段（仅 OTel log 通道补——PostHog 通道由其 SDK 自动附加同类 `$` 属性）。
* 全部从浏览器 API 现取（与 PostHog 客户端取法一致），不解析 UA/不造设备信息，
* 浏览器/OS/设备类型交给后端从 user_agent 解析。GeoIP（国家/城市/IP）由后端从 IP 推断，此处不涉及。
* 每条 log 实时取：url/pathname 随 SPA 路由变，取当前值才准。全程 try/catch 兜底，缺失即省略该字段。
* @internal
*/
function clientContextFields() {
	const fields = {};
	try {
		if (typeof window !== "undefined" && window.location) {
			const loc = window.location;
			if (loc.host) fields.host = loc.host;
			if (loc.hostname) fields.domain = loc.hostname;
			if (loc.href) fields.url = loc.href;
			if (loc.pathname) fields.pathname = loc.pathname;
		}
		if (typeof document !== "undefined" && document.referrer) fields.referrer = document.referrer;
		if (typeof navigator !== "undefined") {
			if (navigator.userAgent) fields.user_agent = navigator.userAgent;
			if (navigator.language) fields.locale = navigator.language;
		}
		if (typeof screen !== "undefined") {
			if (screen.width) fields.screen_width = screen.width;
			if (screen.height) fields.screen_height = screen.height;
		}
		if (typeof window !== "undefined") {
			if (window.innerWidth) fields.viewport_width = window.innerWidth;
			if (window.innerHeight) fields.viewport_height = window.innerHeight;
		}
		const tz = Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone;
		if (tz) fields.timezone = tz;
	} catch {}
	return fields;
}
var sdkVersion$1 = "1.0.0";
var isInitialized$1 = false;
var commonRegion = "";
var commonDsm = "";
function isPostHogEnabled() {
	return !commonRegion.startsWith("cn-");
}
var SDK_POSTHOG_INSTANCE_NAME = "spatius-posthog";
var sdkPosthogInstance = null;
var eventQueue = [];
/**
* Get common fields for PostHog (excluding level)
* userProperties = 公共字段除了 level 外的所有字段
* @internal
*/
function getCommonFields() {
	const logContext = idManager.getLogContext();
	return {
		platform: "Web",
		sdk_version: sdkVersion$1,
		app_id: logContext.app_id || "",
		user_id: logContext.user_id || "",
		client_id: logContext.client_id,
		region: commonRegion,
		dsm: commonDsm,
		framework: "",
		framework_version: ""
	};
}
/**
* Initialize PostHog with the SDK version.
* @internal
*/
function initializePostHog(version, commonFields) {
	commonRegion = commonFields.region;
	commonDsm = commonFields.dsm;
	if (!isPostHogEnabled()) {
		logger.log(`[PostHog] Tracking disabled for region=${commonRegion} (data residency)`);
		return;
	}
	const { host, apiKey, disableCompression } = getPostHogConfig();
	if (!apiKey) {
		logger.warn("[PostHog] API Key not configured, tracking disabled");
		return;
	}
	if (isInitialized$1) {
		logger.log("[PostHog] Already initialized, skipping");
		return;
	}
	sdkVersion$1 = version;
	try {
		const logContext = idManager.getLogContext();
		eu.init(apiKey, {
			api_host: host,
			person_profiles: "identified_only",
			capture_pageview: false,
			capture_pageleave: false,
			disable_compression: disableCompression,
			disable_session_recording: true,
			autocapture: false,
			capture_performance: false,
			loaded: (posthogInstance) => {
				logger.log(`[PostHog] Initialized successfully - host: ${host}, instance: ${SDK_POSTHOG_INSTANCE_NAME}`);
				isInitialized$1 = true;
				sdkPosthogInstance = posthogInstance;
				const userProperties = getCommonFields();
				if (logContext.user_id) posthogInstance.identify(logContext.user_id, userProperties);
				else posthogInstance.register(userProperties);
				posthogInstance.setPersonPropertiesForFlags(userProperties);
				flushEventQueue();
				clockSync.onReady(() => flushEventQueue());
			}
		}, SDK_POSTHOG_INSTANCE_NAME);
	} catch (error) {
		logger.warn("[PostHog] Failed to initialize:", error instanceof Error ? error.message : String(error));
	}
}
/**
* Get SDK's PostHog instance (if not initialized, try to get it)
* @internal
*/
function getSdkPosthogInstance() {
	if (sdkPosthogInstance) return sdkPosthogInstance;
	try {
		sdkPosthogInstance = eu.getInstance?.(SDK_POSTHOG_INSTANCE_NAME);
		return sdkPosthogInstance;
	} catch (error) {
		return null;
	}
}
/**
* Get logs feature flag (default: false)
* Reloads feature flags from server first, then checks if logs_feature_flag is enabled
* @returns Promise<boolean> - true if feature flag is enabled, false otherwise
* @internal
*/
async function getLogsFeatureFlag() {
	let instance = getSdkPosthogInstance();
	if (!instance) {
		const maxWaitTime = 5e3;
		const checkInterval = 100;
		const startTime = Date.now();
		while (!instance && Date.now() - startTime < maxWaitTime) {
			await new Promise((resolve) => setTimeout(resolve, checkInterval));
			instance = getSdkPosthogInstance();
		}
	}
	if (!instance) {
		logger.log("[PostHog] PostHog not initialized after waiting, logs feature flag disabled (default: false)");
		return false;
	}
	try {
		const commonFields = getCommonFields();
		instance.setPersonPropertiesForFlags(commonFields);
		instance.reloadFeatureFlags();
		await new Promise((resolve) => {
			instance.onFeatureFlags((_flags, _variants, { errorsLoading } = {}) => {
				if (errorsLoading) logger.warn("[PostHog] Error loading feature flags");
				resolve();
			});
		});
		const isEnabled = instance.isFeatureEnabled("logs_feature_flag") === true;
		logger.log(`[PostHog] Logs feature flag: ${isEnabled ? "enabled" : "disabled"}`);
		return isEnabled;
	} catch (error) {
		logger.warn("[PostHog] Failed to get logs feature flag:", error instanceof Error ? error.message : String(error));
		return false;
	}
}
/**
* Update PostHog person properties for feature flags evaluation
* @internal
*/
function updatePostHogPersonPropertiesForFlags() {
	const instance = getSdkPosthogInstance();
	if (!instance) return;
	const commonFields = getCommonFields();
	instance.setPersonPropertiesForFlags(commonFields);
}
/**
* Send queued events (called after PostHog initialization completes)
* @internal
*/
function flushEventQueue() {
	if (!sdkPosthogInstance || !clockSync.isReady() || eventQueue.length === 0) return;
	logger.log(`[PostHog] Flushing ${eventQueue.length} queued events`);
	setTimeout(() => {
		for (const { event, level, contents, enqueueMono } of eventQueue) try {
			const properties = {
				...getCommonFields(),
				level,
				service_module: "sdk",
				...timestampFields(enqueueMono),
				...resolveMarks(contents)
			};
			sdkPosthogInstance.capture(event, properties);
		} catch (error) {
			logger.warn(`[PostHog] Failed to flush queued event ${event}:`, error instanceof Error ? error.message : String(error));
		}
		eventQueue.length = 0;
	}, 0);
}
/**
* Report event to PostHog
* @param event Event name
* @param level Log level
* @param contents Event contents
* @internal
*/
function trackEvent(event, level = "info", contents = {}) {
	if (!isPostHogEnabled()) return;
	const instance = getSdkPosthogInstance();
	if (!instance || !clockSync.isReady()) {
		eventQueue.push({
			event,
			level,
			contents,
			enqueueMono: performance.now()
		});
		return;
	}
	sdkPosthogInstance = instance;
	try {
		const properties = {
			...getCommonFields(),
			level,
			service_module: "sdk",
			...timestampFields(),
			...resolveMarks(contents)
		};
		sdkPosthogInstance.capture(event, properties);
	} catch (error) {
		logger.warn("[PostHog] Failed to track event:", error instanceof Error ? error.message : String(error));
	}
}
/**
* Cleanup PostHog (flush remaining events)
* @internal
*/
function cleanupPostHog() {
	if (!isInitialized$1) return;
	try {
		const instance = getSdkPosthogInstance();
		if (!instance) {
			isInitialized$1 = false;
			return;
		}
		sdkPosthogInstance = instance;
		if (typeof instance.shutdown === "function") instance.shutdown();
		else if (typeof instance.flush === "function") instance.flush();
		isInitialized$1 = false;
		sdkPosthogInstance = null;
		logger.log("[PostHog] Cleaned up");
	} catch (error) {
		logger.warn("[PostHog] Failed to cleanup:", error instanceof Error ? error.message : String(error));
		isInitialized$1 = false;
		sdkPosthogInstance = null;
	}
}
var TELEMETRY_LOG_METHOD = {
	debug: "log",
	info: "log",
	warning: "warn",
	error: "error"
};
/** 组装上报 context（附加 session_token 后缀）并写一条本地 console。两条上报通道共用。 */
function buildTelemetryContext(event, level, contents) {
	const sessionToken = idManager.getSessionToken() ?? "";
	const context = {
		session_token_suffix: sessionToken ? sessionToken.slice(-8) : "",
		connection_id: idManager.getConnectionId() ?? "",
		...clientContextFields(),
		...contents
	};
	const logMethod = TELEMETRY_LOG_METHOD[level] ?? "log";
	const propsDescription = Object.entries(contents).map(([k, v]) => `${k}=${v}`).join(", ");
	logger[logMethod](`[Telemetry] ${event} [${propsDescription}]`);
	return context;
}
/** 通过 OTel 上报（独立通道，失败隔离，不影响 PostHog）。 */
function emitToOtel(event, level, context) {
	try {
		trackEventOtel(event, level, context);
	} catch (error) {
		logger.warn("[OTel] Dual-send failed:", error instanceof Error ? error.message : String(error));
	}
}
/**
* 日志上报接口：同时发往 PostHog 与 OTel。
* 用于 SDK 内部**日志类**事件（失败、状态变更、生命周期等）。
* 指标类（延迟/帧率/时长/次数等度量）请用 {@link logMetric}——只发 OTel。
* @param event Event name
* @param level Log level
* @param contents Log contents
* @internal
*/
function logEvent(event, level = "info", contents = {}) {
	const context = buildTelemetryContext(event, level, contents);
	trackEvent(event, level, context);
	emitToOtel(event, level, context);
}
/**
* 指标上报接口：**双发**——OTel Metric 信号（Histogram，供聚合 P95/均值/SLO）
* + 一份 OTel log（带完整明细，供按 avatar_id 等排查单次）。不发 PostHog。
*
* metric 的天然形态是「一个数值 + 一组低基数标签」，故签名为 (name, value, labels, logExtra)：
* - `value`  被记录到 Histogram（延迟 ms / 帧率 / 时长 / 次数 / 比率等）
* - `labels` 低基数标签（dsm / resolution / is_fallback / renderer_backend 等），
*            同时进 metric 的 attributes 和 log。**不要**放高基数字段（会撑爆 metric 基数）。
* - `logExtra` 只进 log 的明细（avatar_id / conversation_id 等高基数字段）。
*
* @param name Metric 名（如 `fetch_avatar_latency`）
* @param value 被聚合的数值
* @param labels 低基数标签
* @param logExtra 仅 log 携带的高基数明细
* @internal
*/
function logMetric(name, value, labels = {}, logExtra = {}) {
	recordMetric(name, value, labels);
	emitToOtel(name, "info", buildTelemetryContext(name, "info", {
		value,
		...labels,
		...logExtra
	}));
}
var logSink = class LogSink {
	static instance = null;
	db = null;
	dbName = "avatarkit_logs";
	storeName = "logs";
	version = 1;
	trimThreshold = 5e3;
	trimBufferSize = 1e3;
	isFlushing = false;
	constructor() {}
	static getInstance() {
		if (!LogSink.instance) LogSink.instance = new LogSink();
		return LogSink.instance;
	}
	/**
	* Initialize IndexedDB
	*/
	async initialize() {
		if (this.db) return;
		return new Promise((resolve, reject) => {
			const request = indexedDB.open(this.dbName, this.version);
			request.onerror = () => {
				reject(/* @__PURE__ */ new Error("Failed to open IndexedDB"));
			};
			request.onsuccess = () => {
				this.db = request.result;
				resolve();
			};
			request.onupgradeneeded = (event) => {
				const db = event.target.result;
				if (!db.objectStoreNames.contains(this.storeName)) db.createObjectStore(this.storeName, {
					keyPath: "id",
					autoIncrement: true
				}).createIndex("ts", "ts", { unique: false });
			};
		});
	}
	/**
	* Append log entry to IndexedDB
	*/
	async append(entry) {
		if (!this.db) try {
			await this.initialize();
		} catch {
			return;
		}
		if (!this.db) return;
		try {
			const store = this.db.transaction([this.storeName], "readwrite").objectStore(this.storeName);
			await new Promise((resolve, reject) => {
				const request = store.add(entry);
				request.onsuccess = () => resolve();
				request.onerror = () => reject(/* @__PURE__ */ new Error("Failed to add log"));
			});
			this.getCount().then((count) => {
				if (count > this.trimThreshold) this.trim().catch(() => {});
			}).catch(() => {});
		} catch (error) {}
	}
	/**
	* Get total log count
	*/
	async getCount() {
		if (!this.db) return 0;
		return new Promise((resolve, reject) => {
			const request = this.db.transaction([this.storeName], "readonly").objectStore(this.storeName).count();
			request.onsuccess = () => {
				resolve(request.result);
			};
			request.onerror = () => {
				reject(/* @__PURE__ */ new Error("Failed to count logs"));
			};
		});
	}
	/**
	* Trim logs to keep only recent entries
	*/
	async trim() {
		if (!this.db || this.isFlushing) return;
		try {
			const store = this.db.transaction([this.storeName], "readwrite").objectStore(this.storeName);
			const getAllRequest = store.getAll();
			const entries = await new Promise((resolve, reject) => {
				getAllRequest.onsuccess = () => {
					resolve(getAllRequest.result);
				};
				getAllRequest.onerror = () => {
					reject(/* @__PURE__ */ new Error("Failed to get logs"));
				};
			});
			const keepCount = this.trimThreshold - this.trimBufferSize;
			if (entries.length <= keepCount) return;
			entries.sort((a, b) => a.ts - b.ts);
			const toDelete = entries.slice(0, entries.length - keepCount);
			for (const entry of toDelete) if (entry.id !== void 0) await new Promise((resolve, reject) => {
				const deleteRequest = store.delete(entry.id);
				deleteRequest.onsuccess = () => resolve();
				deleteRequest.onerror = () => reject(/* @__PURE__ */ new Error("Failed to delete log"));
			});
		} catch (error) {}
	}
	/**
	* Flush logs to server
	*/
	async flush() {
		if (!this.db || this.isFlushing) return;
		this.isFlushing = true;
		try {
			const getAllRequest = this.db.transaction([this.storeName], "readonly").objectStore(this.storeName).getAll();
			const entries = await new Promise((resolve, reject) => {
				getAllRequest.onsuccess = () => {
					resolve(getAllRequest.result);
				};
				getAllRequest.onerror = () => {
					reject(/* @__PURE__ */ new Error("Failed to get logs"));
				};
			});
			if (entries.length === 0) {
				this.isFlushing = false;
				return;
			}
			const requestBody = { logs: entries.map((entry) => ({
				...entry,
				extra: {
					...entry.extra,
					platform: "Web"
				}
			})) };
			const jsonData = JSON.stringify(requestBody);
			const gzippedData = await this.gzip(jsonData);
			const response = await fetch("https://hogtool.spatialwalk.ai/batch-upload-log", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					"Content-Encoding": "gzip"
				},
				body: gzippedData,
				signal: AbortSignal.timeout(15e3)
			});
			if (!response.ok) throw new Error(`Failed to upload logs: ${response.status} ${response.statusText}`);
			await this.clearFirst(entries.length);
		} catch (error) {
			console.warn("[LogSink] Failed to flush logs:", error);
			throw error;
		} finally {
			this.isFlushing = false;
		}
	}
	/**
	* Clear first N log entries
	*/
	async clearFirst(count) {
		if (!this.db || count <= 0) return;
		try {
			const store = this.db.transaction([this.storeName], "readwrite").objectStore(this.storeName);
			const getAllRequest = store.getAll();
			const entries = await new Promise((resolve, reject) => {
				getAllRequest.onsuccess = () => {
					resolve(getAllRequest.result);
				};
				getAllRequest.onerror = () => {
					reject(/* @__PURE__ */ new Error("Failed to get logs"));
				};
			});
			entries.sort((a, b) => a.ts - b.ts);
			const toDelete = entries.slice(0, count);
			for (const entry of toDelete) if (entry.id !== void 0) await new Promise((resolve, reject) => {
				const deleteRequest = store.delete(entry.id);
				deleteRequest.onsuccess = () => resolve();
				deleteRequest.onerror = () => reject(/* @__PURE__ */ new Error("Failed to delete log"));
			});
		} catch (error) {}
	}
	/**
	* Gzip string data
	*/
	async gzip(data) {
		try {
			const encoded = new TextEncoder().encode(data);
			const compressedStream = new ReadableStream({ start(controller) {
				controller.enqueue(encoded);
				controller.close();
			} }).pipeThrough(new CompressionStream("gzip"));
			return await new Response(compressedStream).blob();
		} catch (error) {
			console.error("[LogSink] gzip() error:", error);
			throw error;
		}
	}
}.getInstance();
//#endregion
//#region utils/log-sanitizer.ts
var ALGORITHM_REG = new RegExp(`\\b(${[
	"flame",
	"keyframe",
	"keyframes",
	"splat",
	"splats",
	"covariance",
	"gaussian",
	"cov6",
	"packeddata",
	"sortorder",
	"sortindex",
	"avatar_core",
	"emscripten",
	"wasm",
	"blendshape",
	"expressionparam",
	"rig"
].join("|")})\\b`, "gi");
/** Chinese characters (CJK Unified Ideographs) */
var CHINESE_REG = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
/** Patterns to redact: capture group 1 = key, 2 = value; replace value with *** */
var SENSITIVE_PATTERNS = [
	{
		reg: /\b(token|sessiontoken|accesstoken|apikey|apisecret|secret|password|auth)=([^\s,}\]'"]+)/gi,
		replacement: "$1=***"
	},
	{
		reg: /\b(conversationid|connectionid|clientid|sessionid)=([^\s,}\]'"]+)/gi,
		replacement: "$1=***"
	},
	{
		reg: /\b(appid|app_id)=([^\s,}\]'"]+)/gi,
		replacement: "$1=***"
	},
	{
		reg: /\b(userid|user_id)=([^\s,}\]'"]+)/gi,
		replacement: "$1=***"
	},
	{
		reg: /(https?:\/\/)[^\s,}\]'"]+/gi,
		replacement: "$1***"
	},
	{
		reg: /(wss?:\/\/)[^\s,}\]'"]+/gi,
		replacement: "$1***"
	}
];
/**
* Check if message contains Chinese.
*/
function hasChinese(msg) {
	return CHINESE_REG.test(msg);
}
/**
* Check if message contains algorithm/internal terms.
*/
function hasAlgorithmTerms(msg) {
	return ALGORITHM_REG.test(msg);
}
/**
* Redact sensitive substrings in message.
*/
function redactSensitive(msg) {
	let out = msg;
	for (const { reg, replacement } of SENSITIVE_PATTERNS) out = out.replace(reg, replacement);
	return out;
}
/**
* Sanitize a log message for local persistence.
* - Do not persist if message contains Chinese or algorithm terms.
* - Otherwise persist, but redact sensitive content first.
*/
function sanitizeForLocalLog(message) {
	if (hasChinese(message) || hasAlgorithmTerms(message)) return {
		shouldPersist: false,
		sanitized: message
	};
	return {
		shouldPersist: true,
		sanitized: redactSensitive(message)
	};
}
//#endregion
//#region utils/logger.ts
/**
* Logger Utility
* Environment-aware logger wrapper with local log persistence
* - Always writes to local log file (IndexedDB) regardless of logLevel
* - Console output is controlled by logLevel
* - Errors and warnings are always reported to PostHog (when enabled)
*
* Usage: Replace `console.log()` with `logger.log()`
*/
setGlobalLogLevel(LogLevel$1.Warning);
var baseLogger = useLogger("Web").withErrorProcessor((err) => {
	captureErrorContext("error", err);
	return err;
}).useGlobalConfig();
logSink.initialize().catch(() => {});
var currentLogLevel = LogLevel.off;
/**
* Write log to local storage.
* Skips persistence if message contains Chinese, algorithm terms (e.g. Flame, splat), or sensitive content.
* Otherwise redacts sensitive substrings then persists.
*/
async function writeToLocalLog(message, level, extra = {}) {
	try {
		const { shouldPersist, sanitized } = sanitizeForLocalLog(message);
		if (!shouldPersist) return;
		const version = requireSDK().version;
		const appId = idManager.getAppId();
		const userId = idManager.getUserId();
		await logSink.append({
			level,
			ts: Date.now(),
			msg: sanitized,
			extra: {
				...extra,
				_category: "Web",
				sdk_version: version || "",
				app_id: appId || "",
				user_id: userId || "",
				platform: "Web",
				framework: "",
				framework_version: ""
			}
		});
	} catch {}
}
/**
* Format console message with [AvatarKit] prefix
*/
function formatConsoleMessage(message) {
	return `[AvatarKit] ${message}`;
}
var logger = {
	debug: (message, ...args) => {
		writeToLocalLog(message, "info", {}).catch(() => {});
		if (currentLogLevel === LogLevel.all) baseLogger.debug(formatConsoleMessage(message), ...args);
	},
	verbose: (message, ...args) => {
		writeToLocalLog(message, "info", {}).catch(() => {});
		if (currentLogLevel === LogLevel.all) baseLogger.verbose(formatConsoleMessage(message), ...args);
	},
	log: (message, ...args) => {
		writeToLocalLog(message, "info", {}).catch(() => {});
		if (currentLogLevel === LogLevel.all) baseLogger.log(formatConsoleMessage(message), ...args);
	},
	warn: (message, ...args) => {
		writeToLocalLog(message, "warn", {}).catch(() => {});
		if (currentLogLevel === LogLevel.warning || currentLogLevel === LogLevel.all) baseLogger.warn(formatConsoleMessage(message), ...args);
	},
	error: (message, ...args) => {
		const fullMessage = message + (args.length > 0 ? " " + args.map((a) => a instanceof Error ? a.message : typeof a === "string" ? a : JSON.stringify(a)).join(" ") : "");
		writeToLocalLog(fullMessage, "error", {}).catch(() => {});
		if (currentLogLevel !== LogLevel.off) baseLogger.error(formatConsoleMessage(fullMessage));
	}
};
/**
* Set SDK log level
* Note: Local log writing is always enabled regardless of logLevel
* @param level SDK's LogLevel enum value
* @internal
*/
function setLogLevel(level) {
	currentLogLevel = level;
	switch (level) {
		case LogLevel.off:
			setGlobalLogLevel(LogLevel$1.Error);
			break;
		case LogLevel.error:
			setGlobalLogLevel(LogLevel$1.Error);
			break;
		case LogLevel.warning:
			setGlobalLogLevel(LogLevel$1.Warning);
			break;
		case LogLevel.all:
			setGlobalLogLevel(LogLevel$1.Debug);
			break;
		default:
			setGlobalLogLevel(LogLevel$1.Warning);
			break;
	}
}
/**
* Capture error context for PostHog
*/
function captureErrorContext(level, error) {
	trackEvent("logger_error", level, {
		error: error instanceof Error ? error.message : String(error),
		timestamp: Date.now(),
		environment: "library",
		user_agent: typeof navigator !== "undefined" ? navigator.userAgent : ""
	});
}
//#endregion
//#region node_modules/.pnpm/@bufbuild+protobuf@2.10.1/node_modules/@bufbuild/protobuf/dist/esm/wire/varint.js
/**
* Read a 64 bit varint as two JS numbers.
*
* Returns tuple:
* [0]: low bits
* [1]: high bits
*
* Copyright 2008 Google Inc.  All rights reserved.
*
* See https://github.com/protocolbuffers/protobuf/blob/8a71927d74a4ce34efe2d8769fda198f52d20d12/js/experimental/runtime/kernel/buffer_decoder.js#L175
*/
function varint64read() {
	let lowBits = 0;
	let highBits = 0;
	for (let shift = 0; shift < 28; shift += 7) {
		let b = this.buf[this.pos++];
		lowBits |= (b & 127) << shift;
		if ((b & 128) == 0) {
			this.assertBounds();
			return [lowBits, highBits];
		}
	}
	let middleByte = this.buf[this.pos++];
	lowBits |= (middleByte & 15) << 28;
	highBits = (middleByte & 112) >> 4;
	if ((middleByte & 128) == 0) {
		this.assertBounds();
		return [lowBits, highBits];
	}
	for (let shift = 3; shift <= 31; shift += 7) {
		let b = this.buf[this.pos++];
		highBits |= (b & 127) << shift;
		if ((b & 128) == 0) {
			this.assertBounds();
			return [lowBits, highBits];
		}
	}
	throw new Error("invalid varint");
}
/**
* Write a 64 bit varint, given as two JS numbers, to the given bytes array.
*
* Copyright 2008 Google Inc.  All rights reserved.
*
* See https://github.com/protocolbuffers/protobuf/blob/8a71927d74a4ce34efe2d8769fda198f52d20d12/js/experimental/runtime/kernel/writer.js#L344
*/
function varint64write(lo, hi, bytes) {
	for (let i = 0; i < 28; i = i + 7) {
		const shift = lo >>> i;
		const hasNext = !(shift >>> 7 == 0 && hi == 0);
		const byte = (hasNext ? shift | 128 : shift) & 255;
		bytes.push(byte);
		if (!hasNext) return;
	}
	const splitBits = lo >>> 28 & 15 | (hi & 7) << 4;
	const hasMoreBits = !(hi >> 3 == 0);
	bytes.push((hasMoreBits ? splitBits | 128 : splitBits) & 255);
	if (!hasMoreBits) return;
	for (let i = 3; i < 31; i = i + 7) {
		const shift = hi >>> i;
		const hasNext = !(shift >>> 7 == 0);
		const byte = (hasNext ? shift | 128 : shift) & 255;
		bytes.push(byte);
		if (!hasNext) return;
	}
	bytes.push(hi >>> 31 & 1);
}
var TWO_PWR_32_DBL = 4294967296;
/**
* Parse decimal string of 64 bit integer value as two JS numbers.
*
* Copyright 2008 Google Inc.  All rights reserved.
*
* See https://github.com/protocolbuffers/protobuf-javascript/blob/a428c58273abad07c66071d9753bc4d1289de426/experimental/runtime/int64.js#L10
*/
function int64FromString(dec) {
	const minus = dec[0] === "-";
	if (minus) dec = dec.slice(1);
	const base = 1e6;
	let lowBits = 0;
	let highBits = 0;
	function add1e6digit(begin, end) {
		const digit1e6 = Number(dec.slice(begin, end));
		highBits *= base;
		lowBits = lowBits * base + digit1e6;
		if (lowBits >= TWO_PWR_32_DBL) {
			highBits = highBits + (lowBits / TWO_PWR_32_DBL | 0);
			lowBits = lowBits % TWO_PWR_32_DBL;
		}
	}
	add1e6digit(-24, -18);
	add1e6digit(-18, -12);
	add1e6digit(-12, -6);
	add1e6digit(-6);
	return minus ? negate(lowBits, highBits) : newBits(lowBits, highBits);
}
/**
* Losslessly converts a 64-bit signed integer in 32:32 split representation
* into a decimal string.
*
* Copyright 2008 Google Inc.  All rights reserved.
*
* See https://github.com/protocolbuffers/protobuf-javascript/blob/a428c58273abad07c66071d9753bc4d1289de426/experimental/runtime/int64.js#L10
*/
function int64ToString(lo, hi) {
	let bits = newBits(lo, hi);
	const negative = bits.hi & 2147483648;
	if (negative) bits = negate(bits.lo, bits.hi);
	const result = uInt64ToString(bits.lo, bits.hi);
	return negative ? "-" + result : result;
}
/**
* Losslessly converts a 64-bit unsigned integer in 32:32 split representation
* into a decimal string.
*
* Copyright 2008 Google Inc.  All rights reserved.
*
* See https://github.com/protocolbuffers/protobuf-javascript/blob/a428c58273abad07c66071d9753bc4d1289de426/experimental/runtime/int64.js#L10
*/
function uInt64ToString(lo, hi) {
	({lo, hi} = toUnsigned(lo, hi));
	if (hi <= 2097151) return String(TWO_PWR_32_DBL * hi + lo);
	const low = lo & 16777215;
	const mid = (lo >>> 24 | hi << 8) & 16777215;
	const high = hi >> 16 & 65535;
	let digitA = low + mid * 6777216 + high * 6710656;
	let digitB = mid + high * 8147497;
	let digitC = high * 2;
	const base = 1e7;
	if (digitA >= base) {
		digitB += Math.floor(digitA / base);
		digitA %= base;
	}
	if (digitB >= base) {
		digitC += Math.floor(digitB / base);
		digitB %= base;
	}
	return digitC.toString() + decimalFrom1e7WithLeadingZeros(digitB) + decimalFrom1e7WithLeadingZeros(digitA);
}
function toUnsigned(lo, hi) {
	return {
		lo: lo >>> 0,
		hi: hi >>> 0
	};
}
function newBits(lo, hi) {
	return {
		lo: lo | 0,
		hi: hi | 0
	};
}
/**
* Returns two's compliment negation of input.
* @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Bitwise_Operators#Signed_32-bit_integers
*/
function negate(lowBits, highBits) {
	highBits = ~highBits;
	if (lowBits) lowBits = ~lowBits + 1;
	else highBits += 1;
	return newBits(lowBits, highBits);
}
/**
* Returns decimal representation of digit1e7 with leading zeros.
*/
var decimalFrom1e7WithLeadingZeros = (digit1e7) => {
	const partial = String(digit1e7);
	return "0000000".slice(partial.length) + partial;
};
/**
* Write a 32 bit varint, signed or unsigned. Same as `varint64write(0, value, bytes)`
*
* Copyright 2008 Google Inc.  All rights reserved.
*
* See https://github.com/protocolbuffers/protobuf/blob/1b18833f4f2a2f681f4e4a25cdf3b0a43115ec26/js/binary/encoder.js#L144
*/
function varint32write(value, bytes) {
	if (value >= 0) {
		while (value > 127) {
			bytes.push(value & 127 | 128);
			value = value >>> 7;
		}
		bytes.push(value);
	} else {
		for (let i = 0; i < 9; i++) {
			bytes.push(value & 127 | 128);
			value = value >> 7;
		}
		bytes.push(1);
	}
}
/**
* Read an unsigned 32 bit varint.
*
* See https://github.com/protocolbuffers/protobuf/blob/8a71927d74a4ce34efe2d8769fda198f52d20d12/js/experimental/runtime/kernel/buffer_decoder.js#L220
*/
function varint32read() {
	let b = this.buf[this.pos++];
	let result = b & 127;
	if ((b & 128) == 0) {
		this.assertBounds();
		return result;
	}
	b = this.buf[this.pos++];
	result |= (b & 127) << 7;
	if ((b & 128) == 0) {
		this.assertBounds();
		return result;
	}
	b = this.buf[this.pos++];
	result |= (b & 127) << 14;
	if ((b & 128) == 0) {
		this.assertBounds();
		return result;
	}
	b = this.buf[this.pos++];
	result |= (b & 127) << 21;
	if ((b & 128) == 0) {
		this.assertBounds();
		return result;
	}
	b = this.buf[this.pos++];
	result |= (b & 15) << 28;
	for (let readBytes = 5; (b & 128) !== 0 && readBytes < 10; readBytes++) b = this.buf[this.pos++];
	if ((b & 128) != 0) throw new Error("invalid varint");
	this.assertBounds();
	return result >>> 0;
}
//#endregion
//#region node_modules/.pnpm/@bufbuild+protobuf@2.10.1/node_modules/@bufbuild/protobuf/dist/esm/proto-int64.js
/**
* Int64Support for the current environment.
*/
var protoInt64 = /*@__PURE__*/ makeInt64Support();
function makeInt64Support() {
	const dv = /* @__PURE__ */ new DataView(/* @__PURE__ */ new ArrayBuffer(8));
	if (typeof BigInt === "function" && typeof dv.getBigInt64 === "function" && typeof dv.getBigUint64 === "function" && typeof dv.setBigInt64 === "function" && typeof dv.setBigUint64 === "function" && (!!globalThis.Deno || typeof process != "object" || typeof process.env != "object" || process.env.BUF_BIGINT_DISABLE !== "1")) {
		const MIN = BigInt("-9223372036854775808");
		const MAX = BigInt("9223372036854775807");
		const UMIN = BigInt("0");
		const UMAX = BigInt("18446744073709551615");
		return {
			zero: BigInt(0),
			supported: true,
			parse(value) {
				const bi = typeof value == "bigint" ? value : BigInt(value);
				if (bi > MAX || bi < MIN) throw new Error(`invalid int64: ${value}`);
				return bi;
			},
			uParse(value) {
				const bi = typeof value == "bigint" ? value : BigInt(value);
				if (bi > UMAX || bi < UMIN) throw new Error(`invalid uint64: ${value}`);
				return bi;
			},
			enc(value) {
				dv.setBigInt64(0, this.parse(value), true);
				return {
					lo: dv.getInt32(0, true),
					hi: dv.getInt32(4, true)
				};
			},
			uEnc(value) {
				dv.setBigInt64(0, this.uParse(value), true);
				return {
					lo: dv.getInt32(0, true),
					hi: dv.getInt32(4, true)
				};
			},
			dec(lo, hi) {
				dv.setInt32(0, lo, true);
				dv.setInt32(4, hi, true);
				return dv.getBigInt64(0, true);
			},
			uDec(lo, hi) {
				dv.setInt32(0, lo, true);
				dv.setInt32(4, hi, true);
				return dv.getBigUint64(0, true);
			}
		};
	}
	return {
		zero: "0",
		supported: false,
		parse(value) {
			if (typeof value != "string") value = value.toString();
			assertInt64String(value);
			return value;
		},
		uParse(value) {
			if (typeof value != "string") value = value.toString();
			assertUInt64String(value);
			return value;
		},
		enc(value) {
			if (typeof value != "string") value = value.toString();
			assertInt64String(value);
			return int64FromString(value);
		},
		uEnc(value) {
			if (typeof value != "string") value = value.toString();
			assertUInt64String(value);
			return int64FromString(value);
		},
		dec(lo, hi) {
			return int64ToString(lo, hi);
		},
		uDec(lo, hi) {
			return uInt64ToString(lo, hi);
		}
	};
}
function assertInt64String(value) {
	if (!/^-?[0-9]+$/.test(value)) throw new Error("invalid int64: " + value);
}
function assertUInt64String(value) {
	if (!/^[0-9]+$/.test(value)) throw new Error("invalid uint64: " + value);
}
//#endregion
//#region node_modules/.pnpm/@bufbuild+protobuf@2.10.1/node_modules/@bufbuild/protobuf/dist/esm/wire/text-encoding.js
var symbol = Symbol.for("@bufbuild/protobuf/text-encoding");
function getTextEncoding() {
	if (globalThis[symbol] == void 0) {
		const te = new globalThis.TextEncoder();
		const td = new globalThis.TextDecoder();
		globalThis[symbol] = {
			encodeUtf8(text) {
				return te.encode(text);
			},
			decodeUtf8(bytes) {
				return td.decode(bytes);
			},
			checkUtf8(text) {
				try {
					return true;
				} catch (_) {
					return false;
				}
			}
		};
	}
	return globalThis[symbol];
}
//#endregion
//#region node_modules/.pnpm/@bufbuild+protobuf@2.10.1/node_modules/@bufbuild/protobuf/dist/esm/wire/binary-encoding.js
/**
* Protobuf binary format wire types.
*
* A wire type provides just enough information to find the length of the
* following value.
*
* See https://developers.google.com/protocol-buffers/docs/encoding#structure
*/
var WireType;
(function(WireType) {
	/**
	* Used for int32, int64, uint32, uint64, sint32, sint64, bool, enum
	*/
	WireType[WireType["Varint"] = 0] = "Varint";
	/**
	* Used for fixed64, sfixed64, double.
	* Always 8 bytes with little-endian byte order.
	*/
	WireType[WireType["Bit64"] = 1] = "Bit64";
	/**
	* Used for string, bytes, embedded messages, packed repeated fields
	*
	* Only repeated numeric types (types which use the varint, 32-bit,
	* or 64-bit wire types) can be packed. In proto3, such fields are
	* packed by default.
	*/
	WireType[WireType["LengthDelimited"] = 2] = "LengthDelimited";
	/**
	* Start of a tag-delimited aggregate, such as a proto2 group, or a message
	* in editions with message_encoding = DELIMITED.
	*/
	WireType[WireType["StartGroup"] = 3] = "StartGroup";
	/**
	* End of a tag-delimited aggregate.
	*/
	WireType[WireType["EndGroup"] = 4] = "EndGroup";
	/**
	* Used for fixed32, sfixed32, float.
	* Always 4 bytes with little-endian byte order.
	*/
	WireType[WireType["Bit32"] = 5] = "Bit32";
})(WireType || (WireType = {}));
var BinaryWriter = class {
	constructor(encodeUtf8 = getTextEncoding().encodeUtf8) {
		this.encodeUtf8 = encodeUtf8;
		/**
		* Previous fork states.
		*/
		this.stack = [];
		this.chunks = [];
		this.buf = [];
	}
	/**
	* Return all bytes written and reset this writer.
	*/
	finish() {
		if (this.buf.length) {
			this.chunks.push(new Uint8Array(this.buf));
			this.buf = [];
		}
		let len = 0;
		for (let i = 0; i < this.chunks.length; i++) len += this.chunks[i].length;
		let bytes = new Uint8Array(len);
		let offset = 0;
		for (let i = 0; i < this.chunks.length; i++) {
			bytes.set(this.chunks[i], offset);
			offset += this.chunks[i].length;
		}
		this.chunks = [];
		return bytes;
	}
	/**
	* Start a new fork for length-delimited data like a message
	* or a packed repeated field.
	*
	* Must be joined later with `join()`.
	*/
	fork() {
		this.stack.push({
			chunks: this.chunks,
			buf: this.buf
		});
		this.chunks = [];
		this.buf = [];
		return this;
	}
	/**
	* Join the last fork. Write its length and bytes, then
	* return to the previous state.
	*/
	join() {
		let chunk = this.finish();
		let prev = this.stack.pop();
		if (!prev) throw new Error("invalid state, fork stack empty");
		this.chunks = prev.chunks;
		this.buf = prev.buf;
		this.uint32(chunk.byteLength);
		return this.raw(chunk);
	}
	/**
	* Writes a tag (field number and wire type).
	*
	* Equivalent to `uint32( (fieldNo << 3 | type) >>> 0 )`.
	*
	* Generated code should compute the tag ahead of time and call `uint32()`.
	*/
	tag(fieldNo, type) {
		return this.uint32((fieldNo << 3 | type) >>> 0);
	}
	/**
	* Write a chunk of raw bytes.
	*/
	raw(chunk) {
		if (this.buf.length) {
			this.chunks.push(new Uint8Array(this.buf));
			this.buf = [];
		}
		this.chunks.push(chunk);
		return this;
	}
	/**
	* Write a `uint32` value, an unsigned 32 bit varint.
	*/
	uint32(value) {
		assertUInt32(value);
		while (value > 127) {
			this.buf.push(value & 127 | 128);
			value = value >>> 7;
		}
		this.buf.push(value);
		return this;
	}
	/**
	* Write a `int32` value, a signed 32 bit varint.
	*/
	int32(value) {
		assertInt32(value);
		varint32write(value, this.buf);
		return this;
	}
	/**
	* Write a `bool` value, a variant.
	*/
	bool(value) {
		this.buf.push(value ? 1 : 0);
		return this;
	}
	/**
	* Write a `bytes` value, length-delimited arbitrary data.
	*/
	bytes(value) {
		this.uint32(value.byteLength);
		return this.raw(value);
	}
	/**
	* Write a `string` value, length-delimited data converted to UTF-8 text.
	*/
	string(value) {
		let chunk = this.encodeUtf8(value);
		this.uint32(chunk.byteLength);
		return this.raw(chunk);
	}
	/**
	* Write a `float` value, 32-bit floating point number.
	*/
	float(value) {
		assertFloat32(value);
		let chunk = /* @__PURE__ */ new Uint8Array(4);
		new DataView(chunk.buffer).setFloat32(0, value, true);
		return this.raw(chunk);
	}
	/**
	* Write a `double` value, a 64-bit floating point number.
	*/
	double(value) {
		let chunk = /* @__PURE__ */ new Uint8Array(8);
		new DataView(chunk.buffer).setFloat64(0, value, true);
		return this.raw(chunk);
	}
	/**
	* Write a `fixed32` value, an unsigned, fixed-length 32-bit integer.
	*/
	fixed32(value) {
		assertUInt32(value);
		let chunk = /* @__PURE__ */ new Uint8Array(4);
		new DataView(chunk.buffer).setUint32(0, value, true);
		return this.raw(chunk);
	}
	/**
	* Write a `sfixed32` value, a signed, fixed-length 32-bit integer.
	*/
	sfixed32(value) {
		assertInt32(value);
		let chunk = /* @__PURE__ */ new Uint8Array(4);
		new DataView(chunk.buffer).setInt32(0, value, true);
		return this.raw(chunk);
	}
	/**
	* Write a `sint32` value, a signed, zigzag-encoded 32-bit varint.
	*/
	sint32(value) {
		assertInt32(value);
		value = (value << 1 ^ value >> 31) >>> 0;
		varint32write(value, this.buf);
		return this;
	}
	/**
	* Write a `fixed64` value, a signed, fixed-length 64-bit integer.
	*/
	sfixed64(value) {
		let chunk = /* @__PURE__ */ new Uint8Array(8), view = new DataView(chunk.buffer), tc = protoInt64.enc(value);
		view.setInt32(0, tc.lo, true);
		view.setInt32(4, tc.hi, true);
		return this.raw(chunk);
	}
	/**
	* Write a `fixed64` value, an unsigned, fixed-length 64 bit integer.
	*/
	fixed64(value) {
		let chunk = /* @__PURE__ */ new Uint8Array(8), view = new DataView(chunk.buffer), tc = protoInt64.uEnc(value);
		view.setInt32(0, tc.lo, true);
		view.setInt32(4, tc.hi, true);
		return this.raw(chunk);
	}
	/**
	* Write a `int64` value, a signed 64-bit varint.
	*/
	int64(value) {
		let tc = protoInt64.enc(value);
		varint64write(tc.lo, tc.hi, this.buf);
		return this;
	}
	/**
	* Write a `sint64` value, a signed, zig-zag-encoded 64-bit varint.
	*/
	sint64(value) {
		const tc = protoInt64.enc(value), sign = tc.hi >> 31;
		varint64write(tc.lo << 1 ^ sign, (tc.hi << 1 | tc.lo >>> 31) ^ sign, this.buf);
		return this;
	}
	/**
	* Write a `uint64` value, an unsigned 64-bit varint.
	*/
	uint64(value) {
		const tc = protoInt64.uEnc(value);
		varint64write(tc.lo, tc.hi, this.buf);
		return this;
	}
};
var BinaryReader = class {
	constructor(buf, decodeUtf8 = getTextEncoding().decodeUtf8) {
		this.decodeUtf8 = decodeUtf8;
		this.varint64 = varint64read;
		/**
		* Read a `uint32` field, an unsigned 32 bit varint.
		*/
		this.uint32 = varint32read;
		this.buf = buf;
		this.len = buf.length;
		this.pos = 0;
		this.view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
	}
	/**
	* Reads a tag - field number and wire type.
	*/
	tag() {
		let tag = this.uint32(), fieldNo = tag >>> 3, wireType = tag & 7;
		if (fieldNo <= 0 || wireType < 0 || wireType > 5) throw new Error("illegal tag: field no " + fieldNo + " wire type " + wireType);
		return [fieldNo, wireType];
	}
	/**
	* Skip one element and return the skipped data.
	*
	* When skipping StartGroup, provide the tags field number to check for
	* matching field number in the EndGroup tag.
	*/
	skip(wireType, fieldNo) {
		let start = this.pos;
		switch (wireType) {
			case WireType.Varint:
				while (this.buf[this.pos++] & 128);
				break;
			case WireType.Bit64: this.pos += 4;
			case WireType.Bit32:
				this.pos += 4;
				break;
			case WireType.LengthDelimited:
				let len = this.uint32();
				this.pos += len;
				break;
			case WireType.StartGroup:
				for (;;) {
					const [fn, wt] = this.tag();
					if (wt === WireType.EndGroup) {
						if (fieldNo !== void 0 && fn !== fieldNo) throw new Error("invalid end group tag");
						break;
					}
					this.skip(wt, fn);
				}
				break;
			default: throw new Error("cant skip wire type " + wireType);
		}
		this.assertBounds();
		return this.buf.subarray(start, this.pos);
	}
	/**
	* Throws error if position in byte array is out of range.
	*/
	assertBounds() {
		if (this.pos > this.len) throw new RangeError("premature EOF");
	}
	/**
	* Read a `int32` field, a signed 32 bit varint.
	*/
	int32() {
		return this.uint32() | 0;
	}
	/**
	* Read a `sint32` field, a signed, zigzag-encoded 32-bit varint.
	*/
	sint32() {
		let zze = this.uint32();
		return zze >>> 1 ^ -(zze & 1);
	}
	/**
	* Read a `int64` field, a signed 64-bit varint.
	*/
	int64() {
		return protoInt64.dec(...this.varint64());
	}
	/**
	* Read a `uint64` field, an unsigned 64-bit varint.
	*/
	uint64() {
		return protoInt64.uDec(...this.varint64());
	}
	/**
	* Read a `sint64` field, a signed, zig-zag-encoded 64-bit varint.
	*/
	sint64() {
		let [lo, hi] = this.varint64();
		let s = -(lo & 1);
		lo = (lo >>> 1 | (hi & 1) << 31) ^ s;
		hi = hi >>> 1 ^ s;
		return protoInt64.dec(lo, hi);
	}
	/**
	* Read a `bool` field, a variant.
	*/
	bool() {
		let [lo, hi] = this.varint64();
		return lo !== 0 || hi !== 0;
	}
	/**
	* Read a `fixed32` field, an unsigned, fixed-length 32-bit integer.
	*/
	fixed32() {
		return this.view.getUint32((this.pos += 4) - 4, true);
	}
	/**
	* Read a `sfixed32` field, a signed, fixed-length 32-bit integer.
	*/
	sfixed32() {
		return this.view.getInt32((this.pos += 4) - 4, true);
	}
	/**
	* Read a `fixed64` field, an unsigned, fixed-length 64 bit integer.
	*/
	fixed64() {
		return protoInt64.uDec(this.sfixed32(), this.sfixed32());
	}
	/**
	* Read a `fixed64` field, a signed, fixed-length 64-bit integer.
	*/
	sfixed64() {
		return protoInt64.dec(this.sfixed32(), this.sfixed32());
	}
	/**
	* Read a `float` field, 32-bit floating point number.
	*/
	float() {
		return this.view.getFloat32((this.pos += 4) - 4, true);
	}
	/**
	* Read a `double` field, a 64-bit floating point number.
	*/
	double() {
		return this.view.getFloat64((this.pos += 8) - 8, true);
	}
	/**
	* Read a `bytes` field, length-delimited arbitrary data.
	*/
	bytes() {
		let len = this.uint32(), start = this.pos;
		this.pos += len;
		this.assertBounds();
		return this.buf.subarray(start, start + len);
	}
	/**
	* Read a `string` field, length-delimited data converted to UTF-8 text.
	*/
	string() {
		return this.decodeUtf8(this.bytes());
	}
};
/**
* Assert a valid signed protobuf 32-bit integer as a number or string.
*/
function assertInt32(arg) {
	if (typeof arg == "string") arg = Number(arg);
	else if (typeof arg != "number") throw new Error("invalid int32: " + typeof arg);
	if (!Number.isInteger(arg) || arg > 2147483647 || arg < -2147483648) throw new Error("invalid int32: " + arg);
}
/**
* Assert a valid unsigned protobuf 32-bit integer as a number or string.
*/
function assertUInt32(arg) {
	if (typeof arg == "string") arg = Number(arg);
	else if (typeof arg != "number") throw new Error("invalid uint32: " + typeof arg);
	if (!Number.isInteger(arg) || arg > 4294967295 || arg < 0) throw new Error("invalid uint32: " + arg);
}
/**
* Assert a valid protobuf float value as a number or string.
*/
function assertFloat32(arg) {
	if (typeof arg == "string") {
		const o = arg;
		arg = Number(arg);
		if (Number.isNaN(arg) && o !== "NaN") throw new Error("invalid float32: " + o);
	} else if (typeof arg != "number") throw new Error("invalid float32: " + typeof arg);
	if (Number.isFinite(arg) && (arg > 34028234663852886e22 || arg < -34028234663852886e22)) throw new Error("invalid float32: " + arg);
}
//#endregion
//#region generated/google/protobuf/struct.ts
function nullValueFromJSON(object) {
	switch (object) {
		case 0:
		case "NULL_VALUE": return 0;
		default: return -1;
	}
}
function nullValueToJSON(object) {
	switch (object) {
		case 0: return "NULL_VALUE";
		default: return "UNRECOGNIZED";
	}
}
function createBaseStruct() {
	return { fields: {} };
}
var Struct = {
	encode(message, writer = new BinaryWriter()) {
		globalThis.Object.entries(message.fields).forEach(([key, value]) => {
			if (value !== void 0) Struct_FieldsEntry.encode({
				key,
				value
			}, writer.uint32(10).fork()).join();
		});
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const end = length === void 0 ? reader.len : reader.pos + length;
		const message = createBaseStruct();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1: {
					if (tag !== 10) break;
					const entry1 = Struct_FieldsEntry.decode(reader, reader.uint32());
					if (entry1.value !== void 0) message.fields[entry1.key] = entry1.value;
					continue;
				}
			}
			if ((tag & 7) === 4 || tag === 0) break;
			reader.skip(tag & 7);
		}
		return message;
	},
	fromJSON(object) {
		return { fields: isObject$1(object.fields) ? globalThis.Object.entries(object.fields).reduce((acc, [key, value]) => {
			acc[key] = value;
			return acc;
		}, {}) : {} };
	},
	toJSON(message) {
		const obj = {};
		if (message.fields) {
			const entries = globalThis.Object.entries(message.fields);
			if (entries.length > 0) {
				obj.fields = {};
				entries.forEach(([k, v]) => {
					obj.fields[k] = v;
				});
			}
		}
		return obj;
	},
	create(base) {
		return Struct.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseStruct();
		message.fields = globalThis.Object.entries(object.fields ?? {}).reduce((acc, [key, value]) => {
			if (value !== void 0) acc[key] = value;
			return acc;
		}, {});
		return message;
	},
	wrap(object) {
		const struct = createBaseStruct();
		if (object !== void 0) for (const key of globalThis.Object.keys(object)) struct.fields[key] = object[key];
		return struct;
	},
	unwrap(message) {
		const object = {};
		if (message.fields) for (const key of globalThis.Object.keys(message.fields)) object[key] = message.fields[key];
		return object;
	}
};
function createBaseStruct_FieldsEntry() {
	return {
		key: "",
		value: void 0
	};
}
var Struct_FieldsEntry = {
	encode(message, writer = new BinaryWriter()) {
		if (message.key !== "") writer.uint32(10).string(message.key);
		if (message.value !== void 0) Value.encode(Value.wrap(message.value), writer.uint32(18).fork()).join();
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const end = length === void 0 ? reader.len : reader.pos + length;
		const message = createBaseStruct_FieldsEntry();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1:
					if (tag !== 10) break;
					message.key = reader.string();
					continue;
				case 2:
					if (tag !== 18) break;
					message.value = Value.unwrap(Value.decode(reader, reader.uint32()));
					continue;
			}
			if ((tag & 7) === 4 || tag === 0) break;
			reader.skip(tag & 7);
		}
		return message;
	},
	fromJSON(object) {
		return {
			key: isSet$1(object.key) ? globalThis.String(object.key) : "",
			value: isSet$1(object?.value) ? object.value : void 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.key !== "") obj.key = message.key;
		if (message.value !== void 0) obj.value = message.value;
		return obj;
	},
	create(base) {
		return Struct_FieldsEntry.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseStruct_FieldsEntry();
		message.key = object.key ?? "";
		message.value = object.value ?? void 0;
		return message;
	}
};
function createBaseValue() {
	return {
		nullValue: void 0,
		numberValue: void 0,
		stringValue: void 0,
		boolValue: void 0,
		structValue: void 0,
		listValue: void 0
	};
}
var Value = {
	encode(message, writer = new BinaryWriter()) {
		if (message.nullValue !== void 0) writer.uint32(8).int32(message.nullValue);
		if (message.numberValue !== void 0) writer.uint32(17).double(message.numberValue);
		if (message.stringValue !== void 0) writer.uint32(26).string(message.stringValue);
		if (message.boolValue !== void 0) writer.uint32(32).bool(message.boolValue);
		if (message.structValue !== void 0) Struct.encode(Struct.wrap(message.structValue), writer.uint32(42).fork()).join();
		if (message.listValue !== void 0) ListValue.encode(ListValue.wrap(message.listValue), writer.uint32(50).fork()).join();
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const end = length === void 0 ? reader.len : reader.pos + length;
		const message = createBaseValue();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1:
					if (tag !== 8) break;
					message.nullValue = reader.int32();
					continue;
				case 2:
					if (tag !== 17) break;
					message.numberValue = reader.double();
					continue;
				case 3:
					if (tag !== 26) break;
					message.stringValue = reader.string();
					continue;
				case 4:
					if (tag !== 32) break;
					message.boolValue = reader.bool();
					continue;
				case 5:
					if (tag !== 42) break;
					message.structValue = Struct.unwrap(Struct.decode(reader, reader.uint32()));
					continue;
				case 6:
					if (tag !== 50) break;
					message.listValue = ListValue.unwrap(ListValue.decode(reader, reader.uint32()));
					continue;
			}
			if ((tag & 7) === 4 || tag === 0) break;
			reader.skip(tag & 7);
		}
		return message;
	},
	fromJSON(object) {
		return {
			nullValue: isSet$1(object.nullValue) ? nullValueFromJSON(object.nullValue) : isSet$1(object.null_value) ? nullValueFromJSON(object.null_value) : void 0,
			numberValue: isSet$1(object.numberValue) ? globalThis.Number(object.numberValue) : isSet$1(object.number_value) ? globalThis.Number(object.number_value) : void 0,
			stringValue: isSet$1(object.stringValue) ? globalThis.String(object.stringValue) : isSet$1(object.string_value) ? globalThis.String(object.string_value) : void 0,
			boolValue: isSet$1(object.boolValue) ? globalThis.Boolean(object.boolValue) : isSet$1(object.bool_value) ? globalThis.Boolean(object.bool_value) : void 0,
			structValue: isObject$1(object.structValue) ? object.structValue : isObject$1(object.struct_value) ? object.struct_value : void 0,
			listValue: globalThis.Array.isArray(object.listValue) ? [...object.listValue] : globalThis.Array.isArray(object.list_value) ? [...object.list_value] : void 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.nullValue !== void 0) obj.nullValue = nullValueToJSON(message.nullValue);
		if (message.numberValue !== void 0) obj.numberValue = message.numberValue;
		if (message.stringValue !== void 0) obj.stringValue = message.stringValue;
		if (message.boolValue !== void 0) obj.boolValue = message.boolValue;
		if (message.structValue !== void 0) obj.structValue = message.structValue;
		if (message.listValue !== void 0) obj.listValue = message.listValue;
		return obj;
	},
	create(base) {
		return Value.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseValue();
		message.nullValue = object.nullValue ?? void 0;
		message.numberValue = object.numberValue ?? void 0;
		message.stringValue = object.stringValue ?? void 0;
		message.boolValue = object.boolValue ?? void 0;
		message.structValue = object.structValue ?? void 0;
		message.listValue = object.listValue ?? void 0;
		return message;
	},
	wrap(value) {
		const result = createBaseValue();
		if (value === null) result.nullValue = 0;
		else if (typeof value === "boolean") result.boolValue = value;
		else if (typeof value === "number") result.numberValue = value;
		else if (typeof value === "string") result.stringValue = value;
		else if (globalThis.Array.isArray(value)) result.listValue = value;
		else if (typeof value === "object") result.structValue = value;
		else if (typeof value !== "undefined") throw new globalThis.Error("Unsupported any value type: " + typeof value);
		return result;
	},
	unwrap(message) {
		if (message.stringValue !== void 0) return message.stringValue;
		else if (message?.numberValue !== void 0) return message.numberValue;
		else if (message?.boolValue !== void 0) return message.boolValue;
		else if (message?.structValue !== void 0) return message.structValue;
		else if (message?.listValue !== void 0) return message.listValue;
		else if (message?.nullValue !== void 0) return null;
	}
};
function createBaseListValue() {
	return { values: [] };
}
var ListValue = {
	encode(message, writer = new BinaryWriter()) {
		for (const v of message.values) Value.encode(Value.wrap(v), writer.uint32(10).fork()).join();
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const end = length === void 0 ? reader.len : reader.pos + length;
		const message = createBaseListValue();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1:
					if (tag !== 10) break;
					message.values.push(Value.unwrap(Value.decode(reader, reader.uint32())));
					continue;
			}
			if ((tag & 7) === 4 || tag === 0) break;
			reader.skip(tag & 7);
		}
		return message;
	},
	fromJSON(object) {
		return { values: globalThis.Array.isArray(object?.values) ? [...object.values] : [] };
	},
	toJSON(message) {
		const obj = {};
		if (message.values?.length) obj.values = message.values;
		return obj;
	},
	create(base) {
		return ListValue.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseListValue();
		message.values = object.values?.map((e) => e) || [];
		return message;
	},
	wrap(array) {
		const result = createBaseListValue();
		result.values = array ?? [];
		return result;
	},
	unwrap(message) {
		if (message?.hasOwnProperty("values") && globalThis.Array.isArray(message.values)) return message.values;
		else return message;
	}
};
function isObject$1(value) {
	return typeof value === "object" && value !== null;
}
function isSet$1(value) {
	return value !== null && value !== void 0;
}
//#endregion
//#region generated/driveningress/v2/driveningress.ts
var MessageType = /* @__PURE__ */ function(MessageType) {
	MessageType[MessageType["MESSAGE_UNSPECIFIED"] = 0] = "MESSAGE_UNSPECIFIED";
	/** MESSAGE_CLIENT_CONFIGURE_SESSION - 协商会话参数 */
	MessageType[MessageType["MESSAGE_CLIENT_CONFIGURE_SESSION"] = 1] = "MESSAGE_CLIENT_CONFIGURE_SESSION";
	/** MESSAGE_SERVER_CONFIRM_SESSION - 确认协商成功 */
	MessageType[MessageType["MESSAGE_SERVER_CONFIRM_SESSION"] = 2] = "MESSAGE_SERVER_CONFIRM_SESSION";
	MessageType[MessageType["MESSAGE_CLIENT_AUDIO_INPUT"] = 3] = "MESSAGE_CLIENT_AUDIO_INPUT";
	MessageType[MessageType["MESSAGE_SERVER_ERROR"] = 4] = "MESSAGE_SERVER_ERROR";
	MessageType[MessageType["MESSAGE_SERVER_RESPONSE_ANIMATION"] = 5] = "MESSAGE_SERVER_RESPONSE_ANIMATION";
	/** MESSAGE_CLIENT_DRIVEN_CONFIG - 驱动配置消息 */
	MessageType[MessageType["MESSAGE_CLIENT_DRIVEN_CONFIG"] = 6] = "MESSAGE_CLIENT_DRIVEN_CONFIG";
	/** MESSAGE_CLIENT_INTERRUPT - 打断 */
	MessageType[MessageType["MESSAGE_CLIENT_INTERRUPT"] = 7] = "MESSAGE_CLIENT_INTERRUPT";
	MessageType[MessageType["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
	return MessageType;
}({});
function messageTypeFromJSON(object) {
	switch (object) {
		case 0:
		case "MESSAGE_UNSPECIFIED": return 0;
		case 1:
		case "MESSAGE_CLIENT_CONFIGURE_SESSION": return 1;
		case 2:
		case "MESSAGE_SERVER_CONFIRM_SESSION": return 2;
		case 3:
		case "MESSAGE_CLIENT_AUDIO_INPUT": return 3;
		case 4:
		case "MESSAGE_SERVER_ERROR": return 4;
		case 5:
		case "MESSAGE_SERVER_RESPONSE_ANIMATION": return 5;
		case 6:
		case "MESSAGE_CLIENT_DRIVEN_CONFIG": return 6;
		case 7:
		case "MESSAGE_CLIENT_INTERRUPT": return 7;
		default: return -1;
	}
}
function messageTypeToJSON(object) {
	switch (object) {
		case 0: return "MESSAGE_UNSPECIFIED";
		case 1: return "MESSAGE_CLIENT_CONFIGURE_SESSION";
		case 2: return "MESSAGE_SERVER_CONFIRM_SESSION";
		case 3: return "MESSAGE_CLIENT_AUDIO_INPUT";
		case 4: return "MESSAGE_SERVER_ERROR";
		case 5: return "MESSAGE_SERVER_RESPONSE_ANIMATION";
		case 6: return "MESSAGE_CLIENT_DRIVEN_CONFIG";
		case 7: return "MESSAGE_CLIENT_INTERRUPT";
		default: return "UNRECOGNIZED";
	}
}
var AudioFormat = /* @__PURE__ */ function(AudioFormat) {
	AudioFormat[AudioFormat["AUDIO_FORMAT_PCM_S16LE"] = 0] = "AUDIO_FORMAT_PCM_S16LE";
	AudioFormat[AudioFormat["AUDIO_FORMAT_OGG_OPUS"] = 1] = "AUDIO_FORMAT_OGG_OPUS";
	AudioFormat[AudioFormat["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
	return AudioFormat;
}({});
function audioFormatFromJSON(object) {
	switch (object) {
		case 0:
		case "AUDIO_FORMAT_PCM_S16LE": return 0;
		case 1:
		case "AUDIO_FORMAT_OGG_OPUS": return 1;
		default: return -1;
	}
}
function audioFormatToJSON(object) {
	switch (object) {
		case 0: return "AUDIO_FORMAT_PCM_S16LE";
		case 1: return "AUDIO_FORMAT_OGG_OPUS";
		default: return "UNRECOGNIZED";
	}
}
var TransportCompression = /* @__PURE__ */ function(TransportCompression) {
	TransportCompression[TransportCompression["TRANSPORT_COMPRESSION_NONE"] = 0] = "TRANSPORT_COMPRESSION_NONE";
	TransportCompression[TransportCompression["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
	return TransportCompression;
}({});
function transportCompressionFromJSON(object) {
	switch (object) {
		case 0:
		case "TRANSPORT_COMPRESSION_NONE": return 0;
		default: return -1;
	}
}
function transportCompressionToJSON(object) {
	switch (object) {
		case 0: return "TRANSPORT_COMPRESSION_NONE";
		default: return "UNRECOGNIZED";
	}
}
/** EgressType specifies how animation and audio data should be delivered */
var EgressType = /* @__PURE__ */ function(EgressType) {
	/** EGRESS_TYPE_UNSPECIFIED - Default: return animation data via WebSocket */
	EgressType[EgressType["EGRESS_TYPE_UNSPECIFIED"] = 0] = "EGRESS_TYPE_UNSPECIFIED";
	/** EGRESS_TYPE_LIVEKIT - Stream to LiveKit room via egress service */
	EgressType[EgressType["EGRESS_TYPE_LIVEKIT"] = 1] = "EGRESS_TYPE_LIVEKIT";
	/** EGRESS_TYPE_AGORA - Stream to Agora channel via egress service */
	EgressType[EgressType["EGRESS_TYPE_AGORA"] = 2] = "EGRESS_TYPE_AGORA";
	EgressType[EgressType["UNRECOGNIZED"] = -1] = "UNRECOGNIZED";
	return EgressType;
}({});
function egressTypeFromJSON(object) {
	switch (object) {
		case 0:
		case "EGRESS_TYPE_UNSPECIFIED": return 0;
		case 1:
		case "EGRESS_TYPE_LIVEKIT": return 1;
		case 2:
		case "EGRESS_TYPE_AGORA": return 2;
		default: return -1;
	}
}
function egressTypeToJSON(object) {
	switch (object) {
		case 0: return "EGRESS_TYPE_UNSPECIFIED";
		case 1: return "EGRESS_TYPE_LIVEKIT";
		case 2: return "EGRESS_TYPE_AGORA";
		default: return "UNRECOGNIZED";
	}
}
function createBaseLiveKitEgressConfig() {
	return {
		url: "",
		apiKey: "",
		apiSecret: "",
		roomName: "",
		publisherId: "",
		extraAttributes: {},
		idleTimeout: 0,
		apiToken: ""
	};
}
var LiveKitEgressConfig = {
	encode(message, writer = new BinaryWriter()) {
		if (message.url !== "") writer.uint32(10).string(message.url);
		if (message.apiKey !== "") writer.uint32(18).string(message.apiKey);
		if (message.apiSecret !== "") writer.uint32(26).string(message.apiSecret);
		if (message.roomName !== "") writer.uint32(34).string(message.roomName);
		if (message.publisherId !== "") writer.uint32(42).string(message.publisherId);
		globalThis.Object.entries(message.extraAttributes).forEach(([key, value]) => {
			LiveKitEgressConfig_ExtraAttributesEntry.encode({
				key,
				value
			}, writer.uint32(50).fork()).join();
		});
		if (message.idleTimeout !== 0) writer.uint32(56).int32(message.idleTimeout);
		if (message.apiToken !== "") writer.uint32(66).string(message.apiToken);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const end = length === void 0 ? reader.len : reader.pos + length;
		const message = createBaseLiveKitEgressConfig();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1:
					if (tag !== 10) break;
					message.url = reader.string();
					continue;
				case 2:
					if (tag !== 18) break;
					message.apiKey = reader.string();
					continue;
				case 3:
					if (tag !== 26) break;
					message.apiSecret = reader.string();
					continue;
				case 4:
					if (tag !== 34) break;
					message.roomName = reader.string();
					continue;
				case 5:
					if (tag !== 42) break;
					message.publisherId = reader.string();
					continue;
				case 6: {
					if (tag !== 50) break;
					const entry6 = LiveKitEgressConfig_ExtraAttributesEntry.decode(reader, reader.uint32());
					if (entry6.value !== void 0) message.extraAttributes[entry6.key] = entry6.value;
					continue;
				}
				case 7:
					if (tag !== 56) break;
					message.idleTimeout = reader.int32();
					continue;
				case 8:
					if (tag !== 66) break;
					message.apiToken = reader.string();
					continue;
			}
			if ((tag & 7) === 4 || tag === 0) break;
			reader.skip(tag & 7);
		}
		return message;
	},
	fromJSON(object) {
		return {
			url: isSet(object.url) ? globalThis.String(object.url) : "",
			apiKey: isSet(object.apiKey) ? globalThis.String(object.apiKey) : isSet(object.api_key) ? globalThis.String(object.api_key) : "",
			apiSecret: isSet(object.apiSecret) ? globalThis.String(object.apiSecret) : isSet(object.api_secret) ? globalThis.String(object.api_secret) : "",
			roomName: isSet(object.roomName) ? globalThis.String(object.roomName) : isSet(object.room_name) ? globalThis.String(object.room_name) : "",
			publisherId: isSet(object.publisherId) ? globalThis.String(object.publisherId) : isSet(object.publisher_id) ? globalThis.String(object.publisher_id) : "",
			extraAttributes: isObject(object.extraAttributes) ? globalThis.Object.entries(object.extraAttributes).reduce((acc, [key, value]) => {
				acc[key] = globalThis.String(value);
				return acc;
			}, {}) : isObject(object.extra_attributes) ? globalThis.Object.entries(object.extra_attributes).reduce((acc, [key, value]) => {
				acc[key] = globalThis.String(value);
				return acc;
			}, {}) : {},
			idleTimeout: isSet(object.idleTimeout) ? globalThis.Number(object.idleTimeout) : isSet(object.idle_timeout) ? globalThis.Number(object.idle_timeout) : 0,
			apiToken: isSet(object.apiToken) ? globalThis.String(object.apiToken) : isSet(object.api_token) ? globalThis.String(object.api_token) : ""
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.url !== "") obj.url = message.url;
		if (message.apiKey !== "") obj.apiKey = message.apiKey;
		if (message.apiSecret !== "") obj.apiSecret = message.apiSecret;
		if (message.roomName !== "") obj.roomName = message.roomName;
		if (message.publisherId !== "") obj.publisherId = message.publisherId;
		if (message.extraAttributes) {
			const entries = globalThis.Object.entries(message.extraAttributes);
			if (entries.length > 0) {
				obj.extraAttributes = {};
				entries.forEach(([k, v]) => {
					obj.extraAttributes[k] = v;
				});
			}
		}
		if (message.idleTimeout !== 0) obj.idleTimeout = Math.round(message.idleTimeout);
		if (message.apiToken !== "") obj.apiToken = message.apiToken;
		return obj;
	},
	create(base) {
		return LiveKitEgressConfig.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseLiveKitEgressConfig();
		message.url = object.url ?? "";
		message.apiKey = object.apiKey ?? "";
		message.apiSecret = object.apiSecret ?? "";
		message.roomName = object.roomName ?? "";
		message.publisherId = object.publisherId ?? "";
		message.extraAttributes = globalThis.Object.entries(object.extraAttributes ?? {}).reduce((acc, [key, value]) => {
			if (value !== void 0) acc[key] = globalThis.String(value);
			return acc;
		}, {});
		message.idleTimeout = object.idleTimeout ?? 0;
		message.apiToken = object.apiToken ?? "";
		return message;
	}
};
function createBaseLiveKitEgressConfig_ExtraAttributesEntry() {
	return {
		key: "",
		value: ""
	};
}
var LiveKitEgressConfig_ExtraAttributesEntry = {
	encode(message, writer = new BinaryWriter()) {
		if (message.key !== "") writer.uint32(10).string(message.key);
		if (message.value !== "") writer.uint32(18).string(message.value);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const end = length === void 0 ? reader.len : reader.pos + length;
		const message = createBaseLiveKitEgressConfig_ExtraAttributesEntry();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1:
					if (tag !== 10) break;
					message.key = reader.string();
					continue;
				case 2:
					if (tag !== 18) break;
					message.value = reader.string();
					continue;
			}
			if ((tag & 7) === 4 || tag === 0) break;
			reader.skip(tag & 7);
		}
		return message;
	},
	fromJSON(object) {
		return {
			key: isSet(object.key) ? globalThis.String(object.key) : "",
			value: isSet(object.value) ? globalThis.String(object.value) : ""
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.key !== "") obj.key = message.key;
		if (message.value !== "") obj.value = message.value;
		return obj;
	},
	create(base) {
		return LiveKitEgressConfig_ExtraAttributesEntry.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseLiveKitEgressConfig_ExtraAttributesEntry();
		message.key = object.key ?? "";
		message.value = object.value ?? "";
		return message;
	}
};
function createBaseAgoraEgressConfig() {
	return {
		channelName: "",
		token: "",
		uid: 0,
		publisherId: ""
	};
}
var AgoraEgressConfig = {
	encode(message, writer = new BinaryWriter()) {
		if (message.channelName !== "") writer.uint32(10).string(message.channelName);
		if (message.token !== "") writer.uint32(18).string(message.token);
		if (message.uid !== 0) writer.uint32(24).uint32(message.uid);
		if (message.publisherId !== "") writer.uint32(34).string(message.publisherId);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const end = length === void 0 ? reader.len : reader.pos + length;
		const message = createBaseAgoraEgressConfig();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1:
					if (tag !== 10) break;
					message.channelName = reader.string();
					continue;
				case 2:
					if (tag !== 18) break;
					message.token = reader.string();
					continue;
				case 3:
					if (tag !== 24) break;
					message.uid = reader.uint32();
					continue;
				case 4:
					if (tag !== 34) break;
					message.publisherId = reader.string();
					continue;
			}
			if ((tag & 7) === 4 || tag === 0) break;
			reader.skip(tag & 7);
		}
		return message;
	},
	fromJSON(object) {
		return {
			channelName: isSet(object.channelName) ? globalThis.String(object.channelName) : isSet(object.channel_name) ? globalThis.String(object.channel_name) : "",
			token: isSet(object.token) ? globalThis.String(object.token) : "",
			uid: isSet(object.uid) ? globalThis.Number(object.uid) : 0,
			publisherId: isSet(object.publisherId) ? globalThis.String(object.publisherId) : isSet(object.publisher_id) ? globalThis.String(object.publisher_id) : ""
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.channelName !== "") obj.channelName = message.channelName;
		if (message.token !== "") obj.token = message.token;
		if (message.uid !== 0) obj.uid = Math.round(message.uid);
		if (message.publisherId !== "") obj.publisherId = message.publisherId;
		return obj;
	},
	create(base) {
		return AgoraEgressConfig.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseAgoraEgressConfig();
		message.channelName = object.channelName ?? "";
		message.token = object.token ?? "";
		message.uid = object.uid ?? 0;
		message.publisherId = object.publisherId ?? "";
		return message;
	}
};
function createBaseDrivenIngressConfig() {
	return {
		shapeNpy: /* @__PURE__ */ new Uint8Array(0),
		styleNpy: /* @__PURE__ */ new Uint8Array(0),
		drivenServerUrl: "",
		modelSettings: void 0,
		encoderStartFrame: 0
	};
}
var DrivenIngressConfig = {
	encode(message, writer = new BinaryWriter()) {
		if (message.shapeNpy.length !== 0) writer.uint32(10).bytes(message.shapeNpy);
		if (message.styleNpy.length !== 0) writer.uint32(18).bytes(message.styleNpy);
		if (message.drivenServerUrl !== "") writer.uint32(26).string(message.drivenServerUrl);
		if (message.modelSettings !== void 0) Struct.encode(Struct.wrap(message.modelSettings), writer.uint32(34).fork()).join();
		if (message.encoderStartFrame !== 0) writer.uint32(40).int32(message.encoderStartFrame);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const end = length === void 0 ? reader.len : reader.pos + length;
		const message = createBaseDrivenIngressConfig();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1:
					if (tag !== 10) break;
					message.shapeNpy = reader.bytes();
					continue;
				case 2:
					if (tag !== 18) break;
					message.styleNpy = reader.bytes();
					continue;
				case 3:
					if (tag !== 26) break;
					message.drivenServerUrl = reader.string();
					continue;
				case 4:
					if (tag !== 34) break;
					message.modelSettings = Struct.unwrap(Struct.decode(reader, reader.uint32()));
					continue;
				case 5:
					if (tag !== 40) break;
					message.encoderStartFrame = reader.int32();
					continue;
			}
			if ((tag & 7) === 4 || tag === 0) break;
			reader.skip(tag & 7);
		}
		return message;
	},
	fromJSON(object) {
		return {
			shapeNpy: isSet(object.shapeNpy) ? bytesFromBase64(object.shapeNpy) : isSet(object.shape_npy) ? bytesFromBase64(object.shape_npy) : /* @__PURE__ */ new Uint8Array(0),
			styleNpy: isSet(object.styleNpy) ? bytesFromBase64(object.styleNpy) : isSet(object.style_npy) ? bytesFromBase64(object.style_npy) : /* @__PURE__ */ new Uint8Array(0),
			drivenServerUrl: isSet(object.drivenServerUrl) ? globalThis.String(object.drivenServerUrl) : isSet(object.driven_server_url) ? globalThis.String(object.driven_server_url) : "",
			modelSettings: isObject(object.modelSettings) ? object.modelSettings : isObject(object.model_settings) ? object.model_settings : void 0,
			encoderStartFrame: isSet(object.encoderStartFrame) ? globalThis.Number(object.encoderStartFrame) : isSet(object.encoder_start_frame) ? globalThis.Number(object.encoder_start_frame) : 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.shapeNpy.length !== 0) obj.shapeNpy = base64FromBytes(message.shapeNpy);
		if (message.styleNpy.length !== 0) obj.styleNpy = base64FromBytes(message.styleNpy);
		if (message.drivenServerUrl !== "") obj.drivenServerUrl = message.drivenServerUrl;
		if (message.modelSettings !== void 0) obj.modelSettings = message.modelSettings;
		if (message.encoderStartFrame !== 0) obj.encoderStartFrame = Math.round(message.encoderStartFrame);
		return obj;
	},
	create(base) {
		return DrivenIngressConfig.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseDrivenIngressConfig();
		message.shapeNpy = object.shapeNpy ?? /* @__PURE__ */ new Uint8Array(0);
		message.styleNpy = object.styleNpy ?? /* @__PURE__ */ new Uint8Array(0);
		message.drivenServerUrl = object.drivenServerUrl ?? "";
		message.modelSettings = object.modelSettings ?? void 0;
		message.encoderStartFrame = object.encoderStartFrame ?? 0;
		return message;
	}
};
function createBaseClientConfigureSession() {
	return {
		sampleRate: 0,
		bitrate: 0,
		audioFormat: 0,
		transportCompression: 0,
		egressType: 0,
		livekitEgress: void 0,
		agoraEgress: void 0
	};
}
var ClientConfigureSession = {
	encode(message, writer = new BinaryWriter()) {
		if (message.sampleRate !== 0) writer.uint32(8).int32(message.sampleRate);
		if (message.bitrate !== 0) writer.uint32(16).int32(message.bitrate);
		if (message.audioFormat !== 0) writer.uint32(24).int32(message.audioFormat);
		if (message.transportCompression !== 0) writer.uint32(32).int32(message.transportCompression);
		if (message.egressType !== 0) writer.uint32(40).int32(message.egressType);
		if (message.livekitEgress !== void 0) LiveKitEgressConfig.encode(message.livekitEgress, writer.uint32(50).fork()).join();
		if (message.agoraEgress !== void 0) AgoraEgressConfig.encode(message.agoraEgress, writer.uint32(58).fork()).join();
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const end = length === void 0 ? reader.len : reader.pos + length;
		const message = createBaseClientConfigureSession();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1:
					if (tag !== 8) break;
					message.sampleRate = reader.int32();
					continue;
				case 2:
					if (tag !== 16) break;
					message.bitrate = reader.int32();
					continue;
				case 3:
					if (tag !== 24) break;
					message.audioFormat = reader.int32();
					continue;
				case 4:
					if (tag !== 32) break;
					message.transportCompression = reader.int32();
					continue;
				case 5:
					if (tag !== 40) break;
					message.egressType = reader.int32();
					continue;
				case 6:
					if (tag !== 50) break;
					message.livekitEgress = LiveKitEgressConfig.decode(reader, reader.uint32());
					continue;
				case 7:
					if (tag !== 58) break;
					message.agoraEgress = AgoraEgressConfig.decode(reader, reader.uint32());
					continue;
			}
			if ((tag & 7) === 4 || tag === 0) break;
			reader.skip(tag & 7);
		}
		return message;
	},
	fromJSON(object) {
		return {
			sampleRate: isSet(object.sampleRate) ? globalThis.Number(object.sampleRate) : isSet(object.sample_rate) ? globalThis.Number(object.sample_rate) : 0,
			bitrate: isSet(object.bitrate) ? globalThis.Number(object.bitrate) : 0,
			audioFormat: isSet(object.audioFormat) ? audioFormatFromJSON(object.audioFormat) : isSet(object.audio_format) ? audioFormatFromJSON(object.audio_format) : 0,
			transportCompression: isSet(object.transportCompression) ? transportCompressionFromJSON(object.transportCompression) : isSet(object.transport_compression) ? transportCompressionFromJSON(object.transport_compression) : 0,
			egressType: isSet(object.egressType) ? egressTypeFromJSON(object.egressType) : isSet(object.egress_type) ? egressTypeFromJSON(object.egress_type) : 0,
			livekitEgress: isSet(object.livekitEgress) ? LiveKitEgressConfig.fromJSON(object.livekitEgress) : isSet(object.livekit_egress) ? LiveKitEgressConfig.fromJSON(object.livekit_egress) : void 0,
			agoraEgress: isSet(object.agoraEgress) ? AgoraEgressConfig.fromJSON(object.agoraEgress) : isSet(object.agora_egress) ? AgoraEgressConfig.fromJSON(object.agora_egress) : void 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.sampleRate !== 0) obj.sampleRate = Math.round(message.sampleRate);
		if (message.bitrate !== 0) obj.bitrate = Math.round(message.bitrate);
		if (message.audioFormat !== 0) obj.audioFormat = audioFormatToJSON(message.audioFormat);
		if (message.transportCompression !== 0) obj.transportCompression = transportCompressionToJSON(message.transportCompression);
		if (message.egressType !== 0) obj.egressType = egressTypeToJSON(message.egressType);
		if (message.livekitEgress !== void 0) obj.livekitEgress = LiveKitEgressConfig.toJSON(message.livekitEgress);
		if (message.agoraEgress !== void 0) obj.agoraEgress = AgoraEgressConfig.toJSON(message.agoraEgress);
		return obj;
	},
	create(base) {
		return ClientConfigureSession.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseClientConfigureSession();
		message.sampleRate = object.sampleRate ?? 0;
		message.bitrate = object.bitrate ?? 0;
		message.audioFormat = object.audioFormat ?? 0;
		message.transportCompression = object.transportCompression ?? 0;
		message.egressType = object.egressType ?? 0;
		message.livekitEgress = object.livekitEgress !== void 0 && object.livekitEgress !== null ? LiveKitEgressConfig.fromPartial(object.livekitEgress) : void 0;
		message.agoraEgress = object.agoraEgress !== void 0 && object.agoraEgress !== null ? AgoraEgressConfig.fromPartial(object.agoraEgress) : void 0;
		return message;
	}
};
function createBaseServerConfirmSession() {
	return { connectionId: "" };
}
var ServerConfirmSession = {
	encode(message, writer = new BinaryWriter()) {
		if (message.connectionId !== "") writer.uint32(10).string(message.connectionId);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const end = length === void 0 ? reader.len : reader.pos + length;
		const message = createBaseServerConfirmSession();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1:
					if (tag !== 10) break;
					message.connectionId = reader.string();
					continue;
			}
			if ((tag & 7) === 4 || tag === 0) break;
			reader.skip(tag & 7);
		}
		return message;
	},
	fromJSON(object) {
		return { connectionId: isSet(object.connectionId) ? globalThis.String(object.connectionId) : isSet(object.connection_id) ? globalThis.String(object.connection_id) : "" };
	},
	toJSON(message) {
		const obj = {};
		if (message.connectionId !== "") obj.connectionId = message.connectionId;
		return obj;
	},
	create(base) {
		return ServerConfirmSession.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseServerConfirmSession();
		message.connectionId = object.connectionId ?? "";
		return message;
	}
};
function createBaseTraceContext() {
	return {
		traceparent: "",
		tracestate: ""
	};
}
var TraceContext = {
	encode(message, writer = new BinaryWriter()) {
		if (message.traceparent !== "") writer.uint32(10).string(message.traceparent);
		if (message.tracestate !== "") writer.uint32(18).string(message.tracestate);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const end = length === void 0 ? reader.len : reader.pos + length;
		const message = createBaseTraceContext();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1:
					if (tag !== 10) break;
					message.traceparent = reader.string();
					continue;
				case 2:
					if (tag !== 18) break;
					message.tracestate = reader.string();
					continue;
			}
			if ((tag & 7) === 4 || tag === 0) break;
			reader.skip(tag & 7);
		}
		return message;
	},
	fromJSON(object) {
		return {
			traceparent: isSet(object.traceparent) ? globalThis.String(object.traceparent) : "",
			tracestate: isSet(object.tracestate) ? globalThis.String(object.tracestate) : ""
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.traceparent !== "") obj.traceparent = message.traceparent;
		if (message.tracestate !== "") obj.tracestate = message.tracestate;
		return obj;
	},
	create(base) {
		return TraceContext.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseTraceContext();
		message.traceparent = object.traceparent ?? "";
		message.tracestate = object.tracestate ?? "";
		return message;
	}
};
function createBaseClientAudioInput() {
	return {
		reqId: "",
		end: false,
		audio: /* @__PURE__ */ new Uint8Array(0),
		traceContext: void 0
	};
}
var ClientAudioInput = {
	encode(message, writer = new BinaryWriter()) {
		if (message.reqId !== "") writer.uint32(10).string(message.reqId);
		if (message.end !== false) writer.uint32(16).bool(message.end);
		if (message.audio.length !== 0) writer.uint32(26).bytes(message.audio);
		if (message.traceContext !== void 0) TraceContext.encode(message.traceContext, writer.uint32(34).fork()).join();
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const end = length === void 0 ? reader.len : reader.pos + length;
		const message = createBaseClientAudioInput();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1:
					if (tag !== 10) break;
					message.reqId = reader.string();
					continue;
				case 2:
					if (tag !== 16) break;
					message.end = reader.bool();
					continue;
				case 3:
					if (tag !== 26) break;
					message.audio = reader.bytes();
					continue;
				case 4:
					if (tag !== 34) break;
					message.traceContext = TraceContext.decode(reader, reader.uint32());
					continue;
			}
			if ((tag & 7) === 4 || tag === 0) break;
			reader.skip(tag & 7);
		}
		return message;
	},
	fromJSON(object) {
		return {
			reqId: isSet(object.reqId) ? globalThis.String(object.reqId) : isSet(object.req_id) ? globalThis.String(object.req_id) : "",
			end: isSet(object.end) ? globalThis.Boolean(object.end) : false,
			audio: isSet(object.audio) ? bytesFromBase64(object.audio) : /* @__PURE__ */ new Uint8Array(0),
			traceContext: isSet(object.traceContext) ? TraceContext.fromJSON(object.traceContext) : isSet(object.trace_context) ? TraceContext.fromJSON(object.trace_context) : void 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.reqId !== "") obj.reqId = message.reqId;
		if (message.end !== false) obj.end = message.end;
		if (message.audio.length !== 0) obj.audio = base64FromBytes(message.audio);
		if (message.traceContext !== void 0) obj.traceContext = TraceContext.toJSON(message.traceContext);
		return obj;
	},
	create(base) {
		return ClientAudioInput.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseClientAudioInput();
		message.reqId = object.reqId ?? "";
		message.end = object.end ?? false;
		message.audio = object.audio ?? /* @__PURE__ */ new Uint8Array(0);
		message.traceContext = object.traceContext !== void 0 && object.traceContext !== null ? TraceContext.fromPartial(object.traceContext) : void 0;
		return message;
	}
};
function createBaseServerError() {
	return {
		connectionId: "",
		reqId: "",
		code: 0,
		message: ""
	};
}
var ServerError = {
	encode(message, writer = new BinaryWriter()) {
		if (message.connectionId !== "") writer.uint32(10).string(message.connectionId);
		if (message.reqId !== "") writer.uint32(18).string(message.reqId);
		if (message.code !== 0) writer.uint32(24).int32(message.code);
		if (message.message !== "") writer.uint32(34).string(message.message);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const end = length === void 0 ? reader.len : reader.pos + length;
		const message = createBaseServerError();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1:
					if (tag !== 10) break;
					message.connectionId = reader.string();
					continue;
				case 2:
					if (tag !== 18) break;
					message.reqId = reader.string();
					continue;
				case 3:
					if (tag !== 24) break;
					message.code = reader.int32();
					continue;
				case 4:
					if (tag !== 34) break;
					message.message = reader.string();
					continue;
			}
			if ((tag & 7) === 4 || tag === 0) break;
			reader.skip(tag & 7);
		}
		return message;
	},
	fromJSON(object) {
		return {
			connectionId: isSet(object.connectionId) ? globalThis.String(object.connectionId) : isSet(object.connection_id) ? globalThis.String(object.connection_id) : "",
			reqId: isSet(object.reqId) ? globalThis.String(object.reqId) : isSet(object.req_id) ? globalThis.String(object.req_id) : "",
			code: isSet(object.code) ? globalThis.Number(object.code) : 0,
			message: isSet(object.message) ? globalThis.String(object.message) : ""
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.connectionId !== "") obj.connectionId = message.connectionId;
		if (message.reqId !== "") obj.reqId = message.reqId;
		if (message.code !== 0) obj.code = Math.round(message.code);
		if (message.message !== "") obj.message = message.message;
		return obj;
	},
	create(base) {
		return ServerError.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseServerError();
		message.connectionId = object.connectionId ?? "";
		message.reqId = object.reqId ?? "";
		message.code = object.code ?? 0;
		message.message = object.message ?? "";
		return message;
	}
};
function createBaseFlame() {
	return {
		translation: [],
		rotation: [],
		neckPose: [],
		jawPose: [],
		eyePose: [],
		eyeLid: [],
		expression: []
	};
}
var Flame = {
	encode(message, writer = new BinaryWriter()) {
		writer.uint32(10).fork();
		for (const v of message.translation) writer.float(v);
		writer.join();
		writer.uint32(18).fork();
		for (const v of message.rotation) writer.float(v);
		writer.join();
		writer.uint32(26).fork();
		for (const v of message.neckPose) writer.float(v);
		writer.join();
		writer.uint32(34).fork();
		for (const v of message.jawPose) writer.float(v);
		writer.join();
		writer.uint32(42).fork();
		for (const v of message.eyePose) writer.float(v);
		writer.join();
		writer.uint32(50).fork();
		for (const v of message.eyeLid) writer.float(v);
		writer.join();
		writer.uint32(58).fork();
		for (const v of message.expression) writer.float(v);
		writer.join();
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const end = length === void 0 ? reader.len : reader.pos + length;
		const message = createBaseFlame();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1:
					if (tag === 13) {
						message.translation.push(reader.float());
						continue;
					}
					if (tag === 10) {
						const end2 = reader.uint32() + reader.pos;
						while (reader.pos < end2) message.translation.push(reader.float());
						continue;
					}
					break;
				case 2:
					if (tag === 21) {
						message.rotation.push(reader.float());
						continue;
					}
					if (tag === 18) {
						const end2 = reader.uint32() + reader.pos;
						while (reader.pos < end2) message.rotation.push(reader.float());
						continue;
					}
					break;
				case 3:
					if (tag === 29) {
						message.neckPose.push(reader.float());
						continue;
					}
					if (tag === 26) {
						const end2 = reader.uint32() + reader.pos;
						while (reader.pos < end2) message.neckPose.push(reader.float());
						continue;
					}
					break;
				case 4:
					if (tag === 37) {
						message.jawPose.push(reader.float());
						continue;
					}
					if (tag === 34) {
						const end2 = reader.uint32() + reader.pos;
						while (reader.pos < end2) message.jawPose.push(reader.float());
						continue;
					}
					break;
				case 5:
					if (tag === 45) {
						message.eyePose.push(reader.float());
						continue;
					}
					if (tag === 42) {
						const end2 = reader.uint32() + reader.pos;
						while (reader.pos < end2) message.eyePose.push(reader.float());
						continue;
					}
					break;
				case 6:
					if (tag === 53) {
						message.eyeLid.push(reader.float());
						continue;
					}
					if (tag === 50) {
						const end2 = reader.uint32() + reader.pos;
						while (reader.pos < end2) message.eyeLid.push(reader.float());
						continue;
					}
					break;
				case 7:
					if (tag === 61) {
						message.expression.push(reader.float());
						continue;
					}
					if (tag === 58) {
						const end2 = reader.uint32() + reader.pos;
						while (reader.pos < end2) message.expression.push(reader.float());
						continue;
					}
					break;
			}
			if ((tag & 7) === 4 || tag === 0) break;
			reader.skip(tag & 7);
		}
		return message;
	},
	fromJSON(object) {
		return {
			translation: globalThis.Array.isArray(object?.translation) ? object.translation.map((e) => globalThis.Number(e)) : [],
			rotation: globalThis.Array.isArray(object?.rotation) ? object.rotation.map((e) => globalThis.Number(e)) : [],
			neckPose: globalThis.Array.isArray(object?.neckPose) ? object.neckPose.map((e) => globalThis.Number(e)) : globalThis.Array.isArray(object?.neck_pose) ? object.neck_pose.map((e) => globalThis.Number(e)) : [],
			jawPose: globalThis.Array.isArray(object?.jawPose) ? object.jawPose.map((e) => globalThis.Number(e)) : globalThis.Array.isArray(object?.jaw_pose) ? object.jaw_pose.map((e) => globalThis.Number(e)) : [],
			eyePose: globalThis.Array.isArray(object?.eyePose) ? object.eyePose.map((e) => globalThis.Number(e)) : globalThis.Array.isArray(object?.eye_pose) ? object.eye_pose.map((e) => globalThis.Number(e)) : [],
			eyeLid: globalThis.Array.isArray(object?.eyeLid) ? object.eyeLid.map((e) => globalThis.Number(e)) : globalThis.Array.isArray(object?.eye_lid) ? object.eye_lid.map((e) => globalThis.Number(e)) : [],
			expression: globalThis.Array.isArray(object?.expression) ? object.expression.map((e) => globalThis.Number(e)) : []
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.translation?.length) obj.translation = message.translation;
		if (message.rotation?.length) obj.rotation = message.rotation;
		if (message.neckPose?.length) obj.neckPose = message.neckPose;
		if (message.jawPose?.length) obj.jawPose = message.jawPose;
		if (message.eyePose?.length) obj.eyePose = message.eyePose;
		if (message.eyeLid?.length) obj.eyeLid = message.eyeLid;
		if (message.expression?.length) obj.expression = message.expression;
		return obj;
	},
	create(base) {
		return Flame.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseFlame();
		message.translation = object.translation?.map((e) => e) || [];
		message.rotation = object.rotation?.map((e) => e) || [];
		message.neckPose = object.neckPose?.map((e) => e) || [];
		message.jawPose = object.jawPose?.map((e) => e) || [];
		message.eyePose = object.eyePose?.map((e) => e) || [];
		message.eyeLid = object.eyeLid?.map((e) => e) || [];
		message.expression = object.expression?.map((e) => e) || [];
		return message;
	}
};
function createBaseFlameAnimation() {
	return { keyframes: [] };
}
var FlameAnimation = {
	encode(message, writer = new BinaryWriter()) {
		for (const v of message.keyframes) Flame.encode(v, writer.uint32(10).fork()).join();
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const end = length === void 0 ? reader.len : reader.pos + length;
		const message = createBaseFlameAnimation();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1:
					if (tag !== 10) break;
					message.keyframes.push(Flame.decode(reader, reader.uint32()));
					continue;
			}
			if ((tag & 7) === 4 || tag === 0) break;
			reader.skip(tag & 7);
		}
		return message;
	},
	fromJSON(object) {
		return { keyframes: globalThis.Array.isArray(object?.keyframes) ? object.keyframes.map((e) => Flame.fromJSON(e)) : [] };
	},
	toJSON(message) {
		const obj = {};
		if (message.keyframes?.length) obj.keyframes = message.keyframes.map((e) => Flame.toJSON(e));
		return obj;
	},
	create(base) {
		return FlameAnimation.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseFlameAnimation();
		message.keyframes = object.keyframes?.map((e) => Flame.fromPartial(e)) || [];
		return message;
	}
};
function createBaseServerResponseAnimation() {
	return {
		connectionId: "",
		reqId: "",
		end: false,
		animation: void 0,
		avatarId: "",
		traceContext: void 0
	};
}
var ServerResponseAnimation = {
	encode(message, writer = new BinaryWriter()) {
		if (message.connectionId !== "") writer.uint32(10).string(message.connectionId);
		if (message.reqId !== "") writer.uint32(18).string(message.reqId);
		if (message.end !== false) writer.uint32(24).bool(message.end);
		if (message.animation !== void 0) FlameAnimation.encode(message.animation, writer.uint32(34).fork()).join();
		if (message.avatarId !== "") writer.uint32(42).string(message.avatarId);
		if (message.traceContext !== void 0) TraceContext.encode(message.traceContext, writer.uint32(50).fork()).join();
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const end = length === void 0 ? reader.len : reader.pos + length;
		const message = createBaseServerResponseAnimation();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1:
					if (tag !== 10) break;
					message.connectionId = reader.string();
					continue;
				case 2:
					if (tag !== 18) break;
					message.reqId = reader.string();
					continue;
				case 3:
					if (tag !== 24) break;
					message.end = reader.bool();
					continue;
				case 4:
					if (tag !== 34) break;
					message.animation = FlameAnimation.decode(reader, reader.uint32());
					continue;
				case 5:
					if (tag !== 42) break;
					message.avatarId = reader.string();
					continue;
				case 6:
					if (tag !== 50) break;
					message.traceContext = TraceContext.decode(reader, reader.uint32());
					continue;
			}
			if ((tag & 7) === 4 || tag === 0) break;
			reader.skip(tag & 7);
		}
		return message;
	},
	fromJSON(object) {
		return {
			connectionId: isSet(object.connectionId) ? globalThis.String(object.connectionId) : isSet(object.connection_id) ? globalThis.String(object.connection_id) : "",
			reqId: isSet(object.reqId) ? globalThis.String(object.reqId) : isSet(object.req_id) ? globalThis.String(object.req_id) : "",
			end: isSet(object.end) ? globalThis.Boolean(object.end) : false,
			animation: isSet(object.animation) ? FlameAnimation.fromJSON(object.animation) : void 0,
			avatarId: isSet(object.avatarId) ? globalThis.String(object.avatarId) : isSet(object.avatar_id) ? globalThis.String(object.avatar_id) : "",
			traceContext: isSet(object.traceContext) ? TraceContext.fromJSON(object.traceContext) : isSet(object.trace_context) ? TraceContext.fromJSON(object.trace_context) : void 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.connectionId !== "") obj.connectionId = message.connectionId;
		if (message.reqId !== "") obj.reqId = message.reqId;
		if (message.end !== false) obj.end = message.end;
		if (message.animation !== void 0) obj.animation = FlameAnimation.toJSON(message.animation);
		if (message.avatarId !== "") obj.avatarId = message.avatarId;
		if (message.traceContext !== void 0) obj.traceContext = TraceContext.toJSON(message.traceContext);
		return obj;
	},
	create(base) {
		return ServerResponseAnimation.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseServerResponseAnimation();
		message.connectionId = object.connectionId ?? "";
		message.reqId = object.reqId ?? "";
		message.end = object.end ?? false;
		message.animation = object.animation !== void 0 && object.animation !== null ? FlameAnimation.fromPartial(object.animation) : void 0;
		message.avatarId = object.avatarId ?? "";
		message.traceContext = object.traceContext !== void 0 && object.traceContext !== null ? TraceContext.fromPartial(object.traceContext) : void 0;
		return message;
	}
};
function createBaseClientInterrupt() {
	return { reqId: "" };
}
var ClientInterrupt = {
	encode(message, writer = new BinaryWriter()) {
		if (message.reqId !== "") writer.uint32(10).string(message.reqId);
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const end = length === void 0 ? reader.len : reader.pos + length;
		const message = createBaseClientInterrupt();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1:
					if (tag !== 10) break;
					message.reqId = reader.string();
					continue;
			}
			if ((tag & 7) === 4 || tag === 0) break;
			reader.skip(tag & 7);
		}
		return message;
	},
	fromJSON(object) {
		return { reqId: isSet(object.reqId) ? globalThis.String(object.reqId) : isSet(object.req_id) ? globalThis.String(object.req_id) : "" };
	},
	toJSON(message) {
		const obj = {};
		if (message.reqId !== "") obj.reqId = message.reqId;
		return obj;
	},
	create(base) {
		return ClientInterrupt.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseClientInterrupt();
		message.reqId = object.reqId ?? "";
		return message;
	}
};
function createBaseMessage() {
	return {
		type: 0,
		clientConfigureSession: void 0,
		serverConfirmSession: void 0,
		clientAudioInput: void 0,
		serverError: void 0,
		serverResponseAnimation: void 0,
		drivenConfig: void 0,
		clientInterrupt: void 0
	};
}
var Message = {
	encode(message, writer = new BinaryWriter()) {
		if (message.type !== 0) writer.uint32(8).int32(message.type);
		if (message.clientConfigureSession !== void 0) ClientConfigureSession.encode(message.clientConfigureSession, writer.uint32(18).fork()).join();
		if (message.serverConfirmSession !== void 0) ServerConfirmSession.encode(message.serverConfirmSession, writer.uint32(26).fork()).join();
		if (message.clientAudioInput !== void 0) ClientAudioInput.encode(message.clientAudioInput, writer.uint32(34).fork()).join();
		if (message.serverError !== void 0) ServerError.encode(message.serverError, writer.uint32(42).fork()).join();
		if (message.serverResponseAnimation !== void 0) ServerResponseAnimation.encode(message.serverResponseAnimation, writer.uint32(50).fork()).join();
		if (message.drivenConfig !== void 0) DrivenIngressConfig.encode(message.drivenConfig, writer.uint32(58).fork()).join();
		if (message.clientInterrupt !== void 0) ClientInterrupt.encode(message.clientInterrupt, writer.uint32(66).fork()).join();
		return writer;
	},
	decode(input, length) {
		const reader = input instanceof BinaryReader ? input : new BinaryReader(input);
		const end = length === void 0 ? reader.len : reader.pos + length;
		const message = createBaseMessage();
		while (reader.pos < end) {
			const tag = reader.uint32();
			switch (tag >>> 3) {
				case 1:
					if (tag !== 8) break;
					message.type = reader.int32();
					continue;
				case 2:
					if (tag !== 18) break;
					message.clientConfigureSession = ClientConfigureSession.decode(reader, reader.uint32());
					continue;
				case 3:
					if (tag !== 26) break;
					message.serverConfirmSession = ServerConfirmSession.decode(reader, reader.uint32());
					continue;
				case 4:
					if (tag !== 34) break;
					message.clientAudioInput = ClientAudioInput.decode(reader, reader.uint32());
					continue;
				case 5:
					if (tag !== 42) break;
					message.serverError = ServerError.decode(reader, reader.uint32());
					continue;
				case 6:
					if (tag !== 50) break;
					message.serverResponseAnimation = ServerResponseAnimation.decode(reader, reader.uint32());
					continue;
				case 7:
					if (tag !== 58) break;
					message.drivenConfig = DrivenIngressConfig.decode(reader, reader.uint32());
					continue;
				case 8:
					if (tag !== 66) break;
					message.clientInterrupt = ClientInterrupt.decode(reader, reader.uint32());
					continue;
			}
			if ((tag & 7) === 4 || tag === 0) break;
			reader.skip(tag & 7);
		}
		return message;
	},
	fromJSON(object) {
		return {
			type: isSet(object.type) ? messageTypeFromJSON(object.type) : 0,
			clientConfigureSession: isSet(object.clientConfigureSession) ? ClientConfigureSession.fromJSON(object.clientConfigureSession) : isSet(object.client_configure_session) ? ClientConfigureSession.fromJSON(object.client_configure_session) : void 0,
			serverConfirmSession: isSet(object.serverConfirmSession) ? ServerConfirmSession.fromJSON(object.serverConfirmSession) : isSet(object.server_confirm_session) ? ServerConfirmSession.fromJSON(object.server_confirm_session) : void 0,
			clientAudioInput: isSet(object.clientAudioInput) ? ClientAudioInput.fromJSON(object.clientAudioInput) : isSet(object.client_audio_input) ? ClientAudioInput.fromJSON(object.client_audio_input) : void 0,
			serverError: isSet(object.serverError) ? ServerError.fromJSON(object.serverError) : isSet(object.server_error) ? ServerError.fromJSON(object.server_error) : void 0,
			serverResponseAnimation: isSet(object.serverResponseAnimation) ? ServerResponseAnimation.fromJSON(object.serverResponseAnimation) : isSet(object.server_response_animation) ? ServerResponseAnimation.fromJSON(object.server_response_animation) : void 0,
			drivenConfig: isSet(object.drivenConfig) ? DrivenIngressConfig.fromJSON(object.drivenConfig) : isSet(object.driven_config) ? DrivenIngressConfig.fromJSON(object.driven_config) : void 0,
			clientInterrupt: isSet(object.clientInterrupt) ? ClientInterrupt.fromJSON(object.clientInterrupt) : isSet(object.client_interrupt) ? ClientInterrupt.fromJSON(object.client_interrupt) : void 0
		};
	},
	toJSON(message) {
		const obj = {};
		if (message.type !== 0) obj.type = messageTypeToJSON(message.type);
		if (message.clientConfigureSession !== void 0) obj.clientConfigureSession = ClientConfigureSession.toJSON(message.clientConfigureSession);
		if (message.serverConfirmSession !== void 0) obj.serverConfirmSession = ServerConfirmSession.toJSON(message.serverConfirmSession);
		if (message.clientAudioInput !== void 0) obj.clientAudioInput = ClientAudioInput.toJSON(message.clientAudioInput);
		if (message.serverError !== void 0) obj.serverError = ServerError.toJSON(message.serverError);
		if (message.serverResponseAnimation !== void 0) obj.serverResponseAnimation = ServerResponseAnimation.toJSON(message.serverResponseAnimation);
		if (message.drivenConfig !== void 0) obj.drivenConfig = DrivenIngressConfig.toJSON(message.drivenConfig);
		if (message.clientInterrupt !== void 0) obj.clientInterrupt = ClientInterrupt.toJSON(message.clientInterrupt);
		return obj;
	},
	create(base) {
		return Message.fromPartial(base ?? {});
	},
	fromPartial(object) {
		const message = createBaseMessage();
		message.type = object.type ?? 0;
		message.clientConfigureSession = object.clientConfigureSession !== void 0 && object.clientConfigureSession !== null ? ClientConfigureSession.fromPartial(object.clientConfigureSession) : void 0;
		message.serverConfirmSession = object.serverConfirmSession !== void 0 && object.serverConfirmSession !== null ? ServerConfirmSession.fromPartial(object.serverConfirmSession) : void 0;
		message.clientAudioInput = object.clientAudioInput !== void 0 && object.clientAudioInput !== null ? ClientAudioInput.fromPartial(object.clientAudioInput) : void 0;
		message.serverError = object.serverError !== void 0 && object.serverError !== null ? ServerError.fromPartial(object.serverError) : void 0;
		message.serverResponseAnimation = object.serverResponseAnimation !== void 0 && object.serverResponseAnimation !== null ? ServerResponseAnimation.fromPartial(object.serverResponseAnimation) : void 0;
		message.drivenConfig = object.drivenConfig !== void 0 && object.drivenConfig !== null ? DrivenIngressConfig.fromPartial(object.drivenConfig) : void 0;
		message.clientInterrupt = object.clientInterrupt !== void 0 && object.clientInterrupt !== null ? ClientInterrupt.fromPartial(object.clientInterrupt) : void 0;
		return message;
	}
};
function bytesFromBase64(b64) {
	const bin = globalThis.atob(b64);
	const arr = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; ++i) arr[i] = bin.charCodeAt(i);
	return arr;
}
function base64FromBytes(arr) {
	const bin = [];
	arr.forEach((byte) => {
		bin.push(globalThis.String.fromCharCode(byte));
	});
	return globalThis.btoa(bin.join(""));
}
function isObject(value) {
	return typeof value === "object" && value !== null;
}
function isSet(value) {
	return value !== null && value !== void 0;
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace-base/build/esm/enums.js
var ExceptionEventName = "exception";
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace-base/build/esm/Span.js
/**
* This class represents a span.
*/
var SpanImpl = class {
	_spanContext;
	kind;
	parentSpanContext;
	attributes = {};
	links = [];
	events = [];
	startTime;
	resource;
	instrumentationScope;
	_droppedAttributesCount = 0;
	_droppedEventsCount = 0;
	_droppedLinksCount = 0;
	_attributesCount = 0;
	name;
	status = { code: SpanStatusCode.UNSET };
	endTime = [0, 0];
	_ended = false;
	_duration = [-1, -1];
	_spanProcessor;
	_spanLimits;
	_attributeValueLengthLimit;
	_recordEndMetrics;
	_performanceStartTime;
	_performanceOffset;
	_startTimeProvided;
	/**
	* Constructs a new SpanImpl instance.
	*/
	constructor(opts) {
		const now = Date.now();
		this._spanContext = opts.spanContext;
		this._performanceStartTime = otperformance.now();
		this._performanceOffset = now - (this._performanceStartTime + otperformance.timeOrigin);
		this._startTimeProvided = opts.startTime != null;
		this._spanLimits = opts.spanLimits;
		this._attributeValueLengthLimit = this._spanLimits.attributeValueLengthLimit ?? 0;
		this._spanProcessor = opts.spanProcessor;
		this.name = opts.name;
		this.parentSpanContext = opts.parentSpanContext;
		this.kind = opts.kind;
		if (opts.links) for (const link of opts.links) this.addLink(link);
		this.startTime = this._getTime(opts.startTime ?? now);
		this.resource = opts.resource;
		this.instrumentationScope = opts.scope;
		this._recordEndMetrics = opts.recordEndMetrics;
		if (opts.attributes != null) this.setAttributes(opts.attributes);
		this._spanProcessor.onStart(this, opts.context);
	}
	spanContext() {
		return this._spanContext;
	}
	setAttribute(key, value) {
		if (value == null || this._isSpanEnded()) return this;
		if (key.length === 0) {
			diag.warn(`Invalid attribute key: ${key}`);
			return this;
		}
		if (!isAttributeValue(value)) {
			diag.warn(`Invalid attribute value set for key: ${key}`);
			return this;
		}
		const { attributeCountLimit } = this._spanLimits;
		const isNewKey = !Object.prototype.hasOwnProperty.call(this.attributes, key);
		if (attributeCountLimit !== void 0 && this._attributesCount >= attributeCountLimit && isNewKey) {
			this._droppedAttributesCount++;
			return this;
		}
		this.attributes[key] = this._truncateToSize(value);
		if (isNewKey) this._attributesCount++;
		return this;
	}
	setAttributes(attributes) {
		for (const key in attributes) if (Object.prototype.hasOwnProperty.call(attributes, key)) this.setAttribute(key, attributes[key]);
		return this;
	}
	/**
	*
	* @param name Span Name
	* @param [attributesOrStartTime] Span attributes or start time
	*     if type is {@type TimeInput} and 3rd param is undefined
	* @param [timeStamp] Specified time stamp for the event
	*/
	addEvent(name, attributesOrStartTime, timeStamp) {
		if (this._isSpanEnded()) return this;
		const { eventCountLimit } = this._spanLimits;
		if (eventCountLimit === 0) {
			diag.warn("No events allowed.");
			this._droppedEventsCount++;
			return this;
		}
		if (eventCountLimit !== void 0 && this.events.length >= eventCountLimit) {
			if (this._droppedEventsCount === 0) diag.debug("Dropping extra events.");
			this.events.shift();
			this._droppedEventsCount++;
		}
		if (isTimeInput(attributesOrStartTime)) {
			if (!isTimeInput(timeStamp)) timeStamp = attributesOrStartTime;
			attributesOrStartTime = void 0;
		}
		const sanitized = sanitizeAttributes(attributesOrStartTime);
		const { attributePerEventCountLimit } = this._spanLimits;
		const attributes = {};
		let droppedAttributesCount = 0;
		let eventAttributesCount = 0;
		for (const attr in sanitized) {
			if (!Object.prototype.hasOwnProperty.call(sanitized, attr)) continue;
			const attrVal = sanitized[attr];
			if (attributePerEventCountLimit !== void 0 && eventAttributesCount >= attributePerEventCountLimit) {
				droppedAttributesCount++;
				continue;
			}
			attributes[attr] = this._truncateToSize(attrVal);
			eventAttributesCount++;
		}
		this.events.push({
			name,
			attributes,
			time: this._getTime(timeStamp),
			droppedAttributesCount
		});
		return this;
	}
	addLink(link) {
		if (this._isSpanEnded()) return this;
		const { linkCountLimit } = this._spanLimits;
		if (linkCountLimit === 0) {
			this._droppedLinksCount++;
			return this;
		}
		if (linkCountLimit !== void 0 && this.links.length >= linkCountLimit) {
			if (this._droppedLinksCount === 0) diag.debug("Dropping extra links.");
			this.links.shift();
			this._droppedLinksCount++;
		}
		const { attributePerLinkCountLimit } = this._spanLimits;
		const sanitized = sanitizeAttributes(link.attributes);
		const attributes = {};
		let droppedAttributesCount = 0;
		let linkAttributesCount = 0;
		for (const attr in sanitized) {
			if (!Object.prototype.hasOwnProperty.call(sanitized, attr)) continue;
			const attrVal = sanitized[attr];
			if (attributePerLinkCountLimit !== void 0 && linkAttributesCount >= attributePerLinkCountLimit) {
				droppedAttributesCount++;
				continue;
			}
			attributes[attr] = this._truncateToSize(attrVal);
			linkAttributesCount++;
		}
		const processedLink = { context: link.context };
		if (linkAttributesCount > 0) processedLink.attributes = attributes;
		if (droppedAttributesCount > 0) processedLink.droppedAttributesCount = droppedAttributesCount;
		this.links.push(processedLink);
		return this;
	}
	addLinks(links) {
		for (const link of links) this.addLink(link);
		return this;
	}
	setStatus(status) {
		if (this._isSpanEnded()) return this;
		if (status.code === SpanStatusCode.UNSET) return this;
		if (this.status.code === SpanStatusCode.OK) return this;
		const newStatus = { code: status.code };
		if (status.code === SpanStatusCode.ERROR) {
			if (typeof status.message === "string") newStatus.message = status.message;
			else if (status.message != null) diag.warn(`Dropping invalid status.message of type '${typeof status.message}', expected 'string'`);
		}
		this.status = newStatus;
		return this;
	}
	updateName(name) {
		if (this._isSpanEnded()) return this;
		this.name = name;
		return this;
	}
	end(endTime) {
		if (this._isSpanEnded()) {
			diag.error(`${this.name} ${this._spanContext.traceId}-${this._spanContext.spanId} - You can only call end() on a span once.`);
			return;
		}
		this.endTime = this._getTime(endTime);
		this._duration = hrTimeDuration(this.startTime, this.endTime);
		if (this._duration[0] < 0) {
			diag.warn("Inconsistent start and end time, startTime > endTime. Setting span duration to 0ms.", this.startTime, this.endTime);
			this.endTime = this.startTime.slice();
			this._duration = [0, 0];
		}
		if (this._droppedEventsCount > 0) diag.warn(`Dropped ${this._droppedEventsCount} events because eventCountLimit reached`);
		if (this._droppedLinksCount > 0) diag.warn(`Dropped ${this._droppedLinksCount} links because linkCountLimit reached`);
		if (this._spanProcessor.onEnding) this._spanProcessor.onEnding(this);
		this._recordEndMetrics?.();
		this._ended = true;
		this._spanProcessor.onEnd(this);
	}
	_getTime(inp) {
		if (typeof inp === "number" && inp <= otperformance.now()) return hrTime(inp + this._performanceOffset);
		if (typeof inp === "number") return millisToHrTime(inp);
		if (inp instanceof Date) return millisToHrTime(inp.getTime());
		if (isTimeInputHrTime(inp)) return inp;
		if (this._startTimeProvided) return millisToHrTime(Date.now());
		const msDuration = otperformance.now() - this._performanceStartTime;
		return addHrTimes(this.startTime, millisToHrTime(msDuration));
	}
	isRecording() {
		return this._ended === false;
	}
	recordException(exception, time) {
		const attributes = {};
		if (typeof exception === "string") attributes[ATTR_EXCEPTION_MESSAGE] = exception;
		else if (exception) {
			if (exception.code) attributes[ATTR_EXCEPTION_TYPE] = exception.code.toString();
			else if (exception.name) attributes[ATTR_EXCEPTION_TYPE] = exception.name;
			if (exception.message) attributes[ATTR_EXCEPTION_MESSAGE] = exception.message;
			if (exception.stack) attributes[ATTR_EXCEPTION_STACKTRACE] = exception.stack;
		}
		if (attributes["exception.type"] || attributes["exception.message"]) this.addEvent(ExceptionEventName, attributes, time);
		else diag.warn(`Failed to record an exception ${exception}`);
	}
	get duration() {
		return this._duration;
	}
	get ended() {
		return this._ended;
	}
	get droppedAttributesCount() {
		return this._droppedAttributesCount;
	}
	get droppedEventsCount() {
		return this._droppedEventsCount;
	}
	get droppedLinksCount() {
		return this._droppedLinksCount;
	}
	_isSpanEnded() {
		if (this._ended) {
			const error = /* @__PURE__ */ new Error(`Operation attempted on ended Span {traceId: ${this._spanContext.traceId}, spanId: ${this._spanContext.spanId}}`);
			diag.warn(`Cannot execute the operation on ended Span {traceId: ${this._spanContext.traceId}, spanId: ${this._spanContext.spanId}}`, error);
		}
		return this._ended;
	}
	_truncateToLimitUtil(value, limit) {
		if (value.length <= limit) return value;
		return value.substring(0, limit);
	}
	/**
	* If the given attribute value is of type string and has more characters than given {@code attributeValueLengthLimit} then
	* return string with truncated to {@code attributeValueLengthLimit} characters
	*
	* If the given attribute value is array of strings then
	* return new array of strings with each element truncated to {@code attributeValueLengthLimit} characters
	*
	* Otherwise return same Attribute {@code value}
	*
	* @param value Attribute value
	* @returns truncated attribute value if required, otherwise same value
	*/
	_truncateToSize(value) {
		const limit = this._attributeValueLengthLimit;
		if (limit <= 0) {
			diag.warn(`Attribute value limit must be positive, got ${limit}`);
			return value;
		}
		if (typeof value === "string") return this._truncateToLimitUtil(value, limit);
		if (Array.isArray(value)) return value.map((val) => typeof val === "string" ? this._truncateToLimitUtil(val, limit) : val);
		return value;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace-base/build/esm/Sampler.js
/**
* A sampling decision that determines how a {@link Span} will be recorded
* and collected.
*/
var SamplingDecision;
(function(SamplingDecision) {
	/**
	* `Span.isRecording() === false`, span will not be recorded and all events
	* and attributes will be dropped.
	*/
	SamplingDecision[SamplingDecision["NOT_RECORD"] = 0] = "NOT_RECORD";
	/**
	* `Span.isRecording() === true`, but `Sampled` flag in {@link TraceFlags}
	* MUST NOT be set.
	*/
	SamplingDecision[SamplingDecision["RECORD"] = 1] = "RECORD";
	/**
	* `Span.isRecording() === true` AND `Sampled` flag in {@link TraceFlags}
	* MUST be set.
	*/
	SamplingDecision[SamplingDecision["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
})(SamplingDecision || (SamplingDecision = {}));
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace-base/build/esm/sampler/AlwaysOffSampler.js
/** Sampler that samples no traces. */
var AlwaysOffSampler = class {
	shouldSample() {
		return { decision: SamplingDecision.NOT_RECORD };
	}
	toString() {
		return "AlwaysOffSampler";
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace-base/build/esm/sampler/AlwaysOnSampler.js
/** Sampler that samples all traces. */
var AlwaysOnSampler = class {
	shouldSample() {
		return { decision: SamplingDecision.RECORD_AND_SAMPLED };
	}
	toString() {
		return "AlwaysOnSampler";
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace-base/build/esm/sampler/ParentBasedSampler.js
/**
* A composite sampler that either respects the parent span's sampling decision
* or delegates to `delegateSampler` for root spans.
*/
var ParentBasedSampler = class {
	_root;
	_remoteParentSampled;
	_remoteParentNotSampled;
	_localParentSampled;
	_localParentNotSampled;
	constructor(config) {
		this._root = config.root;
		if (!this._root) {
			globalErrorHandler(/* @__PURE__ */ new Error("ParentBasedSampler must have a root sampler configured"));
			this._root = new AlwaysOnSampler();
		}
		this._remoteParentSampled = config.remoteParentSampled ?? new AlwaysOnSampler();
		this._remoteParentNotSampled = config.remoteParentNotSampled ?? new AlwaysOffSampler();
		this._localParentSampled = config.localParentSampled ?? new AlwaysOnSampler();
		this._localParentNotSampled = config.localParentNotSampled ?? new AlwaysOffSampler();
	}
	shouldSample(context, traceId, spanName, spanKind, attributes, links) {
		const parentContext = trace.getSpanContext(context);
		if (!parentContext || !isSpanContextValid(parentContext)) return this._root.shouldSample(context, traceId, spanName, spanKind, attributes, links);
		if (parentContext.isRemote) {
			if (parentContext.traceFlags & TraceFlags.SAMPLED) return this._remoteParentSampled.shouldSample(context, traceId, spanName, spanKind, attributes, links);
			return this._remoteParentNotSampled.shouldSample(context, traceId, spanName, spanKind, attributes, links);
		}
		if (parentContext.traceFlags & TraceFlags.SAMPLED) return this._localParentSampled.shouldSample(context, traceId, spanName, spanKind, attributes, links);
		return this._localParentNotSampled.shouldSample(context, traceId, spanName, spanKind, attributes, links);
	}
	toString() {
		return `ParentBased{root=${this._root.toString()}, remoteParentSampled=${this._remoteParentSampled.toString()}, remoteParentNotSampled=${this._remoteParentNotSampled.toString()}, localParentSampled=${this._localParentSampled.toString()}, localParentNotSampled=${this._localParentNotSampled.toString()}}`;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace-base/build/esm/sampler/TraceIdRatioBasedSampler.js
/** Sampler that samples a given fraction of traces based of trace id deterministically. */
var TraceIdRatioBasedSampler = class {
	_ratio;
	_upperBound;
	constructor(ratio = 0) {
		this._ratio = this._normalize(ratio);
		this._upperBound = Math.floor(this._ratio * 4294967295);
	}
	shouldSample(context, traceId) {
		return { decision: isValidTraceId(traceId) && this._accumulate(traceId) < this._upperBound ? SamplingDecision.RECORD_AND_SAMPLED : SamplingDecision.NOT_RECORD };
	}
	toString() {
		return `TraceIdRatioBased{${this._ratio}}`;
	}
	_normalize(ratio) {
		if (typeof ratio !== "number" || isNaN(ratio)) return 0;
		return ratio >= 1 ? 1 : ratio <= 0 ? 0 : ratio;
	}
	_accumulate(traceId) {
		let accumulation = 0;
		for (let i = 0; i < 32; i += 8) {
			let part = 0;
			for (let j = 0; j < 8; j++) {
				const c = traceId.charCodeAt(i + j);
				const v = c < 58 ? c - 48 : c < 71 ? c - 55 : c - 87;
				part = part << 4 | v;
			}
			accumulation = (accumulation ^ part) >>> 0;
		}
		return accumulation;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace-base/build/esm/config.js
var TracesSamplerValues;
(function(TracesSamplerValues) {
	TracesSamplerValues["AlwaysOff"] = "always_off";
	TracesSamplerValues["AlwaysOn"] = "always_on";
	TracesSamplerValues["ParentBasedAlwaysOff"] = "parentbased_always_off";
	TracesSamplerValues["ParentBasedAlwaysOn"] = "parentbased_always_on";
	TracesSamplerValues["ParentBasedTraceIdRatio"] = "parentbased_traceidratio";
	TracesSamplerValues["TraceIdRatio"] = "traceidratio";
})(TracesSamplerValues || (TracesSamplerValues = {}));
var DEFAULT_RATIO = 1;
/**
* Load default configuration. For fields with primitive values, any user-provided
* value will override the corresponding default value. For fields with
* non-primitive values (like `spanLimits`), the user-provided value will be
* used to extend the default value.
*/
function loadDefaultConfig() {
	return {
		sampler: buildSamplerFromEnv(),
		forceFlushTimeoutMillis: 3e4,
		generalLimits: {
			attributeValueLengthLimit: Infinity,
			attributeCountLimit: 128
		},
		spanLimits: {
			attributeValueLengthLimit: Infinity,
			attributeCountLimit: 128,
			linkCountLimit: 128,
			eventCountLimit: 128,
			attributePerEventCountLimit: 128,
			attributePerLinkCountLimit: 128
		}
	};
}
/**
* Based on environment, builds a sampler, complies with specification.
*/
function buildSamplerFromEnv() {
	const sampler = TracesSamplerValues.ParentBasedAlwaysOn;
	switch (sampler) {
		case TracesSamplerValues.AlwaysOn: return new AlwaysOnSampler();
		case TracesSamplerValues.AlwaysOff: return new AlwaysOffSampler();
		case TracesSamplerValues.ParentBasedAlwaysOn: return new ParentBasedSampler({ root: new AlwaysOnSampler() });
		case TracesSamplerValues.ParentBasedAlwaysOff: return new ParentBasedSampler({ root: new AlwaysOffSampler() });
		case TracesSamplerValues.TraceIdRatio: return new TraceIdRatioBasedSampler(getSamplerProbabilityFromEnv());
		case TracesSamplerValues.ParentBasedTraceIdRatio: return new ParentBasedSampler({ root: new TraceIdRatioBasedSampler(getSamplerProbabilityFromEnv()) });
		default:
			diag.error(`OTEL_TRACES_SAMPLER value "${sampler}" invalid, defaulting to "${TracesSamplerValues.ParentBasedAlwaysOn}".`);
			return new ParentBasedSampler({ root: new AlwaysOnSampler() });
	}
}
function getSamplerProbabilityFromEnv() {
	diag.error(`OTEL_TRACES_SAMPLER_ARG is blank, defaulting to ${DEFAULT_RATIO}.`);
	return DEFAULT_RATIO;
}
/**
* Function to merge Default configuration (as specified in './config') with
* user provided configurations.
*/
function mergeConfig(userConfig) {
	const perInstanceDefaults = { sampler: buildSamplerFromEnv() };
	const DEFAULT_CONFIG = loadDefaultConfig();
	const target = Object.assign({}, DEFAULT_CONFIG, perInstanceDefaults, userConfig);
	target.generalLimits = Object.assign({}, DEFAULT_CONFIG.generalLimits, userConfig.generalLimits || {});
	target.spanLimits = Object.assign({}, DEFAULT_CONFIG.spanLimits, userConfig.spanLimits || {});
	return target;
}
/**
* When general limits are provided and model specific limits are not,
* configures the model specific limits by using the values from the general ones.
* @param userConfig User provided tracer configuration
*/
function reconfigureLimits(userConfig) {
	const spanLimits = Object.assign({}, userConfig.spanLimits);
	/**
	* Reassign span attribute count limit to use first non null value defined by user or use default value
	*/
	spanLimits.attributeCountLimit = userConfig.spanLimits?.attributeCountLimit ?? userConfig.generalLimits?.attributeCountLimit ?? void 0 ?? void 0 ?? 128;
	/**
	* Reassign span attribute value length limit to use first non null value defined by user or use default value
	*/
	spanLimits.attributeValueLengthLimit = userConfig.spanLimits?.attributeValueLengthLimit ?? userConfig.generalLimits?.attributeValueLengthLimit ?? void 0 ?? void 0 ?? Infinity;
	return Object.assign({}, userConfig, { spanLimits });
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace-base/build/esm/export/BatchSpanProcessorBase.js
/**
* Implementation of the {@link SpanProcessor} that batches spans exported by
* the SDK then pushes them to the exporter pipeline.
*/
var BatchSpanProcessorBase = class {
	_maxExportBatchSize;
	_maxQueueSize;
	_scheduledDelayMillis;
	_exportTimeoutMillis;
	_exporter;
	_isExporting = false;
	_finishedSpans = [];
	_timer;
	_shutdownOnce;
	_droppedSpansCount = 0;
	constructor(exporter, config) {
		this._exporter = exporter;
		this._maxExportBatchSize = typeof config?.maxExportBatchSize === "number" ? config.maxExportBatchSize : 512;
		this._maxQueueSize = typeof config?.maxQueueSize === "number" ? config.maxQueueSize : 2048;
		this._scheduledDelayMillis = typeof config?.scheduledDelayMillis === "number" ? config.scheduledDelayMillis : 5e3;
		this._exportTimeoutMillis = typeof config?.exportTimeoutMillis === "number" ? config.exportTimeoutMillis : 3e4;
		this._shutdownOnce = new BindOnceFuture(this._shutdown, this);
		if (this._maxExportBatchSize > this._maxQueueSize) {
			diag.warn("BatchSpanProcessor: maxExportBatchSize must be smaller or equal to maxQueueSize, setting maxExportBatchSize to match maxQueueSize");
			this._maxExportBatchSize = this._maxQueueSize;
		}
	}
	forceFlush() {
		if (this._shutdownOnce.isCalled) return this._shutdownOnce.promise;
		return this._flushAll();
	}
	onStart(_span, _parentContext) {}
	onEnd(span) {
		if (this._shutdownOnce.isCalled) return;
		if ((span.spanContext().traceFlags & TraceFlags.SAMPLED) === 0) return;
		this._addToBuffer(span);
	}
	shutdown() {
		return this._shutdownOnce.call();
	}
	_shutdown() {
		return Promise.resolve().then(() => {
			return this.onShutdown();
		}).then(() => {
			return this._flushAll();
		}).then(() => {
			return this._exporter.shutdown();
		});
	}
	/** Add a span in the buffer. */
	_addToBuffer(span) {
		if (this._finishedSpans.length >= this._maxQueueSize) {
			if (this._droppedSpansCount === 0) diag.debug("maxQueueSize reached, dropping spans");
			this._droppedSpansCount++;
			return;
		}
		if (this._droppedSpansCount > 0) {
			diag.warn(`Dropped ${this._droppedSpansCount} spans because maxQueueSize reached`);
			this._droppedSpansCount = 0;
		}
		this._finishedSpans.push(span);
		this._maybeStartTimer();
	}
	/**
	* Send all spans to the exporter respecting the batch size limit
	* This function is used only on forceFlush or shutdown,
	* for all other cases _flush should be used
	* */
	_flushAll() {
		return new Promise((resolve, reject) => {
			const promises = [];
			const count = Math.ceil(this._finishedSpans.length / this._maxExportBatchSize);
			for (let i = 0, j = count; i < j; i++) promises.push(this._flushOneBatch());
			Promise.all(promises).then(() => {
				resolve();
			}).catch(reject);
		});
	}
	_flushOneBatch() {
		this._clearTimer();
		if (this._finishedSpans.length === 0) return Promise.resolve();
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				reject(/* @__PURE__ */ new Error("Timeout"));
			}, this._exportTimeoutMillis);
			context.with(suppressTracing(context.active()), () => {
				let spans;
				if (this._finishedSpans.length <= this._maxExportBatchSize) {
					spans = this._finishedSpans;
					this._finishedSpans = [];
				} else spans = this._finishedSpans.splice(0, this._maxExportBatchSize);
				const doExport = () => this._exporter.export(spans, (result) => {
					clearTimeout(timer);
					if (result.code === ExportResultCode.SUCCESS) resolve();
					else reject(result.error ?? /* @__PURE__ */ new Error("BatchSpanProcessor: span export failed"));
				});
				let pendingResources = null;
				for (let i = 0, len = spans.length; i < len; i++) {
					const span = spans[i];
					if (span.resource.asyncAttributesPending && span.resource.waitForAsyncAttributes) {
						pendingResources ??= [];
						pendingResources.push(span.resource.waitForAsyncAttributes());
					}
				}
				if (pendingResources === null) doExport();
				else Promise.all(pendingResources).then(doExport, (err) => {
					globalErrorHandler(err);
					reject(err);
				});
			});
		});
	}
	_maybeStartTimer() {
		if (this._isExporting) return;
		const flush = () => {
			this._isExporting = true;
			this._flushOneBatch().finally(() => {
				this._isExporting = false;
				if (this._finishedSpans.length > 0) {
					this._clearTimer();
					this._maybeStartTimer();
				}
			}).catch((e) => {
				this._isExporting = false;
				globalErrorHandler(e);
			});
		};
		if (this._finishedSpans.length >= this._maxExportBatchSize) return flush();
		if (this._timer !== void 0) return;
		this._timer = setTimeout(() => flush(), this._scheduledDelayMillis);
		if (typeof this._timer !== "number") this._timer.unref();
	}
	_clearTimer() {
		if (this._timer !== void 0) {
			clearTimeout(this._timer);
			this._timer = void 0;
		}
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace-base/build/esm/platform/browser/export/BatchSpanProcessor.js
var BatchSpanProcessor = class extends BatchSpanProcessorBase {
	_visibilityChangeListener;
	_pageHideListener;
	constructor(_exporter, config) {
		super(_exporter, config);
		this.onInit(config);
	}
	onInit(config) {
		if (config?.disableAutoFlushOnDocumentHide !== true && typeof document !== "undefined") {
			this._visibilityChangeListener = () => {
				if (document.visibilityState === "hidden") this.forceFlush().catch((error) => {
					globalErrorHandler(error);
				});
			};
			this._pageHideListener = () => {
				this.forceFlush().catch((error) => {
					globalErrorHandler(error);
				});
			};
			document.addEventListener("visibilitychange", this._visibilityChangeListener);
			document.addEventListener("pagehide", this._pageHideListener);
		}
	}
	onShutdown() {
		if (typeof document !== "undefined") {
			if (this._visibilityChangeListener) document.removeEventListener("visibilitychange", this._visibilityChangeListener);
			if (this._pageHideListener) document.removeEventListener("pagehide", this._pageHideListener);
		}
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace-base/build/esm/platform/browser/RandomIdGenerator.js
var TRACE_ID_BYTES = 16;
var SPAN_ID_BYTES = 8;
var TRACE_BUFFER = new Uint8Array(TRACE_ID_BYTES);
var SPAN_BUFFER = new Uint8Array(SPAN_ID_BYTES);
var HEX = Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, "0"));
/**
* Fills buffer with random bytes, ensuring at least one is non-zero
* per W3C Trace Context spec.
*/
function randomFill(buf) {
	for (let i = 0; i < buf.length; i++) buf[i] = Math.random() * 256 >>> 0;
	for (let i = 0; i < buf.length; i++) if (buf[i] > 0) return;
	buf[buf.length - 1] = 1;
}
function toHex(buf) {
	let hex = "";
	for (let i = 0; i < buf.length; i++) hex += HEX[buf[i]];
	return hex;
}
var RandomIdGenerator = class {
	/**
	* Returns a random 16-byte trace ID formatted/encoded as a 32 lowercase hex
	* characters corresponding to 128 bits.
	*/
	generateTraceId() {
		randomFill(TRACE_BUFFER);
		return toHex(TRACE_BUFFER);
	}
	/**
	* Returns a random 8-byte span ID formatted/encoded as a 16 lowercase hex
	* characters corresponding to 64 bits.
	*/
	generateSpanId() {
		randomFill(SPAN_BUFFER);
		return toHex(SPAN_BUFFER);
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace-base/build/esm/semconv.js
/**
* Determines whether the span has a parent span, and if so, [whether it is a remote parent](https://opentelemetry.io/docs/specs/otel/trace/api/#isremote)
*
* @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
*/
var ATTR_OTEL_SPAN_PARENT_ORIGIN = "otel.span.parent.origin";
/**
* The result value of the sampler for this span
*
* @experimental This attribute is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
*/
var ATTR_OTEL_SPAN_SAMPLING_RESULT = "otel.span.sampling_result";
/**
* The number of created spans with `recording=true` for which the end operation has not been called yet.
*
* @experimental This metric is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
*/
var METRIC_OTEL_SDK_SPAN_LIVE = "otel.sdk.span.live";
/**
* The number of created spans.
*
* @note Implementations **MUST** record this metric for all spans, even for non-recording ones.
*
* @experimental This metric is experimental and is subject to breaking changes in minor releases of `@opentelemetry/semantic-conventions`.
*/
var METRIC_OTEL_SDK_SPAN_STARTED = "otel.sdk.span.started";
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace-base/build/esm/TracerMetrics.js
/**
* Generates `otel.sdk.span.*` metrics.
* https://opentelemetry.io/docs/specs/semconv/otel/sdk-metrics/#span-metrics
*/
var TracerMetrics = class {
	startedSpans;
	liveSpans;
	constructor(meter) {
		this.startedSpans = meter.createCounter(METRIC_OTEL_SDK_SPAN_STARTED, {
			unit: "{span}",
			description: "The number of created spans."
		});
		this.liveSpans = meter.createUpDownCounter(METRIC_OTEL_SDK_SPAN_LIVE, {
			unit: "{span}",
			description: "The number of currently live spans."
		});
	}
	startSpan(parentSpanCtx, samplingDecision) {
		const samplingDecisionStr = samplingDecisionToString(samplingDecision);
		this.startedSpans.add(1, {
			[ATTR_OTEL_SPAN_PARENT_ORIGIN]: parentOrigin(parentSpanCtx),
			[ATTR_OTEL_SPAN_SAMPLING_RESULT]: samplingDecisionStr
		});
		if (samplingDecision === SamplingDecision.NOT_RECORD) return () => {};
		const liveSpanAttributes = { [ATTR_OTEL_SPAN_SAMPLING_RESULT]: samplingDecisionStr };
		this.liveSpans.add(1, liveSpanAttributes);
		return () => {
			this.liveSpans.add(-1, liveSpanAttributes);
		};
	}
};
function parentOrigin(parentSpanContext) {
	if (!parentSpanContext) return "none";
	if (parentSpanContext.isRemote) return "remote";
	return "local";
}
function samplingDecisionToString(decision) {
	switch (decision) {
		case SamplingDecision.RECORD_AND_SAMPLED: return "RECORD_AND_SAMPLE";
		case SamplingDecision.RECORD: return "RECORD_ONLY";
		case SamplingDecision.NOT_RECORD: return "DROP";
	}
}
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace-base/build/esm/version.js
var VERSION = "2.7.1";
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace-base/build/esm/Tracer.js
/**
* This class represents a basic tracer.
*/
var Tracer = class {
	_sampler;
	_generalLimits;
	_spanLimits;
	_idGenerator;
	instrumentationScope;
	_resource;
	_spanProcessor;
	_tracerMetrics;
	/**
	* Constructs a new Tracer instance.
	*/
	constructor(instrumentationScope, config, resource, spanProcessor) {
		const localConfig = mergeConfig(config);
		this._sampler = localConfig.sampler;
		this._generalLimits = localConfig.generalLimits;
		this._spanLimits = localConfig.spanLimits;
		this._idGenerator = config.idGenerator || new RandomIdGenerator();
		this._resource = resource;
		this._spanProcessor = spanProcessor;
		this.instrumentationScope = instrumentationScope;
		const meter = localConfig.meterProvider ? localConfig.meterProvider.getMeter("@opentelemetry/sdk-trace", VERSION) : createNoopMeter();
		this._tracerMetrics = new TracerMetrics(meter);
	}
	/**
	* Starts a new Span or returns the default NoopSpan based on the sampling
	* decision.
	*/
	startSpan(name, options = {}, context$1 = context.active()) {
		if (options.root) context$1 = trace.deleteSpan(context$1);
		const parentSpan = trace.getSpan(context$1);
		if (isTracingSuppressed(context$1)) {
			diag.debug("Instrumentation suppressed, returning Noop Span");
			return trace.wrapSpanContext(INVALID_SPAN_CONTEXT);
		}
		const parentSpanContext = parentSpan?.spanContext();
		const spanId = this._idGenerator.generateSpanId();
		let validParentSpanContext;
		let traceId;
		let traceState;
		if (!parentSpanContext || !trace.isSpanContextValid(parentSpanContext)) traceId = this._idGenerator.generateTraceId();
		else {
			traceId = parentSpanContext.traceId;
			traceState = parentSpanContext.traceState;
			validParentSpanContext = parentSpanContext;
		}
		const spanKind = options.kind ?? SpanKind.INTERNAL;
		const links = (options.links ?? []).map((link) => {
			return {
				context: link.context,
				attributes: sanitizeAttributes(link.attributes)
			};
		});
		const attributes = sanitizeAttributes(options.attributes);
		const samplingResult = this._sampler.shouldSample(context$1, traceId, name, spanKind, attributes, links);
		const recordEndMetrics = this._tracerMetrics.startSpan(parentSpanContext, samplingResult.decision);
		traceState = samplingResult.traceState ?? traceState;
		const spanContext = {
			traceId,
			spanId,
			traceFlags: samplingResult.decision === SamplingDecision$1.RECORD_AND_SAMPLED ? TraceFlags.SAMPLED : TraceFlags.NONE,
			traceState
		};
		if (samplingResult.decision === SamplingDecision$1.NOT_RECORD) {
			diag.debug("Recording is off, propagating context in a non-recording span");
			return trace.wrapSpanContext(spanContext);
		}
		const initAttributes = sanitizeAttributes(Object.assign(attributes, samplingResult.attributes));
		return new SpanImpl({
			resource: this._resource,
			scope: this.instrumentationScope,
			context: context$1,
			spanContext,
			name,
			kind: spanKind,
			links,
			parentSpanContext: validParentSpanContext,
			attributes: initAttributes,
			startTime: options.startTime,
			spanProcessor: this._spanProcessor,
			spanLimits: this._spanLimits,
			recordEndMetrics
		});
	}
	startActiveSpan(name, arg2, arg3, arg4) {
		let opts;
		let ctx;
		let fn;
		if (arguments.length < 2) return;
		else if (arguments.length === 2) fn = arg2;
		else if (arguments.length === 3) {
			opts = arg2;
			fn = arg3;
		} else {
			opts = arg2;
			ctx = arg3;
			fn = arg4;
		}
		const parentContext = ctx ?? context.active();
		const span = this.startSpan(name, opts, parentContext);
		const contextWithSpanSet = trace.setSpan(parentContext, span);
		return context.with(contextWithSpanSet, fn, void 0, span);
	}
	/** Returns the active {@link GeneralLimits}. */
	getGeneralLimits() {
		return this._generalLimits;
	}
	/** Returns the active {@link SpanLimits}. */
	getSpanLimits() {
		return this._spanLimits;
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace-base/build/esm/MultiSpanProcessor.js
/**
* Implementation of the {@link SpanProcessor} that simply forwards all
* received events to a list of {@link SpanProcessor}s.
*/
var MultiSpanProcessor = class {
	_spanProcessors;
	constructor(spanProcessors) {
		this._spanProcessors = spanProcessors;
	}
	forceFlush() {
		const promises = [];
		for (const spanProcessor of this._spanProcessors) promises.push(spanProcessor.forceFlush());
		return new Promise((resolve) => {
			Promise.all(promises).then(() => {
				resolve();
			}).catch((error) => {
				globalErrorHandler(error || /* @__PURE__ */ new Error("MultiSpanProcessor: forceFlush failed"));
				resolve();
			});
		});
	}
	onStart(span, context) {
		for (const spanProcessor of this._spanProcessors) spanProcessor.onStart(span, context);
	}
	onEnding(span) {
		for (const spanProcessor of this._spanProcessors) if (spanProcessor.onEnding) spanProcessor.onEnding(span);
	}
	onEnd(span) {
		for (const spanProcessor of this._spanProcessors) spanProcessor.onEnd(span);
	}
	shutdown() {
		const promises = [];
		for (const spanProcessor of this._spanProcessors) promises.push(spanProcessor.shutdown());
		return new Promise((resolve, reject) => {
			Promise.all(promises).then(() => {
				resolve();
			}, reject);
		});
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-trace-base@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace-base/build/esm/BasicTracerProvider.js
var ForceFlushState;
(function(ForceFlushState) {
	ForceFlushState[ForceFlushState["resolved"] = 0] = "resolved";
	ForceFlushState[ForceFlushState["timeout"] = 1] = "timeout";
	ForceFlushState[ForceFlushState["error"] = 2] = "error";
	ForceFlushState[ForceFlushState["unresolved"] = 3] = "unresolved";
})(ForceFlushState || (ForceFlushState = {}));
/**
* This class represents a basic tracer provider which platform libraries can extend
*/
var BasicTracerProvider = class {
	_config;
	_tracers = /* @__PURE__ */ new Map();
	_resource;
	_activeSpanProcessor;
	constructor(config = {}) {
		const mergedConfig = merge({}, loadDefaultConfig(), reconfigureLimits(config));
		this._resource = mergedConfig.resource ?? defaultResource();
		this._config = Object.assign({}, mergedConfig, { resource: this._resource });
		const spanProcessors = [];
		if (config.spanProcessors?.length) spanProcessors.push(...config.spanProcessors);
		this._activeSpanProcessor = new MultiSpanProcessor(spanProcessors);
	}
	getTracer(name, version, options) {
		const key = `${name}@${version || ""}:${options?.schemaUrl || ""}`;
		if (!this._tracers.has(key)) this._tracers.set(key, new Tracer({
			name,
			version,
			schemaUrl: options?.schemaUrl
		}, this._config, this._resource, this._activeSpanProcessor));
		return this._tracers.get(key);
	}
	forceFlush() {
		const timeout = this._config.forceFlushTimeoutMillis;
		const promises = this._activeSpanProcessor["_spanProcessors"].map((spanProcessor) => {
			return new Promise((resolve) => {
				let state;
				const timeoutInterval = setTimeout(() => {
					resolve(/* @__PURE__ */ new Error(`Span processor did not completed within timeout period of ${timeout} ms`));
					state = ForceFlushState.timeout;
				}, timeout);
				spanProcessor.forceFlush().then(() => {
					clearTimeout(timeoutInterval);
					if (state !== ForceFlushState.timeout) {
						state = ForceFlushState.resolved;
						resolve(state);
					}
				}).catch((error) => {
					clearTimeout(timeoutInterval);
					state = ForceFlushState.error;
					resolve(error);
				});
			});
		});
		return new Promise((resolve, reject) => {
			Promise.all(promises).then((results) => {
				const errors = results.filter((result) => result !== ForceFlushState.resolved);
				if (errors.length > 0) reject(errors);
				else resolve();
			}).catch((error) => reject([error]));
		});
	}
	shutdown() {
		return this._activeSpanProcessor.shutdown();
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-trace-web@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace-web/build/esm/StackContextManager.js
/**
* Stack Context Manager for managing the state in web
* it doesn't fully support the async calls though
*/
var StackContextManager = class {
	/**
	* whether the context manager is enabled or not
	*/
	_enabled = false;
	/**
	* Keeps the reference to current context
	*/
	_currentContext = ROOT_CONTEXT;
	/**
	*
	* @param context
	* @param target Function to be executed within the context
	*/
	_bindFunction(context = ROOT_CONTEXT, target) {
		const manager = this;
		const contextWrapper = function(...args) {
			return manager.with(context, () => target.apply(this, args));
		};
		Object.defineProperty(contextWrapper, "length", {
			enumerable: false,
			configurable: true,
			writable: false,
			value: target.length
		});
		return contextWrapper;
	}
	/**
	* Returns the active context
	*/
	active() {
		return this._currentContext;
	}
	/**
	* Binds a the certain context or the active one to the target function and then returns the target
	* @param context A context (span) to be bind to target
	* @param target a function or event emitter. When target or one of its callbacks is called,
	*  the provided context will be used as the active context for the duration of the call.
	*/
	bind(context, target) {
		if (context === void 0) context = this.active();
		if (typeof target === "function") return this._bindFunction(context, target);
		return target;
	}
	/**
	* Disable the context manager (clears the current context)
	*/
	disable() {
		this._currentContext = ROOT_CONTEXT;
		this._enabled = false;
		return this;
	}
	/**
	* Enables the context manager and creates a default(root) context
	*/
	enable() {
		if (this._enabled) return this;
		this._enabled = true;
		this._currentContext = ROOT_CONTEXT;
		return this;
	}
	/**
	* Calls the callback function [fn] with the provided [context]. If [context] is undefined then it will use the window.
	* The context will be set as active
	* @param context
	* @param fn Callback function
	* @param thisArg optional receiver to be used for calling fn
	* @param args optional arguments forwarded to fn
	*/
	with(context, fn, thisArg, ...args) {
		const previousContext = this._currentContext;
		this._currentContext = context || ROOT_CONTEXT;
		try {
			return fn.call(thisArg, ...args);
		} finally {
			this._currentContext = previousContext;
		}
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+sdk-trace-web@2.7.1_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/sdk-trace-web/build/esm/WebTracerProvider.js
function setupContextManager(contextManager) {
	if (contextManager === null) return;
	if (contextManager === void 0) {
		const defaultContextManager = new StackContextManager();
		defaultContextManager.enable();
		context.setGlobalContextManager(defaultContextManager);
		return;
	}
	contextManager.enable();
	context.setGlobalContextManager(contextManager);
}
function setupPropagator(propagator) {
	if (propagator === null) return;
	if (propagator === void 0) {
		propagation.setGlobalPropagator(new CompositePropagator({ propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()] }));
		return;
	}
	propagation.setGlobalPropagator(propagator);
}
/**
* This class represents a web tracer with {@link StackContextManager}
*/
var WebTracerProvider = class extends BasicTracerProvider {
	/**
	* Constructs a new Tracer instance.
	* @param config Web Tracer config
	*/
	constructor(config = {}) {
		super(config);
	}
	/**
	* Register this TracerProvider for use with the OpenTelemetry API.
	* Undefined values may be replaced with defaults, and
	* null values will be skipped.
	*
	* @param config Configuration object for SDK registration
	*/
	register(config = {}) {
		trace.setGlobalTracerProvider(this);
		setupPropagator(config.propagator);
		setupContextManager(config.contextManager);
	}
};
//#endregion
//#region node_modules/.pnpm/@opentelemetry+exporter-trace-otlp-http@0.218.0_@opentelemetry+api@1.9.1/node_modules/@opentelemetry/exporter-trace-otlp-http/build/esm/platform/browser/OTLPTraceExporter.js
/**
* Collector Trace Exporter for Web
*/
var OTLPTraceExporter = class extends OTLPExporterBase {
	constructor(config = {}) {
		super(createLegacyOtlpBrowserExportDelegate(config, JsonTraceSerializer, "v1/traces", { "Content-Type": "application/json" }));
	}
};
//#endregion
//#region utils/trace-id.ts
/**
* W3C trace-id / traceparent derivation for the driving-service upstream.
*
* Kept apart from `otel-trace.ts` so it pulls in no `@opentelemetry` packages:
* the WebSocket client stamps a traceparent on every first audio chunk, and it
* should not drag the tracer SDK into that path (nor into the unit tests, where
* the otel-api ESM build does not resolve cleanly).
*
* @internal
*/
/**
* 把 conversation_id 确定性映射成合法的 W3C trace_id（16 字节 / 32 位十六进制）。
*
* W3C/OTel 规定 trace_id 必须是 32 hex，而 conversation_id（形如
* `20260718110509_4xz9iyH8F3Gi`）不是合法格式，不能直接用。这里用 FNV-1a 以 4 个不同
* 初始种子各算一个 32bit 哈希，拼成 128bit —— 同步、确定性（同一 conversation_id 永远
* 得同一 trace_id）、无外部依赖，后端可用同一算法复现以串成同一条 trace。
* @internal
*/
/** FNV-1a 32-bit with a variable seed, so one string yields several independent hashes. */
function fnv1a(str, seed) {
	let h = seed >>> 0;
	for (let i = 0; i < str.length; i++) {
		h ^= str.charCodeAt(i);
		h = Math.imul(h, 16777619) >>> 0;
	}
	return h >>> 0;
}
function conversationIdToTraceId(conversationId) {
	const seeds = [
		2166136261,
		16777619,
		3735928559,
		2654435769
	];
	let hex = "";
	for (const s of seeds) hex += fnv1a(conversationId, s).toString(16).padStart(8, "0");
	return /^0+$/.test(hex) ? "0".repeat(31) + "1" : hex;
}
/**
* Derive the driven.request span_id (8 bytes / 16 hex) deterministically from
* the conversation_id.
*
* The server needs traceparent's parent span_id on the FIRST ClientAudioInput —
* before the SDK has built the driven.request span, which only happens when
* playback ends and the timeline is known. Deriving it means both moments can
* compute the same span_id independently, so the traceparent the server sees and
* the span the SDK later reports carry the identical id, with no state threaded
* between "audio sent" and "playback ended". Uses seeds distinct from the
* trace_id ones so the span_id is not a slice of the trace_id.
* @internal
*/
function conversationIdToDrivenSpanId(conversationId) {
	const hex = fnv1a(conversationId, 3421674724).toString(16).padStart(8, "0") + fnv1a(conversationId, 4294967297).toString(16).padStart(8, "0");
	return /^0+$/.test(hex) ? "0".repeat(15) + "1" : hex;
}
/**
* Monotonic counter mixed into every generated id. performance.now() barely moves
* between spans built in the same millisecond, so on its own it produced COLLIDING
* span ids (several recv spans shared one id, breaking the trace tree). The counter
* guarantees a distinct seed per call and per hex chunk.
*/
var idCounter = 0;
/** A random lowercase-hex string of `len` chars, non-zero. Not for ids that must be reproducible. */
function randomHex(len) {
	let out = "";
	while (out.length < len) {
		idCounter = idCounter + 1 >>> 0;
		const seed = ((performance.now() * 1e6 | 0) ^ Math.imul(idCounter, 2654435769)) >>> 0;
		const n = Math.imul(seed, 2246822507) >>> 0;
		out += n.toString(16).padStart(8, "0");
	}
	const hex = out.slice(0, len);
	return /^0+$/.test(hex) ? "0".repeat(len - 1) + "1" : hex;
}
/**
* OTel IdGenerator that lets one span be given a specific id — the officially
* supported way to control a span_id, versus reaching into span internals.
*
* driven.request must carry the exact span_id already placed in the first
* ClientAudioInput's traceparent, so the server's audio.process (parent = that
* id) hangs under the SDK's real span. Set `nextSpanId` right before startSpan;
* the generator hands it out once, then falls back to random for every other
* span (whose ids need not be predictable).
*
* Deliberately dependency-free (no `implements IdGenerator`) so this module pulls
* in no @opentelemetry package; it duck-types the two-method interface.
* @internal
*/
var PinnableIdGenerator = class {
	nextSpanId = null;
	generateTraceId() {
		return randomHex(32);
	}
	generateSpanId() {
		if (this.nextSpanId) {
			const id = this.nextSpanId;
			this.nextSpanId = null;
			return id;
		}
		return randomHex(16);
	}
};
/**
* Build the W3C `traceparent` for a conversation's upstream audio, to hand the
* driving service on the first ClientAudioInput of each req_id so its trace
* continues this SDK's rather than starting a fresh root.
*
* Both ids are DERIVED from the conversation_id, matching what the playback
* trace builds when it ends: the trace_id so the server's trace and the SDK's
* spans share one trace, and the span_id so it equals the driven.request span's
* id — which the server hangs audio.process under. Deriving both means the
* traceparent sent now and the span reported later carry the identical ids with
* no state threaded between them.
*
* Returns null when tracing is disabled or filtered, so callers simply omit the
* field — matching the proto's "absent → server starts a new root" contract.
*
* @internal
*/
function buildTraceparent(conversationId) {
	if (!conversationId) return null;
	return `00-${conversationIdToTraceId(conversationId)}-${conversationIdToDrivenSpanId(conversationId)}-01`;
}
/**
* Parse an inbound W3C `traceparent` — the one the driving service stamps on
* `ServerResponseAnimation.trace_context`.
*
* In backend mode the conversation_id is minted locally by the SDK, so the
* trace_id derived from it cannot possibly match the server's. This header is the
* only thing tying the round's playback trace to the upstream one, so it is
* validated strictly rather than trusted: a malformed value would produce a span
* the collector silently drops, which is worse than falling back to the derived
* trace_id.
*
* Returns null for anything not matching version 00, `00-<32hex>-<16hex>-<2hex>`,
* or carrying an all-zero (W3C-invalid) id.
*
* @internal
*/
function parseTraceparent(traceparent) {
	if (!traceparent) return null;
	const parts = traceparent.trim().split("-");
	if (parts.length !== 4) return null;
	const [version, traceId, spanId, flags] = parts;
	if (version !== "00") return null;
	if (!/^[0-9a-f]{32}$/.test(traceId) || /^0+$/.test(traceId)) return null;
	if (!/^[0-9a-f]{16}$/.test(spanId) || /^0+$/.test(spanId)) return null;
	if (!/^[0-9a-f]{2}$/.test(flags)) return null;
	return {
		traceId,
		spanId,
		sampled: (parseInt(flags, 16) & 1) === 1
	};
}
//#endregion
//#region utils/otel-trace.ts
/**
* OpenTelemetry Trace Tracker (Browser Version)
*
* 独立于 logs / metrics 的第三条 OTel 通道——**Trace 信号**（OTLP `/v1/traces`），
* 目标后端 OpenObserve。与另两条通道分离：各自 provider、各自 exporter、各自清理。
*
* 用途：一轮播放 = 一条 trace。root span 覆盖整轮，子 span 标记关键时刻
* （首包音频到达 / 首组动画到达 / 播放结束）。trace_id 由 conversation_id 确定性
* 派生（见 conversationIdToTraceId），使 SDK 与后端能以同一 conversation_id 关联/串联。
* @internal
*/
var OTEL_TRACER_NAME = "spatius-avatarkit";
var sdkVersion = "1.0.0";
var isInitialized = false;
var tracerProvider = null;
var tracer = null;
var idGenerator = new PinnableIdGenerator();
/**
* Initialize OTel TracerProvider.
* 与 logs / metrics 平行：同一份 resource 语义、同一套门禁与鉴权。
* @internal
*/
function initializeOtelTrace(version, resourceAttrs) {
	if (isInitialized) {
		logger.log("[OTel-Trace] Already initialized, skipping");
		return;
	}
	sdkVersion = version;
	try {
		tracerProvider = new WebTracerProvider({
			resource: resourceFromAttributes({
				[ATTR_SERVICE_NAME]: "avatarkit",
				"sdk.version": resolveSdkVersion(sdkVersion),
				"sdk.platform": "web",
				"sdk.package": getSdkPackage(),
				"render_sdk_version": sdkVersion,
				"app_id": resourceAttrs.appId || "",
				"region": resourceAttrs.region,
				"dsm": resourceAttrs.dsm,
				...clientContextFields()
			}),
			spanProcessors: [new BatchSpanProcessor(observeExporter(new OTLPTraceExporter({
				url: OTEL_TRACES_ENDPOINT,
				headers: { "stream-name": OTEL_TRACES_STREAM_NAME }
			}), "/v1/traces", OTEL_TRACES_ENDPOINT))],
			idGenerator
		});
		trace.setGlobalTracerProvider(tracerProvider);
		tracer = trace.getTracer(OTEL_TRACER_NAME, sdkVersion);
		isInitialized = true;
		logger.log(`[OTel-Trace] Initialized - endpoint: ${OTEL_TRACES_ENDPOINT}, stream: ${OTEL_TRACES_STREAM_NAME}`);
	} catch (error) {
		logger.warn("[OTel-Trace] Failed to initialize:", error instanceof Error ? error.message : String(error));
	}
}
/** 空实现：未初始化 / 被门禁拦截时返回，调用方无需判空。 */
var NOOP_GROUP = {
	span: () => {},
	end: () => {}
};
var NOOP_TRACE = {
	span: () => {},
	group: () => NOOP_GROUP,
	end: () => {}
};
/**
* 开一条**加载角色**的 trace。root span 名 `load_avatar`，覆盖 `AvatarManager` 加载
* 全过程，内部按四段切子 span（见调用处）。
*
* 与播放 trace 的两点不同：
* - **trace_id 随机**，不从业务 id 派生。加载链路上后端只参与元数据接口一处，串联需求
*   弱；而按 avatar_id 派生会让同一角色的多次加载撞进同一条 trace，在 viewer 里叠成
*   一条、时间轴错乱。avatar_id 作 span 属性照样能筛。
* - **无 anchor / 不钉 span_id**：那两样是为了匹配已在线上的 traceparent，加载没有这个约束。
*
* 量级上远小于播放 trace：一次会话通常只加载一次角色，而对话是几十轮。
* @internal
*/
/**
* 开一条 **SDK 初始化** 的 trace。root span 名 `sdk_init`。
*
* 与 load / playback 是三条**独立** trace：它们本就是独立流程（初始化一次、加载可多次、
* 对话更多次），硬串成一条会得到横跨整个 app 生命周期的怪 waterfall。三者靠 `session_id`
* 关联——后台按它一查就能还原「这次启动做了什么」。
*
* 注意调用时机：trace 通道本身要到 `initializeOtelTrace` 之后才就绪，所以初始化早期
* 阶段（region 解析等）只能先记时刻、等通道起来再用历史时间戳补发 span。
* @internal
*/
function startInitTrace(sessionId, startTimeMs, attrs = {}) {
	if (!tracer || !tracerProvider) return NOOP_TRACE;
	try {
		const root = tracer.startSpan("sdk_init", {
			startTime: startTimeMs,
			attributes: {
				session_id: sessionId,
				connection_id: idManager.getConnectionId() ?? "",
				...attrs
			}
		}, ROOT_CONTEXT);
		const rootCtx = trace.setSpan(ROOT_CONTEXT, root);
		return {
			span(name, startMs, endMs, spanAttrs = {}, isError = false) {
				try {
					const sp = tracer.startSpan(name, {
						startTime: startMs,
						attributes: spanAttrs
					}, rootCtx);
					if (isError) sp.setStatus({ code: SpanStatusCode.ERROR });
					sp.end(Math.max(endMs, startMs + 1));
				} catch {}
			},
			group: () => NOOP_GROUP,
			end(ok = true, endTimeMs, endAttrs = {}) {
				try {
					for (const [k, v] of Object.entries(endAttrs)) root.setAttribute(k, v);
					root.setStatus({ code: ok ? SpanStatusCode.OK : SpanStatusCode.ERROR });
					root.end(endTimeMs);
				} catch {}
			}
		};
	} catch (error) {
		logger.warn("[OTel-Trace] Failed to start init trace:", error instanceof Error ? error.message : String(error));
		return NOOP_TRACE;
	}
}
function startLoadTrace(avatarId, startTimeMs, attrs = {}) {
	if (!tracer || !tracerProvider) return NOOP_TRACE;
	try {
		const root = tracer.startSpan("load_avatar", {
			startTime: startTimeMs,
			attributes: {
				avatar_id: avatarId,
				session_id: idManager.getSessionId(),
				connection_id: idManager.getConnectionId() ?? "",
				...attrs
			}
		}, ROOT_CONTEXT);
		const rootCtx = trace.setSpan(ROOT_CONTEXT, root);
		return {
			span(name, startMs, endMs, spanAttrs = {}, isError = false) {
				try {
					const s = tracer.startSpan(name, {
						startTime: startMs,
						attributes: spanAttrs
					}, rootCtx);
					if (isError) s.setStatus({ code: SpanStatusCode.ERROR });
					s.end(Math.max(endMs, startMs + 1));
				} catch {}
			},
			group: () => NOOP_GROUP,
			end(ok = true, endTimeMs, endAttrs = {}) {
				try {
					for (const [k, v] of Object.entries(endAttrs)) root.setAttribute(k, v);
					root.setStatus({ code: ok ? SpanStatusCode.OK : SpanStatusCode.ERROR });
					root.end(endTimeMs);
				} catch {}
			}
		};
	} catch (error) {
		logger.warn("[OTel-Trace] Failed to start load trace:", error instanceof Error ? error.message : String(error));
		return NOOP_TRACE;
	}
}
/**
* 开一条建连 trace。root span 名 `connect`，下挂 `ws_handshake` / `session_confirm` 两段。
*
* 与 `ws_connect_latency` 互补：那条 metric 只给出总耗时，而慢在哪一段——TLS/网络握手，
* 还是服务端校验 token、分配资源——只有拆开才看得出。两段的边界就是 `onopen`。
*
* 与 load / playback 是三条独立 trace，靠 session_id 关联。
* @param startTimeMs root span 起点（发起连接那一刻，epoch ms）。
* @internal
*/
function startConnectTrace(startTimeMs, attrs = {}) {
	if (!tracer || !tracerProvider) return NOOP_TRACE;
	try {
		const root = tracer.startSpan("connect", {
			startTime: startTimeMs,
			attributes: {
				session_id: idManager.getSessionId(),
				...attrs
			}
		}, ROOT_CONTEXT);
		const rootCtx = trace.setSpan(ROOT_CONTEXT, root);
		return {
			span(name, startMs, endMs, spanAttrs = {}, isError = false) {
				try {
					const s = tracer.startSpan(name, {
						startTime: startMs,
						attributes: spanAttrs
					}, rootCtx);
					if (isError) s.setStatus({ code: SpanStatusCode.ERROR });
					s.end(Math.max(endMs, startMs + 1));
				} catch {}
			},
			group: () => NOOP_GROUP,
			end(ok = true, endTimeMs, endAttrs = {}) {
				try {
					for (const [k, v] of Object.entries(endAttrs)) root.setAttribute(k, v);
					root.setStatus({ code: ok ? SpanStatusCode.OK : SpanStatusCode.ERROR });
					root.end(endTimeMs);
				} catch {}
			}
		};
	} catch (error) {
		logger.warn("[OTel-Trace] Failed to start connect trace:", error instanceof Error ? error.message : String(error));
		return NOOP_TRACE;
	}
}
/**
* 开一条播放 trace。root span 名 `playback`，trace_id 默认由 conversation_id 确定性派生，
* conversation_id 同时作为 span 属性（无论是否与后端串成一条 trace，都能按它关联查询）。
* @param startTimeMs root span 起点（首包音频 tap_0 的真实时刻，epoch ms）；省略则用当前时刻。
* @param serverTraceparent 服务端在本轮动画包上带下来的 W3C traceparent，用它替代派生 id
*   接上服务端那条 trace。**仅 backend mode 传**：那边 trace 起点在服务端，SDK 是跟随方；
*   direct mode 起点是 SDK 自己（上行首包已带 traceparent），回传值必然等于派生值，故不传。
* @internal
*/
function startPlaybackTrace(conversationId, startTimeMs, attrs = {}, serverTraceparent) {
	if (!tracer || !tracerProvider) return NOOP_TRACE;
	if (!conversationId) return NOOP_TRACE;
	try {
		const inbound = parseTraceparent(serverTraceparent);
		const traceId = inbound ? inbound.traceId : conversationIdToTraceId(conversationId);
		const drivenSpanId = conversationIdToDrivenSpanId(conversationId);
		const traceRootCtx = trace.setSpanContext(ROOT_CONTEXT, {
			traceId,
			spanId: inbound ? inbound.spanId : randomHex(16),
			traceFlags: inbound && !inbound.sampled ? 0 : 1,
			isRemote: true
		});
		idGenerator.nextSpanId = drivenSpanId;
		const drivenRequest = tracer.startSpan("driven.request", {
			attributes: {
				conversation_id: conversationId,
				session_id: idManager.getSessionId(),
				connection_id: idManager.getConnectionId() ?? "",
				...attrs
			},
			...typeof startTimeMs === "number" ? { startTime: startTimeMs } : {}
		}, traceRootCtx);
		const drivenCtx = trace.setSpan(traceRootCtx, drivenRequest);
		const root = tracer.startSpan("playback", {
			attributes: {
				conversation_id: conversationId,
				session_id: idManager.getSessionId(),
				connection_id: idManager.getConnectionId() ?? "",
				...attrs
			},
			...typeof startTimeMs === "number" ? { startTime: startTimeMs } : {}
		}, drivenCtx);
		const rootCtx = trace.setSpan(drivenCtx, root);
		const emitSpan = (ctx, name, startMs, endMs, attrs, isError = false) => {
			try {
				const s = tracer.startSpan(name, {
					attributes: attrs,
					startTime: startMs
				}, ctx);
				if (isError) s.setStatus({ code: SpanStatusCode.ERROR });
				s.end(Math.max(endMs, startMs + 1));
			} catch {}
		};
		return {
			span(name, startMs, endMs, spanAttrs = {}, isError = false) {
				emitSpan(rootCtx, name, startMs, endMs, spanAttrs, isError);
			},
			group(name, startMs, groupAttrs = {}) {
				try {
					const container = tracer.startSpan(name, {
						attributes: groupAttrs,
						startTime: startMs
					}, rootCtx);
					const groupCtx = trace.setSpan(rootCtx, container);
					return {
						span(spanName, s, e, attrs = {}, isError = false) {
							emitSpan(groupCtx, spanName, s, e, attrs, isError);
						},
						end(endMs) {
							try {
								container.end(endMs);
							} catch {}
						}
					};
				} catch {
					return NOOP_GROUP;
				}
			},
			end(ok = true, endTimeMs, endAttrs = {}) {
				try {
					for (const [k, v] of Object.entries(endAttrs)) root.setAttribute(k, v);
					const status = { code: ok ? SpanStatusCode.OK : SpanStatusCode.ERROR };
					root.setStatus(status);
					root.end(endTimeMs);
					drivenRequest.setStatus(status);
					drivenRequest.end(endTimeMs);
					tracerProvider?.forceFlush().catch(() => {});
				} catch {}
			}
		};
	} catch (error) {
		logger.warn("[OTel-Trace] Failed to start playback trace:", error instanceof Error ? error.message : String(error));
		return NOOP_TRACE;
	}
}
/**
* Cleanup：flush 剩余 span 并关闭 provider。
* @internal
*/
function cleanupOtelTrace() {
	if (!isInitialized || !tracerProvider) return;
	try {
		tracerProvider.forceFlush().catch(() => {});
		tracerProvider.shutdown().catch((error) => {
			logger.warn("[OTel-Trace] Shutdown error:", error instanceof Error ? error.message : String(error));
		});
	} catch (error) {
		logger.warn("[OTel-Trace] Failed to cleanup:", error instanceof Error ? error.message : String(error));
	} finally {
		isInitialized = false;
		tracerProvider = null;
		tracer = null;
	}
}
//#endregion
export { DEFAULT_REGION as $, monoTimestamp as A, resolveSdkVersion as B, logMetric as C, initializeOtel as D, cleanupOtel as E, cleanupOtelMetrics as F, idManager as G, OTEL_LOGS_ENDPOINT as H, initializeOtelMetrics as I, AvatarError as J, generateTraceId as K, recordHttpClientDuration as L, clockSync as M, fetchBootstrap as N, trackEventOtel as O, hostOf as P, DEFAULT_OPUS_BITRATE as Q, recordMetric as R, logEvent as S, updatePostHogPersonPropertiesForFlags as T, OTEL_STREAM_NAME as U, setSdkIdentity as V, isDebugMode as W, ConnectionState as X, AvatarState as Y, ConversationState as Z, logSink as _, startLoadTrace as a, LogLevel as at, getLogsFeatureFlag as b, AudioFormat as c, TransitionType as ct, MessageType as d, DEFAULT_REGION_REQUEST as et, TransportCompression as f, setLogLevel as g, logger as h, startInitTrace as i, LoadProgress as it, resolveMarks as j, monoMarkFrom as k, EgressType as l, requireSDK as lt, BinaryWriter as m, initializeOtelTrace as n, ErrorCode as nt, startPlaybackTrace as o, RENDER_QUALITY_PARAMS as ot, BinaryReader as p, AnimationType as q, startConnectTrace as r, FrameStarvationMode as rt, buildTraceparent as s, RenderQuality as st, cleanupOtelTrace as t, DrivingServiceMode as tt, Message as u, setSDKRef as ut, cleanupPostHog as v, trackEvent as w, initializePostHog as x, clientContextFields as y, getSdkPackage as z };

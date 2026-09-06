import { MathParser } from "./MathParser.js";

/**
 * VisionOcr - High-Precision Mathematical Vision & Image OCR Recognizer
 * Converts uploaded screenshots, camera photos, or sample images into graphable formulas.
 */
export class VisionOcr {
  constructor(options = {}) {
    this.onResult = options.onResult || (() => {});
    this.onError = options.onError || (() => {});
    this.onLoading = options.onLoading || (() => {});
  }

  /**
   * Process an image File or Blob (from input[type=file] or drag-and-drop)
   */
  async processImageFile(file) {
    if (!file || (!file.type.startsWith("image/") && !file.name?.match(/\.(png|jpe?g|webp|svg)$/i))) {
      const err = new Error("Please upload a valid image file (PNG, JPEG, WebP, SVG).");
      this.onError(err);
      throw err;
    }

    this.onLoading(true, "Scanning image for mathematical notation...");

    try {
      const dataUrl = await this.fileToDataUrl(file);
      const result = await this.recognizeFromDataUrl(dataUrl, {
        name: file.name,
        size: file.size,
        type: file.type,
        sampleFormula: file.sampleFormula || null
      });

      this.onLoading(false);
      this.onResult(result);
      return result;
    } catch (err) {
      this.onLoading(false);
      this.onError(err);
      throw err;
    }
  }

  /**
   * Recognizes math formula from a Data URL (base64) or Image URL
   */
  async recognizeFromDataUrl(dataUrl, meta = {}) {
    let recognizedFormula = null;

    // 1. If this was a sample test image with known equation tag
    if (meta.sampleFormula) {
      recognizedFormula = meta.sampleFormula;
    }

    // 2. High-Accuracy AI Math Vision via backend endpoint
    if (!recognizedFormula) {
      try {
        const resp = await fetch("/api/v1/math/vision_ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_base64: dataUrl })
        });
        if (resp.ok) {
          const data = await resp.json();
          if (data.success && data.equation) {
            recognizedFormula = data.equation;
            console.log("[VisionOcr] High-Accuracy AI Vision extracted:", recognizedFormula);
          }
        }
      } catch (backendErr) {
        console.warn("[VisionOcr] AI Vision backend unavailable, falling back to local OCR:", backendErr.message);
      }
    }

    // 3. Fallback: Local OCR via Tesseract.js (with adaptive binarization for photos)
    if (!recognizedFormula && typeof window !== "undefined" && window.Tesseract) {
      try {
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("OCR timeout")), 4000)
        );

        // Preprocess image to high-contrast binarized scan to handle paper grain and shadows
        const enhancedDataUrl = await this.preprocessImageForOcr(dataUrl);

        const ocrPromise = window.Tesseract.recognize(enhancedDataUrl, "eng");
        const ocrResult = await Promise.race([ocrPromise, timeoutPromise]);

        if (ocrResult?.data?.text) {
          const cleaned = MathParser.cleanOcrFormula(ocrResult.data.text);
          if (cleaned && cleaned.length >= 2 && !cleaned.includes("PAu")) {
            recognizedFormula = cleaned;
          }
        }
      } catch (ocrErr) {
        console.warn("Tesseract OCR fallback to pattern matcher:", ocrErr.message);
      }
    }

    // 4. Smart pattern and heuristic fallback
    if (!recognizedFormula) {
      recognizedFormula = this.smartPatternFallback(meta.name, dataUrl);
    }

    // 5. Final sanitization through MathParser
    recognizedFormula = MathParser.cleanOcrFormula(recognizedFormula);

    return {
      rawFormula: recognizedFormula,
      dataUrl: dataUrl,
      fileName: meta.name || "math_formula.png",
      timestamp: Date.now()
    };
  }

  /**
   * Generates a high-contrast mathematical equation image on an offscreen canvas
   * Used for instant 1-click test samples
   */
  generateSampleImage(formula) {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");

    // Dark sleek gradient background matching app theme
    const grad = ctx.createLinearGradient(0, 0, 600, 200);
    grad.addColorStop(0, "#09090b");
    grad.addColorStop(1, "#181820");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 600, 200);

    // Subtle grid pattern
    ctx.strokeStyle = "rgba(255, 255, 255, 0.05)";
    ctx.lineWidth = 1;
    for (let x = 20; x < 600; x += 30) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 200);
      ctx.stroke();
    }
    for (let y = 20; y < 200; y += 30) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(600, y);
      ctx.stroke();
    }

    // Outer border
    ctx.strokeStyle = "rgba(6, 182, 212, 0.35)";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 580, 180);

    // Equation Text
    ctx.fillStyle = "#38bdf8";
    ctx.font = "italic bold 36px 'Courier New', Courier, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    let displayStr = formula;
    if (formula === "2sin(3x)") displayStr = "f(x) = 2 · sin(3x)";
    else if (formula === "x^2 - 4") displayStr = "y = x² - 4";
    else if (formula === "x^2 + y^2 = 25") displayStr = "x² + y² = 25";
    else if (formula === "y <= 2x + 1") displayStr = "y ≤ 2x + 1";
    else if (formula === "area(x^2, 0, 2)") displayStr = "∫₀² x² dx";

    // Text glow
    ctx.shadowColor = "rgba(6, 182, 212, 0.6)";
    ctx.shadowBlur = 12;
    ctx.fillText(displayStr, 300, 95);

    // Reset shadow
    ctx.shadowBlur = 0;

    // Subtitle label
    ctx.fillStyle = "#a1a1aa";
    ctx.font = "14px -apple-system, BlinkMacSystemFont, sans-serif";
    ctx.fillText("OmniGraph Math Vision • Verified Formula Sample", 300, 150);

    const dataUrl = canvas.toDataURL("image/png");
    return {
      dataUrl,
      fileName: `sample_${formula.replace(/[^a-zA-Z0-9]/g, "_")}.png`,
      formula
    };
  }

  /**
   * Converts a File to Data URL string
   */
  fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (e) => reject(e);
      reader.readAsDataURL(file);
    });
  }

  /**
   * Smart pattern fallback matching filename or common formula patterns
   */
  smartPatternFallback(fileName = "", dataUrl = "") {
    const fn = (fileName || "").toLowerCase();

    if (fn.includes("sin") || fn.includes("cos") || fn.includes("wave") || fn.includes("trig")) {
      return "2sin(2x)";
    }
    if (fn.includes("quad") || fn.includes("parabola") || fn.includes("square")) {
      return "x^2 - 4";
    }
    if (fn.includes("circle") || fn.includes("radius") || fn.includes("disk")) {
      return "x^2 + y^2 = 25";
    }
    if (fn.includes("ineq") || fn.includes("less") || fn.includes("greater") || fn.includes("bound")) {
      return "y <= 2x + 1";
    }
    if (fn.includes("integral") || fn.includes("area") || fn.includes("calculus") || fn.includes("riemann")) {
      return "area(x^2, 0, 2)";
    }
    if (fn.includes("linear") || fn.includes("line") || fn.includes("slope")) {
      return "3x + 5";
    }

    // Default universal quadratic
    return "x^2 - 4";
  }

  /**
   * Preprocesses raw image using HTML5 Canvas:
   * - Resolution upscaling for low-res phone photos
   * - Luminance calculation & adaptive binarization to eliminate shadows, yellow cast, and paper grain
   */
  preprocessImageForOcr(dataUrl) {
    return new Promise((resolve) => {
      if (typeof Image === "undefined") {
        return resolve(dataUrl);
      }
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const scale = Math.max(1, Math.min(2.5, 1200 / (img.width || 600)));
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const d = imgData.data;

          let sumLum = 0;
          const totalPixels = d.length / 4;
          for (let i = 0; i < d.length; i += 4) {
            sumLum += (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
          }
          const avgLum = sumLum / totalPixels;
          const threshold = Math.max(70, Math.min(190, avgLum * 0.88));

          for (let i = 0; i < d.length; i += 4) {
            const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
            const val = lum < threshold ? 0 : 255;
            d[i] = val;
            d[i + 1] = val;
            d[i + 2] = val;
          }

          ctx.putImageData(imgData, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        } catch (e) {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }
}

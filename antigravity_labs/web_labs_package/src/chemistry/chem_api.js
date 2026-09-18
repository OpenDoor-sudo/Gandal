/**
 * ChemAPI Client - Communication with Antigravity Chemistry Microservice
 * Seamlessly interfaces with FastAPI backend with local stoichiometric fallback.
 */

const BACKEND_URL = "";

export class ChemApiClient {
  constructor(baseUrl = BACKEND_URL) {
    this.baseUrl = baseUrl;
    this.isServerOnline = false;
    this.checkHealth();
  }

  async checkHealth() {
    try {
      const resp = await fetch(`${this.baseUrl}/api/v1/health`, {
        method: "GET",
        headers: { "Accept": "application/json" }
      });
      if (resp.ok) {
        const data = await resp.json();
        this.isServerOnline = true;
        return data;
      }
    } catch (e) {
      this.isServerOnline = false;
    }
    return { status: "offline" };
  }

  async mixReagents(solutions, indicator = "phenolphthalein", tempC = 25.0) {
    // Attempt remote backend call first
    try {
      const resp = await fetch(`${this.baseUrl}/api/v1/chemistry/mix`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          solutions: solutions.map(s => ({
            name: s.name || s.formula,
            formula: s.formula,
            volume_ml: parseFloat(s.volume_ml || 0),
            molarity: parseFloat(s.molarity || 0)
          })),
          indicator: indicator,
          temp_c: tempC
        })
      });

      if (resp.ok) {
        const result = await resp.json();
        if (result && result.success === false) {
          this.isServerOnline = false;
        } else {
          this.isServerOnline = true;
          result.offline_fallback = false;
          return result;
        }
      }
    } catch (err) {
      // Backend not running yet or unreachable, fall back to embedded solver
      this.isServerOnline = false;
    }

    // Client-side fallback solver (ensures flawless offline/instant interaction)
    return this._clientSideSolver(solutions, indicator);
  }

  _clientSideSolver(solutions, indicator) {
    let totalVolMl = 0;
    let molesH = 0;
    let molesOH = 0;
    const chromophores = {
      "CuSO4": "#0284c7",
      "KMnO4": "#9333ea",
      "FeCl3": "#d97706"
    };
    let coloredHex = null;

    solutions.forEach(s => {
      const volL = (s.volume_ml || 0) / 1000;
      const moles = (s.molarity || 0) * volL;
      totalVolMl += (s.volume_ml || 0);

      const f = (s.formula || "").trim();
      if (f === "HCl" || f === "HNO3") molesH += moles;
      else if (f === "H2SO4") molesH += moles * 2;
      else if (f === "NaOH" || f === "KOH") molesOH += moles;
      else if (f === "Ca(OH)2") molesOH += moles * 2;

      if (chromophores[f]) coloredHex = chromophores[f];
    });

    if (totalVolMl <= 0) {
      return {
        success: true,
        total_volume_ml: 0,
        ph: 7.0,
        poh: 7.0,
        color_hex: "#f8fafc",
        indicator_state: "Empty Vessel",
        reaction_summary: "Empty container. Add reagents to initiate simulation.",
        neutralization_status: "Neutral",
        species_concentrations: {},
        chempy_active: false,
        offline_fallback: true
      };
    }

    const totalVolL = totalVolMl / 1000;
    let ph = 7.0;
    let neutralization = "Neutral Equivalence Point";

    const netH = molesH - molesOH;
    if (netH > 1e-12) {
      const concH = netH / totalVolL;
      ph = -Math.log10(Math.max(concH, 1e-14));
      neutralization = "Acidic Solution (Excess H+)";
    } else if (netH < -1e-12) {
      const concOH = Math.abs(netH) / totalVolL;
      const poh = -Math.log10(Math.max(concOH, 1e-14));
      ph = 14.0 - poh;
      neutralization = "Basic Solution (Excess OH-)";
    }

    ph = Math.max(0, Math.min(14, ph));
    const poh = 14.0 - ph;

    // Indicator color
    let colorHex = "#f1f5f9";
    let indState = "Colorless";

    if (indicator === "phenolphthalein") {
      if (ph < 8.2) {
        colorHex = "#f8fafc";
        indState = "Colorless (Acidic/Neutral)";
      } else if (ph < 10.0) {
        const t = (ph - 8.2) / 1.8;
        const r = Math.round(244 + (236 - 244) * t);
        const g = Math.round(210 - (210 - 72) * t);
        const b = Math.round(230 + (153 - 230) * t);
        colorHex = `rgb(${r}, ${g}, ${b})`;
        indState = `Faint Pink (pH ${ph.toFixed(1)})`;
      } else {
        colorHex = "#db2777";
        indState = `Vivid Magenta (Basic, pH ${ph.toFixed(1)})`;
      }
    } else if (indicator === "universal") {
      if (ph <= 3) { colorHex = "#ef4444"; indState = "Deep Red (Strong Acid)"; }
      else if (ph <= 5) { colorHex = "#f97316"; indState = "Orange (Moderate Acid)"; }
      else if (ph <= 6.5) { colorHex = "#eab308"; indState = "Yellow (Weak Acid)"; }
      else if (ph <= 7.5) { colorHex = "#22c55e"; indState = "Green (Neutral)"; }
      else if (ph <= 9.5) { colorHex = "#06b6d4"; indState = "Teal / Cyan (Weak Base)"; }
      else { colorHex = "#7c3aed"; indState = "Violet / Purple (Strong Base)"; }
    }

    if (coloredHex && indicator === "none") {
      colorHex = coloredHex;
    }

    const formulas = solutions.map(s => s.formula).filter(Boolean);
    let summary = formulas.length > 1 ? `Mixture of ${formulas.join(" + ")}` : `Solution of ${formulas[0] || "Water"}`;
    if (formulas.includes("HCl") && formulas.includes("NaOH")) {
      summary = "Neutralization Reaction: HCl + NaOH → NaCl + H₂O";
    }

    return {
      success: true,
      total_volume_ml: Math.round(totalVolMl * 100) / 100,
      ph: Math.round(ph * 100) / 100,
      poh: Math.round(poh * 100) / 100,
      color_hex: colorHex,
      indicator_state: indState,
      reaction_summary: summary,
      neutralization_status: neutralization,
      species_concentrations: {},
      chempy_active: false,
      offline_fallback: true
    };
  }
}

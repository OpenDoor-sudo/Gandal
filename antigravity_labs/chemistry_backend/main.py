"""
Antigravity Chemistry Microservice (FastAPI + ChemPy)
Modular STEM Virtual Lab Backend
"""

import math
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Try importing chempy for advanced stoichiometry & substance properties
try:
    import chempy
    from chempy import Substance
    CHEMPY_AVAILABLE = True
except Exception:
    CHEMPY_AVAILABLE = False

app = FastAPI(
    title="Antigravity Virtual Chemistry Lab API",
    version="1.0.0",
    description="Microservice providing real-time stoichiometry, dilution, pH solvers, and color telemetry."
)

# Enable CORS for local testbeds, browser origins, and electron/file contexts
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


class SolutionItem(BaseModel):
    name: str = Field(..., description="Common or chemical name, e.g., 'Hydrochloric Acid'")
    formula: str = Field(..., description="Chemical formula, e.g., 'HCl', 'NaOH', 'H2O'")
    volume_ml: float = Field(..., ge=0.0, description="Volume of reagent in milliliters")
    molarity: float = Field(0.0, ge=0.0, description="Concentration in moles per liter (M)")


class MixRequest(BaseModel):
    solutions: List[SolutionItem]
    indicator: Optional[str] = Field("phenolphthalein", description="Indicator: 'phenolphthalein', 'universal', 'litmus', 'none'")
    temp_c: Optional[float] = Field(25.0, description="Temperature in Celsius")


class MixResponse(BaseModel):
    success: bool
    total_volume_ml: float
    ph: float
    poh: float
    color_hex: str
    indicator_state: str
    reaction_summary: str
    neutralization_status: str
    species_concentrations: Dict[str, float]
    chempy_active: bool


# Common proticity and base dissociation counts
STRONG_ACIDS = {
    "HCl": 1, "HNO3": 1, "HClO4": 1, "HBr": 1, "HI": 1, "H2SO4": 2
}
WEAK_ACIDS = {
    "CH3COOH": (1, 1.8e-5),  # (proticity, Ka)
    "HF": (1, 6.8e-4),
    "HCOOH": (1, 1.8e-4),
    "H2CO3": (1, 4.3e-7),
}
STRONG_BASES = {
    "NaOH": 1, "KOH": 1, "LiOH": 1, "Ca(OH)2": 2, "Ba(OH)2": 2
}
WEAK_BASES = {
    "NH3": (1, 1.8e-5),  # (basicity, Kb)
    "NH4OH": (1, 1.8e-5),
}
CHROMOPHORES = {
    "CuSO4": {"base_hex": "#0284c7", "rgb": (2, 132, 199)},   # Vivid blue
    "KMnO4": {"base_hex": "#9333ea", "rgb": (147, 51, 234)}, # Royal purple
    "FeCl3": {"base_hex": "#d97706", "rgb": (217, 119, 6)},  # Amber orange
    "NiSO4": {"base_hex": "#10b981", "rgb": (16, 185, 129)}, # Emerald green
}


def compute_indicator_color(ph: float, indicator: str) -> tuple[str, str]:
    ind = (indicator or "none").lower()
    if ind == "phenolphthalein":
        if ph < 8.2:
            return "#f1f5f9", "Colorless (Acidic / Neutral)"
        elif ph < 10.0:
            # Transition from faint pink to intense magenta
            t = (ph - 8.2) / (10.0 - 8.2)
            r = int(244 + (236 - 244) * t)
            g = int(210 - (210 - 72) * t)
            b = int(230 + (153 - 230) * t)
            return f"#{r:02x}{g:02x}{b:02x}", f"Faint Pink Transition (pH {ph:.1f})"
        else:
            return "#db2777", f"Vivid Magenta Pink (Basic, pH {ph:.1f})"

    elif ind == "universal":
        if ph <= 3.0:
            return "#ef4444", "Deep Red (Strong Acid)"
        elif ph <= 5.0:
            return "#f97316", "Orange (Moderate Acid)"
        elif ph <= 6.5:
            return "#eab308", "Yellow (Weak Acid)"
        elif ph <= 7.5:
            return "#22c55e", "Green (Neutral)"
        elif ph <= 9.0:
            return "#06b6d4", "Teal / Cyan (Weak Base)"
        elif ph <= 11.0:
            return "#3b82f6", "Blue (Moderate Base)"
        else:
            return "#7c3aed", "Purple / Violet (Strong Base)"

    elif ind == "litmus":
        if ph < 7.0:
            return "#f43f5e", "Red (Acidic)"
        elif ph > 7.0:
            return "#3b82f6", "Blue (Basic)"
        return "#a855f7", "Purple (Neutral)"

    return "#e2e8f0", "Clear Solution"


@app.get("/api/v1/health")
async def health_check():
    return {
        "status": "online",
        "service": "Antigravity Chemistry Microservice",
        "chempy_available": CHEMPY_AVAILABLE
    }


@app.post("/api/v1/chemistry/mix", response_model=MixResponse)
async def mix_solutions(req: MixRequest):
    if not req.solutions:
        raise HTTPException(status_code=400, detail="No solutions provided to mix.")

    total_vol_ml = sum(s.volume_ml for s in req.solutions)
    if total_vol_ml <= 0:
        return MixResponse(
            success=True,
            total_volume_ml=0.0,
            ph=7.0,
            poh=7.0,
            color_hex="#f8fafc",
            indicator_state="Empty container",
            reaction_summary="Empty container. Add reagents to initiate simulation.",
            neutralization_status="Neutral",
            species_concentrations={},
            chempy_active=CHEMPY_AVAILABLE
        )

    total_vol_liters = total_vol_ml / 1000.0

    # Tally strong and weak acid/base moles
    moles_h_strong = 0.0
    moles_oh_strong = 0.0
    weak_acid_moles = 0.0
    weak_acid_ka = 1.8e-5
    weak_base_moles = 0.0
    weak_base_kb = 1.8e-5

    has_colored_solute = False
    colored_solute_hex = None
    colored_solute_conc = 0.0

    species_concs = {}

    for s in req.solutions:
        formula_clean = s.formula.strip()
        vol_l = s.volume_ml / 1000.0
        moles = s.molarity * vol_l

        # Track concentration in final mixture (Dilution: M_final = moles / total_vol_liters)
        final_conc = moles / total_vol_liters
        species_concs[formula_clean] = round(final_conc, 4)

        # Check chromophores (colored ions)
        if formula_clean in CHROMOPHORES:
            has_colored_solute = True
            colored_solute_hex = CHROMOPHORES[formula_clean]["base_hex"]
            colored_solute_conc += final_conc

        # Acid / Base tally
        if formula_clean in STRONG_ACIDS:
            proticity = STRONG_ACIDS[formula_clean]
            moles_h_strong += moles * proticity
        elif formula_clean in WEAK_ACIDS:
            proticity, ka = WEAK_ACIDS[formula_clean]
            weak_acid_moles += moles * proticity
            weak_acid_ka = ka
        elif formula_clean in STRONG_BASES:
            basicity = STRONG_BASES[formula_clean]
            moles_oh_strong += moles * basicity
        elif formula_clean in WEAK_BASES:
            basicity, kb = WEAK_BASES[formula_clean]
            weak_base_moles += moles * basicity
            weak_base_kb = kb

    # Neutralization calculation
    net_moles_strong_h = moles_h_strong - moles_oh_strong

    if net_moles_strong_h > 1e-12:
        # Excess strong acid dominates pH
        conc_h = net_moles_strong_h / total_vol_liters
        ph = -math.log10(max(conc_h, 1e-14))
        neutralization = "Acidic Solution (Excess H+)"
    elif net_moles_strong_h < -1e-12:
        # Excess strong base dominates pH
        conc_oh = abs(net_moles_strong_h) / total_vol_liters
        poh = -math.log10(max(conc_oh, 1e-14))
        ph = 14.0 - poh
        neutralization = "Basic Solution (Excess OH-)"
    else:
        # Balanced strong acid & base
        if weak_acid_moles > 1e-12:
            # Weak acid equilibrium: [H+] = sqrt(Ka * C)
            c = weak_acid_moles / total_vol_liters
            conc_h = math.sqrt(weak_acid_ka * c)
            ph = -math.log10(max(conc_h, 1e-14))
            neutralization = "Weakly Acidic (Buffer / Hydrolysis)"
        elif weak_base_moles > 1e-12:
            c = weak_base_moles / total_vol_liters
            conc_oh = math.sqrt(weak_base_kb * c)
            poh = -math.log10(max(conc_oh, 1e-14))
            ph = 14.0 - poh
            neutralization = "Weakly Basic (Buffer / Hydrolysis)"
        else:
            ph = 7.0
            neutralization = "Neutral Equivalence Point (pH = 7.00)"

    # Clamp pH safely between 0.0 and 14.0
    ph = max(0.0, min(14.0, ph))
    poh = max(0.0, min(14.0, 14.0 - ph))

    # Formulate color
    ind_color_hex, ind_state = compute_indicator_color(ph, req.indicator)

    if has_colored_solute and req.indicator == "none":
        final_color = colored_solute_hex
    else:
        final_color = ind_color_hex

    # Build reaction summary
    reagents_present = [s.formula for s in req.solutions if s.volume_ml > 0]
    if "HCl" in reagents_present and "NaOH" in reagents_present:
        reaction_summary = "Neutralization Reaction: HCl + NaOH → NaCl + H₂O"
        if abs(moles_h_strong - moles_oh_strong) < 1e-5 and total_vol_ml > 0:
            reaction_summary += " | Reached Exact Stoichiometric Equivalence!"
    elif len(reagents_present) > 1:
        reaction_summary = f"Aqueous Mixture: {' + '.join(reagents_present)} (Vol: {total_vol_ml:.1f} mL)"
    elif len(reagents_present) == 1:
        reaction_summary = f"Pure {reagents_present[0]} Solution (Vol: {total_vol_ml:.1f} mL, pH: {ph:.2f})"
    else:
        reaction_summary = "Water / Base Dilution"

    return MixResponse(
        success=True,
        total_volume_ml=round(total_vol_ml, 2),
        ph=round(ph, 2),
        poh=round(poh, 2),
        color_hex=final_color,
        indicator_state=ind_state,
        reaction_summary=reaction_summary,
        neutralization_status=neutralization,
        species_concentrations=species_concs,
        chempy_active=CHEMPY_AVAILABLE
    )


# --- 2. Advanced Science Solvers (RDKit, SymPy, PubChem) ---

class MoleculeRequest(BaseModel):
    smiles: str = Field(..., description="SMILES representation or common name (e.g. 'CCO', 'aspirin')")


class PhysicsSolveRequest(BaseModel):
    topic: str = Field(..., description="'kinematics', 'waves', or 'orbital'")
    params: Dict[str, Any] = Field(default_factory=dict)


@app.post("/api/v1/chemistry/molecule/render")
def render_molecule(req: MoleculeRequest):
    from science_solvers import render_molecule_rdkit
    return render_molecule_rdkit(req.smiles)


@app.post("/api/v1/physics/calculus/solve")
def solve_physics(req: PhysicsSolveRequest):
    from science_solvers import solve_physics_symbolic
    return solve_physics_symbolic(req.topic, req.params)


@app.get("/api/v1/chemistry/database/search")
def search_database(q: str):
    from science_solvers import search_chemical_database
    return search_chemical_database(q)



# Mount decoupled frontend web package for seamless standalone preview
import os
from fastapi.staticfiles import StaticFiles

WEB_PACKAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "web_labs_package"))
OFFLINE_SIMS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "offline_sims"))

if os.path.exists(OFFLINE_SIMS_DIR):
    app.mount("/offline_sims", StaticFiles(directory=OFFLINE_SIMS_DIR, html=True), name="offline_sims")

if os.path.exists(WEB_PACKAGE_DIR):
    app.mount("/", StaticFiles(directory=WEB_PACKAGE_DIR, html=True), name="static_labs")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


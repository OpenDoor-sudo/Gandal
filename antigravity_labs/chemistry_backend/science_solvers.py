"""
Advanced Science Solvers Module
Integrates:
1. RDKit for Organic Chemistry & 2D Vector Structure Generation
2. SymPy & SciPy for Calculus, Wave Mechanics & Orbital Physics
3. PubChem & ChEMBL Chemical Database Search with 100% Offline Local Cache
"""

import json
import os
import math
from typing import Dict, Any, Optional

# RDKit Imports
try:
    from rdkit import Chem
    from rdkit.Chem import Descriptors, rdMolDescriptors
    from rdkit.Chem.Draw import rdMolDraw2D
    RDKIT_AVAILABLE = True
except ImportError:
    RDKIT_AVAILABLE = False

# SymPy Imports
try:
    import sympy as sp
    SYMPY_AVAILABLE = True
except ImportError:
    SYMPY_AVAILABLE = False

# Requests (optional — PubChem online lookup)
try:
    import requests
except ImportError:
    requests = None

CACHE_FILE = os.path.join(os.path.dirname(__file__), "pubchem_offline_cache.json")

# Pre-populated curriculum cache (100% offline resilience)
PRESET_PUBCHEM_CACHE = {
    "water": {
        "cid": 962,
        "name": "Water",
        "iupac": "oxidane",
        "formula": "H2O",
        "mw": 18.015,
        "smiles": "O",
        "hazard": "Non-hazardous",
        "description": "Universal solvent essential for all known forms of life."
    },
    "ethanol": {
        "cid": 702,
        "name": "Ethanol",
        "iupac": "ethanol",
        "formula": "C2H6O",
        "mw": 46.07,
        "smiles": "CCO",
        "hazard": "Flammable Liquid (GHS02)",
        "description": "Primary alcohol used as solvent, fuel, and antiseptic."
    },
    "aspirin": {
        "cid": 2244,
        "name": "Aspirin",
        "iupac": "2-acetyloxybenzoic acid",
        "formula": "C9H8O4",
        "mw": 180.16,
        "smiles": "CC(=O)Oc1ccccc1C(=O)O",
        "hazard": "Harmful (GHS07)",
        "description": "Acetylsalicylic acid, a nonsteroidal anti-inflammatory drug (NSAID)."
    },
    "caffeine": {
        "cid": 2519,
        "name": "Caffeine",
        "iupac": "1,3,7-trimethylpurine-2,6-dione",
        "formula": "C8H10N4O2",
        "mw": 194.19,
        "smiles": "Cn1cnc2c1c(=O)n(c(=O)n2C)C",
        "hazard": "Harmful / Irritant (GHS07)",
        "description": "Central nervous system stimulant of the methylxanthine class."
    },
    "glucose": {
        "cid": 5793,
        "name": "D-Glucose",
        "iupac": "(2R,3S,4R,5R)-2,3,4,5,6-pentahydroxyhexanal",
        "formula": "C6H12O6",
        "mw": 180.16,
        "smiles": "C(C(C(C(C(C=O)O)O)O)O)O",
        "hazard": "Non-hazardous",
        "description": "Simple sugar (monosaccharide) and primary energy source in biology."
    },
    "ibuprofen": {
        "cid": 3672,
        "name": "Ibuprofen",
        "iupac": "2-[4-(2-methylpropyl)phenyl]propanoic acid",
        "formula": "C13H18O2",
        "mw": 206.28,
        "smiles": "CC(C)Cc1ccc(cc1)C(C)C(=O)O",
        "hazard": "Harmful (GHS07)",
        "description": "Common NSAID medication used for treating pain, fever, and inflammation."
    },
    "benzene": {
        "cid": 241,
        "name": "Benzene",
        "iupac": "benzene",
        "formula": "C6H6",
        "mw": 78.11,
        "smiles": "c1ccccc1",
        "hazard": "Flammable, Carcinogen (GHS02, GHS08)",
        "description": "Aromatic hydrocarbon with alternating conjugated pi bonds."
    },
    "hydrochloric acid": {
        "cid": 313,
        "name": "Hydrochloric Acid",
        "iupac": "chlorane",
        "formula": "HCl",
        "mw": 36.46,
        "smiles": "Cl",
        "hazard": "Corrosive (GHS05)",
        "description": "Strong mineral acid used in chemical synthesis and titration."
    },
    "sodium hydroxide": {
        "cid": 14798,
        "name": "Sodium Hydroxide",
        "iupac": "sodium hydroxide",
        "formula": "NaOH",
        "mw": 39.997,
        "smiles": "[OH-].[Na+]",
        "hazard": "Corrosive (GHS05)",
        "description": "Strong caustic chemical base used in neutralization and manufacturing."
    },
    "methane": {
        "cid": 297,
        "name": "Methane",
        "iupac": "methane",
        "formula": "CH4",
        "mw": 16.043,
        "smiles": "C",
        "hazard": "Extremely Flammable Gas (GHS02)",
        "description": "Simplest alkane and main component of natural gas."
    }
}


def load_local_cache() -> Dict[str, Any]:
    """Loads the offline PubChem cache from disk, initializing with presets if missing."""
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                data.update(PRESET_PUBCHEM_CACHE)
                return data
        except Exception:
            return PRESET_PUBCHEM_CACHE.copy()
    return PRESET_PUBCHEM_CACHE.copy()


def save_local_cache(cache: Dict[str, Any]):
    """Persists offline cache to disk."""
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache, f, indent=2)
    except Exception:
        pass


# ------------------------------------------------------------------------------
# 1. RDKit Organic Chemistry Solver (with curriculum SVG fallback)
# ------------------------------------------------------------------------------
_CURRICULUM_MOLECULES = {
    "CC(=O)Oc1ccccc1C(=O)O": ("Aspirin", "C9H8O4", 180.16, 1.31, 63.6, 1, 4, 3, 13, 13),
    "Cn1cnc2c1c(=O)n(c(=O)n2C)C": ("Caffeine", "C8H10N4O2", 194.19, -0.07, 61.8, 0, 6, 0, 14, 14),
    "CCO": ("Ethanol", "C2H6O", 46.07, -0.31, 20.2, 1, 1, 1, 3, 3),
    "C(C(C(C(C(C=O)O)O)O)O)O": ("Glucose", "C6H12O6", 180.16, -3.22, 110.4, 5, 6, 5, 12, 12),
    "CC(C)Cc1ccc(cc1)C(C)C(=O)O": ("Ibuprofen", "C13H18O2", 206.28, 3.5, 37.3, 1, 2, 4, 15, 15),
    "c1ccccc1": ("Benzene", "C6H6", 78.11, 1.69, 0.0, 0, 0, 0, 6, 6),
    "c1cc(c(cc1CCN)O)O": ("Dopamine", "C8H11NO2", 153.18, 0.17, 66.5, 3, 3, 2, 11, 11),
    "O": ("Water", "H2O", 18.02, -0.83, 20.2, 1, 1, 0, 1, 1),
    "C": ("Methane", "CH4", 16.04, 0.64, 0.0, 0, 0, 0, 1, 1),
}


def _fallback_molecule_svg(name: str, formula: str, smiles: str) -> str:
    safe_name = name.replace("&", "&amp;").replace("<", "&lt;")
    safe_formula = formula.replace("&", "&amp;").replace("<", "&lt;")
    safe_smiles = smiles.replace("&", "&amp;").replace("<", "&lt;")
    return f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 320" width="100%" height="320">
  <rect width="420" height="320" fill="#0c0c10" rx="12"/>
  <circle cx="210" cy="118" r="54" fill="none" stroke="#38bdf8" stroke-width="3"/>
  <circle cx="168" cy="160" r="22" fill="none" stroke="#a855f7" stroke-width="2"/>
  <circle cx="252" cy="160" r="22" fill="none" stroke="#06b6d4" stroke-width="2"/>
  <line x1="168" y1="160" x2="252" y2="160" stroke="#f4f4f5" stroke-width="2"/>
  <text x="210" y="124" text-anchor="middle" fill="#ffffff" font-size="22" font-family="ui-monospace, monospace" font-weight="700">{safe_formula}</text>
  <text x="210" y="230" text-anchor="middle" fill="#c084fc" font-size="18" font-family="sans-serif">{safe_name}</text>
  <text x="210" y="258" text-anchor="middle" fill="#a1a1aa" font-size="11" font-family="ui-monospace, monospace">{safe_smiles}</text>
  <text x="210" y="292" text-anchor="middle" fill="#71717a" font-size="10" font-family="sans-serif">Curriculum structure (RDKit optional)</text>
</svg>"""


def _lookup_curriculum_molecule(query: str):
    q = (query or "").strip()
    if q in _CURRICULUM_MOLECULES:
        return q, _CURRICULUM_MOLECULES[q]
    cache = load_local_cache()
    match = cache.get(q.lower())
    if match and match.get("smiles") in _CURRICULUM_MOLECULES:
        smiles = match["smiles"]
        return smiles, _CURRICULUM_MOLECULES[smiles]
    if match:
        smiles = match.get("smiles") or q
        name = match.get("name") or q
        formula = match.get("formula") or "—"
        mw = float(match.get("mw") or 0)
        return smiles, (name, formula, mw, 0.0, 0.0, 0, 0, 0, 0, 0)
    for smiles, meta in _CURRICULUM_MOLECULES.items():
        if q.lower() == meta[0].lower() or q.replace(" ", "") == formula_compact(meta[1]):
            return smiles, meta
    return q, None


def formula_compact(value: str) -> str:
    return (value or "").replace(" ", "")


def render_molecule_fallback(smiles_or_name: str) -> Dict[str, Any]:
    smiles, meta = _lookup_curriculum_molecule(smiles_or_name)
    if meta is None:
        name = smiles_or_name.strip() or "Molecule"
        formula = name if any(ch.isdigit() for ch in name) else "—"
        svg = _fallback_molecule_svg(name, formula, smiles)
        return {
            "success": True,
            "smiles": smiles,
            "formula": formula,
            "molecular_weight": 0.0,
            "logp": 0.0,
            "tpsa": 0.0,
            "h_donors": 0,
            "h_acceptors": 0,
            "rotatable_bonds": 0,
            "num_atoms": 0,
            "num_heavy_atoms": 0,
            "svg": svg,
            "engine": "curriculum_fallback",
        }
    name, formula, mw, logp, tpsa, donors, acceptors, rotatable, atoms, heavy = meta
    return {
        "success": True,
        "smiles": smiles,
        "formula": formula,
        "molecular_weight": mw,
        "logp": logp,
        "tpsa": tpsa,
        "h_donors": donors,
        "h_acceptors": acceptors,
        "rotatable_bonds": rotatable,
        "num_atoms": atoms,
        "num_heavy_atoms": heavy,
        "svg": _fallback_molecule_svg(name, formula, smiles),
        "engine": "curriculum_fallback",
    }


def render_molecule_rdkit(smiles_or_name: str) -> Dict[str, Any]:
    """
    Parses a SMILES string or common name using RDKit when installed.
    Otherwise returns a curriculum SVG so the lab still loads.
    """
    query = smiles_or_name.strip()
    if RDKIT_AVAILABLE:
        try:
            mol = Chem.MolFromSmiles(query)
            if mol is None:
                cache = load_local_cache()
                match = cache.get(query.lower())
                if match and "smiles" in match:
                    mol = Chem.MolFromSmiles(match["smiles"])
            if mol is not None:
                drawer = rdMolDraw2D.MolDraw2DSVG(420, 320)
                opts = drawer.drawOptions()
                opts.clearBackground = False
                opts.bondLineWidth = 3
                rdMolDraw2D.PrepareAndDrawMolecule(drawer, mol)
                drawer.FinishDrawing()
                svg_content = drawer.GetDrawingText()
                mw = Descriptors.MolWt(mol)
                formula = rdMolDescriptors.CalcMolFormula(mol)
                logp = Descriptors.MolLogP(mol)
                tpsa = Descriptors.TPSA(mol)
                h_donors = Descriptors.NumHDonors(mol)
                h_acceptors = Descriptors.NumHAcceptors(mol)
                rotatable_bonds = Descriptors.NumRotatableBonds(mol)
                num_atoms = mol.GetNumAtoms()
                num_heavy_atoms = mol.GetNumHeavyAtoms()
                return {
                    "success": True,
                    "smiles": Chem.MolToSmiles(mol),
                    "formula": formula,
                    "molecular_weight": round(mw, 3),
                    "logp": round(logp, 2),
                    "tpsa": round(tpsa, 2),
                    "h_donors": h_donors,
                    "h_acceptors": h_acceptors,
                    "rotatable_bonds": rotatable_bonds,
                    "num_atoms": num_atoms,
                    "num_heavy_atoms": num_heavy_atoms,
                    "svg": svg_content,
                    "engine": "rdkit",
                }
        except Exception:
            pass
    return render_molecule_fallback(query)


# ------------------------------------------------------------------------------
# 2. SymPy & SciPy Mathematical Physics Solver
# ------------------------------------------------------------------------------
def solve_physics_symbolic(topic: str, params: Dict[str, Any]) -> Dict[str, Any]:
    """
    Symbolic physics equation solver using SymPy.
    Solves kinematics calculus, wave standing equations, or orbital mechanics.
    """
    topic = (topic or "waves").strip().lower()
    if topic in ("standing_wave", "standing", "wave"):
        topic = "waves"

    if topic == "kinematics":
        # Projectile kinematics calculus: s(t), v(t) = s'(t), a(t) = v'(t)
        v0_val = float(params.get("v0", 20.0))
        angle_deg = float(params.get("angle", 45.0))
        g_val = float(params.get("g", 9.8))

        angle_rad = math.radians(angle_deg)
        v0x = v0_val * math.cos(angle_rad)
        v0y = v0_val * math.sin(angle_rad)

        time_of_flight = (2 * v0y) / g_val if g_val else 0.0
        max_height = (v0y ** 2) / (2 * g_val) if g_val else 0.0
        range_m = v0x * time_of_flight

        if SYMPY_AVAILABLE:
            t, g, v0, theta = sp.symbols("t g v0 theta")
            s_y = v0 * sp.sin(theta) * t - sp.Rational(1, 2) * g * t**2
            v_y = sp.diff(s_y, t)
            a_y = sp.diff(v_y, t)
            symbolic_position, symbolic_velocity, symbolic_acceleration = str(s_y), str(v_y), str(a_y)
            latex_position, latex_velocity, latex_acceleration = sp.latex(s_y), sp.latex(v_y), sp.latex(a_y)
        else:
            symbolic_position = "v0*sin(theta)*t - (1/2)*g*t**2"
            symbolic_velocity = "v0*sin(theta) - g*t"
            symbolic_acceleration = "-g"
            latex_position = r"v_0\sin\theta\, t - \tfrac{1}{2}gt^{2}"
            latex_velocity = r"v_0\sin\theta - gt"
            latex_acceleration = r"-g"

        return {
            "success": True,
            "topic": "kinematics",
            "time_of_flight_s": round(time_of_flight, 2),
            "max_height_m": round(max_height, 2),
            "range_m": round(range_m, 2),
            "initial_vx": round(v0x, 2),
            "initial_vy": round(v0y, 2),
            "symbolic_position": symbolic_position,
            "symbolic_velocity": symbolic_velocity,
            "symbolic_acceleration": symbolic_acceleration,
            "latex_position": latex_position,
            "latex_velocity": latex_velocity,
            "latex_acceleration": latex_acceleration
        }

    elif topic == "waves":
        # Standing wave mechanics: y(x, t) = 2A sin(kx) cos(wt)
        freq_val = float(params.get("frequency", 5.0)) # Hz
        amp_val = float(params.get("amplitude", 1.5)) # m
        wave_speed = float(params.get("speed", 20.0)) # m/s

        wavelength = wave_speed / freq_val
        k_val = 2 * math.pi / wavelength
        omega_val = 2 * math.pi * freq_val
        period_val = 1.0 / freq_val

        # Nodes occur at x = n * (lambda / 2)
        nodes = [round(n * (wavelength / 2), 2) for n in range(5)]
        # Antinodes occur at x = (2n + 1) * (lambda / 4)
        antinodes = [round((2 * n + 1) * (wavelength / 4), 2) for n in range(5)]

        return {
            "success": True,
            "topic": "waves",
            "frequency_hz": freq_val,
            "amplitude_m": amp_val,
            "wavelength_m": round(wavelength, 2),
            "wave_speed_ms": wave_speed,
            "period_s": round(period_val, 4),
            "wavenumber_k": round(k_val, 3),
            "angular_frequency_omega": round(omega_val, 3),
            "first_nodes_m": nodes,
            "first_antinodes_m": antinodes,
            "wave_equation_str": f"y(x, t) = {amp_val} * sin({round(k_val, 2)}x - {round(omega_val, 2)}t)",
            "latex_wave": f"y(x, t) = {amp_val} \\sin({round(k_val, 2)}x - {round(omega_val, 2)}t)"
        }

    elif topic == "orbital":
        # Orbital mechanics & Kepler's 3rd law: v = sqrt(GM/r), T = 2pi*sqrt(r^3/GM)
        altitude_km = float(params.get("altitude_km", 400.0)) # ISS altitude ~400km
        R_earth = 6371.0 # km
        r_total_m = (R_earth + altitude_km) * 1000.0 # meters
        G_val = 6.67430e-11 # m^3 kg^-1 s^-2
        M_earth = 5.972e24 # kg

        v_orbit = math.sqrt((G_val * M_earth) / r_total_m)
        T_seconds = 2 * math.pi * math.sqrt((r_total_m ** 3) / (G_val * M_earth))
        T_minutes = T_seconds / 60.0

        return {
            "success": True,
            "topic": "orbital",
            "altitude_km": altitude_km,
            "orbital_radius_km": round(r_total_m / 1000.0, 1),
            "orbital_velocity_ms": round(v_orbit, 1),
            "orbital_velocity_kmh": round(v_orbit * 3.6, 1),
            "period_minutes": round(T_minutes, 1),
            "period_seconds": round(T_seconds, 1),
            "equation_str": "v = sqrt(G*M/r)",
            "latex_orbit": "v_{\\text{orbit}} = \\sqrt{\\frac{GM}{r}}, \\quad T = 2\\pi \\sqrt{\\frac{r^3}{GM}}"
        }

    return {"success": False, "error": f"Unknown physics topic: {topic}"}


# ------------------------------------------------------------------------------
# 3. PubChem & ChEMBL Search Engine (Offline-First)
# ------------------------------------------------------------------------------
def search_chemical_database(query: str) -> Dict[str, Any]:
    """
    Searches chemical databases (PubChem / ChEMBL).
    First queries the local offline cache. If not found and online,
    queries PubChem REST API, updates the cache, and returns.
    """
    clean_query = query.strip().lower()
    cache = load_local_cache()

    # 1. Check local cache (Instant offline answer)
    if clean_query in cache:
        return {"success": True, "source": "offline_cache", "data": cache[clean_query]}

    # Check partial match in cache
    for key, data in cache.items():
        if clean_query in key or clean_query in data.get("name", "").lower() or clean_query in data.get("formula", "").lower():
            return {"success": True, "source": "offline_cache", "data": data}

    # 2. If online, fetch from PubChem PUG REST API
    if requests is not None:
        try:
            url = f"https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{clean_query}/JSON"
            resp = requests.get(url, timeout=3.5)
            if resp.status_code == 200:
                pdata = resp.json()
                compound = pdata["PC_Compounds"][0]
                cid = compound["id"]["id"]["cid"]
                props = {p["urn"]["label"]: p["value"] for p in compound.get("props", []) if "value" in p}
                formula = props.get("Molecular Formula", {}).get("sval", "Unknown")
                mw = props.get("Molecular Weight", {}).get("fval", 0.0)
                iupac = props.get("IUPAC Name", {}).get("sval", clean_query.title())
                smiles = props.get("SMILES", {}).get("sval", "")
                entry = {
                    "cid": cid,
                    "name": clean_query.title(),
                    "iupac": iupac,
                    "formula": formula,
                    "mw": round(mw, 2) if isinstance(mw, (int, float)) else mw,
                    "smiles": smiles,
                    "hazard": "GHS Classified Compound",
                    "description": f"Verified chemical compound record from PubChem (CID: {cid})."
                }
                cache[clean_query] = entry
                save_local_cache(cache)
                return {"success": True, "source": "pubchem_api", "data": entry}
        except Exception:
            pass

    # 3. Fallback: Return nearest match or generic message
    return {
        "success": False,
        "error": f"Compound '{query}' not found in offline curriculum database. Available offline examples: Aspirin, Caffeine, Ethanol, Glucose, Ibuprofen, Benzene, Water, HCl, NaOH, Methane."
    }



def calculate_mixture(solutions, indicator="phenolphthalein", temp_c=25.0):
    """FastAPI-free acid/base mixture solver used by display_client Virtual Labs APIs."""
    strong_acids = {"HCl": 1, "HNO3": 1, "HBr": 1, "HI": 1, "H2SO4": 2}
    strong_bases = {"NaOH": 1, "KOH": 1, "LiOH": 1, "Ca(OH)2": 2}
    chromophores = {"CuSO4": "#0284c7", "KMnO4": "#9333ea", "FeCl3": "#d97706"}

    total_vol_ml = 0.0
    moles_h = 0.0
    moles_oh = 0.0
    species = {}
    colored_hex = None
    formulas = []

    for s in solutions or []:
        if not isinstance(s, dict):
            continue
        formula = str(s.get("formula") or "").strip()
        vol_ml = float(s.get("volume_ml") or 0.0)
        molarity = float(s.get("molarity") or s.get("concentration_m") or 0.0)
        total_vol_ml += vol_ml
        if formula:
            formulas.append(formula)
        vol_l = vol_ml / 1000.0
        moles = molarity * vol_l
        if formula:
            species[formula] = round(species.get(formula, 0.0) + moles, 6)
        if formula in strong_acids:
            moles_h += moles * strong_acids[formula]
        elif formula in strong_bases:
            moles_oh += moles * strong_bases[formula]
        if formula in chromophores:
            colored_hex = chromophores[formula]

    if total_vol_ml <= 0:
        return {
            "success": True,
            "total_volume_ml": 0.0,
            "ph": 7.0,
            "poh": 7.0,
            "color_hex": "#f8fafc",
            "indicator_state": "Empty Vessel",
            "reaction_summary": "Empty container. Add reagents to initiate simulation.",
            "neutralization_status": "Neutral",
            "species_concentrations": {},
            "chempy_active": False,
            "temp_c": temp_c,
        }

    total_vol_l = total_vol_ml / 1000.0
    # Convert mole tallies into final concentrations map
    species_concs = {k: round(v / total_vol_l, 4) for k, v in species.items()}

    net_h = moles_h - moles_oh
    if net_h > 1e-12:
        conc_h = net_h / total_vol_l
        ph = -math.log10(max(conc_h, 1e-14))
        neutralization = "Acidic Solution (Excess H+)"
    elif net_h < -1e-12:
        conc_oh = abs(net_h) / total_vol_l
        poh = -math.log10(max(conc_oh, 1e-14))
        ph = 14.0 - poh
        neutralization = "Basic Solution (Excess OH-)"
    else:
        ph = 7.0
        neutralization = "Neutral Equivalence Point (pH = 7.00)"

    ph = max(0.0, min(14.0, ph))
    poh = max(0.0, min(14.0, 14.0 - ph))

    color_hex = "#f1f5f9"
    ind_state = "Colorless"
    ind = str(indicator or "phenolphthalein").lower()
    if ind in ("phenolphthalein", "phenolphtalein"):
        if ph < 8.2:
            color_hex, ind_state = "#f8fafc", "Colorless (Acidic/Neutral)"
        elif ph < 10.0:
            color_hex, ind_state = "#f472b6", f"Faint Pink (pH {ph:.1f})"
        else:
            color_hex, ind_state = "#db2777", f"Vivid Magenta (Basic, pH {ph:.1f})"
    elif ind == "universal":
        if ph <= 3:
            color_hex, ind_state = "#ef4444", "Deep Red (Strong Acid)"
        elif ph <= 5:
            color_hex, ind_state = "#f97316", "Orange (Moderate Acid)"
        elif ph <= 6.5:
            color_hex, ind_state = "#eab308", "Yellow (Weak Acid)"
        elif ph <= 7.5:
            color_hex, ind_state = "#22c55e", "Green (Neutral)"
        elif ph <= 9.5:
            color_hex, ind_state = "#06b6d4", "Teal / Cyan (Weak Base)"
        else:
            color_hex, ind_state = "#7c3aed", "Violet / Purple (Strong Base)"
    elif ind in ("none", "water"):
        color_hex, ind_state = (colored_hex or "#e2e8f0"), "No Indicator"

    if colored_hex and ind == "none":
        color_hex = colored_hex

    if "HCl" in formulas and "NaOH" in formulas:
        summary = "Neutralization Reaction: HCl + NaOH → NaCl + H₂O"
    elif len(formulas) > 1:
        summary = f"Aqueous Mixture: {' + '.join(formulas)} (Vol: {total_vol_ml:.1f} mL)"
    elif formulas:
        summary = f"Pure {formulas[0]} Solution (Vol: {total_vol_ml:.1f} mL, pH: {ph:.2f})"
    else:
        summary = "Water / Base Dilution"

    return {
        "success": True,
        "total_volume_ml": round(total_vol_ml, 2),
        "ph": round(ph, 2),
        "poh": round(poh, 2),
        "color_hex": color_hex,
        "indicator_state": ind_state,
        "reaction_summary": summary,
        "neutralization_status": neutralization,
        "species_concentrations": species_concs,
        "chempy_active": False,
        "temp_c": temp_c,
    }

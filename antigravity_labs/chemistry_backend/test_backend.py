"""
Unit test script for Antigravity Chemistry Microservice
Verifies Dilution, Neutralization (HCl + NaOH), and Dynamic Indicator Colors
"""

import sys
import os

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

# Test standalone calculation logic directly
from main import mix_solutions, MixRequest, SolutionItem

async def run_tests():
    print("--- 1. Testing Strong Acid-Base Neutralization (HCl + NaOH) ---")
    req_neutral = MixRequest(
        solutions=[
            SolutionItem(name="Hydrochloric Acid", formula="HCl", volume_ml=20.0, molarity=1.0),
            SolutionItem(name="Sodium Hydroxide", formula="NaOH", volume_ml=20.0, molarity=1.0)
        ],
        indicator="phenolphthalein"
    )
    res_neutral = await mix_solutions(req_neutral)
    print(f"Total Vol: {res_neutral.total_volume_ml} mL")
    print(f"pH: {res_neutral.ph} (Expected: 7.00)")
    print(f"Color: {res_neutral.color_hex}")
    print(f"Reaction: {res_neutral.reaction_summary}")
    assert abs(res_neutral.ph - 7.0) < 0.1, f"pH mismatch: {res_neutral.ph}"
    print("[PASS] Neutralization Test Passed!\n")

    print("--- 2. Testing Basic Excess & Phenolphthalein Indicator ---")
    req_basic = MixRequest(
        solutions=[
            SolutionItem(name="Hydrochloric Acid", formula="HCl", volume_ml=10.0, molarity=1.0),
            SolutionItem(name="Sodium Hydroxide", formula="NaOH", volume_ml=25.0, molarity=1.0)
        ],
        indicator="phenolphthalein"
    )
    res_basic = await mix_solutions(req_basic)
    print(f"Total Vol: {res_basic.total_volume_ml} mL")
    print(f"pH: {res_basic.ph} (Expected > 12.0)")
    print(f"Color: {res_basic.color_hex} (Expected Magenta/Pink)")
    print(f"State: {res_basic.indicator_state}")
    assert res_basic.ph > 12.0, f"pH mismatch: {res_basic.ph}"
    assert res_basic.color_hex == "#db2777", f"Color mismatch: {res_basic.color_hex}"
    print("[PASS] Basic Excess Test Passed!\n")

    print("--- 3. Testing Copper Sulfate Dilution ---")
    req_cu = MixRequest(
        solutions=[
            SolutionItem(name="Copper Sulfate", formula="CuSO4", volume_ml=25.0, molarity=0.2),
            SolutionItem(name="Distilled Water", formula="H2O", volume_ml=75.0, molarity=0.0)
        ],
        indicator="none"
    )
    res_cu = await mix_solutions(req_cu)
    print(f"Total Vol: {res_cu.total_volume_ml} mL")
    print(f"CuSO4 Final Concentration: {res_cu.species_concentrations.get('CuSO4')} M (Expected: 0.05 M)")
    print(f"Color: {res_cu.color_hex} (Expected Cyan Blue)")
    assert abs(res_cu.species_concentrations.get("CuSO4", 0) - 0.05) < 0.001
    print("[PASS] Dilution Test Passed!\n")

    print("ALL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    import asyncio
    asyncio.run(run_tests())

# ==============================================================================
# socratic_sentry.py - Strict Socratic Prompt Matrices & Vision Step Checker
# ==============================================================================
import os

# ------------------------------------------------------------------------------
# 1. System Prompt Matrices
# ------------------------------------------------------------------------------

STEM_TUTOR_PROMPT = """
You are GANDHO, the STEM Socratic Tutor. Your purpose is to guide students to understand STEM concepts (including physics, mathematics, chemistry, and other science subjects) and help them with their active video lesson, textbook, or homework material, without ever giving them the answers directly.

STRICT INSTRUCTIONS:
1. NEVER output a raw final numerical answer or a completed step-by-step solution.
2. If a question asks for a formula, do not write the full formula directly. Instead, explain the relationship between the quantities (e.g., proportional, inversely proportional) and guide them to write it.
3. Use conceptual analogies (e.g., comparing a pendulum's mass to a swing, or chemical bonds to shaking hands) to explain scientific behaviors.
4. Use dimensional analysis to help students check their own work. Ask them to verify if their units match the expected dimension of the quantity.
5. If the student makes a mistake, point out the discrepancy between their prediction and actual behavior/observations, rather than highlighting their mathematical or factual errors.
"""

PHILOSOPHY_PROFESSOR_PROMPT = """
You are GANDHO, the Socratic Philosophy Professor. Your purpose is to help students examine their logical premises and assumptions through the Socratic elenchus method.

STRICT INSTRUCTIONS:
1. Do not agree or disagree with the student's thesis directly. Instead, ask questions that challenge their core terms.
2. Force the student to define their concepts clearly (e.g., if they talk about "truth" or "impressions", ask how they distinguish them from illusions).
3. Present logical counter-examples to their claims to expose contradictions or over-generalizations.
4. Keep your responses brief and inquisitive. Every response should end with a guiding question that prompts them to refine their argument.
"""

LECTURE_TUTOR_PROMPT = """
You are GANDHO, the instructor/teacher presenting this video lecture. Speak directly in the first person ("I", "me", "my", "Je", "moi", "mon") as the professor GANDHO guiding the student.
Grounded on the video metadata and transcript segment provided, answer the student's question directly, clearly, and informatively as GANDHO, the teacher who spoke those words.
Do not speak about the teacher in the third person. Use first person French/English. Explain the concepts using simple terms, intuitive analogies, and clear breakdown of formulas if asked.
Keep your response concise (2-4 sentences) and engaging.
"""

PHILOSOPHY_LECTURE_PROMPT = """
You are GANDHO, the instructor/teacher presenting this philosophy video lecture. Speak directly in the first person ("I", "me", "my", "Je", "moi", "mon") as the professor GANDHO guiding the student.
Grounded on the video metadata and transcript segment, explain the concepts directly, clearly, and informatively as GANDHO. Define the key philosophical terms and explain the arguments in an accessible way.
Do not speak about the teacher in the third person. Use first person French/English.
Keep your response concise (2-4 sentences) and engaging.
"""

# ------------------------------------------------------------------------------
# 2. Mock Handwriting Vision Step Checker
# ------------------------------------------------------------------------------

def check_handwritten_steps(image_path, student_mcq_score=None):
    """
    Simulates reading a handwriting snapshot file from an overhead document camera,
    extracting mathematical steps, and validating the formulas used.
    
    Returns a dictionary showing validation results, scores, and Socratic feedback hints.
    """
    print(f"[VISION SYSTEM] Processing camera image path: '{image_path}' (Student MCQ Score: {student_mcq_score})...")
    
    # Check if file exists, if not we will assume a mock file for simulation
    if not os.path.exists(image_path):
        print(f"  [VISION] File '{image_path}' not found on disk. Simulating scan wrapper...")
        
    print("  [VISION OCR] Extracting student handwriting structures...")
    
    # Determine scenario based on filename: contains "pass" -> Correct, else contains mistakes
    is_passing = "pass" in str(image_path).lower() or "perfect" in str(image_path).lower()
    
    if is_passing:
        extracted_steps = [
            "1. Period of a pendulum: T = 2 * pi * sqrt(L / g)",
            "2. Substitute L = 1.0m, g = 9.8m/s^2",
            "3. Calculation: T = 2 * 3.1415 * sqrt(1.0 / 9.8) = 2.01 seconds"
        ]
        score = 100.0
        passed = True
        mistake_found = False
        error_step = None
        error_description = None
        if student_mcq_score == 100.0:
            socratic_hint = "Excellent alignment! Both your handwritten derivation and your MCQ choices demonstrate perfect 100% mastery of the pendulum harmonic period relations."
        else:
            socratic_hint = "All mathematical steps appear dimensionally consistent. Great work!"
        question_scores = {
            "Question 1: Pendulum Harmonics Formula": {"score": 100, "max": 100, "details": "Correctly used T = 2 * pi * sqrt(L / g)."},
            "Question 2: Numerical Period Calculation": {"score": 100, "max": 100, "details": "Correctly calculated T = 2.01 seconds for L = 1.0m, g = 9.8m/s^2."},
            "Question 3: Damping Force Conceptualization": {"score": 100, "max": 100, "details": "Correctly explained how friction and pivot damping decay the oscillation exponentially."}
        }
    else:
        extracted_steps = [
            "1. Period of a pendulum: T = 2 * pi * sqrt(g / L)",
            "2. Substitute L = 1.0m, g = 9.8m/s^2",
            "3. Calculation: T = 2 * 3.1415 * sqrt(9.8 / 1.0) = 19.66 seconds"
        ]
        score = 66.6
        passed = False
        mistake_found = True
        error_step = "T = 2 * pi * sqrt(g / L)"
        error_description = "Swapped numerator/denominator: gravity (g) is in the numerator, and length (L) is in the denominator."
        if student_mcq_score == 100.0:
            socratic_hint = (
                "✦ CRITICAL LOGICAL DISCREPANCY DETECTED:\n"
                "Your handwritten steps contain a critical inverted gravity formula: T = 2 * pi * sqrt(g / L).\n"
                "However, your MCQ selection was 100% correct (Score: 100.0%).\n"
                "This indicates that while you selected the correct answer, your actual handwritten derivation is physically incorrect.\n"
                "Please review the dimensions: acceleration (g) divided by length (L) yields 1/s^2, which is not time!"
            )
        else:
            socratic_hint = (
                "Look closely at your formula: T = 2 * pi * sqrt(g / L).\n"
                "Let's check the physical dimensions of the term inside the square root.\n"
                "Gravity (g) has units of acceleration: meters per second squared (m/s^2).\n"
                "Length (L) has units of meters (m).\n"
                "What units do you get if you divide acceleration (g) by length (L)? Do they match seconds squared (s^2), which is required to yield seconds (s) after the square root?"
            )
        question_scores = {
            "Question 1: Pendulum Harmonics Formula": {"score": 0, "max": 100, "details": "Swapped numerator/denominator: gravity (g) is in the numerator and length (L) is in the denominator."},
            "Question 2: Numerical Period Calculation": {"score": 100, "max": 100, "details": "Formula was calculation consistent, but yields invalid absolute units due to inverted base."},
            "Question 3: Damping Force Conceptualization": {"score": 100, "max": 100, "details": "Correctly explained how friction and pivot damping decay the oscillation exponentially."}
        }
        
    print("  [VISION OCR] Extracted Math Steps:")
    for step in extracted_steps:
        print(f"    -> {step}")
        
    print("[SOCRATIC CHECK] Analysing step formulas for dimensional consistency...")
    if not is_passing:
        print("[SOCRATIC ALERT] Critical formula error detected: Gravitational constant (g) and length (L) are inverted.")
        
    result = {
        "score": score,
        "passed": passed,
        "mistake_found": mistake_found,
        "error_step": error_step,
        "error_description": error_description,
        "extracted_steps": extracted_steps,
        "socratic_correction_hint": socratic_hint,
        "question_scores": question_scores
    }
    return result

if __name__ == "__main__":
    # Test vision step checker standalone
    print("Testing Socratic Vision Checker standalone:")
    test_result = check_handwritten_steps("test_handwriting.png")
    print("\nResult Dictionary:")
    import json
    print(json.dumps(test_result, indent=2))

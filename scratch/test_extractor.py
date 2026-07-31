def extract_function_from_query(query):
    if not query:
        return None
    q = query.lower().strip()
    markers = ["plot ", "graph ", "simulate ", "show me "]
    for marker in markers:
        idx = q.find(marker)
        if idx != -1:
            expr = query[idx + len(marker):].strip()
            # Trim punctuation
            import re
            expr = re.sub(r'[?.;!]$', '', expr).strip()
            while True:
                lower_expr = expr.lower()
                if lower_expr.startswith("of "):
                    expr = expr[3:].strip()
                elif lower_expr.startswith("for "):
                    expr = expr[4:].strip()
                elif lower_expr.startswith("the "):
                    expr = expr[4:].strip()
                elif lower_expr.startswith("function "):
                    expr = expr[9:].strip()
                elif lower_expr.startswith("a "):
                    expr = expr[2:].strip()
                else:
                    break
            if 'x' in expr and len(expr) < 30 and 'the' not in expr and 'how' not in expr:
                # Replace digit juxtaposition e.g. 2x -> 2*x
                expr = re.sub(r'(\d)x', r'\1*x', expr)
                return expr
    return None

# Test cases
test_cases = {
    "plot 2x": "2*x",
    "graph of 3x": "3*x",
    "plot the function x^2": "x^2",
    "simulate a graph for 4x": "4*x",
    "what is the derivative of 2x?": None, # Should be None because no graph trigger marker
    "plot log(3x)": "log(3*x)",
    "show me a plot of 2x - 5": "2*x - 5"
}

success = True
for query, expected in test_cases.items():
    actual = extract_function_from_query(query)
    if actual != expected:
        print(f"FAILED: Query '{query}' -> Expected: '{expected}', Got: '{actual}'")
        success = False
    else:
        print(f"PASSED: Query '{query}' -> Got: '{actual}'")

if success:
    print("All extraction test cases passed!")
else:
    print("Some extraction test cases failed.")

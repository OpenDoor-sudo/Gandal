"""
savant_curriculum_matrix.py
---------------------------
Provides historical savant biographies, interdisciplinary chapter connections,
and real-world applications for the Ventuno AI Socratic Tutor (GANDHO).
"""

SAVANT_AND_CHAPTER_CONNECTIONS = {
    # ECONOMICS & EXTRA-ECONOMIC STUDIES
    "vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques": {
        "savant": "Thomas Robert Malthus (1798) & Marquis de Condorcet",
        "era_context": "Late 18th Century Industrial Revolution in Britain & France",
        "historical_bio": (
            "Thomas Malthus published 'An Essay on the Principle of Population' in 1798, warning that population grows exponentially "
            "while food supply grows linearly. This sparked modern demography and political economy."
        ),
        "interdisciplinary_connections": (
            "Connects directly forward to Chapter 02 (Les Problèmes Sanitaires) and Chapter 03 (Les Problèmes Alimentaires). "
            "Mathematically links to exponential growth curves in Calculus and resource allocation in macroeconomics."
        ),
        "real_world_applications": "Used today in global urban planning, census analytics, demographic dividend modeling, and UN sustainability policy."
    },
    "vid_economics_extraeconomiques_02_les_probl_mes_sanitaires": {
        "savant": "Louis Pasteur (1860s) & Edward Jenner (1796)",
        "era_context": "19th Century Germ Theory Revolution in France and England",
        "historical_bio": (
            "Louis Pasteur disproved spontaneous generation and developed germ theory and vaccination in the 1860s, while Edward Jenner "
            "created the first smallpox vaccine in 1796. Their work transformed public health from a philosophical debate into an empirical science."
        ),
        "interdisciplinary_connections": (
            "Builds upon Chapter 01 (Les Problèmes Démographiques — rapid urbanization creates sanitation risks) and prepares students for "
            "Chapter 03 (Les Problèmes Alimentaires — nutrition and disease immunity). Biologically links to Organic Chemistry and epidemiology."
        ),
        "real_world_applications": "Powers modern healthcare infrastructure, WHO epidemic tracking, pharmaceutical R&D, and health economics."
    },
    "vid_economics_extraeconomiques_03_probl_mes_alimentaires": {
        "savant": "Norman Borlaug (1960s) & Justus von Liebig (1840s)",
        "era_context": "Mid-20th Century Green Revolution & Agricultural Chemistry",
        "historical_bio": (
            "Norman Borlaug, known as the 'Father of the Green Revolution', developed high-yielding disease-resistant wheat varieties in the 1960s, "
            "saving over a billion lives from starvation and winning the Nobel Peace Prize."
        ),
        "interdisciplinary_connections": (
            "Completes the Extra-Economic triad (Demographics -> Public Health -> Food Security). Links directly to Organic Chemistry (fertilizers & nitrogen fixation) "
            "and ecological sustainability in Biology."
        ),
        "real_world_applications": "Underpins modern agritech, automated precision farming, global food supply chain logistics, and food security policy."
    },

    # PHYSICS & MECHANICS
    "vid_physics_01": {
        "savant": "Galileo Galilei (1602) & Christiaan Huygens (1656)",
        "era_context": "17th Century Scientific Revolution in Italy & Holland",
        "historical_bio": (
            "Galileo discovered the isochronism of the pendulum while watching a swinging chandelier in the Cathedral of Pisa in 1581. "
            "Christiaan Huygens later invented the pendulum clock in 1656, creating humanity's first precise timekeeping device."
        ),
        "interdisciplinary_connections": (
            "Connects to Chapter 02 (Gravitational Motion & Universal Gravitation). Mathematically links to Trigonometric Sinusoidal Functions, "
            "Derivatives (Velocity & Acceleration), and Differential Equations in Calculus."
        ),
        "real_world_applications": "Essential for mechanical watchmaking, earthquake damper engineering in skyscrapers, AC electrical circuits, and orbital stabilization."
    },
    "vid_physics_02": {
        "savant": "Sir Isaac Newton (1687) & Johannes Kepler (1609)",
        "era_context": "Late 17th Century Universal Gravitation in England",
        "historical_bio": (
            "Sir Isaac Newton published the 'Principia Mathematica' in 1687, formulating the Laws of Motion and Universal Gravitation "
            "that unified celestial planetary motion with earthly gravity under a single mathematical framework."
        ),
        "interdisciplinary_connections": (
            "Builds on Simple Harmonic Motion (Physics 01) and leads directly into Calculus (Derivatives & Integrals of Motion). Connects to "
            "Chemistry through intermolecular forces and atomic potential wells."
        ),
        "real_world_applications": "Used in NASA satellite trajectory calculation, SpaceX rocket launch telemetry, GPS satellite synchronization, and astrophysics."
    },

    # CHEMISTRY & ORGANIC SYNTHESIS
    "vid_chemistry_organic_chemistry_chemistry": {
        "savant": "Antoine Lavoisier (1789) & Friedrich Wöhler (1828)",
        "era_context": "Late 18th & Early 19th Century Chemical Revolution in Germany",
        "historical_bio": (
            "Friedrich Wöhler shattered the doctrine of 'vitalism' in 1828 by synthesizing urea (an organic compound) from inorganic ammonium cyanate, "
            "proving that biological life obeys the same physical laws of chemistry as inanimate matter."
        ),
        "interdisciplinary_connections": (
            "Connects to Agricultural Chemistry (Food Security in Economics Chapter 03) and Public Health (Pharmaceuticals in Economics Chapter 02). "
            "Links to Thermodynamics and Energy Conservation in Physics."
        ),
        "real_world_applications": "Drives modern biotechnology, pharmaceutical drug design, biodegradable plastics synthesis, and renewable biofuel energy."
    },

    # PHILOSOPHY & ETHICS
    "vid_philosophy_01": {
        "savant": "Zeno of Citium (300 BCE), Epictetus & Marcus Aurelius",
        "era_context": "Hellenistic Greece & Imperial Rome",
        "historical_bio": (
            "Stoicism was founded by Zeno of Citium around 300 BCE on a painted porch (Stoa Poikile) in Athens. Roman Emperor Marcus Aurelius "
            "wrote 'Meditations' as a private journal practicing Stoic resilience amidst war and plagues."
        ),
        "interdisciplinary_connections": (
            "Connects to Logic and Mathematical Reasoning (Boolean Logic). Links to Economics (Rational Decision-Making under Uncertainty) "
            "and Modern Cognitive Behavioral Therapy (CBT) in Psychology."
        ),
        "real_world_applications": "Forms the foundation of Cognitive Behavioral Therapy (CBT), executive leadership under crisis, resilience engineering, and ethical AI design."
    },

    # MATHEMATICS & CALCULUS (GENERIC FALLBACK FOR MATH TRACKS)
    "math_calculus_default": {
        "savant": "Isaac Newton & Gottfried Wilhelm Leibniz (Late 17th Century) / George Boole (1847)",
        "era_context": "17th & 19th Century Mathematical Innovations in Europe",
        "historical_bio": (
            "Newton and Leibniz independently invented Calculus in the late 1600s to measure instantaneous rate of change and areas under curves. "
            "In 1847, George Boole published 'The Mathematical Analysis of Logic', creating Boolean Algebra which turned logic into mathematical symbols."
        ),
        "interdisciplinary_connections": (
            "Derivatives measure rates of change (Velocity/Economics growth), while Integrals accumulate total change (Distance/Total Wealth). "
            "Integrals and Derivatives are fundamental inverse operations linked by the Fundamental Theorem of Calculus. Boolean Algebra directly powers computer microprocessors."
        ),
        "real_world_applications": "Underpins machine learning neural networks, financial derivative trading, computer chip design, quantum computing, and fluid dynamics."
    }
}

def get_savant_and_connections_context(video_id: str, subject: str = "General", locale: str = "fr_FR") -> str:
    """
    Returns a rich, formatted instruction string containing the historical savant bio,
    interdisciplinary chapter connections, and real-world applications for GANDHO.
    """
    data = SAVANT_AND_CHAPTER_CONNECTIONS.get(video_id)
    if not data:
        # Check by subject fallback
        subj_lower = subject.lower()
        if "math" in subj_lower or "calculus" in subj_lower:
            data = SAVANT_AND_CHAPTER_CONNECTIONS["math_calculus_default"]
        elif "econ" in subj_lower:
            data = SAVANT_AND_CHAPTER_CONNECTIONS["vid_economics_extraeconomiques_01_les_probl_mes_d_mographiques"]
        elif "physic" in subj_lower:
            data = SAVANT_AND_CHAPTER_CONNECTIONS["vid_physics_01"]
        elif "chem" in subj_lower:
            data = SAVANT_AND_CHAPTER_CONNECTIONS["vid_chemistry_organic_chemistry_chemistry"]
        elif "phil" in subj_lower:
            data = SAVANT_AND_CHAPTER_CONNECTIONS["vid_philosophy_01"]
        else:
            data = SAVANT_AND_CHAPTER_CONNECTIONS["math_calculus_default"]

    if locale == "fr_FR":
        context_str = (
            f"\n--- INFORMATIONS SAVANT HISTORIQUE & CONNEXIONS INTERDISCIPLINAIRES ---\n"
            f"- Savant / Penseur Historique : {data['savant']} ({data['era_context']})\n"
            f"- Biographie / Contexte Historique : {data['historical_bio']}\n"
            f"- Liens Interdisciplinaires entre Chapitres : {data['interdisciplinary_connections']}\n"
            f"- Applications Concrètes dans le Monde Réel : {data['real_world_applications']}\n"
            f"DIRECTIVE PEDAGOGIQUE :\n"
            f"Lors de l'introduction d'un chapitre ou au cours des explications socratiques, donnez une brève anecdote inspirante sur le savant qui a créé la notion (qui, quand, dans quel contexte), "
            f"et reliez toujours le chapitre aux notions précédentes/suivantes et aux applications réelles pour inspirer l'élève.\n"
        )
    else:
        context_str = (
            f"\n--- HISTORICAL SAVANT & INTERDISCIPLINARY CONNECTIONS ---\n"
            f"- Historical Savant / Thinker: {data['savant']} ({data['era_context']})\n"
            f"- Historical Context & Bio: {data['historical_bio']}\n"
            f"- Interdisciplinary & Cross-Chapter Links: {data['interdisciplinary_connections']}\n"
            f"- Real-World Modern Applications: {data['real_world_applications']}\n"
            f"PEDAGOGICAL DIRECTIVE:\n"
            f"When introducing a new topic or during Socratic explanations, share a quick, inspiring 1-2 sentence bio/anecdote about the savant who created/discovered the concept (who, when, historical context), "
            f"and connect the active chapter to related prior/future chapters and real-world applications to ignite student curiosity.\n"
        )

    return context_str

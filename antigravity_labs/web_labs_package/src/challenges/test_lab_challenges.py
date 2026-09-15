"""Sanity checks for lab mission definitions (no browser)."""
import pathlib
import re
import unittest


SOURCE = pathlib.Path(__file__).with_name("lab_challenges.js").read_text(encoding="utf-8")


class LabChallengeSourceTests(unittest.TestCase):
    def test_expected_mission_ids_exist(self):
        for badge_id in (
            "moon_drop",
            "jupiter_slam",
            "elastic_swap",
            "standing_resonance",
            "sniper_range",
            "iss_orbit",
        ):
            self.assertIn(f'id: "{badge_id}"', SOURCE)

    def test_french_titles_present(self):
        self.assertIn("Galilée sur la Lune", SOURCE)
        self.assertIn("Missions du labo", SOURCE)

    def test_momentum_topic_exists(self):
        self.assertIn('topic: "phys_momentum"', SOURCE)
        self.assertGreaterEqual(len(re.findall(r'topic: "phys_', SOURCE)), 3)


if __name__ == "__main__":
    unittest.main()

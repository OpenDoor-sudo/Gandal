/**
 * curriculum_service.js - Curriculum Data Service
 * Loads challenges from LanceDB / backend API or offline JSON catalog.
 */

export class CurriculumService {
  constructor() {
    this.problems = [];
    this.levels = [];
  }

  async loadCurriculum() {
    try {
      // 1. Try backend API first (LanceDB connected)
      const res = await fetch("/api/circuits/curriculum");
      if (res.ok) {
        const data = await res.json();
        this.problems = data.problems || [];
      }
    } catch (err) {
      console.warn("[CURRICULUM SERVICE] Backend fetch failed, trying local JSON:", err);
    }

    // 2. Fallback to offline local JSON
    if (!this.problems || this.problems.length === 0) {
      try {
        const jsonRes = await fetch("/antigravity_labs/circuits_lab/data/curriculum.json?v=" + Date.now());
        if (jsonRes.ok) {
          this.problems = await jsonRes.json();
        }
      } catch (jsonErr) {
        console.error("[CURRICULUM SERVICE] Failed to load local JSON catalog:", jsonErr);
      }
    }

    this._organizeLevels();
    return this.problems;
  }

  _organizeLevels() {
    const levelMap = new Map();

    this.problems.forEach((p) => {
      const lvl = p.level || 1;
      const title = p.level_title_fr || p.level_title || `Niveau ${lvl}`;

      if (!levelMap.has(lvl)) {
        levelMap.set(lvl, {
          level: lvl,
          title: title,
          problems: []
        });
      }
      levelMap.get(lvl).problems.push(p);
    });

    this.levels = Array.from(levelMap.values()).sort((a, b) => a.level - b.level);
  }

  getLevels() {
    return this.levels;
  }

  getProblem(problemId) {
    return this.problems.find((p) => p.id === problemId) || this.problems[0] || null;
  }
}

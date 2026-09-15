/**
 * Lightweight localStorage progress for STEM modules.
 * Keys are namespaced to avoid collisions with lesson video progress.
 */

const STORAGE_KEY = "gandal_stem_lab_progress_v1";

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { circuits: {}, labs: {}, updatedAt: null };
    const parsed = JSON.parse(raw);
    return {
      circuits: parsed.circuits || {},
      labs: parsed.labs || {},
      updatedAt: parsed.updatedAt || null
    };
  } catch (_) {
    return { circuits: {}, labs: {}, updatedAt: null };
  }
}

function writeStore(store) {
  try {
    store.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent("gandal-lab-progress", { detail: store }));
  } catch (_) {
    /* quota / private mode */
  }
}

export function getLabProgressStore() {
  return readStore();
}

/** Circuits: save last problem + completed step index + completion flag */
export function saveCircuitsProgress({
  problemId,
  stepIndex = 0,
  totalSteps = 0,
  completed = false,
  mode = "VIRTUAL"
} = {}) {
  if (!problemId) return;
  const store = readStore();
  const prev = store.circuits[problemId] || {};
  store.circuits[problemId] = {
    ...prev,
    problemId,
    stepIndex,
    totalSteps,
    completed: !!(completed || prev.completed),
    mode,
    updatedAt: new Date().toISOString()
  };
  store.circuits._lastProblemId = problemId;
  writeStore(store);
}

export function getCircuitsProgress(problemId) {
  const store = readStore();
  if (problemId) return store.circuits[problemId] || null;
  return store.circuits;
}

export function getLastCircuitsProblemId() {
  return readStore().circuits._lastProblemId || null;
}

export function markCircuitsProblemComplete(problemId) {
  saveCircuitsProgress({ problemId, completed: true, stepIndex: 999, totalSteps: 999 });
}

/** Virtual Labs topic completion */
export function saveLabsProgress(topicId, { completed = false, visits = null } = {}) {
  if (!topicId) return;
  const store = readStore();
  const prev = store.labs[topicId] || { visits: 0 };
  store.labs[topicId] = {
    ...prev,
    topicId,
    completed: !!(completed || prev.completed),
    visits: visits != null ? visits : (prev.visits || 0) + 1,
    updatedAt: new Date().toISOString()
  };
  writeStore(store);
}

export function getLabsProgress(topicId) {
  const store = readStore();
  if (topicId) return store.labs[topicId] || null;
  return store.labs;
}

export function countCompletedCircuits() {
  const circuits = readStore().circuits;
  return Object.keys(circuits).filter((k) => k !== "_lastProblemId" && circuits[k]?.completed).length;
}

export function countCompletedLabs() {
  const labs = readStore().labs;
  return Object.keys(labs).filter((k) => labs[k]?.completed).length;
}

/** Aggregate for launcher dots */
export function getLauncherProgressSummary() {
  return {
    circuitsCompleted: countCompletedCircuits(),
    labsCompleted: countCompletedLabs(),
    circuitsLast: getLastCircuitsProblemId(),
    store: readStore()
  };
}

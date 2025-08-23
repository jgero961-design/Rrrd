"use strict";

function clampProbability(x) {
  if (Number.isNaN(x) || !Number.isFinite(x)) return NaN;
  return Math.min(1, Math.max(0, x));
}

function formatProb(p) {
  if (Number.isNaN(p)) return "—";
  return `${(p * 100).toFixed(2)}%`;
}

function readMatrix() {
  const a = parseFloat(document.getElementById("a").value);
  const b = parseFloat(document.getElementById("b").value);
  const c = parseFloat(document.getElementById("c").value);
  const d = parseFloat(document.getElementById("d").value);
  return { a, b, c, d };
}

function hasSaddlePoint(a, b, c, d) {
  const rowMinima = [Math.min(a, b), Math.min(c, d)];
  const colMaxima = [Math.max(a, c), Math.max(b, d)];
  const maximin = Math.max(...rowMinima);
  const minimax = Math.min(...colMaxima);
  return { exists: Math.abs(maximin - minimax) < 1e-12, value: (maximin + minimax) / 2, maximin, minimax };
}

function solve2x2(a, b, c, d) {
  const EPS = 1e-10;
  const saddle = hasSaddlePoint(a, b, c, d);
  if (saddle.exists) {
    // Pure strategy equilibrium
    const r1min = Math.min(a, b);
    const r2min = Math.min(c, d);
    const rowPure = r1min >= r2min ? 0 : 1; // 0->R1, 1->R2
    const c1max = Math.max(a, c);
    const c2max = Math.max(b, d);
    const colPure = c1max <= c2max ? 0 : 1; // 0->C1, 1->C2
    const value = saddle.value;
    return {
      type: "pure",
      p: rowPure === 0 ? 1 : 0,
      q: colPure === 0 ? 1 : 0,
      value,
      detail: `Saddle point exists. Pure strategies: Row -> R${rowPure + 1}, Column -> C${colPure + 1}. Value = ${value}.`
    };
  }

  // Mixed strategies
  const denom = (a - b - c + d);
  if (Math.abs(denom) < EPS) {
    // Degenerate case: parallel indifference lines; pick an equalizing mix if possible
    // Try to equalize Row's payoffs by choosing q such that a*q + b*(1-q) = c*q + d*(1-q)
    // Since denom ~ 0, slopes are equal; if intercepts equal too, infinite solutions.
    const leftIntercept = b - d;
    if (Math.abs(leftIntercept) < EPS) {
      return {
        type: "degenerate",
        p: 0.5,
        q: 0.5,
        value: (a + b + c + d) / 4,
        detail: "Degenerate game (parallel indifference). Many optimal strategies; returning 50/50 mixes."
      };
    }
    // Otherwise fall back to corner that maximizes Row's minimum
    const rowMinima = [Math.min(a, b), Math.min(c, d)];
    const rowPure = rowMinima[0] >= rowMinima[1] ? 0 : 1;
    const colMaxima = [Math.max(a, c), Math.max(b, d)];
    const colPure = colMaxima[0] <= colMaxima[1] ? 0 : 1;
    const value = (rowPure === 0 ? (colPure === 0 ? a : b) : (colPure === 0 ? c : d));
    return { type: "approx-pure", p: rowPure === 0 ? 1 : 0, q: colPure === 0 ? 1 : 0, value, detail: "Near-degenerate; chose robust pure strategies." };
  }

  const pRaw = (d - c) / denom; // Row mixes R1 with prob p
  const qRaw = (d - b) / denom; // Column mixes C1 with prob q
  const p = clampProbability(pRaw);
  const q = clampProbability(qRaw);
  const value = (a * d - b * c) / denom;

  return {
    type: "mixed",
    p,
    q,
    value,
    detail: `Mixed-strategy solution with p = (d - c)/(a - b - c + d) and q = (d - b)/(a - b - c + d).`
  };
}

function updateUI(solution) {
  const rowEl = document.getElementById("rowMix");
  const colEl = document.getElementById("colMix");
  const valEl = document.getElementById("gameValue");
  const expEl = document.getElementById("explanation");

  if (!solution) {
    rowEl.textContent = "—";
    colEl.textContent = "—";
    valEl.textContent = "—";
    expEl.textContent = "";
    return;
  }

  rowEl.textContent = `Play R1 with ${formatProb(solution.p)}, R2 with ${formatProb(1 - solution.p)}`;
  colEl.textContent = `Play C1 with ${formatProb(solution.q)}, C2 with ${formatProb(1 - solution.q)}`;
  valEl.textContent = `${solution.value.toFixed(4)}`;
  expEl.textContent = solution.detail;
}

function onSolve() {
  const { a, b, c, d } = readMatrix();
  if ([a, b, c, d].some(x => Number.isNaN(x))) {
    alert("Please enter valid numeric payoffs for all cells.");
    return;
  }
  const sol = solve2x2(a, b, c, d);
  updateUI(sol);
}

function onReset() {
  document.getElementById("a").value = 2;
  document.getElementById("b").value = -1;
  document.getElementById("c").value = -3;
  document.getElementById("d").value = 0;
  updateUI(null);
}

document.getElementById("solveBtn").addEventListener("click", onSolve);
document.getElementById("resetBtn").addEventListener("click", onReset);

// Initialize
updateUI(null);


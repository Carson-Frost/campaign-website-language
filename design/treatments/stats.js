// Interval code shared by the treatment specimens and later mockups. Checked against all 228 rows of
// results/term_gaps.csv.

// Wilson score interval (Brown, Cai and DasGupta 2001), as tools/inference.py computes it.
function wilson(k, n, z = 1.959964) {
  if (!n) return [0, 1];
  const p = k / n, d = 1 + (z * z) / n, c = (p + (z * z) / (2 * n)) / d;
  const h = (z * Math.sqrt((p * (1 - p)) / n + (z * z) / (4 * n * n))) / d;
  return [Math.max(0, c - h), Math.min(1, c + h)];
}

// Newcombe's hybrid score interval for a difference of two proportions (method 10).
function newcombe(k1, n1, k2, n2) {
  const p1 = k1 / n1, p2 = k2 / n2, [l1, u1] = wilson(k1, n1), [l2, u2] = wilson(k2, n2), d = p1 - p2;
  return [d - Math.sqrt((p1 - l1) ** 2 + (u2 - p2) ** 2), d + Math.sqrt((u1 - p1) ** 2 + (p2 - l2) ** 2)];
}

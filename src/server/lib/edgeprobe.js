import {
  ensurePlainObject,
} from 'ensure-type';

/**
 * Generates evenly-spaced sample points along a straight line from `start`
 * to `end` (inclusive), for probing an edge at multiple points to detect
 * skew rather than assuming it's perfectly aligned to a machine axis.
 *
 * @param {object} options
 * @param {object} options.start - { x, y } first sample point
 * @param {object} options.end - { x, y } last sample point
 * @param {number} options.count - number of sample points (minimum 2)
 * @returns {array} Array of sample points [{x, y}, ...]
 */
export const createEdgeProbePoints = (options) => {
  const { start, end, count = 2 } = ensurePlainObject(options);
  const n = Math.max(2, Math.floor(Number(count) || 2));

  const points = [];
  for (let i = 0; i < n; ++i) {
    const t = i / (n - 1);
    points.push({
      x: Number(start.x) + (Number(end.x) - Number(start.x)) * t,
      y: Number(start.y) + (Number(end.y) - Number(start.y)) * t,
    });
  }

  return points;
};

/**
 * Fits a line d = slope * t + intercept through a set of (independent,
 * dependent) pairs using ordinary least squares, and reports the angle
 * that line makes relative to the independent axis. Used to turn a set of
 * edge-probe contact points into a single skew angle: `t` is each probe's
 * position along the edge (the line-spacing axis), `d` is the measured
 * contact position along the probed (perpendicular) axis.
 *
 * @param {array} pairs - Array of [t, d] pairs, minimum 2
 * @returns {object|null} { slope, intercept, angleRad, angleDeg } or null
 *   if fewer than 2 pairs are given
 */
export const fitLine = (pairs = []) => {
  const n = pairs.length;
  if (n < 2) {
    return null;
  }

  let sumT = 0;
  let sumD = 0;
  let sumTT = 0;
  let sumTD = 0;
  pairs.forEach(([t, d]) => {
    sumT += t;
    sumD += d;
    sumTT += t * t;
    sumTD += t * d;
  });

  const meanT = sumT / n;
  const meanD = sumD / n;
  const denominator = sumTT - (n * meanT * meanT);

  // All sample points share the same `t` (shouldn't happen with >=2 points
  // spread over a nonzero line, but guard against divide-by-zero anyway)
  const slope = denominator !== 0 ? (sumTD - (n * meanT * meanD)) / denominator : 0;
  const intercept = meanD - (slope * meanT);
  const angleRad = Math.atan(slope);
  const angleDeg = angleRad * (180 / Math.PI);

  return { slope, intercept, angleRad, angleDeg };
};

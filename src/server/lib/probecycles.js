/**
 * Shared math for the corner/bore/boss/rectangle probing cycles. Each
 * cycle follows the same theory as edgeprobe.js: generate known sample
 * points in JS, probe them one at a time via G38.2, capture contact
 * positions as GrblController accumulates PRB reports, then fit geometry
 * to the results once all points are in.
 */

// Fits a circle to 3+ points using the algebraic (Kasa) least-squares
// method: minimizes sum((x-cx)^2+(y-cy)^2-r^2)^2 via a linear solve.
// Used for both Bore (inside a hole) and Boss (outside a post) probes --
// the fit itself doesn't care which direction the probes approached from.
//
// @param {array} points - [{x, y}, ...], minimum 3
// @returns {object|null} { centerX, centerY, radius, diameter } or null
export const fitCircle = (points = []) => {
  const n = points.length;
  if (n < 3) {
    return null;
  }

  // Solve for (A, B, C) in x^2+y^2 + A*x + B*y + C = 0, i.e. a circle
  // with center (-A/2, -B/2) and radius sqrt((A^2+B^2)/4 - C).
  let sumX = 0;
  let sumY = 0;
  let sumXX = 0;
  let sumYY = 0;
  let sumXY = 0;
  let sumXZ = 0;
  let sumYZ = 0;
  let sumZ = 0;

  points.forEach(({ x, y }) => {
    const z = (x * x) + (y * y);
    sumX += x;
    sumY += y;
    sumXX += x * x;
    sumYY += y * y;
    sumXY += x * y;
    sumXZ += x * z;
    sumYZ += y * z;
    sumZ += z;
  });

  // Normal equations for least-squares fit of A, B, C (3x3 linear solve
  // via Cramer's rule -- point counts here are small, always well within
  // safe float precision).
  const m = [
    [sumXX, sumXY, sumX],
    [sumXY, sumYY, sumY],
    [sumX, sumY, n],
  ];
  const rhs = [-sumXZ, -sumYZ, -sumZ];

  const det3 = (mat) => (
    (mat[0][0] * ((mat[1][1] * mat[2][2]) - (mat[1][2] * mat[2][1])))
    - (mat[0][1] * ((mat[1][0] * mat[2][2]) - (mat[1][2] * mat[2][0])))
    + (mat[0][2] * ((mat[1][0] * mat[2][1]) - (mat[1][1] * mat[2][0])))
  );

  const detM = det3(m);
  if (detM === 0) {
    return null;
  }

  const solveFor = (col) => {
    const mCol = m.map((row, i) => row.map((v, j) => (j === col ? rhs[i] : v)));
    return det3(mCol) / detM;
  };

  const A = solveFor(0);
  const B = solveFor(1);
  const C = solveFor(2);

  const centerX = -A / 2;
  const centerY = -B / 2;
  const radiusSquared = ((A * A) + (B * B)) / 4 - C;
  const radius = radiusSquared > 0 ? Math.sqrt(radiusSquared) : 0;

  return {
    centerX,
    centerY,
    radius,
    diameter: radius * 2,
  };
};

// Generates N points evenly spaced around a circle of the given radius,
// centered at `center`, starting at `startAngleDeg` (0 = +X axis,
// counter-clockwise). Used to plan bore/boss probe approach positions.
//
// @param {object} options
// @param {object} options.center - { x, y }
// @param {number} options.radius - approach/target radius
// @param {number} options.count - number of points (minimum 3)
// @param {number} [options.startAngleDeg] - default 0
// @returns {array} [{ x, y, angleDeg }, ...]
export const createCirclePoints = (options = {}) => {
  const { center, radius, count = 3, startAngleDeg = 0 } = options;
  const n = Math.max(3, Math.floor(Number(count) || 3));

  const points = [];
  for (let i = 0; i < n; ++i) {
    const angleDeg = startAngleDeg + ((360 / n) * i);
    const angleRad = angleDeg * (Math.PI / 180);
    points.push({
      x: Number(center.x) + (Number(radius) * Math.cos(angleRad)),
      y: Number(center.y) + (Number(radius) * Math.sin(angleRad)),
      angleDeg,
    });
  }

  return points;
};

// Intersects two fitted edge lines (see edgeprobe.js's fitLine) to find a
// corner point, instead of assuming the two edges meet at a perfect 90°
// (a single-point-per-edge probe can't tell the difference; this can,
// as long as each edge was probed at 2+ points).
//
// lineA is the edge probed along X (dependent = x, independent = y):
//   x = lineA.slope * y + lineA.intercept
// lineB is the edge probed along Y (dependent = y, independent = x):
//   y = lineB.slope * x + lineB.intercept
//
// @param {object} lineA - { slope, intercept } from fitLine() on the X edge
// @param {object} lineB - { slope, intercept } from fitLine() on the Y edge
// @returns {object|null} { x, y } or null if the edges are parallel
export const intersectLines = (lineA, lineB) => {
  if (!lineA || !lineB) {
    return null;
  }

  const denominator = 1 - (lineA.slope * lineB.slope);
  if (denominator === 0) {
    return null;
  }

  const x = ((lineA.slope * lineB.intercept) + lineA.intercept) / denominator;
  const y = (lineB.slope * x) + lineB.intercept;

  return { x, y };
};

// Derives center/width/length from 4 wall-contact points (order: +X, -X,
// +Y, -Y walls, matching how Rectangular Pocket/Solid probes are
// sequenced). Used for both Pocket (inside a cavity) and Solid (outside a
// block) probes -- only the probe approach direction differs between them,
// not this math.
//
// @param {object} walls - { plusX: {x,y}, minusX: {x,y}, plusY: {x,y}, minusY: {x,y} }
// @returns {object} { centerX, centerY, width, length }
export const fitRectangle = (walls = {}) => {
  const { plusX, minusX, plusY, minusY } = walls;

  const centerX = (plusX.x + minusX.x) / 2;
  const centerY = (plusY.y + minusY.y) / 2;
  const width = Math.abs(plusX.x - minusX.x);
  const length = Math.abs(plusY.y - minusY.y);

  return { centerX, centerY, width, length };
};

// Probe direction: which axis is probed (perpendicular touch direction) and
// which axis the sample points are spaced along (the edge itself), plus the
// sign of approach for that probe axis.
export const PROBE_DIRECTIONS = [
  { value: 'x+', label: '+X', probeAxis: 'x', lineAxis: 'y', sign: 1 },
  { value: 'x-', label: '-X', probeAxis: 'x', lineAxis: 'y', sign: -1 },
  { value: 'y+', label: '+Y', probeAxis: 'y', lineAxis: 'x', sign: 1 },
  { value: 'y-', label: '-Y', probeAxis: 'y', lineAxis: 'x', sign: -1 },
];

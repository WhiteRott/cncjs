import * as THREE from 'three';
import {
  TOOL_SHAPE_ENDMILL,
  TOOL_SHAPE_BALLEND,
  TOOL_SHAPE_BULLNOSE,
  TOOL_SHAPE_CHAMFER,
  TOOL_SHAPE_VBIT,
  TOOL_SHAPE_TAPERED_BALLNOSE,
  TOOL_SHAPE_DRILL,
} from 'app/constants';

const SEGMENTS = 24;

// Builds a cylinder (or cone, if radiusTop !== radiusBottom) whose base sits
// at z=0 and extends upward to z=height, matching the tool convention where
// the tip touches the origin and the shank extends up the Z axis.
const createTaperedPiece = (radiusTop, radiusBottom, height, material) => {
  const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, SEGMENTS);
  geometry.rotateX(Math.PI / 2); // Cylinder's default axis is Y; align it to Z
  geometry.translate(0, 0, height / 2); // Shift the base from z=-h/2..h/2 to z=0..h
  return new THREE.Mesh(geometry, material);
};

// Builds a rounded (hemisphere) tip of the given radius, its curved side
// touching z=0 and its flat side at z=radius, ready to sit under a shaft.
const createRoundedTipPiece = (radius, material) => {
  const geometry = new THREE.SphereGeometry(radius, SEGMENTS, SEGMENTS, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
  geometry.translate(0, 0, radius);
  return new THREE.Mesh(geometry, material);
};

const buildEndmill = (radius, length, material) => {
  const group = new THREE.Group();
  group.add(createTaperedPiece(radius, radius, length, material));
  return group;
};

// Ball End and Bullnose are visually approximated with the same rounded-tip
// shape -- the difference between a full radius and a small corner radius
// isn't meaningfully visible at this widget's scale.
const buildRoundedTip = (radius, length, material) => {
  const group = new THREE.Group();
  group.add(createRoundedTipPiece(radius, material));
  const shaftHeight = Math.max(length - radius, 0);
  if (shaftHeight > 0) {
    const shaft = createTaperedPiece(radius, radius, shaftHeight, material);
    shaft.position.z = radius;
    group.add(shaft);
  }
  return group;
};

// V-Bit and Chamfer are both a single cone from a point at the tip to the
// full diameter over the tool's length.
const buildCone = (radius, length, material) => {
  const group = new THREE.Group();
  group.add(createTaperedPiece(radius, 0, length, material));
  return group;
};

const buildTaperedBallnose = (radius, length, material) => {
  const group = new THREE.Group();
  const tipRadius = radius * 0.3;
  group.add(createRoundedTipPiece(tipRadius, material));
  const shaftHeight = Math.max(length - tipRadius, 0);
  if (shaftHeight > 0) {
    const shaft = createTaperedPiece(radius, tipRadius, shaftHeight, material);
    shaft.position.z = tipRadius;
    group.add(shaft);
  }
  return group;
};

const buildDrill = (radius, length, material) => {
  const group = new THREE.Group();
  const tipHeight = Math.min(radius * 1.5, length);
  group.add(createTaperedPiece(radius, 0, tipHeight, material));
  const shaftHeight = Math.max(length - tipHeight, 0);
  if (shaftHeight > 0) {
    const shaft = createTaperedPiece(radius, radius, shaftHeight, material);
    shaft.position.z = tipHeight;
    group.add(shaft);
  }
  return group;
};

// Creates a Three.js Object3D approximating the given tool shape, sized to
// the given diameter/length, with its tip at the origin extending along +Z.
// Shape types without a dedicated builder (Reamer, Tap, Thread Mill,
// Slitting Saw, Dovetail, Radius, Probe, Custom) fall back to a plain
// cylinder -- they're not visually critical for a 3-axis router.
export const createCuttingToolObject = ({ shapeType, diameter, length, material }) => {
  const radius = Math.max(Number(diameter) || 0, 0.1) / 2;
  const safeLength = Math.max(Number(length) || 0, 0.1);

  switch (shapeType) {
    case TOOL_SHAPE_BALLEND:
    case TOOL_SHAPE_BULLNOSE:
      return buildRoundedTip(radius, safeLength, material);
    case TOOL_SHAPE_DRILL:
      return buildDrill(radius, safeLength, material);
    case TOOL_SHAPE_VBIT:
    case TOOL_SHAPE_CHAMFER:
      return buildCone(radius, safeLength, material);
    case TOOL_SHAPE_TAPERED_BALLNOSE:
      return buildTaperedBallnose(radius, safeLength, material);
    case TOOL_SHAPE_ENDMILL:
    default:
      return buildEndmill(radius, safeLength, material);
  }
};

// Frees GPU resources held by a procedurally-built tool object's geometries.
// The material is shared/reused across rebuilds and is not disposed here.
export const disposeCuttingToolObject = (object) => {
  if (!object) {
    return;
  }

  object.traverse((child) => {
    if (child.geometry) {
      child.geometry.dispose();
    }
  });
};

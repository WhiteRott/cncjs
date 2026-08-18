import * as THREE from 'three';

const getBoundingBox = (object) => {
  const box = new THREE.Box3().setFromObject(object);
  const boundingBox = {
    min: {
      x: box.min.x === Infinity ? 0 : box.min.x,
      y: box.min.y === Infinity ? 0 : box.min.y,
      z: box.min.z === Infinity ? 0 : box.min.z
    },
    max: {
      x: box.max.x === -Infinity ? 0 : box.max.x,
      y: box.max.y === -Infinity ? 0 : box.max.y,
      z: box.max.z === -Infinity ? 0 : box.max.z
    }
  };

  return boundingBox;
};

export {
  getBoundingBox,
};

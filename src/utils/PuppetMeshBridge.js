
// PuppetMeshBridge.js — import GLB from SPX Mesh Editor, flatten to 2D puppet layers

export async function loadGLBCharacter(file) {
  const url = URL.createObjectURL(file);
  // Dynamically import Three.js GLTFLoader
  const THREE = await import('three');
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');

  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(url, (gltf) => {
      const scene  = gltf.scene;
      const layers = flattenGLBToLayers(scene);
      resolve({ scene, layers, url, name: file.name });
    }, undefined, reject);
  });
}

export function flattenGLBToLayers(scene) {
  const layers = [];
  scene.traverse((child) => {
    if (child.isMesh) {
      layers.push({
        name:     child.name || 'Mesh',
        mesh:     child,
        visible:  true,
        type:     'mesh3d',
      });
    }
  });
  return layers;
}

export function renderGLBLayerToCanvas(layer, renderer, camera, width=512, height=512) {
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  // Render the single mesh to a canvas texture
  const scene = new (window.THREE || {}).Scene?.() || null;
  if (!scene) return canvas;
  scene.add(layer.mesh.clone());
  renderer.setSize(width, height);
  renderer.render(scene, camera);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(renderer.domElement, 0, 0);
  return canvas;
}

export function createGLBPuppetCharacter(glbData) {
  return {
    id:      crypto.randomUUID(),
    name:    glbData.name.replace(/\.glb$/i, ''),
    type:    'glb',
    glb:     glbData,
    layers:  glbData.layers,
    rig:     null,
    position:{ x:0.5, y:0.5 },
    scale:   1,
    rotation:0,
    visible: true,
    opacity: 1,
  };
}

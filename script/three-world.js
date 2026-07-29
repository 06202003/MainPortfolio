/**
 * Beyond The Door: Yehezkiel's Midnight Archive (3D Three.js Module)
 * Loaded dynamically when clicking the mysterious navbar door.
 */

// State Variables
let scene, camera, renderer, controls;
let rainParticles, rainCount = 1200;
let raycaster, mouse;
let interactiveObjects = [];
let animFrameId = null;
let audioContext = null;
let isLofiPlaying = false;
let lofiOscillator = null;

// Sound Synthesizer via Web Audio API
function playSound(type) {
  try {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioContext.state === 'suspended') {
      audioContext.resume();
    }

    const now = audioContext.currentTime;

    if (type === 'doorCreak') {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.6);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    } else if (type === 'meow') {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.exponentialRampToValueAtTime(750, now + 0.25);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.5);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start(now);
      osc.stop(now + 0.5);
    } else if (type === 'click') {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, now);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
      osc.connect(gain);
      gain.connect(audioContext.destination);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch (e) {
    console.warn('Audio synth error:', e);
  }
}

// Toggle Lo-Fi Ambient Audio
function toggleLofiMusic() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }

  const btn = document.getElementById('btn-audio-toggle');

  if (isLofiPlaying) {
    if (lofiOscillator) {
      lofiOscillator.stop();
      lofiOscillator = null;
    }
    isLofiPlaying = false;
    if (btn) btn.innerHTML = '🎵 Play Lo-Fi';
    showToast('🎵 Lo-Fi Music Paused');
  } else {
    // Generate cozy chill chord progression synthesized sound
    const gain = audioContext.createGain();
    gain.gain.setValueAtTime(0.08, audioContext.currentTime);

    lofiOscillator = audioContext.createOscillator();
    lofiOscillator.type = 'sine';
    lofiOscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3 chord base
    lofiOscillator.connect(gain);
    gain.connect(audioContext.destination);

    lofiOscillator.start();
    isLofiPlaying = true;
    if (btn) btn.innerHTML = '🔊 Mute Lo-Fi';
    showToast('🎵 Lo-Fi Rainy Vibes Playing...');
  }
}

// Show Toast Message
function showToast(message) {
  const toast = document.getElementById('three-toast');
  if (toast) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 3500);
  }
}

// Initialize 3D World Scene
function initThreeWorld() {
  const canvas = document.getElementById('three-canvas');
  if (!canvas) return;

  // Scene & Background (Vivid Kyoto Dusk Sky)
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1e1b4b);
  scene.fog = null; // No dark fog blocking the view!

  // Camera positioned to view full scene
  camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 7, 18);

  // Renderer attached directly to static canvas element
  renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Orbit Controls targeting center of Japanese street (Full 360 Degree Orbit & Auto Rotate)
  if (typeof THREE.OrbitControls === 'function') {
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8; // Smooth 360 degree cinematic rotation
    controls.maxPolarAngle = Math.PI / 2 + 0.15; // Full ground to sky 360 degree navigation
    controls.minDistance = 2;
    controls.maxDistance = 80;
    controls.target.set(0, 2.5, -2);

    // Stop auto-rotate when user manually drags or interacts
    controls.addEventListener('start', () => {
      controls.autoRotate = false;
    });
  }

  // Natural Contrast Lighting Setup
  const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e1b4b, 1.8);
  scene.add(hemiLight);

  const ambientLight = new THREE.AmbientLight(0xffffff, 2.0);
  scene.add(ambientLight);

  const mainDirLight = new THREE.DirectionalLight(0xffffff, 2.0);
  mainDirLight.position.set(15, 30, 20);
  mainDirLight.castShadow = true;
  scene.add(mainDirLight);

  // Warm Japanese Lantern Light
  const lanternLight1 = new THREE.PointLight(0xff7700, 3, 30);
  lanternLight1.position.set(-6, 5, 2);
  scene.add(lanternLight1);

  // Rain Particle System (Retained)
  createRainParticles();

  // Raycasting Setup
  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('click', onSceneClick);
  window.addEventListener('resize', onWindowResize);

  // Load 3D GLTF Kyoto Model
  loadKyotoModel();

  // Start Animation Loop
  animate();
}

// Window Resize Event Handler
function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Main Animation & Render Loop (60 FPS)
function animate() {
  animFrameId = requestAnimationFrame(animate);

  if (controls) controls.update();
  updateRain();

  // Floating & rotation animation for 3D diamond pins
  interactiveObjects.forEach((obj) => {
    if (obj.userData && obj.userData.basePos) {
      obj.rotation.y += 0.025;
      obj.position.y = obj.userData.basePos[1] + Math.sin(Date.now() * 0.003 + obj.userData.idx) * 0.12;
    }
  });

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Create Falling GPU Rain Particles
function createRainParticles() {
  const rainGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(rainCount * 3);
  const velocities = new Float32Array(rainCount);

  for (let i = 0; i < rainCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 60;
    positions[i * 3 + 1] = Math.random() * 40 + 5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 60;
    velocities[i] = 0.3 + Math.random() * 0.4;
  }

  rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  const rainMat = new THREE.PointsMaterial({
    color: 0x88ccff,
    size: 0.12,
    transparent: true,
    opacity: 0.6
  });

  rainParticles = new THREE.Points(rainGeo, rainMat);
  rainParticles.userData = { velocities };
  scene.add(rainParticles);
}

// Update Rain Movement
function updateRain() {
  if (!rainParticles) return;
  const positions = rainParticles.geometry.attributes.position.array;
  const vels = rainParticles.userData.velocities;

  for (let i = 0; i < rainCount; i++) {
    positions[i * 3 + 1] -= vels[i];
    if (positions[i * 3 + 1] < 0) {
      positions[i * 3 + 1] = 40;
    }
  }
  rainParticles.geometry.attributes.position.needsUpdate = true;
}

// Load Pure 3D Kyoto GLTF Model from Mathias Tossens Sketchfab
function loadKyotoModel() {
  createInteractiveHotspots();

  const modelPath = './assets/models/kyoto.glb';
  if (typeof THREE.GLTFLoader === 'function') {
    showToast('⏳ Fetching 3D Kyoto City Scene (82 MB)...');
    console.log('Starting GLTFLoader fetch for:', modelPath);
    
    const loader = new THREE.GLTFLoader();
    loader.load(
      modelPath,
      (gltf) => {
        console.log('GLTF Loaded successfully!', gltf);
        const model = gltf.scene;

        // Auto-scale and center GLTF model
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const targetScale = maxDim > 0 ? (35 / maxDim) : 1;

        model.scale.set(targetScale, targetScale, targetScale);
        model.position.x = -center.x * targetScale;
        model.position.y = -box.min.y * targetScale;
        model.position.z = -center.z * targetScale;

        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material) {
              child.material.side = THREE.DoubleSide;
            }
          }
        });

        scene.add(model);
        showToast('🏯 Kyoto Midnight City Scene Loaded! Click floating pins to explore.');
      },
      (xhr) => {
        if (xhr.lengthComputable && xhr.total > 0) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100);
          showToast(`⏳ Downloading Kyoto 3D City: ${percent}%`);
        } else if (xhr.loaded) {
          const mb = (xhr.loaded / (1024 * 1024)).toFixed(1);
          showToast(`⏳ Downloading Kyoto 3D City: ${mb} MB / 82.9 MB`);
        }
      },
      (error) => {
        console.error('GLTF load error:', error);
        showToast('⚠️ GLTF Load Note: ' + (error.message || 'GLB load'));
      }
    );
  }
}

// Create 5 Sleek 3D Floating Landmark Pins
function createInteractiveHotspots() {
  interactiveObjects = [];

  const pinGeo = new THREE.OctahedronGeometry(0.35, 0);

  const pins = [
    { pos: [0.0, 2.0, 1.2], color: 0xf59e0b, id: 'about', title: '🍜 Kyoto River Bridge & Teahouse (About Me)' },
    { pos: [-2.8, 4.2, -1.8], color: 0x06b6d4, id: 'qualification', title: '🚉 Machiya House & Platform (Qualifications & Journey)' },
    { pos: [3.5, 3.8, 1.0], color: 0xa855f7, id: 'portfolio', title: '🕹️ Pine Garden & Arcade Room (Featured Projects)' },
    { pos: [-4.0, 2.8, 1.8], color: 0x10b981, id: 'research', title: '⛩️ Torii Shrine & Waterfall Alley (Research & Thesis)' },
    { pos: [0.0, 5.8, -2.5], color: 0xef4444, id: 'reach', title: '🏮 Rooftop Sky Cables & Neon (Reach Me / Contact)' }
  ];

  pins.forEach((p, idx) => {
    const mat = new THREE.MeshBasicMaterial({ color: p.color, wireframe: false });
    const mesh = new THREE.Mesh(pinGeo, mat);
    mesh.position.set(...p.pos);
    mesh.userData = { id: p.id, title: p.title, basePos: [...p.pos], idx: idx };

    // Outer glowing ring
    const ringGeo = new THREE.RingGeometry(0.45, 0.55, 16);
    const ringMat = new THREE.MeshBasicMaterial({ color: p.color, side: THREE.DoubleSide });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = Math.PI / 2;
    mesh.add(ringMesh);

    scene.add(mesh);
    interactiveObjects.push(mesh);
  });
}

// Create Fallback Procedural Scenery if GLTF fails or missing
function createFallbackScenery() {
  interactiveObjects = [];

  // Ground Floor Plane (Slate Gray Street)
  const floorGeo = new THREE.PlaneGeometry(100, 100);
  const floorMat = new THREE.MeshBasicMaterial({ color: 0x334155 });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = 0;
  scene.add(floorMesh);

  // Grid
  const gridHelper = new THREE.GridHelper(100, 20, 0x00f0ff, 0x94a3b8);
  gridHelper.position.y = 0.02;
  scene.add(gridHelper);

  // 1. Ramen Shop / Teahouse (About Me)
  const shopGeo = new THREE.BoxGeometry(7, 5, 6);
  const shopMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  const shopMesh = new THREE.Mesh(shopGeo, shopMat);
  shopMesh.position.set(-5, 2.5, -3);

  const roofGeo = new THREE.ConeGeometry(6, 2, 4);
  const roofMat = new THREE.MeshBasicMaterial({ color: 0xd97706 });
  const roofMesh = new THREE.Mesh(roofGeo, roofMat);
  roofMesh.position.set(-5, 6, -3);
  roofMesh.rotation.y = Math.PI / 4;

  const signGeo = new THREE.BoxGeometry(4, 1.2, 0.4);
  const signMat = new THREE.MeshBasicMaterial({ color: 0xfacc15 });
  const signMesh = new THREE.Mesh(signGeo, signMat);
  signMesh.position.set(-5, 4.5, -0.2);
  signMesh.userData = { id: 'about', title: '🍜 Ramen Shop (About Me)' };

  scene.add(shopMesh);
  scene.add(roofMesh);
  scene.add(signMesh);
  interactiveObjects.push(shopMesh, signMesh);

  // 2. Train Station (Qualifications)
  const stationGeo = new THREE.BoxGeometry(6, 4.5, 5);
  const stationMat = new THREE.MeshBasicMaterial({ color: 0x06b6d4 });
  const stationMesh = new THREE.Mesh(stationGeo, stationMat);
  stationMesh.position.set(5, 2.25, -3);
  stationMesh.userData = { id: 'qualification', title: '🚉 Train Station (Qualifications)' };

  const stationSignGeo = new THREE.BoxGeometry(4, 1, 0.4);
  const stationSignMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9 });
  const stationSignMesh = new THREE.Mesh(stationSignGeo, stationSignMat);
  stationSignMesh.position.set(5, 4.2, -0.5);

  scene.add(stationMesh);
  scene.add(stationSignMesh);
  interactiveObjects.push(stationMesh, stationSignMesh);

  // 3. Arcade Machine (Projects)
  const arcadeGeo = new THREE.BoxGeometry(3.5, 5, 3.5);
  const arcadeMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
  const arcadeMesh = new THREE.Mesh(arcadeGeo, arcadeMat);
  arcadeMesh.position.set(-3, 2.5, -7);
  arcadeMesh.userData = { id: 'portfolio', title: '🕹️ Arcade Room (Projects Portfolio)' };

  const arcadeScreenGeo = new THREE.PlaneGeometry(2.5, 2);
  const arcadeScreenMat = new THREE.MeshBasicMaterial({ color: 0xe879f9 });
  const arcadeScreenMesh = new THREE.Mesh(arcadeScreenGeo, arcadeScreenMat);
  arcadeScreenMesh.position.set(-3, 3.2, -5.2);

  scene.add(arcadeMesh);
  scene.add(arcadeScreenMesh);
  interactiveObjects.push(arcadeMesh);

  // 4. Shrine Library Desk (Research)
  const libGeo = new THREE.BoxGeometry(5, 4, 4);
  const libMat = new THREE.MeshBasicMaterial({ color: 0x22c55e });
  const libMesh = new THREE.Mesh(libGeo, libMat);
  libMesh.position.set(3, 2, -7);
  libMesh.userData = { id: 'research', title: '📚 Shrine Library (Research & Thesis)' };

  scene.add(libMesh);
  interactiveObjects.push(libMesh);

  // 5. Contact Neon Billboard (Reach Me)
  const billboardGeo = new THREE.BoxGeometry(8, 4, 0.8);
  const billboardMat = new THREE.MeshBasicMaterial({ color: 0xef4444 });
  const billboardMesh = new THREE.Mesh(billboardGeo, billboardMat);
  billboardMesh.position.set(0, 6.5, -9);
  billboardMesh.userData = { id: 'reach', title: '🏮 Neon Rooftop (Reach Me / Contact)' };

  scene.add(billboardMesh);
  interactiveObjects.push(billboardMesh);

  // Create Interactive Hotspots
  createInteractiveHotspots();
}

// Create Hotspots on the Loaded 3D Scene
function createInteractiveHotspots() {
  const hotspotGeo = new THREE.SphereGeometry(0.8, 16, 16);

  const hotspots = [
    { pos: [-5, 3.5, -1], color: 0xf59e0b, id: 'about', title: '🍜 Teahouse & Laptop (About Me)' },
    { pos: [5, 3.5, -1], color: 0x06b6d4, id: 'qualification', title: '🚉 Station Platform (Qualifications)' },
    { pos: [-3, 3.5, -5], color: 0xa855f7, id: 'portfolio', title: '🕹️ Arcade Cabinet (Projects Portfolio)' },
    { pos: [3, 3.5, -5], color: 0x22c55e, id: 'research', title: '📚 Shrine Desk (Research Papers)' },
    { pos: [0, 6.5, -7], color: 0xef4444, id: 'reach', title: '🏮 Neon Rooftop (Reach Me / Contact)' },
    { pos: [-1, 1.2, 0], color: 0xf97316, id: 'cat', title: '🐱 Alley Stray Cat (Easter Egg)' },
    { pos: [-3.5, 2.2, 0], color: 0x3b82f6, id: 'vending', title: '🥤 Japanese Vending Machine (Easter Egg)' },
    { pos: [1, 1.5, 0], color: 0xec4899, id: 'radio', title: '📻 Lo-Fi Vintage Radio (Audio Player)' }
  ];

  hotspots.forEach(h => {
    const mat = new THREE.MeshBasicMaterial({ color: h.color });
    const mesh = new THREE.Mesh(hotspotGeo, mat);
    mesh.position.set(...h.pos);
    mesh.userData = { id: h.id, title: h.title };
    scene.add(mesh);
    interactiveObjects.push(mesh);
  });
}

// Resolve 3D Mesh Target Category from Clicked Point in Kyoto City
function getMeshTargetInfo(intersect) {
  if (!intersect) return { id: 'about', title: '🍜 Kyoto City Archive' };

  const point = intersect.point;
  const x = point ? point.x : 0;
  const y = point ? point.y : 0;
  const z = point ? point.z : 0;

  let categoryId = 'about';
  let title = '🍜 Kyoto Machiya & Teahouse (About Me)';

  if (y > 4.2) {
    categoryId = 'reach';
    title = '🏮 Rooftop Neon & Socials (Reach Me / Contact)';
  } else if (x < -2.0) {
    categoryId = 'about';
    title = '🍜 Kyoto Machiya & Teahouse (About Me)';
  } else if (x > 2.0) {
    categoryId = 'qualification';
    title = '🚉 Kyoto Station Platform (Qualifications & Journey)';
  } else if (z < -3.5) {
    categoryId = 'portfolio';
    title = '🕹️ Neon Arcade Room (Featured Projects)';
  } else {
    categoryId = 'research';
    title = '📚 Shrine Desk & Library (Research & Thesis)';
  }

  return { id: categoryId, title: title };
}

// Raycasting Mouse Hover
function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  if (raycaster && camera && interactiveObjects.length > 0) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveObjects, true);

    const hint = document.getElementById('hud-interaction-hint');
    if (intersects.length > 0) {
      document.body.style.cursor = 'pointer';
      const info = getMeshTargetInfo(intersects[0]);
      if (hint) {
        hint.style.display = 'flex';
        hint.innerHTML = `<span>✨ Click to Explore: <strong>${info.title}</strong></span>`;
      }
    } else {
      document.body.style.cursor = 'default';
      if (hint) {
        hint.style.display = 'none';
      }
    }
  }
}

// Handle Raycast Scene Clicks
function onSceneClick(event) {
  if (!raycaster || !camera || interactiveObjects.length === 0) return;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactiveObjects, true);

  if (intersects.length > 0) {
    const info = getMeshTargetInfo(intersects[0]);
    playSound('click');
    openContentModal(info.id);
  }
}

// Content Modals Map
const modalContentMap = {
  about: {
    title: '🍜 About Me — Yehezkiel David Setiawan',
    html: `
      <p><strong>AI Engineer & LLM Researcher</strong> | Fresh Graduate in Informatics Engineering.</p>
      <p>Specializing in large language models, code intelligence systems, and data engineering. Passionate about building intelligent systems through curiosity.</p>
      <h4>Core Strengths:</h4>
      <ul>
        <li>Advanced Code Intelligence & LLM Prompting</li>
        <li>Data Analytics & Machine Learning Pipeline Development</li>
        <li>Full Stack Development (Laravel, Python, React, JavaScript, Go)</li>
      </ul>
    `
  },
  qualification: {
    title: '🚉 Qualifications & Career Journey',
    html: `
      <h4>Career Milestones:</h4>
      <ul>
        <li><strong>2025:</strong> AI Research & LLM Code Intelligence Engineering</li>
        <li><strong>2024:</strong> Full Stack Web & Data Analytics Specialist</li>
        <li><strong>2023:</strong> Laravel & Data Engineering Projects at Royal Medicalink Pharmalab & Maranatha Christian University</li>
      </ul>
    `
  },
  portfolio: {
    title: '🕹️ Featured Projects Showcase',
    html: `
      <h4>Highlighted Work:</h4>
      <ul>
        <li><strong>AI Code Intelligence System:</strong> Automated evaluation and LLM-driven feedback platform.</li>
        <li><strong>Data Analytics Platform:</strong> Comprehensive analytics dashboard for pharmaceutical distribution metrics.</li>
        <li><strong>Beyond The Door 3D World:</strong> Immersive WebGL portfolio experience built with Three.js.</li>
      </ul>
    `
  },
  research: {
    title: '📚 Research & Publications',
    html: `
      <h4>Academic Contributions:</h4>
      <ul>
        <li><strong>Thesis:</strong> Synthetic Data Generation and Evaluation in LLMs for Code Generation.</li>
        <li><strong>AI in Education:</strong> LLM-Assisted feedback mechanisms for informatics students.</li>
        <li><strong>Machine Learning Pipelines:</strong> Scalable feature extraction in medical and academic data.</li>
      </ul>
    `
  },
  reach: {
    title: '🏮 Reach Me! — Contact & Socials',
    html: `
      <p>Feel free to get in touch for collaborations, research inquiries, or engineering roles!</p>
      <ul>
        <li>📧 <strong>Email:</strong> <a href="mailto:yehezkieldavid2006@gmail.com" style="color: #38bdf8;">yehezkieldavid2006@gmail.com</a></li>
        <li>💼 <strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/ydavids/" target="_blank" style="color: #38bdf8;">linkedin.com/in/ydavids/</a></li>
        <li>💻 <strong>GitHub:</strong> <a href="https://github.com/06202003/" target="_blank" style="color: #38bdf8;">github.com/06202003/</a></li>
        <li>📱 <strong>WhatsApp:</strong> <a href="https://wa.me/6289507647137" target="_blank" style="color: #38bdf8;">+62 895-0764-7137</a></li>
      </ul>
    `
  }
};

// Open Content Glassmorphism Modal
function openContentModal(id) {
  const backdrop = document.getElementById('three-modal-backdrop');
  const titleElem = document.getElementById('three-modal-title');
  const bodyElem = document.getElementById('three-modal-body');

  const content = modalContentMap[id];
  if (backdrop && titleElem && bodyElem && content) {
    titleElem.innerHTML = content.title;
    bodyElem.innerHTML = content.html;
    backdrop.classList.add('active');
  }
}

// Window Resize Handler
function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Render Animation Loop
function animate() {
  animFrameId = requestAnimationFrame(animate);

  if (controls) controls.update();
  updateRain();

  // Pulse hotspot emissive glow
  interactiveObjects.forEach((obj, idx) => {
    if (obj.material && obj.material.emissiveIntensity !== undefined) {
      obj.material.emissiveIntensity = 0.5 + Math.sin(Date.now() * 0.003 + idx) * 0.3;
    }
  });

  if (renderer && scene && camera) {
    renderer.render(scene, camera);
  }
}

// Open 3D Portal Entry
function enter3DWorld() {
  playSound('doorCreak');
  document.body.style.overflow = 'hidden';
  const overlay = document.getElementById('portal-overlay');
  const canvasContainer = document.getElementById('three-canvas-container');
  const loadingScreen = document.getElementById('three-loading-screen');

  if (overlay) overlay.classList.add('active');

  if (canvasContainer) {
    canvasContainer.classList.add('visible');
    initThreeWorld();
  }

  if (loadingScreen) {
    loadingScreen.classList.add('hidden');
    loadingScreen.style.display = 'none';
  }

  setTimeout(() => {
    if (overlay) overlay.classList.remove('active');
  }, 300);
}

// Exit 3D World back to 2D HTML Portfolio
function exit3DWorld() {
  playSound('click');
  const overlay = document.getElementById('portal-overlay');
  const canvasContainer = document.getElementById('three-canvas-container');

  if (overlay) overlay.classList.add('active');

  if (isLofiPlaying) {
    toggleLofiMusic();
  }

  setTimeout(() => {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    if (canvasContainer) canvasContainer.classList.remove('visible');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
    
    // Clean up Three.js WebGL context
    if (renderer) {
      renderer.dispose();
    }
  }, 800);
}

// Make globally accessible
window.enter3DWorld = enter3DWorld;
window.exit3DWorld = exit3DWorld;

function initEventListeners() {
  const doorTrigger = document.getElementById('secret-door-trigger');
  if (doorTrigger) {
    doorTrigger.addEventListener('click', (e) => {
      e.preventDefault();
      enter3DWorld();
    });
  }

  const exitBtn = document.getElementById('btn-exit-3d');
  if (exitBtn) {
    exitBtn.addEventListener('click', (e) => {
      e.preventDefault();
      exit3DWorld();
    });
  }

  const audioBtn = document.getElementById('btn-audio-toggle');
  if (audioBtn) {
    audioBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleLofiMusic();
    });
  }

  const modalClose = document.getElementById('three-modal-close');
  const modalBackdrop = document.getElementById('three-modal-backdrop');
  if (modalClose && modalBackdrop) {
    modalClose.addEventListener('click', () => modalBackdrop.classList.remove('active'));
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        modalBackdrop.classList.remove('active');
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEventListeners);
} else {
  initEventListeners();
}

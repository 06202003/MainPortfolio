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
  const container = document.getElementById('three-viewport') || document.getElementById('three-canvas-container');
  if (!container) return;

  // Scene & Fog
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050814);
  scene.fog = new THREE.FogExp2(0x050814, 0.012);

  // Camera
  camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 5, 18);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;

  // Clear existing canvas inside viewport
  container.innerHTML = '';
  container.appendChild(renderer.domElement);

  // Orbit Controls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 + 0.05; // Prevent camera clipping below floor
  controls.minDistance = 3;
  controls.maxDistance = 45;
  controls.target.set(0, 3, 0);

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x223355, 1.2);
  scene.add(ambientLight);

  const mainDirLight = new THREE.DirectionalLight(0x99bbff, 1.8);
  mainDirLight.position.set(10, 25, 15);
  mainDirLight.castShadow = true;
  scene.add(mainDirLight);

  // Warm Japanese Lantern Light
  const lanternLight1 = new THREE.PointLight(0xff7700, 3, 20);
  lanternLight1.position.set(-4, 4, 2);
  scene.add(lanternLight1);

  // Neon Accent Lights
  const neonBlueLight = new THREE.PointLight(0x00f0ff, 3, 25);
  neonBlueLight.position.set(6, 6, -3);
  scene.add(neonBlueLight);

  const neonPurpleLight = new THREE.PointLight(0xb000ff, 2.5, 20);
  neonPurpleLight.position.set(-6, 8, -8);
  scene.add(neonPurpleLight);

  // Wet Asphalt Floor Ground
  const floorGeo = new THREE.PlaneGeometry(100, 100);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0x0a0f1d,
    roughness: 0.15,
    metalness: 0.8,
  });
  const floorMesh = new THREE.Mesh(floorGeo, floorMat);
  floorMesh.rotation.x = -Math.PI / 2;
  floorMesh.position.y = 0;
  floorMesh.receiveShadow = true;
  scene.add(floorMesh);

  // Rain Particle System
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

// Load Kyoto GLTF Model
function loadKyotoModel() {
  const loadingScreen = document.getElementById('three-loading-screen');
  const progressBar = document.getElementById('loader-progress-bar');
  const statusText = document.getElementById('loader-status');

  const modelPath = 'assets/models/tanabata_evening_-_kyoto_inspired_city_scene.glb';
  const loader = new THREE.GLTFLoader();

  if (statusText) statusText.textContent = 'Loading Kyoto Midnight Alley (82MB)...';

  loader.load(
    modelPath,
    (gltf) => {
      const model = gltf.scene;
      model.position.set(0, 0, 0);
      model.scale.set(1, 1, 1);
      
      model.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      scene.add(model);

      // Create Interactive Hotspot Anchor Meshes
      createInteractiveHotspots();

      // Hide Loading Screen
      if (loadingScreen) {
        loadingScreen.classList.add('hidden');
      }

      showToast('🏮 Welcome to Yehezkiel\'s Midnight Archive! Click around to explore.');
    },
    (xhr) => {
      if (xhr.lengthComputable) {
        const percent = Math.round((xhr.loaded / xhr.total) * 100);
        if (progressBar) progressBar.style.width = percent + '%';
        if (statusText) statusText.textContent = `Loading 3D Assets... ${percent}%`;
      }
    },
    (error) => {
      console.warn('Failed to load GLTF model, rendering procedural scenery fallback.', error);
      if (statusText) statusText.textContent = 'Creating fallback 3D scene...';
      createFallbackScenery();
      if (loadingScreen) {
        setTimeout(() => loadingScreen.classList.add('hidden'), 500);
      }
    }
  );
}

// Create Fallback Procedural Scenery if GLTF fails or missing
function createFallbackScenery() {
  // Ramen Stall / Teahouse Box
  const shopGeo = new THREE.BoxGeometry(6, 4, 5);
  const shopMat = new THREE.MeshStandardMaterial({ color: 0x4a2c11 });
  const shopMesh = new THREE.Mesh(shopGeo, shopMat);
  shopMesh.position.set(-6, 2, -2);
  shopMesh.userData = { id: 'about', title: '🍜 Ramen Shop (About Me)' };
  scene.add(shopMesh);
  interactiveObjects.push(shopMesh);

  // Train Station Signboard
  const stationGeo = new THREE.BoxGeometry(4, 3, 4);
  const stationMat = new THREE.MeshStandardMaterial({ color: 0x1e293b });
  const stationMesh = new THREE.Mesh(stationGeo, stationMat);
  stationMesh.position.set(6, 1.5, -4);
  stationMesh.userData = { id: 'qualification', title: '🚉 Train Station (Qualifications)' };
  scene.add(stationMesh);
  interactiveObjects.push(stationMesh);

  // Arcade Cabinet
  const arcadeGeo = new THREE.BoxGeometry(3, 4, 3);
  const arcadeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7 });
  const arcadeMesh = new THREE.Mesh(arcadeGeo, arcadeMat);
  arcadeMesh.position.set(-2, 2, -8);
  arcadeMesh.userData = { id: 'portfolio', title: '🕹️ Arcade Room (Projects Portfolio)' };
  scene.add(arcadeMesh);
  interactiveObjects.push(arcadeMesh);

  // Library / Desk
  const libGeo = new THREE.BoxGeometry(4, 3, 3);
  const libMat = new THREE.MeshStandardMaterial({ color: 0x78350f });
  const libMesh = new THREE.Mesh(libGeo, libMat);
  libMesh.position.set(4, 1.5, -9);
  libMesh.userData = { id: 'research', title: '📚 Shrine Library (Research & Thesis)' };
  scene.add(libMesh);
  interactiveObjects.push(libMesh);

  // Contact Billboard
  const signGeo = new THREE.BoxGeometry(5, 3, 1);
  const signMat = new THREE.MeshStandardMaterial({ color: 0xe11d48, emissive: 0x9f1239 });
  const signMesh = new THREE.Mesh(signGeo, signMat);
  signMesh.position.set(0, 6, -12);
  signMesh.userData = { id: 'reach', title: '🏮 Neon Rooftop (Reach Me / Contact)' };
  scene.add(signMesh);
  interactiveObjects.push(signMesh);

  // Create Interactive Hotspots
  createInteractiveHotspots();
}

// Create Hotspots on the Loaded 3D Scene
function createInteractiveHotspots() {
  const hotspotGeo = new THREE.SphereGeometry(0.8, 16, 16);

  const hotspots = [
    { pos: [-4, 2, 2], color: 0xff7700, id: 'about', title: '🍜 Teahouse & Laptop (About Me)' },
    { pos: [5, 2, -1], color: 0x00f0ff, id: 'qualification', title: '🚉 Station Platform (Qualifications)' },
    { pos: [-2, 2.5, -6], color: 0xb000ff, id: 'portfolio', title: '🕹️ Arcade Cabinet (Projects Portfolio)' },
    { pos: [3, 2, -7], color: 0x10b981, id: 'research', title: '📚 Shrine Desk (Research Papers)' },
    { pos: [0, 5.5, -10], color: 0xf43f5e, id: 'reach', title: '🏮 Neon Rooftop (Reach Me / Contact)' },
    { pos: [2, 0.5, 4], color: 0xfacc15, id: 'cat', title: '🐱 Alley Stray Cat (Easter Egg)' },
    { pos: [-5, 1.5, 5], color: 0x0ea5e9, id: 'vending', title: '🥤 Japanese Vending Machine (Easter Egg)' },
    { pos: [0.5, 1, 6], color: 0xa855f7, id: 'radio', title: '📻 Lo-Fi Vintage Radio (Audio Player)' }
  ];

  hotspots.forEach(h => {
    const mat = new THREE.MeshStandardMaterial({
      color: h.color,
      emissive: h.color,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.75
    });
    const mesh = new THREE.Mesh(hotspotGeo, mat);
    mesh.position.set(...h.pos);
    mesh.userData = { id: h.id, title: h.title };
    scene.add(mesh);
    interactiveObjects.push(mesh);
  });
}

// Raycasting Mouse Hover
function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  if (raycaster && camera) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(interactiveObjects);

    const hint = document.getElementById('hud-interaction-hint');
    if (intersects.length > 0) {
      document.body.style.cursor = 'pointer';
      const obj = intersects[0].object;
      if (hint) {
        hint.style.display = 'flex';
        hint.innerHTML = `<span>✨ Click: <strong>${obj.userData.title}</strong></span>`;
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
  if (!raycaster || !camera) return;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactiveObjects);

  if (intersects.length > 0) {
    const clickedObj = intersects[0].object;
    const targetId = clickedObj.userData.id;
    playSound('click');

    if (targetId === 'cat') {
      playSound('meow');
      showToast('🐱 Meow! Achievement Unlocked: Curious Explorer!');
    } else if (targetId === 'vending') {
      showToast('🥤 Vending Machine: Grabbed a refreshing Japanese Green Tea!');
    } else if (targetId === 'radio') {
      toggleLofiMusic();
    } else {
      openContentModal(targetId);
    }
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

  if (overlay) overlay.classList.add('active');

  setTimeout(() => {
    if (canvasContainer) {
      canvasContainer.classList.add('visible');
      initThreeWorld();
    }
    if (overlay) overlay.classList.remove('active');
  }, 1000);
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

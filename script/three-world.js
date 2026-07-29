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

let lofiStreamAudio = null;

// Toggle 24/7 Live Lo-Fi Radio Stream
function toggleLofiMusic() {
  const btn = document.getElementById('btn-audio-toggle');
  const dot = document.getElementById('radio-wave-dot');
  const statusText = document.getElementById('radio-status-text');

  if (!lofiStreamAudio) {
    lofiStreamAudio = new Audio();
    lofiStreamAudio.id = 'lofi-live-stream-audio';
    lofiStreamAudio.crossOrigin = 'anonymous';

    // 24/7 Live Lo-Fi Stream URLs with automatic fallback
    const streams = [
      'https://stream.zeno.fm/f3vkgmy1ahuvv',
      'https://lofi.stream.laut.fm/lofi',
      'https://streams.ilovemusic.de/iloveradio/lofigirl.mp3'
    ];

    let currentStreamIdx = 0;
    lofiStreamAudio.src = streams[currentStreamIdx];

    lofiStreamAudio.onerror = () => {
      console.warn('Stream offline, switching to backup stream...');
      currentStreamIdx = (currentStreamIdx + 1) % streams.length;
      lofiStreamAudio.src = streams[currentStreamIdx];
      if (isLofiPlaying) {
        lofiStreamAudio.play().catch(e => console.warn('Stream play retry error:', e));
      }
    };
  }

  if (isLofiPlaying) {
    lofiStreamAudio.pause();
    isLofiPlaying = false;
    if (btn) btn.innerHTML = '🎵 Play Radio';
    if (dot) dot.classList.remove('active');
    if (statusText) statusText.textContent = 'Paused';
    showToast('📻 Lo-Fi Radio Stream Paused');
  } else {
    showToast('📻 Connecting to 24/7 Live Lo-Fi Radio Stream...');
    if (statusText) statusText.textContent = 'Connecting...';

    const playPromise = lofiStreamAudio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        isLofiPlaying = true;
        if (btn) btn.innerHTML = '⏸️ Pause';
        if (dot) dot.classList.add('active');
        if (statusText) statusText.textContent = 'Live 🟢 Chillhop Beats';
        showToast('🎶 24/7 Live Lo-Fi Chillhop Radio Playing!');
      }).catch(err => {
        console.warn('Lo-Fi radio stream play error:', err);
        isLofiPlaying = false;
        if (btn) btn.innerHTML = '🎵 Play Radio';
        if (dot) dot.classList.remove('active');
        if (statusText) statusText.textContent = 'Click to Retry';
        showToast('⚠️ Click again to start 24/7 Lo-Fi Radio Stream');
      });
    }
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

  // Floating bobbing animation for Sketchfab numbered badges 1, 2, 3, 4, 5
  interactiveObjects.forEach((obj) => {
    if (obj.userData && obj.userData.num) {
      obj.position.y = (obj.userData.basePosY || obj.position.y) + Math.sin(Date.now() * 0.003 + obj.userData.num) * 0.08;
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

// Create Canvas Texture for Sketchfab-style Number Badges (1, 2, 3, 4, 5)
function createSketchfabNumberBadgeTexture(num, hexColorStr) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Outer semi-transparent background circle
  ctx.beginPath();
  ctx.arc(64, 64, 58, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fill();

  // Colored circle border
  ctx.beginPath();
  ctx.arc(64, 64, 48, 0, 2 * Math.PI);
  ctx.fillStyle = hexColorStr;
  ctx.fill();
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  // White Number (1, 2, 3, 4, 5)
  ctx.font = 'bold 54px Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(num.toString(), 64, 66);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Create Sleek Compact Sketchfab-style 1, 2, 3, 4, 5 Numbered Pins on Kyoto Scene
function createSketchfabAnnotationsInScene() {
  interactiveObjects = [];

  const annotations = [
    { num: 1, pos: [0.0, 1.8, 1.2], colorStr: '#f59e0b', id: 'about', title: '🍜 1. Teahouse & River Bridge (About Me)' },
    { num: 2, pos: [-2.5, 3.2, -1.8], colorStr: '#06b6d4', id: 'qualification', title: '🚉 2. Machiya Building (Qualifications & Journey)' },
    { num: 3, pos: [2.8, 3.0, 0.8], colorStr: '#a855f7', id: 'portfolio', title: '🕹️ 3. Arcade & Pine Garden (Featured Projects)' },
    { num: 4, pos: [-3.2, 2.2, 1.8], colorStr: '#10b981', id: 'research', title: '⛩️ 4. Torii Shrine & Steps (Research & Thesis)' },
    { num: 5, pos: [0.0, 5.2, -2.0], colorStr: '#ef4444', id: 'reach', title: '🏮 5. Rooftop Sky Tower (Reach Me / Contact)' }
  ];

  annotations.forEach((anno) => {
    const badgeTexture = createSketchfabNumberBadgeTexture(anno.num, anno.colorStr);
    const spriteMat = new THREE.SpriteMaterial({ map: badgeTexture, depthTest: true });
    const sprite = new THREE.Sprite(spriteMat);

    sprite.position.set(...anno.pos);
    sprite.scale.set(1.4, 1.4, 1);
    sprite.userData = { id: anno.id, title: anno.title, num: anno.num, basePosY: anno.pos[1] };

    scene.add(sprite);
    interactiveObjects.push(sprite);
  });
}

// Load Pure 3D Kyoto GLTF Model & Attach Numbered Annotations
function loadKyotoModel() {
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

        // Create sleek compact Sketchfab numbered annotations
        createSketchfabAnnotationsInScene();

        scene.add(model);
        showToast('🏯 Kyoto Midnight City Loaded! Click annotations 1, 2, 3, 4, 5 to explore.');
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
      let obj = intersects[0].object;
      while (obj && !obj.userData.title && obj.parent) {
        obj = obj.parent;
      }
      const title = obj.userData ? obj.userData.title : 'Kyoto Landmark';
      if (hint) {
        hint.style.display = 'flex';
        hint.innerHTML = `<span>✨ Click Pin: <strong>${title}</strong></span>`;
      }
    } else {
      document.body.style.cursor = 'default';
      if (hint) {
        hint.style.display = 'none';
      }
    }
  }
}
function zoomToAnnotation(sprite, targetId) {
  if (!sprite || !camera || !controls) return;

  const targetWorldPos = sprite.position.clone();
  const targetCamPos = new THREE.Vector3(
    targetWorldPos.x * 0.6,
    targetWorldPos.y + 1.8,
    targetWorldPos.z + 6.5
  );

  if (controls) controls.autoRotate = false;
  playSound('click');

  if (typeof gsap !== 'undefined') {
    gsap.killTweensOf(camera.position);
    gsap.killTweensOf(controls.target);

    gsap.to(camera.position, {
      x: targetCamPos.x,
      y: targetCamPos.y,
      z: targetCamPos.z,
      duration: 1.2,
      ease: 'power2.inOut',
      onUpdate: () => {
        controls.update();
      }
    });

    gsap.to(controls.target, {
      x: targetWorldPos.x,
      y: targetWorldPos.y,
      z: targetWorldPos.z,
      duration: 1.2,
      ease: 'power2.inOut',
      onUpdate: () => {
        controls.update();
      },
      onComplete: () => {
        openContentModal(targetId);
      }
    });
  } else {
    camera.position.copy(targetCamPos);
    controls.target.copy(targetWorldPos);
    controls.update();
    openContentModal(targetId);
  }
}

// Reset Camera Back to Overview View When Modal Closes
function resetCameraView() {
  if (!camera || !controls) return;

  const defaultCamPos = new THREE.Vector3(0, 7, 18);
  const defaultTarget = new THREE.Vector3(0, 2.5, -2);

  if (typeof gsap !== 'undefined') {
    gsap.to(camera.position, {
      x: defaultCamPos.x,
      y: defaultCamPos.y,
      z: defaultCamPos.z,
      duration: 1.0,
      ease: 'power2.out',
      onUpdate: () => controls.update()
    });

    gsap.to(controls.target, {
      x: defaultTarget.x,
      y: defaultTarget.y,
      z: defaultTarget.z,
      duration: 1.0,
      ease: 'power2.out',
      onUpdate: () => controls.update()
    });
  } else {
    camera.position.copy(defaultCamPos);
    controls.target.copy(defaultTarget);
    controls.update();
  }
}

// Handle Raycast Scene Clicks
function onSceneClick(event) {
  if (!raycaster || !camera || interactiveObjects.length === 0) return;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(interactiveObjects, true);

  if (intersects.length > 0) {
    let obj = intersects[0].object;
    while (obj && !obj.userData.id && obj.parent) {
      obj = obj.parent;
    }
    if (obj && obj.userData.id) {
      zoomToAnnotation(obj, obj.userData.id);
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
    modalClose.addEventListener('click', () => {
      modalBackdrop.classList.remove('active');
      resetCameraView();
    });
    modalBackdrop.addEventListener('click', (e) => {
      if (e.target === modalBackdrop) {
        modalBackdrop.classList.remove('active');
        resetCameraView();
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEventListeners);
} else {
  initEventListeners();
}

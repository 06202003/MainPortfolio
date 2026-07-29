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

// 🎵 Spotify-Style Multi-Channel Live Radio Engine
const radioStations = [
  { name: '☕ Kyoto Midnight', subtitle: '24/7 Lofi Girl Beats', icon: '🎧', url: 'https://stream.zeno.fm/f3vkgmy1ahuvv' },
  { name: '🌧️ Rainy Day Lofi', subtitle: 'Rain & Chillhop Vibes', icon: '☕', url: 'https://lofi.stream.laut.fm/lofi' },
  { name: '🌙 Tokyo Synthwave', subtitle: 'Cyberpunk Night Beats', icon: '🌙', url: 'https://streams.ilovemusic.de/iloveradio/lofigirl.mp3' },
  { name: '🎮 8-Bit Chiptune', subtitle: 'Retro Arcade Radio', icon: '🎮', url: 'https://stream.zeno.fm/s0822u8yq8uvv' }
];

let activeStationIdx = 0;
let lofiStreamAudio = null;

function updateSpotifyUI() {
  const station = radioStations[activeStationIdx];
  const artElem = document.getElementById('spotify-art-icon');
  const titleElem = document.getElementById('spotify-station-title');
  const subtitleElem = document.getElementById('spotify-song-subtitle');
  const playIcon = document.getElementById('spotify-play-icon');
  const eqElem = document.getElementById('spotify-eq');

  if (artElem) artElem.textContent = station.icon;
  if (titleElem) titleElem.textContent = station.name;
  if (subtitleElem) subtitleElem.textContent = isLofiPlaying ? 'Playing Live 🟢' : station.subtitle;
  if (playIcon) playIcon.className = isLofiPlaying ? 'fa-solid fa-pause' : 'fa-solid fa-play';
  if (eqElem) {
    if (isLofiPlaying) eqElem.classList.add('playing');
    else eqElem.classList.remove('playing');
  }
}

function switchStation(direction) {
  if (direction === 'next') {
    activeStationIdx = (activeStationIdx + 1) % radioStations.length;
  } else if (direction === 'prev') {
    activeStationIdx = (activeStationIdx - 1 + radioStations.length) % radioStations.length;
  }

  const station = radioStations[activeStationIdx];
  showToast(`📻 Switched Station: ${station.name}`);

  if (!lofiStreamAudio) {
    lofiStreamAudio = new Audio();
    lofiStreamAudio.id = 'lofi-live-stream-audio';
    lofiStreamAudio.crossOrigin = 'anonymous';
    lofiStreamAudio.volume = 0.7;
  }

  lofiStreamAudio.src = station.url;
  if (isLofiPlaying) {
    lofiStreamAudio.play().catch(e => console.warn('Radio switch play error:', e));
  }
  updateSpotifyUI();
}

function toggleLofiMusic() {
  if (!lofiStreamAudio) {
    lofiStreamAudio = new Audio();
    lofiStreamAudio.id = 'lofi-live-stream-audio';
    lofiStreamAudio.crossOrigin = 'anonymous';
    lofiStreamAudio.volume = 0.7;
    lofiStreamAudio.src = radioStations[activeStationIdx].url;

    lofiStreamAudio.onerror = () => {
      console.warn('Stream offline, switching station...');
      switchStation('next');
    };
  }

  if (isLofiPlaying) {
    lofiStreamAudio.pause();
    isLofiPlaying = false;
    showToast('📻 Radio Paused');
  } else {
    showToast(`📻 Connecting to ${radioStations[activeStationIdx].name}...`);
    const playPromise = lofiStreamAudio.play();
    if (playPromise !== undefined) {
      playPromise.then(() => {
        isLofiPlaying = true;
        showToast(`🎶 Playing: ${radioStations[activeStationIdx].name}`);
      }).catch(err => {
        console.warn('Lo-Fi radio stream play error:', err);
        isLofiPlaying = false;
        showToast('⚠️ Click play again to start radio stream');
      });
    }
  }
  updateSpotifyUI();
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

let cloudGroup = null;

// Create Soft Floating 3D Cloud Texture
function createCloudTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.45)');
  grad.addColorStop(0.3, 'rgba(200, 220, 255, 0.25)');
  grad.addColorStop(0.7, 'rgba(120, 150, 200, 0.08)');
  grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Create Floating Cloud Sea Under the Kyoto Sky Island
function createFloatingCloudSea() {
  cloudGroup = new THREE.Group();
  const cloudTex = createCloudTexture();
  const cloudCount = 45;

  const cloudGeo = new THREE.PlaneGeometry(18, 18);
  const cloudMat = new THREE.MeshBasicMaterial({
    map: cloudTex,
    transparent: true,
    opacity: 0.65,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  for (let i = 0; i < cloudCount; i++) {
    const cloud = new THREE.Mesh(cloudGeo, cloudMat);
    const angle = (i / cloudCount) * Math.PI * 2 + Math.random() * 0.5;
    const radius = 5 + Math.random() * 18;

    cloud.position.x = Math.cos(angle) * radius;
    cloud.position.y = -1.8 + (Math.random() - 0.5) * 1.2;
    cloud.position.z = Math.sin(angle) * radius;

    cloud.rotation.x = -Math.PI / 2;
    cloud.rotation.z = Math.random() * Math.PI * 2;
    cloud.scale.setScalar(1.2 + Math.random() * 1.5);

    cloud.userData = {
      rotSpeed: (Math.random() - 0.5) * 0.001
    };

    cloudGroup.add(cloud);
  }

  scene.add(cloudGroup);
}

// Animate Clouds & Gentle Island Levitation
function updateCloudsAndLevitation() {
  const time = Date.now();

  // 1. Gently bob the entire Kyoto Island up and down like a floating sky island
  if (kyotoGltfModel) {
    kyotoGltfModel.position.y = Math.sin(time * 0.001) * 0.15;
  }

  // 2. Slow organic drift & roll of the cloud sea
  if (cloudGroup) {
    cloudGroup.rotation.y += 0.0003;
    cloudGroup.children.forEach((cloud) => {
      cloud.rotation.z += cloud.userData.rotSpeed;
    });
  }
}

  // Warm Japanese Lantern Light
  const lanternLight1 = new THREE.PointLight(0xff7700, 3, 30);
  lanternLight1.position.set(-6, 5, 2);
  scene.add(lanternLight1);

  // Rain Particle System (Retained)
  createRainParticles();

  // ☁️ 3D Floating Cloud Sea (Floating Sky Island Atmosphere)
  createFloatingCloudSea();

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
  updateCloudsAndLevitation();

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

// Create Canvas Texture for Transparent Glass Number Badges (1, 2, 3, 4, 5)
function createSketchfabNumberBadgeTexture(num, hexColorStr) {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Outer transparent glass circle
  ctx.beginPath();
  ctx.arc(64, 64, 54, 0, 2 * Math.PI);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.45)';
  ctx.fill();

  // Colored circle border
  ctx.lineWidth = 6;
  ctx.strokeStyle = hexColorStr;
  ctx.stroke();

  // White Number (1, 2, 3, 4, 5)
  ctx.font = 'bold 52px Arial, sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(num.toString(), 64, 66);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Create Sleek Compact Transparent Glass 1, 2, 3, 4, 5 Numbered Pins on Kyoto Scene
function createSketchfabAnnotationsInScene() {
  interactiveObjects = [];

  const annotations = [
    { num: 1, pos: [12.74, 6.26, 4.05], colorStr: '#f59e0b', id: 'about', title: '🍜 1. Ramen Yatai (About Me)' },
    { num: 2, pos: [7.96, 10.40, 8.50], colorStr: '#06b6d4', id: 'qualification', title: '🍶 2. Sake Brewery (Qualifications & Journey)' },
    { num: 3, pos: [6.96, 6.50, -6.80], colorStr: '#a855f7', id: 'portfolio', title: '🍞 3. Japanese Traditional Bakery (Featured Projects)' },
    { num: 4, pos: [-4.36, 4.35, 10.63], colorStr: '#10b981', id: 'research', title: '⛩️ 4. Shinto Shrine (Research & Thesis)' },
    { num: 5, pos: [-8.58, 3.65, -8.95], colorStr: '#ef4444', id: 'reach', title: '🧃 5. Vending Machine (Reach Me / Contact)' }
  ];

  annotations.forEach((anno) => {
    const badgeTexture = createSketchfabNumberBadgeTexture(anno.num, anno.colorStr);
    const spriteMat = new THREE.SpriteMaterial({ map: badgeTexture, depthTest: false, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);

    sprite.position.set(...anno.pos);
    sprite.scale.set(0.9, 0.9, 1);
    sprite.renderOrder = 999;
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

        kyotoGltfModel = model;

        // Create sleek compact Sketchfab numbered annotations
        createSketchfabAnnotationsInScene();

        scene.add(model);
        showToast('🏯 Kyoto Midnight City Loaded! Click any surface to inspect 3D coordinates or click pins 1-5.');
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
    const pinIntersects = raycaster.intersectObjects(interactiveObjects, true);

    const hint = document.getElementById('hud-interaction-hint');
    if (pinIntersects.length > 0) {
      document.body.style.cursor = 'pointer';
      let obj = pinIntersects[0].object;
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

let kyotoGltfModel = null;

// Smooth Camera Zoom-In to Clicked Annotation Landmark (Sketchfab-Style Ray Zoom!)
function zoomToAnnotation(sprite, targetId) {
  if (!sprite || !camera || !controls) return;

  const targetWorldPos = sprite.position.clone();
  
  // Calculate vector pointing from target pin BACK along the user's current line of sight
  const viewDir = camera.position.clone().sub(targetWorldPos).normalize();
  const targetCamPos = targetWorldPos.clone().add(viewDir.multiplyScalar(5.5));
  
  if (targetCamPos.y < targetWorldPos.y + 0.8) {
    targetCamPos.y = targetWorldPos.y + 0.8;
  }

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

// Handle Raycast Scene Clicks (Pin Annotations Zoom-In)
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

// Content Modals Map — Yehezkiel's Personal Kyoto Travel Journal & Stories (English Edition)
const modalContentMap = {
  about: {
    title: '📖 Entry 01: Late Night at the Ramen Yatai',
    html: `
      <div class="diary-stamp-badge">📍 Kyoto Journal • Entry #01 (Ramen Yatai)</div>
      <div class="diary-story-quote">
        "A bowl of late-night Yatai ramen teaches one thing: memorable work comes from meticulously blending base ingredients into a cohesive whole."
      </div>
      <p>Welcome to my quiet corner. Here, amidst the warm steam of a midnight Kyoto ramen stand, I find the best analogy for my engineering mindset. I am <strong>Yehezkiel David Setiawan</strong> — an AI Engineer & Researcher who views code like a broth recipe: it’s not about how many ingredients you throw in, but about achieving a harmonious logical balance.</p>
      <p>For me, crafting AI models and LLM architectures is about creating experiences that aren't just intelligent, but feel intuitive, warm, and genuinely helpful for people.</p>
      <div class="diary-personal-note">
        🍜 <span>Personal Note: Sipping warm ramen while analyzing LLM prompt architectures late at night is my favorite ritual.</span>
      </div>
    `
  },
  qualification: {
    title: '📖 Entry 02: Aged Vats at the Sake Brewery',
    html: `
      <div class="diary-stamp-badge">📍 Kyoto Journal • Entry #02 (Sake Brewery)</div>
      <div class="diary-story-quote">
        "Brewing fine Sake requires patient fermentation, time, and precise thermal control. There are no shortcuts to true craftsmanship."
      </div>
      <p>In this traditional Sake distillery, time works on its own terms. My journey in Informatics was built on the exact same principle. From mastering Laravel fundamentals, engineering high-throughput medical data pipelines at Royal Medicalink Pharmalab, to diving into artificial intelligence research at Maranatha Christian University — no milestone was rushed.</p>
      <p>Every debugged edge case and every data pipeline designed is a fermentation of experience, shaping my problem-solving mindset to remain refined, resilient, and built to last.</p>
      <div class="diary-personal-note">
        🍶 <span>Personal Note: Engineering is like traditional brewing — patient, meticulous, and built to stand the test of time.</span>
      </div>
    `
  },
  portfolio: {
    title: '📖 Entry 03: Aromas from the Traditional Bakery',
    html: `
      <div class="diary-stamp-badge">📍 Kyoto Journal • Entry #03 (Traditional Bakery)</div>
      <div class="diary-story-quote">
        "The scent of freshly baked artisan bread brings warmth and smiles. So should every digital product I create."
      </div>
      <p>This traditional bakery is filled with warmth and creative spirit. This is where my best experimental projects were born. When designing <strong>S-SPARC</strong> (an AI prompt control system awarded the <em>Merit Award at AIREA 2026</em>) to this interactive 3D WebGL portal, my ambition has always been simple: to 'bake' applications that don't just function, but bring delight and a memorable warm surprise to everyone who tries them.</p>
      <p>To me, combining algorithmic precision with aesthetic visual design is the secret recipe for digital products people love.</p>
      <div class="diary-personal-note">
        🍞 <span>Personal Note: Behind every cold, precise algorithm, there should always be a human touch that brings a smile.</span>
      </div>
    `
  },
  research: {
    title: '📖 Entry 04: Torii Gates at the Shinto Shrine',
    html: `
      <div class="diary-stamp-badge">📍 Kyoto Journal • Entry #04 (Shinto Shrine)</div>
      <div class="diary-story-quote">
        "Walking up the shrine steps through crimson torii gates mirrors my journey in AI research — quiet, dedicated, but rewarding at the peak."
      </div>
      <p>The serene atmosphere of this Shinto shrine is my favorite space for deep focus. In my thesis and academic exploration of LLM Synthetic Data Generation & Evaluation, I investigate how artificial intelligence can be trained and evaluated ethically, efficiently, and objectively for automated code generation.</p>
      <p>Research is like climbing thousands of shrine steps: dozens of hypotheses may fall along the way, but relentless data inquiry always reveals the clear truth of underlying patterns.</p>
      <div class="diary-personal-note">
        ⛩️ <span>Personal Note: AI research isn't just about chasing accuracy metrics on paper; it's about understanding how intelligence evolves.</span>
      </div>
    `
  },
  reach: {
    title: '📖 Entry 05: Vending Machine & Red Lanterns',
    html: `
      <div class="diary-stamp-badge">📍 Kyoto Journal • Entry #05 (Vending Machine)</div>
      <div class="diary-story-quote">
        "The glowing vending machine under red lanterns is always ready to serve travelers. So is my door for meaningful conversations."
      </div>
      <p>Thank you for journeying through this 3D travel journal to this cozy lantern-lit corner. Whether you are a <strong>recruiter</strong> seeking a proactive engineer, a fellow developer, or someone eager to discuss the future of AI — my line of communication is always open.</p>
      <p>Grab a fresh drink, sit back for a moment, and let’s discuss how we can build the next remarkable innovation together.</p>
      <ul style="margin-top: 14px; padding-left: 0; list-style: none;">
        <li style="margin-bottom: 8px;">📧 <strong>Email:</strong> <a href="mailto:yehezkieldavid2006@gmail.com" style="color: #b85c40; font-weight: 700;">yehezkieldavid2006@gmail.com</a></li>
        <li style="margin-bottom: 8px;">💼 <strong>LinkedIn:</strong> <a href="https://www.linkedin.com/in/ydavids/" target="_blank" style="color: #b85c40; font-weight: 700;">linkedin.com/in/ydavids/</a></li>
        <li style="margin-bottom: 8px;">💻 <strong>GitHub:</strong> <a href="https://github.com/06202003/" target="_blank" style="color: #b85c40; font-weight: 700;">github.com/06202003/</a></li>
        <li style="margin-bottom: 8px;">📱 <strong>WhatsApp:</strong> <a href="https://wa.me/6289507647137" target="_blank" style="color: #b85c40; font-weight: 700;">+62 895-0764-7137</a></li>
      </ul>
      <div class="diary-personal-note">
        🧃 <span>Personal Note: Always ready for great conversations and the next technological challenge!</span>
      </div>
    `
  },
  credits: {
    title: '🎨 3D Model Artwork Attribution',
    html: `
      <div class="diary-stamp-badge">📍 Sketchfab License • CC BY 4.0</div>
      <p style="margin-top: 10px;"><strong>"Tanabata evening - Kyoto inspired city scene"</strong></p>
      <p>3D Artwork created by <strong>Mathias Tossens</strong> on Sketchfab.</p>
      <p>Licensed under <a href="http://creativecommons.org/licenses/by/4.0/" target="_blank" style="color: #b85c40; font-weight: 700;">Creative Commons Attribution 4.0 International (CC BY 4.0)</a>.</p>
      <p style="margin-top: 14px;"><a href="https://sketchfab.com/3d-models/tanabata-evening-kyoto-inspired-city-scene-04dc9402b74d43ef86c4795311c0e4bb" target="_blank" style="color: #b85c40; font-weight: 700; text-decoration: underline;">🔗 View Original 3D Model on Sketchfab</a></p>
    `
  }
};

// 🌤️ Live Real-Time User Location Weather API Integration
function fetchLiveWeatherAndSetAtmosphere() {
  const weatherBadge = document.getElementById('hud-weather-badge');

  const updateWeatherUI = (cityName, temp, code, isRainy) => {
    let weatherIcon = '🌤️';
    let weatherLabel = 'Clear Sky';

    if (code >= 51 && code <= 99) {
      weatherIcon = '🌧️';
      weatherLabel = 'Rainy';
    } else if (code >= 1 && code <= 3) {
      weatherIcon = '☁️';
      weatherLabel = 'Cloudy';
    } else if (code >= 71 && code <= 77) {
      weatherIcon = '❄️';
      weatherLabel = 'Snowy';
    }

    if (weatherBadge) {
      weatherBadge.innerHTML = `${weatherIcon} <span>${cityName}: ${temp}°C • ${weatherLabel}</span>`;
    }

    if (rainParticles) {
      rainParticles.visible = isRainy;
    }
  };

  const fetchWeatherByCoords = (lat, lon, fallbackName = 'Local') => {
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`)
      .then(res => res.json())
      .then(data => {
        if (data && data.current) {
          const temp = Math.round(data.current.temperature_2m);
          const code = data.current.weather_code;
          const isRainy = code >= 51 && code <= 99;

          // Reverse geocode to get exact city name
          fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`)
            .then(res => res.json())
            .then(geo => {
              const city = geo.city || geo.locality || geo.principalSubdivision || fallbackName;
              updateWeatherUI(city, temp, code, isRainy);
            })
            .catch(() => updateWeatherUI(fallbackName, temp, code, isRainy));
        }
      })
      .catch(() => updateWeatherUI('Kyoto', 22, 61, true));
  };

  // 1. Try Browser Geolocation API
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        fetchWeatherByCoords(pos.coords.latitude, pos.coords.longitude, 'Your Location');
      },
      () => {
        // Fallback to IP geolocation if browser location permission is denied
        fetch('https://ipapi.co/json/')
          .then(res => res.json())
          .then(data => {
            if (data.latitude && data.longitude) {
              fetchWeatherByCoords(data.latitude, data.longitude, data.city || 'Local');
            } else {
              fetchWeatherByCoords(-6.2, 106.81, 'Jakarta');
            }
          })
          .catch(() => fetchWeatherByCoords(-6.2, 106.81, 'Jakarta'));
      },
      { timeout: 5000 }
    );
  } else {
    fetchWeatherByCoords(-6.2, 106.81, 'Jakarta');
  }
}

// 💭 Random Thoughts, Tech Quotes & Jokes Pop-up Engine
const popupContentList = [
  { tag: '💭 Random Thought', text: 'Did you know? Code intelligence models process syntax trees like natural language grammar.' },
  { tag: '💭 Random Thought', text: 'Kyoto traditional Machiya architecture uses wooden joinery without a single metal nail!' },
  { tag: '💭 Random Thought', text: 'Synthetic data generation in LLMs reduces human labeling costs by up to 90%.' },
  { tag: '💡 Tech Quote', text: '"Simplicity is prerequisite for reliability." — Edsger W. Dijkstra' },
  { tag: '💡 Tech Quote', text: '"First, solve the problem. Then, write the code." — John Johnson' },
  { tag: '💡 Tech Quote', text: '"Artificial Intelligence is the new electricity." — Andrew Ng' },
  { tag: '☕ Dev Joke', text: 'There are 10 types of people in the world: those who understand binary, and those who don\'t.' },
  { tag: '☕ Dev Joke', text: 'Why do programmers prefer dark mode? Because light attracts bugs!' },
  { tag: '☕ Dev Joke', text: 'A SQL query walks into a bar, walks up to two tables and asks: "Can I join you?"' },
  { tag: '☕ Dev Joke', text: 'Hardware: The part of a computer that you can kick when software crashes.' }
];

let thoughtIntervalId = null;

function showRandomThoughtPopup() {
  const card = document.getElementById('hud-thought-card');
  const tagElem = document.getElementById('thought-tag');
  const textElem = document.getElementById('thought-body-text');

  if (!card || !tagElem || !textElem) return;

  const randomItem = popupContentList[Math.floor(Math.random() * popupContentList.length)];
  tagElem.textContent = randomItem.tag;
  textElem.textContent = randomItem.text;

  card.classList.add('active');

  setTimeout(() => {
    card.classList.remove('active');
  }, 7000);
}

function startThoughtPopups() {
  if (thoughtIntervalId) clearInterval(thoughtIntervalId);
  setTimeout(showRandomThoughtPopup, 3000);
  thoughtIntervalId = setInterval(showRandomThoughtPopup, 14000);
}

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
    fetchLiveWeatherAndSetAtmosphere();
    startThoughtPopups();
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

  if (thoughtIntervalId) {
    clearInterval(thoughtIntervalId);
    thoughtIntervalId = null;
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

  const creditsBtn = document.getElementById('btn-credits-3d');
  if (creditsBtn) {
    creditsBtn.addEventListener('click', (e) => {
      e.preventDefault();
      playSound('click');
      openContentModal('credits');
    });
  }

  const thoughtClose = document.getElementById('thought-close-btn');
  const thoughtCard = document.getElementById('hud-thought-card');
  if (thoughtClose && thoughtCard) {
    thoughtClose.addEventListener('click', () => {
      thoughtCard.classList.remove('active');
    });
  }

  const audioBtn = document.getElementById('btn-audio-toggle');
  if (audioBtn) {
    audioBtn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleLofiMusic();
    });
  }

  const prevBtn = document.getElementById('btn-audio-prev');
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchStation('prev');
    });
  }

  const nextBtn = document.getElementById('btn-audio-next');
  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      e.preventDefault();
      switchStation('next');
    });
  }

  const volumeSlider = document.getElementById('spotify-volume');
  if (volumeSlider) {
    volumeSlider.addEventListener('input', (e) => {
      const vol = parseFloat(e.target.value);
      if (lofiStreamAudio) {
        lofiStreamAudio.volume = vol;
      }
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

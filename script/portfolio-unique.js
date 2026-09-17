/**
 * Portfolio Unique & Futuristic Enhancements Module
 * Features: Command Palette (Ctrl+K), Typewriter Engine, S-SPARC Token Simulator,
 * Publication Filters, 1-Click Citation Exporter, and Interactive Haptic Audio.
 */

(function () {
  'use strict';

  // --- 1. Sound Synthesizer via Web Audio API ---
  let audioCtx = null;
  let isMuted = localStorage.getItem('port_sound_muted') === 'true';

  function playUiSound(freq = 600, type = 'sine', duration = 0.06, gainLevel = 0.08) {
    if (isMuted) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + duration);

      gain.gain.setValueAtTime(gainLevel, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start(now);
      osc.stop(now + duration);
    } catch (e) {
      // Ignore audio synthesis errors on autoplay policies
    }
  }

  // --- 2. Toast Notification Engine ---
  function showToast(message, icon = 'fa-check') {
    let toast = document.getElementById('portToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'portToast';
      toast.className = 'port-toast';
      document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fa-solid ${icon} text-success"></i> <span>${message}</span>`;
    toast.classList.add('show');
    playUiSound(750, 'triangle', 0.08, 0.12);

    setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }

  // --- 3. Hero Typewriter Role Rotator ---
  const roles = [
    'AI Engineer & LLM Researcher',
    'Most Favorite Poster Winner (Impact-Edu 2026)',
    'AIREA 2026 Merit Award Winner (Hong Kong)',
    'Scopus Author (10+ Top Journal & IEEE Papers)',
    'Technical Lead @ Royal Medicalink Pharmalab',
    'Certified Reviewer for Nature & Springer Nature'
  ];

  function initTypewriter() {
    const target = document.getElementById('heroTypewriter');
    if (!target) return;

    let roleIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let typingSpeed = 70;

    function tick() {
      const currentRole = roles[roleIdx];

      if (isDeleting) {
        target.textContent = currentRole.substring(0, charIdx - 1);
        charIdx--;
        typingSpeed = 35;
      } else {
        target.textContent = currentRole.substring(0, charIdx + 1);
        charIdx++;
        typingSpeed = 70;
      }

      if (!isDeleting && charIdx === currentRole.length) {
        typingSpeed = 2200; // Pause at full word
        isDeleting = true;
      } else if (isDeleting && charIdx === 0) {
        isDeleting = false;
        roleIdx = (roleIdx + 1) % roles.length;
        typingSpeed = 400; // Pause before new word
      }

      setTimeout(tick, typingSpeed);
    }

    tick();
  }

  // --- 4. S-SPARC Token & Eco Simulator Engine ---
  function initSparcSimulator() {
    const rangeInput = document.getElementById('simStudentsRange');
    const lblStudents = document.getElementById('simStudentsVal');
    const lblTokensSaved = document.getElementById('simTokensSaved');
    const lblCo2Saved = document.getElementById('simCo2Saved');
    const lblCostSaved = document.getElementById('simCostSaved');
    const lblQueriesSaved = document.getElementById('simQueriesSaved');

    if (!rangeInput || !lblStudents) return;

    function updateSimulation() {
      const students = parseInt(rangeInput.value, 10);
      lblStudents.textContent = `${students} Students`;

      // Simulation constants based on S-SPARC trial data (60 students = 2,122,873 tokens, 83.94% reuse)
      const avgTokensPerStudent = 35381;
      const totalTokens = students * avgTokensPerStudent;
      const tokensSaved = Math.round(totalTokens * 0.8394);
      const queriesHandled = students * 48; // ~48 prompts per student per month
      const queriesSaved = Math.round(queriesHandled * 0.8394);

      // CO2 math: 1 LLM query ~ 4.32g CO2 vs cached search ~ 0.2g CO2 -> saving ~ 4.12g per reused query
      const co2GramsSaved = Math.round(queriesSaved * 4.12);
      const co2Kg = (co2GramsSaved / 1000).toFixed(1);

      // Dollar saving based on standard GPT-4o / Claude 3.5 Sonnet token pricing (~$5 per 1M tokens)
      const dollarSavings = ((tokensSaved / 1000000) * 5.0).toFixed(2);

      if (lblTokensSaved) lblTokensSaved.textContent = tokensSaved.toLocaleString();
      if (lblCo2Saved) lblCo2Saved.textContent = `${co2Kg} kg CO₂`;
      if (lblCostSaved) lblCostSaved.textContent = `$${dollarSavings}`;
      if (lblQueriesSaved) lblQueriesSaved.textContent = `${queriesSaved.toLocaleString()} (83.9%)`;
    }

    rangeInput.addEventListener('input', () => {
      updateSimulation();
      playUiSound(400 + (parseInt(rangeInput.value, 10) * 2), 'sine', 0.02, 0.04);
    });

    updateSimulation();
  }

  // --- 5. 1-Click BibTeX & APA Citation Exporter ---
  const citationDatabase = {
    acs: {
      title: 'Machine learning approach to detect GAI-disguised academic programming plagiarism',
      bibtex: `@article{setiawan2026machine,\n  title={Machine learning approach to detect GAI-disguised academic programming plagiarism},\n  author={Karnalim, Oscar and Setiawan, Yehezkiel David and others},\n  journal={Applied Computer Science},\n  volume={22},\n  number={1},\n  pages={1--15},\n  year={2026},\n  publisher={Politechnika Lubelska},\n  doi={10.35784/acs_8915}\n}`,
      apa: 'Karnalim, O., Setiawan, Y. D., et al. (2026). Machine learning approach to detect GAI-disguised academic programming plagiarism. Applied Computer Science, 22(1), 1-15. https://doi.org/10.35784/acs_8915'
    },
    software_impact: {
      title: 'E-STRANGE: A programming support platform in Academia for Code Ethics, Quality, and Efficiency',
      bibtex: `@article{karnalim2026estrange,\n  title={E-STRANGE: A programming support platform in Academia for Code Ethics, Quality, and Efficiency},\n  author={Karnalim, Oscar and Setiawan, Yehezkiel David and others},\n  journal={Software Impacts},\n  volume={24},\n  pages={100814},\n  year={2026},\n  publisher={Elsevier},\n  doi={10.1016/j.simpa.2026.100814}\n}`,
      apa: 'Karnalim, O., Setiawan, Y. D., et al. (2026). E-STRANGE: A programming support platform in Academia for Code Ethics, Quality, and Efficiency. Software Impacts, 24, 100814. https://doi.org/10.1016/j.simpa.2026.100814'
    },
    springer_uniqueness: {
      title: 'How Unique and Accurate Is GenAI Generated Code in Introductory Programming?',
      bibtex: `@inproceedings{setiawan2026unique,\n  title={How Unique and Accurate Is GenAI Generated Code in Introductory Programming?},\n  author={Setiawan, Yehezkiel David and Karnalim, Oscar and others},\n  booktitle={International Conference on Innovative Computing and Learning},\n  pages={500--510},\n  year={2026},\n  publisher={Springer Nature},\n  doi={10.1007/978-3-032-20381-6_50}\n}`,
      apa: 'Setiawan, Y. D., & Karnalim, O. (2026). How Unique and Accurate Is GenAI Generated Code in Introductory Programming? Springer Nature ICICL, 500–510. https://doi.org/10.1007/978-3-032-20381-6_50'
    },
    sparc_poster: {
      title: 'S-SPARC: Smart Personal Assistant for Responsible Consumption',
      bibtex: `@misc{setiawan2026sparc,\n  title={S-SPARC: Smart Personal Assistant for Responsible Consumption (Impact-Edu 2026 Most Favorite Poster)},\n  author={Setiawan, Yehezkiel David and Pranata, Johanes Mario and Haryanto, Archangela Sheilla and Karnalim, Oscar},\n  howpublished={Impact-Edu 2026 Poster Competition, Telkom University},\n  year={2026}\n}`,
      apa: 'Setiawan, Y. D., Pranata, J. M., Haryanto, A. S., & Karnalim, O. (2026). S-SPARC: Smart Personal Assistant for Responsible Consumption. Impact-Edu 2026 Student Learning Innovation Poster Competition, Telkom University.'
    }
  };

  window.copyCitation = function (pubKey, format = 'bibtex') {
    const data = citationDatabase[pubKey];
    if (!data) return;

    const textToCopy = format === 'bibtex' ? data.bibtex : data.apa;
    navigator.clipboard.writeText(textToCopy).then(() => {
      showToast(`Copied ${format.toUpperCase()} Citation to clipboard!`, 'fa-copy');
    }).catch(() => {
      showToast('Citation copied!', 'fa-copy');
    });
  };

  // --- 6. Command Palette (Ctrl+K / ⌘K) ---
  const cmdList = [
    {
      group: 'AI & Research Highlights',
      items: [
        {
          title: 'Ask YZ.AI (Interactive Knowledge Assistant)',
          desc: 'Get immediate answers about Yehezkiel\'s research and career',
          icon: 'fa-robot text-info',
          action: () => {
            const btn = document.getElementById('chatbot-launcher') || document.getElementById('btn-ask-sparc-ai');
            if (btn) btn.click();
          }
        },
        {
          title: 'S-SPARC Flagship AI Showcase',
          desc: '83.94% token reduction, AIREA 2026 & Impact-Edu 2026 winner',
          icon: 'fa-brain text-success',
          action: () => {
            document.getElementById('publications')?.scrollIntoView({ behavior: 'smooth' });
          }
        },
        {
          title: 'View AIREA 2026 Merit Award Certificate',
          desc: 'Merit Award Certificate (The Education University of Hong Kong)',
          icon: 'fa-award text-info',
          action: () => {
            const modal = new bootstrap.Modal(document.getElementById('modalPosterPdf'));
            window.switchSparcDoc('airea-cert');
            modal.show();
          }
        },
        {
          title: 'View Impact-Edu 2026 Certificate',
          desc: 'Most Favorite Poster Award Certificate (Telkom University)',
          icon: 'fa-trophy text-warning',
          action: () => {
            const modal = new bootstrap.Modal(document.getElementById('modalImpactEdu2026'));
            modal.show();
          }
        },
        {
          title: 'Interactive Poster & Deck PDF Viewer',
          desc: 'Explore S-SPARC research poster & pitch deck',
          icon: 'fa-file-pdf text-danger',
          action: () => {
            const modal = new bootstrap.Modal(document.getElementById('modalPosterPdf'));
            modal.show();
          }
        }
      ]
    },
    {
      group: 'Scholarly Publications & Review',
      items: [
        {
          title: 'Explore Peer-Reviewed Publications (10 Papers)',
          desc: 'Elsevier, Springer Nature, IEEE ICALT, Applied Computer Science',
          icon: 'fa-book-journal-whills text-primary',
          action: () => {
            document.getElementById('publications')?.scrollIntoView({ behavior: 'smooth' });
          }
        },
        {
          title: 'Nature & Springer Peer Review Dossiers',
          desc: 'Verified reviewer logs for Scientific Data (IF: 9.8) & RIPR',
          icon: 'fa-stamp text-success',
          action: () => {
            document.getElementById('peer-review')?.scrollIntoView({ behavior: 'smooth' });
          }
        }
      ]
    },
    {
      group: 'Special Experiences & Utilities',
      items: [
        {
          title: 'Enter 3D Midnight Archive (Secret Room)',
          desc: 'Interactive Three.js environment with ambient lofi music',
          icon: 'fa-door-open text-warning',
          action: () => {
            const door = document.getElementById('threeWorldLauncher') || document.getElementById('navDoorLauncher');
            if (door) door.click();
          }
        },
        {
          title: 'Download Curriculum Vitae (PDF)',
          desc: 'Complete academic and professional background',
          icon: 'fa-file-arrow-down text-info',
          action: () => {
            const link = document.createElement('a');
            link.href = 'data/Yehezkiel.pdf';
            link.download = 'Yehezkiel_David_Setiawan_CV.pdf';
            link.click();
            showToast('Downloading CV...', 'fa-download');
          }
        },
        {
          title: 'Contact / Collaboration Message',
          desc: 'Send an inquiry or project proposal',
          icon: 'fa-paper-plane text-emerald-400',
          action: () => {
            document.querySelector('section[aria-label="Contact form and location"]')?.scrollIntoView({ behavior: 'smooth' });
          }
        }
      ]
    }
  ];

  function initCommandPalette() {
    const backdrop = document.getElementById('cmdPaletteBackdrop');
    const input = document.getElementById('cmdInput');
    const resultsContainer = document.getElementById('cmdResults');

    if (!backdrop || !input || !resultsContainer) return;

    let selectedIdx = 0;
    let filteredItems = [];

    function renderResults(filterText = '') {
      resultsContainer.innerHTML = '';
      filteredItems = [];
      const query = filterText.toLowerCase().trim();

      cmdList.forEach(group => {
        const matchingGroupItems = group.items.filter(item =>
          !query || item.title.toLowerCase().includes(query) || item.desc.toLowerCase().includes(query)
        );

        if (matchingGroupItems.length > 0) {
          const groupLabel = document.createElement('div');
          groupLabel.className = 'cmd-group-label';
          groupLabel.textContent = group.group;
          resultsContainer.appendChild(groupLabel);

          matchingGroupItems.forEach(item => {
            const currentItemIdx = filteredItems.length;
            filteredItems.push(item);

            const itemDiv = document.createElement('div');
            itemDiv.className = `cmd-item ${currentItemIdx === selectedIdx ? 'selected' : ''}`;
            itemDiv.innerHTML = `
              <div class="cmd-item-left">
                <div class="cmd-item-icon"><i class="fa-solid ${item.icon}"></i></div>
                <div>
                  <div class="fw-semibold">${item.title}</div>
                  <div class="small text-muted" style="font-size: 0.76rem;">${item.desc}</div>
                </div>
              </div>
              <span class="cmd-item-shortcut">↵</span>
            `;

            itemDiv.addEventListener('click', () => {
              executeCommand(item);
            });

            itemDiv.addEventListener('mouseenter', () => {
              selectedIdx = currentItemIdx;
              updateSelectionHighlight();
            });

            resultsContainer.appendChild(itemDiv);
          });
        }
      });

      if (filteredItems.length === 0) {
        resultsContainer.innerHTML = `
          <div class="text-center py-4 text-muted">
            <i class="fa-solid fa-magnifying-glass mb-2 fa-2x"></i>
            <p class="mb-0">No matching commands found for "${filterText}"</p>
          </div>
        `;
      }
    }

    function updateSelectionHighlight() {
      const domItems = resultsContainer.querySelectorAll('.cmd-item');
      domItems.forEach((el, idx) => {
        if (idx === selectedIdx) {
          el.classList.add('selected');
          el.scrollIntoView({ block: 'nearest' });
        } else {
          el.classList.remove('selected');
        }
      });
    }

    function executeCommand(item) {
      closePalette();
      playUiSound(800, 'triangle', 0.08, 0.1);
      setTimeout(() => {
        item.action();
      }, 150);
    }

    function openPalette() {
      backdrop.classList.add('active');
      input.value = '';
      selectedIdx = 0;
      renderResults();
      input.focus();
      playUiSound(550, 'sine', 0.05, 0.08);
    }

    function closePalette() {
      backdrop.classList.remove('active');
    }

    // Keyboard Shortcuts (Ctrl+K or Cmd+K)
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (backdrop.classList.contains('active')) closePalette();
        else openPalette();
      } else if (e.key === 'Escape' && backdrop.classList.contains('active')) {
        closePalette();
      } else if (backdrop.classList.contains('active')) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          selectedIdx = (selectedIdx + 1) % Math.max(1, filteredItems.length);
          updateSelectionHighlight();
          playUiSound(350, 'sine', 0.02, 0.03);
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          selectedIdx = (selectedIdx - 1 + filteredItems.length) % Math.max(1, filteredItems.length);
          updateSelectionHighlight();
          playUiSound(350, 'sine', 0.02, 0.03);
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (filteredItems[selectedIdx]) {
            executeCommand(filteredItems[selectedIdx]);
          }
        }
      }
    });

    input.addEventListener('input', () => {
      selectedIdx = 0;
      renderResults(input.value);
    });

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closePalette();
    });

    // Global trigger buttons (Navbar, HUD dock, etc.)
    document.querySelectorAll('[data-action="open-cmd-palette"]').forEach(btn => {
      btn.addEventListener('click', openPalette);
    });

    window.openCommandPalette = openPalette;
  }

  // --- 7. Interactive Audio Mute Toggle ---
  function initAudioToggle() {
    const muteBtns = document.querySelectorAll('.btn-mute-toggle');
    muteBtns.forEach(btn => {
      btn.innerHTML = isMuted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
      btn.addEventListener('click', () => {
        isMuted = !isMuted;
        localStorage.setItem('port_sound_muted', isMuted);
        muteBtns.forEach(b => {
          b.innerHTML = isMuted ? '<i class="fa-solid fa-volume-xmark"></i>' : '<i class="fa-solid fa-volume-high"></i>';
        });
        showToast(isMuted ? 'Sound FX Muted' : 'Sound FX Enabled', isMuted ? 'fa-volume-xmark' : 'fa-volume-high');
        if (!isMuted) playUiSound(700, 'sine', 0.1, 0.15);
      });
    });
  }

  // --- 8. Attach General Interactive Audio to Key Elements ---
  function attachMicroInteractions() {
    const clickableSelectors = '.btn-sparc-solid, .sparc-media-tab, .btn-dossier-inspect, .btn-pub-details, .btn-star, .nav-link, .hero-stat-pill, .bento-card';
    document.querySelectorAll(clickableSelectors).forEach(elem => {
      elem.addEventListener('click', () => {
        playUiSound(600, 'sine', 0.04, 0.05);
      });
    });
  }

  // Initialize all enhancements on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    initTypewriter();
    initSparcSimulator();
    initCommandPalette();
    initAudioToggle();
    attachMicroInteractions();
  });
})();

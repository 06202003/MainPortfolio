const wave1 =
    'M0 108.306L50 114.323C100 120.34 200 132.374 300 168.476C400 204.578 500 264.749 600 246.698C700 228.647 800 132.374 900 108.306C1000 84.2382 1100 132.374 1150 156.442L1200 180.51V0H1150C1100 0 1000 0 900 0C800 0 700 0 600 0C500 0 400 0 300 0C200 0 100 0 50 0H0V108.306Z',
  wave2 =
    'M0 250L50 244.048C100 238.095 200 226.19 300 226.19C400 226.19 500 238.095 600 232.143C700 226.19 800 202.381 900 196.429C1000 190.476 1100 202.381 1150 208.333L1200 214.286V0H1150C1100 0 1000 0 900 0C800 0 700 0 600 0C500 0 400 0 300 0C200 0 100 0 50 0H0V250Z',
  wave3 =
    'M0 250L50 238.095C100 226.19 200 202.381 300 166.667C400 130.952 500 83.3333 600 101.19C700 119.048 800 202.381 900 214.286C1000 226.19 1100 166.667 1150 136.905L1200 107.143V0H1150C1100 0 1000 0 900 0C800 0 700 0 600 0C500 0 400 0 300 0C200 0 100 0 50 0H0V250Z',
  wave4 =
    'M0 125L50 111.111C100 97.2222 200 69.4444 300 97.2222C400 125 500 208.333 600 236.111C700 263.889 800 236.111 900 229.167C1000 222.222 1100 236.111 1150 243.056L1200 250V0H1150C1100 0 1000 0 900 0C800 0 700 0 600 0C500 0 400 0 300 0C200 0 100 0 50 0H0V125Z';

anime({
  targets: '.wave-top > path',
  easing: 'linear',
  duration: 17500,
  loop: true,
  d: [{ value: [wave1, wave2] }, { value: wave3 }, { value: wave4 }, { value: wave1 }],
});
anime({
  targets: ['#logoanimate'],
  keyframes: [{ rotate: 540 }, { rotate: 0 }, { rotate: 540 }, { rotate: 0 }],
  duration: 10000,
  easing: 'easeOutElastic(1, .8)',
  loop: true,
});

$(document).ready(function () {
  if ($('.brands_slider').length) {
    var brandsSlider = $('.brands_slider');

    brandsSlider.owlCarousel({
      loop: true,
      autoplay: true,
      autoplayTimeout: 5000,
      nav: false,
      dots: false,
      autoWidth: true,
      items: 8,
      margin: 42,
    });

    if ($('.brands_prev').length) {
      var prev = $('.brands_prev');
      prev.on('click', function () {
        brandsSlider.trigger('prev.owl.carousel');
      });
    }

    if ($('.brands_next').length) {
      var next = $('.brands_next');
      next.on('click', function () {
        brandsSlider.trigger('next.owl.carousel');
      });
    }
  }
});

const buttons = document.querySelectorAll('[data-target]');

buttons.forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.getAttribute('data-target');

    const divs = document.querySelectorAll('div[id^="div"]');
    divs.forEach((div) => {
      div.style.display = 'none';
    });

    const targetDiv = document.querySelector(`#${target}`);
    targetDiv.style.display = 'block';
  });
});

const form1 = document.getElementById('myForm');
$('#myForm').on('submit', function (e) {
  e.preventDefault();
  $('#contact-thx').modal('show');
});
const scriptURL = 'https://script.google.com/macros/s/AKfycbzQfsD0exjJzspn8oFDqwOJ8WAczFy5T06iq1G7GEMmOto-KUie3GpeAnJUVe6USAog0A/exec';
const form = document.forms['NewPort'];

form.addEventListener('submit', (e) => {
  e.preventDefault();
  fetch(scriptURL, { method: 'POST', body: new FormData(form) })
    .then((response) => console.log('Success!', response))
    .catch((error) => console.error('Error!', error.message));
  form1.reset();
});

// getting .product-container html
const productContainer = document.querySelector('.product-container');

let div;
// fetching JSON
fetch('product.json')
  .then((response) => response.json())
  .then((data) => {
    for (let i = 0; i < data.length; i++) {
      div = document.createElement('div');
      div.innerHTML = `
      <div class="col-md-12 d-flex justify-content-around">
        <img class="product-image " src="${data[i].image}" />
      </div>
      `;
      // console.log(data);
      productContainer.appendChild(div);
    }
  });

// getting .galer-container html
const galerContainer = document.querySelector('.galer-container');

let div1;
// fetching JSON
fetch('galer.json')
  .then((response) => response.json())
  .then((data) => {
    for (let i = 0; i < data.length; i++) {
      div1 = document.createElement('div');
      div1.innerHTML = `
      <div class="col-md-12 d-flex justify-content-around">
        <img class="galer-image " src="${data[i].image}" />
      </div>

      `;
      // console.log(data);
      galerContainer.appendChild(div1);
    }
  });

  let quote = document.querySelector('#quotes');
  let author = document.querySelector('#author');
  if (quote && author) {
    fetch('https://dummyjson.com/quotes/random')
      .then((res) => res.json())
      .then((data) => {
        quote.innerHTML = '" ' + data.quote + ' "';
        author.innerHTML = '~ ' + data.author + ' ~';
      })
      .catch(() => {});
  }

/* ==========================================================================
   S-SPARC Token Usage Chart, Publications Carousel, YZ.AI CTA, & Analytics
   ========================================================================== */
document.addEventListener('DOMContentLoaded', function () {
  // Safe Umami Event Tracking Helper
  function trackEvent(eventName, eventData) {
    if (typeof window.umami !== 'undefined' && typeof window.umami.track === 'function') {
      window.umami.track(eventName, eventData);
    }
  }

  // S-SPARC Token Usage Chart (Interactive Per-Session vs Cumulative Savings)
  const chartCanvas = document.getElementById('sparcTokenChart');
  const toggleBtn = document.getElementById('toggleChartMode');
  const chartTitle = document.getElementById('sparcChartTitle');

  if (chartCanvas && typeof Chart !== 'undefined') {
    const ctx = chartCanvas.getContext('2d');
    
    // Per-Session Data (Strictly Sessions P1 to P7, exact poster metrics)
    const perSessionData = {
      labels: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'],
      datasets: [
        {
          label: 'Retrieval Tokens (S-SPARC)',
          data: [218692, 144054, 266641, 230285, 121327, 257685, 542581],
          backgroundColor: '#10b981',
          borderRadius: 4
        },
        {
          label: 'LLM Inference Tokens',
          data: [39163, 21458, 44010, 40558, 23761, 46278, 125800],
          backgroundColor: '#f59e0b',
          borderRadius: 4
        }
      ]
    };

    // Cumulative Retrieval Savings Data (Accumulating up to 1,781,845 tokens)
    const cumulativeData = {
      labels: ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'],
      datasets: [
        {
          label: 'Cumulative Retrieval Tokens Saved',
          data: [218692, 362746, 629387, 859672, 980999, 1238684, 1781845],
          backgroundColor: 'rgba(52, 211, 153, 0.2)',
          borderColor: '#10b981',
          borderWidth: 3,
          fill: true,
          tension: 0.3,
          pointBackgroundColor: '#34d399',
          pointRadius: 5,
          type: 'line'
        }
      ]
    };

    // Savings percentages per session for clear tooltips
    const savingsPercentages = [84.8, 87.0, 85.8, 85.0, 83.6, 84.8, 81.2];

    let isCumulative = false;

    const sparcChart = new Chart(ctx, {
      type: 'bar',
      data: perSessionData,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: { color: '#cbd5e1', font: { size: 10 } }
          },
          tooltip: {
            callbacks: {
              label: function (context) {
                const index = context.dataIndex;
                if (isCumulative) {
                  return 'Cumulative Saved: ' + context.raw.toLocaleString() + ' tokens (Session ' + (index + 1) + ')';
                }
                const pct = savingsPercentages[index];
                if (context.datasetIndex === 0) {
                  return 'Retrieval Saved: ' + context.raw.toLocaleString() + ' tokens (' + pct + '% saved via S-SPARC)';
                } else {
                  return 'LLM Inference: ' + context.raw.toLocaleString() + ' tokens (' + (100 - pct).toFixed(1) + '% external API)';
                }
              }
            }
          }
        },
        scales: {
          x: {
            ticks: { color: '#94a3b8' },
            grid: { display: false }
          },
          y: {
            ticks: { color: '#94a3b8', font: { size: 9 } },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          }
        }
      }
    });

    // Toggle Button Handler
    if (toggleBtn) {
      toggleBtn.addEventListener('click', function () {
        isCumulative = !isCumulative;
        if (isCumulative) {
          sparcChart.config.type = 'line';
          sparcChart.data = cumulativeData;
          toggleBtn.innerHTML = '<i class="fa-solid fa-chart-column me-1"></i> Show Per-Session Tokens';
          if (chartTitle) {
            chartTitle.innerHTML = '<i class="fa-solid fa-chart-line me-2 text-success"></i> Cumulative Tokens Saved (P1–P7)';
          }
          trackEvent('Toggle Chart View', { mode: 'Cumulative' });
        } else {
          sparcChart.config.type = 'bar';
          sparcChart.data = perSessionData;
          toggleBtn.innerHTML = '<i class="fa-solid fa-chart-line me-1"></i> Show Cumulative Savings';
          if (chartTitle) {
            chartTitle.innerHTML = '<i class="fa-solid fa-chart-column me-2 text-success"></i> Token Usage (P1–P7)';
          }
          trackEvent('Toggle Chart View', { mode: 'Per-Session' });
        }
        sparcChart.update();
      });
    }
  }

  // Ask YZ.AI CTA Button Click Handler
  const askSparcBtn = document.getElementById('btn-ask-sparc-ai');
  if (askSparcBtn) {
    askSparcBtn.addEventListener('click', function () {
      trackEvent('Ask YZ.AI S-SPARC Click', { source: 'S-SPARC Spotlight CTA' });
      if (typeof window.askYZAI === 'function') {
        window.askYZAI('Tell me more about the S-SPARC research.');
      }
    });
  }

  // S-SPARC Media Showcase Tab Switcher
  const sparcTabs = document.querySelectorAll('.sparc-media-tab');
  const sparcHeroVideo = document.getElementById('sparcHeroVideo');
  const sparcModalVideo = document.getElementById('sparcModalVideo');

  sparcTabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      const targetTab = this.getAttribute('data-tab');
      
      // Deactivate all tabs & panes
      sparcTabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.sparc-media-pane').forEach(p => p.classList.remove('active'));

      // Activate clicked tab & corresponding pane
      this.classList.add('active');
      const targetPane = document.getElementById('sparc-pane-' + targetTab);
      if (targetPane) {
        targetPane.classList.add('active');
      }

      // Auto pause hero video if switching away from video tab
      if (targetTab !== 'video' && sparcHeroVideo && !sparcHeroVideo.paused) {
        sparcHeroVideo.pause();
      }

      trackEvent('S-SPARC Media Tab Switch', { tab: targetTab });
    });
  });

  // "Watch Video" CTA Button Handler
  const watchVideoBtn = document.getElementById('btn-sparc-watch-video');
  if (watchVideoBtn) {
    watchVideoBtn.addEventListener('click', function () {
      const videoTabBtn = document.querySelector('.sparc-media-tab[data-tab="video"]');
      if (videoTabBtn) {
        videoTabBtn.click();
      }
      if (sparcHeroVideo) {
        sparcHeroVideo.play().catch(e => console.log('Autoplay prevented:', e));
      }
      trackEvent('Watch AIREA Video Click', { source: 'S-SPARC Hero CTA' });
    });
  }

  // Auto pause modal video when AIREA 2026 modal is hidden
  const aireaModal = document.getElementById('modalAIREA2026');
  if (aireaModal) {
    aireaModal.addEventListener('hidden.bs.modal', function () {
      if (sparcModalVideo && !sparcModalVideo.paused) {
        sparcModalVideo.pause();
      }
    });
  }

  // Publications Owl Carousel Initialization
  if (typeof $ !== 'undefined' && $('.publications-carousel').length) {
    $('.publications-carousel').owlCarousel({
      loop: true,
      margin: 16,
      nav: true,
      dots: false,
      autoplay: true,
      autoplayTimeout: 6000,
      autoplayHoverPause: true,
      responsive: {
        0: { items: 1 },
        600: { items: 2 },
        1000: { items: 3 },
        1300: { items: 4 }
      }
    });
  }

  // Poster PDF Modal Lazy Loading & Event Tracking
  const posterModal = document.getElementById('modalPosterPdf');
  if (posterModal) {
    posterModal.addEventListener('show.bs.modal', function () {
      trackEvent('View Poster Modal Open', { title: 'S-SPARC Poster PDF' });
      const iframe = document.getElementById('posterPdfFrame');
      if (iframe && (!iframe.src || iframe.src === 'about:blank' || iframe.src.indexOf('S-SPARC_IMPACT_EDU') === -1)) {
        iframe.src = 'data/S-SPARC_IMPACT_EDU.pdf';
      }
    });
  }

  // Track External Paper & Details Clicks
  document.querySelectorAll('.btn-pub-paper').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const href = btn.getAttribute('href') || 'modal';
      trackEvent('Read Paper Click', { target: href });
    });
  });

  document.querySelectorAll('.btn-pub-details').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const targetModal = btn.getAttribute('data-bs-target') || 'unknown';
      trackEvent('Publication Details Click', { modal: targetModal });
    });
  });
});

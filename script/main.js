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
   S-SPARC Token Usage Chart, Publications Carousel, and PDF Lazy-loader
   ========================================================================== */
document.addEventListener('DOMContentLoaded', function () {
  // S-SPARC Token Usage Chart (Strictly Sessions P1 to P7)
  const chartCanvas = document.getElementById('sparcTokenChart');
  if (chartCanvas && typeof Chart !== 'undefined') {
    const ctx = chartCanvas.getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
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
      },
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
                return context.dataset.label + ': ' + context.raw.toLocaleString() + ' tokens';
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

  // Poster PDF Modal Lazy Loading
  const posterModal = document.getElementById('modalPosterPdf');
  if (posterModal) {
    posterModal.addEventListener('show.bs.modal', function () {
      const iframe = document.getElementById('posterPdfFrame');
      if (iframe && (!iframe.src || iframe.src === 'about:blank' || iframe.src.indexOf('S-SPARC_IMPACT_EDU') === -1)) {
        iframe.src = 'data/S-SPARC_IMPACT_EDU.pdf';
      }
    });
  }
});
/**
 * Finance Dashboard Core Controller
 * Yehezkiel Portfolio
 */

(function () {
  'use strict';

  // LocalStorage Keys
  const STORAGE_KEY_TOKEN = 'fin_session_token';
  const STORAGE_KEY_EXPIRES = 'fin_session_expires';
  const STORAGE_KEY_ATTEMPTS = 'fin_failed_attempts';
  const STORAGE_KEY_LOCKOUT = 'fin_lockout_until';

  // Lockout parameters
  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION_MS = 30000; // 30 seconds

  // DOM Elements
  const gateOverlay = document.getElementById('password-gate-overlay');
  const gateForm = document.getElementById('gate-form');
  const passInput = document.getElementById('gate-password');
  const togglePassBtn = document.getElementById('toggle-password-btn');
  const submitBtn = document.getElementById('gate-submit-btn');
  const errorMsg = document.getElementById('gate-error');
  const dashContainer = document.getElementById('dashboard-container');
  const logoutBtn = document.getElementById('logout-btn');
  const lastUpdatedEl = document.getElementById('last-updated-date');

  // Chart Instances
  let lineChartInstance = null;
  let donutChartInstance = null;

  // Initialize
  document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkLockoutStatus();
    checkExistingSession();
  });

  function setupEventListeners() {
    // Toggle Password Visibility
    if (togglePassBtn) {
      togglePassBtn.addEventListener('click', () => {
        const isPass = passInput.type === 'password';
        passInput.type = isPass ? 'text' : 'password';
        togglePassBtn.innerHTML = isPass ? '<i class="fa-solid fa-eye-slash"></i>' : '<i class="fa-solid fa-eye"></i>';
      });
    }

    // Form Submit
    if (gateForm) {
      gateForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await handlePasswordSubmit();
      });
    }

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        handleLogout();
      });
    }

    // AI Re-analyze Button
    const btnGenerateAI = document.getElementById('btn-generate-ai');
    if (btnGenerateAI) {
      btnGenerateAI.addEventListener('click', () => {
        if (window.currentFinanceData) {
          fetchAIAnalysis(window.currentFinanceData);
        }
      });
    }

    // AI Custom Question Form
    const aiForm = document.getElementById('ai-custom-prompt-form');
    if (aiForm) {
      aiForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const customInput = document.getElementById('ai-prompt-input');
        const question = (customInput.value || '').trim();
        if (question && window.currentFinanceData) {
          fetchAIAnalysis(window.currentFinanceData, question);
        }
      });
    }
  }


  function checkLockoutStatus() {
    const lockoutUntil = parseInt(localStorage.getItem(STORAGE_KEY_LOCKOUT) || '0', 10);
    const now = Date.now();

    if (now < lockoutUntil) {
      const remainingSec = Math.ceil((lockoutUntil - now) / 1000);
      showError(`Terlalu banyak percobaan salah. Silakan tunggu ${remainingSec} detik.`);
      disableForm(true);

      const timer = setInterval(() => {
        const currentNow = Date.now();
        if (currentNow >= lockoutUntil) {
          clearInterval(timer);
          localStorage.removeItem(STORAGE_KEY_LOCKOUT);
          localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
          hideError();
          disableForm(false);
        } else {
          const rem = Math.ceil((lockoutUntil - currentNow) / 1000);
          showError(`Terlalu banyak percobaan salah. Silakan tunggu ${rem} detik.`);
        }
      }, 1000);
    }
  }

  function checkExistingSession() {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN);
    const expiresAt = parseInt(localStorage.getItem(STORAGE_KEY_EXPIRES) || '0', 10);
    const now = Date.now();

    if (token && now < expiresAt) {
      // Valid session
      unlockDashboard();
    } else {
      // Session expired or missing
      if (token) handleLogout();
      showGate();
    }
  }

  async function handlePasswordSubmit() {
    const password = (passInput.value || '').trim();
    if (!password) {
      showError('Masukkan password terlebih dahulu.');
      return;
    }

    // Check Lockout
    const lockoutUntil = parseInt(localStorage.getItem(STORAGE_KEY_LOCKOUT) || '0', 10);
    if (Date.now() < lockoutUntil) {
      checkLockoutStatus();
      return;
    }

    setSubmitting(true);
    hideError();

    try {
      // Try Netlify Serverless Function first
      const response = await fetch('/.netlify/functions/verify-finance-pass', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          saveSession(data.token, data.expiresAt);
          resetFailedAttempts();
          unlockDashboard();
          return;
        }
      } else if (response.status === 401) {
        recordFailedAttempt('Password yang Anda masukkan salah.');
        return;
      }
      
      // Fallback for static local server / offline mode
      await fallbackLocalVerification(password);

    } catch (err) {
      // If serverless function unavailable (e.g. offline file:// or local server without netlify dev)
      await fallbackLocalVerification(password);
    } finally {
      setSubmitting(false);
    }
  }

  async function fallbackLocalVerification(password) {
    // Default fallback verification for local offline dev
    // Accept 'finance123' or 'admin123' as default local testing keys
    if (password === 'finance123' || password === 'admin123') {
      const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
      saveSession('local_fallback_token_' + Date.now(), expiresAt);
      resetFailedAttempts();
      unlockDashboard();
    } else {
      recordFailedAttempt('Password salah! (Lokal: gunakan password default)');
    }
  }

  function recordFailedAttempt(message) {
    let attempts = parseInt(localStorage.getItem(STORAGE_KEY_ATTEMPTS) || '0', 10) + 1;
    localStorage.setItem(STORAGE_KEY_ATTEMPTS, attempts.toString());

    if (attempts >= MAX_ATTEMPTS) {
      const lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      localStorage.setItem(STORAGE_KEY_LOCKOUT, lockoutUntil.toString());
      checkLockoutStatus();
    } else {
      const remaining = MAX_ATTEMPTS - attempts;
      showError(`${message} Sisa percobaan: ${remaining}`);
    }
  }

  function resetFailedAttempts() {
    localStorage.removeItem(STORAGE_KEY_ATTEMPTS);
    localStorage.removeItem(STORAGE_KEY_LOCKOUT);
  }

  function saveSession(token, expiresAt) {
    localStorage.setItem(STORAGE_KEY_TOKEN, token);
    localStorage.setItem(STORAGE_KEY_EXPIRES, expiresAt.toString());
  }

  function handleLogout() {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_EXPIRES);
    showGate();
  }

  function showGate() {
    gateOverlay.style.display = 'flex';
    dashContainer.style.display = 'none';
    passInput.value = '';
    hideError();
  }

  function unlockDashboard() {
    gateOverlay.style.display = 'none';
    dashContainer.style.display = 'block';
    loadDashboardData();
  }

  function showError(msg) {
    errorMsg.textContent = msg;
    errorMsg.style.display = 'block';
  }

  function hideError() {
    errorMsg.style.display = 'none';
    errorMsg.textContent = '';
  }

  function disableForm(disabled) {
    passInput.disabled = disabled;
    submitBtn.disabled = disabled;
  }

  function setSubmitting(isSubmitting) {
    submitBtn.disabled = isSubmitting;
    submitBtn.innerHTML = isSubmitting 
      ? '<i class="fa-solid fa-spinner fa-spin"></i> Memverifikasi...' 
      : '<i class="fa-solid fa-lock"></i> Buka Laporan';
  }

  // --- DASHBOARD DATA & CHARTS ---

  async function loadDashboardData() {
    try {
      // Try root-relative paths first, fallback to relative paths for local file:// preview
      let response = await fetch('/data/finance-data.json');
      if (!response.ok) {
        response = await fetch('/data/finance-data.example.json');
      }
      if (!response.ok) {
        response = await fetch('data/finance-data.json');
      }
      if (!response.ok) {
        response = await fetch('data/finance-data.example.json');
      }
      if (!response.ok) {
        response = await fetch('../data/finance-data.json');
      }
      if (!response.ok) {
        response = await fetch('../data/finance-data.example.json');
      }
      if (!response.ok) {
        throw new Error('Gagal memuat file data keuangan.');
      }

      const data = await response.json();
      renderDashboard(data);
    } catch (err) {
      console.error('Error loading finance data:', err);
      alert('Gagal memuat data laporan keuangan: ' + err.message);
    }
  }


  function renderDashboard(data) {
    window.currentFinanceData = data;

    // 1. Last Updated Date
    if (lastUpdatedEl && data.last_updated) {
      lastUpdatedEl.textContent = formatDate(data.last_updated);
    }

    // 2. Passive Income Banner
    if (data.monthly_cashflow && data.monthly_cashflow.passive_income) {
      const passEl = document.getElementById('val-passive-income');
      if (passEl) {
        passEl.textContent = `+${formatCurrency(data.monthly_cashflow.passive_income, 'IDR')} / bln`;
      }
    }

    // 3. Cashflow Cards
    renderCashflow(data.monthly_cashflow);

    // 4. Financial Ratios
    renderRatios(data.ratios);

    // 5. Net Worth Trend Line Chart
    renderNetWorthChart(data.net_worth_trend);

    // 6. Asset Allocation Donut Chart
    renderAssetAllocationChart(data.asset_allocation);

    // 7. Trigger Live AI Analysis
    fetchAIAnalysis(data);
  }

  async function fetchAIAnalysis(financeData, customQuestion = '') {
    const aiContainer = document.getElementById('ai-response-container');
    const aiModelEl = document.getElementById('ai-model-used');
    const btnGenerate = document.getElementById('btn-generate-ai');
    const btnAsk = document.getElementById('btn-ask-ai');

    if (!aiContainer) return;

    if (btnGenerate) btnGenerate.disabled = true;
    if (btnAsk) btnAsk.disabled = true;

    aiContainer.innerHTML = `
      <div style="text-align: center; padding: 26px 20px; color: #94a3b8;">
        <i class="fa-solid fa-brain fa-spin fa-2x" style="color: #3b82f6;"></i>
        <p style="margin-top: 12px; font-weight: 600; color: #cbd5e1;">YZ.AI Engine sedang menganalisis portofolio keuangan Anda...</p>
        <span style="font-size: 0.8rem; color: #64748b;">Mengkalkulasi rasio, cashflow, dan strategi pertumbuhan net worth</span>
      </div>
    `;

    try {
      // Try Netlify Function endpoint first
      let response = await fetch('/.netlify/functions/finance-ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ financeData, customQuestion })
      });

      if (!response.ok) {
        // Fallback for static local server preview
        response = await fetch('../.netlify/functions/finance-ai-advisor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ financeData, customQuestion })
        });
      }

      let aiResult;
      if (response.ok) {
        aiResult = await response.json();
      } else {
        // Fallback local rule generator if offline / no serverless runner
        aiResult = {
          answer: generateFallbackLocalAI(financeData, customQuestion),
          modelUsed: 'Local Smart Engine'
        };
      }

      if (aiModelEl && aiResult.modelUsed) {
        aiModelEl.textContent = `${aiResult.modelUsed}`;
      }

      // Render Markdown output using Marked.js if available, else standard formatting
      const rawText = aiResult.answer || '';
      if (window.marked) {
        aiContainer.innerHTML = window.marked.parse(rawText);
      } else {
        aiContainer.innerHTML = `<p style="white-space: pre-wrap;">${rawText}</p>`;
      }

    } catch (err) {
      console.warn('AI Fetch error, rendering fallback:', err);
      const fallbackText = generateFallbackLocalAI(financeData, customQuestion);
      if (window.marked) {
        aiContainer.innerHTML = window.marked.parse(fallbackText);
      } else {
        aiContainer.innerHTML = `<p style="white-space: pre-wrap;">${fallbackText}</p>`;
      }
      if (aiModelEl) aiModelEl.textContent = 'Local Fallback Engine';
    } finally {
      if (btnGenerate) btnGenerate.disabled = false;
      if (btnAsk) btnAsk.disabled = false;
    }
  }

  function generateFallbackLocalAI(data, question) {
    const inc = data?.monthly_cashflow?.income || 9481042;
    const exp = data?.monthly_cashflow?.expenses || 7650000;
    const net = inc - exp;

    if (question) {
      return `🎯 **Jawaban AI untuk Pertanyaan Anda:**\n\nBerdasarkan data keuangan bulanan Anda (Pendapatan total Rp ${(inc/1000000).toFixed(2)} Jt dan sisa bersih Rp ${(net/1000000).toFixed(2)} Jt), keuangan Anda berada dalam kondisi **Sehat & Surplus**.\n\nSaran AI: Pertahankan alokasi dana darurat dan pastikan pengeluaran variabel tetap terkontrol di bawah sisa dana bebas bulanan Anda.`;
    }

    return `🎯 **Skor & Ringkasan Kesehatan Keuangan: 88/100 (SANGAT SEHAT)**\n\nPortofolio keuangan Anda memiliki struktur aset yang terdiversifikasi dengan sangat baik antara instrumen berisiko rendah (Deposito Allo Bank & SeaBank) dan pendapatan tetap berimbal hasil tinggi (Obligasi ST016T2 7.05%).\n\n🟢 **Kekuatan Utama Portofolio:**\n- **Passive Income Aktif:** Anda menerima passive income bersih $\\approx$ **Rp 681.042/bulan** dari kupon ST016T2 & bunga deposito tanpa perlu bekerja tambahan.\n- **Fixed Cost Terkontrol:** Biaya tempat tinggal dan konsumsi harian berada di level 41.7% (aman di bawah batas 50%).\n- **Rasio Utang Aman:** Cicilan mobil 26.4% di bawah ambang batas aman 30%.\n\n⚠️ **Area Perhatian / Optimasi:**\n- **Savings Rate Operasional:** Tabungan rutin bulanan Danamon (Rp 1.2M) berkisar 13.6% dari total income. Target ideal secara teoritis adalah 20-30%.\n- **Reinvestasi Passive Income:** Kupon bulanan ST016T2 (Rp 264rb) sebaiknya otomatis di-reinvestasikan ke Reksadana Sucorinvest MMF agar terjadi *compound interest*.\n\n🚀 **Rekomendasi Aksi Nyata (Actionable Advice):**\n1. **Auto-Reinvest Kupon ST016T2:** Jadwalkan auto-debit kupon bulanan langsung masuk ke Reksadana Pasar Uang.\n2. **Evaluasi GoPay Later:** Jaga pengeluaran makan/konsumsi harian agar stabil di angka Rp 2.0M untuk menambah sisa kas bebas menjadi Rp 1.4M/bulan.\n3. **Disiplin Danamon:** Pertahankan tabungan berjangka Danamon hingga Jan 2031 untuk mencairkan pokok + bunga Rp 81,8 Juta.`;
  }


  function renderCashflow(cf) {
    if (!cf) return;
    const income = cf.income || 0;
    const expenses = cf.expenses || 0;
    const net = income - expenses;

    document.getElementById('val-income').textContent = formatCurrency(income, cf.currency);
    document.getElementById('val-expenses').textContent = formatCurrency(expenses, cf.currency);

    const netEl = document.getElementById('val-net');
    const netBadge = document.getElementById('badge-net');
    netEl.textContent = formatCurrency(net, cf.currency);

    if (net >= 0) {
      netEl.className = 'amount-val amount-profit';
      netBadge.className = 'status-badge badge-ok';
      netBadge.innerHTML = '<i class="fa-solid fa-arrow-trend-up"></i> Surplus';
    } else {
      netEl.className = 'amount-val amount-deficit';
      netBadge.className = 'status-badge badge-danger';
      netBadge.innerHTML = '<i class="fa-solid fa-arrow-trend-down"></i> Defisit';
    }
  }

  function renderRatios(ratios) {
    if (!ratios) return;

    // Savings Rate
    if (ratios.savings_rate) {
      const sr = ratios.savings_rate;
      document.getElementById('num-savings-rate').textContent = `${sr.value}%`;
      document.getElementById('target-savings-rate').textContent = `Target: ≥ ${sr.target}%`;
      
      const isOk = sr.value >= sr.target;
      const badge = document.getElementById('badge-savings-rate');
      badge.className = `status-badge ${isOk ? 'badge-ok' : 'badge-warning'}`;
      badge.textContent = isOk ? 'OK' : 'Cek';
    }

    // Fixed Cost Ratio
    if (ratios.fixed_cost_ratio) {
      const fc = ratios.fixed_cost_ratio;
      document.getElementById('num-fixed-cost').textContent = `${fc.value}%`;
      document.getElementById('target-fixed-cost').textContent = `Target: ≤ ${fc.target}%`;

      const isOk = fc.value <= fc.target;
      const badge = document.getElementById('badge-fixed-cost');
      badge.className = `status-badge ${isOk ? 'badge-ok' : 'badge-danger'}`;
      badge.textContent = isOk ? 'OK' : 'Cek';
    }

    // Debt to Income
    if (ratios.debt_to_income_ratio) {
      const dti = ratios.debt_to_income_ratio;
      document.getElementById('num-dti').textContent = `${dti.value}%`;
      document.getElementById('target-dti').textContent = `Target: ≤ ${dti.target}%`;

      const isOk = dti.value <= dti.target;
      const badge = document.getElementById('badge-dti');
      badge.className = `status-badge ${isOk ? 'badge-ok' : 'badge-danger'}`;
      badge.textContent = isOk ? 'OK' : 'Cek';
    }
  }

  function renderNetWorthChart(trendData) {
    if (!trendData || !Array.isArray(trendData)) return;

    const ctx = document.getElementById('netWorthChart').getContext('2d');
    const labels = trendData.map(item => item.month);
    const values = trendData.map(item => item.amount);

    if (lineChartInstance) lineChartInstance.destroy();

    // Create Gradient fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.3)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    lineChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Net Worth',
          data: values,
          borderColor: '#10b981',
          borderWidth: 3,
          backgroundColor: gradient,
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#07131f',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f2a43',
            titleColor: '#f8fafc',
            bodyColor: '#10b981',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            displayColors: false,
            callbacks: {
              label: (context) => 'Net Worth: ' + formatCurrency(context.parsed.y, 'IDR')
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8', font: { size: 12 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#94a3b8',
              font: { size: 12 },
              callback: (val) => (val / 1000000).toFixed(0) + ' Jt'
            }
          }
        }
      }
    });
  }

  function renderAssetAllocationChart(assetData) {
    if (!assetData || !Array.isArray(assetData)) return;

    const ctx = document.getElementById('assetAllocationChart').getContext('2d');
    const labels = assetData.map(item => item.category);
    const values = assetData.map(item => item.amount);
    const colors = assetData.map((item, idx) => item.color || getDefaultColor(idx));

    if (donutChartInstance) donutChartInstance.destroy();

    donutChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: '#07131f',
          borderWidth: 2,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#cbd5e1',
              font: { size: 12 },
              padding: 14,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: '#0f2a43',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255,255,255,0.1)',
            borderWidth: 1,
            padding: 12,
            callbacks: {
              label: (context) => {
                const val = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const pct = ((val / total) * 100).toFixed(1);
                return ` ${context.label}: ${formatCurrency(val, 'IDR')} (${pct}%)`;
              }
            }
          }
        },
        cutout: '68%'
      }
    });
  }

  // --- UTILS ---

  function formatCurrency(val, currency = 'IDR') {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(val);
  }

  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function getDefaultColor(idx) {
    const palette = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#06b6d4'];
    return palette[idx % palette.length];
  }

})();

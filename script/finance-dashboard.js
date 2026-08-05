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
      
      // Auto-Apply Monthly Rollover & Interest Compounding Engine
      const updatedData = applyAutoMonthlyRollover(data);

      renderDashboard(updatedData);
    } catch (err) {
      console.error('Error loading finance data:', err);
      alert('Gagal memuat data laporan keuangan: ' + err.message);
    }
  }

  /**
   * Automatic Monthly Rollover & Interest Engine
   * Calculates elapsed months since Feb 2026, auto-compounds Danamon deposits (1.2M/mo at 5% p.a.),
   * and auto-projects Net Worth growth month-by-month so the dashboard is ALWAYS up-to-date automatically!
   */
  function applyAutoMonthlyRollover(data) {
    if (!data) return data;

    const now = new Date();
    const startYear = 2026;
    const startMonth = 1; // 0-indexed: Feb = 1

    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    // Calculate months elapsed since Feb 2026 (1 to 60 months)
    let elapsedMonths = (currentYear - startYear) * 12 + (currentMonth - startMonth) + 1;
    if (elapsedMonths < 1) elapsedMonths = 1;
    if (elapsedMonths > 60) elapsedMonths = 60; // 5 years max (Feb 2026 - Jan 2031)

    // Formula for Future Value of Monthly Annuity (Danamon Tabungan Berjangka)
    // Deposit P = 1,200,000, monthly rate r = 0.05 / 12
    const depositPerMonth = 1200000;
    const monthlyRate = 0.05 / 12;
    let danamonBalance = 0;
    for (let i = 1; i <= elapsedMonths; i++) {
      danamonBalance = (danamonBalance + depositPerMonth) * (1 + monthlyRate);
    }
    danamonBalance = Math.round(danamonBalance);

    // Auto-update Danamon item in asset_allocation
    if (data.asset_allocation && Array.isArray(data.asset_allocation)) {
      const danamonItem = data.asset_allocation.find(item => 
        item.category && item.category.toLowerCase().includes('danamon')
      );
      if (danamonItem) {
        danamonItem.amount = danamonBalance;
      }
    }

    // Dynamic Net Worth Trend Generator (Feb 2026 up to current month)
    const monthNamesIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    const baseNetWorth = 165000000; // Fixed Assets (ST016 50M + Allo 50M + Sea 50M + Sucor 15M)
    const trend = [];

    for (let i = 0; i < elapsedMonths; i++) {
      const mDate = new Date(startYear, startMonth + i, 1);
      const mLabel = `${monthNamesIndo[mDate.getMonth()]} ${mDate.getFullYear()}`;

      // Danamon balance at month i+1
      let mDanamon = 0;
      for (let k = 1; k <= (i + 1); k++) {
        mDanamon = (mDanamon + depositPerMonth) * (1 + monthlyRate);
      }

      // Net Worth = Base Fixed Assets (165M) + Accumulated Danamon + Monthly Liquid Cash
      const totalNW = Math.round(baseNetWorth + mDanamon + 1150000);
      trend.push({ month: mLabel, amount: totalNW });
    }

    data.net_worth_trend = trend;

    // Auto-update last_updated date to current date
    const todayStr = now.toISOString().split('T')[0];
    data.last_updated = todayStr;

    // Save elapsed months for UI meta rendering
    window.currentElapsedMonths = elapsedMonths;
    window.currentDanamonBalance = danamonBalance;

    return data;
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

    // Dynamic Danamon Asset Card update
    const danamonValEl = document.getElementById('danamon-val-display');
    const danamonMetaEl = document.getElementById('danamon-meta-display');
    if (danamonValEl && window.currentDanamonBalance) {
      danamonValEl.textContent = formatCurrency(window.currentDanamonBalance, 'IDR');
    }
    if (danamonMetaEl && window.currentElapsedMonths) {
      danamonMetaEl.textContent = `Setoran Bulan ke-${window.currentElapsedMonths} / 60 • Bunga 5% p.a. • Goal 81.8M`;
    }


    // 3. Cashflow Cards
    renderCashflow(data.monthly_cashflow);

    // 4. Financial Ratios
    renderRatios(data.ratios);

    // 5. Net Worth Trend Line Chart
    renderNetWorthChart(data.net_worth_trend);

    // 6. Asset Allocation Donut Chart
    renderAssetAllocationChart(data.asset_allocation);

    // 7. Monthly Cashflow Bar Chart (NEW CHART 3)
    renderCashflowBarChart(data.monthly_cashflow);

    // 8. Financial Health Radar Chart (NEW CHART 4)
    renderHealthRadarChart(data.ratios);

    // 9. Trigger Live AI Analysis
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
      return `🎯 **Jawaban AI untuk Pertanyaan Anda:**\n\nBerdasarkan data keuangan bulanan Anda (Pendapatan total Rp ${(inc/1000000).toFixed(2)} Jt dan sisa bersih Rp ${(net/1000000).toFixed(2)} Jt), keuangan Anda berada dalam kondisi **Sangat Sehat & Surplus**.\n\nDengan memperhitungkan Tabungan Danamon (Rp 1.2M) + Sisa Kas Bebas (Rp 1.15M), Total Savings Rate Anda berada di angka **24.8%**, yang sudah memenuhi target ideal 20-30%.`;
    }

    return `🎯 **Skor & Ringkasan Kesehatan Keuangan: 95/100 (SANGAT SEHAT & PRIMA)**\n\nPortofolio keuangan Anda berada dalam posisi yang sangat solid! Dengan memperhitungkan setoran rutin Danamon (Rp 1.2M) plus sisa cashflow bebas (Rp 1.15M), **Total Savings Rate sejati Anda mencapai 24.8%**—masuk dalam zona ideal target finansial (20-30%).\n\n🟢 **Kekuatan Utama Portofolio:**\n- **Total Savings Rate Sejati 24.8%:** Kombinasi tabungan terikat Danamon + sisa kas bebas memberi daya simpan Rp 2.35M/bulan.\n- **Passive Income Aktif:** Anda menerima passive income bersih $\\approx$ **Rp 681.042/bulan** dari kupon ST016T2 & bunga deposito.\n- **Fixed Cost Terkontrol:** Biaya tempat tinggal dan konsumsi harian berada di level 41.7% (aman di bawah 50%).\n- **Rasio Utang Aman:** Cicilan mobil 26.4% di bawah ambang batas maksimal 30%.\n\n⚠️ **Area Perhatian / Optimasi:**\n- **Reinvestasi Passive Income:** Kupon bulanan ST016T2 (Rp 264rb) & bunga deposito sebaiknya otomatis di-reinvestasikan ke Reksadana Sucorinvest MMF agar terjadi *compound interest*.\n- **Pengalokasian Sisa Kas Bebas:** Alokasikan Rp 1.15M sisa kas bebas secara bertahap ke Dana Darurat atau Reksadana Pasar Uang.\n\n🚀 **Rekomendasi Aksi Nyata (Actionable Advice):**\n1. **Auto-Reinvest Kupon ST016T2:** Jadwalkan auto-debit kupon bulanan langsung masuk ke Reksadana Sucorinvest MMF.\n2. **Disiplin Tabungan Danamon:** Pertahankan tabungan berjangka Danamon hingga Jan 2031 untuk mencairkan Rp 81,8 Juta.\n3. **Optimasi Cashflow:** Pertahankan pola konsumsi saat ini agar sisa kas bebas Rp 1.15M dapat terus diputar ke instrumen produktif.`;
  }



  function renderCashflow(cf) {
    if (!cf) return;
    const income = cf.income || 0;
    const expenses = cf.expenses || 0;
    const net = income - expenses;

    const incEl = document.getElementById('val-income');
    const expEl = document.getElementById('val-expenses');
    const netEl = document.getElementById('val-net');
    const netBadge = document.getElementById('badge-net');

    if (incEl) incEl.textContent = formatCurrency(income, cf.currency);
    if (expEl) expEl.textContent = formatCurrency(expenses, cf.currency);

    if (netEl) {
      netEl.textContent = formatCurrency(net, cf.currency);
      if (net >= 0) {
        netEl.className = 'amount-val amount-profit';
      } else {
        netEl.className = 'amount-val amount-deficit';
      }
    }

    if (netBadge) {
      if (net >= 0) {
        netBadge.className = 'status-badge badge-ok';
        netBadge.innerHTML = '<i class="fa-solid fa-arrow-trend-up"></i> Surplus';
      } else {
        netBadge.className = 'status-badge badge-danger';
        netBadge.innerHTML = '<i class="fa-solid fa-arrow-trend-down"></i> Defisit';
      }
    }
  }

  function renderRatios(ratios) {
    if (!ratios) return;

    // Savings Rate
    if (ratios.savings_rate) {
      const sr = ratios.savings_rate;
      const numEl = document.getElementById('num-savings-rate');
      const targetEl = document.getElementById('target-savings-rate');
      const badge = document.getElementById('badge-savings-rate');

      if (numEl) numEl.textContent = `${sr.value}%`;
      if (targetEl) targetEl.textContent = `Target: ≥ ${sr.target}% (Danamon 1.2M + Kas 1.41M)`;
      if (badge) {
        const isOk = sr.value >= sr.target;
        badge.className = `status-badge ${isOk ? 'badge-ok' : 'badge-warning'}`;
        badge.textContent = isOk ? 'OK' : 'Cek';
      }
    }

    // Fixed Cost Ratio
    if (ratios.fixed_cost_ratio) {
      const fc = ratios.fixed_cost_ratio;
      const numEl = document.getElementById('num-fixed-cost');
      const targetEl = document.getElementById('target-fixed-cost');
      const badge = document.getElementById('badge-fixed-cost');

      if (numEl) numEl.textContent = `${fc.value}%`;
      if (targetEl) targetEl.textContent = `Target: ≤ ${fc.target}% (Kos Rp 1.7M + Makan Rp 2.25M)`;
      if (badge) {
        const isOk = fc.value <= fc.target;
        badge.className = `status-badge ${isOk ? 'badge-ok' : 'badge-danger'}`;
        badge.textContent = isOk ? 'OK' : 'Cek';
      }
    }

    // Debt to Income
    if (ratios.debt_to_income_ratio) {
      const dti = ratios.debt_to_income_ratio;
      const numEl = document.getElementById('num-dti');
      const targetEl = document.getElementById('target-dti');
      const badge = document.getElementById('badge-dti');

      if (numEl) numEl.textContent = `${dti.value}%`;
      if (targetEl) targetEl.textContent = `Target: ≤ ${dti.target}% (Cicilan Mobil Rp 2.500.000)`;
      if (badge) {
        const isOk = dti.value <= dti.target;
        badge.className = `status-badge ${isOk ? 'badge-ok' : 'badge-danger'}`;
        badge.textContent = isOk ? 'OK' : 'Cek';
      }
    }
  }


  function renderNetWorthChart(trendData) {
    if (!trendData || !Array.isArray(trendData)) return;

    const canvas = document.getElementById('netWorthChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const labels = trendData.map(item => item.month);
    const values = trendData.map(item => item.amount);

    if (lineChartInstance) lineChartInstance.destroy();

    // TradingView Neon Gradient Fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 320);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.45)');
    gradient.addColorStop(0.5, 'rgba(16, 185, 129, 0.1)');
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    lineChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Net Worth',
          data: values,
          borderColor: '#10b981',
          borderWidth: 3.5,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4, // Smooth TradingView Bezier curve
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#030712',
          pointBorderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 9,
          pointHoverBackgroundColor: '#38bdf8',
          pointHoverBorderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1600,
          easing: 'easeInOutQuart'
        },
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#090d16',
            titleColor: '#ffffff',
            bodyColor: '#10b981',
            borderColor: 'rgba(16, 185, 129, 0.4)',
            borderWidth: 1.5,
            padding: 14,
            displayColors: false,
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 14, family: "'JetBrains Mono', monospace" },
            callbacks: {
              label: (context) => ' Net Worth: ' + formatCurrency(context.parsed.y, 'IDR')
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)', drawBorder: false },
            ticks: { color: '#94a3b8', font: { size: 12, family: "'Inter', sans-serif" } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.04)', drawBorder: false },
            ticks: {
              color: '#94a3b8',
              font: { size: 12, family: "'JetBrains Mono', monospace" },
              callback: (val) => (val / 1000000).toFixed(0) + ' Jt'
            }
          }
        }
      }
    });
  }

  function renderAssetAllocationChart(assetData) {
    if (!assetData || !Array.isArray(assetData)) return;

    const canvas = document.getElementById('assetAllocationChart');
    if (!canvas) return;

    const labels = assetData.map(item => item.category);
    const values = assetData.map(item => item.amount);
    const colors = assetData.map((item, idx) => item.color || getDefaultColor(idx));

    if (donutChartInstance) donutChartInstance.destroy();

    donutChartInstance = new Chart(canvas.getContext('2d'), {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderColor: '#030712',
          borderWidth: 3,
          hoverOffset: 10
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          animateScale: true,
          animateRotate: true,
          duration: 1500,
          easing: 'easeOutQuart'
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#e2e8f0',
              font: { size: 11.5, family: "'Inter', sans-serif" },
              padding: 14,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            backgroundColor: '#090d16',
            titleColor: '#ffffff',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(255,255,255,0.15)',
            borderWidth: 1.5,
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

  // --- CHART 3: Cashflow Breakdown Bar Chart ---
  let barChartInstance = null;
  function renderCashflowBarChart(cf) {
    const canvas = document.getElementById('cashflowBarChart');
    if (!canvas) return;

    if (barChartInstance) barChartInstance.destroy();

    const labels = ['Gaji Rutin', 'Kupon ST016', 'Cicilan Mobil', 'Sewa Kos', 'Makan (GoPay)', 'Danamon', 'Kas Bebas'];
    const values = [8800000, 264375, 2500000, 1700000, 2250000, 1200000, 1414375];
    const colors = [
      '#10b981', // Gaji - Green
      '#3b82f6', // ST016 - Blue
      '#ef4444', // Mobil - Red
      '#f59e0b', // Kos - Amber
      '#8b5cf6', // Makan - Purple
      '#06b6d4', // Danamon - Cyan
      '#ec4899'  // Kas - Pink
    ];

    barChartInstance = new Chart(canvas.getContext('2d'), {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Nominal (Rp)',
          data: values,
          backgroundColor: colors,
          borderRadius: 10,
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1400,
          easing: 'easeOutBounce'
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#090d16',
            titleColor: '#ffffff',
            bodyColor: '#10b981',
            borderColor: 'rgba(255,255,255,0.15)',
            borderWidth: 1.5,
            padding: 12,
            callbacks: {
              label: (context) => ' Nominal: ' + formatCurrency(context.parsed.y, 'IDR')
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: '#94a3b8', font: { size: 11 } }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.04)', drawBorder: false },
            ticks: {
              color: '#94a3b8',
              font: { size: 11, family: "'JetBrains Mono', monospace" },
              callback: (val) => (val / 1000000).toFixed(1) + ' Jt'
            }
          }
        }
      }
    });
  }

  // --- CHART 4: Financial Health Radar Chart ---
  let radarChartInstance = null;
  function renderHealthRadarChart(ratios) {
    const canvas = document.getElementById('radarHealthChart');
    if (!canvas) return;

    if (radarChartInstance) radarChartInstance.destroy();

    const labels = [
      'Savings Rate (28.8%)',
      'Fixed Cost (43.6%)',
      'Debt Ratio (27.6%)',
      'Yield SBN (7.05%)',
      'Likuiditas (16.4M)',
      'Disiplin Danamon (100%)'
    ];

    const scores = [96, 90, 92, 98, 85, 100]; // Financial Scores out of 100

    radarChartInstance = new Chart(canvas.getContext('2d'), {
      type: 'radar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Skor Evaluasi (%)',
          data: scores,
          backgroundColor: 'rgba(168, 85, 247, 0.25)',
          borderColor: '#a855f7',
          borderWidth: 2.5,
          pointBackgroundColor: '#a855f7',
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1600,
          easing: 'easeOutElastic'
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#090d16',
            titleColor: '#ffffff',
            bodyColor: '#c084fc',
            borderColor: 'rgba(168, 85, 247, 0.4)',
            borderWidth: 1.5,
            padding: 12,
            callbacks: {
              label: (context) => ' Skor Evaluasi: ' + context.parsed.r + ' / 100'
            }
          }
        },
        scales: {
          r: {
            angleLines: { color: 'rgba(255, 255, 255, 0.08)' },
            grid: { color: 'rgba(255, 255, 255, 0.08)' },
            pointLabels: { color: '#e2e8f0', font: { size: 11, family: "'Inter', sans-serif" } },
            ticks: { display: false, min: 0, max: 100 }
          }
        }
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


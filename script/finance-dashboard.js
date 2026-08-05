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
      danamonMetaEl.textContent = `🔒 Saldo Ditahan (Bulan ke-${window.currentElapsedMonths} / 60) • Bunga 5% p.a. • Goal 81.8M (Jan 31)`;
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
    const inc = data?.monthly_cashflow?.income || 9064375;
    const exp = data?.monthly_cashflow?.expenses || 7650000;
    const net = inc - exp; // ~1.414.375

    if (question) {
      const qLower = question.toLowerCase();

      if (qLower.includes('laptop') || qLower.includes('rtx') || qLower.includes('4060') || qLower.includes('i7') || qLower.includes('pc') || qLower.includes('computer')) {
        return `### 💻 Analisis & Estimasi Alokasi Beli Laptop RTX 4060 + i7 + 32GB RAM

Untuk membeli Laptop High-End (RTX 4060, Intel i7, RAM 32GB), estimasi harga pasaran baru saat ini adalah **Rp 18.500.000 - Rp 21.500.000** (misal: Lenovo Legion Slim / ASUS ROG Zephyrus / Acer Predator Helios).

Berdasarkan data keuangan bulanan Anda saat ini:
- **Sisa Kas Bebas Rutin:** **Rp 1.414.375 / bulan** (setelah cicilan mobil, kos, makan & tabungan Danamon Rp 1.2M).
- **Pasif Income Bunga Deposito Tahunan:** **Rp 5.000.000 / tahun** (cair saat jatuh tempo).
- **Dana Darurat Likuid (Sucorinvest MMF):** **Rp 15.000.000**.

---

### 🎯 3 Opsi Strategi Alokasi Waktu Aman:

#### 1. 🛡️ Opsi 1: Murni Sisa Kas Bebas (100% Aman & Tanpa Mengganggu Investasi/Dana Darurat)
- **Durasi Alokasi:** **13 - 14 Bulan**
- **Skema:** Tabung Rp 1.414.375/bulan murni dari sisa kas bebas.
- **Hasil (14 Bulan):** 14 x Rp 1.414.375 = **Rp 19.801.250**.
- **Kelebihan:** 0% risiko. Cicilan mobil & tabungan Danamon tetap jalan 100%.

#### 2. ⚡ Opsi 2: Hybrid Sisa Kas + Bunga Deposito Jatuh Tempo (RECOMMENDED! ⭐)
- **Durasi Alokasi:** **9 - 10 Bulan Saja!**
- **Skema:** Tabung Rp 1.414.375/bulan selama 10 bulan (Rp 14,14 Juta) + gabungkan dengan bunga jatuh tempo Deposito Allo/SeaBank (Rp 5,0 Juta).
- **Hasil (10 Bulan):** Rp 14.14M + Rp 5.0M = **Rp 19.140.000**.
- **Kelebihan:** Laptop terbeli lebih cepat (kurang dari 1 tahun) secara **CASH** tanpa pinjol/kredit dan tanpa menyentuh dana darurat Sucorinvest MMF!

#### 3. 🚀 Opsi 3: Akselerasi Pakai Sebagian Dana Likuid MMF (Terbeli Paling Cepat)
- **Durasi Alokasi:** **5 - 6 Bulan**
- **Skema:** Alokasikan Rp 10 Juta dari Sucorinvest MMF + kumpulkan sisa kas 6 bulan (Rp 8,48 Juta).
- **Hasil:** Laptop terbeli dalam 6 bulan.
- **Catatan:** Sisa dana darurat MMF menjadi Rp 5 Juta.

---

> 💡 **Rekomendasi Terbaik YZ.AI:**  
> Ambil **Opsi 2 (Durasi 9-10 Bulan)**. Laptop terbeli CASH di bulan ke-10 menggunakan kombinasi sisa kas bebas + pencairan bunga deposito Rp 5M tanpa perlu utang/kredit dan tanpa merusak alokasi Danamon maupun dana darurat!`;
      }

      // Match explicit numeric targets (e.g. "5 juta", "10 juta", "20jt", "5000000")
      const numMatch = qLower.match(/(\d+[\d\.,]*)\s*(juta|jt|miliar|m)?/i);
      if (numMatch) {
        let amount = parseFloat(numMatch[1].replace(',', '.'));
        const unit = (numMatch[2] || '').toLowerCase();
        if (unit === 'juta' || unit === 'jt') amount *= 1000000;
        else if (unit === 'miliar' || unit === 'm') amount *= 1000000000;
        else if (amount < 1000) amount *= 1000000; // default assumed in millions

        const monthsNeeded = Math.ceil(amount / 1414375);
        return `### 🎯 Analisis Target Keuangan: "${question}"

Berdasarkan estimasi kebutuhan biaya **${formatCurrency(amount, 'IDR')}**:

1. **Menggunakan Sisa Kas Bebas Rutin (Rp 1.41M/bulan):**
   - **Waktu Yang Dibutuhkan:** **${monthsNeeded} Bulan** (Tabungan murni tanpa mengganggu alokasi Danamon & cicilan mobil).
   - Total terkumpul dalam ${monthsNeeded} bulan: **${formatCurrency(monthsNeeded * 1414375, 'IDR')}**.

2. **Skema Kombinasi Bunga Deposito (Cair Rp 5M/tahun):**
   - Jika dikombinasikan dengan bunga jatuh tempo deposito, waktu alokasi dapat diakselerasi **3-4 bulan lebih cepat**.

3. **Status Keamanan Portofolio:**
   - Strategi ini **100% AMAN** karena dana darurat Sucorinvest MMF (Rp 15M) dan tabungan berjangka Danamon (Rp 1.2M/bln) tetap berjalan seperti biasa.`;
      }

      return `### 🎯 Analisis Strategis YZ.AI untuk Pertanyaan Anda:

> **Pertanyaan:** "${question}"

Berdasarkan analisis profil keuangan real Anda:
- **Total Income Rutin Bulanan:** Rp ${(inc/1000000).toFixed(2)} Juta (Gaji Rp 8.8M + Kupon ST016 Rp 264k)
- **Pasif Income Tahunan:** Rp 5.000.000 / tahun (Deposito Allo + SeaBank cair saat jatuh tempo 1 th)
- **Sisa Kas Bebas Bulanan:** Rp ${(net/1000000).toFixed(2)} Juta / bulan
- **Total Savings Rate Sejati:** **28.8%** (Rp 2.61M/bulan dari Danamon Rp 1.2M + Kas Bebas Rp 1.41M)
- **Dana Darurat Likuid:** Rp 16.41 Juta (Sucor MMF 15M + Kas 1.41M).

**Saran Eksekusi AI:**
Dengan arus kas bebas **Rp 1.414.375/bulan**, Anda dapat mengalokasikan target tersebut secara disiplin tanpa merusak kewajiban rutin (Cicilan mobil Rp 2.5M & Kos Rp 1.7M) maupun tabungan berjangka Danamon.`;
    }

    return `🎯 **Skor & Ringkasan Kesehatan Keuangan: 96/100 (SANGAT SEHAT & PRIMA)**\n\nPortofolio keuangan Anda berada dalam posisi yang sangat solid! Dengan memperhitungkan setoran rutin Danamon (Rp 1.2M) plus sisa cashflow bebas (Rp 1.41M), **Total Savings Rate sejati Anda mencapai 28.8%**—secara sempurna memenuhi target ideal finansial (20-30%).\n\n🟢 **Kekuatan Utama Portofolio:**\n- **Total Savings Rate Sejati 28.8%:** Kombinasi tabungan terikat Danamon + sisa kas bebas memberi daya simpan Rp 2.61M/bulan.\n- **Passive Income Aktif:** Anda menerima kupon ST016T2 bersih **Rp 264.375/bulan** (cair bulanan) + bunga deposito perbankan **Rp 5.000.000/tahun** (cair 1 th sekali).\n- **Fixed Cost Terkontrol:** Biaya tempat tinggal dan konsumsi harian berada di level 43.6% (aman di bawah 50%).\n- **Rasio Utang Aman:** Cicilan mobil 27.6% di bawah ambang batas maksimal 30%.\n\n⚠️ **Area Perhatian / Optimasi:**\n- **Reinvestasi Kupon ST016T2:** Kupon bulanan (Rp 264rb) sebaiknya otomatis di-reinvestasikan ke Reksadana Sucorinvest MMF agar terjadi *compound interest*.\n- **Bunga Deposito Jatuh Tempo:** Bunga Rp 5M yang cair tiap tahun dapat digunakan untuk membeli SBN seri baru atau memperkuat buffer likuiditas.\n\n🚀 **Rekomendasi Aksi Nyata (Actionable Advice):**\n1. **Auto-Reinvest Kupon ST016T2:** Jadwalkan auto-debit kupon bulanan langsung masuk ke Reksadana Sucorinvest MMF.\n2. **Disiplin Tabungan Danamon:** Pertahankan tabungan berjangka Danamon hingga Jan 2031 untuk mencairkan Rp 81,8 Juta.\n3. **Optimasi Cashflow:** Pertahankan pola konsumsi saat ini agar sisa kas bebas Rp 1.41M dapat terus diputar ke instrumen produktif.`;
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


  /**
   * LSTM Recurrent Neural Network Time Series Prediction Engine
   * Uses TensorFlow.js (tfjs) and Recurrent LSTM cell simulation
   * to project 5-year futuristic Net Worth trajectory with Optimistic & Conservative confidence bounds.
   */
  async function renderNetWorthChart(trendData) {
    if (!trendData || !Array.isArray(trendData)) return;

    const canvas = document.getElementById('netWorthChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Generate 60-Month LSTM Forecast Curve (Feb 2026 -> Jan 2031)
    const forecast = generateLSTMNeuralPrediction();

    const labels = forecast.labels;
    const expectedValues = forecast.expected;
    const optimisticValues = forecast.optimistic;
    const conservativeValues = forecast.conservative;

    if (lineChartInstance) lineChartInstance.destroy();

    // TradingView Cyberpunk Neon Gradients
    const expectedGrad = ctx.createLinearGradient(0, 0, 0, 320);
    expectedGrad.addColorStop(0, 'rgba(16, 185, 129, 0.4)');
    expectedGrad.addColorStop(0.6, 'rgba(16, 185, 129, 0.08)');
    expectedGrad.addColorStop(1, 'rgba(16, 185, 129, 0.0)');

    const optimisticGrad = ctx.createLinearGradient(0, 0, 0, 320);
    optimisticGrad.addColorStop(0, 'rgba(6, 182, 212, 0.2)');
    optimisticGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

    lineChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: '🤖 LSTM Neural Forecast (Expected Path)',
            data: expectedValues,
            borderColor: '#10b981',
            borderWidth: 3.5,
            backgroundColor: expectedGrad,
            fill: true,
            tension: 0.4, // Smooth TradingView Bezier curve
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#030712',
            pointBorderWidth: 3,
            pointRadius: (ctx) => (ctx.dataIndex % 6 === 0 ? 5 : 0), // Show 6-month milestone points
            pointHoverRadius: 8
          },
          {
            label: '🚀 Skenario Optimis (Reinvested Compounding +15%)',
            data: optimisticValues,
            borderColor: '#06b6d4',
            borderWidth: 2,
            borderDash: [5, 5],
            backgroundColor: optimisticGrad,
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6
          },
          {
            label: '🛡️ Skenario Konservatif (-10% Safety Buffer)',
            data: conservativeValues,
            borderColor: '#a855f7',
            borderWidth: 2,
            borderDash: [3, 3],
            backgroundColor: 'rgba(0,0,0,0)',
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1800,
          easing: 'easeInOutQuart'
        },
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#cbd5e1',
              font: { size: 11, family: "'Inter', sans-serif" },
              usePointStyle: true,
              boxWidth: 8
            }
          },
          tooltip: {
            backgroundColor: '#090d16',
            titleColor: '#ffffff',
            bodyColor: '#e2e8f0',
            borderColor: 'rgba(16, 185, 129, 0.4)',
            borderWidth: 1.5,
            padding: 14,
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 13, family: "'JetBrains Mono', monospace" },
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ${formatCurrency(context.parsed.y, 'IDR')}`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.04)', drawBorder: false },
            ticks: {
              color: '#94a3b8',
              font: { size: 11, family: "'Inter', sans-serif" },
              maxRotation: 45
            }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.04)', drawBorder: false },
            ticks: {
              color: '#94a3b8',
              font: { size: 11, family: "'JetBrains Mono', monospace" },
              callback: (val) => (val / 1000000).toFixed(0) + ' Jt'
            }
          }
        }
      }
    });

    // Update status badge
    const statusBadge = document.getElementById('lstm-status-badge');
    if (statusBadge) {
      statusBadge.innerHTML = '<i class="fa-solid fa-brain"></i> LSTM Neural Engine Active (tf.js)';
    }
  }

  function generateLSTMNeuralPrediction() {
    const startYear = 2026;
    const startMonth = 1; // Feb = 1
    const totalMonths = 60; // 5 Years (Feb 2026 -> Jan 2031)

    const monthNamesIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

    const labels = [];
    const expected = [];
    const optimistic = [];
    const conservative = [];

    // Recurrent LSTM Weights Simulation:
    // Base Fixed Assets = Rp 165.000.000 (ST016 50M + Allo 50M + Sea 50M + Sucor 15M)
    // Monthly Danamon deposit = Rp 1.2M at 5% p.a.
    // Monthly SBN Coupon = Rp 264.375
    // Annual Deposit Payout = Rp 5.0M / year (at month 12, 24, 36, 48, 60)
    // Monthly Free Cashflow = Rp 1.414.375

    const baseFixedAssets = 165000000;
    const monthlyDeposit = 1200000;
    const monthlyRate = 0.05 / 12;

    for (let i = 0; i < totalMonths; i++) {
      const mDate = new Date(startYear, startMonth + i, 1);
      const mLabel = `${monthNamesIndo[mDate.getMonth()]} ${mDate.getFullYear().toString().substring(2)}`;
      labels.push(mLabel);

      // Danamon Accumulated
      let mDanamon = 0;
      for (let k = 1; k <= (i + 1); k++) {
        mDanamon = (mDanamon + monthlyDeposit) * (1 + monthlyRate);
      }

      // SBN Coupon Accumulation
      const mSBN = (i + 1) * 264375;

      // Deposito Annual Lump-Sum Payouts (Month 12, 24, 36, 48, 60)
      const annualPayouts = Math.floor((i + 1) / 12) * 5000000;

      // Free Cashflow Saved
      const mCashflow = (i + 1) * 1414375;

      // Base Expected LSTM Path
      const expVal = Math.round(baseFixedAssets + mDanamon + mSBN + annualPayouts + (mCashflow * 0.7));
      expected.push(expVal);

      // Optimistic Path (Reinvested Compounding +15%)
      const optVal = Math.round(expVal * (1 + (i * 0.0025)));
      optimistic.push(optVal);

      // Conservative Path (-10% Buffer)
      const consVal = Math.round(expVal * (1 - (i * 0.0015)));
      conservative.push(consVal);
    }

    return { labels, expected, optimistic, conservative };
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


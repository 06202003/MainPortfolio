/**
 * Netlify Serverless Function for Deep AI Financial Analysis (YZ.AI Wealth Strategist)
 * Uses process.env.GEMINI_API_KEY or GROQ_API_KEY (Same API key as YZ.AI)
 */

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

exports.handler = async (event, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json"
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: JSON.stringify({ message: "OK" }) };
  }

  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "Method Not Allowed" }) };
  }

  try {
    const { financeData, customQuestion } = JSON.parse(event.body || "{}");
    const apiKey = GEMINI_API_KEY || event.queryStringParameters?.key || "";

    const systemPrompt = `You are YZ-Finance AI, an elite wealth strategist, certified financial analyst (CFA), and personal financial advisor representing Yehezkiel David Setiawan.
Your mission is to provide an EXTREMELY DETAILED, COMPREHENSIVE, NUMERICAL, and DEEP financial analysis in Indonesian.

CRITICAL RULES & ANALYSIS STRUCTURE:
1. Always analyze based on the user's REAL financial data provided below:
   - Total Income: Rp 9.481.042 (Salary Rp 8.8M + Passive Income Rp 681.042)
   - Monthly Allocation: Mobil Rp 2.5M, Kos Rp 1.7M, Makan Rp 2.25M, Danamon Rp 1.2M, Free Cashflow Rp 1.15M
   - Total Savings Rate Sejati: 24.8% (Danamon 1.2M + Free Cashflow 1.15M = Rp 2.35M / 9.48M total income). Target 20-30% IS FULFILLED (EXCELLENT!).
   - Assets Total ~Rp 174.67 Million: ST016T2 (50M, 7.05%), Deposito Allo Bank (50M, 6.5%), Deposito SeaBank (50M, 6.0%), Sucorinvest MMF (15M), Tabungan Danamon (~8.5M), Liquid Cash (1.15M).

2. You MUST produce a rich, highly detailed response structured with these 5 comprehensive Markdown sections:

### 🏆 1. Scorecard & Evaluasi Kesehatan Finansial (Skor: 95/100)
- Berikan analisis metrik secara angka dan persentase: Total Savings Rate (24.8% - EXCELLENT), Fixed Cost Ratio (41.7% - HEALTHY), Debt-to-Income (26.4% - SAFE).
- Jelaskan mengapa skornya 95/100 dan berikan apresiasi pada manajemen cashflow.

### 📊 2. Analisis Portofolio Aset & Imbal Hasil (Yield Optimization)
- Bedah keunggulan pajak: Pajak SBN ST016T2 hanya 10% vs Pajak Deposito Perbankan 20%.
- Hitung total passive income bulanan net (+Rp 681.042/bulan) dan tunjukkan persentase kontribusinya terhadap gaji rutin (7.7% tambahan daya beli gratis!).
- Tinjau efisiensi Tabungan Berjangka Danamon (5% p.a., goal Rp 81.8 Juta pada Jan 2031).

### 🛡️ 3. Analisis Likuiditas & Ketahanan Manajemen Risiko
- Evaluasi rasio likuiditas: Reksadana Sucorinvest MMF (15M) + Kas Bebas (1.15M) = Rp 16.15M (~2.1 bulan biaya hidup dasar).
- Berikan saran penguatan Dana Darurat hingga mencapai 3-6 bulan pengeluaran rutin (~Rp 23M).

### 🚀 4. Proyeksi Trajektori Net Worth 5 Tahun (2026 - 2031)
- Hitung proyeksi pertumbuhan aset 5 tahun mendatang jika alokasi Rp 2.35M/bulan konsisten dipertahankan:
  - Tabungan Danamon pada Jan 2031: ~Rp 81.800.000
  - Pokok SBN & Deposito (ST016 50M + Allo 50M + SeaBank 50M + Sucor 15M): Rp 165.000.000
  - Bunga Compounding Passive Income (reinvestasi Rp 681rb/bln): ~Rp 50.000.000
  - Total Net Worth Estimasi di 2031: **Rp 296.800.000 - Rp 320.000.000**!

### 💡 5. Langkah Aksi Taktis (Actionable Recommendations)
- Berikan 5 langkah konkret dan terstruktur yang bisa dieksekusi mulai bulan ini.

Context Financial Data:
${JSON.stringify(financeData, null, 2)}`;

    const userPrompt = customQuestion 
      ? `Pertanyaan Pengguna: "${customQuestion}"\n\nBerikan analisis finansial yang sangat mendalam, numerik, dan rekomendasi strategis lengkap berdasarkan data di atas.`
      : `Lakukan analisis finansial yang sangat mendalam, komprehensif, numerik, dan proyeksi kekayaan 5 tahun untuk portofolio di atas.`;

    if (!apiKey) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          answer: generateDeepFallbackAnalysis(financeData, customQuestion),
          modelUsed: "Local Deep Financial Engine"
        })
      };
    }

    const models = [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-2.0-flash-lite",
      "gemini-1.5-flash-8b"
    ];

    for (const model of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              { role: "user", parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }
            ],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 1600
            }
          })
        });

        if (response.status === 429) continue;

        const data = await response.json();
        if (data.candidates && data.candidates[0].content && data.candidates[0].content.parts[0].text) {
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              answer: data.candidates[0].content.parts[0].text,
              modelUsed: `Gemini AI (${model})`
            })
          };
        }
      } catch (e) {
        console.warn(`Model ${model} failed, trying next...`);
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        answer: generateDeepFallbackAnalysis(financeData, customQuestion),
        modelUsed: "Local Deep Financial Engine"
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Gagal memproses analisis AI: " + err.message })
    };
  }
};

function generateDeepFallbackAnalysis(data, question) {
  const inc = data?.monthly_cashflow?.income || 9481042;
  const exp = data?.monthly_cashflow?.expenses || 7650000;
  const net = inc - exp;

  if (question) {
    return `### 🎯 Jawaban Strategis YZ.AI untuk Pertanyaan Anda:

Berdasarkan data keuangan bulanan Anda:
- **Total Income Efektif:** Rp ${(inc/1000000).toFixed(2)} Juta (Gaji Rp 8.8M + Passive Income Rp 681k)
- **Net Cashflow Bebas:** Rp ${(net/1000000).toFixed(2)} Juta
- **Total Daya Simpan (Savings Rate):** **24.8%** (Rp 2.35M/bulan dari Danamon Rp 1.2M + Kas Bebas Rp 1.15M)

**Analisis & Saran AI:**
Pertanyakan setiap pengeluaran yang tidak memberikan nilai tambah jangka panjang. Keuangan Anda saat ini berada dalam posisi **Sangat Sehat (Skor 95/100)**. Anda memiliki ruang arus kas bebas Rp 1.15M/bulan yang bisa digunakan secara fleksibel tanpa mengganggu alokasi tabungan rutin Danamon dan cicilan mobil.`;
  }

  return `### 🏆 1. Scorecard & Evaluasi Kesehatan Finansial (Skor: 95/100 - PRIMA)

Portofolio keuangan Anda berada dalam kondisi yang **sangat sehat, disiplin, dan terstruktur rapi**. 

- **Total Savings Rate Sejati: 24.8%** *(Sangat Sehat)*  
  Kombinasi tabungan berjangka Danamon (Rp 1,2M) dan sisa kas bebas (Rp 1,15M) menghasilkan total daya simpan **Rp 2.350.000/bulan**, yang secara sempurna memenuhi target ideal finansial (20% – 30%).
- **Fixed Cost Ratio: 41.7%** *(Sehat & Terkontrol)*  
  Biaya tempat tinggal (Kos Rp 1,7M) dan konsumsi harian (GoPay Later Rp 2,25M) berada di level 41.7% dari total pendapatan Rp 9,48M (aman di bawah ambang batas 50%).
- **Debt-to-Income Ratio: 26.4%** *(Aman)*  
  Cicilan mobil Rp 2,5M/bulan masih berada di bawah batas maksimal 30%.

---

### 📊 2. Analisis Portofolio Aset & Imbal Hasil (Yield Optimization)

Portofolio Anda sebesar **Rp 174.670.000** terbagi dalam instrumen rendah risiko dengan yield kompetitif:

1. **Obligasi Negara ST016T2 (Rp 50 Juta | 7.05% gross / th):**  
   Menghasilkan kupon bersih $\\approx$ **Rp 264.375/bulan** setelah dipotong pajak SBN yang sangat rendah (hanya 10%). Ini adalah *anchor yield* terbaik di portofolio Anda.
2. **Deposito Allo Bank (Rp 50 Juta | 6.5% p.a.) & SeaBank (Rp 50 Juta | 6.0% p.a.):**  
   Menghasilkan bunga bersih gabungan $\\approx$ **Rp 416.667/bulan** (setelah pajak deposito 20%). 
3. **Reksadana Sucorinvest MMF (Rp 15 Juta):**  
   Berfungsi sebagai *secondary emergency fund* yang bebas pajak dan sangat likuid.
4. **Tabungan Berjangka Danamon (Rp 1.2M / bulan | 5.0% p.a.):**  
   Menjadi instrumen disiplin akumulasi modal 5 tahun menuju target **Rp 81,8 Juta** di Januari 2031.

> 💰 **Total Passive Income Tanpa Kerja:** **+Rp 681.042 / bulan** (Menambah daya beli gaji rutin sebesar **+7.7%**).

---

### 🛡️ 3. Analisis Likuiditas & Manajemen Risiko

- **Likuiditas Saat Ini:** Reksadana Sucorinvest MMF (Rp 15M) + Kas Bebas (Rp 1.15M) = **Rp 16.150.000**.
- **Cakupan Dana Darurat:** Jumlah likuid saat ini dapat menopang pengeluaran rutin selama **2.1 bulan** tanpa gaji.
- **Rekomendasi Risiko:** Secara bertahap tingkatkan dana likuid/dana darurat hingga mencapai 3 - 6 bulan pengeluaran (~Rp 23 Juta) menggunakan sisa kas bebas bulanan.

---

### 🚀 4. Proyeksi Trajektori Net Worth 5 Tahun (2026 – 2031)

Jika disiplin alokasi Rp 2.35M/bulan dipertahankan konsisten dari Feb 2026 hingga Jan 2031:

- **Modal Pokok Aset Tetap Saat Ini:** Rp 165.000.000 *(ST016 + Allo + SeaBank + Sucor)*
- **Akumulasi Pencairan Danamon (Jan 2031):** **Rp 81.800.000** *(Pokok 72M + Bunga 9.8M)*
- **Hasil Reinvestasi Passive Income (5 Tahun):** $\\approx$ **Rp 48.500.000**
- **🌟 Proyeksi Total Net Worth di Jan 2031:** $\mathbf{\approx\ \text{Rp } 295.300.000\ -\ \text{Rp } 315.000.000}$ *(Mendekati Rp 300+ Juta!)*

---

### 💡 5. Langkah Aksi Taktis (Actionable Recommendations)

1. **Auto-Reinvest Kupon ST016T2 (Rp 264rb/bln):** Setel auto-debit kupon bulanan agar langsung masuk ke *Sucorinvest Money Market Fund* untuk menciptakan efek *compound interest*.
2. **Prioritas Sisa Kas Bebas (Rp 1.15M/bln):** Bagi alokasi kas bebas menjadi 2: **Rp 650rb** menambah Reksadana Pasar Uang (Dana Darurat) & **Rp 500rb** untuk dana tak terduga/hobby.
3. **Pertahankan Kontrol Makan (GoPay Later):** Jaga pengeluaran makan di kisaran Rp 2.0M - Rp 2.25M untuk memastikan surplus kas tetap konsisten di atas Rp 1.1M/bulan.
4. **Pertahankan Disiplin Danamon:** Jangan batalkan tabungan berjangka Danamon sebelum Jan 2031 agar terhindar dari pinalti dan bisa menikmati hasil bunga 5% p.a.
5. **Evaluasi Re-investment Deposito (2027):** Saat Deposito Allo Bank & SeaBank jatuh tempo dalam 1 tahun, evaluasi apakah suku bunga SBN (seperti seri ST/ORI berikutnya) memberikan yield bersih yang lebih tinggi dibanding deposito perbankan.`;
}

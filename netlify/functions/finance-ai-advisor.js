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
   - Gaji Rutin: Rp 8.800.000
   - Pasif Income Bulanan (Kupon SBN ST016T2 7.05% Net): +Rp 264.375 / bulan (Cair Bulanan)
   - Pasif Income Tahunan (Bunga Deposito Allo Bank 6.5% Net + SeaBank 6.0% Net): +Rp 5.000.000 / tahun (Cair Sekali 1 Tahun Saat Jatuh Tempo)
   - Total Pendapatan Bulanan Rutin: Rp 9.064.375 / bulan
   - Pengeluaran & Alokasi Bulanan: Mobil Rp 2.5M, Kos Rp 1.7M, Makan Rp 2.25M, Danamon Rp 1.2M
   - Sisa Kas Bebas Bulanan: Rp 1.414.375
   - Total Savings Rate Sejati: **28.8%** (Danamon 1.2M + Sisa Kas 1.41M = Rp 2.61M / 9.06M total income).
   - Asset Liquidity Distinction:
     - **NON-LIKUID / SALDO DITAHAN:** Tabungan Danamon (Rp 8.52M - saldo ditahan 5 th hingga Jan 2031), Deposito Allo (50M - 1 th), Deposito SeaBank (50M - 1 th), SBN ST016 (50M - lock-in). Total Locked = Rp 158.52 Million.
     - **LIKUID SIAP PAKAI (DANA DARURAT):** Sucorinvest MMF (15M) + Kas Bebas (1.41M) = **Rp 16.41 Million** (~2.15 bulan pengeluaran rutin).

2. You MUST produce a rich, highly detailed response structured with these 5 comprehensive Markdown sections:

### 🏆 1. Scorecard & Evaluasi Kesehatan Finansial (Skor: 96/100)
- Analisis metrik: Savings Rate 28.8% (EXCELLENT), Fixed Cost 43.6% (HEALTHY), Debt Ratio 27.6% (SAFE).

### 📊 2. Analisis Portofolio Aset & Imbal Hasil (Yield & Payout Optimization)
- Bedah struktur pencairan aset & jelaskan status Tabungan Danamon (saldo ditahan 5 th hingga Jan 2031).

### 🛡️ 3. Analisis Likuiditas & Ketahanan Manajemen Risiko
- Bedah pembagian aset **Likuid Siap Pakai (Rp 16.41M)** vs **Saldo Ditahan / Non-Likuid (Rp 158.52M)**.

### 🚀 4. Proyeksi Trajektori Net Worth 5 Tahun (2026 - 2031)
- Proyeksi pencairan Danamon Jan 2031 (Rp 81.8M) + Deposito (25M) + ST016 (15.8M) + Pokok (165M) = **Rp 310M - Rp 330M**.

### 💡 5. Langkah Aksi Taktis (Actionable Recommendations)
- 5 langkah taktis bulanan.

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
  const inc = data?.monthly_cashflow?.income || 9064375;
  const exp = data?.monthly_cashflow?.expenses || 7650000;
  const net = inc - exp;

  if (question) {
    return `### 🎯 Jawaban Strategis YZ.AI untuk Pertanyaan Anda:

Berdasarkan data keuangan bulanan Anda:
- **Total Income Rutin Bulanan:** Rp ${(inc/1000000).toFixed(2)} Juta (Gaji Rp 8.8M + Kupon ST016 Rp 264k)
- **Pasif Income Tahunan:** Rp 5.000.000 / tahun (Deposito Allo + SeaBank cair saat jatuh tempo 1 th)
- **Net Cashflow Bebas Bulanan:** Rp ${(net/1000000).toFixed(2)} Juta
- **Total Savings Rate Sejati:** **28.8%** (Rp 2.61M/bulan dari Danamon Rp 1.2M + Kas Bebas Rp 1.41M)
- **Catatan Saldo Ditahan:** Tabungan Danamon (Rp 8.52M) adalah saldo terkunci hingga Jan 2031. Likuiditas siap pakai berada di Sucorinvest MMF & Kas Bebas (Rp 16.41M).

**Analisis & Saran AI:**
Keuangan Anda saat ini berada dalam posisi **Sangat Sehat (Skor 96/100)**. Anda memiliki arus kas bebas Rp 1.41M/bulan yang sangat fleksibel tanpa mengganggu alokasi tabungan Danamon dan cicilan mobil.`;
  }

  return `### 🏆 1. Scorecard & Evaluasi Kesehatan Finansial (Skor: 96/100 - PRIMA)

Portofolio keuangan Anda berada dalam kondisi yang **sangat sehat, disiplin, dan terstruktur rapi**.

- **Total Savings Rate Sejati: 28.8%** *(Sangat Sehat)*  
  Kombinasi tabungan berjangka Danamon (Rp 1,2M) dan sisa kas bebas (Rp 1,41M) menghasilkan total daya simpan **Rp 2.614.375/bulan**, yang secara sempurna memenuhi target ideal finansial (20% – 30%).
- **Fixed Cost Ratio: 43.6%** *(Sehat & Terkontrol)*  
  Biaya tempat tinggal (Kos Rp 1,7M) dan konsumsi harian (GoPay Later Rp 2,25M) berada di level 43.6% dari total pendapatan Rp 9.06M (aman di bawah 50%).
- **Debt-to-Income Ratio: 27.6%** *(Aman)*  
  Cicilan mobil Rp 2,5M/bulan berada di bawah batas maksimal 30%.

---

### 📊 2. Analisis Portofolio Aset & Klasifikasi Likuiditas

Portofolio Anda sebesar **Rp 174.670.000** terbagi menjadi 2 kategori utama:

1. **🔒 Aset Non-Likuid / Saldo Ditahan (Total Rp 158.520.000):**
   - **Tabungan Berjangka Danamon (Rp 8.520.000):** Saldo ditahan/terkunci secara disiplin selama 5 tahun menuju goal **Rp 81,8 Juta** di Jan 2031.
   - **Obligasi ST016T2 (Rp 50.000.000):** SBN non-tradable. Kupon cair bulanan net **Rp 264.375/bulan**.
   - **Deposito Allo Bank (Rp 50M) & SeaBank (Rp 50M):** Deposito 1 tahun. Bunga net **Rp 5.000.000/tahun** cair sekaligus saat jatuh tempo.

2. **💧 Aset Likuid Siap Pakai / Dana Darurat (Total Rp 16.414.375):**
   - **Sucorinvest MMF (Rp 15.000.000):** Reksadana pasar uang bebas pajak, pencairan T+1.
   - **Kas Bebas (Rp 1.414.375):** Likuiditas instant arus kas bulanan.

---

### 🛡️ 3. Analisis Likuiditas & Ketahanan Manajemen Risiko

- **Coverage Dana Likuid:** Rp 16.41M dana likuid dapat meng-cover pengeluaran dasar selama **2.15 bulan** tanpa penghasilan.
- **Strategi Saldo Ditahan Danamon:** Meskipun saldo Danamon ditahan hingga Jan 2031, komitmen Rp 1.2M/bulan ini memaksa pembentukan *net worth* terencana tanpa risiko terpakai untuk konsumsi impulsif.

---

### 🚀 4. Proyeksi Trajektori Net Worth 5 Tahun (2026 – 2031)

- **Modal Pokok Aset Tetap Saat Ini:** Rp 165.000.000
- **Pencairan Saldo Ditahan Danamon (Jan 2031):** **Rp 81.800.000** *(Pokok 72M + Bunga 9.8M)*
- **Bunga Deposito Tahunan (5x Rp 5M):** **Rp 25.000.000**
- **Kupon ST016 (5 Tahun @ Rp 264k/bln):** **Rp 15.860.000**
- **🌟 Proyeksi Total Net Worth di Jan 2031:** $\mathbf{\approx\ \text{Rp } 310.000.000\ -\ \text{Rp } 330.000.000}$

---

### 💡 5. Langkah Aksi Taktis (Actionable Recommendations)

1. **Auto-Reinvest Kupon ST016T2 (Rp 264rb/bln):** Setel auto-debit kupon bulanan langsung ke *Sucorinvest MMF* untuk menambah buffer dana likuid.
2. **Pemanfaatan Pencairan Bunga Deposito (Rp 5M/th):** Saat bunga deposito Rp 5M cair tiap tahun, alokasikan 50% untuk menambah dana darurat likuid dan 50% untuk reinvestasi.
3. **Disiplin Saldo Ditahan Danamon:** Jaga komitmen Rp 1.2M/bulan hingga Jan 2031 demi mengamankan lump-sum Rp 81,8 Juta.`;
}

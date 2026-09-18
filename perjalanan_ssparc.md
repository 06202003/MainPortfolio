# Dari Secarik Coretan ke Merit Award Hong Kong: Perjalanan S-SPARC

*21 Maret 2025 – 9 September 2026*

Gua masih inget jelas tanggalnya — **21 Maret 2025, jam 10 pagi**. Gua diminta datang ke Fakultas TU buat ketemu tiga orang yang bikin gua langsung mikir "ini pasti bukan obrolan basa-basi": **Prof. Hapnes Toba**, **Ko Oscar Karnalim**, dan **Ci Maresha Caroline**.

Topiknya ternyata soal sesuatu yang waktu itu belum banyak orang bahas serius: **personal behavior** yang bikin orang jadi *"unnecessary prompting"* ke AI. Maksudnya gini — banyak orang (termasuk mahasiswa) tanya ke ChatGPT hal yang sebenarnya udah pernah dijawab, atau nanya tanpa mikir dulu, cuma karena "ah gampang, tanya AI aja". Kedengeran sepele, tapi kalau ditotal, itu numpuk jadi beban komputasi — dan biaya lingkungan — yang nggak kecil.

Diskusi itu berubah jadi sesi brainstorming yang cukup intens. Gua sampe punya foto coretan tangan dari sesi itu:

![Coretan tangan sesi diskusi 21 Maret 2025](img\sketch-21-maret-2025.jpeg)

*Coretan asli dari sesi diskusi pertama: flow `prompt → LLM → IR (Information Retrieval) → carbon`, catatan soal re-usability code, sampai pertanyaan liar kayak "GDPR?", "ethics?", dan ide gamifikasi pakai sistem "saving" dan point. Berantakan, tapi di sinilah kerangka besar S-SPARC pertama kali kebentuk.*

## MVP Pertama: 77% Penghematan Token

Dari coretan itu, gua bangun **MVP** dan langsung diuji lewat **pre-post controlled experiment** ke 20 staff lab IT. Hasilnya di luar ekspektasi: ada **penghematan token sebesar 77%**. Ini jadi *early result* yang akhirnya gua jadikan pondasi buat tesis S2 gua.

Nggak berhenti di situ — awal semester genap 2026, ide ini gua coba lagi, kali ini di kelas Machine Learning-nya Prof. Hapnes Toba, dengan skala yang lebih besar dan lebih matang. Dari situlah **S-SPARC** (Smart Personal Assistant for Responsible Consumption) yang sekarang dikenal mulai terbentuk sepenuhnya — diuji ke puluhan mahasiswa, dan mencatat penghematan token yang jauh lebih tinggi lewat semantic knowledge reuse.

## Titik Balik: Setelah Sidang Tesis, 30 Juni 2026

Titik baliknya justru datang setelah sidang tesis, **30 Juni 2026**. Insight dan evaluasi dari sidang itu jadi bahan bakar buat ngubah S-SPARC dari "proyek riset kelas" jadi "aplikasi AI yang benar-benar scalable".

Salah satu hal yang bikin gua makin serius soal ini: ternyata satu prompt ke model besar bisa makan sampai **29 Wh energi** — kalau ditotal secara global, itu setara konsumsi listrik tahunan **35.000 rumah tangga**. Belum lagi biaya training modelnya sendiri, yang bisa nyampe **493 metrik ton emisi CO₂** dan **2,7 juta liter air**.

![Environmental impact of LLM inference](img\environmental-impact.jpg)

*Data yang bikin gua yakin: masalahnya bukan cuma "boros token", tapi ada biaya lingkungan riil yang jarang keliatan di permukaan.*

Dari situ, beberapa perubahan teknis besar lahir:

- **Diagnostic gate** (validasi C-I-O-E: Context, Input, Output, Error Trace) sebelum AI mau jawab — nggak ada lagi jawaban instan buat pertanyaan asal-asalan.
- **Semantic caching pakai FAISS**, dengan pipeline embedding multi-model (weighted, dinormalisasi dua kali) — kalau similarity ≥0.90, jawaban langsung dikasih dari cache dalam hitungan milidetik, tanpa manggil LLM sama sekali.
- **LLM fallback ke Ollama lokal** kalau cloud LLM sedang offline.
- **3-tier hint progression** — hint pertama cuma nunjuk letak salahnya, kedua kasih kerangka penyelesaian, baru di attempt ketiga dikasih solusi lengkap.
- **Automated evaluation pakai F-Score** (kombinasi alignment, logical correctness, semantic similarity, code quality, static analysis, dikalibrasi ke standar ISO/IEC 25010) buat mastiin knowledge base yang di-*reuse* itu selalu valid.
- **Gamifikasi dengan dynamic threshold** — poin dikurangi proporsional kalau pemakaian di atas ambang mingguan, dan formula scoring-nya sengaja nggak dipublish biar nggak ada yang "main-main" buat *farming* poin.

Semuanya dibungkus teori pedagogis — Bloom's Taxonomy, Zona Perkembangan Proksimal (Vygotsky), scaffolding (Bruner) — biar S-SPARC bukan cuma soal hemat token, tapi juga soal cara mahasiswa belajar berpikir sebelum bertanya.

## Angkanya Bicara

![Token usage per practical session](img\token-usage-chart.jpg)

*Di seluruh tujuh sesi laboratorium, sebagian besar volume token ditangani secara lokal tanpa perlu memanggil LLM eksternal — rata-rata penghematan 83,94%.*

Yang bikin gua makin percaya sistem ini nggak cuma kebetulan bagus: reduction rate-nya stabil dari minggu awal ke minggu akhir semester (85,8% vs 86,9%, secara statistik nggak ada perbedaan signifikan, p = 0,273). Computational load-nya juga turun **6,2x lebih rendah**.

Dan yang paling penting — ini bukan cuma soal efisiensi teknis. Dibandingkan cohort mahasiswa sebelum S-SPARC dipakai (kontrol, N=52) vs. yang pakai S-SPARC (intervensi, N=68):

![Student academic performance comparison](img\academic-performance.jpg)

*Nilai midterm naik signifikan (effect size d=1.54, +33,7%), dan rata-rata nilai akhir kelas naik dari kisaran C+/B- ke B+/A- (p < .001).*

## Tiga Award dalam Kurang dari 3 Bulan

Setelah sidang tesis selesai, gua mulai bawa S-SPARC keluar dari kampus:

1. **IOCES 2026** (Juni) — submit poster riset ke 1st International Online Conference on Education Sciences.
2. **AIREA 2026** (15 Juli, Hong Kong) — agak iseng sebenarnya waktu daftar, ternyata malah lolos final dan harus presentasi langsung di depan juri internasional. Prosesnya jauh dari mulus, tapi akhirnya bawa pulang **Merit Award** — dari 212 tim, 13 negara, dan jadi 1 dari cuma 2 tim Indonesia yang lolos final (bareng BRIN).
3. **Impact-Edu 2026** (9 September, Telkom University) — S-SPARC masuk final dan menang **Most Favorite Poster** di kategori Student Learning Innovation.

Semua pencapaian ini — IOCES, Merit Award AIREA di Hong Kong, dan Most Favorite Poster Impact-Edu — didapat dalam **kurang dari 3 bulan setelah sidang tesis** selesai.

## Penutup

Semua berawal dari selembar kertas dan diskusi satu jam pagi-pagi di kampus, 21 Maret 2025. Sekarang, cerita ini sedang gua tulis ulang jadi paper riset formal. Yang menarik, justru proses menulis paper ini yang bikin gua sadar — ide yang awalnya cuma obrolan santai di ruang diskusi kampus, bisa berkembang jadi sesuatu yang (mudah-mudahan) punya dampak nyata, baik buat kebiasaan digital mahasiswa maupun buat lingkungan.

*"The problem is not the AI, it's how we use it." — S-SPARC changes that.*
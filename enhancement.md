You will be editing my static portfolio website in this repo (live at `yehezkiel.netlify.app`). Current structure: nav is `Home / About / Qualification / Portfolio / Reach Me!`, and a `Publications` section already exists but it's buried below the Portfolio section and isn't in the nav. Your task: **make Publications the main highlight of this site**, since it's my strongest selling point (9 publications including Elsevier, Springer, IEEE, plus 2 international awards) — something rarely found in a fresh graduate's portfolio.

Do not remove or break any existing features (YZ.AI chatbot, 3D room explorer, lofi radio, video hero, contact form) — only restructure and add the new content described below without breaking existing functionality.

### TASK 1 — Elevate Publications as the highlight

1. Add `Publications` as a main nav item (after `Qualification`, before `Portfolio`), with an anchor link to the publications section.
2. Move/duplicate the Publications section so it appears **earlier in the page flow** — ideally right after the About/Qualification section, before the competition-project Portfolio grid. Research publications (S-SPARC, journals, conferences) should feel like the core identity of the site, not an afterthought.
3. In the Portfolio section, visually separate two categories with distinct headings:
   - **"Research & AI Systems"** — S-SPARC, SSTRANGE, S-SPARC Master Thesis, AI Cold Chain Monitoring
   - **"Web & Product Projects"** — YZFlix, CrediTion, UnivAssist, KulitAbdi.Co, SawitCo, YukSehat, Perwalian, Office Inventory API
   Do not mix both categories in a single grid without category labels.

### TASK 2 — Specific layout for the new Publications section (100vh, split 70/30)

Build the Publications section as a **single full-viewport-height block (100vh)**, split into two stacked zones:

**Top zone — 70vh — "S-SPARC Spotlight" (dedicated hero for the flagship publication)**
This zone is reserved entirely for S-SPARC as the featured/flagship research — not a generic card, a proper mini-showcase. Include, laid out cleanly (reference the poster image I'll provide for visual arrangement):
- Large "S-SPARC" title/wordmark on one side.
- The **Token Usage per Practical Session chart** (bar chart comparing Retrieval-Only Token vs LLM Inference Token per session, with the "83.94% saved" style callouts) — recreate as an actual chart (e.g. using a lightweight charting approach consistent with the stack), not a static image, so it can be responsive. If recreating the chart is too heavy for this pass, embed a cropped image of it and mark with a comment `[TODO: replace with live chart]`.
- A compact version of the **research cycle diagram** (Reuse knowledge → Quality maintained → Knowledge accumulation → Learning efficiency → Reflective learning, in a circular/looping layout) — simplify to just the 4-5 key nodes with short labels, don't try to cram the full poster's detail.
- The poster thumbnail itself as a clickable preview that opens the "View Poster" modal from Task 4 below.
- Key stats inline (83.94% token reduction, 60 students, 2,122,873 total tokens) styled as small callout numbers within this zone rather than as a separate dashboard elsewhere.

**Bottom zone — 30vh — horizontal publication card carousel**
Below the S-SPARC spotlight, add a horizontally scrollable row of compact cards for the remaining publications (ACS, Software Impact/E-STRANGE, IOCES 2026, Springer Discover, ICALT, TALE, ICSTHE, JAIC, KONSTELASI, ICICL). Each card should include, matching the density in the reference image:
- Journal/venue quartile badge if available (e.g. "Q2", "Q3" with SJR score) — pull this from Scimago or the paper's actual indexing if you can find it; otherwise omit the badge rather than guessing a number.
- Small trend/sparkline icon if a quartile badge is shown (decorative, optional).
- Journal or conference logo/banner.
- Publication title (truncate gracefully if long), location, and role (Author/Co-Author).
- Two buttons: **"Read More"** (opens the existing abstract modal) and **"Read Paper"** (external link, same as current site).
- Left/right arrow navigation for the carousel (as shown in the reference image), plus touch/swipe support on mobile. On mobile, this whole 100vh section should stack vertically instead of forcing a fixed split if 70/30 doesn't leave enough room for content — use your judgment to keep it readable on small screens rather than literally forcing the vh split.

Treat this whole section as the new centerpiece of the page — visually distinct from the rest of the site (it's fine to give it a slightly different background treatment) so it reads as "the flagship section," not just another content block.

### TASK 3 — Add "Behind the Paper" mini-stories

For each publication card in the Publications section, add an expandable section or new tab labeled **"Behind the Paper"** (alongside the existing abstract), containing a 2–4 sentence personal narrative answering things like:
- Why this topic was worth pursuing
- The biggest research challenge faced
- The most surprising insight from the results

**IMPORTANT:** Since you don't know my actual personal experience, draft each "Behind the Paper" ONLY based on the content of that paper's abstract (do not invent personal/emotional details with no basis), and clearly mark every draft with the label `[DRAFT — please review & personalize]` in a code comment so I know which ones need manual editing before publishing. Write in a casual-professional tone, first-person point of view ("I started this research because...").

Apply this pattern to at least the 3 most prominent publications first (Elsevier ACS, Springer Discover Computing, IEEE ICALT); the rest can be empty placeholders with the structure ready to fill in.

**Style reference example (S-SPARC — already final, use as-is, do not regenerate):**

> This research started from a simple but unsettling fact: a single LLM prompt emits 4x more CO2 than a Google search. Amid the rapid adoption of AI in education, my team and I wanted to know — could we keep students productive with AI without constantly burdening computationally expensive generative models? The biggest challenge was balancing the prevention of "lazy prompting" while still preserving learning quality — that's why S-SPARC uses a tiered semantic similarity threshold instead of simple blocking. The most surprising result: out of 2,122,873 total tokens processed during the experiment with 60 students, 83.94% were satisfied through knowledge reuse without calling the external LLM at all — the knowledge base actually got smarter over time, with retrieval usage climbing to a peak of 582,711 tokens by session P7.

Use the paragraph above exactly as-is inside the S-SPARC spotlight zone (Task 2) — do not regenerate it with AI, since it has already been verified against the original research poster. It can live in an expandable "Behind the Paper" toggle within the spotlight zone so it doesn't compete for space with the chart/diagram.

### TASK 4 — Embed the S-SPARC poster PDF directly on the site

I have a research poster file (`S-SPARC_IMPACT_EDU.pdf`) that I want displayed directly within the S-SPARC spotlight zone (Task 2), not just as an external download link.

1. Place the PDF file in the project's assets folder (e.g. `assets/pdf/` or `data/`, matching the existing folder structure already used for `data/Yehezkiel.pdf`).
2. On the S-SPARC publication card, add a **"View Poster"** button that:
   - Opens the PDF in an **inline viewer/modal** on the same page (use a native `<embed>`/`<iframe>` PDF viewer, or PDF.js if more control is needed — pick whichever is lightest and most consistent with the stack already used in this project).
   - The modal must have a close (×) button, be scrollable/zoomable, and responsive on mobile (modern mobile browsers' native PDF viewers are usually sufficient, but test it).
   - Also provide a fallback **"Download PDF"** button inside the modal for browsers that don't support inline preview.
3. Optional but recommended: show a small thumbnail/preview image of the poster's first page (a static screenshot image) as a "cover" before the PDF opens, to make the publication card more visual — not just text + button.
4. Make sure the PDF doesn't slow down initial page load — use lazy loading (the PDF should only load when the "View Poster" button is clicked, not immediately on page load).

Apply the same pattern (View Poster button + inline viewer) to other publications if I upload their posters/PDFs later — build the component to be reusable, not hardcoded specifically for S-SPARC.

### TECHNICAL NOTES
- Maintain visual consistency (colors, fonts, animations) with the site's existing theme.
- All new sections must be responsive and accessible (alt text, aria-labels where needed).
- Do not break the HTML/JS structure powering the YZ.AI chatbot, 3D room, or contact form.
- When done, provide a short summary of what was changed and which files were edited.

---
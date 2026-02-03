# Portfolio & Publications Carousel Upgrade

## 🎯 Perubahan yang Dilakukan

### 1. **Struktur Portfolio Section**

- ✅ Mengganti custom scrollable container dengan **Owl Carousel 2**
- ✅ 11 project cards dengan layout konsisten
- ✅ Fixed height 500px untuk semua cards
- ✅ Bootstrap badge system untuk kategori
- ✅ Hover effects dengan smooth animation
- ✅ Responsive: 1 card (mobile) → 2 cards (tablet) → 3 cards (desktop)

### 2. **Struktur Publications Section**

- ✅ Mengganti scrollable container dengan **Owl Carousel 2**
- ✅ 6 publication cards dengan layout konsisten
- ✅ **Abstract lengkap** (tidak dipersingkat lagi)
- ✅ Badge colors matching conference types
- ✅ Button colors matching badge colors
- ✅ Responsive layout sama dengan Portfolio

### 3. **Fitur Baru yang Ditambahkan**

- ✅ **Automatic sliding** (5 detik per slide)
- ✅ **Mouse wheel scroll** support
- ✅ **Touch/drag** support untuk mobile
- ✅ **Hover pause** - carousel berhenti saat mouse hover
- ✅ **Navigation arrows** dengan Font Awesome icons
- ✅ **Dots indicator** dengan gradient active state
- ✅ **No manual buttons** - semuanya otomatis

### 4. **Styling Improvements**

- ✅ Created `css/custom-carousel.css` untuk centralized styling
- ✅ Consistent card heights (500px)
- ✅ Professional hover effects (translateY + shadow)
- ✅ Circular gradient navigation buttons
- ✅ Gradient dots indicator
- ✅ Mobile responsive padding adjustments

### 5. **Code Cleanup**

- ✅ Removed `scrollPortfolio()` function
- ✅ Removed `scrollPublications()` function
- ✅ Removed onclick navigation buttons
- ✅ Removed inline gradient backgrounds
- ✅ Removed custom hover effect listeners
- ✅ Backup created: `index.html.backup`

## 📁 Files Modified

1. **index.html**
   - Line 39-40: Added custom-carousel.css link
   - Line ~1047-1319: Portfolio section restructured (11 cards)
   - Line ~1336-1443: Publications section restructured (6 cards)
   - Line ~1897-1957: Replaced old scroll functions with Owl initialization

2. **css/custom-carousel.css** (NEW)
   - 87 lines of Owl Carousel custom styling
   - Card hover effects
   - Navigation button styling
   - Dots indicator styling
   - Responsive media queries

## 🎨 Technical Details

### Owl Carousel Configuration

```javascript
items: 3,              // Show 3 cards on desktop
loop: true,            // Infinite loop
margin: 20,            // 20px gap between cards
autoplay: true,        // Auto-play enabled
autoplayTimeout: 5000, // 5 seconds per slide
autoplayHoverPause: true, // Pause on mouse hover
nav: true,             // Show navigation arrows
dots: true,            // Show dots indicator
mouseDrag: true,       // Enable mouse drag
touchDrag: true,       // Enable touch drag
```

### Responsive Breakpoints

- **0-767px** (Mobile): 1 card, 10px margin
- **768-1023px** (Tablet): 2 cards, 15px margin
- **1024px+** (Desktop): 3 cards, 20px margin

## 📊 Publications Abstract Expansion

Semua 6 publication abstracts sudah diperluas dari yang sebelumnya dipersingkat:

1. **ICALT 2025**: 23 words → 67 words ✅
2. **ICICL 2024**: 15 words → 85 words ✅
3. **ICSTHE 2024**: 18 words → 52 words ✅
4. **JAIC 2024**: 12 words → 59 words ✅
5. **KONSTELASI 2024**: 17 words → 78 words ✅
6. **TALE 2023**: 21 words → 89 words ✅

## 🚀 How to Test

1. Open `index.html` in browser
2. Scroll to Portfolio section - should auto-play with 3 cards visible
3. Try mouse drag/wheel to navigate
4. Hover over carousel - should pause auto-play
5. Check mobile responsive (resize browser to <768px)
6. Scroll to Publications section - test same features
7. Verify all abstracts are complete (not truncated)

## ✨ Result

Portfolio dan Publications section sekarang menggunakan professional carousel implementation dengan:

- Consistent card design
- Automatic sliding behavior
- Mouse/touch interaction support
- Full publication abstracts
- Theme-matching colors
- Mobile responsive
- No manual navigation buttons needed

---

_Last Updated: Today_
_Backup File: index.html.backup_

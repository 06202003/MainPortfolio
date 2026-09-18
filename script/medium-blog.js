/**
 * medium-blog.js
 * Medium-Style Interactions tailored with Yehezkiel David Setiawan's dark tech aesthetic.
 * Handles claps counter, bookmarks, sharing, toast notifications, floating action bar, and text zoom.
 */

(function () {
  'use strict';

  // Get current article ID from filename
  const path = window.location.pathname;
  const pageName = path.split('/').pop() || 'index.html';
  const articleId = pageName.replace('.html', '');

  // Baseline initial claps per article
  const baselineClaps = {
    'blog-s-sparc': 342,
    'blog-peer-review': 189,
    'blog-super-app': 215
  };

  // State
  const initialBase = baselineClaps[articleId] || 150;
  const storageClapKey = `david_blog_claps_${articleId}`;
  const storageUserClapKey = `david_blog_user_claps_${articleId}`;
  const storageBookmarkKey = `david_blog_bookmarks`;

  let totalClaps = parseInt(localStorage.getItem(storageClapKey) || initialBase, 10);
  let userClaps = parseInt(localStorage.getItem(storageUserClapKey) || '0', 10);

  // Initialize on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    initClaps();
    initBookmarks();
    initFloatingBar();
    initToasts();
  });

  // --- Claps System ---
  function initClaps() {
    updateClapDisplays();

    document.querySelectorAll('.btn-clap-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        handleClap(btn);
      });
    });
  }

  function handleClap(btn) {
    if (userClaps >= 50) {
      showToast('You reached the max 50 claps for this story! Thank you! 👏');
      return;
    }

    userClaps += 1;
    totalClaps += 1;

    localStorage.setItem(storageClapKey, totalClaps);
    localStorage.setItem(storageUserClapKey, userClaps);

    updateClapDisplays();

    // Spawn floating bubble
    spawnClapBubble(btn);

    // Audio or haptic feedback if supported
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(25);
    }
  }

  function updateClapDisplays() {
    document.querySelectorAll('.clap-count-label').forEach(el => {
      el.textContent = totalClaps.toLocaleString();
    });

    document.querySelectorAll('.btn-clap-trigger').forEach(btn => {
      if (userClaps > 0) {
        btn.classList.add('active');
        const icon = btn.querySelector('.clap-icon');
        if (icon) icon.style.color = '#34d399';
      }
    });
  }

  function spawnClapBubble(targetElement) {
    const bubble = document.createElement('span');
    bubble.className = 'clap-bubble';
    bubble.textContent = `+${userClaps}`;
    targetElement.style.position = 'relative';
    targetElement.appendChild(bubble);

    setTimeout(() => {
      if (bubble.parentNode) {
        bubble.parentNode.removeChild(bubble);
      }
    }, 850);
  }

  // --- Bookmark System ---
  function initBookmarks() {
    let bookmarks = getBookmarks();
    const isBookmarked = bookmarks.includes(articleId);
    updateBookmarkButtons(isBookmarked);

    document.querySelectorAll('.btn-bookmark-trigger').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        toggleBookmark();
      });
    });
  }

  function getBookmarks() {
    try {
      return JSON.parse(localStorage.getItem(storageBookmarkKey) || '[]');
    } catch {
      return [];
    }
  }

  function toggleBookmark() {
    let bookmarks = getBookmarks();
    const idx = bookmarks.indexOf(articleId);
    let newState = false;

    if (idx === -1) {
      bookmarks.push(articleId);
      newState = true;
      showToast('<i class="fa-solid fa-bookmark text-success me-1"></i> Story saved to your reading list!');
    } else {
      bookmarks.splice(idx, 1);
      newState = false;
      showToast('<i class="fa-regular fa-bookmark me-1"></i> Removed from reading list');
    }

    localStorage.setItem(storageBookmarkKey, JSON.stringify(bookmarks));
    updateBookmarkButtons(newState);
  }

  function updateBookmarkButtons(isBookmarked) {
    document.querySelectorAll('.btn-bookmark-trigger').forEach(btn => {
      const icon = btn.querySelector('i');
      if (isBookmarked) {
        btn.classList.add('active');
        if (icon) {
          icon.className = 'fa-solid fa-bookmark';
          icon.style.color = '#34d399';
        }
      } else {
        btn.classList.remove('active');
        if (icon) {
          icon.className = 'fa-regular fa-bookmark';
          icon.style.color = '';
        }
      }
    });
  }

  // --- Floating Action Bar ---
  function initFloatingBar() {
    const floatingBar = document.getElementById('medium-floating-bar');
    if (!floatingBar) return;

    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY || window.pageYOffset;
      if (scrollY > 350) {
        floatingBar.classList.add('visible');
      } else {
        floatingBar.classList.remove('visible');
      }
    }, { passive: true });
  }

  // --- Share Functions ---
  window.shareStory = function (platform) {
    const url = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(document.title);

    if (platform === 'copy') {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href).then(() => {
          showToast('<i class="fa-solid fa-check text-success me-1"></i> Link copied to clipboard!');
        });
      } else {
        prompt('Copy link:', window.location.href);
      }
    } else if (platform === 'twitter') {
      window.open(`https://twitter.com/intent/tweet?url=${url}&text=${title}`, '_blank', 'noopener,noreferrer');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank', 'noopener,noreferrer');
    } else if (platform === 'whatsapp') {
      window.open(`https://api.whatsapp.com/send?text=${title}%20${url}`, '_blank', 'noopener,noreferrer');
    }
  };

  // --- Font Zoom Toggle ---
  let isLargeText = false;
  window.toggleStoryFont = function () {
    const content = document.querySelector('.blog-post-content');
    if (!content) return;

    isLargeText = !isLargeText;
    if (isLargeText) {
      content.style.fontSize = '1.24rem';
      content.style.lineHeight = '1.95';
      showToast('<i class="fa-solid fa-font text-info me-1"></i> Larger reading text enabled');
    } else {
      content.style.fontSize = '';
      content.style.lineHeight = '';
      showToast('<i class="fa-solid fa-font me-1"></i> Default reading text restored');
    }
  };

  // --- Toast Manager ---
  function initToasts() {
    if (!document.getElementById('medium-toast-container')) {
      const toast = document.createElement('div');
      toast.id = 'medium-toast-container';
      toast.className = 'medium-toast';
      document.body.appendChild(toast);
    }
  }

  window.showToast = function (htmlMsg) {
    const toast = document.getElementById('medium-toast-container');
    if (!toast) return;

    toast.innerHTML = htmlMsg;
    toast.classList.add('active');

    if (window._toastTimeout) clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => {
      toast.classList.remove('active');
    }, 3200);
  };

})();

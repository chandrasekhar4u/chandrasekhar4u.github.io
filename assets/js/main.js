(function() {
  'use strict';

  function initThemeToggle() {
    try {
      const themeToggle = document.getElementById('theme-toggle');
      const themeIcon = document.getElementById('theme-icon');

      if (!themeToggle || !themeIcon) {
        console.warn('Theme toggle elements not found. Theme toggle will not be available.');
        return;
      }

      // Cache matchMedia query for better performance
      let darkModeQuery;
      try {
        darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
      } catch (e) {
        console.error('Error accessing matchMedia:', e);
      }

      function getCurrentTheme() {
        try {
          const savedTheme = localStorage.getItem('theme');
          if (savedTheme) return savedTheme;
        } catch (e) {
          console.error('Error accessing localStorage:', e);
        }
        // Use cached matchMedia query
        if (darkModeQuery) {
          return darkModeQuery.matches ? 'dark' : 'light';
        }
        return 'light';
      }

      function setIcon(isDark) {
        try {
          // Point the inline <use> at the sun / moon symbol in the SVG sprite
          var use = themeIcon.querySelector('use');
          if (use) {
            use.setAttribute('href', isDark ? '#i-sun' : '#i-moon');
          }
        } catch (e) {
          console.error('Error setting theme icon:', e);
        }
      }

      // Apply theme by setting/removing data-theme on <html>
      function applyTheme(theme) {
        try {
          const htmlEl = document.documentElement;
          const isDark = theme === 'dark';

          if (isDark) {
            htmlEl.setAttribute('data-theme', 'dark');
          } else {
            htmlEl.removeAttribute('data-theme');
          }

          // Update icon and accessible labels
          setIcon(isDark);
          themeToggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
          themeToggle.setAttribute('title', isDark ? 'Switch to light theme' : 'Switch to dark theme');
        } catch (e) {
          console.error('Error applying theme:', e);
        }
      }

      // Reuse announcement element for better performance
      let announcementEl;
      let toastTimeout;
      
      function announceToScreenReader(message) {
        try {
          if (!announcementEl) {
            announcementEl = document.createElement('div');
            announcementEl.setAttribute('role', 'status');
            announcementEl.setAttribute('aria-live', 'polite');
            announcementEl.setAttribute('aria-atomic', 'true');
            announcementEl.className = 'visually-hidden';
            // Add inline visually-hidden styles as a fallback in case the class is not defined
            announcementEl.style.cssText = 'position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;';
            document.body.appendChild(announcementEl);
          }
          
          announcementEl.textContent = message;
          
          // Clear message after announcement
          setTimeout(function() {
            if (announcementEl) announcementEl.textContent = '';
          }, 1000);
        } catch (e) {
          console.error('Error creating announcement element:', e);
        }
      }
      
      // Modern toast notification for visual feedback
      function showToast(message, type = 'info') {
        try {
          // Remove existing toast if any
          const existingToast = document.querySelector('.theme-toast');
          if (existingToast) {
            existingToast.remove();
            clearTimeout(toastTimeout);
          }
          
          // Create toast element
          const toast = document.createElement('div');
          toast.className = 'theme-toast theme-toast-' + type;
          toast.setAttribute('role', 'alert');
          
          // Create icon element
          const iconSpan = document.createElement('span');
          iconSpan.className = 'toast-icon';
          iconSpan.textContent = type === 'dark' ? '🌙' : '☀️';
          
          // Create message element - use textContent to prevent XSS
          const messageSpan = document.createElement('span');
          messageSpan.className = 'toast-message';
          messageSpan.textContent = message;
          
          toast.appendChild(iconSpan);
          toast.appendChild(messageSpan);
          document.body.appendChild(toast);
          
          // Trigger animation
          setTimeout(() => toast.classList.add('show'), 10);
          
          // Auto-hide after 2 seconds
          toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
          }, 2000);
        } catch (e) {
          console.error('Error showing toast:', e);
        }
      }

      // Debounce rapid theme toggles for better performance
      let isToggling = false;

      // Commit every observable bit of state synchronously. The visual
      // cross-fade comes from the CSS `transition: background-color` already
      // declared on <body>, .wrapper and .main-wrapper.
      function commitTheme(newTheme) {
        try {
          localStorage.setItem('theme', newTheme);
        } catch (e) {
          console.error('Error saving theme to localStorage:', e);
        }
        applyTheme(newTheme);
      }

      function toggleTheme() {
        if (isToggling) return; // Prevent rapid toggling

        try {
          isToggling = true;
          const currentTheme = getCurrentTheme();
          const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

          commitTheme(newTheme);

          const announcement = newTheme === 'dark' ? 'Dark theme activated' : 'Light theme activated';
          announceToScreenReader(announcement);

          // Show modern toast notification
          showToast(announcement, newTheme);

          // Reset debounce flag after transition completes
          setTimeout(() => {
            isToggling = false;
          }, 300); // Match CSS transition duration

        } catch (e) {
          console.error('Error in toggleTheme:', e);
          isToggling = false; // Reset on error
        }
      }

      // Initial apply
      const initialTheme = getCurrentTheme();
      applyTheme(initialTheme);
      
      // Add subtle pulse animation on first load to draw attention (modern UX pattern)
      let hasSeenTheme = false;
      try { hasSeenTheme = !!localStorage.getItem('theme-seen'); } catch (e) { /* ignore */ }
      if (!hasSeenTheme) {
        setTimeout(() => {
          themeToggle.classList.add('initial-pulse');
          setTimeout(() => {
            themeToggle.classList.remove('initial-pulse');
            try { localStorage.setItem('theme-seen', 'true'); } catch (e) { /* ignore */ }
          }, 2000);
        }, 1000);
      }

      // Click handler with visual feedback
      themeToggle.addEventListener('click', function() {
        // Add click animation for tactile feedback
        themeToggle.classList.add('clicking');
        setTimeout(() => themeToggle.classList.remove('clicking'), 300);
        toggleTheme();
      });

      // Keyboard accessibility for non-button elements
      themeToggle.addEventListener('keydown', function(e) {
        const key = e.key || e.code;
        if (key === 'Enter' || key === ' ' || key === 'Spacebar') {
          e.preventDefault();
          toggleTheme();
        }
      });

      // Listen to system color scheme changes (with addEventListener/addListener fallback)
      if (darkModeQuery) {
        const systemChangeHandler = function(e) {
          try {
            // Only auto-apply if user hasn't explicitly chosen a theme
            if (!localStorage.getItem('theme')) {
              applyTheme(e.matches ? 'dark' : 'light');
            }
          } catch (err) {
            console.error('Error in system theme change handler:', err);
          }
        };

        if (typeof darkModeQuery.addEventListener === 'function') {
          darkModeQuery.addEventListener('change', systemChangeHandler);
        } else if (typeof darkModeQuery.addListener === 'function') {
          // Safari < 14 fallback
          darkModeQuery.addListener(systemChangeHandler);
        }
      }

      // Keep theme in sync across tabs/windows
      window.addEventListener('storage', function(e) {
        if (e.key === 'theme') {
          const theme = e.newValue || getCurrentTheme();
          applyTheme(theme);
        }
      });
    } catch (e) {
        console.error('Error initializing theme toggle:', e);
    }
  }

  // Skill bars: target widths come from CSS `[aria-valuenow]` rules and the
  // reveal is a CSS scroll-driven animation (`animation-timeline: view()`),
  // with an instant fallback where that isn't supported — no JS needed.

  // Initialize Back-to-Top Button (Modern UX Pattern)
  function initBackToTop() {
    try {
      // Create back-to-top button
      const backToTopBtn = document.createElement('button');
      backToTopBtn.id = 'back-to-top';
      backToTopBtn.className = 'back-to-top';
      backToTopBtn.setAttribute('aria-label', 'Scroll back to top');
      backToTopBtn.setAttribute('title', 'Back to top');
      var SVGNS = 'http://www.w3.org/2000/svg';
      var arrowIcon = document.createElementNS(SVGNS, 'svg');
      arrowIcon.setAttribute('class', 'icon');
      arrowIcon.setAttribute('aria-hidden', 'true');
      var arrowUse = document.createElementNS(SVGNS, 'use');
      arrowUse.setAttribute('href', '#i-arrow-up');
      arrowIcon.appendChild(arrowUse);
      backToTopBtn.appendChild(arrowIcon);
      document.body.appendChild(backToTopBtn);

      // Show/hide via an IntersectionObserver on a top sentinel — no scroll
      // handler, so it never contends with the main thread during scroll (INP).
      const sentinel = document.createElement('div');
      sentinel.setAttribute('aria-hidden', 'true');
      sentinel.style.cssText = 'position:absolute;top:300px;left:0;width:1px;height:1px;pointer-events:none;';
      document.body.appendChild(sentinel);

      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          backToTopBtn.classList.toggle('visible', !entries[0].isIntersecting);
        }).observe(sentinel);
      } else {
        backToTopBtn.classList.add('visible');
      }

      // Smooth scroll to top on click
      backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
          top: 0,
          behavior: 'smooth'
        });
      });
    } catch (e) {
      console.error('Error initializing back-to-top button:', e);
    }
  }

  function updateCopyrightYear() {
    try {
      const yearEl = document.getElementById('current-year');
      if (yearEl) yearEl.textContent = new Date().getFullYear();
    } catch (e) {
      console.error('Error updating copyright year:', e);
    }
  }

  // ─── NEW: Update footer last-updated date ──────────────────────────────
  function updateLastUpdated() {
    try {
      const el = document.getElementById('last-updated');
      if (!el) return;
      const now = new Date();
      const opts = { month: 'long', year: 'numeric' };
      el.textContent = now.toLocaleDateString('en-US', opts);
    } catch (e) {
      console.error('Error updating last-updated:', e);
    }
  }

  // ─── NEW: Print button & before/after print hooks ─────────────────────
  function initPrintButton() {
    try {
      const printBtn = document.getElementById('print-btn');
      if (printBtn) {
        printBtn.addEventListener('click', function() {
          window.print();
        });
      }

      // State captured just before printing, restored afterwards.
      var printState = null;

      // beforeprint — ensure the DOM is fully ready for printing
      window.addEventListener('beforeprint', function() {
        try {
          // Mark <html> so CSS can target the printing state if needed
          document.documentElement.classList.add('printing');

          // Snapshot which <details> were already open before we touch them
          var allDetails = Array.from(document.querySelectorAll('details'));
          var alreadyOpen = allDetails.filter(function(el) {
            return el.hasAttribute('open');
          });

          // Force all <details> open so their content is visible in print
          allDetails.forEach(function(el) {
            el.setAttribute('open', '');
          });

          // Snapshot existing inline widths on skill bars, then set final values
          var bars = Array.from(document.querySelectorAll('.skillset .progress-bar'));
          var barWidths = bars.map(function(bar) {
            return bar.style.width; // '' if no inline style
          });
          bars.forEach(function(bar) {
            var value = bar.getAttribute('aria-valuenow');
            if (value) {
              bar.style.width = value + '%';
            }
          });

          // Save everything so afterprint can restore the page to its prior state
          printState = {
            allDetails: allDetails,
            alreadyOpen: alreadyOpen,
            bars: bars,
            barWidths: barWidths
          };
        } catch (e) {
          console.error('Error in beforeprint handler:', e);
        }
      });

      // afterprint — restore page to the state it was in before printing
      window.addEventListener('afterprint', function() {
        try {
          document.documentElement.classList.remove('printing');

          if (printState) {
            // Close any <details> that were closed before we forced them open
            printState.allDetails.forEach(function(el) {
              if (printState.alreadyOpen.indexOf(el) === -1) {
                el.removeAttribute('open');
              }
            });

            // Restore original inline widths on skill bars
            printState.bars.forEach(function(bar, i) {
              bar.style.width = printState.barWidths[i];
            });

            printState = null;
          }
        } catch (e) {
          console.error('Error in afterprint handler:', e);
        }
      });

    } catch (e) {
      console.error('Error initializing print button:', e);
    }
  }

  // ─── NEW: Copy email to clipboard ─────────────────────────────────────
  function initCopyEmail() {
    try {
      const copyBtns = document.querySelectorAll('.copy-email-btn');
      copyBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
          const email = btn.getAttribute('data-email');
          if (!email) return;

          const handleSuccess = function() {
            try {
              btn.classList.add('copied');
              const iconUse = btn.querySelector('use');
              if (iconUse) {
                iconUse.setAttribute('href', '#i-check');
              }
              setTimeout(function() {
                btn.classList.remove('copied');
                if (iconUse) iconUse.setAttribute('href', '#i-copy');
              }, 2000);
              // Show toast
              showEmailCopiedToast();
            } catch (e) { /* ignore */ }
          };

          if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(email).then(handleSuccess).catch(function() {
              fallbackCopy(email, handleSuccess);
            });
          } else {
            fallbackCopy(email, handleSuccess);
          }
        });
      });
    } catch (e) {
      console.error('Error initializing copy email:', e);
    }
  }

  function fallbackCopy(text, callback) {
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      if (callback) callback();
    } catch (e) {
      console.error('Fallback copy failed:', e);
    }
  }

  function showEmailCopiedToast() {
    try {
      const existing = document.querySelector('.email-copy-toast');
      if (existing) existing.remove();

      const toast = document.createElement('div');
      toast.className = 'theme-toast email-copy-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');

      const icon = document.createElement('span');
      icon.className = 'toast-icon';
      icon.textContent = '✅';
      const msg = document.createElement('span');
      msg.className = 'toast-message';
      msg.textContent = 'Email copied to clipboard!';

      toast.appendChild(icon);
      toast.appendChild(msg);
      document.body.appendChild(toast);
      setTimeout(function() { toast.classList.add('show'); }, 10);
      setTimeout(function() {
        toast.classList.remove('show');
        setTimeout(function() { toast.remove(); }, 300);
      }, 2500);
    } catch (e) { /* ignore */ }
  }

  // ─── NEW: Scroll-Spy for Sidebar Nav ──────────────────────────────────
  function initScrollSpy() {
    try {
      const navLinks = document.querySelectorAll('.sidebar-nav-link[data-target]');
      if (!navLinks.length) return;

      const sections = [];
      navLinks.forEach(function(link) {
        const targetClass = link.getAttribute('data-target');
        const section = document.querySelector('.' + targetClass);
        if (section) {
          sections.push({ link: link, section: section });
        }
      });
      if (!sections.length) return;

      function setActive(link) {
        navLinks.forEach(function(l) {
          l.classList.remove('active');
          l.removeAttribute('aria-current');
        });
        if (link) {
          link.classList.add('active');
          link.setAttribute('aria-current', 'true');
        }
      }

      // IntersectionObserver instead of a scroll handler — the browser does the
      // geometry off the main thread, so scrolling stays responsive (INP).
      if ('IntersectionObserver' in window) {
        const visible = new Set();
        const io = new IntersectionObserver(function(entries) {
          entries.forEach(function(entry) {
            if (entry.isIntersecting) { visible.add(entry.target); }
            else { visible.delete(entry.target); }
          });
          // Pick the visible section closest to the top of the document.
          let best = null;
          sections.forEach(function(item) {
            if (visible.has(item.section)) {
              if (!best || item.section.offsetTop < best.section.offsetTop) best = item;
            }
          });
          if (best) setActive(best.link);
        }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
        sections.forEach(function(item) { io.observe(item.section); });
      }
      setActive(sections[0].link); // sensible default before first intersection

      // Smooth scroll for nav links
      navLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
          const href = link.getAttribute('href');
          if (!href || !href.startsWith('#')) return;
          const target = document.getElementById(href.slice(1));
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActive(link); // reflect the jump immediately
          }
        });
      });
    } catch (e) {
      console.error('Error initializing scroll-spy:', e);
    }
  }

  // ─── NEW: Ensure mobile-collapsible details stay open on desktop ───────
  function initMobileAccordion() {
    try {
      const desktop = window.matchMedia('(min-width: 769px)');
      function ensureOpenOnDesktop() {
        if (desktop.matches) {
          document.querySelectorAll('details.mobile-collapsible').forEach(function(el) {
            el.setAttribute('open', '');
          });
        }
      }
      ensureOpenOnDesktop();
      // matchMedia change fires only at the breakpoint — no resize handler.
      if (typeof desktop.addEventListener === 'function') {
        desktop.addEventListener('change', ensureOpenOnDesktop);
      } else if (typeof desktop.addListener === 'function') {
        desktop.addListener(ensureOpenOnDesktop);
      }
    } catch (e) {
      console.error('Error initializing mobile accordion:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initThemeToggle();
      initBackToTop();
      updateCopyrightYear();
      updateLastUpdated();
      initPrintButton();
      initCopyEmail();
      initScrollSpy();
      initMobileAccordion();
    }, { once: true });
  } else {
    initThemeToggle();
    initBackToTop();
    updateCopyrightYear();
    updateLastUpdated();
    initPrintButton();
    initCopyEmail();
    initScrollSpy();
    initMobileAccordion();
  }
})();

// Service Worker registration — provides offline caching equivalent to Expires headers.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').catch(function(err) {
      console.warn('Service Worker registration failed:', err);
    });
  });
}

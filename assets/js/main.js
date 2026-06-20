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
          // Use toggle for more efficient class manipulation
          themeIcon.classList.toggle('fa-sun', isDark);
          themeIcon.classList.toggle('fa-moon', !isDark);
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
      
      function toggleTheme() {
        if (isToggling) return; // Prevent rapid toggling
        
        try {
          isToggling = true;
          const currentTheme = getCurrentTheme();
          const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
          
          try {
            localStorage.setItem('theme', newTheme);
          } catch (e) {
            console.error('Error saving theme to localStorage:', e);
          }
          
          applyTheme(newTheme);

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

  function initSkillBars() {
    try {
      const skillItems = document.querySelectorAll('.skillset .item');
      
      // Check if user prefers reduced motion
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Use Intersection Observer for scroll-triggered animations (modern UX pattern)
      if ('IntersectionObserver' in window && !prefersReducedMotion) {
        const observerOptions = {
          root: null,
          rootMargin: '0px',
          threshold: 0.3 // Trigger when 30% visible
        };
        
        const observer = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const progressBar = entry.target.querySelector('.progress-bar');
              if (!progressBar || progressBar.dataset.animated === 'true') return;
              
              const skillValue = progressBar.getAttribute('aria-valuenow');
              // Animate skill bar on scroll
              const currentStyle = progressBar.style.cssText;
              progressBar.style.cssText = currentStyle + (currentStyle ? ';' : '') + 'transition:width 1s ease-out;width:' + skillValue + '%';
              progressBar.textContent = skillValue + '%';
              progressBar.dataset.animated = 'true';
              
              // Unobserve after animation
              observer.unobserve(entry.target);
            }
          });
        }, observerOptions);
        
        skillItems.forEach(item => observer.observe(item));
      } else {
        // Fallback for older browsers or reduced motion preference
        skillItems.forEach(item => {
          try {
            const progressBar = item.querySelector('.progress-bar');
            if (!progressBar) return;
            
            const skillValue = progressBar.getAttribute('aria-valuenow');
            const currentStyle = progressBar.style.cssText;
            const transition = prefersReducedMotion ? '' : 'transition:width 1s ease-out;';
            progressBar.style.cssText = currentStyle + (currentStyle ? ';' : '') + transition + 'width:' + skillValue + '%';
            progressBar.textContent = skillValue + '%';
          } catch (e) {
            console.error('Error initializing skill bar:', e, item);
          }
        });
      }
    } catch (e) {
      console.error('Error initializing skill bars:', e);
    }
  }

  // Initialize Back-to-Top Button (Modern UX Pattern)
  function initBackToTop() {
    try {
      // Create back-to-top button
      const backToTopBtn = document.createElement('button');
      backToTopBtn.id = 'back-to-top';
      backToTopBtn.className = 'back-to-top';
      backToTopBtn.setAttribute('aria-label', 'Scroll back to top');
      backToTopBtn.setAttribute('title', 'Back to top');
      const arrowIcon = document.createElement('i');
      arrowIcon.className = 'fa-solid fa-arrow-up';
      arrowIcon.setAttribute('aria-hidden', 'true');
      backToTopBtn.appendChild(arrowIcon);
      document.body.appendChild(backToTopBtn);
      
      // Show/hide based on scroll position
      let scrollTimeout;
      const toggleBackToTop = () => {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(() => {
          if (window.scrollY > 300) {
            backToTopBtn.classList.add('visible');
          } else {
            backToTopBtn.classList.remove('visible');
          }
        }, 100); // Debounce scroll events
      };
      
      window.addEventListener('scroll', toggleBackToTop, { passive: true });
      
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
              const origIcon = btn.querySelector('i');
              if (origIcon) {
                origIcon.className = 'fa-solid fa-check';
              }
              setTimeout(function() {
                btn.classList.remove('copied');
                if (origIcon) origIcon.className = 'fa-solid fa-copy';
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

      function updateActiveNav() {
        const scrollPos = window.scrollY + 80; // offset for fixed header
        let current = sections[0];
        sections.forEach(function(item) {
          const top = item.section.getBoundingClientRect().top + window.scrollY;
          if (scrollPos >= top) current = item;
        });
        navLinks.forEach(function(l) {
          l.classList.remove('active');
          l.removeAttribute('aria-current');
        });
        if (current) {
          current.link.classList.add('active');
          current.link.setAttribute('aria-current', 'true');
        }
      }

      window.addEventListener('scroll', updateActiveNav, { passive: true });
      updateActiveNav(); // run on load

      // Smooth scroll for nav links
      navLinks.forEach(function(link) {
        link.addEventListener('click', function(e) {
          const href = link.getAttribute('href');
          if (!href || !href.startsWith('#')) return;
          const target = document.getElementById(href.slice(1));
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Update active immediately
            navLinks.forEach(function(l) {
              l.classList.remove('active');
              l.removeAttribute('aria-current');
            });
            link.classList.add('active');
            link.setAttribute('aria-current', 'true');
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
      function ensureOpenOnDesktop() {
        if (window.innerWidth >= 769) {
          document.querySelectorAll('details.mobile-collapsible').forEach(function(el) {
            el.setAttribute('open', '');
          });
        }
      }
      ensureOpenOnDesktop();
      let resizeTimer;
      window.addEventListener('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(ensureOpenOnDesktop, 150);
      });
    } catch (e) {
      console.error('Error initializing mobile accordion:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      initThemeToggle();
      initSkillBars();
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
    initSkillBars();
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
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function (err) {
      console.warn('Service Worker registration failed:', err);
    });
  });
}

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
      if (!localStorage.getItem('theme-seen')) {
        setTimeout(() => {
          themeToggle.classList.add('initial-pulse');
          setTimeout(() => {
            themeToggle.classList.remove('initial-pulse');
            localStorage.setItem('theme-seen', 'true');
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

  // Removed Interests Icon list

  // Initialize Back-to-Top Button (Modern UX Pattern)
  function initBackToTop() {
    try {
      // Create back-to-top button
      const backToTopBtn = document.createElement('button');
      backToTopBtn.id = 'back-to-top';
      backToTopBtn.className = 'back-to-top';
      backToTopBtn.setAttribute('aria-label', 'Scroll back to top');
      backToTopBtn.setAttribute('title', 'Back to top');
      backToTopBtn.innerHTML = '<i class="fa-solid fa-arrow-up" aria-hidden="true"></i>';
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // Small delay to ensure DOM is fully ready and to reduce any flicker
      setTimeout(initThemeToggle, 100);
      initSkillBars();
      initBackToTop();
    }, { once: true });
  } else {
    setTimeout(initThemeToggle, 100);
    initSkillBars();
    initBackToTop();
  }
})();

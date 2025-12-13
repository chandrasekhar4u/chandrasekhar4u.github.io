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

      // Click handler
      themeToggle.addEventListener('click', toggleTheme);

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
      
      // Use forEach with optimized approach
      skillItems.forEach(item => {
        try {
          const progressBar = item.querySelector('.progress-bar');
          if (!progressBar) return;
          
          const skillValue = progressBar.getAttribute('aria-valuenow');
          // Set both width and transition in one style update for better performance
          const currentStyle = progressBar.style.cssText;
          progressBar.style.cssText = currentStyle + (currentStyle ? ';' : '') + 'transition:width 1s ease-in-out;width:' + skillValue + '%';
          progressBar.textContent = skillValue + '%'; // Show value on bar
        } catch (e) {
          console.error('Error initializing skill bar:', e, item);
        }
      });
    } catch (e) {
      console.error('Error initializing skill bars:', e);
    }
  }

  // Removed Interests Icon list

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // Small delay to ensure DOM is fully ready and to reduce any flicker
      setTimeout(initThemeToggle, 100);
      initSkillBars();
    }, { once: true });
  } else {
    setTimeout(initThemeToggle, 100);
    initSkillBars();
  }
})();

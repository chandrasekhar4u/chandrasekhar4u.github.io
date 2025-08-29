(function() {
  'use strict';

  function initThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = document.getElementById('theme-icon');

    if (!themeToggle || !themeIcon) {
      console.warn('Theme toggle elements not found. Theme toggle will not be available.');
      return;
    }

    function getCurrentTheme() {
      try {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) return savedTheme;
      } catch (e) {
        console.error('Error accessing localStorage:', e);
      }
      try {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } catch (e) {
        console.error('Error accessing matchMedia:', e);
        return 'light';
      }
    }

    function setIcon(isDark) {
      try {
        // Preserve any other classes on the icon, only swap the FA-specific icon name.
        themeIcon.classList.remove('fa-sun-o', 'fa-moon-o', 'fa-sun', 'fa-moon');
        // Ensure base FA class remains if present
        if (!themeIcon.classList.contains('fa')) {
          themeIcon.classList.add('fa');
        }
        // Default to Font Awesome 4 icon names; if your site uses FA5/6, adjust in CSS or here.
        themeIcon.classList.add(isDark ? 'fa-sun-o' : 'fa-moon-o');
      } catch (e) {
        console.error('Error setting theme icon:', e);
      }
    }

    // Apply theme by setting/removing data-theme on both <html> and <body>
    function applyTheme(theme) {
      const htmlEl = document.documentElement;
      const bodyEl = document.body;
      const isDark = theme === 'dark';

      if (isDark) {
        htmlEl.setAttribute('data-theme', 'dark');
        if (bodyEl) bodyEl.setAttribute('data-theme', 'dark');
      } else {
        htmlEl.removeAttribute('data-theme');
        if (bodyEl) bodyEl.removeAttribute('data-theme');
      }

      // Update icon and accessible labels
      setIcon(isDark);
      themeToggle.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
      themeToggle.setAttribute('title', isDark ? 'Switch to light theme' : 'Switch to dark theme');
    }

    function announceToScreenReader(message) {
      try {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'visually-hidden';
        // Add inline visually-hidden styles as a fallback in case the class is not defined
        announcement.style.position = 'absolute';
        announcement.style.width = '1px';
        announcement.style.height = '1px';
        announcement.style.margin = '-1px';
        announcement.style.padding = '0';
        announcement.style.overflow = 'hidden';
        announcement.style.clip = 'rect(0 0 0 0)';
        announcement.style.whiteSpace = 'nowrap';
        announcement.style.border = '0';
        announcement.textContent = message;

        document.body.appendChild(announcement);
        setTimeout(function() {
          try {
            if (announcement.parentNode) document.body.removeChild(announcement);
          } catch (e) {
            console.error('Error removing announcement element:', e);
          }
        }, 1000);
      } catch (e) {
        console.error('Error creating announcement element:', e);
      }
    }

    function toggleTheme() {
      try {
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
      } catch (e) {
        console.error('Error in toggleTheme:', e);
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
    try {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
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

      if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', systemChangeHandler);
      } else if (typeof mql.addListener === 'function') {
        // Safari < 14 fallback
        mql.addListener(systemChangeHandler);
      }
    } catch (e) {
      console.error('Error setting up system theme listener:', e);
    }

    // Keep theme in sync across tabs/windows
    window.addEventListener('storage', function(e) {
      if (e.key === 'theme') {
        const theme = e.newValue || getCurrentTheme();
        applyTheme(theme);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // Small delay to ensure DOM is fully ready and to reduce any flicker
      setTimeout(initThemeToggle, 100);
    }, { once: true });
  } else {
    setTimeout(initThemeToggle, 100);
  }
})();

(function() {
  'use strict';

  function initThemeToggle() {
    var themeToggle = document.getElementById('theme-toggle');
    var themeIcon = document.getElementById('theme-icon');
    
    if (!themeToggle || !themeIcon) {
      console.warn('Theme toggle elements not found. Theme toggle will not be available.');
      return;
    }

    function getCurrentTheme() {
      try {
        var savedTheme = localStorage.getItem('theme');
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

    // UPDATED: set/remove data-theme on both <html> and <body>
    function applyTheme(theme) {
      var htmlEl = document.documentElement;
      var bodyEl = document.body;

      if (theme === 'dark') {
        htmlEl.setAttribute('data-theme', 'dark');
        if (bodyEl) bodyEl.setAttribute('data-theme', 'dark');

        themeIcon.className = 'fa fa-sun-o';
        themeToggle.setAttribute('aria-label', 'Switch to light theme');
        themeToggle.setAttribute('title', 'Switch to light theme');
      } else {
        htmlEl.removeAttribute('data-theme');
        if (bodyEl) bodyEl.removeAttribute('data-theme');

        themeIcon.className = 'fa fa-moon-o';
        themeToggle.setAttribute('aria-label', 'Switch to dark theme');
        themeToggle.setAttribute('title', 'Switch to dark theme');
      }
    }

    function toggleTheme() {
      try {
        var currentTheme = getCurrentTheme();
        var newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        try {
          localStorage.setItem('theme', newTheme);
        } catch (e) {
          console.error('Error saving theme to localStorage:', e);
        }
        applyTheme(newTheme);

        var announcement = newTheme === 'dark' ? 'Dark theme activated' : 'Light theme activated';
        announceToScreenReader(announcement);
      } catch (e) {
        console.error('Error in toggleTheme:', e);
      }
    }

    function announceToScreenReader(message) {
      try {
        var announcement = document.createElement('div');
        announcement.setAttribute('aria-live', 'polite');
        announcement.setAttribute('aria-atomic', 'true');
        announcement.className = 'visually-hidden';
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

    var initialTheme = getCurrentTheme();
    applyTheme(initialTheme);

    themeToggle.addEventListener('click', toggleTheme);

    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        try {
          if (!localStorage.getItem('theme')) {
            applyTheme(e.matches ? 'dark' : 'light');
          }
        } catch (err) {
          console.error('Error in system theme change handler:', err);
        }
      });
    } catch (e) {
      console.error('Error setting up system theme listener:', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initThemeToggle, 100);
    }, { once: true });
  } else {
    setTimeout(initThemeToggle, 100);
  }
})();

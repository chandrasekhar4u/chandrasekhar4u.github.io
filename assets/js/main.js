/* Progressive enhancement for skill bars
   - No jQuery dependency
   - Respects prefers-reduced-motion
   - Animates when bars enter viewport (IntersectionObserver), with fallback
   - Reads target value from aria-valuenow (preferred) or data-level (fallback)
   - Keeps compatibility with existing markup: .progress .progress-bar and .level-bar-inner
*/
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function toPercentString(value) {
    if (typeof value !== 'string') value = String(value || '');
    var v = value.trim();
    if (v.endsWith('%')) return v;
    var n = parseFloat(v);
    if (isNaN(n)) return '0%';
    n = Math.max(0, Math.min(100, n));
    return n + '%';
  }

  function getTargetWidth(el) {
    var ariaNow = el.getAttribute('aria-valuenow');
    if (ariaNow !== null) {
      return toPercentString(ariaNow);
    }
    var dataLevel = el.getAttribute('data-level'); // supports legacy .level-bar-inner
    if (dataLevel) {
      return toPercentString(dataLevel);
    }
    var inline = el.style && el.style.width ? el.style.width : '';
    return inline || '0%';
  }

  function setAriaDefaults(el, target) {
    if (!el.hasAttribute('aria-valuemin')) el.setAttribute('aria-valuemin', '0');
    if (!el.hasAttribute('aria-valuemax')) el.setAttribute('aria-valuemax', '100');
    var num = parseFloat(target);
    if (!el.hasAttribute('aria-valuenow') && !isNaN(num)) {
      el.setAttribute('aria-valuenow', String(Math.max(0, Math.min(100, num))));
    }
    if (!el.hasAttribute('role')) {
      el.setAttribute('role', 'progressbar');
    }
  }

  function primeBars(bars) {
    bars.forEach(function (bar) {
      var target = getTargetWidth(bar);
      bar.dataset.targetWidth = target;
      setAriaDefaults(bar, target);

      // Start from 0 for animation. Use CSS transition if available.
      bar.style.width = '0%';

      // Provide a default transition if none is defined inline or via CSS.
      // This won't override existing CSS transitions from the theme.
      var hasInlineTransition = bar.style.transition && bar.style.transition.length > 0;
      if (!hasInlineTransition && !prefersReducedMotion) {
        bar.style.transition = 'width 800ms ease';
      }
    });
  }

  function fillBar(bar) {
    var target = bar.dataset.targetWidth || getTargetWidth(bar);
    if (prefersReducedMotion) {
      bar.style.transition = 'none';
      bar.style.width = target;
      return;
    }
    // Ensure initial 0% is painted before transitioning
    requestAnimationFrame(function () {
      bar.style.width = target;
    });
  }

  function onDOMContentLoaded() {
    var bars = Array.prototype.slice.call(
      document.querySelectorAll('.progress .progress-bar, .level-bar-inner')
    );

    if (bars.length === 0) return;

    primeBars(bars);

    // If IntersectionObserver is supported, animate when visible.
    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            fillBar(entry.target);
            observer.unobserve(entry.target);
          }
        });
      }, {
        root: null,
        rootMargin: '0px',
        threshold: 0.2 // start when 20% visible
      });

      bars.forEach(function (bar) {
        // If user prefers reduced motion, fill immediately without observing.
        if (prefersReducedMotion) {
          fillBar(bar);
        } else {
          observer.observe(bar);
        }
      });
    } else {
      // Fallback: animate all after window load
      if (document.readyState === 'complete') {
        bars.forEach(fillBar);
      } else {
        window.addEventListener('load', function () {
          bars.forEach(fillBar);
        }, { once: true });
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onDOMContentLoaded, { once: true });
  } else {
    onDOMContentLoaded();
  }

})();

/* Theme Toggle Functionality */
(function() {
  'use strict';

  function initThemeToggle() {
    var themeToggle = document.getElementById('theme-toggle');
    var themeIcon = document.getElementById('theme-icon');
    
    if (!themeToggle || !themeIcon) {
      console.warn('Theme toggle elements not found. Theme toggle will not be available.');
      return;
    }

    // Get current theme from localStorage or system preference
    function getCurrentTheme() {
      try {
        var savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
          return savedTheme;
        }
      } catch (e) {
        console.error('Error accessing localStorage:', e);
      }
      
      try {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } catch (e) {
        console.error('Error accessing matchMedia:', e);
        return 'light'; // Default fallback
      }
    }

    // Apply theme to document
    function applyTheme(theme) {
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeIcon.className = 'fa fa-sun-o';
        themeToggle.setAttribute('aria-label', 'Switch to light theme');
        themeToggle.setAttribute('title', 'Switch to light theme');
      } else {
        document.documentElement.removeAttribute('data-theme');
        themeIcon.className = 'fa fa-moon-o';
        themeToggle.setAttribute('aria-label', 'Switch to dark theme');
        themeToggle.setAttribute('title', 'Switch to dark theme');
      }
    }

    // Toggle theme
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
        
        // Announce theme change to screen readers
        var announcement = newTheme === 'dark' ? 'Dark theme activated' : 'Light theme activated';
        announceToScreenReader(announcement);
      } catch (e) {
        console.error('Error in toggleTheme:', e);
      }
    }

    // Announce changes to screen readers
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
            if (announcement.parentNode) {
              document.body.removeChild(announcement);
            }
          } catch (e) {
            console.error('Error removing announcement element:', e);
          }
        }, 1000);
      } catch (e) {
        console.error('Error creating announcement element:', e);
      }
    }

    // Initialize theme on page load
    var initialTheme = getCurrentTheme();
    applyTheme(initialTheme);

    // Add event listener for theme toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Listen for system theme changes
    try {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function(e) {
        // Only auto-switch if user hasn't manually set a preference
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

  // Initialize theme toggle when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      // Add a small delay to ensure FontAwesome is loaded
      setTimeout(initThemeToggle, 100);
    }, { once: true });
  } else {
    // Add a small delay to ensure FontAwesome is loaded
    setTimeout(initThemeToggle, 100);
  }

})();
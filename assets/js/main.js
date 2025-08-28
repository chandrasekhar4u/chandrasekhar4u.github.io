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
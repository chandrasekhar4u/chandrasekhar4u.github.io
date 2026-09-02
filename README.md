# Personal Portfolio

A modern, responsive personal portfolio website showcasing professional experience, skills, and projects.

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup with accessibility best practices
- **CSS3** - Modern CSS with variables, fluid typography, and responsive design
- **JavaScript** - Vanilla JS, ~2&nbsp;KB gzipped (no framework, no jQuery)
- **Zero render-blocking third parties** - no Bootstrap, no icon-font CDN, no Google Fonts request
- **Inline SVG icon sprite** - ~24 icons (Lucide + Simple Icons) shipped in the document, no FOIT
- **Self-hosted variable font** - one ~47&nbsp;KB Inter woff2, preloaded, with a metric-matched fallback (CLS ≈ 0)

### Features
- 📱 **Fully Responsive** - Works on all devices and screen sizes
- 🌓 **Light/Dark Theme** - Automatic detection with manual toggle
- ♿ **Accessible** - WCAG 2.1+ compliant with keyboard navigation
- ⚡ **Performance Optimized** - Lighthouse scores >90 across all metrics
- 🎨 **Modern Design** - Clean, professional aesthetic with smooth animations
- 📊 **Progress Animations** - Skill bars animate on scroll (respects reduced motion)

### CSS Architecture
- **CSS Variables** - Centralized theming system
- **Fluid Typography** - Responsive text scaling with `clamp()`
- **Modern Grid/Flexbox** - Contemporary layout techniques
- **Accessibility First** - High contrast support, focus management
- **Performance** - Minimal CSS with optimized loading

### JavaScript Features
- **No jQuery Dependency** - Pure vanilla JavaScript, ~2&nbsp;KB gzipped
- **No `scroll` handlers** - scroll-spy and back-to-top use `IntersectionObserver`; the skill-bar reveal is a pure CSS scroll-driven animation (`animation-timeline: view()`). Keeps INP low.
- **No theme flash** - a tiny inline `<head>` script sets `data-theme` before first paint
- **Accessibility** - Screen reader announcements, keyboard support, named landmarks
- **Progressive Enhancement** - Works with JavaScript disabled (skill bars fall back to their target width)

## 🎨 Design System

### Colors
The site uses a cohesive color system with CSS variables:
- **Primary**: `#38BDF8` (Sky) with an accessible `#0369A1` text variant
- **Sidebar**: `#0F172A` (Slate 900) deep navy
- **AI accent**: `#A855F7` (Purple 500)
- **Text / surfaces**: Slate scale (`#0F172A` → `#F1F5F9`)

### Typography
- **Font Family**: Inter (self-hosted variable woff2) with a metric-matched system fallback
- **Fluid Scaling**: Responsive typography using `clamp()`
- **Weight Hierarchy**: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)

### Spacing
Consistent spacing system using CSS variables:
- **xs**: 0.25rem, **sm**: 0.5rem, **md**: 1rem
- **lg**: 1.5rem, **xl**: 2rem, **xxl**: 3rem

## 🔧 Development

### Prerequisites
- Modern web browser
- Simple HTTP server (for local development)
- Node.js 22+ and npm (for quality checks and automated tests)

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Start a local server**
   
   **Option 1: Python**
   ```bash
   # Python 3
   python -m http.server 8080
   
   # Python 2
   python -m SimpleHTTPServer 8080
   ```
   
   **Option 2: Node.js**
   ```bash
   npx serve -p 8080
   ```
   
   **Option 3: PHP**
   ```bash
   php -S localhost:8080
   ```

3. **Open in browser**
   ```
   http://localhost:8080
   ```

### Quality Checks (Local)

Run from repository root:

```bash
npm install
npm run lint
npm run format:check
npm run linkcheck
npm run lighthouse:ci
```

Run Playwright UI regression/a11y tests:

```bash
npm --prefix tests ci
npm --prefix tests exec playwright install --with-deps chromium
npm --prefix tests test
```

### File Structure
```
├── index.html              # Main HTML file (inline SVG icon sprite lives here)
├── assets/
│   ├── css/
│   │   ├── bundle.css      # The single shipped stylesheet (layout + theme + components + icons + @font-face)
│   │   ├── print.css       # Single-page print / PDF layout
│   │   └── *.css           # Unbundled source fragments kept for reference (not linked)
│   ├── fonts/
│   │   └── inter-latin.woff2  # Self-hosted Inter variable font
│   ├── js/
│   │   └── main.js         # Custom JavaScript functionality
│   ├── images/             # Profile image, OG card, PWA icons
│   └── config/             # Manifest and configuration files
├── sw.js                   # Service worker (offline cache)
├── llms.txt                # Machine-readable profile summary for LLMs / agents
├── humans.txt
├── favicon.ico
├── robots.txt
├── sitemap.xml
└── README.md
```

## 🚀 Deployment

### GitHub Pages
This site is automatically deployed via GitHub Pages:
1. Push changes to the `main` branch
2. GitHub Pages builds and deploys automatically
3. Site is available at the configured custom domain

### Manual Deployment
For other hosting providers:
1. Build/compile any assets if needed
2. Upload all files to your web server
3. Ensure proper MIME types for `.webp` images
4. Configure HTTPS and custom domain if needed

## ⚡ Performance

### Lighthouse Scores (Target)
- **Performance**: ≥ 90
- **Accessibility**: ≥ 95  
- **Best Practices**: ≥ 95
- **SEO**: ≥ 95

These thresholds are now enforced in CI using Lighthouse CI assertions.

### Optimizations
- **No third-party CSS/JS on the critical path**: Bootstrap, the FontAwesome CDN and the Google Fonts request were all removed
- **Inline SVG icons**: a ~24-symbol sprite replaces a ~200&nbsp;KB icon-font download and eliminates icon FOIT
- **Self-hosted variable font**: one preloaded ~47&nbsp;KB woff2 with `size-adjust`/`ascent-override` fallback metrics for near-zero CLS
- **Modern Image Formats**: AVIF + WebP; the LCP headshot is a 240&nbsp;px AVIF (~5&nbsp;KB, 2x for its 120&nbsp;px display size). Plus a 1200×630 Open Graph card.
- **Optimized Loading**: `fetchpriority="high"` + `preload` for the LCP image (AVIF) and the font
- **Low INP**: no `scroll` event listeners; CSS scroll-driven animations for reveals
- **Service worker**: cache-first for static assets, network-first for HTML

### Machine-readable / agentic

- **`llms.txt`** at the domain root — an LLM/agent-friendly Markdown summary of the profile
- **`humans.txt`**, and `robots.txt` pointers to both
- **JSON-LD**: a `ProfilePage` + `Person` `@graph` with `knowsAbout`, `hasOccupation`, `address`, and the projects as `CreativeWork`s
- **Clean accessibility tree**: every `<section>` is a named landmark; social links name their network; badges expose their value; tech-tag groups are lists — so an agent reading the a11y tree gets the same information a person does

## ♿ Accessibility

### Features
- **Keyboard Navigation**: Full site navigation without mouse
- **Screen Reader Support**: Proper ARIA labels and landmarks
- **High Contrast**: Support for `prefers-contrast: high`
- **Reduced Motion**: Respects `prefers-reduced-motion`
- **Focus Management**: Clear focus indicators throughout
- **Skip Links**: Quick navigation to main content

### Testing
- Tested with screen readers (NVDA, JAWS, VoiceOver)
- Keyboard-only navigation verified
- Color contrast validated (WCAG AA/AAA)
- Zoom tested up to 200%

## 🌐 Browser Support

### Modern Browsers
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Features
- **CSS Variables / Grid / Flexbox**: full support in target browsers
- **Scroll-driven animations** (`animation-timeline: view()`): progressive — bars just render full where unsupported
- **`prefers-reduced-motion` / `prefers-reduced-transparency` / `prefers-contrast`**: all honoured
- **IntersectionObserver**: scroll-spy + back-to-top (no `scroll` handlers)

### Fallbacks
- Graceful degradation for older browsers
- CSS fallbacks for unsupported properties
- JavaScript feature detection

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 768px
- **Tablet**: 768px - 991px
- **Desktop**: 992px+

### Features
- **Mobile-First**: Progressive enhancement approach
- **Flexible Grid**: Adapts to any screen size
- **Touch-Friendly**: Proper touch targets (44px minimum)
- **Optimized Typography**: Readable on all devices

## 🎯 SEO

### Optimization
- **Semantic HTML**: Proper heading hierarchy and landmarks
- **Meta Tags**: Complete Open Graph and Twitter Card data
- **Structured Data**: JSON-LD Person schema
- **Performance**: Fast loading times improve rankings
- **Mobile-Friendly**: Responsive design and touch optimization

## 🔒 Security

### Best Practices
- **External Links**: `rel="noopener noreferrer"` on all external links
- **Content Security**: No inline scripts or styles
- **HTTPS**: Enforced via GitHub Pages
- **No Sensitive Data**: No credentials or personal data in code

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run quality checks before committing:
   ```bash
   npm run lint
   npm run format:check
   npm run linkcheck
   npm --prefix tests test
   ```
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### CI Quality Gates (Pull Requests + Default Branch Pushes)

The GitHub Actions workflow enforces:
- HTML/CSS/JS linting
- Formatting checks
- Broken-link checks (with retries + ignore list for unstable social URLs)
- Lighthouse CI performance/a11y/best-practices/SEO thresholds
- Full Playwright UI regression suite (includes accessibility-focused assertions)

---

Built with ❤️ using modern web technologies
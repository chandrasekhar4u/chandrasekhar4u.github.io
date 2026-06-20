# Personal Portfolio

A modern, responsive personal portfolio website showcasing professional experience, skills, and projects.

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup with accessibility best practices
- **CSS3** - Modern CSS with variables, fluid typography, and responsive design
- **JavaScript** - Vanilla JS (no jQuery dependency)
- **Bootstrap 5.3.x** - Modern responsive framework

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
- **No jQuery Dependency** - Pure vanilla JavaScript
- **Theme Management** - Persistent dark/light mode switching
- **Intersection Observer** - Performant scroll-based animations
- **Accessibility** - Screen reader announcements, keyboard support
- **Progressive Enhancement** - Works with JavaScript disabled

## 🎨 Design System

### Colors
The site uses a cohesive color system with CSS variables:
- **Primary**: `#42A8C0` (Teal blue)
- **Text**: `#3F4650` (Dark gray)
- **Background**: `#f5f5f5` (Light gray)
- **Accent**: `#fb866a` (Coral)

### Typography
- **Font Family**: Roboto with fallbacks to system fonts
- **Fluid Scaling**: Responsive typography using `clamp()`
- **Weight Hierarchy**: 400 (normal), 500 (medium), 700 (bold)

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
├── index.html              # Main HTML file
├── assets/
│   ├── css/
│   │   ├── theme.css       # Main theme and component styles
│   │   └── styles.css      # Legacy styles (for reference)
│   ├── js/
│   │   └── main.js         # Custom JavaScript functionality
│   ├── images/             # Profile images and icons
│   └── config/            # Manifest and configuration files
├── favicon.ico
├── robots.txt
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
- **Modern Image Formats**: WebP with AVIF fallbacks
- **Optimized Loading**: `fetchpriority="high"` for LCP image
- **Lazy Loading**: Non-critical images load on demand
- **Efficient CSS**: CSS variables reduce file size
- **Minimal JavaScript**: Only essential functionality

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
- **CSS Variables**: Full support in target browsers
- **CSS Grid/Flexbox**: Complete layout support
- **ES6+ JavaScript**: Modern syntax and features
- **Intersection Observer**: Progressive enhancement

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
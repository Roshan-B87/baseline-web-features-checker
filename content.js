// content.js - Chrome Extension Content Script for Baseline Feature Detection

class BaselineFeatureDetector {
  constructor() {
    this.detectedFeatures = new Set();
    this.observers = [];
    this.reanalyzeTimeout = null;
    this.init();
  }

  init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.analyzeDocument());
    } else {
      this.analyzeDocument();
    }

    // Set up mutation observer for dynamic content
    this.setupMutationObserver();

    // Listen for messages from popup/background
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));
  }

  analyzeDocument() {
    this.detectedFeatures.clear();
    this.detectCSSFeatures();
    this.detectJavaScriptFeatures();
    this.detectHTMLFeatures();
    this.sendResultsToBackground();
  }

  // === CSS Feature Detection ===
  detectCSSFeatures() {
    try {
      this.analyzeStyleSheets();
      this.analyzeComputedStyles();
      this.detectCSSCustomProperties();
      this.detectModernCSSFeatures();
    } catch (error) {
      console.warn('CSS feature detection error:', error);
    }
  }

  analyzeStyleSheets() {
    const cssText = this.getAllCSSText();

    // CSS Grid
    if (/display:\s*grid|display:\s*inline-grid|grid-template|grid-area|grid-column|grid-row/.test(cssText)) {
      this.addFeature('css-grid', 'CSS Grid Layout', 'css', 'Found in stylesheets');
    }

    // Flexbox
    if (/display:\s*flex|display:\s*inline-flex|flex-direction|flex-wrap|justify-content|align-items/.test(cssText)) {
      this.addFeature('flexbox', 'CSS Flexible Box Layout', 'css', 'Found in stylesheets');
    }

    // CSS Container Queries
    if (/@container|container-type|container-name/.test(cssText)) {
      this.addFeature('css-container-queries', 'CSS Container Queries', 'css', 'Found in stylesheets');
    }

    // CSS Subgrid
    if (/grid-template.*subgrid|subgrid/.test(cssText)) {
      this.addFeature('css-subgrid', 'CSS Subgrid', 'css', 'Found in stylesheets');
    }

    // CSS Cascade Layers
    if (/@layer/.test(cssText)) {
      this.addFeature('css-cascade-layers', 'CSS Cascade Layers', 'css', 'Found in stylesheets');
    }

    // CSS aspect-ratio
    if (/aspect-ratio\s*:/.test(cssText)) {
      this.addFeature('css-aspect-ratio', 'CSS aspect-ratio', 'css', 'Found in stylesheets');
    }

    // CSS gap (for flexbox/grid)
    if (/gap\s*:|column-gap\s*:|row-gap\s*:/.test(cssText)) {
      this.addFeature('flexbox-gap', 'CSS Gap', 'css', 'Found gap property');
    }

    // CSS transforms
    if (/transform\s*:|transform3d|translateX|translateY|translateZ|rotate|scale|skew/.test(cssText)) {
      this.addFeature('css-transforms', 'CSS Transforms', 'css', 'Found in stylesheets');
    }

    // CSS animations
    if (/@keyframes|animation\s*:|animation-name/.test(cssText)) {
      this.addFeature('css-animations', 'CSS Animations', 'css', 'Found animations');
    }

    // CSS transitions
    if (/transition\s*:|transition-property|transition-duration/.test(cssText)) {
      this.addFeature('css-transitions', 'CSS Transitions', 'css', 'Found transitions');
    }

    // CSS backdrop-filter
    if (/backdrop-filter\s*:/.test(cssText)) {
      this.addFeature('css-backdrop-filter', 'CSS backdrop-filter', 'css', 'Found in stylesheets');
    }

    // CSS mask
    if (/mask\s*:|mask-image|mask-position/.test(cssText)) {
      this.addFeature('css-masks', 'CSS Masks', 'css', 'Found in stylesheets');
    }

    // CSS clamp()
    if (/clamp\s*\(/.test(cssText)) {
      this.addFeature('css-math-functions', 'CSS Math Functions', 'css', 'Found clamp() function');
    }

    // CSS logical properties
    if (/margin-inline|padding-inline|border-inline|margin-block|padding-block/.test(cssText)) {
      this.addFeature('css-logical-props', 'CSS Logical Properties', 'css', 'Found logical properties');
    }
  }

  getAllCSSText() {
    let cssText = '';
    try {
      // Get CSS from stylesheets
      Array.from(document.styleSheets).forEach(styleSheet => {
        try {
          if (styleSheet.cssRules) {
            Array.from(styleSheet.cssRules).forEach(rule => {
              cssText += rule.cssText + ' ';
            });
          }
        } catch (e) {
          // Cross-origin stylesheet
          console.debug('Cannot access cross-origin stylesheet');
        }
      });

      // Get inline styles
      Array.from(document.querySelectorAll('[style]')).forEach(el => {
        cssText += el.style.cssText + ' ';
      });

    } catch (error) {
      console.warn('Error reading CSS:', error);
    }
    return cssText;
  }

  analyzeComputedStyles() {
    const elements = document.querySelectorAll('*');
    const sampleSize = Math.min(elements.length, 50); // Limit for performance

    for (let i = 0; i < sampleSize; i++) {
      const element = elements[Math.floor(Math.random() * elements.length)];
      const styles = getComputedStyle(element);

      // Grid usage
      if (styles.display === 'grid' || styles.display === 'inline-grid') {
        this.addFeature('css-grid', 'CSS Grid Layout', 'css', `Active on ${element.tagName.toLowerCase()}`);
      }

      // Flexbox usage
      if (styles.display === 'flex' || styles.display === 'inline-flex') {
        this.addFeature('flexbox', 'CSS Flexible Box Layout', 'css', `Active on ${element.tagName.toLowerCase()}`);
      }

      // CSS transforms
      if (styles.transform && styles.transform !== 'none') {
        this.addFeature('css-transforms', 'CSS Transforms', 'css', `Active on ${element.tagName.toLowerCase()}`);
      }

      // CSS filters
      if (styles.filter && styles.filter !== 'none') {
        this.addFeature('css-filters', 'CSS Filters', 'css', `Active on ${element.tagName.toLowerCase()}`);
      }
    }
  }

  detectCSSCustomProperties() {
    const cssText = this.getAllCSSText();

    // Custom property definitions
    if (/--[\w-]+\s*:/.test(cssText)) {
      this.addFeature('css-custom-properties', 'CSS Custom Properties', 'css', 'Found custom property definitions');
    }

    // Custom property usage
    if (/var\(--[\w-]+\)/.test(cssText)) {
      this.addFeature('css-custom-properties', 'CSS Custom Properties', 'css', 'Found var() usage');
    }
  }

  detectModernCSSFeatures() {
    const cssText = this.getAllCSSText();

    // CSS :has() selector
    if (/:has\s*\(/.test(cssText)) {
      this.addFeature('css-has', 'CSS :has() selector', 'css', 'Found :has() selector');
    }

    // CSS :is() selector
    if (/:is\s*\(/.test(cssText)) {
      this.addFeature('css-is', 'CSS :is() selector', 'css', 'Found :is() selector');
    }

    // CSS :where() selector
    if (/:where\s*\(/.test(cssText)) {
      this.addFeature('css-where', 'CSS :where() selector', 'css', 'Found :where() selector');
    }

    // CSS nesting
    if (/&\s*\{|&\s*:/.test(cssText)) {
      this.addFeature('css-nesting', 'CSS Nesting', 'css', 'Found nesting syntax');
    }
  }

  // === JavaScript Feature Detection ===
  detectJavaScriptFeatures() {
    try {
      this.detectPromiseFeatures();
      this.detectModernSyntax();
      this.detectWebAPIs();
      this.detectESModules();
    } catch (error) {
      console.warn('JavaScript feature detection error:', error);
    }
  }

  detectPromiseFeatures() {
    const scripts = this.getAllScriptText();

    // Promise.allSettled
    if (typeof Promise.allSettled === 'function' && /Promise\.allSettled/.test(scripts)) {
      this.addFeature('promise-allsettled', 'Promise.allSettled()', 'javascript', 'Found in scripts');
    }

    // Promise.any
    if (typeof Promise.any === 'function' && /Promise\.any/.test(scripts)) {
      this.addFeature('promise-any', 'Promise.any()', 'javascript', 'Found in scripts');
    }

    // Promise.try (newer feature)
    if (typeof Promise.try === 'function' && /Promise\.try/.test(scripts)) {
      this.addFeature('promise-try', 'Promise.try()', 'javascript', 'Found in scripts');
    }
  }

  detectModernSyntax() {
    const scripts = this.getAllScriptText();

    // Optional chaining
    if (/\?\.[a-zA-Z_$]/.test(scripts)) {
      this.addFeature('optional-chaining', 'Optional Chaining', 'javascript', 'Found ?. syntax');
    }

    // Nullish coalescing
    if (/\?\?/.test(scripts)) {
      this.addFeature('nullish-coalescing', 'Nullish Coalescing', 'javascript', 'Found ?? syntax');
    }

    // Async/await
    if (/async\s+function|await\s/.test(scripts)) {
      this.addFeature('async-await', 'Async/Await', 'javascript', 'Found async/await syntax');
    }

    // Arrow functions
    if (/=>\s*\{|=>\s*[^{]/.test(scripts)) {
      this.addFeature('arrow-functions', 'Arrow Functions', 'javascript', 'Found => syntax');
    }

    // Template literals
    if (/`[^`]*`/.test(scripts)) {
      this.addFeature('template-literals', 'Template Literals', 'javascript', 'Found backtick syntax');
    }

    // Destructuring
    if (/\{\s*[\w,\s]+\}\s*=|\[\s*[\w,\s]+\]\s*=/.test(scripts)) {
      this.addFeature('destructuring', 'Destructuring Assignment', 'javascript', 'Found destructuring syntax');
    }

    // Spread operator
    if (/\.\.\.[\w$]/.test(scripts)) {
      this.addFeature('spread-operator', 'Spread Operator', 'javascript', 'Found ... syntax');
    }
  }

  detectWebAPIs() {
    const scripts = this.getAllScriptText();

    // Fetch API
    if ('fetch' in window && /fetch\s*\(/.test(scripts)) {
      this.addFeature('fetch', 'Fetch API', 'web-api', 'Found fetch() usage');
    }

    // Intersection Observer
    if ('IntersectionObserver' in window && /IntersectionObserver/.test(scripts)) {
      this.addFeature('intersection-observer', 'Intersection Observer', 'web-api', 'Found usage');
    }

    // ResizeObserver
    if ('ResizeObserver' in window && /ResizeObserver/.test(scripts)) {
      this.addFeature('resize-observer', 'Resize Observer', 'web-api', 'Found usage');
    }

    // Web Workers
    if ('Worker' in window && /new\s+Worker/.test(scripts)) {
      this.addFeature('web-workers', 'Web Workers', 'web-api', 'Found Worker usage');
    }

    // Service Worker
    if ('serviceWorker' in navigator && /serviceWorker/.test(scripts)) {
      this.addFeature('service-workers', 'Service Workers', 'web-api', 'Found serviceWorker usage');
    }

    // Payment Request API
    if ('PaymentRequest' in window && /PaymentRequest/.test(scripts)) {
      this.addFeature('payment-request', 'Payment Request API', 'web-api', 'Found usage');
    }

    // Web Share API
    if ('share' in navigator && /navigator\.share/.test(scripts)) {
      this.addFeature('web-share', 'Web Share API', 'web-api', 'Found navigator.share usage');
    }

    // Clipboard API
    if (navigator.clipboard && /navigator\.clipboard/.test(scripts)) {
      this.addFeature('clipboard-api', 'Clipboard API', 'web-api', 'Found clipboard usage');
    }

    // Geolocation API
    if ('geolocation' in navigator && /navigator\.geolocation/.test(scripts)) {
      this.addFeature('geolocation', 'Geolocation API', 'web-api', 'Found geolocation usage');
    }
  }

  detectESModules() {
    const moduleScripts = document.querySelectorAll('script[type="module"]');
    if (moduleScripts.length > 0) {
      this.addFeature('es-modules', 'ES Modules', 'javascript', `Found ${moduleScripts.length} module script(s)`);
    }

    // Dynamic imports
    const scripts = this.getAllScriptText();
    if (/import\s*\(/.test(scripts)) {
      this.addFeature('dynamic-import', 'Dynamic Import', 'javascript', 'Found import() usage');
    }
  }

  getAllScriptText() {
    let scriptText = '';
    try {
      Array.from(document.querySelectorAll('script:not([src])')).forEach(script => {
        scriptText += script.textContent + ' ';
      });
    } catch (error) {
      console.warn('Error reading scripts:', error);
    }
    return scriptText;
  }

  // === HTML Feature Detection ===
  detectHTMLFeatures() {
    // Custom Elements
    if (customElements && customElements.getNames().length > 0) {
      this.addFeature('custom-elements', 'Custom Elements', 'html', 'Found registered custom elements');
    }

    // Shadow DOM
    if (document.querySelector('[shadowroot]') || document.querySelectorAll('*').length !== document.querySelectorAll(':not([shadowroot] *)').length) {
      this.addFeature('shadow-dom', 'Shadow DOM', 'html', 'Found shadow DOM usage');
    }

    // Modern form inputs
    const modernInputs = document.querySelectorAll('input[type="date"], input[type="color"], input[type="range"], input[type="time"], input[type="datetime-local"]');
    if (modernInputs.length > 0) {
      this.addFeature('html5-forms', 'HTML5 Form Controls', 'html', `Found ${modernInputs.length} modern input types`);
    }

    // Details/Summary
    const detailsElements = document.querySelectorAll('details');
    if (detailsElements.length > 0) {
      this.addFeature('details-summary', 'Details/Summary Elements', 'html', `Found ${detailsElements.length} details elements`);
    }

    // Picture element
    const pictureElements = document.querySelectorAll('picture');
    if (pictureElements.length > 0) {
      this.addFeature('picture-element', 'Picture Element', 'html', `Found ${pictureElements.length} picture elements`);
    }

    // Dialog element
    const dialogElements = document.querySelectorAll('dialog');
    if (dialogElements.length > 0) {
      this.addFeature('dialog-element', 'Dialog Element', 'html', `Found ${dialogElements.length} dialog elements`);
    }
  }

  // === Utility Methods ===
  addFeature(id, name, type, evidence) {
    // Convert Set to Array, find existing, update or add
    const features = Array.from(this.detectedFeatures);
    const existing = features.find(f => f.id === id);

    if (existing) {
      existing.evidence = evidence; // Update evidence
    } else {
      this.detectedFeatures.add({ id, name, type, evidence });
    }
  }

  // === Mutation Observer ===
  setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldReanalyze = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE &&
              (node.tagName === 'STYLE' || node.tagName === 'SCRIPT' ||
                node.hasAttribute('style'))) {
              shouldReanalyze = true;
            }
          });
        }
      });

      if (shouldReanalyze) {
        clearTimeout(this.reanalyzeTimeout);
        this.reanalyzeTimeout = setTimeout(() => {
          this.analyzeDocument();
        }, 1000);
      }
    });

    observer.observe(document.body || document.documentElement, {
      childList: true,
      subtree: true
    });

    this.observers.push(observer);
  }

  // === Message Handling ===
  handleMessage(message, sender, sendResponse) {
    switch (message.type) {
      case 'GET_DETECTED_FEATURES':
        sendResponse({
          features: Array.from(this.detectedFeatures),
          url: window.location.href,
          title: document.title
        });
        break;

      case 'REANALYZE_PAGE':
        this.analyzeDocument();
        sendResponse({ status: 'reanalyzed' });
        break;

      case 'HIGHLIGHT_FEATURE':
        this.highlightFeatureUsage(message.featureId);
        sendResponse({ status: 'highlighted' });
        break;
    }
  }

  sendResultsToBackground() {
    try {
      chrome.runtime.sendMessage({
        type: 'FEATURES_DETECTED',
        features: Array.from(this.detectedFeatures),
        url: window.location.href,
        title: document.title
      });
    } catch (error) {
      console.debug('Could not send message to background script:', error);
    }
  }

  // === Visual Highlighting ===
  highlightFeatureUsage(featureId) {
    // Remove existing highlights
    document.querySelectorAll('.baseline-highlight').forEach(el => {
      el.classList.remove('baseline-highlight');
      el.removeAttribute('data-baseline-feature');
    });

    // Add highlighting styles
    if (!document.getElementById('baseline-highlight-styles')) {
      const style = document.createElement('style');
      style.id = 'baseline-highlight-styles';
      style.textContent = `
        .baseline-highlight {
          outline: 2px solid #ff6b00 !important;
          outline-offset: 2px !important;
          position: relative !important;
        }
        .baseline-highlight::after {
          content: 'Baseline: ' attr(data-baseline-feature);
          position: absolute;
          top: -25px;
          left: 0;
          background: #ff6b00;
          color: white;
          padding: 2px 6px;
          font-size: 12px;
          border-radius: 3px;
          z-index: 10000;
          pointer-events: none;
        }
      `;
      document.head.appendChild(style);
    }

    // Highlight based on feature ID
    this.highlightSpecificFeature(featureId);
  }

  highlightSpecificFeature(featureId) {
    switch (featureId) {
      case 'css-grid':
        document.querySelectorAll('*').forEach(el => {
          const style = getComputedStyle(el);
          if (style.display === 'grid' || style.display === 'inline-grid') {
            el.classList.add('baseline-highlight');
            el.setAttribute('data-baseline-feature', 'CSS Grid');
          }
        });
        break;

      case 'flexbox':
        document.querySelectorAll('*').forEach(el => {
          const style = getComputedStyle(el);
          if (style.display === 'flex' || style.display === 'inline-flex') {
            el.classList.add('baseline-highlight');
            el.setAttribute('data-baseline-feature', 'Flexbox');
          }
        });
        break;

      case 'css-transforms':
        document.querySelectorAll('*').forEach(el => {
          const style = getComputedStyle(el);
          if (style.transform && style.transform !== 'none') {
            el.classList.add('baseline-highlight');
            el.setAttribute('data-baseline-feature', 'CSS Transform');
          }
        });
        break;

      default:
        console.log(`Highlighting not implemented for feature: ${featureId}`);
    }
  }

  // === Cleanup ===
  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    clearTimeout(this.reanalyzeTimeout);
  }
}

// Initialize detector
let detector;

// Wait for DOM to be ready before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    detector = new BaselineFeatureDetector();
  });
} else {
  detector = new BaselineFeatureDetector();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (detector) {
    detector.cleanup();
  }
});
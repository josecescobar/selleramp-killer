import { render } from 'preact';
import { extractASIN } from './extraction/asin';
import { createShadowContainer } from './shadow';
import { OverlayBadge } from './components/OverlayBadge';

let currentAsin: string | null = null;
let currentHost: HTMLElement | null = null;

function init() {
  const asin = extractASIN();
  if (!asin || asin === currentAsin) return;

  // Remove old badge before creating a new one
  if (currentHost) {
    currentHost.remove();
    currentHost = null;
  }
  currentAsin = asin;

  const { shadow, host } = createShadowContainer();
  currentHost = host;
  const mountPoint = document.createElement('div');
  shadow.appendChild(mountPoint);

  // Render with loading state
  render(<OverlayBadge asin={asin} loading={true} />, mountPoint);

  // Request analysis from service worker
  chrome.runtime.sendMessage(
    {
      type: 'ANALYZE_PRODUCT',
      asin,
      marketplace: 'ATVPDKIKX0DER',
      url: location.href,
    },
    (response) => {
      if (response?.success && response.data) {
        const score = response.data.dealScore?.score ?? response.data.score;
        render(
          <OverlayBadge asin={asin} score={score} />,
          mountPoint,
        );
      } else {
        console.warn('[SourceTool] Analysis failed:', response?.error);
        render(<OverlayBadge asin={asin} />, mountPoint);
      }
    },
  );
}

// Run on initial page load
init();

// SPA navigation detection (Amazon uses History API pushState)
let lastUrl = location.href;
const observer = new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    init();
  }
});
observer.observe(document.querySelector('title') || document.head, {
  childList: true,
  subtree: true,
  characterData: true,
});

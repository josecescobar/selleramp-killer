import { OVERLAY_CONTAINER_ID } from '@shared/constants';

/**
 * Creates a Shadow DOM container for the SourceTool overlay.
 * Complete style isolation from Amazon's CSS via :host { all: initial }.
 */
export function createShadowContainer(): ShadowRoot {
  // Remove existing container (SPA navigation)
  const existing = document.getElementById(OVERLAY_CONTAINER_ID);
  if (existing) existing.remove();

  const host = document.createElement('div');
  host.id = OVERLAY_CONTAINER_ID;
  host.style.cssText = `
    position: fixed !important;
    bottom: 20px !important;
    right: 20px !important;
    z-index: 2147483647 !important;
    all: initial !important;
  `;

  document.body.appendChild(host);

  const shadow = host.attachShadow({ mode: 'open' });

  const style = document.createElement('style');
  style.textContent = `
    :host {
      all: initial;
      font-family: 'DM Sans', 'Segoe UI', system-ui, sans-serif;
      font-size: 14px;
      color: #e8eaf0;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
  `;
  shadow.appendChild(style);

  return shadow;
}

import { handleMessage } from './messaging';

// Open side panel when toolbar icon is clicked
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch(() => {});

// Auto-set API key from build-time env on install (dev convenience)
const BUILT_IN_API_KEY = import.meta.env.VITE_RAINFOREST_API_KEY as
  | string
  | undefined;

chrome.runtime.onInstalled.addListener(() => {
  if (BUILT_IN_API_KEY) {
    chrome.storage.local.get('settings:apiKey', (result) => {
      if (!result['settings:apiKey']) {
        chrome.storage.local.set({ 'settings:apiKey': BUILT_IN_API_KEY });
        console.log('[SourceTool] API key set from env');
      }
    });
  }
});

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender, sendResponse);
  return true; // Keep channel open for async responses
});

// Keep-alive alarm (prevents premature SW termination during active operations)
chrome.alarms.create('keepAlive', { periodInMinutes: 0.4 });
chrome.alarms.onAlarm.addListener(() => {});

console.log('[SourceTool] Service worker initialized');

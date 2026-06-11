const RAINFOREST_KEY = 'sourcetool_rainforest_key';
const ANTHROPIC_KEY = 'sourcetool_anthropic_key';
const KEEPA_KEY = 'sourcetool_keepa_key';

function readKey(name: string): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(name);
}

function writeKey(name: string, value: string): void {
  if (typeof window === 'undefined') return;
  if (value) window.localStorage.setItem(name, value);
  else window.localStorage.removeItem(name);
}

export function getRainforestKey(): string | null {
  return readKey(RAINFOREST_KEY);
}

export function getAnthropicKey(): string | null {
  return readKey(ANTHROPIC_KEY);
}

export function getKeepaKey(): string | null {
  return readKey(KEEPA_KEY);
}

export function setRainforestKey(value: string): void {
  writeKey(RAINFOREST_KEY, value);
}

export function setAnthropicKey(value: string): void {
  writeKey(ANTHROPIC_KEY, value);
}

export function setKeepaKey(value: string): void {
  writeKey(KEEPA_KEY, value);
}

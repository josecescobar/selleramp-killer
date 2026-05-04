import Anthropic from '@anthropic-ai/sdk';
import type { ExtractionResult } from '../types/batch';
import { EXTRACTION_SYSTEM_PROMPT } from './prompt';
import { parseExtractionJson } from './parse';

const MODEL = 'claude-haiku-4-5-20251001';

export interface ExtractOpts {
  apiKey: string;
  signal?: AbortSignal;
}

export interface PreparedImage {
  /** base64-encoded image data, no data: URL prefix. */
  base64: string;
  /** image/jpeg, image/png, image/webp, or image/gif. */
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
}

/**
 * Run Claude vision on a single image; returns null when nothing is detectable
 * or when the response can't be parsed. Never throws on parse failure — only
 * on transport/auth errors so the orchestrator can mark the item failed vs.
 * skipped.
 */
export async function extractFromImage(
  image: PreparedImage,
  opts: ExtractOpts,
): Promise<ExtractionResult | null> {
  const client = new Anthropic({
    apiKey: opts.apiKey,
    dangerouslyAllowBrowser: true,
  });

  const message = await client.messages.create(
    {
      model: MODEL,
      max_tokens: 256,
      system: [
        {
          type: 'text',
          text: EXTRACTION_SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: image.mediaType,
                data: image.base64,
              },
            },
            {
              type: 'text',
              text: 'Extract per the schema.',
            },
          ],
        },
      ],
    },
    opts.signal ? { signal: opts.signal } : undefined,
  );

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') return null;
  return parseExtractionJson(textBlock.text);
}

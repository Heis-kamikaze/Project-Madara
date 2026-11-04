import { env } from '../../config/env';
import { logger } from '../../lib/logger';
import type { SupportMessage } from '../../types/models';

const SYSTEM_PROMPT = `You are the customer support assistant for Aradam, a Nigerian crochet fashion house.
You can help with: how ordering works, limited-time collections (once a collection's window ends or it sells out it moves to the archive and can no longer be ordered), booking a consultation for a custom piece or measurements, the private digital closet, authenticating a piece by scanning the QR code in its packaging, and general questions about the brand.
Rules:
- You cannot see orders, payments, accounts or inventory. Never invent order status, prices, delivery dates or policies you were not given.
- Pieces inside a collection have fixed colours and designs. Changes to colour or design are only possible through a consultation, which makes the piece a custom piece.
- If you cannot help, or the customer asks for a person, say that you will pass them to the Aradam team.
- Reply in 2 to 4 short, warm, plain-language sentences.`;

export const aiAvailable = (): boolean => env.SUPPORT_AI_ENABLED && !!env.ANTHROPIC_API_KEY;

type Turn = { role: 'user' | 'assistant'; content: string };

/** Maps chat history to alternating user/assistant turns that start and end with the customer. */
export function toTurns(history: Pick<SupportMessage, 'sender' | 'text'>[]): Turn[] {
  const turns: Turn[] = [];
  for (const m of history) {
    if (m.sender === 'system') continue;
    const role: Turn['role'] = m.sender === 'user' ? 'user' : 'assistant';
    const last = turns[turns.length - 1];
    if (last && last.role === role) last.content += `\n${m.text}`;
    else turns.push({ role, content: m.text });
  }
  while (turns.length && turns[0].role !== 'user') turns.shift();
  while (turns.length && turns[turns.length - 1].role !== 'user') turns.pop();
  return turns;
}

/** Returns the assistant's reply, or null if the AI is disabled or the call fails (caller falls back to a human). */
export async function generateReply(history: Pick<SupportMessage, 'sender' | 'text'>[]): Promise<string | null> {
  if (!aiAvailable()) return null;
  const messages = toTurns(history);
  if (messages.length === 0) return null;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.ANTHROPIC_API_KEY as string,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({ model: env.SUPPORT_AI_MODEL, max_tokens: 400, system: SYSTEM_PROMPT, messages }),
    });
    if (!res.ok) {
      logger.warn(`Support AI request failed with status ${res.status}`);
      return null;
    }
    const json = (await res.json()) as { content?: { type: string; text?: string }[] };
    const text = (json.content ?? [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text ?? '')
      .join('')
      .trim();
    return text || null;
  } catch (err) {
    logger.warn('Support AI request threw', err);
    return null;
  }
}

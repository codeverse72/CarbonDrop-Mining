/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const BOT_TOKEN = '9177042877:AAFVfBAd0JPz29zCKTGPK0hM3WjANA3NGcE';
export const BOT_USERNAME = 'carbondrop_bot';
export const DEFAULT_ADMIN_CHAT_ID = '8441612063'; // User's real Telegram ID

export interface InlineBtn {
  text: string;
  url?: string;
  web_app?: { url: string };
}

export async function sendTelegramMessage(
  chatId: string | number,
  text: string,
  buttons?: InlineBtn[][]
) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const body: any = {
    chat_id: String(chatId),
    text,
    parse_mode: 'HTML',
  };

  if (buttons && buttons.length > 0) {
    body.reply_markup = {
      inline_keyboard: buttons,
    };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return await res.json();
}

export async function sendTelegramProof(channelUsername: string, text: string) {
  try {
    const res = await sendTelegramMessage(channelUsername, text);
    if (res.ok) return { success: true, res };
    // If bot isn't admin in the channel yet, send proof to admin as test delivery
    const fallbackRes = await sendTelegramMessage(DEFAULT_ADMIN_CHAT_ID, `<b>[PROOF POST DISPATCH]</b>\nTarget: ${channelUsername}\n\n${text}`);
    return { success: true, fallback: true, res: fallbackRes };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

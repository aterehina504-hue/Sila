const AI_ENDPOINT = '/api/chat';
const WALLPAPER_ENDPOINT = '/api/generate-wallpaper';

const API_ERROR_MESSAGES = {
  ai_not_configured: 'AI пока не настроен на сервере. Добавь AI_API_KEY в окружение и перезапусти сервер.',
  ai_provider_error: 'AI вернул ошибку. Проверь ключ API и доступ к модели.',
  ai_unavailable: 'Сейчас не удаётся связаться с AI. Попробуй ещё раз чуть позже.',
};

const WALLPAPER_ERROR_MESSAGES = {
  ai_not_configured: 'AI пока не настроен на сервере. Добавь AI_API_KEY в окружение и перезапусти сервер',
  invalid_wallpaper_payload: 'Не удалось прочитать запись дня. Проверь заполненные поля',
  wallpaper_phrase_failed: 'Не удалось создать фразу для обоев. Попробуй ещё раз',
  wallpaper_image_failed: 'Не удалось создать изображение. Попробуй ещё раз',
  wallpaper_generation_failed: 'Сейчас не удаётся создать обои. Попробуй ещё раз чуть позже',
};

export async function sendMessageToAI({ guideId, message, history = [], context = {} }) {
  const messages = history.map((item) => ({
    role: item.role === 'assistant' ? 'assistant' : 'user',
    content: item.text,
  }));
  messages.push({ role: 'user', content: message });

  const response = await fetch(AI_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guideId, messages, context }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(API_ERROR_MESSAGES[result.error] ?? 'Не удалось получить ответ от AI. Попробуй ещё раз.');
  }

  if (typeof result.text !== 'string' || !result.text.trim()) {
    throw new Error('AI вернул пустой ответ. Попробуй ещё раз.');
  }

  return result.text.trim();
}

export async function generateWallpaper({ mood, journalText = '', gratitudes = [] }) {
  const response = await fetch(WALLPAPER_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mood, journalText, gratitudes }),
  });

  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(WALLPAPER_ERROR_MESSAGES[result.error] ?? 'Не удалось создать обои. Попробуй ещё раз');
  }

  if (typeof result.imageUrl !== 'string' || !result.imageUrl || typeof result.phrase !== 'string' || !result.phrase) {
    throw new Error('Сервер вернул неполный результат генерации обоев');
  }

  return { imageUrl: result.imageUrl, phrase: result.phrase };
}
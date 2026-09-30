import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createAppServer } from '../server.mjs';

const upstreamCalls = [];
let apiKey = 'test-only-key';

const server = createAppServer({
  getApiKey: () => apiKey,
  fetchImpl: async (url, options) => {
    upstreamCalls.push({ url, options });
    if (url.endsWith('/images/generations')) {
      return Response.json({ data: [{ url: 'https://images.example.test/wallpaper.png' }] });
    }
    const requestBody = JSON.parse(options.body);
    if (requestBody.messages?.[0]?.content.includes('аффирмацию')) {
      return Response.json({ choices: [{ message: { content: 'Тебе можно заботиться о себе' } }] });
    }
    return Response.json({
      choices: [{ message: { content: 'Я слышу тебя. Давай начнём с того, что сейчас важнее всего.' } }],
    });
  },
});

let baseUrl;

before(async () => {
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
});

test('проксирует диалог в OpenAI с системным сообщением проводника', async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      guideId: 'nera',
      context: { intentId: 'decision', feelingId: 'thinking' },
      messages: [{ role: 'user', content: 'Я не знаю, как поступить' }],
    }),
  });

  assert.equal(response.status, 200);
  assert.equal((await response.json()).text, 'Я слышу тебя. Давай начнём с того, что сейчас важнее всего.');
  assert.equal(upstreamCalls.length, 1);
  assert.equal(upstreamCalls[0].url, 'https://api.openai.com/v1/chat/completions');
  assert.equal(upstreamCalls[0].options.headers.Authorization, 'Bearer test-only-key');

  const requestBody = JSON.parse(upstreamCalls[0].options.body);
  assert.match(requestBody.messages[0].content, /Ты — Нера/);
  assert.equal(requestBody.messages[1].content, 'Я не знаю, как поступить');
});

test('использует отдельный стиль ответа для каждого проводника', async () => {
  const guidePrompts = [
    { guideId: 'leya', expectedInstruction: 'разговорно, мягко и безоценочно' },
    { guideId: 'elira', expectedInstruction: 'конкретные короткие практики' },
    { guideId: 'nera', expectedInstruction: 'смелые, точные вопросы' },
  ];

  for (const { guideId, expectedInstruction } of guidePrompts) {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        guideId,
        messages: [{ role: 'user', content: 'Хочу поговорить' }],
      }),
    });

    assert.equal(response.status, 200);
    const requestBody = JSON.parse(upstreamCalls.at(-1).options.body);
    assert.ok(requestBody.messages[0].content.includes(expectedInstruction));
  }
});

test('возвращает понятный статус, когда серверный API-ключ не задан', async () => {
  apiKey = '';
  const callsBeforeRequest = upstreamCalls.length;

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      guideId: 'leya',
      messages: [{ role: 'user', content: 'Мне тяжело' }],
    }),
  });

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), { error: 'ai_not_configured' });
  assert.equal(upstreamCalls.length, callsBeforeRequest);
  apiKey = 'test-only-key';
});

test('отклоняет неверный формат чата', async () => {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ guideId: 'unknown', messages: [] }),
  });

  assert.equal(response.status, 400);
  assert.deepEqual(await response.json(), { error: 'invalid_chat_payload' });
});

test('раздаёт главную страницу приложения', async () => {
  const response = await fetch(baseUrl);

  assert.equal(response.status, 200);
  assert.match(await response.text(), /Точка силы в тебе/);
});

test('создаёт аффирмацию и запрашивает вертикальные обои', async () => {
  const response = await fetch(`${baseUrl}/api/generate-wallpaper`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mood: 'Спокойствие',
      journalText: 'Сегодня я нашла немного времени для себя',
      gratitudes: ['За близких', 'За тихий вечер'],
    }),
  });

  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.imageUrl, 'https://images.example.test/wallpaper.png');
  assert.ok(result.phrase.split(/\s+/).length <= 6);

  const [phraseCall, imageCall] = upstreamCalls.slice(-2);
  assert.equal(phraseCall.url, 'https://api.openai.com/v1/chat/completions');
  assert.equal(JSON.parse(phraseCall.options.body).model, 'gpt-4o-mini');
  assert.match(JSON.parse(phraseCall.options.body).messages[1].content, /За близких/);
  assert.equal(imageCall.url, 'https://api.openai.com/v1/images/generations');
  const imagePayload = JSON.parse(imageCall.options.body);
  assert.equal(imagePayload.model, 'dall-e-3');
  assert.equal(imagePayload.size, '1024x1792');
  assert.ok(imagePayload.prompt.includes(result.phrase));
});
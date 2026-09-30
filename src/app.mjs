import {
  FEELING_OPTIONS,
  GUIDES,
  INTENT_OPTIONS,
  getGuide,
  recommendGuide,
} from './guides.mjs';
import { LocalConversationRepository } from './conversationRepository.mjs';
import { demoAssistantClient } from './assistantClient.mjs';

const appRoot = document.querySelector('#app');
const conversationRepository = new LocalConversationRepository();

const state = {
  screen: 'welcome',
  intentId: null,
  feelingId: null,
  guideId: null,
  showAlternatives: false,
  conversation: null,
  typing: false,
};

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function focusHeading() {
  window.scrollTo({ top: 0, behavior: 'auto' });
  appRoot.querySelector('[data-focus]')?.focus({ preventScroll: true });
}

function renderHeader(backLabel = 'Назад') {
  return `
    <header class="app-header">
      <div class="brand-lockup" aria-label="Точка силы в тебе">
        <span class="brand-lockup__symbol" aria-hidden="true"></span>
        <span>Точка силы <em>в тебе</em></span>
      </div>
      <button class="back-button" type="button" data-action="back">
        <span class="back-button__arrow" aria-hidden="true"></span>
        <span>${escapeHTML(backLabel)}</span>
      </button>
    </header>`;
}

function renderWelcome() {
  return `
    <section class="welcome-screen" aria-labelledby="welcome-title">
      <div class="welcome-screen__portrait">
        <img
          src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1800&q=85"
          alt="Спокойный портрет женщины в мягком дневном свете"
          fetchpriority="high"
        />
      </div>
      <div class="welcome-screen__content">
        <p class="eyebrow"><span class="eyebrow__dot" aria-hidden="true"></span> тихое место внутри</p>
        <h1 id="welcome-title" data-focus tabindex="-1">Точка силы <em>в тебе</em></h1>
        <p class="welcome-screen__subtitle">Здесь не нужно быть готовой.</p>
        <p class="welcome-screen__description">Можно просто прийти такой, какая ты есть.</p>
        <button class="primary-button welcome-screen__start" type="button" data-action="start">
          <span>Начать</span><span class="button-arrow" aria-hidden="true"></span>
        </button>
        <p class="welcome-screen__note">в своём ритме · без правильных ответов</p>
      </div>
      <span class="welcome-screen__sunlight" aria-hidden="true"></span>
    </section>`;
}

function renderChoices(options, action) {
  return `
    <div class="choice-list">
      ${options.map((option) => `
        <button class="choice-button" type="button" data-action="${action}" data-option="${option.id}">
          <span>${escapeHTML(option.label)}</span>
          <span class="choice-button__mark" aria-hidden="true"></span>
        </button>`).join('')}
    </div>`;
}

function renderQuestion({ title, options, action, step }) {
  return `
    <section class="onboarding-screen" aria-labelledby="question-title">
      ${renderHeader()}
      <div class="onboarding-screen__content">
        <p class="eyebrow"><span class="eyebrow__dot" aria-hidden="true"></span> знакомство · можно без спешки</p>
        <div class="progress-trail" aria-label="Знакомство">
          <span class="${step >= 1 ? 'is-active' : ''}"></span>
          <span class="${step >= 2 ? 'is-active' : ''}"></span>
        </div>
        <h1 id="question-title" class="question-title" data-focus tabindex="-1">${title}</h1>
        <p class="question-hint">Выбери то, что сейчас ближе. Можно не искать идеальный ответ.</p>
        ${renderChoices(options, action)}
      </div>
    </section>`;
}

function renderAlternativeGuides() {
  const currentGuide = getGuide(state.guideId);
  const alternativeGuides = GUIDES.filter((guide) => guide.id !== currentGuide.id);

  return `
    <div class="alternative-guides" id="alternative-guides">
      <p class="alternative-guides__title">Выбери тот голос, который тебе ближе</p>
      <div class="alternative-guides__list">
        ${alternativeGuides.map((guide) => `
          <button class="guide-choice ${state.guideId === guide.id ? 'is-selected' : ''}" type="button" data-action="select-guide" data-guide="${guide.id}" aria-pressed="${state.guideId === guide.id}">
            <span class="guide-choice__avatar avatar--${guide.color}" aria-hidden="true">${guide.initials}</span>
            <span class="guide-choice__copy">
              <span class="guide-choice__name">${guide.name}</span>
              <span class="guide-choice__description">${guide.description}</span>
            </span>
            <span class="guide-choice__check" aria-hidden="true"></span>
          </button>`).join('')}
      </div>
    </div>`;
}

function renderRecommendation() {
  const guide = getGuide(state.guideId);

  return `
    <section class="recommendation-screen" aria-labelledby="recommendation-title">
      ${renderHeader()}
      <div class="recommendation-screen__content">
        <p class="eyebrow"><span class="eyebrow__dot" aria-hidden="true"></span> рядом, когда понадобится</p>
        <h1 id="recommendation-title" class="recommendation-title" data-focus tabindex="-1">Мне кажется, сейчас тебе будет легче поговорить с <em>${guide.withName}</em></h1>
        <p class="recommendation-question">Хочешь, я позову её?</p>

        <div class="recommended-guide">
          <span class="guide-avatar avatar--${guide.color}" aria-hidden="true">${guide.initials}</span>
          <div class="recommended-guide__copy">
            <p class="recommended-guide__name">${guide.name}</p>
            <p class="recommended-guide__description">${guide.description}</p>
          </div>
          <span class="recommended-guide__spark" aria-hidden="true"></span>
        </div>

        <button class="primary-button recommendation-screen__invite" type="button" data-action="invite-guide">
          <span>Позвать ${guide.inviteName}</span>
          <span class="button-arrow" aria-hidden="true"></span>
        </button>

        <button class="secondary-action" type="button" data-action="toggle-alternatives" aria-expanded="${state.showAlternatives}" aria-controls="alternative-guides">
          ${state.showAlternatives ? 'Скрыть других проводников' : 'Посмотреть других проводников'}
          <span class="secondary-action__chevron ${state.showAlternatives ? 'is-open' : ''}" aria-hidden="true"></span>
        </button>
        ${state.showAlternatives ? renderAlternativeGuides() : ''}
      </div>
    </section>`;
}

function renderChatMessages() {
  const guide = getGuide(state.conversation.guideId);

  return `
    <div class="chat-messages" role="log" aria-label="Переписка с ${guide.name}" aria-live="polite" aria-relevant="additions">
      ${state.conversation.messages.map((message) => `
        <article class="message message--${message.role === 'user' ? 'user' : 'guide'}">
          ${message.role === 'assistant' ? `<span class="message__avatar avatar--${guide.color}" aria-hidden="true">${guide.initials}</span>` : ''}
          <p class="message__bubble">${escapeHTML(message.text)}</p>
        </article>`).join('')}
      ${state.typing ? `
        <div class="message message--guide message--typing" aria-label="${guide.name} печатает">
          <span class="message__avatar avatar--${guide.color}" aria-hidden="true">${guide.initials}</span>
          <div class="typing-bubble"><span></span><span></span><span></span><span class="typing-label">печатает…</span></div>
        </div>` : ''}
    </div>`;
}

function renderChat() {
  const guide = getGuide(state.conversation.guideId);

  return `
    <section class="chat-screen" aria-label="Переписка с ${guide.name}">
      <header class="chat-header">
        <button class="back-button chat-header__back" type="button" data-action="back" aria-label="Вернуться к выбору проводника">
          <span class="back-button__arrow" aria-hidden="true"></span>
        </button>
        <span class="guide-avatar guide-avatar--small avatar--${guide.color}" aria-hidden="true">${guide.initials}</span>
        <div class="chat-header__identity">
          <p class="chat-header__name">${guide.name}</p>
          <p class="chat-header__status"><span></span> твой проводник</p>
        </div>
        <span class="chat-header__demo">демо-режим</span>
      </header>

      <div class="chat-context">
        <span class="chat-context__mark" aria-hidden="true"></span>
        Настоящий AI пока не подключён. Переписка хранится только в этом браузере.
      </div>

      ${renderChatMessages()}

      <form class="composer" data-form="message">
        <label class="sr-only" for="message-input">Сообщение проводнику</label>
        <textarea
          id="message-input"
          class="composer__input"
          name="message"
          rows="1"
          placeholder="Напиши всё, как есть…"
          ${state.typing ? 'disabled' : ''}
        ></textarea>
        <button class="composer__send" type="submit" aria-label="Отправить сообщение" ${state.typing ? 'disabled' : ''}>
          <span class="send-arrow" aria-hidden="true"></span>
        </button>
      </form>
      <p class="chat-footnote">здесь можно говорить своим голосом</p>
    </section>`;
}

function render({ focus = false } = {}) {
  const screens = {
    welcome: renderWelcome,
    intent: () => renderQuestion({
      title: 'Если сегодня можно было бы ничего не держать в себе…<br><span>что тебе сейчас нужнее всего?</span>',
      options: INTENT_OPTIONS,
      action: 'choose-intent',
      step: 1,
    }),
    feeling: () => renderQuestion({
      title: 'А если совсем честно…<br><span>что сейчас ближе?</span>',
      options: FEELING_OPTIONS,
      action: 'choose-feeling',
      step: 2,
    }),
    recommendation: renderRecommendation,
    chat: renderChat,
  };

  appRoot.innerHTML = screens[state.screen]();

  if (focus) focusHeading();
}

function makeConversationId() {
  return globalThis.crypto?.randomUUID?.() ?? `conversation-${Date.now()}`;
}

function inviteGuide() {
  const guide = getGuide(state.guideId);

  if (state.conversation?.guideId === guide.id) {
    state.screen = 'chat';
    render();
    return;
  }

  state.conversation = {
    id: makeConversationId(),
    guideId: guide.id,
    context: {
      intentId: state.intentId,
      feelingId: state.feelingId,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: makeConversationId(),
        role: 'assistant',
        text: 'Привет. Я рядом, и мы можем идти в твоём темпе.',
        source: 'demo-greeting',
        createdAt: new Date().toISOString(),
      },
    ],
  };

  conversationRepository.save(state.conversation);
  state.screen = 'chat';
  render();
}

function goBack() {
  const previousScreen = {
    intent: 'welcome',
    feeling: 'intent',
    recommendation: 'feeling',
    chat: 'recommendation',
  }[state.screen];

  if (!previousScreen) return;
  state.screen = previousScreen;
  render({ focus: true });
}

appRoot.addEventListener('click', (event) => {
  const actionButton = event.target.closest('[data-action]');
  if (!actionButton) return;

  const { action, option, guide } = actionButton.dataset;

  if (action === 'start') {
    state.intentId = null;
    state.feelingId = null;
    state.guideId = null;
    state.conversation = null;
    state.showAlternatives = false;
    state.screen = 'intent';
    render({ focus: true });
  } else if (action === 'back') {
    goBack();
  } else if (action === 'choose-intent') {
    state.intentId = option;
    state.screen = 'feeling';
    render({ focus: true });
  } else if (action === 'choose-feeling') {
    state.feelingId = option;
    state.guideId = recommendGuide(state.intentId, state.feelingId).id;
    state.screen = 'recommendation';
    render({ focus: true });
  } else if (action === 'toggle-alternatives') {
    state.showAlternatives = !state.showAlternatives;
    render();
    appRoot.querySelector('[data-action="toggle-alternatives"]')?.focus();
  } else if (action === 'select-guide') {
    state.guideId = guide;
    render();
  } else if (action === 'invite-guide') {
    inviteGuide();
  }
});

appRoot.addEventListener('submit', async (event) => {
  if (event.target.dataset.form !== 'message') return;
  event.preventDefault();

  const input = event.target.elements.message;
  const text = input.value.trim();
  if (!text || state.typing || !state.conversation) return;

  const timestamp = new Date().toISOString();
  state.conversation.messages.push({
    id: makeConversationId(),
    role: 'user',
    text,
    createdAt: timestamp,
  });
  state.conversation.updatedAt = timestamp;
  state.typing = true;
  conversationRepository.save(state.conversation);
  render();

  try {
    const response = await demoAssistantClient.sendMessage({
      guide: getGuide(state.conversation.guideId),
      history: state.conversation.messages,
      context: state.conversation.context,
    });

    state.conversation.messages.push({
      id: makeConversationId(),
      role: 'assistant',
      text: response.text,
      source: response.source,
      createdAt: new Date().toISOString(),
    });
  } finally {
    state.typing = false;
    state.conversation.updatedAt = new Date().toISOString();
    conversationRepository.save(state.conversation);
    if (state.screen === 'chat') {
      render();
      appRoot.querySelector('.composer__input')?.focus();
    }
  }
});

appRoot.addEventListener('keydown', (event) => {
  if (!event.target.matches('.composer__input')) return;

  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    event.target.form.requestSubmit();
  }
});

appRoot.addEventListener('input', (event) => {
  if (!event.target.matches('.composer__input')) return;
  event.target.style.height = 'auto';
  event.target.style.height = `${Math.min(event.target.scrollHeight, 152)}px`;
});

render();
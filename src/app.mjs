import { getGuide } from './guides.mjs';
import { LocalConversationRepository } from './conversationRepository.mjs';
import { generateWallpaper, sendMessageToAI } from './assistantClient.mjs';

const appRoot = document.querySelector('#app');
const navigationRoot = document.querySelector('#app-navigation');
const conversationRepository = new LocalConversationRepository();

const GUIDE_PRESENTATION = [
  {
    id: 'leya',
    symbol: '🌿',
    role: 'Тепло и диалог',
    subtitle: 'Разговор по душам без оценки',
    description: 'Бережно выслушает, поддержит и поможет сбросить эмоциональный груз',
    intentId: 'understood',
    feelingId: 'heavy',
    prompts: ['Хочу выговориться', 'Мне нужна поддержка', 'Побудь рядом'],
  },
  {
    id: 'elira',
    symbol: '🌸',
    role: 'Практика реализации',
    subtitle: 'Поиск своего пути и предназначения',
    description: 'Поможет прояснить желания и найти конкретный шаг к своему потенциалу',
    intentId: 'wants',
    feelingId: 'lost',
    prompts: ['Хочу понять, чего я хочу', 'Помоги найти мой путь', 'С чего начать'],
  },
  {
    id: 'nera',
    symbol: '🔥',
    role: 'Теневая сила',
    subtitle: 'Практика проявления и внутренних блоков',
    description: 'Поможет бережно исследовать страх проявления, стыд и скрытую силу',
    intentId: 'decision',
    feelingId: 'secret',
    prompts: ['Боюсь проявиться', 'Хочу понять, что меня сдерживает', 'Хочу стать смелее'],
  },
];

const GOALS = [
  { id: 'heard', icon: '◌', label: 'Мне тяжело / Нужно выговориться', guideId: 'leya', intentId: 'understood', feelingId: 'heavy' },
  { id: 'path', icon: '✳', label: 'Не знаю, чего хочу / Потеряла путь', guideId: 'elira', intentId: 'wants', feelingId: 'lost' },
  { id: 'visible', icon: '✧', label: 'Хочу проявить силу / Убрать блоки', guideId: 'nera', intentId: 'decision', feelingId: 'secret' },
];

const NAV_ITEMS = [
  { id: 'home', icon: '<svg viewBox="0 0 24 24"><path d="m3.5 10 8.5-7 8.5 7v10.5h-6v-6h-5v6h-6z" /></svg>', label: 'Главная' },
  { id: 'practices', icon: '<svg viewBox="0 0 24 24"><path d="M12 3.2c1.8 2.7 1.8 5.1 0 7.2-1.8-2.1-1.8-4.5 0-7.2Zm8.1 5.1c-.8 3.1-2.5 4.7-5.3 4.8.5-2.7 2.3-4.3 5.3-4.8ZM19 18.1c-3.1.4-5.2-.7-6.2-3.3 2.7-.8 4.8.3 6.2 3.3ZM5 18.1c1.4-3 3.5-4.1 6.2-3.3-1 2.6-3.1 3.7-6.2 3.3ZM3.9 8.3c3 .5 4.8 2.1 5.3 4.8-2.8-.1-4.5-1.7-5.3-4.8ZM12 10.4v10.4" /></svg>', label: 'Практики' },
  { id: 'guides', icon: '<svg viewBox="0 0 24 24"><path d="m12 2.5 1.7 7.1 7.1 2.4-7.1 1.8-1.7 7.7-1.8-7.7-7.1-1.8 7.1-2.4L12 2.5Z" /></svg>', label: 'Проводники' },
  { id: 'journal', icon: '<svg viewBox="0 0 24 24"><path d="M6 3.5h12a2 2 0 0 1 2 2v15H7a3 3 0 0 1-3-3v-12a2 2 0 0 1 2-2Zm1 0v14a3 3 0 0 0 3 3M9 8h7m-7 4h7" /></svg>', label: 'Дневник' },
  { id: 'profile', icon: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c.8-4 3.3-6 7.5-6s6.7 2 7.5 6" /></svg>', label: 'Профиль' },
];

const PRACTICES = [
  {
    id: 'breath',
    icon: '<path d="M3 8h8c3 0 3-4 0-4M3 12h13c4 0 4 6 0 6M3 16h6c3 0 3 4 0 4" />',
    title: 'Дыхание 4-7-8',
    description: '3 минуты · Снятие тревоги',
    duration: 180,
    category: 'anxiety',
    animation: 'breathing-478',
    phases: [
      { seconds: 4, text: 'Вдох' },
      { seconds: 7, text: 'Задержи дыхание' },
      { seconds: 8, text: 'Выдох' },
    ],
  },
  {
    id: 'letting-go',
    icon: '<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5M4 4v4.5h4.5M12 7v5l3 2" />',
    title: 'Отпускание контроля',
    description: '7 минут · Медитация',
    duration: 420,
    category: 'sleep',
    animation: 'breathing-focus',
    phases: [
      { seconds: 10, text: 'Сосредоточься на дыхании' },
      { seconds: 10, text: 'Отпусти контроль над мыслями' },
      { seconds: 10, text: 'Почувствуй опору под собой' },
    ],
  },
  {
    id: 'tension',
    icon: '<path d="M12 3c-2 4-6 7-6 12a6 6 0 0 0 12 0c0-5-4-8-6-12Zm-2 12a3 3 0 0 0 3 3" />',
    title: 'Сброс напряжения',
    description: '5 минут · Телесная практика',
    duration: 300,
    category: 'strength',
    animation: 'breathing-tension',
    phases: [
      { seconds: 5, text: 'Напряги плечи на 5 секунд' },
      { seconds: 5, text: 'Полностью расслабь и сбрось' },
      { seconds: 10, text: 'Почувствуй тепло в теле' },
    ],
  },
  {
    id: 'return',
    icon: '<path d="M12 3c1.8 2.7 1.8 5.1 0 7.2-1.8-2.1-1.8-4.5 0-7.2Zm8.1 5.1c-.8 3.1-2.5 4.7-5.3 4.8.5-2.7 2.3-4.3 5.3-4.8ZM19 18.1c-3.1.4-5.2-.7-6.2-3.3 2.7-.8 4.8.3 6.2 3.3ZM5 18.1c1.4-3 3.5-4.1 6.2-3.3-1 2.6-3.1 3.7-6.2 3.3ZM12 10.4v10.4" />',
    title: 'Возвращение к себе',
    description: '10 минут · Визуализация',
    duration: 600,
    category: 'focus',
    animation: 'breathing-return',
    phases: [
      { seconds: 12, text: 'Заметь дыхание и расслабься' },
      { seconds: 12, text: 'Представь свет внутри себя' },
      { seconds: 12, text: 'Замедлись' },
    ],
  },
];

const PRACTICE_FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'anxiety', label: 'Тревога' },
  { id: 'focus', label: 'Фокус' },
  { id: 'sleep', label: 'Сон' },
  { id: 'strength', label: 'Сила' },
];

const DAILY_JOURNAL_KEY = 'sila-daily-journal';

const MOODS = [
  { id: 'calm', label: 'Спокойствие', symbol: '☾', tone: 'calm' },
  { id: 'joy', label: 'Радость', symbol: '✧', tone: 'joy' },
  { id: 'tired', label: 'Усталость', symbol: '◌', tone: 'tired' },
  { id: 'anxiety', label: 'Тревога', symbol: '⌁', tone: 'anxiety' },
  { id: 'energy', label: 'Энергия', symbol: '✳', tone: 'energy' },
];

const savedConversations = conversationRepository.list();
const state = {
  screen: 'welcome',
  activeNav: 'home',
  conversation: savedConversations[0] ?? null,
  guideId: savedConversations[0]?.guideId ?? 'leya',
  typing: false,
  chatError: null,
  practiceFilter: 'all',
  activePracticeId: null,
  practiceEndsAt: null,
  practiceStartedAt: null,
  practiceRemaining: 0,
  practiceTimer: null,
  dailyEntry: loadDailyEntry(),
  journalError: '',
  journalGenerating: false,
  wallpaperDataUrl: '',
  wallpaperPhrase: '',
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

function cleanFinalDots(value) {
  return String(value).replace(/[.。…]+\s*$/u, '').trim();
}

function formatTimestamp(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })
    .format(new Date(value));
}

function makeId() {
  return globalThis.crypto?.randomUUID?.() ?? `conversation-${Date.now()}`;
}

function createEmptyDailyEntry(date = getLocalDateKey()) {
  return {
    date,
    moodId: '',
    thoughts: '',
    gratitude: '',
    pleasantMoment: '',
    selfPraise: '',
  };
}

function loadDailyEntry(date = getLocalDateKey()) {
  try {
    const entries = JSON.parse(localStorage.getItem(DAILY_JOURNAL_KEY) ?? '{}');
    return { ...createEmptyDailyEntry(date), ...(entries[date] ?? {}) };
  } catch {
    return createEmptyDailyEntry(date);
  }
}

function saveDailyEntry() {
  try {
    const entries = JSON.parse(localStorage.getItem(DAILY_JOURNAL_KEY) ?? '{}');
    entries[state.dailyEntry.date] = state.dailyEntry;
    localStorage.setItem(DAILY_JOURNAL_KEY, JSON.stringify(entries));
  } catch {}
}

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatPracticeTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function getPracticeCue(practice, elapsedSeconds = 0) {
  const cycleDuration = practice.phases.reduce((total, phase) => total + phase.seconds, 0);
  const cycleSecond = elapsedSeconds % cycleDuration;
  let phaseEnd = 0;
  return practice.phases.find((phase) => {
    phaseEnd += phase.seconds;
    return cycleSecond < phaseEnd;
  })?.text ?? practice.phases[0].text;
}

function getGuidePresentation(guideId) {
  return GUIDE_PRESENTATION.find((guide) => guide.id === guideId) ?? GUIDE_PRESENTATION[0];
}

function renderConductorAvatar(guideId, className = '') {
  const guide = getGuidePresentation(guideId);
  return `<span class="conductor-avatar conductor-avatar--${guideId}${className ? ` ${className}` : ''}" aria-hidden="true"><span class="conductor-avatar__symbol">${guide.symbol}</span></span>`;
}

function renderPracticeOrb(className = '') {
  return `<span class="practice-orb${className ? ` ${className}` : ''}" aria-hidden="true"></span>`;
}

function renderBrand() {
  return `
    <div class="brand" aria-label="Точка силы в тебе">
      <span class="brand__mark" aria-hidden="true">✦</span>
      <span class="brand__name">Точка силы <em>в тебе</em></span>
    </div>`;
}

function renderWelcome() {
  return `
    <section class="flow-screen flow-screen--welcome ${state.screen === 'welcome' ? 'is-active' : ''}" aria-hidden="${state.screen !== 'welcome'}" aria-labelledby="welcome-title">
            <div><h2 id="journal-mood-title">Как ты сегодня?</h2><p>Выбери состояние, которое ближе всего</p></div>
          </div>
          <div class="mood-options" role="group" aria-label="Настроение за сегодня">
            ${MOODS.map((mood) => `
              <button class="mood-chip mood-chip--${mood.tone} ${state.dailyEntry.moodId === mood.id ? 'is-selected' : ''}" type="button" data-action="select-mood" data-mood="${mood.id}" aria-pressed="${state.dailyEntry.moodId === mood.id}">
                <span aria-hidden="true">${mood.symbol}</span>${mood.label}
              </button>`).join('')}
          </div>
          ${state.journalError ? `<p class="journal-error" role="alert">${state.journalError}</p>` : ''}
        </section>

        <section class="journal-section journal-section--gratitude glass-panel" aria-labelledby="journal-gratitude-title">
          <div class="journal-section__heading">
            <span class="journal-section__index">02</span>
            <div><h2 id="journal-gratitude-title">Три хороших момента</h2><p>Маленькое тоже имеет значение</p></div>
          </div>
          <label class="journal-field journal-field--short">
            <span>За что я благодарен(на) сегодня?</span>
            <input type="text" data-journal-field="gratitude" value="${escapeHTML(state.dailyEntry.gratitude)}" autocomplete="off" />
          </label>
          <label class="journal-field journal-field--short">
            <span>Что приятное произошло?</span>
            <input type="text" data-journal-field="pleasantMoment" value="${escapeHTML(state.dailyEntry.pleasantMoment)}" autocomplete="off" />
          </label>
          <label class="journal-field journal-field--short">
            <span>За что я могу похвалить себя?</span>
            <input type="text" data-journal-field="selfPraise" value="${escapeHTML(state.dailyEntry.selfPraise)}" autocomplete="off" />
          </label>
        </section>

        <section class="journal-section journal-section--thoughts glass-panel" aria-labelledby="journal-thoughts-title">
          <div class="journal-section__heading">
            <span class="journal-section__index">03</span>
            <div><h2 id="journal-thoughts-title">Свободные мысли</h2><p>Пиши так, как приходит</p></div>
          </div>
          <label class="sr-only" for="journal-thoughts">Мысли и эмоции за сегодня</label>
          <textarea id="journal-thoughts" class="journal-thoughts" data-journal-field="thoughts" placeholder="Опиши свой день, мысли или эмоции...">${escapeHTML(state.dailyEntry.thoughts)}</textarea>
        </section>
      </div>
      <button class="flow-continue journal-finish" type="button" data-action="finish-day" ${state.journalGenerating ? 'disabled aria-busy="true"' : ''}>
        ${state.journalGenerating ? '<span class="journal-spinner" aria-hidden="true"></span>Создаём обои' : 'Завершить день'}
      </button>
    </main>`;
}

function renderJournalWallpaper() {
  return `
    <main class="section-page wallpaper-page" aria-labelledby="wallpaper-title">
      <header class="flow-heading">
        <p class="section-kicker">ТВОЁ НАПОМИНАНИЕ НА ЗАВТРА</p>
        <h1 id="wallpaper-title">Возьми с собой главное</h1>
        <p class="section-subtitle">Твои слова стали обоями для телефона</p>
      </header>
      <div class="wallpaper-result">
        <div class="wallpaper-preview">
          <img src="${state.wallpaperDataUrl}" alt="Персональные обои с напоминанием: ${escapeHTML(state.wallpaperPhrase)}" />
        </div>
        <div class="wallpaper-result__details">
          <span class="wallpaper-result__sparkle" aria-hidden="true">✦</span>
          <h2>${escapeHTML(state.wallpaperPhrase)}</h2>
          <p>Сохрани это напоминание рядом или вернись к записи, чтобы что-то добавить</p>
          <a class="wallpaper-download" href="${state.wallpaperDataUrl}" download="tochka-sily-${state.dailyEntry.date}.png">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 5-5m-5 5-5-5M4 18v3h16v-3" /></svg>
            Скачать обои PNG
          </a>
          <button class="wallpaper-edit" type="button" data-action="edit-journal">Вернуться к дневнику</button>
        </div>
      </div>
    </main>`;
}

async function finishJournalDay() {
  if (state.journalGenerating) return;
  if (!state.dailyEntry.moodId) {
    state.journalError = 'Выбери настроение, чтобы завершить дневной ритуал';
    render();
    appRoot.querySelector('.journal-section--mood')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    return;
  }

  saveDailyEntry();
  state.journalError = '';
  state.journalGenerating = true;
  render();

  try {
    const mood = MOODS.find((item) => item.id === state.dailyEntry.moodId);
    const wallpaper = await generateWallpaper({
      mood: mood.label,
      journalText: state.dailyEntry.thoughts,
      gratitudes: [state.dailyEntry.gratitude, state.dailyEntry.pleasantMoment, state.dailyEntry.selfPraise]
        .map((value) => value.trim())
        .filter(Boolean),
    });
    state.wallpaperDataUrl = wallpaper.imageUrl;
    state.wallpaperPhrase = wallpaper.phrase;
    state.screen = 'journal-wallpaper';
    state.activeNav = 'journal';
  } catch (error) {
    state.journalError = error instanceof Error ? error.message : 'Не удалось создать обои';
    state.screen = 'journal';
  } finally {
    state.journalGenerating = false;
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function renderProfile() {
  return `
    <main class="section-page" aria-labelledby="profile-title">
      <header class="flow-heading">
        <p class="section-kicker">ТВОЁ ПРОСТРАНСТВО</p>
        <h1 id="profile-title">Профиль</h1>
      </header>
      <section class="section-empty glass-panel">
        <h2>Здесь всё будет о тебе</h2>
        <p>Настройки и личные предпочтения появятся в этом разделе</p>
      </section>
    </main>`;
}

function renderFlow() {
  return `<main class="flow-page">${renderWelcome()}${renderGuides()}${renderGoals()}</main>`;
}

function renderMessages(presentation) {
  const messages = state.conversation.messages ?? [];
  if (!messages.length) {
    return `
      <div class="chat-empty-state">
        ${renderConductorAvatar(presentation.id, 'chat-empty-state__orb')}
        <p>Это пространство для тебя</p>
        <span>Начни с того, что сейчас ближе всего</span>
      </div>
      <div class="chat-suggestions" aria-label="Можно начать так">
        ${presentation.prompts.map((prompt) => `
          <button class="chat-suggestion" type="button" data-action="send-prompt" data-prompt="${escapeHTML(prompt)}" ${state.typing ? 'disabled' : ''}>${prompt}</button>`).join('')}
      </div>`;
  }

  return messages.map((message) => `
    <article class="chat-message chat-message--${message.role === 'user' ? 'user' : 'guide'}">
      ${message.role === 'assistant' ? renderConductorAvatar(presentation.id, 'chat-message__orb') : ''}
      <div class="chat-message__body">
        <p class="chat-message__bubble">${escapeHTML(cleanFinalDots(message.text))}</p>
        <time class="chat-message__time">${formatTimestamp(message.createdAt)}</time>
      </div>
    </article>`).join('');
}

function renderChat() {
  const guide = getGuide(state.conversation.guideId);
  const presentation = getGuidePresentation(guide.id);

  return `
    <main class="chat-page">
      <header class="chat-topbar glass-panel">
        <button class="icon-button" type="button" data-action="go-home" aria-label="На главную"><span aria-hidden="true">←</span></button>
        <div class="chat-topbar__guide">
          ${renderConductorAvatar(guide.id, 'chat-topbar__orb')}
          <span><strong>${guide.name}</strong><small>${presentation.role}</small></span>
        </div>
        <span class="chat-topbar__status"><i></i> рядом</span>
      </header>

      <section class="chat-thread" aria-label="Диалог с ${guide.name}">
        <div class="chat-thread__messages" role="log" aria-live="polite" aria-relevant="additions text">
          ${renderMessages(presentation)}
          ${state.typing ? `
            <div class="chat-message chat-message--guide chat-message--typing" aria-label="${guide.name} печатает">
              ${renderConductorAvatar(guide.id, 'chat-message__orb')}
              <div class="typing-indicator"><i></i><i></i><i></i></div>
            </div>` : ''}
        </div>
        ${state.chatError ? `<p class="chat-error" role="alert">${escapeHTML(cleanFinalDots(state.chatError))}</p>` : ''}
      </section>

      <form class="chat-composer glass-panel" data-form="message">
        <label class="sr-only" for="chat-message">Твоё сообщение</label>
        <textarea id="chat-message" name="message" rows="1" placeholder="Напиши всё, что у тебя на душе" ${state.typing ? 'disabled' : ''}></textarea>
        <button class="send-button" type="submit" aria-label="Отправить сообщение" ${state.typing ? 'disabled' : ''}><span aria-hidden="true">↑</span></button>
      </form>
    </main>`;
}

function renderNavigation() {
  return `
    <nav class="floating-dock glass-panel" aria-label="Основная навигация">
      ${NAV_ITEMS.map((item) => {
        const isActive = state.activeNav === item.id;
        return `
          <button class="dock-item ${isActive ? 'is-active' : ''}" type="button" data-action="navigate" data-tab="${item.id}" ${isActive ? 'aria-current="page"' : ''}>
            <span class="dock-item__icon" aria-hidden="true">${item.icon}</span>
            <span class="dock-item__label">${item.label}</span>
          </button>`;
      }).join('')}
    </nav>`;
}

function render({ focusComposer = false } = {}) {
  if (state.screen === 'chat' && state.conversation) {
    appRoot.innerHTML = renderChat();
  } else if (state.screen === 'practices') {
    appRoot.innerHTML = renderPractices();
  } else if (state.screen === 'practice-session') {
    appRoot.innerHTML = renderPracticeSession();
  } else if (state.screen === 'journal-wallpaper') {
    appRoot.innerHTML = renderJournalWallpaper();
  } else if (state.screen === 'journal') {
    appRoot.innerHTML = renderJournal();
  } else if (state.screen === 'profile') {
    appRoot.innerHTML = renderProfile();
  } else {
    appRoot.innerHTML = renderFlow();
  }
  navigationRoot.innerHTML = renderNavigation();
  if (focusComposer) appRoot.querySelector('#chat-message')?.focus();
}

function startPractice(practiceId) {
  const practice = PRACTICES.find((item) => item.id === practiceId);
  if (!practice) return;

  if (state.practiceTimer) clearInterval(state.practiceTimer);
  state.activePracticeId = practice.id;
  state.practiceStartedAt = Date.now();
  state.practiceEndsAt = Date.now() + practice.duration * 1000;
  state.practiceRemaining = practice.duration;
  state.screen = 'practice-session';
  state.activeNav = 'practices';
  render();
  const orb = appRoot.querySelector('.practice-orb');
  if (orb) {
    orb.classList.remove('active-orb');
    void orb.offsetWidth;
    orb.classList.add('active-orb');
  }

  state.practiceTimer = setInterval(() => {
    const elapsedSeconds = Math.floor((Date.now() - state.practiceStartedAt) / 1000);
    state.practiceRemaining = Math.max(0, Math.ceil((state.practiceEndsAt - Date.now()) / 1000));
    const timer = appRoot.querySelector('#practice-timer');
    if (timer) timer.textContent = formatPracticeTime(state.practiceRemaining);
    const cue = appRoot.querySelector('#practice-cue');
    const nextCue = getPracticeCue(practice, elapsedSeconds);
    if (cue && cue.textContent !== nextCue) {
      cue.textContent = nextCue;
      cue.classList.remove('phase-change');
      void cue.offsetWidth;
      cue.classList.add('phase-change');
    }
    if (state.practiceRemaining === 0) {
      finishPractice({ returnToList: state.screen === 'practice-session' });
    }
  }, 250);
}

function finishPractice({ returnToList = true } = {}) {
  const practice = PRACTICES.find((item) => item.id === state.activePracticeId);
  if (!practice) return;

  if (state.practiceTimer) clearInterval(state.practiceTimer);
  state.practiceTimer = null;
  state.activePracticeId = null;
  state.practiceEndsAt = null;
  state.practiceStartedAt = null;
  state.practiceRemaining = 0;
  if (returnToList) {
    state.screen = 'practices';
    state.activeNav = 'practices';
  }
  render();
}

function createConversation(guideId, intentId, feelingId) {
  const timestamp = new Date().toISOString();
  return {
    id: makeId(),
    guideId,
    context: { intentId, feelingId },
    createdAt: timestamp,
    updatedAt: timestamp,
    messages: [],
  };
}

function openGuideChat(guideId, context = {}) {
  if (state.typing && state.conversation?.guideId !== guideId) return;

  const existingConversation = state.conversation?.guideId === guideId
    ? state.conversation
    : conversationRepository.list().find((conversation) => conversation.guideId === guideId);

  state.guideId = guideId;
  state.conversation = existingConversation ?? createConversation(guideId, context.intentId, context.feelingId);
  state.chatError = null;
  state.screen = 'chat';
  state.activeNav = 'guides';
  conversationRepository.save(state.conversation);
  render({ focusComposer: true });
}

async function sendMessage(value) {
  const messageText = cleanFinalDots(value);
  const conversation = state.conversation;
  if (!messageText || state.typing || !conversation) return;

  const timestamp = new Date().toISOString();
  conversation.messages.push({ id: makeId(), role: 'user', text: messageText, createdAt: timestamp });
  conversation.updatedAt = timestamp;
  state.typing = true;
  state.chatError = null;
  conversationRepository.save(conversation);
  render();

  try {
    const responseText = await sendMessageToAI({
      guideId: conversation.guideId,
      message: messageText,
      history: conversation.messages.slice(0, -1),
      context: conversation.context,
    });
    conversation.messages.push({
      id: makeId(),
      role: 'assistant',
      text: cleanFinalDots(responseText),
      source: 'api',
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    state.chatError = error instanceof Error ? cleanFinalDots(error.message) : 'Не удалось получить ответ';
  } finally {
    state.typing = false;
    conversation.updatedAt = new Date().toISOString();
    conversationRepository.save(conversation);
    if (state.conversation?.id === conversation.id) render({ focusComposer: state.screen === 'chat' });
  }
}

appRoot.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action]');
  if (!button || button.disabled) return;

  if (button.dataset.action === 'show-guides') {
    state.screen = 'guides';
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (button.dataset.action === 'show-goals') {
    state.screen = 'goals';
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else if (button.dataset.action === 'filter-practices') {
    state.practiceFilter = button.dataset.filter;
    render();
  } else if (button.dataset.action === 'start-practice') {
    startPractice(button.dataset.practice);
  } else if (button.dataset.action === 'finish-practice') {
    finishPractice();
  } else if (button.dataset.action === 'select-mood') {
    state.dailyEntry.moodId = button.dataset.mood;
    state.journalError = '';
    saveDailyEntry();
    render();
  } else if (button.dataset.action === 'finish-day') {
    finishJournalDay();
  } else if (button.dataset.action === 'edit-journal') {
    state.screen = 'journal';
    state.activeNav = 'journal';
    render();
  } else if (button.dataset.action === 'open-goal') {
    const goal = GOALS.find((item) => item.id === button.dataset.goal);
    if (goal) openGuideChat(goal.guideId, goal);
  } else if (button.dataset.action === 'send-prompt') {
    void sendMessage(button.dataset.prompt);
  } else if (button.dataset.action === 'go-home') {
    state.screen = 'welcome';
    state.activeNav = 'home';
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});

navigationRoot.addEventListener('click', (event) => {
  const button = event.target.closest('[data-action="navigate"]');
  if (!button) return;

  const tab = button.dataset.tab;
  state.activeNav = tab;
  if (tab === 'home') {
    state.screen = 'welcome';
  } else if (tab === 'practices') {
    state.screen = 'practices';
  } else if (tab === 'guides') {
    state.screen = 'guides';
  } else if (tab === 'journal' || tab === 'profile') {
    state.screen = tab;
  }
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

appRoot.addEventListener('submit', (event) => {
  if (event.target.dataset.form !== 'message') return;
  event.preventDefault();
  void sendMessage(event.target.elements.message.value);
});

appRoot.addEventListener('keydown', (event) => {
  if (event.target.matches('#chat-message') && event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    event.target.form.requestSubmit();
  }
});

appRoot.addEventListener('input', (event) => {
  if (event.target.matches('[data-journal-field]')) {
    state.dailyEntry[event.target.dataset.journalField] = event.target.value;
    saveDailyEntry();
    return;
  }
  if (event.target.matches('#chat-message')) {
    event.target.style.height = 'auto';
    event.target.style.height = `${Math.min(event.target.scrollHeight, 144)}px`;
  }
});

render();

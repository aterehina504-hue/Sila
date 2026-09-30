export const GUIDES = [
  {
    id: 'leya',
    name: 'Лея',
    description: 'Когда больно, страшно или не хватает внутренней опоры',
    initials: 'Л',
    color: 'rose',
    inviteName: 'Лею',
    withName: 'Леей',
  },
  {
    id: 'elira',
    name: 'Элира',
    description: 'Когда потерялся контакт с собой и всё идёт на автопилоте',
    initials: 'Э',
    color: 'sage',
    inviteName: 'Элиру',
    withName: 'Элирой',
  },
  {
    id: 'amira',
    name: 'Амира',
    description: 'Когда трудно выбрать себя и обозначить свои границы',
    initials: 'А',
    color: 'ochre',
    inviteName: 'Амиру',
    withName: 'Амирой',
  },
  {
    id: 'nera',
    name: 'Нера',
    description: 'Когда хочется посмотреть на ситуацию честно и глубже',
    initials: 'Н',
    color: 'blue',
    inviteName: 'Неру',
    withName: 'Нерой',
  },
];

export const INTENT_OPTIONS = [
  { id: 'understood', label: 'Чтобы меня просто поняли' },
  { id: 'calmer', label: 'Стало немного спокойнее' },
  { id: 'self', label: 'Разобраться в себе' },
  { id: 'wants', label: 'Понять, чего я сама хочу' },
  { id: 'decision', label: 'Принять решение' },
  { id: 'unsure', label: 'Я сама пока не знаю' },
];

export const FEELING_OPTIONS = [
  { id: 'tired', label: 'Я устала быть сильной' },
  { id: 'heavy', label: 'Я вроде справляюсь, но внутри тяжело' },
  { id: 'lonely', label: 'Мне одиноко, даже когда рядом люди' },
  { id: 'lost', label: 'Я запуталась в себе' },
  { id: 'thinking', label: 'Я слишком много думаю' },
  { id: 'secret', label: 'Есть то, о чём я никому не говорю' },
  { id: 'hard-to-explain', label: 'Не могу объяснить. Просто тяжело' },
  { id: 'other', label: 'Другое' },
];

const INTENT_WEIGHTS = {
  understood: { leya: 3 },
  calmer: { leya: 2, elira: 1 },
  self: { elira: 3 },
  wants: { amira: 3 },
  decision: { nera: 3, amira: 1 },
  unsure: { leya: 1, elira: 1 },
};

const FEELING_WEIGHTS = {
  tired: { amira: 2, leya: 1 },
  heavy: { leya: 3 },
  lonely: { leya: 3 },
  lost: { elira: 3 },
  thinking: { nera: 3 },
  secret: { leya: 1, nera: 2 },
  'hard-to-explain': { leya: 3 },
  other: {},
};

export function recommendGuide(intentId, feelingId) {
  const scores = Object.fromEntries(GUIDES.map((guide) => [guide.id, 0]));

  for (const [guideId, weight] of Object.entries(INTENT_WEIGHTS[intentId] ?? {})) {
    scores[guideId] += weight;
  }

  for (const [guideId, weight] of Object.entries(FEELING_WEIGHTS[feelingId] ?? {})) {
    scores[guideId] += weight;
  }

  return GUIDES.reduce((bestGuide, guide) =>
    scores[guide.id] > scores[bestGuide.id] ? guide : bestGuide,
  GUIDES[0]);
}

export function getGuide(guideId) {
  return GUIDES.find((guide) => guide.id === guideId) ?? GUIDES[0];
}
const DEMO_RESPONSE_TEXT =
  'Я прочитала твоё сообщение. Это демонстрационная версия: настоящий AI-проводник пока не подключён.';

export const demoAssistantClient = {
  async sendMessage() {
    await new Promise((resolve) => window.setTimeout(resolve, 900));

    return {
      text: DEMO_RESPONSE_TEXT,
      source: 'demo',
    };
  },
};
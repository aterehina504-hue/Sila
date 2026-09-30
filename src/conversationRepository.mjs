const STORAGE_KEY = 'sila.conversations.v1';

function getBrowserStorage() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

export class LocalConversationRepository {
  constructor(storage = getBrowserStorage()) {
    this.storage = storage;
  }

  list() {
    if (!this.storage) return [];

    try {
      const conversations = JSON.parse(this.storage.getItem(STORAGE_KEY) ?? '[]');
      return Array.isArray(conversations) ? conversations : [];
    } catch {
      return [];
    }
  }

  save(conversation) {
    if (!this.storage) return;

    const conversations = this.list();
    const existingIndex = conversations.findIndex((item) => item.id === conversation.id);

    if (existingIndex === -1) {
      conversations.unshift(conversation);
    } else {
      conversations[existingIndex] = conversation;
    }

    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(conversations));
    } catch {
      // Private browsing and full storage should not interrupt a conversation.
    }
  }
}
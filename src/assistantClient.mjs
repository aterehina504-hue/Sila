export async function sendMessageToAI({ guideId, message, history = [] }) {
  // Считываем ключ API из секретов окружения
  const apiKey = process.env.AI_API_KEY; 

  if (!apiKey) {
    console.error("API key не найден в переменных окружения.");
    return "Ошибка: API ключ не подключён.";
  }

  // Системный промпт для Элиры
  const systemPrompt = `Ты — Элира, бережный и поддерживающий проводник. 
Помогаешь человеку, когда он устал или потерял контакт с собой. 
Отвечай мягко, коротко и с заботой.`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          ...history,
          { role: "user", content: message }
        ]
      })
    });

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Ошибка при запросе к AI:", error);
    return "Не удалось связаться с проводником. Попробуйте ещё раз чуть позже.";
  }
}

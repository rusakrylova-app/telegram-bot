// services/deepseek.js
const axios = require('axios');

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

/**
 * Анализ мыслей: определяет когнитивные искажения
 */
async function detectDistortions(situation, thoughts, emotions) {
  if (!DEEPSEEK_API_KEY) {
    console.warn('⚠️ DEEPSEEK_API_KEY не задан, используем заглушку');
    return getMockDistortions(situation, thoughts);
  }

  try {
    const thoughtsText = thoughts.map(t => `- ${t}`).join('\n');
    const emotionsText = emotions.map(e => `${e.name} (${e.intensity}/10)`).join(', ');
    
    const prompt = `
Ты — психолог, специализирующийся на когнитивно-поведенческой терапии (КПТ).

Пользователь описал ситуацию и свои автоматические мысли.

Ситуация: "${situation}"

Автоматические мысли:
${thoughtsText}

Эмоции: ${emotionsText}

Задание:
1. Определи, какие когнитивные искажения присутствуют в мыслях пользователя.
2. Дай краткое объяснение, почему ты так считаешь.

Возможные искажения: катастрофизация, черно-белое мышление, долженствование, чтение мыслей, навешивание ярлыков, минимизация, сверхобобщение, персонализация, эмоциональное обоснование, предсказание негатива.

Ответ должен быть в формате JSON:
{
  "distortions": ["список найденных искажений"],
  "reasoning": "объяснение твоего выбора"
}

Используй только те искажения, которые действительно присутствуют. Если искажений нет, верни пустой список.
`;

    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Ты — полезный ассистент-психолог. Отвечай только в формате JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 500
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        }
      }
    );

    const content = response.data.choices[0].message.content;
    // Извлекаем JSON из ответа (на случай, если там есть лишний текст)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ Ошибка при анализе через DeepSeek:', error.message);
    return getMockDistortions(situation, thoughts);
  }
}

/**
 * Генерация альтернативных мыслей
 */
async function generateAlternatives(situation, thought, distortions, emotions) {
  if (!DEEPSEEK_API_KEY) {
    console.warn('⚠️ DEEPSEEK_API_KEY не задан, используем заглушку');
    return getMockAlternatives(situation, thought);
  }

  try {
    const distortionsText = distortions.length > 0 ? distortions.join(', ') : 'не обнаружены';
    const emotionsText = emotions.map(e => `${e.name} (${e.intensity}/10)`).join(', ');
    
    const prompt = `
Ты — психолог КПТ. Помоги пользователю найти более реалистичные и полезные альтернативные мысли.

Ситуация: "${situation}"

Автоматическая мысль: "${thought}"

Обнаруженные искажения: ${distortionsText}

Эмоции пользователя: ${emotionsText}

Задание:
1. Предложи 3 альтернативных мысли, которые более реалистичны и помогают снизить негативные эмоции.
2. Дай краткое объяснение, почему эти альтернативы могут быть полезны.

Ответ должен быть в формате JSON:
{
  "alternatives": ["альтернатива 1", "альтернатива 2", "альтернатива 3"],
  "explanation": "объяснение"
}

Альтернативы должны быть конкретными, реалистичными и связанными с ситуацией пользователя.
Используй методы КПТ: проверка фактов, поиск альтернативных объяснений, децентрализация, постановка в перспективу.
`;

    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: [
          { role: 'system', content: 'Ты — полезный ассистент-психолог КПТ. Отвечай только в формате JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 600
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        }
      }
    );

    const content = response.data.choices[0].message.content;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return JSON.parse(content);
  } catch (error) {
    console.error('❌ Ошибка при генерации альтернатив через DeepSeek:', error.message);
    return getMockAlternatives(situation, thought);
  }
}

// Функции-заглушки (на случай, если API ключ не задан)
function getMockDistortions(situation, thoughts) {
  const commonDistortions = ['катастрофизация', 'чтение мыслей'];
  return {
    distortions: commonDistortions,
    reasoning: 'На основе анализа ваших мыслей обнаружена склонность преувеличивать негативные последствия и предполагать негативное отношение окружающих.'
  };
}

function getMockAlternatives(situation, thought) {
  return {
    alternatives: [
      'Ситуация не так страшна, как кажется.',
      'У меня есть ресурсы, чтобы справиться с этим.',
      'Я могу посмотреть на это с другой точки зрения.'
    ],
    explanation: 'Эти альтернативы помогут снизить тревогу и увидеть ситуацию более объективно.'
  };
}

module.exports = { detectDistortions, generateAlternatives };
// bot/wizard/index.js
const { getState, setState, clearState } = require('../../db/state');

async function handleMessage(ctx) {
  const userId = ctx.from.id;
  const state = await getState(userId);
  const step = state.step;

  console.log(`📌 Шаг: ${step}, Данные:`, state.temp_data);

  if (step === 'idle') {
    return;
  }

  // Шаг 1: Ситуация
  if (step === 'situation') {
    const situation = ctx.message.text;
    if (!situation) {
      await ctx.reply('Пожалуйста, напишите текст ситуации.');
      return;
    }
    state.temp_data.situation = situation;
    await setState(userId, 'thoughts', state.temp_data);
    await ctx.reply(
      '✍️ Теперь напишите *автоматические мысли*, которые возникли у вас в этой ситуации.\n' +
      'Можно перечислить несколько, каждую с новой строки.\n\n' +
      'Например:\n' +
      'Я провалила презентацию\n' +
      'Все подумали, что я глупая\n' +
      'Меня уволят',
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // Шаг 2: Автоматические мысли
 // Шаг 2: Автоматические мысли
if (step === 'thoughts') {
  const thoughts = ctx.message.text.split('\n').filter(t => t.trim());
  if (thoughts.length === 0) {
    await ctx.reply('Пожалуйста, напишите хотя бы одну мысль.');
    return;
  }
  state.temp_data.thoughts = thoughts;
  await setState(userId, 'mood_before', state.temp_data);
  
  await ctx.reply(
    '📊 Оцените ваше *общее настроение* в данный момент (от 1 до 10)\n\n' +
    '1 — очень плохое настроение\n' +
    '10 — отличное настроение',
    { parse_mode: 'Markdown' }
  );
  return;
}
// Шаг 2.5: Настроение до
if (step === 'mood_before') {
  const moodBefore = parseInt(ctx.message.text);
  if (isNaN(moodBefore) || moodBefore < 1 || moodBefore > 10) {
    await ctx.reply('Пожалуйста, введите число от 1 до 10.');
    return;
  }
  state.temp_data.moodBefore = moodBefore;
  await setState(userId, 'emotions', state.temp_data);
  
  await ctx.reply(
    '😊 *Выберите эмоции*\n\n' +
    'Напишите эмоции через запятую (можно выбрать несколько):\n\n' +
    'Тревога, Грусть, Злость, Страх, Стыд, Вина, Радость, Спокойствие, Раздражение, Безнадёжность, Обида, Разочарование, Беспокойство, Напряжение',
    { parse_mode: 'Markdown' }
  );
  return;
}

  // Шаг 3: Эмоции
  if (step === 'emotions') {
    const emotionsText = ctx.message.text;
    const emotionNames = emotionsText.split(',').map(e => e.trim()).filter(e => e);
    
    if (emotionNames.length === 0) {
      await ctx.reply('Пожалуйста, напишите хотя бы одну эмоцию.');
      return;
    }
    
    // Сохраняем эмоции без интенсивности пока
    state.temp_data.emotions = emotionNames.map(name => ({ name, intensity: 0 }));
    state.temp_data.currentEmotionIndex = 0;
    
    await setState(userId, 'intensity', state.temp_data);
    
    // Спрашиваем интенсивность для первой эмоции
    const firstEmotion = emotionNames[0];
    await ctx.reply(
      `🎯 Укажите *интенсивность* для эмоции "${firstEmotion}" (от 1 до 10)\n\n` +
      `1 — очень слабо, 10 — очень сильно`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // Шаг 4: Интенсивность (для каждой эмоции)
  if (step === 'intensity') {
    const intensity = parseInt(ctx.message.text);
    if (isNaN(intensity) || intensity < 1 || intensity > 10) {
      await ctx.reply('Пожалуйста, введите число от 1 до 10.');
      return;
    }
    
    const emotions = state.temp_data.emotions || [];
    const currentIndex = state.temp_data.currentEmotionIndex || 0;
    
    if (currentIndex < emotions.length) {
      emotions[currentIndex].intensity = intensity;
      state.temp_data.emotions = emotions;
      state.temp_data.currentEmotionIndex = currentIndex + 1;
      
      // Проверяем, есть ли ещё эмоции
      if (currentIndex + 1 < emotions.length) {
        const nextEmotion = emotions[currentIndex + 1].name;
        await setState(userId, 'intensity', state.temp_data);
        await ctx.reply(
          `🎯 Укажите *интенсивность* для эмоции "${nextEmotion}" (от 1 до 10)`,
          { parse_mode: 'Markdown' }
        );
        return;
      } else {
        // Все эмоции обработаны
        delete state.temp_data.currentEmotionIndex;
        await setState(userId, 'distortions', state.temp_data);
        
        // Показываем список всех эмоций с интенсивностью
        const emotionList = emotions.map(e => `${e.name} (${e.intensity}/10)`).join('\n');
        await ctx.reply(
          `✅ Записал эмоции:\n${emotionList}\n\n` +
          `🧠 Теперь выберите *когнитивные искажения*, которые заметили в своих мыслях.\n` +
          `Напишите их через запятую или отправьте "пропустить", если не уверены.\n\n` +
          `Примеры: катастрофизация, черно-белое мышление, долженствование, чтение мыслей, навешивание ярлыков, минимизация, сверхобобщение, персонализация, эмоциональное обоснование, предсказание негатива`,
          { parse_mode: 'Markdown' }
        );
        return;
      }
    }
  }

  // Шаг 5: Искажения
  if (step === 'distortions') {
    const input = ctx.message.text.trim().toLowerCase();
    let distortions = [];
    
    if (input !== 'пропустить' && input !== 'skip' && input !== '') {
      distortions = input.split(',').map(d => d.trim()).filter(d => d);
    }
    
    state.temp_data.distortions = distortions;
    await setState(userId, 'analysis', state.temp_data);
    
    await ctx.reply(
      '🔄 *Анализирую ваши мысли с помощью ИИ...*\n\n' +
      'Это может занять несколько секунд. Пожалуйста, подождите.',
      { parse_mode: 'Markdown' }
    );
    
    // Здесь будет вызов DeepSeek, пока имитируем
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Временные заглушки для анализа
    const mockAnalysis = {
      distortions: ['катастрофизация', 'чтение мыслей'],
      reasoning: 'В ваших мыслях прослеживается тенденция преувеличивать негативные последствия и предполагать, что окружающие думают о вас плохо.'
    };
    
    state.temp_data.aiDistortions = mockAnalysis.distortions;
    state.temp_data.aiReasoning = mockAnalysis.reasoning;
    
    await setState(userId, 'alternatives', state.temp_data);
    
    await ctx.reply(
      `🧠 *Результаты анализа:*\n\n` +
      `*Обнаруженные искажения:*\n${mockAnalysis.distortions.map(d => `- ${d}`).join('\n')}\n\n` +
      `*Объяснение:*\n${mockAnalysis.reasoning}\n\n` +
      `💡 Хотите сгенерировать альтернативные мысли?\n` +
      `Напишите "да" или "нет"`,
      { parse_mode: 'Markdown' }
    );
    return;
  }

  // Шаг 6: Альтернативные мысли
  // Шаг 6: Альтернативные мысли
if (step === 'alternatives') {
  const userInput = ctx.message.text.trim().toLowerCase();
  
  if (userInput === 'да' || userInput === 'yes' || userInput === 'д') {
    // Импортируем функцию генерации
    const { generateAlternatives } = require('../../services/deepseek');
    
    await ctx.reply('🔄 Генерирую альтернативные мысли...');
    
    try {
      // Берём первую мысль из списка для генерации альтернатив
      const firstThought = state.temp_data.thoughts && state.temp_data.thoughts.length > 0 
        ? state.temp_data.thoughts[0] 
        : 'мои негативные мысли';
      
      const result = await generateAlternatives(
        state.temp_data.situation,
        firstThought,
        state.temp_data.aiDistortions || [],
        state.temp_data.emotions || []
      );
      
      state.temp_data.alternatives = result.alternatives || [];
      state.temp_data.explanation = result.explanation || 'Альтернативные мысли помогут взглянуть на ситуацию более объективно.';
      
      await setState(userId, 'mood_after', state.temp_data);
      
      const altText = state.temp_data.alternatives.length > 0
        ? state.temp_data.alternatives.map((a, i) => `${i+1}. ${a}`).join('\n')
        : 'Не удалось сгенерировать альтернативы.';
      
      await ctx.reply(
        `💡 *Альтернативные мысли:*\n\n${altText}\n\n` +
        `*Объяснение:*\n${state.temp_data.explanation}\n\n` +
        `📊 Оцените ваше настроение *после* работы с мыслями (от 1 до 10)`,
        { parse_mode: 'Markdown' }
      );
      return;
    } catch (error) {
      console.error('❌ Ошибка при генерации альтернатив:', error);
      await ctx.reply(
        '❌ Произошла ошибка при генерации альтернатив. Попробуйте ещё раз или напишите "нет" чтобы пропустить.',
        { parse_mode: 'Markdown' }
      );
      return;
    }
  } else {
    // Пользователь отказался от альтернатив
    state.temp_data.alternatives = [];
    state.temp_data.explanation = 'Альтернативные мысли не были сгенерированы по запросу пользователя.';
    
    await setState(userId, 'mood_after', state.temp_data);
    await ctx.reply(
      `📊 Оцените ваше настроение *после* работы с мыслями (от 1 до 10)`,
      { parse_mode: 'Markdown' }
    );
    return;
  }
}

  // Шаг 7: Настроение после
  if (step === 'mood_after') {
    const moodAfter = parseInt(ctx.message.text);
    if (isNaN(moodAfter) || moodAfter < 1 || moodAfter > 10) {
      await ctx.reply('Пожалуйста, введите число от 1 до 10.');
      return;
    }
    
    state.temp_data.moodAfter = moodAfter;
    await setState(userId, 'save', state.temp_data);
    
    // Сохраняем запись в БД
    const { saveRecord } = require('../../db/records');
    const record = {
      user_id: ctx.from.id,
      chat_id: ctx.chat.id,
      situation: state.temp_data.situation || '',
      automatic_thoughts: state.temp_data.thoughts || [],
      emotions: state.temp_data.emotions || [],
      cognitive_distortions: state.temp_data.distortions || [],
      alternative_thoughts: state.temp_data.alternatives || [],
      mood_before: state.temp_data.moodBefore || 5,
      mood_after: state.temp_data.moodAfter || 5,
      is_resolved: false
    };
    
    const savedRecord = await saveRecord(record);
    
    // Формируем итоговое сообщение
    const emotionText = record.emotions.map(e => `${e.name} (${e.intensity}/10)`).join('\n');
    const thoughtText = record.automatic_thoughts.map(t => `- ${t}`).join('\n');
    const altText = record.alternative_thoughts.length > 0 
      ? record.alternative_thoughts.map(t => `- ${t}`).join('\n')
      : 'Не сгенерированы';
    
   // В шаге save (итоговое сообщение)
await ctx.reply(
  `✅ *Запись сохранена!*\n\n` +
  `📅 ${new Date().toLocaleDateString('ru-RU')}\n\n` +
  `*Ситуация:*\n${record.situation}\n\n` +
  `*Автоматические мысли:*\n${thoughtText}\n\n` +
  `*Эмоции:*\n${emotionText}\n\n` +
  `*Искажения:*\n${record.cognitive_distortions.length > 0 ? record.cognitive_distortions.map(d => `- ${d}`).join('\n') : 'Не выбраны'}\n\n` +
  `*Альтернативные мысли:*\n${altText}\n\n` +
  `*Настроение:* ${record.mood_before}/10 → ${record.mood_after}/10\n\n` +
  `📈 Изменение настроения: ${record.mood_after - record.mood_before > 0 ? '✅ улучшилось (+' + (record.mood_after - record.mood_before) + ')' : record.mood_after - record.mood_before < 0 ? '⚠️ ухудшилось (' + (record.mood_after - record.mood_before) + ')' : '➖ не изменилось'}\n\n` +
  `💪 Отличная работа! Используйте /new для новой записи.`,
  { parse_mode: 'Markdown' }
);
    
    // Очищаем состояние
    await clearState(userId);
    return;
  }

  // Если шаг не распознан
  await ctx.reply('⚠️ Что-то пошло не так. Начните заново с /new');
  await clearState(userId);
}

module.exports = { handleMessage };
const Groq = require('groq-sdk');

let groqClient = null;

const getGroqClient = () => {
  if (!groqClient && process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
};

const aiChat = async (messages, maxTokens = 1024) => {
  try {
    const client = getGroqClient();
    if (!client) throw new Error('Groq API key not configured');
    
    const completion = await client.chat.completions.create({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
      messages,
      max_tokens: Math.max(maxTokens, 600),
      temperature: 0.7,
    });
    
    return completion.choices[0]?.message?.content || '';
  } catch (error) {
    console.error('Groq API error:', error.message);
    return null;
  }
};

const getMatchScore = async (user1, user2) => {
  try {
    const prompt = `You are a skill matching AI. Compare these two users for peer learning compatibility.

User 1: Teaches: ${user1.skillsTeaching.join(', ')}. Wants to learn: ${user1.skillsLearning.join(', ')}. Level: ${user1.experienceLevel}.
User 2: Teaches: ${user2.skillsTeaching.join(', ')}. Wants to learn: ${user2.skillsLearning.join(', ')}. Level: ${user2.experienceLevel}.

Return ONLY a JSON object with: {"score": <number 0-100>, "reason": "<one sentence explaining why they match>"}`;

    const result = await aiChat([{ role: 'user', content: prompt }], 200);
    if (result) {
      const parsed = JSON.parse(result.replace(/```json\n?|\n?```/g, '').trim());
      return { score: parsed.score, reason: parsed.reason };
    }
    throw new Error('No AI response');
  } catch {
    return fallbackMatchScore(user1, user2);
  }
};

const fallbackMatchScore = (user1, user2) => {
  const u1TeachesU2Wants = user1.skillsTeaching.filter((s) =>
    user2.skillsLearning.some((l) => l.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(l.toLowerCase()))
  );
  const u2TeachesU1Wants = user2.skillsTeaching.filter((s) =>
    user1.skillsLearning.some((l) => l.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(l.toLowerCase()))
  );
  
  const totalPossible = Math.max(user1.skillsLearning.length + user2.skillsLearning.length, 1);
  const matchCount = u1TeachesU2Wants.length + u2TeachesU1Wants.length;
  const score = Math.min(Math.round((matchCount / totalPossible) * 80 + 20), 100);
  
  let reason = 'Potential skill exchange opportunity.';
  if (u1TeachesU2Wants.length > 0 && u2TeachesU1Wants.length > 0) {
    reason = `Great match! Can exchange ${u1TeachesU2Wants[0]} for ${u2TeachesU1Wants[0]}.`;
  } else if (u1TeachesU2Wants.length > 0) {
    reason = `User 1 can teach ${u1TeachesU2Wants[0]}.`;
  } else if (u2TeachesU1Wants.length > 0) {
    reason = `User 2 can teach ${u2TeachesU1Wants[0]}.`;
  }
  
  return { score, reason };
};

const getDailyTip = async (user) => {
  try {
    const prompt = `You are a learning coach. Generate a short, motivational daily study tip (2-3 sentences) for someone learning ${user.skillsLearning.slice(0, 3).join(', ') || 'new skills'} and teaching ${user.skillsTeaching.slice(0, 3).join(', ') || 'skills'}. Be specific and actionable. Don't use markdown.`;
    
    const result = await aiChat([{ role: 'user', content: prompt }], 150);
    if (result) return result;
    throw new Error('No response');
  } catch {
    const tips = [
      'Try teaching what you learned today to solidify your understanding. The best way to learn is to teach!',
      'Set a 25-minute focused learning session using the Pomodoro technique. Small consistent steps lead to big results.',
      'Review your notes from yesterday before starting new material. Spaced repetition is key to retention.',
      'Connect with a peer today for a quick skill exchange session. Fresh perspectives accelerate learning.',
      'Write down 3 things you learned this week. Reflection strengthens memory and boosts motivation.',
    ];
    return tips[Math.floor(Math.random() * tips.length)];
  }
};

const getWeeklySummary = async (user, stats) => {
  try {
    const prompt = `Generate a brief weekly learning summary (3-4 sentences) for a user:
- Learning hours this week: ${stats.learningHours}
- Teaching hours: ${stats.teachingHours}  
- Sessions completed: ${stats.sessionsCompleted}
- Skills focus: ${user.skillsLearning.slice(0, 3).join(', ')}
- XP earned: ${stats.xpEarned}
Be encouraging and specific. Don't use markdown.`;

    const result = await aiChat([{ role: 'user', content: prompt }], 200);
    if (result) return result;
    throw new Error('No response');
  } catch {
    return `This week you spent ${stats.learningHours || 0} hours learning and ${stats.teachingHours || 0} hours teaching. You completed ${stats.sessionsCompleted || 0} sessions and earned ${stats.xpEarned || 0} XP. Keep up the great work!`;
  }
};

const aiChatAssistant = async (messages, userContext) => {
  try {
    const systemMessage = {
      role: 'system',
      content: `You are SkillSwap AI Assistant, a helpful study buddy. The user is learning ${userContext.skillsLearning?.join(', ') || 'various skills'} and teaches ${userContext.skillsTeaching?.join(', ') || 'various skills'}. Help them with study questions, explain concepts, suggest resources, and provide encouragement. Keep responses concise and helpful.`,
    };
    
    const result = await aiChat([systemMessage, ...messages], 500);
    if (result) return result;
    throw new Error('No response');
  } catch {
    return "I'm having trouble connecting to the AI service right now. Try asking your question to a peer in the community, or check back in a moment!";
  }
};

module.exports = { aiChat, getMatchScore, getDailyTip, getWeeklySummary, aiChatAssistant, fallbackMatchScore };

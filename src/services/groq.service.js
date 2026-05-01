const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

const buildPrompt = ({ tenant, message, history, knowledge }) => {
  const knowledgeBlock = knowledge.length
    ? knowledge
        .map((item, index) => `${index + 1}. ${item.title}\nQ: ${item.question || 'n/a'}\nA: ${item.answer || item.content || 'n/a'}`)
        .join('\n\n')
    : 'No relevant knowledge base items were found.';

  const historyBlock = history
    .map((entry) => `${entry.role.toUpperCase()}: ${entry.content}`)
    .join('\n');

  return [
    `You are a highly precise support bot for ${tenant.name}.`,
    'Your priority is FACTUAL ACCURACY. Do not provide information that is not explicitly in the Knowledge Base.',
    '',
    'CRITICAL INSTRUCTION:',
    'Verify if the Knowledge Base actually answers the SPECIFIC intent of the question.',
    '- If the user asks for PRICE but the context only mentions TIME, say you do not know the price.',
    '- If the user asks for LOCATION but the context only mentions HOURS, say you do not know the location.',
    '- NEVER substitute one piece of information for another (e.g., do not give a delivery time when asked about a return cost).',
    '',
    'If the information is missing or only partially matches, say: "I am sorry, I do not have specific information about that. Please contact our support team directly."',
    '',
    `Knowledge Base Context:\n${knowledgeBlock}`,
    '',
    `Conversation History:\n${historyBlock || 'No previous messages.'}`,
    '',
    `Customer Question: ${message}`,
  ].join('\n');
};

export const generateAssistantReply = async ({ tenant, message, history = [], knowledge = [] }) => {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';

  if (apiKey) {
    try {
      const response = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.1, // Lower temperature for more factual accuracy
          messages: [
            {
              role: 'system',
              content: `You are the official support agent for ${tenant.name}. You must never give information that is not in the Knowledge Base. Accuracy is more important than being helpful.`,
            },
            {
              role: 'user',
              content: buildPrompt({ tenant, message, history, knowledge }),
            },
          ],
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content?.trim();
        if (content) {
          return content;
        }
      } else {
        const errorData = await response.json();
        console.error('Groq API Error:', errorData);
      }
    } catch (error) {
      console.warn(`Groq request failed: ${error.message}`);
    }
  }

  // Fallback to knowledge base if API fails or key is missing
  if (knowledge.length > 0) {
    const best = knowledge[0];
    const answer = best.answer || best.content || 'I found a related help article, but it does not contain a direct answer yet.';
    return answer;
  }

  return 'I do not have enough information yet. Could you share a little more detail so I can help accurately?';
};

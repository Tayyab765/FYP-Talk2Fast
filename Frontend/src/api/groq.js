/**
 * Groq API Integration
 * Uses Groq's fast LLM inference for question explanations
 */

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions'

/**
 * Get AI explanation for a question and its correct answer
 * @param {string} questionText - The question text
 * @param {Object} options - The answer options (A, B, C, D)
 * @param {string} correctAnswer - The correct answer key
 * @param {string} userAnswer - The user's answer (optional)
 * @param {string} topic - The question topic (optional)
 * @returns {Promise<string>} - AI-generated explanation
 */
export async function getQuestionExplanation(questionText, options, correctAnswer, userAnswer = null, topic = null) {
  // Check if API key is configured
  if (!GROQ_API_KEY) {
    throw new Error('Groq API key is not configured. Please add VITE_GROQ_API_KEY to your .env file.')
  }

  try {
    const prompt = buildExplanationPrompt(questionText, options, correctAnswer, userAnswer, topic)
    
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Fast and accurate model
        messages: [
          {
            role: 'system',
            content: 'You are a helpful tutor. Provide SHORT, clear explanations (3-4 sentences max). Be direct and concise. No lengthy introductions or repetitive text.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.5,
        max_tokens: 300
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || 'Failed to get AI explanation')
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || 'Unable to generate explanation.'
  } catch (error) {
    console.error('Groq API error:', error)
    throw new Error('Failed to generate explanation. Please try again.')
  }
}

/**
 * Build the prompt for question explanation
 */
function buildExplanationPrompt(questionText, options, correctAnswer, userAnswer, topic) {
  let prompt = `Explain this question briefly and clearly:\n\n`
  prompt += `Question: ${questionText}\n\n`
  prompt += `Options:\n`
  
  Object.entries(options).forEach(([key, value]) => {
    prompt += `${key}) ${value}\n`
  })
  
  prompt += `\nCorrect Answer: ${correctAnswer}) ${options[correctAnswer]}\n`
  
  if (userAnswer && userAnswer !== correctAnswer) {
    prompt += `Student's Answer: ${userAnswer}) ${options[userAnswer]}\n`
  }
  
  if (topic) {
    prompt += `Topic: ${topic}\n`
  }
  
  prompt += `\nProvide a SHORT explanation (3-4 sentences max) that:\n`
  prompt += `1. Briefly explains why ${correctAnswer} is correct\n`
  if (userAnswer && userAnswer !== correctAnswer) {
    prompt += `2. Explains why ${userAnswer} is wrong\n`
  }
  prompt += `\nKeep it simple and concise. No lengthy introductions or repetition.`
  
  return prompt
}

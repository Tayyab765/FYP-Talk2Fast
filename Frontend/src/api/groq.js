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
            content: 'You are an expert tutor helping students understand test questions. Provide clear, concise explanations that help students learn the concept behind the question.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
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
  let prompt = `Please explain this question and why the correct answer is right:\n\n`
  prompt += `Question: ${questionText}\n\n`
  prompt += `Options:\n`
  
  Object.entries(options).forEach(([key, value]) => {
    prompt += `${key}) ${value}\n`
  })
  
  prompt += `\nCorrect Answer: ${correctAnswer}) ${options[correctAnswer]}\n`
  
  if (userAnswer && userAnswer !== correctAnswer) {
    prompt += `\nStudent's Answer: ${userAnswer}) ${options[userAnswer]}\n`
    prompt += `Please also explain why the student's answer is incorrect.\n`
  }
  
  if (topic) {
    prompt += `\nTopic: ${topic}\n`
  }
  
  prompt += `\nProvide a clear explanation that:\n`
  prompt += `1. Explains what the question is asking\n`
  prompt += `2. Explains why the correct answer is right\n`
  prompt += `3. Provides the key concept or formula needed\n`
  if (userAnswer && userAnswer !== correctAnswer) {
    prompt += `4. Explains the common mistake in the student's answer\n`
  }
  
  return prompt
}

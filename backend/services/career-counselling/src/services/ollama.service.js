import axios from 'axios';
import { logger } from '../utils/logger.js';

/**
 * Ollama Service
 * Handles all interactions with local Ollama API
 * Implements error handling, timeout management, and context optimization
 */

class OllamaService {
  constructor() {
    this.baseURL = process.env.OLLAMA_API_URL || 'http://localhost:11434';
    this.model = 'qwen2.5:7b';
    this.timeout = Math.max(Number.parseInt(process.env.OLLAMA_TIMEOUT || '600000', 10) || 600000, 600000);
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  _truncateText(value, maxLength = 200) {
    const text = typeof value === 'string' ? value.trim().replaceAll(/\s+/g, ' ') : '';
    if (!text) return 'N/A';
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
  }

  _formatArray(values) {
    if (!Array.isArray(values) || values.length === 0) return 'N/A';
    const normalized = values
      .map(value => String(value ?? '').trim())
      .filter(Boolean);

    return normalized.length > 0 ? normalized.join(', ') : 'N/A';
  }

  _extractSkills(profile) {
    if (Array.isArray(profile?.skills)) {
      return profile.skills;
    }

    const skills = profile?.skills;
    if (!skills || typeof skills !== 'object') {
      return [];
    }

    return Object.entries(skills)
      .filter(([, value]) => typeof value === 'number' && value >= 4)
      .map(([key]) => key.replaceAll('_', ' '));
  }

  _extractInterests(profile) {
    if (Array.isArray(profile?.interests)) {
      return profile.interests;
    }

    if (Array.isArray(profile?.interests?.hobbies)) {
      return profile.interests.hobbies;
    }

    return [];
  }

  _extractPersonalityStrengths(profile) {
    if (Array.isArray(profile?.personality?.strengths)) {
      return profile.personality.strengths;
    }

    const personality = profile?.personality;
    if (!personality || typeof personality !== 'object') {
      return [];
    }

    return Object.entries(personality)
      .filter(([, value]) => typeof value === 'number' && value >= 4)
      .map(([key]) => key.replaceAll('_', ' '));
  }

  compressProfile(profile) {
    const degree = this._truncateText(
      profile?.education?.degree
      || profile?.academic_background?.qualification_type
      || profile?.academic_background?.current_education_level
      || 'N/A'
    );
    const field = this._truncateText(
      profile?.education?.field
      || profile?.academic_background?.study_stream
      || profile?.academic_background?.field_of_study
      || 'N/A'
    );
    const skills = this._formatArray(this._extractSkills(profile));
    const interests = this._formatArray(this._extractInterests(profile));
    const experience = this._truncateText(profile?.experience || 'N/A');
    const personalityStrengths = this._formatArray(this._extractPersonalityStrengths(profile));
    const goals = this._truncateText(
      profile?.goals
      || profile?.career_goal
      || profile?.career_inclination?.appealing_role
      || profile?.work_style?.career_motivation
      || 'N/A'
    );

    return [
      `Education: degree=${degree}; field=${field}`,
      `Skills: ${skills}`,
      `Interests: ${interests}`,
      `Experience: ${experience}`,
      `Personality Strengths: ${personalityStrengths}`,
      `Goals: ${goals}`
    ].join('\n');
  }

  /**
   * Test Ollama connection and model availability
   * @returns {Promise<boolean>}
   */
  async testConnection() {
    try {
      const response = await axios.get(`${this.baseURL}/api/tags`, {
        timeout: 5000
      });

      const models = response.data.models || [];
      const modelExists = models.some(m => m.name === this.model);

      if (!modelExists) {
        logger.warn(`Model ${this.model} not found in Ollama. Available models:`,
          models.map(m => m.name).join(', '));
        return false;
      }

      logger.info('Ollama connection successful', { model: this.model });
      return true;

    } catch (error) {
      logger.error('Failed to connect to Ollama', {
        error: error.message,
        baseURL: this.baseURL
      });
      return false;
    }
  }

  /**
   * Generate response from Ollama
   * @param {string} prompt - The prompt to send
   * @param {Object} options - Additional options
   * @returns {Promise<string>}
   */
  async generateResponse(prompt, options = {}) {
    const requestBody = {
      model: 'qwen2.5:7b',
      prompt: prompt,
      stream: false,
      keep_alive: '10m',
      options: {
        temperature: options.temperature || 0.7,
        num_predict: options.num_predict || 300,
        top_p: options.top_p || 0.9,
        ...options.modelOptions
      }
    };

    try {
      logger.info('Sending request to Ollama', {
        model: this.model,
        promptLength: prompt.length
      });

      const response = await this._callOllamaWithRetry(requestBody);

      const generatedText = response?.data?.response || '';
      const usage = {
        eval_count: response?.data?.eval_count ?? 0,
        eval_duration: response?.data?.eval_duration ?? 0,
        prompt_eval_count: response?.data?.prompt_eval_count ?? 0,
        prompt_eval_duration: response?.data?.prompt_eval_duration ?? 0
      };

      logger.info('Ollama response received', {
        responseLength: generatedText.length,
        evalCount: usage.eval_count,
        evalDuration: usage.eval_duration
      });

      return {
        text: generatedText.trim(),
        usage
      };

    } catch (error) {
      logger.error('Failed to generate response from Ollama', {
        error: error.message
      });
      throw new Error(`Ollama generation failed: ${error.message}`);
    }
  }

  /**
   * Generate AI-powered degree recommendations
   * @param {Object} profileData - Descriptive profile in AI-friendly format
   * @returns {Promise<Object>} - Structured recommendations JSON
   */
  async generateRecommendation(profile) {
    const compressedProfile = this.compressProfile(profile);
    const prompt = this._buildRecommendationPrompt(compressedProfile);

    try {
      logger.info('Generating career recommendations via Ollama');

      const result = await this.generateResponse(prompt, {
        temperature: 0.7,
        num_predict: 300
      });

      // Extract and parse JSON from response
      const parsed = this._extractAndParseJSON(result.text);
      const recommendations = this._normalizeRecommendationStructure(parsed);

      // Validate structure
      if (!this._validateRecommendationStructure(recommendations)) {
        throw new Error('Invalid recommendation structure received from Ollama');
      }

      logger.info('Successfully generated career recommendations', {
        degreeCount: recommendations.top_3_degrees?.length || 0
      });

      return recommendations;

    } catch (error) {
      logger.error('Failed to generate recommendations', { error: error.message });
      throw new Error(`AI recommendation generation failed: ${error.message}`);
    }
  }

  _normalizeRecommendationStructure(data) {
    const normalizedDegrees = Array.isArray(data?.top_3_degrees)
      ? data.top_3_degrees
        .filter(Boolean)
        .map((degree) => ({
          degree_name: degree?.degree_name || 'N/A',
          match_percentage: Number(degree?.match_percentage) || 0,
          reasoning: degree?.reasoning || 'N/A',
          career_paths: Array.isArray(degree?.career_paths) ? degree.career_paths : [],
          eligibility: ['Yes', 'No'].includes(degree?.eligibility)
            ? degree.eligibility
            : 'N/A'
        }))
      : [];

    return {
      top_3_degrees: normalizedDegrees,
      overall_assessment: data?.overall_assessment || 'N/A',
      next_steps: Array.isArray(data?.next_steps) ? data.next_steps : []
    };
  }

  /**
   * Generate memory summary for session
   * Compresses recommendation into concise summary for future context
   */
  async generateMemorySummary(profile, recommendations) {
    const compressedProfile = this.compressProfile(profile);
    const prompt = `You are a career counseling assistant. Create a very concise 2-3 sentence summary of the student's profile and top recommendation for memory purposes. Focus only on key facts.

Profile:\n${compressedProfile}

Top Recommendation: ${recommendations.top_3_degrees[0].degree_name} (${recommendations.top_3_degrees[0].match_percentage}% match)

Create a brief summary for future reference. Return ONLY the summary text, nothing else.`;

    try {
      const result = await this.generateResponse(prompt, {
        temperature: 0.5,
        num_predict: 120
      });

      return result.text;

    } catch (error) {
      logger.error('Failed to generate memory summary', { error: error.message });
      // Fallback to basic summary
      return `Student profile captured with key strengths and goals. Top recommendation: ${recommendations.top_3_degrees[0].degree_name}.`;
    }
  }

  /**
   * Continue career counseling conversation with context
   * @param {Object} sessionData - Session context including memory, profile, and chat history
   * @param {string} userMessage - New user message
   * @returns {Promise<string>} - AI response
   */
  async continueCareerChat(sessionData, userMessage) {
    const prompt = this._buildChatPrompt(sessionData, userMessage);

    try {
      logger.info('Processing career chat message', {
        sessionId: sessionData.sessionId,
        messageLength: userMessage.length
      });

      const result = await this.generateResponse(prompt, {
        temperature: 0.7,
        num_predict: 15000
      });

      logger.info('Chat response generated', {
        sessionId: sessionData.sessionId,
        responseLength: result.text.length,
        evalCount: result?.usage?.eval_count ?? 0
      });

      return {
        response: result.text,
        usage: result.usage
      };

    } catch (error) {
      logger.error('Failed to process chat message', { error: error.message });
      throw new Error(`Chat processing failed: ${error.message}`);
    }
  }

  /**
   * Build comprehensive recommendation prompt
   */
  _buildRecommendationPrompt(compressedProfile) {
    return `You are a highly accurate career counseling AI for Pakistani students.
    Your task is to analyze the student profile and recommend the top 3 most suitable university degrees.

    Student Profile:
    ${compressedProfile}

    Return ONLY valid JSON in this exact format:
    {
      "top_3_degrees": [
        {
          "degree_name": "",
          "match_percentage": 0,
          "reasoning": "",
          "career_paths": ["", "", ""],
          "eligibility": "Yes/No with short condition if needed"
        }
      ],
      "skill_gap_analysis": {
        "current_strengths": ["", ""],
        "skills_to_develop": ["", ""],
        "recommended_certifications": ["", ""]
      },
      "overall_assessment": "",
      "next_steps": ["", ""]
    }

    STRICT INSTRUCTIONS:
    1. Output MUST be valid JSON only (no text before or after)
    2. Exactly 3 degree recommendations
    3. match_percentage must be realistic (0–100), based primarily on student interests, strengths, and academic background
    4. reasoning must be SHORT (1-2 lines, to the point) — focus on why this degree fits the student, not eligibility
    5. career_paths → exactly 3 concise roles with a short description each
    6. eligibility → briefly note "Yes" or "No" with a one-phrase condition only if truly restrictive (e.g., "No – requires Mathematics exam"). Do NOT over-explain or repeat eligibility in reasoning.
    7. skill_gap_analysis:
      - current_strengths → 2-4 skills the student already demonstrates
      - skills_to_develop → 2-4 skills needed for their top recommended degree
      - recommended_certifications → 2-3 short, practical certifications available in Pakistan (e.g., Google IT Support, Cisco CCNA, Coursera ML)
    8. overall_assessment → max 1 short sentence summarizing the student's overall profile fit
    9. next_steps → max 2 short actionable steps the student should take now
    10. Base recommendations strictly on:
        - student interests
        - academic background
        - skill strengths
    11. Prefer high-demand and practical degrees in Pakistan

    DO NOT:
    - Add explanations outside JSON
    - Write long paragraphs
    - Recommend unrealistic or irrelevant degrees
    - Make eligibility the dominant factor — it is a secondary note only
    - Repeat eligibility concerns inside reasoning or overall_assessment

    Ensure the response is concise, accurate, profile-driven, and strictly formatted.`;
  }

  /**
   * Build chat prompt with full context
   */
  _buildChatPrompt(sessionData, userMessage) {
    let prompt = `You are an expert career counselor helping a student explore their career options. You have already provided them with degree recommendations. Now continue the conversation naturally, answering their questions, providing additional insights, and offering guidance.

GUIDELINES:
- Be conversational, supportive, and encouraging
- Reference their profile and previous recommendations when relevant
- Provide specific, actionable advice
- If they ask about a specific degree/career, provide detailed information
- If they're uncertain, help them think through their options
- Keep responses focused and concise (not more than 50 words)
- Always maintain context of their profile and previous conversation

`;

    // Add memory summary
    prompt += `STUDENT CONTEXT:\n${sessionData.memorySummary}\n\n`;

    // Add previous recommendations summary
    if (sessionData.recommendationJSON?.top_3_degrees?.length > 0) {
      const topDegree = sessionData.recommendationJSON.top_3_degrees[0];
      prompt += `PREVIOUS RECOMMENDATIONS:\n`;
      prompt += `Top recommendation: ${topDegree.degree_name} (${topDegree.match_percentage}% match)\n`;
      prompt += `Other recommendations: ${sessionData.recommendationJSON.top_3_degrees.slice(1).map(d => d.degree_name).join(', ')}\n\n`;
    }

    // Include recent chat history (last 6-10 messages for context)
    if (sessionData.chatHistory && sessionData.chatHistory.length > 0) {
      prompt += `CONVERSATION HISTORY:\n`;
      const recentMessages = sessionData.chatHistory.slice(-8);

      for (const msg of recentMessages) {
        if (msg.role === 'user') {
          prompt += `User: ${msg.content}\n`;
        } else if (msg.role === 'assistant') {
          prompt += `Assistant: ${msg.content}\n`;
        }
      }
      prompt += `\n`;
    }

    // Add current user message
    prompt += `Current Question:\n${userMessage}\n\n`;
    prompt += `Respond clearly and helpfully as the assistant:`;

    return prompt;
  }

  /**
   * Extract JSON from response (handles cases where model adds extra text)
   */
  _tryParseJSON(value) {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  extractJSON(text) {
    const match = text?.match(/\{[\s\S]*\}/);
    return match ? match[0] : null;
  }

  _stripCodeFences(text) {
    return String(text || '')
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
  }

  _removeTrailingCommas(text) {
    return text.replaceAll(/,\s*([}\]])/g, '$1');
  }

  _balanceBracesAndBrackets(text) {
    const stack = [];
    for (const char of text) {
      if (char === '{' || char === '[') {
        stack.push(char);
      } else if (char === '}' || char === ']') {
        const top = stack.at(-1);
        if (char === '}' && top === '{') stack.pop();
        if (char === ']' && top === '[') stack.pop();
      }
    }

    let balanced = text;
    while (stack.length > 0) {
      const top = stack.pop();
      balanced += top === '{' ? '}' : ']';
    }

    return balanced;
  }

  _recoverJSON(text) {
    const extracted = this.extractJSON(text);
    if (!extracted) return null;

    const noFence = this._stripCodeFences(extracted);
    const noTrailingCommas = this._removeTrailingCommas(noFence);
    const balanced = this._balanceBracesAndBrackets(noTrailingCommas);

    return balanced;
  }

  _extractAndParseJSON(text) {
    const cleanedText = this._stripCodeFences(text);
    const direct = this._tryParseJSON(cleanedText);
    if (direct) {
      return direct;
    }

    const recovered = this._recoverJSON(cleanedText);
    if (recovered) {
      const parsedRecovered = this._tryParseJSON(recovered);
      if (parsedRecovered) {
        return parsedRecovered;
      }

      logger.error('Failed to parse extracted JSON', { text: recovered });
      throw new Error('Invalid JSON response from Ollama');
    }

    logger.error('No valid JSON found in response', { text });
    throw new Error('No valid JSON found in Ollama response');
  }

  /**
   * Validate recommendation structure
   */
  _validateRecommendationStructure(data) {
    if (!data || typeof data !== 'object') return false;
    if (!Array.isArray(data.top_3_degrees)) return false;
    if (data.top_3_degrees.length < 1) return false;

    // Validate each degree object
    for (const degree of data.top_3_degrees) {
      if (!degree.degree_name || typeof degree.match_percentage !== 'number' || !degree.reasoning) {
        return false;
      }
      if (!Array.isArray(degree.career_paths)) return false;
      if (!degree.eligibility) return false;
    }

    return true;
  }

  /**
   * Call Ollama API with retry logic
   */
  async _callOllamaWithRetry(requestBody, attempt = 1) {
    try {
      const response = await axios.post(
        `${this.baseURL}/api/generate`,
        requestBody,
        {
          timeout: this.timeout,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      return response;

    } catch (error) {
      // Check if Ollama is not running
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Ollama is not running. Please start Ollama service at ' + this.baseURL);
      }

      // Handle timeout
      if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
        throw new Error('Ollama request timed out. The model may be loading or the prompt is too complex.');
      }

      // Handle temporary errors with retry
      if (attempt < this.maxRetries && error.response?.status >= 500) {
        const delay = this.retryDelay * attempt;
        logger.warn(`Server error, retrying in ${delay}ms (attempt ${attempt}/${this.maxRetries})`);
        await this._sleep(delay);
        return this._callOllamaWithRetry(requestBody, attempt + 1);
      }

      throw error;
    }
  }

  /**
   * Sleep utility for retry delays
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
let ollamaServiceInstance = null;

export function getOllamaService() {
  if (!ollamaServiceInstance) {
    ollamaServiceInstance = new OllamaService();
  }
  return ollamaServiceInstance;
}

export default OllamaService;

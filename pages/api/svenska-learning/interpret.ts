import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

type AIProvider = 'deepseek' | 'kimi'

type RequestBody = {
  text: string
  type: 'translate_word' | 'translate_sentence' | 'explain_grammar' | 'pronunciation_tips'
}

const PROMPTS = {
  translate_word: `You are a Swedish language tutor. Translate the following Swedish word to English.
Provide:
1. English translation
2. Part of speech (noun, verb, adj, etc.)
3. Example sentence in Swedish with English translation
Keep response concise and well-formatted.`,

  translate_sentence: `You are a Swedish language tutor. Translate the following Swedish sentence to English.
Provide:
1. English translation
2. Key vocabulary words with their meanings
3. Any notable grammar points
Keep response concise.`,

  explain_grammar: `You are a Swedish language tutor. Explain the grammar of the following Swedish text.
Focus on:
1. Sentence structure
2. Verb conjugations
3. Word order rules
4. Any special grammar patterns
Use simple explanations suitable for a learner.`,

  pronunciation_tips: `You are a Swedish language tutor. Provide pronunciation tips for the following Swedish text.
Include:
1. IPA transcription if applicable
2. Common pronunciation challenges for English speakers
3. Tips for correct pronunciation
4. Similar-sounding Swedish words to avoid confusion`
}

async function callAIProvider(
  provider: AIProvider,
  text: string,
  type: keyof typeof PROMPTS
): Promise<{ success: boolean; content: string; provider: AIProvider; error?: string }> {
  const config = provider === 'deepseek'
    ? {
        apiKey: process.env.DEEPSEEK_API_KEY,
        apiUrl: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/v1',
        model: 'deepseek-chat'
      }
    : {
        apiKey: process.env.KIMI_API_KEY,
        apiUrl: process.env.KIMI_API_URL || 'https://api.moonshot.cn/v1',
        model: 'moonshot-v1-8k'
      }

  if (!config.apiKey) {
    return {
      success: false,
      content: '',
      provider,
      error: `${provider} API key not configured`
    }
  }

  try {
    const response = await axios.post(
      `${config.apiUrl}/chat/completions`,
      {
        model: config.model,
        messages: [
          { role: 'system', content: PROMPTS[type] },
          { role: 'user', content: text }
        ],
        max_tokens: 1000,
        temperature: 0.7
      },
      {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    )

    const content = response.data?.choices?.[0]?.message?.content || ''

    return {
      success: true,
      content,
      provider
    }
  } catch (error: any) {
    console.error(`${provider} AI error:`, error?.message || error)
    return {
      success: false,
      content: '',
      provider,
      error: error?.response?.data?.error?.message || error?.message || `${provider} request failed`
    }
  }
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { text, type } = req.body as RequestBody

  if (!text || !type) {
    return res.status(400).json({ error: 'Missing text or type parameter' })
  }

  // Try DeepSeek first
  let result = await callAIProvider('deepseek', text, type)

  // If DeepSeek fails, try Kimi
  if (!result.success) {
    console.log('DeepSeek failed, trying Kimi...')
    result = await callAIProvider('kimi', text, type)
  }

  if (result.success) {
    return res.status(200).json(result)
  } else {
    return res.status(500).json(result)
  }
}

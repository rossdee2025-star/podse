import getConfig from 'next/config'

const { publicRuntimeConfig, serverRuntimeConfig } = getConfig() || {}

const getServerOrPublicVariable = (envVarKey: string) =>
  serverRuntimeConfig?.[envVarKey] || publicRuntimeConfig?.[envVarKey]

// AI Provider Configuration
const DEEPSEEK_API_KEY = getServerOrPublicVariable('DEEPSEEK_API_KEY')
const DEEPSEEK_API_URL = getServerOrPublicVariable('DEEPSEEK_API_URL') || 'https://api.deepseek.com/v1'
const KIMI_API_KEY = getServerOrPublicVariable('KIMI_API_KEY')
const KIMI_API_URL = getServerOrPublicVariable('KIMI_API_URL') || 'https://api.moonshot.cn/v1'

// Dictionary API Configuration
const FORVO_API_KEY = getServerOrPublicVariable('FORVO_API_KEY')

export type AIProvider = 'deepseek' | 'kimi'

export const SvenskaConfig = {
  // AI Providers
  AI: {
    DEEPSEEK: {
      API_KEY: DEEPSEEK_API_KEY,
      API_URL: DEEPSEEK_API_URL,
      MODEL: 'deepseek-chat',
      MAX_TOKENS: 1000
    },
    KIMI: {
      API_KEY: KIMI_API_KEY,
      API_URL: KIMI_API_URL,
      MODEL: 'moonshot-v1-8k',
      MAX_TOKENS: 1000
    },
    // Primary provider (fallback to the other if primary fails)
    PRIMARY_PROVIDER: 'deepseek' as AIProvider
  },

  // Dictionary & Pronunciation
  DICTIONARY: {
    FORVO_API_KEY: FORVO_API_KEY,
    FORVO_API_URL: 'https://apifree.forvo.com'
  },

  // A-B Repeat Settings
  PLAYBACK: {
    DEFAULT_REPEAT_COUNT: 3,
    REPEAT_OPTIONS: [1, 2, 3, 5, 10, -1], // -1 = infinite
    SLOW_SPEEDS: [0.5, 0.75, 1.0],
    DEFAULT_SLOW_SPEED: 0.75
  },

  // Learning Settings
  LEARNING: {
    AUTO_PAUSE_ON_SENTENCE_END: true,
    HIGHLIGHT_CURRENT_WORD: true,
    SHOW_PARALLEL_TRANSLATION: true,
    TARGET_LANGUAGE: 'sv', // Swedish
    NATIVE_LANGUAGE: 'en'  // English (for translations)
  },

  // System Prompts for AI
  PROMPTS: {
    TRANSLATE_WORD: `You are a Swedish language tutor. Translate the following Swedish word to English.
Provide:
1. English translation
2. Part of speech (noun, verb, adj, etc.)
3. Example sentence in Swedish with English translation
Keep response concise and well-formatted.`,

    TRANSLATE_SENTENCE: `You are a Swedish language tutor. Translate the following Swedish sentence to English.
Provide:
1. English translation
2. Key vocabulary words with their meanings
3. Any notable grammar points
Keep response concise.`,

    EXPLAIN_GRAMMAR: `You are a Swedish language tutor. Explain the grammar of the following Swedish text.
Focus on:
1. Sentence structure
2. Verb conjugations
3. Word order rules
4. Any special grammar patterns
Use simple explanations suitable for a learner.`,

    PRONUNCIATION_TIPS: `You are a Swedish language tutor. Provide pronunciation tips for the following Swedish text.
Include:
1. IPA transcription if applicable
2. Common pronunciation challenges for English speakers
3. Tips for correct pronunciation
4. Similar-sounding Swedish words to avoid confusion`
  }
}

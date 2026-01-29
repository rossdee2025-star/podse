import axios from 'axios'

export type AIProvider = 'deepseek' | 'kimi'

export type AIInterpretationType = 'translate_word' | 'translate_sentence' | 'explain_grammar' | 'pronunciation_tips'

export type AIInterpretationResult = {
  success: boolean
  content: string
  provider: AIProvider
  error?: string
}

export const interpretText = async (
  text: string,
  type: AIInterpretationType = 'translate_sentence'
): Promise<AIInterpretationResult> => {
  try {
    const response = await axios.post(
      '/api/svenska-learning/interpret',
      { text, type },
      { timeout: 60000 }
    )

    return response.data as AIInterpretationResult
  } catch (error: any) {
    console.error('AI interpretation error:', error?.message || error)
    return {
      success: false,
      content: '',
      provider: 'deepseek',
      error: error?.response?.data?.error || error?.message || 'Request failed'
    }
  }
}

export const translateWord = async (word: string): Promise<AIInterpretationResult> => {
  return interpretText(word, 'translate_word')
}

export const translateSentence = async (sentence: string): Promise<AIInterpretationResult> => {
  return interpretText(sentence, 'translate_sentence')
}

export const explainGrammar = async (text: string): Promise<AIInterpretationResult> => {
  return interpretText(text, 'explain_grammar')
}

export const getPronunciationTips = async (text: string): Promise<AIInterpretationResult> => {
  return interpretText(text, 'pronunciation_tips')
}

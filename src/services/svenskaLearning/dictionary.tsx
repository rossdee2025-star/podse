import axios from 'axios'
import { translateWord, getPronunciationTips } from './aiInterpretation'

export type DictionaryEntry = {
  word: string
  translation: string
  partOfSpeech?: string
  example?: string
  exampleTranslation?: string
  pronunciation?: {
    audioUrl?: string
    ipa?: string
    tips?: string
  }
}

export type PronunciationResult = {
  success: boolean
  audioUrl?: string
  username?: string
  country?: string
  error?: string
}

// Fetch pronunciation via our API route (handles Forvo calls server-side)
export const fetchPronunciation = async (word: string): Promise<PronunciationResult> => {
  try {
    const response = await axios.get(
      `/api/svenska-learning/pronunciation?word=${encodeURIComponent(word)}`,
      { timeout: 15000 }
    )
    return response.data as PronunciationResult
  } catch (error: any) {
    console.error('Pronunciation fetch error:', error?.message || error)
    return {
      success: false,
      error: error?.message || 'Failed to fetch pronunciation'
    }
  }
}

// Look up a Swedish word and get comprehensive dictionary entry
export const lookupWord = async (word: string): Promise<DictionaryEntry> => {
  // Get translation from AI
  const translationResult = await translateWord(word)

  // Try to get pronunciation audio
  const pronunciationResult = await fetchPronunciation(word)

  // Get pronunciation tips from AI if no audio available
  let pronunciationTips = ''
  if (!pronunciationResult.success) {
    const tipsResult = await getPronunciationTips(word)
    if (tipsResult.success) {
      pronunciationTips = tipsResult.content
    }
  }

  // Parse the AI translation result
  const entry: DictionaryEntry = {
    word,
    translation: '',
    pronunciation: {
      audioUrl: pronunciationResult.audioUrl,
      tips: pronunciationTips
    }
  }

  if (translationResult.success) {
    // Parse the structured response from AI
    const content = translationResult.content
    entry.translation = content

    // Try to extract structured parts if available
    const lines = content.split('\n')
    for (const line of lines) {
      const lowerLine = line.toLowerCase()
      if (lowerLine.includes('translation:') || lowerLine.includes('english:')) {
        entry.translation = line.split(':').slice(1).join(':').trim()
      }
      if (lowerLine.includes('part of speech:') || lowerLine.includes('pos:')) {
        entry.partOfSpeech = line.split(':').slice(1).join(':').trim()
      }
      if (lowerLine.includes('example:')) {
        entry.example = line.split(':').slice(1).join(':').trim()
      }
    }
  }

  return entry
}

// Simple Swedish-English word list for common words (offline fallback)
const commonSwedishWords: Record<string, string> = {
  'jag': 'I',
  'du': 'you',
  'han': 'he',
  'hon': 'she',
  'vi': 'we',
  'de': 'they',
  'det': 'it/that',
  'den': 'it/the',
  'är': 'am/is/are',
  'var': 'was/were/where',
  'har': 'have/has',
  'hade': 'had',
  'och': 'and',
  'att': 'to/that',
  'i': 'in',
  'på': 'on/at',
  'för': 'for',
  'med': 'with',
  'till': 'to',
  'av': 'of/by',
  'inte': 'not',
  'en': 'a/an (common)',
  'ett': 'a/an (neuter)',
  'som': 'who/which/that',
  'om': 'if/about',
  'men': 'but',
  'kan': 'can',
  'ska': 'shall/will',
  'vill': 'want',
  'måste': 'must',
  'hej': 'hello',
  'tack': 'thanks',
  'ja': 'yes',
  'nej': 'no',
  'bra': 'good',
  'mycket': 'much/very',
  'nu': 'now',
  'här': 'here',
  'där': 'there',
  'när': 'when',
  'hur': 'how',
  'vad': 'what',
  'varför': 'why',
  'vem': 'who'
}

// Quick lookup for common words (offline, no API call)
export const quickLookup = (word: string): string | null => {
  const normalizedWord = word.toLowerCase().trim()
  return commonSwedishWords[normalizedWord] || null
}

// Check if a word is Swedish (basic check)
export const isSwedishWord = (word: string): boolean => {
  // Swedish-specific characters
  const swedishChars = /[åäö]/i
  if (swedishChars.test(word)) {
    return true
  }
  // Check if it's in our common words list
  return !!commonSwedishWords[word.toLowerCase()]
}

import axios from 'axios'
import type { TranscriptRow } from 'podverse-shared'

export type TranscriptSegment = {
  start: number
  end: number
  text: string
}

export type TranscriptionResult = {
  success: boolean
  transcript?: TranscriptSegment[]
  fullText?: string
  language?: string
  error?: string
  provider?: string
}

export type TranscriptionStatus = 'none' | 'available' | 'generating' | 'error'

// Convert TranscriptSegment to TranscriptRow format used by Podverse
export const convertToTranscriptRows = (segments: TranscriptSegment[]): TranscriptRow[] => {
  return segments.map((segment) => ({
    startTime: segment.start,
    endTime: segment.end,
    startTimeFormatted: formatTime(segment.start),
    endTimeFormatted: formatTime(segment.end),
    body: segment.text,
    speaker: '',
    text: segment.text
  }))
}

// Format seconds to HH:MM:SS
const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Generate transcript using Whisper API
export const generateTranscript = async (
  audioUrl: string,
  language = 'sv',
  onProgress?: (status: string) => void
): Promise<TranscriptionResult> => {
  try {
    onProgress?.('Downloading audio...')

    const response = await axios.post(
      '/api/svenska-learning/transcribe',
      { audioUrl, language },
      { timeout: 600000 } // 10 minutes timeout
    )

    return response.data as TranscriptionResult
  } catch (error: any) {
    console.error('Transcription error:', error?.message || error)
    return {
      success: false,
      error: error?.response?.data?.error || error?.message || 'Transcription failed'
    }
  }
}

// Check if episode has transcript
export const hasTranscript = (episode: any): boolean => {
  return !!(episode?.transcript && episode?.transcript.length > 0)
}

// Get audio URL from episode
export const getAudioUrl = (episode: any): string | null => {
  // Try enclosure URL first
  if (episode?.mediaUrl) {
    return episode.mediaUrl
  }

  // Try from enclosure object
  if (episode?.enclosure?.url) {
    return episode.enclosure.url
  }

  // Try alternate enclosures
  if (episode?.alternateEnclosures?.length > 0) {
    const audioEnclosure = episode.alternateEnclosures.find(
      (enc: any) => enc.type?.startsWith('audio/')
    )
    if (audioEnclosure?.sources?.[0]?.url) {
      return audioEnclosure.sources[0].url
    }
  }

  return null
}

// Storage key for locally generated transcripts
const TRANSCRIPT_STORAGE_KEY = 'svenska_learning_transcripts'

// Save generated transcript to localStorage
export const saveTranscriptToLocal = (episodeId: string, transcript: TranscriptSegment[]): void => {
  try {
    const stored = localStorage.getItem(TRANSCRIPT_STORAGE_KEY)
    const transcripts = stored ? JSON.parse(stored) : {}
    transcripts[episodeId] = {
      transcript,
      generatedAt: new Date().toISOString()
    }
    localStorage.setItem(TRANSCRIPT_STORAGE_KEY, JSON.stringify(transcripts))
  } catch (error) {
    console.error('Failed to save transcript to localStorage:', error)
  }
}

// Load transcript from localStorage
export const loadTranscriptFromLocal = (episodeId: string): TranscriptSegment[] | null => {
  try {
    const stored = localStorage.getItem(TRANSCRIPT_STORAGE_KEY)
    if (stored) {
      const transcripts = JSON.parse(stored)
      return transcripts[episodeId]?.transcript || null
    }
  } catch (error) {
    console.error('Failed to load transcript from localStorage:', error)
  }
  return null
}

// Check if there's a locally stored transcript
export const hasLocalTranscript = (episodeId: string): boolean => {
  return loadTranscriptFromLocal(episodeId) !== null
}

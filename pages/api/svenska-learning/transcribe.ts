import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

type TranscribeRequest = {
  audioUrl: string
  language?: string // 'sv' for Swedish, 'auto' for auto-detect
}

type TranscriptSegment = {
  start: number
  end: number
  text: string
}

type TranscribeResult = {
  success: boolean
  transcript?: TranscriptSegment[]
  fullText?: string
  language?: string
  error?: string
}

// Download audio file to buffer
async function downloadAudio(url: string): Promise<Buffer> {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 120000, // 2 minutes timeout for large files
    maxContentLength: 100 * 1024 * 1024, // 100MB max
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; PodverseLearning/1.0)'
    }
  })
  return Buffer.from(response.data)
}

// Transcribe using local Whisper server
async function transcribeWithLocalWhisper(
  audioBuffer: Buffer,
  language: string
): Promise<TranscribeResult> {
  const whisperUrl = process.env.WHISPER_LOCAL_URL || 'http://localhost:8080'
  const whisperModel = process.env.WHISPER_MODEL || 'large-v3'

  try {
    const FormData = (await import('form-data')).default
    const formData = new FormData()

    formData.append('file', audioBuffer, {
      filename: 'audio.mp3',
      contentType: 'audio/mpeg'
    })
    formData.append('model', whisperModel)
    formData.append('response_format', 'verbose_json')
    formData.append('timestamp_granularities[]', 'segment')

    if (language && language !== 'auto') {
      formData.append('language', language)
    }

    // Try OpenAI-compatible endpoint first (used by faster-whisper-server, etc.)
    let response
    try {
      response = await axios.post(
        `${whisperUrl}/v1/audio/transcriptions`,
        formData,
        {
          headers: {
            ...formData.getHeaders()
          },
          timeout: 600000, // 10 minutes for transcription
          maxBodyLength: Infinity
        }
      )
    } catch (e) {
      // Fall back to /transcribe endpoint (used by some Whisper servers)
      response = await axios.post(
        `${whisperUrl}/transcribe`,
        formData,
        {
          headers: {
            ...formData.getHeaders()
          },
          timeout: 600000,
          maxBodyLength: Infinity
        }
      )
    }

    const data = response.data

    // Handle different response formats
    let segments: TranscriptSegment[] = []
    let fullText = ''

    if (data.segments) {
      // OpenAI/Whisper format
      segments = data.segments.map((seg: any) => ({
        start: seg.start,
        end: seg.end,
        text: (seg.text || '').trim()
      }))
      fullText = data.text || segments.map(s => s.text).join(' ')
    } else if (data.transcription) {
      // Alternative format
      fullText = data.transcription
      segments = [{
        start: 0,
        end: 0,
        text: fullText
      }]
    } else if (typeof data === 'string') {
      // Plain text response
      fullText = data
      segments = [{
        start: 0,
        end: 0,
        text: data
      }]
    }

    return {
      success: true,
      transcript: segments,
      fullText,
      language: data.language || language
    }
  } catch (error: any) {
    console.error('Local Whisper transcription error:', error?.response?.data || error?.message)
    return {
      success: false,
      error: error?.response?.data?.error?.message || error?.message || 'Local Whisper transcription failed'
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

  const { audioUrl, language = 'sv' } = req.body as TranscribeRequest

  if (!audioUrl) {
    return res.status(400).json({ error: 'Missing audioUrl parameter' })
  }

  try {
    // Download the audio file
    console.log('Downloading audio from:', audioUrl)
    const audioBuffer = await downloadAudio(audioUrl)
    console.log('Audio downloaded, size:', audioBuffer.length)

    // Transcribe using local Whisper
    const result = await transcribeWithLocalWhisper(audioBuffer, language)

    if (result.success) {
      return res.status(200).json(result)
    } else {
      return res.status(500).json(result)
    }
  } catch (error: any) {
    console.error('Transcription error:', error?.message || error)
    return res.status(500).json({
      success: false,
      error: error?.message || 'Transcription failed'
    })
  }
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    },
    responseLimit: false
  }
}

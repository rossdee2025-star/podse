import type { Episode, TranscriptRow } from 'podverse-shared'
import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getEpisodeProxyTranscript } from '~/services/transcript'
import { translateSentence } from '~/services/svenskaLearning/aiInterpretation'
import { cleanupABRepeat } from '~/services/svenskaLearning/abRepeat'
import {
  generateTranscript,
  convertToTranscriptRows,
  getAudioUrl,
  saveTranscriptToLocal,
  loadTranscriptFromLocal,
  TranscriptionStatus
} from '~/services/svenskaLearning/transcription'
import { LearningSubtitle } from './LearningSubtitle'
import { ABRepeatControls } from './ABRepeatControls'
import { Dictionary } from './Dictionary'
import { AIExplanation } from './AIExplanation'
import { MainContentSection, ButtonRectangle } from '~/components'

type Props = {
  episode?: Episode
}

type ActivePanel = 'none' | 'dictionary' | 'ai'

export const SvenskaLearningPanel = ({ episode }: Props) => {
  const { t } = useTranslation()
  const [transcriptRows, setTranscriptRows] = useState<TranscriptRow[]>([])
  const [transcriptLoading, setTranscriptLoading] = useState<boolean>(false)
  const [transcriptStatus, setTranscriptStatus] = useState<TranscriptionStatus>('none')
  const [generationProgress, setGenerationProgress] = useState<string>('')
  const [translations, setTranslations] = useState<Record<number, string>>({})
  const [selectedWord, setSelectedWord] = useState<string>('')
  const [selectedSentence, setSelectedSentence] = useState<string>('')
  const [activePanel, setActivePanel] = useState<ActivePanel>('none')
  const [showParallelTranslation, setShowParallelTranslation] = useState<boolean>(true)
  const [autoTranslate, setAutoTranslate] = useState<boolean>(false)

  const hasBuiltInTranscript = !!(episode?.transcript && episode?.transcript.length > 0)

  useEffect(() => {
    const loadTranscript = async () => {
      if (!episode) return

      setTranscriptLoading(true)

      try {
        // Check for built-in transcript first
        if (hasBuiltInTranscript) {
          let rows = await getEpisodeProxyTranscript(episode.id, 'sv')
          if (!rows.length) {
            rows = await getEpisodeProxyTranscript(episode.id)
          }
          if (rows.length > 0) {
            setTranscriptRows(rows)
            setTranscriptStatus('available')
            setTranscriptLoading(false)
            return
          }
        }

        // Check for locally stored transcript
        const localTranscript = loadTranscriptFromLocal(episode.id)
        if (localTranscript) {
          setTranscriptRows(convertToTranscriptRows(localTranscript))
          setTranscriptStatus('available')
          setTranscriptLoading(false)
          return
        }

        // No transcript available
        setTranscriptStatus('none')
      } catch (error) {
        console.error('Failed to load transcript:', error)
        setTranscriptStatus('none')
      } finally {
        setTranscriptLoading(false)
      }
    }

    loadTranscript()

    return () => {
      cleanupABRepeat()
    }
  }, [episode, hasBuiltInTranscript])

  const handleGenerateTranscript = useCallback(async () => {
    if (!episode) return

    const audioUrl = getAudioUrl(episode)
    if (!audioUrl) {
      alert(t('No audio URL found for this episode'))
      return
    }

    setTranscriptStatus('generating')
    setGenerationProgress(t('Starting transcription...'))

    try {
      const result = await generateTranscript(audioUrl, 'sv', (status) => {
        setGenerationProgress(status)
      })

      if (result.success && result.transcript) {
        // Save to localStorage for future use
        saveTranscriptToLocal(episode.id, result.transcript)

        // Convert and display
        setTranscriptRows(convertToTranscriptRows(result.transcript))
        setTranscriptStatus('available')
        setGenerationProgress('')
      } else {
        setTranscriptStatus('error')
        setGenerationProgress(result.error || t('Transcription failed'))
      }
    } catch (error: any) {
      console.error('Transcript generation error:', error)
      setTranscriptStatus('error')
      setGenerationProgress(error?.message || t('Transcription failed'))
    }
  }, [episode, t])

  const handleWordClick = useCallback((word: string, context: string) => {
    const cleanWord = word.replace(/[.,!?;:'"()]/g, '').trim()
    setSelectedWord(cleanWord)
    setSelectedSentence(context)
    setActivePanel('dictionary')
  }, [])

  const handleSentenceClick = useCallback(async (sentence: string, startTime: number, endTime: number) => {
    setSelectedSentence(sentence)

    if (autoTranslate) {
      const rowIndex = transcriptRows.findIndex(
        (row) => row.startTime === startTime && row.endTime === endTime
      )
      if (rowIndex !== -1 && !translations[rowIndex]) {
        try {
          const result = await translateSentence(sentence)
          if (result.success) {
            setTranslations((prev) => ({
              ...prev,
              [rowIndex]: result.content.split('\n')[0]
            }))
          }
        } catch (error) {
          console.error('Auto-translate failed:', error)
        }
      }
    }
  }, [autoTranslate, transcriptRows, translations])

  const translateAllVisible = async () => {
    const newTranslations: Record<number, string> = { ...translations }

    for (let i = 0; i < Math.min(transcriptRows.length, 20); i++) {
      if (!newTranslations[i]) {
        try {
          const result = await translateSentence(transcriptRows[i].body)
          if (result.success) {
            newTranslations[i] = result.content.split('\n')[0]
          }
        } catch (error) {
          console.error(`Failed to translate row ${i}:`, error)
        }
      }
    }

    setTranslations(newTranslations)
  }

  const closeDictionary = () => {
    if (activePanel === 'dictionary') {
      setActivePanel('none')
    }
  }

  const closeAI = () => {
    if (activePanel === 'ai') {
      setActivePanel('none')
    }
  }

  // No transcript available - show generation option
  if (transcriptStatus === 'none' && !transcriptLoading) {
    const audioUrl = getAudioUrl(episode)

    return (
      <div className='svenska-learning-panel'>
        <MainContentSection headerText={t('Svenska Learning')}>
          <div className='svenska-learning-panel__no-transcript'>
            <div className='no-transcript-icon'>📝</div>
            <h3>{t('No transcript available')}</h3>
            <p>{t('This episode does not have a transcript. You can generate one using AI speech recognition.')}</p>

            {audioUrl ? (
              <ButtonRectangle
                type='primary'
                label={t('Generate Transcript with Whisper')}
                onClick={handleGenerateTranscript}
              />
            ) : (
              <p className='error-text'>{t('No audio URL found for this episode')}</p>
            )}

            <p className='hint-text'>
              {t('Transcription may take a few minutes. Swedish language will be auto-detected.')}
            </p>
          </div>
        </MainContentSection>
      </div>
    )
  }

  // Generating transcript
  if (transcriptStatus === 'generating') {
    return (
      <div className='svenska-learning-panel'>
        <MainContentSection headerText={t('Svenska Learning')}>
          <div className='svenska-learning-panel__generating'>
            <div className='generating-spinner'>⏳</div>
            <h3>{t('Generating Transcript...')}</h3>
            <p>{generationProgress}</p>
            <p className='hint-text'>{t('This may take several minutes for longer episodes.')}</p>
          </div>
        </MainContentSection>
      </div>
    )
  }

  // Error state
  if (transcriptStatus === 'error') {
    return (
      <div className='svenska-learning-panel'>
        <MainContentSection headerText={t('Svenska Learning')}>
          <div className='svenska-learning-panel__error'>
            <div className='error-icon'>❌</div>
            <h3>{t('Transcription Failed')}</h3>
            <p>{generationProgress}</p>
            <ButtonRectangle
              type='secondary'
              label={t('Try Again')}
              onClick={handleGenerateTranscript}
            />
          </div>
        </MainContentSection>
      </div>
    )
  }

  return (
    <div className='svenska-learning-panel'>
      <MainContentSection
        headerText={t('Svenska Learning')}
        isLoading={transcriptLoading}
      >
        <div className='svenska-learning-panel__toolbar'>
          <label className='toolbar-option'>
            <input
              type='checkbox'
              checked={showParallelTranslation}
              onChange={(e) => setShowParallelTranslation(e.target.checked)}
            />
            {t('Show translations')}
          </label>
          <label className='toolbar-option'>
            <input
              type='checkbox'
              checked={autoTranslate}
              onChange={(e) => setAutoTranslate(e.target.checked)}
            />
            {t('Auto-translate on click')}
          </label>
          <button
            className='toolbar-btn'
            onClick={translateAllVisible}
            disabled={transcriptRows.length === 0}
          >
            {t('Translate visible')}
          </button>
          <button
            className='toolbar-btn'
            onClick={() => setActivePanel(activePanel === 'ai' ? 'none' : 'ai')}
          >
            {t('AI Assistant')}
          </button>
          {!hasBuiltInTranscript && (
            <span className='transcript-badge'>{t('AI Generated')}</span>
          )}
        </div>

        <div className='svenska-learning-panel__content'>
          <div className='content-main'>
            <LearningSubtitle
              transcriptRows={transcriptRows}
              onWordClick={handleWordClick}
              onSentenceClick={handleSentenceClick}
              showParallelTranslation={showParallelTranslation}
              translations={translations}
            />
          </div>

          <div className='content-sidebar'>
            <ABRepeatControls />

            {activePanel === 'dictionary' && (
              <Dictionary
                word={selectedWord}
                onClose={closeDictionary}
              />
            )}

            {activePanel === 'ai' && (
              <AIExplanation
                text={selectedSentence || selectedWord}
                type={selectedWord ? 'word' : 'sentence'}
                onClose={closeAI}
              />
            )}
          </div>
        </div>
      </MainContentSection>
    </div>
  )
}

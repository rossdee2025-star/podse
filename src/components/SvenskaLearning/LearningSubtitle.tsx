import classNames from 'classnames'
import type { TranscriptRow } from 'podverse-shared'
import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { playerGetPosition, playerSeekTo, playerPause } from '~/services/player/player'
import { setABFromSegment, startABRepeat } from '~/services/svenskaLearning/abRepeat'
import { SvenskaConfig } from '~/resources/SvenskaConfig'

type Props = {
  transcriptRows: TranscriptRow[]
  onWordClick?: (word: string, context: string) => void
  onSentenceClick?: (sentence: string, startTime: number, endTime: number) => void
  showParallelTranslation?: boolean
  translations?: Record<number, string>
}

export const LearningSubtitle = ({
  transcriptRows,
  onWordClick,
  onSentenceClick,
  showParallelTranslation = true,
  translations = {}
}: Props) => {
  const { t } = useTranslation()
  const [currentPlaybackPosition, setCurrentPlaybackPosition] = useState<number>(0)
  const [selectedWordIndex, setSelectedWordIndex] = useState<{ row: number; word: number } | null>(null)
  const [autoScrollOn, setAutoScrollOn] = useState<boolean>(true)

  useEffect(() => {
    const intervalId = setInterval(() => {
      const position = playerGetPosition()
      setCurrentPlaybackPosition(position)
    }, 100)

    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    if (autoScrollOn) {
      const currentRow = document.querySelector('.learning-subtitle .transcript-row.currently-playing')
      if (currentRow) {
        currentRow.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [currentPlaybackPosition, autoScrollOn])

  const handleRowClick = useCallback((row: TranscriptRow) => {
    playerSeekTo(row.startTime)
    if (onSentenceClick) {
      onSentenceClick(row.body, row.startTime, row.endTime)
    }
  }, [onSentenceClick])

  const handleWordClick = useCallback((word: string, rowIndex: number, wordIndex: number, row: TranscriptRow) => {
    setSelectedWordIndex({ row: rowIndex, word: wordIndex })
    if (onWordClick) {
      onWordClick(word, row.body)
    }
    // Auto-pause if configured
    if (SvenskaConfig.LEARNING.AUTO_PAUSE_ON_SENTENCE_END) {
      playerPause()
    }
  }, [onWordClick])

  const handleRepeatSentence = useCallback((row: TranscriptRow) => {
    setABFromSegment(row.startTime, row.endTime)
    startABRepeat()
  }, [])

  const renderWord = (word: string, rowIndex: number, wordIndex: number, row: TranscriptRow) => {
    const isSelected = selectedWordIndex?.row === rowIndex && selectedWordIndex?.word === wordIndex
    const wordClass = classNames('learning-word', {
      'selected': isSelected
    })

    return (
      <span
        key={`${rowIndex}-${wordIndex}`}
        className={wordClass}
        onClick={(e) => {
          e.stopPropagation()
          handleWordClick(word, rowIndex, wordIndex, row)
        }}
      >
        {word}
      </span>
    )
  }

  const renderTranscriptRow = (row: TranscriptRow, index: number) => {
    if (!row) return null

    const isCurrentlyPlaying =
      (currentPlaybackPosition < 1 && Math.floor(row.endTime) <= 1) ||
      (currentPlaybackPosition >= row.startTime && currentPlaybackPosition < row.endTime)

    const rowClass = classNames('transcript-row', {
      'currently-playing': isCurrentlyPlaying
    })

    // Split sentence into words
    const words = row.body.split(/(\s+)/).filter(Boolean)
    const translation = translations[index]

    return (
      <div key={index} className='learning-row-wrapper'>
        {row.speaker && (
          <div className='transcript-row__speaker'>{row.speaker}</div>
        )}
        <div className={rowClass}>
          <div className='transcript-row__content'>
            <div
              className='transcript-row__text svenska-text'
              onClick={() => handleRowClick(row)}
            >
              {words.map((word, wordIndex) => {
                // Preserve whitespace
                if (/^\s+$/.test(word)) {
                  return <span key={`${index}-${wordIndex}-space`}> </span>
                }
                return renderWord(word, index, wordIndex, row)
              })}
            </div>
            {showParallelTranslation && translation && (
              <div className='transcript-row__translation'>
                {translation}
              </div>
            )}
          </div>
          <div className='transcript-row__actions'>
            <div className='transcript-row__time'>{row.startTimeFormatted}</div>
            <button
              className='repeat-btn'
              onClick={(e) => {
                e.stopPropagation()
                handleRepeatSentence(row)
              }}
              title={t('Repeat sentence')}
            >
              🔁
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='learning-subtitle'>
      <div className='learning-subtitle__controls'>
        <label className='auto-scroll-toggle'>
          <input
            type='checkbox'
            checked={autoScrollOn}
            onChange={(e) => setAutoScrollOn(e.target.checked)}
          />
          {t('Auto-scroll')}
        </label>
      </div>
      <div className='learning-subtitle__content'>
        {transcriptRows.map(renderTranscriptRow)}
      </div>
    </div>
  )
}

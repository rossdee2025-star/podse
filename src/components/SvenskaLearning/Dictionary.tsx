import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ButtonRectangle } from '~/components'
import { DictionaryEntry, lookupWord, quickLookup } from '~/services/svenskaLearning/dictionary'

type Props = {
  word?: string
  onClose?: () => void
}

export const Dictionary = ({ word, onClose }: Props) => {
  const { t } = useTranslation()
  const [searchWord, setSearchWord] = useState<string>(word || '')
  const [entry, setEntry] = useState<DictionaryEntry | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (word) {
      setSearchWord(word)
      handleLookup(word)
    }
  }, [word])

  const handleLookup = async (wordToLookup: string) => {
    if (!wordToLookup.trim()) return

    setIsLoading(true)
    setError(null)

    // First try quick lookup for common words
    const quickResult = quickLookup(wordToLookup)
    if (quickResult) {
      setEntry({
        word: wordToLookup,
        translation: quickResult
      })
    }

    try {
      const result = await lookupWord(wordToLookup)
      setEntry(result)
    } catch (err: any) {
      setError(err?.message || t('Failed to look up word'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleLookup(searchWord)
  }

  const playPronunciation = () => {
    if (entry?.pronunciation?.audioUrl && audioRef.current) {
      audioRef.current.src = entry.pronunciation.audioUrl
      audioRef.current.play()
    }
  }

  return (
    <div className='dictionary-panel'>
      <div className='dictionary-panel__header'>
        <h3>{t('Swedish Dictionary')}</h3>
        {onClose && (
          <button className='close-btn' onClick={onClose}>×</button>
        )}
      </div>

      <form className='dictionary-panel__search' onSubmit={handleSubmit}>
        <input
          type='text'
          value={searchWord}
          onChange={(e) => setSearchWord(e.target.value)}
          placeholder={t('Enter Swedish word...')}
          className='search-input'
        />
        <ButtonRectangle
          type='primary'
          label={t('Look up')}
          onClick={() => handleLookup(searchWord)}
          isLoading={isLoading}
          disabled={!searchWord.trim()}
        />
      </form>

      {error && (
        <div className='dictionary-panel__error'>
          {error}
        </div>
      )}

      {entry && (
        <div className='dictionary-panel__entry'>
          <div className='entry-word'>
            <span className='word'>{entry.word}</span>
            {entry.partOfSpeech && (
              <span className='pos'>({entry.partOfSpeech})</span>
            )}
            {entry.pronunciation?.audioUrl && (
              <button
                className='pronunciation-btn'
                onClick={playPronunciation}
                title={t('Play pronunciation')}
              >
                🔊
              </button>
            )}
          </div>

          <div className='entry-translation'>
            <strong>{t('Translation')}:</strong>
            <p>{entry.translation}</p>
          </div>

          {entry.example && (
            <div className='entry-example'>
              <strong>{t('Example')}:</strong>
              <p className='svenska'>{entry.example}</p>
              {entry.exampleTranslation && (
                <p className='english'>{entry.exampleTranslation}</p>
              )}
            </div>
          )}

          {entry.pronunciation?.tips && (
            <div className='entry-pronunciation'>
              <strong>{t('Pronunciation tips')}:</strong>
              <p>{entry.pronunciation.tips}</p>
            </div>
          )}
        </div>
      )}

      <audio ref={audioRef} style={{ display: 'none' }} />
    </div>
  )
}

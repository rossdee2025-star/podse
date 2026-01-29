import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ButtonRectangle } from '~/components'
import {
  translateWord,
  translateSentence,
  explainGrammar,
  getPronunciationTips,
  AIInterpretationResult
} from '~/services/svenskaLearning/aiInterpretation'

type Props = {
  text?: string
  type?: 'word' | 'sentence'
  onClose?: () => void
}

type TabType = 'translate' | 'grammar' | 'pronunciation'

export const AIExplanation = ({ text, type = 'sentence', onClose }: Props) => {
  const { t } = useTranslation()
  const [inputText, setInputText] = useState<string>(text || '')
  const [activeTab, setActiveTab] = useState<TabType>('translate')
  const [result, setResult] = useState<AIInterpretationResult | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleAnalyze = async (analysisType: TabType) => {
    if (!inputText.trim()) return

    setIsLoading(true)
    setActiveTab(analysisType)
    setResult(null)

    try {
      let response: AIInterpretationResult

      switch (analysisType) {
        case 'translate':
          response = type === 'word'
            ? await translateWord(inputText)
            : await translateSentence(inputText)
          break
        case 'grammar':
          response = await explainGrammar(inputText)
          break
        case 'pronunciation':
          response = await getPronunciationTips(inputText)
          break
        default:
          response = await translateSentence(inputText)
      }

      setResult(response)
    } catch (error: any) {
      setResult({
        success: false,
        content: '',
        provider: 'deepseek',
        error: error?.message || t('Analysis failed')
      })
    } finally {
      setIsLoading(false)
    }
  }

  const renderTabContent = () => {
    if (isLoading) {
      return (
        <div className='ai-explanation__loading'>
          <span className='spinner'>⏳</span>
          {t('Analyzing...')}
        </div>
      )
    }

    if (!result) {
      return (
        <div className='ai-explanation__placeholder'>
          {t('Enter Swedish text and click a button to analyze')}
        </div>
      )
    }

    if (!result.success) {
      return (
        <div className='ai-explanation__error'>
          <strong>{t('Error')}:</strong> {result.error}
        </div>
      )
    }

    return (
      <div className='ai-explanation__result'>
        <div className='result-content'>
          {result.content.split('\n').map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
        <div className='result-provider'>
          {t('Powered by')}: {result.provider === 'deepseek' ? 'DeepSeek' : 'Kimi'}
        </div>
      </div>
    )
  }

  return (
    <div className='ai-explanation'>
      <div className='ai-explanation__header'>
        <h3>{t('AI Language Assistant')}</h3>
        {onClose && (
          <button className='close-btn' onClick={onClose}>×</button>
        )}
      </div>

      <div className='ai-explanation__input'>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={t('Enter Swedish text to analyze...')}
          rows={3}
          className='text-input'
        />
      </div>

      <div className='ai-explanation__tabs'>
        <ButtonRectangle
          type={activeTab === 'translate' ? 'primary' : 'secondary'}
          label={t('Translate')}
          onClick={() => handleAnalyze('translate')}
          isLoading={isLoading && activeTab === 'translate'}
          disabled={!inputText.trim()}
        />
        <ButtonRectangle
          type={activeTab === 'grammar' ? 'primary' : 'secondary'}
          label={t('Grammar')}
          onClick={() => handleAnalyze('grammar')}
          isLoading={isLoading && activeTab === 'grammar'}
          disabled={!inputText.trim()}
        />
        <ButtonRectangle
          type={activeTab === 'pronunciation' ? 'primary' : 'secondary'}
          label={t('Pronunciation')}
          onClick={() => handleAnalyze('pronunciation')}
          isLoading={isLoading && activeTab === 'pronunciation'}
          disabled={!inputText.trim()}
        />
      </div>

      <div className='ai-explanation__content'>
        {renderTabContent()}
      </div>
    </div>
  )
}

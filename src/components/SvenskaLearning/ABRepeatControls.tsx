import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ButtonRectangle } from '~/components'
import {
  ABRepeatState,
  getABRepeatState,
  setABRepeatStateChangeCallback,
  setPointA,
  setPointB,
  clearABPoints,
  startABRepeat,
  stopABRepeat,
  setRepeatCount,
  setSlowSpeed,
  toggleSlowMode,
  formatTime,
  getSegmentDuration
} from '~/services/svenskaLearning/abRepeat'
import { SvenskaConfig } from '~/resources/SvenskaConfig'

export const ABRepeatControls = () => {
  const { t } = useTranslation()
  const [state, setState] = useState<ABRepeatState>(getABRepeatState())

  useEffect(() => {
    setABRepeatStateChangeCallback((newState) => {
      setState(newState)
    })

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      setABRepeatStateChangeCallback(() => {})
    }
  }, [])

  const handleSetPointA = () => {
    setPointA()
  }

  const handleSetPointB = () => {
    setPointB()
  }

  const handleClear = () => {
    clearABPoints()
  }

  const handleToggleRepeat = () => {
    if (state.isActive) {
      stopABRepeat()
    } else {
      startABRepeat()
    }
  }

  const handleRepeatCountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const count = parseInt(e.target.value, 10)
    setRepeatCount(count)
  }

  const handleSlowSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const speed = parseFloat(e.target.value)
    setSlowSpeed(speed)
  }

  const duration = getSegmentDuration()
  const canStartRepeat = state.pointA !== null && state.pointB !== null

  return (
    <div className='ab-repeat-controls'>
      <div className='ab-repeat-controls__header'>
        <h3>{t('A-B Repeat')}</h3>
        {state.isActive && (
          <span className='repeat-status'>
            {t('Repeat')}: {state.currentRepeat}/{state.repeatCount === -1 ? '∞' : state.repeatCount}
          </span>
        )}
      </div>

      <div className='ab-repeat-controls__points'>
        <div className='point-control'>
          <ButtonRectangle
            type='secondary'
            label={state.pointA !== null ? `A: ${formatTime(state.pointA)}` : t('Set A')}
            onClick={handleSetPointA}
            className='point-btn'
          />
        </div>
        <div className='point-control'>
          <ButtonRectangle
            type='secondary'
            label={state.pointB !== null ? `B: ${formatTime(state.pointB)}` : t('Set B')}
            onClick={handleSetPointB}
            disabled={state.pointA === null}
            className='point-btn'
          />
        </div>
        {duration !== null && (
          <span className='segment-duration'>
            {t('Duration')}: {formatTime(duration)}
          </span>
        )}
      </div>

      <div className='ab-repeat-controls__settings'>
        <div className='setting-group'>
          <label>{t('Repeat count')}:</label>
          <select
            value={state.repeatCount}
            onChange={handleRepeatCountChange}
            disabled={state.isActive}
          >
            {SvenskaConfig.PLAYBACK.REPEAT_OPTIONS.map((count) => (
              <option key={count} value={count}>
                {count === -1 ? t('Infinite') : `${count}x`}
              </option>
            ))}
          </select>
        </div>

        <div className='setting-group'>
          <label>
            <input
              type='checkbox'
              checked={state.isSlowMode}
              onChange={toggleSlowMode}
            />
            {t('Slow mode')}
          </label>
          {state.isSlowMode && (
            <select
              value={state.slowSpeed}
              onChange={handleSlowSpeedChange}
            >
              {SvenskaConfig.PLAYBACK.SLOW_SPEEDS.map((speed) => (
                <option key={speed} value={speed}>
                  {speed}x
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className='ab-repeat-controls__actions'>
        <ButtonRectangle
          type='primary'
          label={state.isActive ? t('Stop') : t('Start Repeat')}
          onClick={handleToggleRepeat}
          disabled={!canStartRepeat}
          className={state.isActive ? 'active' : ''}
        />
        <ButtonRectangle
          type='tertiary'
          label={t('Clear')}
          onClick={handleClear}
          disabled={state.pointA === null && state.pointB === null}
        />
      </div>
    </div>
  )
}

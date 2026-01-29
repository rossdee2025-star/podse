import OmniAural from 'omniaural'
import { playerGetPosition, playerSeekTo, playerPlay, playerSetPlaybackSpeed } from '../player/player'
import { SvenskaConfig } from '~/resources/SvenskaConfig'

export type ABRepeatState = {
  isActive: boolean
  pointA: number | null
  pointB: number | null
  repeatCount: number
  currentRepeat: number
  slowSpeed: number
  isSlowMode: boolean
}

let abRepeatIntervalId: ReturnType<typeof setInterval> | null = null
let abRepeatState: ABRepeatState = {
  isActive: false,
  pointA: null,
  pointB: null,
  repeatCount: SvenskaConfig.PLAYBACK.DEFAULT_REPEAT_COUNT,
  currentRepeat: 0,
  slowSpeed: SvenskaConfig.PLAYBACK.DEFAULT_SLOW_SPEED,
  isSlowMode: false
}

// Callbacks for state updates
let onStateChangeCallback: ((state: ABRepeatState) => void) | null = null

export const setABRepeatStateChangeCallback = (callback: (state: ABRepeatState) => void) => {
  onStateChangeCallback = callback
}

const notifyStateChange = () => {
  if (onStateChangeCallback) {
    onStateChangeCallback({ ...abRepeatState })
  }
}

export const getABRepeatState = (): ABRepeatState => {
  return { ...abRepeatState }
}

export const setPointA = () => {
  const position = playerGetPosition()
  abRepeatState.pointA = position
  abRepeatState.currentRepeat = 0

  // If point B is already set and is before the new point A, clear it
  if (abRepeatState.pointB !== null && abRepeatState.pointB <= position) {
    abRepeatState.pointB = null
  }

  notifyStateChange()
  return position
}

export const setPointB = () => {
  const position = playerGetPosition()

  // Only set point B if it's after point A
  if (abRepeatState.pointA !== null && position > abRepeatState.pointA) {
    abRepeatState.pointB = position
    abRepeatState.currentRepeat = 0
    notifyStateChange()
    return position
  }

  return null
}

export const clearPointA = () => {
  abRepeatState.pointA = null
  abRepeatState.currentRepeat = 0
  if (abRepeatState.isActive) {
    stopABRepeat()
  }
  notifyStateChange()
}

export const clearPointB = () => {
  abRepeatState.pointB = null
  abRepeatState.currentRepeat = 0
  if (abRepeatState.isActive) {
    stopABRepeat()
  }
  notifyStateChange()
}

export const clearABPoints = () => {
  abRepeatState.pointA = null
  abRepeatState.pointB = null
  abRepeatState.currentRepeat = 0
  if (abRepeatState.isActive) {
    stopABRepeat()
  }
  notifyStateChange()
}

export const setRepeatCount = (count: number) => {
  abRepeatState.repeatCount = count
  abRepeatState.currentRepeat = 0
  notifyStateChange()
}

export const setSlowSpeed = (speed: number) => {
  abRepeatState.slowSpeed = speed
  if (abRepeatState.isSlowMode) {
    playerSetPlaybackSpeed(speed)
  }
  notifyStateChange()
}

export const toggleSlowMode = () => {
  abRepeatState.isSlowMode = !abRepeatState.isSlowMode
  if (abRepeatState.isSlowMode) {
    playerSetPlaybackSpeed(abRepeatState.slowSpeed)
  } else {
    // Restore normal speed from OmniAural state
    const normalSpeed = OmniAural.state.player.playSpeed.value() || 1
    playerSetPlaybackSpeed(normalSpeed)
  }
  notifyStateChange()
}

export const startABRepeat = () => {
  if (abRepeatState.pointA === null || abRepeatState.pointB === null) {
    console.warn('Cannot start A-B repeat: both points must be set')
    return false
  }

  abRepeatState.isActive = true
  abRepeatState.currentRepeat = 0

  // Seek to point A
  playerSeekTo(abRepeatState.pointA)
  playerPlay()

  // Apply slow mode if enabled
  if (abRepeatState.isSlowMode) {
    playerSetPlaybackSpeed(abRepeatState.slowSpeed)
  }

  // Start monitoring loop
  const checkInterval = 100 // Check every 100ms
  abRepeatIntervalId = setInterval(() => {
    if (!abRepeatState.isActive) {
      return
    }

    const currentPosition = playerGetPosition()

    // Check if we've reached point B
    if (currentPosition >= abRepeatState.pointB!) {
      abRepeatState.currentRepeat++
      notifyStateChange()

      // Check if we've completed all repeats (-1 = infinite)
      if (abRepeatState.repeatCount !== -1 && abRepeatState.currentRepeat >= abRepeatState.repeatCount) {
        stopABRepeat()
        return
      }

      // Loop back to point A
      playerSeekTo(abRepeatState.pointA!)
    }
  }, checkInterval)

  notifyStateChange()
  return true
}

export const stopABRepeat = () => {
  abRepeatState.isActive = false

  if (abRepeatIntervalId) {
    clearInterval(abRepeatIntervalId)
    abRepeatIntervalId = null
  }

  // Restore normal playback speed if slow mode was enabled
  if (abRepeatState.isSlowMode) {
    const normalSpeed = OmniAural.state.player.playSpeed.value() || 1
    playerSetPlaybackSpeed(normalSpeed)
    abRepeatState.isSlowMode = false
  }

  notifyStateChange()
}

export const toggleABRepeat = () => {
  if (abRepeatState.isActive) {
    stopABRepeat()
  } else {
    startABRepeat()
  }
}

// Set A-B points from a transcript segment
export const setABFromSegment = (startTime: number, endTime: number) => {
  abRepeatState.pointA = startTime
  abRepeatState.pointB = endTime
  abRepeatState.currentRepeat = 0
  notifyStateChange()
}

// Get formatted time string for display
export const formatTime = (seconds: number | null): string => {
  if (seconds === null) return '--:--'

  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Get A-B segment duration
export const getSegmentDuration = (): number | null => {
  if (abRepeatState.pointA === null || abRepeatState.pointB === null) {
    return null
  }
  return abRepeatState.pointB - abRepeatState.pointA
}

// Check if current position is within A-B segment
export const isWithinABSegment = (position: number): boolean => {
  if (abRepeatState.pointA === null || abRepeatState.pointB === null) {
    return false
  }
  return position >= abRepeatState.pointA && position <= abRepeatState.pointB
}

// Cleanup function for component unmount
export const cleanupABRepeat = () => {
  stopABRepeat()
  abRepeatState = {
    isActive: false,
    pointA: null,
    pointB: null,
    repeatCount: SvenskaConfig.PLAYBACK.DEFAULT_REPEAT_COUNT,
    currentRepeat: 0,
    slowSpeed: SvenskaConfig.PLAYBACK.DEFAULT_SLOW_SPEED,
    isSlowMode: false
  }
  onStateChangeCallback = null
}

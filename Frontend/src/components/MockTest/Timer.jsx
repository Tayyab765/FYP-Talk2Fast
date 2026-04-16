import { useState, useEffect, useRef } from 'react'
import { useTest } from '../../context/TestContext'
import './Timer.css'

/**
 * Timer Component
 * 
 * Displays remaining time for the current section with:
 * - MM:SS format countdown
 * - Updates every second
 * - Syncs with server every 30 seconds
 * - Red warning when < 5 minutes
 * - Notification when < 1 minute
 * - Auto-submit when timer reaches 0
 * 
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 24.5, 24.6
 */
export default function Timer() {
  const {
    timeRemaining,
    serverTimeOffset,
    syncTimer,
    submitCurrentSection,
    submitFinalTest,
    currentSection,
    currentAttempt,
  } = useTest()

  const [displayTime, setDisplayTime] = useState(timeRemaining)
  const [hasShownOneMinuteWarning, setHasShownOneMinuteWarning] = useState(false)
  
  const syncIntervalRef = useRef(null)
  const countdownIntervalRef = useRef(null)
  const autoSubmitTriggeredRef = useRef(false)

  // Format seconds to MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // Show browser notification for 1 minute warning
  const showOneMinuteWarning = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Time Warning', {
        body: 'Less than 1 minute remaining in this section!',
        icon: '/favicon.svg',
      })
    } else {
      // Fallback to alert if notifications not available
      alert('Warning: Less than 1 minute remaining in this section!')
    }
  }

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  // Initialize display time when timeRemaining changes from server
  useEffect(() => {
    setDisplayTime(timeRemaining)
    setHasShownOneMinuteWarning(false)
    autoSubmitTriggeredRef.current = false
  }, [timeRemaining])

  // Countdown timer - updates every second
  useEffect(() => {
    countdownIntervalRef.current = setInterval(() => {
      setDisplayTime((prev) => {
        const newTime = Math.max(0, prev - 1)
        return newTime
      })
    }, 1000)

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [])

  // Sync with server every 30 seconds
  useEffect(() => {
    syncIntervalRef.current = setInterval(() => {
      syncTimer()
    }, 30000) // 30 seconds

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current)
      }
    }
  }, [syncTimer])

  // Handle warnings and auto-submit based on displayTime
  useEffect(() => {
    // Don't do anything if there's no current attempt
    if (!currentAttempt) {
      return
    }
    
    // Show warning when < 1 minute (60 seconds)
    if (displayTime === 60 && !hasShownOneMinuteWarning) {
      showOneMinuteWarning()
      setHasShownOneMinuteWarning(true)
    }

    // Auto-submit when timer reaches 0
    if (displayTime === 0 && !autoSubmitTriggeredRef.current) {
      autoSubmitTriggeredRef.current = true
      
      console.log('Timer expired! Current section:', currentSection)
      
      // Validate currentSection before determining action
      if (currentSection === undefined || currentSection === null) {
        console.error('Cannot auto-submit: currentSection is undefined/null')
        return
      }
      
      // Validate that currentSection is within valid range (0-3)
      if (currentSection < 0 || currentSection > 3) {
        console.error('Cannot auto-submit: currentSection out of range:', currentSection)
        return
      }
      
      // Determine if this is the final section (section 3 = index 3)
      const isFinalSection = currentSection === 3
      
      console.log('Is final section?', isFinalSection)
      
      if (isFinalSection) {
        submitFinalTest().catch((error) => {
          console.error('Auto-submit final test failed:', error)
        })
      } else {
        submitCurrentSection().catch((error) => {
          console.error('Auto-submit section failed:', error)
        })
      }
    }
  }, [displayTime, hasShownOneMinuteWarning, currentSection, currentAttempt, submitCurrentSection, submitFinalTest])

  // Determine if we should show warning state (< 5 minutes = 300 seconds)
  const isWarning = displayTime < 300

  return (
    <div className={`timer ${isWarning ? 'timer--warning' : ''}`}>
      <div className="timer__label">Time Remaining</div>
      <div className="timer__display">{formatTime(displayTime)}</div>
    </div>
  )
}

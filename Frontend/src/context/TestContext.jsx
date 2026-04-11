import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import {
  startTest,
  getAttempt,
  saveAnswer,
  markForReview,
  submitSection,
  submitTest,
} from '../api/mockTestApi'

const TestContext = createContext({
  // Current attempt state
  currentAttempt: null,
  currentSection: 0,
  questions: [],
  answers: new Map(),
  markedForReview: [],
  timeRemaining: 0,
  currentQuestionIndex: 0,
  
  // Server time offset for timer sync
  serverTimeOffset: 0,
  
  // Loading states
  isLoading: false,
  isSaving: false,
  
  // Actions
  startNewTest: () => {},
  resumeTest: () => {},
  selectAnswer: () => {},
  toggleMarkForReview: () => {},
  navigateToQuestion: () => {},
  nextQuestion: () => {},
  previousQuestion: () => {},
  submitCurrentSection: () => {},
  submitFinalTest: () => {},
  syncTimer: () => {},
  clearTestState: () => {},
})

export function TestProvider({ children }) {
  // State management
  const [currentAttempt, setCurrentAttempt] = useState(null)
  const [currentSection, setCurrentSection] = useState(0) // Initialize to 0, never undefined
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState(new Map())
  const [markedForReview, setMarkedForReview] = useState([])
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [serverTimeOffset, setServerTimeOffset] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  // Debug: Log currentSection changes
  useEffect(() => {
    console.log('currentSection changed to:', currentSection)
    // Safeguard: if currentSection becomes undefined, reset to 0
    if (currentSection === undefined || currentSection === null) {
      console.error('currentSection became undefined/null! Resetting to 0')
      setCurrentSection(0)
    }
  }, [currentSection])
  
  // Refs for debouncing and tracking
  const saveTimeoutRef = useRef(null)
  const timerSyncIntervalRef = useRef(null)
  const isSubmittingRef = useRef(false)

  /**
   * Start a new test attempt
   * @param {string} testId - Test template ID
   */
  const startNewTest = useCallback(async (testId) => {
    setIsLoading(true)
    try {
      const response = await startTest(testId)
      
      setCurrentAttempt({
        attemptId: response.attemptId,
        testId: testId,
      })
      
      // Ensure currentSection is always a valid number (0-3)
      const sectionIndex = typeof response.currentSection === 'number' 
        ? response.currentSection 
        : 0
      console.log('Starting test with section:', sectionIndex)
      setCurrentSection(sectionIndex)
      
      setQuestions(response.questions || [])
      setAnswers(new Map())
      setMarkedForReview([])
      setCurrentQuestionIndex(0)
      
      // Calculate server time offset
      const serverTime = new Date(response.serverTime)
      const localTime = new Date()
      setServerTimeOffset(serverTime - localTime)
      
      // Set initial time remaining (convert minutes to seconds)
      setTimeRemaining((response.sectionDuration || 0) * 60)
      
      return response
    } catch (error) {
      console.error('Failed to start test:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Resume an existing test attempt
   * @param {string} attemptId - Test attempt ID
   */
  const resumeTest = useCallback(async (attemptId) => {
    setIsLoading(true)
    try {
      const response = await getAttempt(attemptId)
      
      setCurrentAttempt({
        attemptId: response.attemptId,
        testId: response.testId,
      })
      
      // Ensure currentSection is always a valid number (0-3)
      const sectionIndex = typeof response.currentSection === 'number' 
        ? response.currentSection 
        : 0
      console.log('Resuming test with section:', sectionIndex)
      setCurrentSection(sectionIndex)
      
      setQuestions(response.questions || [])
      
      // Convert answers object to Map
      const answersMap = new Map()
      if (response.answers) {
        Object.entries(response.answers).forEach(([questionId, answer]) => {
          answersMap.set(questionId, answer)
        })
      }
      setAnswers(answersMap)
      
      setMarkedForReview(response.markedForReview || [])
      setTimeRemaining(response.timeRemaining || 0)
      setCurrentQuestionIndex(0)
      
      // Calculate server time offset
      const serverTime = new Date(response.serverTime)
      const localTime = new Date()
      setServerTimeOffset(serverTime - localTime)
      
      return response
    } catch (error) {
      console.error('Failed to resume test:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [])

  /**
   * Select an answer for the current question (with auto-save and debouncing)
   * @param {string} questionId - Question ID
   * @param {string} answer - Selected answer (A, B, C, or D)
   */
  const selectAnswer = useCallback((questionId, answer) => {
    if (!currentAttempt) return
    
    // Update local state immediately for responsive UI
    setAnswers(prev => {
      const newAnswers = new Map(prev)
      newAnswers.set(questionId, answer)
      return newAnswers
    })
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Debounce save operation (500ms)
    saveTimeoutRef.current = setTimeout(async () => {
      setIsSaving(true)
      try {
        await saveAnswer(currentAttempt.attemptId, {
          questionId,
          answer,
        })
      } catch (error) {
        console.error('Failed to save answer:', error)
        // Optionally: show error notification to user
      } finally {
        setIsSaving(false)
      }
    }, 500)
  }, [currentAttempt])

  /**
   * Toggle mark for review status of a question
   * @param {string} questionId - Question ID
   */
  const toggleMarkForReview = useCallback(async (questionId) => {
    if (!currentAttempt) return
    
    const isCurrentlyMarked = markedForReview.includes(questionId)
    const newMarked = !isCurrentlyMarked
    
    // Update local state immediately
    setMarkedForReview(prev => {
      if (newMarked) {
        return [...prev, questionId]
      } else {
        return prev.filter(id => id !== questionId)
      }
    })
    
    // Save to server
    try {
      await markForReview(currentAttempt.attemptId, {
        questionId,
        marked: newMarked,
      })
    } catch (error) {
      console.error('Failed to mark for review:', error)
      // Revert local state on error
      setMarkedForReview(prev => {
        if (newMarked) {
          return prev.filter(id => id !== questionId)
        } else {
          return [...prev, questionId]
        }
      })
    }
  }, [currentAttempt, markedForReview])

  /**
   * Navigate to a specific question by index
   * @param {number} index - Question index (0-based)
   */
  const navigateToQuestion = useCallback((index) => {
    if (index >= 0 && index < questions.length) {
      setCurrentQuestionIndex(index)
    }
  }, [questions.length])

  /**
   * Navigate to the next question
   */
  const nextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1)
    }
  }, [currentQuestionIndex, questions.length])

  /**
   * Navigate to the previous question
   */
  const previousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1)
    }
  }, [currentQuestionIndex])

  /**
   * Submit the current section and move to the next
   */
  const submitCurrentSection = useCallback(async () => {
    if (!currentAttempt) {
      console.error('Cannot submit section: no current attempt')
      return
    }
    
    // Prevent duplicate submissions
    if (isSubmittingRef.current) {
      console.log('Submission already in progress, skipping duplicate request')
      return
    }
    
    // Validate currentSection before submission
    if (currentSection === undefined || currentSection === null) {
      console.error('Cannot submit section: currentSection is undefined/null')
      return
    }
    
    isSubmittingRef.current = true
    setIsLoading(true)
    try {
      console.log('Submitting section:', currentSection, 'for attempt:', currentAttempt.attemptId)
      const payload = {
        sectionIndex: currentSection,
      }
      console.log('Payload being sent:', JSON.stringify(payload))
      
      const response = await submitSection(currentAttempt.attemptId, payload)
      
      // Check if test is completed (last section was submitted)
      if (response.status === 'completed') {
        console.log('Test completed! Score:', response.score)
        // Update the attempt with completed status so TestTaking component can navigate
        setCurrentAttempt({
          ...currentAttempt,
          status: 'completed',
          attemptId: response.attemptId,
        })
        return response
      }
      
      // Ensure nextSection is always a valid number
      const nextSectionIndex = typeof response.nextSection === 'number' 
        ? response.nextSection 
        : currentSection + 1
      console.log('Section submitted successfully. Next section:', nextSectionIndex)
      
      // Update state with next section data
      setCurrentSection(nextSectionIndex)
      setQuestions(response.questions || [])
      setCurrentQuestionIndex(0)
      
      // Update server time offset
      const serverTime = new Date(response.serverTime)
      const localTime = new Date()
      setServerTimeOffset(serverTime - localTime)
      
      // Set time remaining for next section (convert minutes to seconds)
      setTimeRemaining((response.sectionDuration || 0) * 60)
      
      return response
    } catch (error) {
      console.error('Failed to submit section:', error)
      throw error
    } finally {
      setIsLoading(false)
      isSubmittingRef.current = false
    }
  }, [currentAttempt, currentSection])

  /**
   * Submit the final test
   */
  const submitFinalTest = useCallback(async () => {
    if (!currentAttempt) return
    
    // Prevent duplicate submissions
    if (isSubmittingRef.current) {
      console.log('Submission already in progress, skipping duplicate request')
      return
    }
    
    isSubmittingRef.current = true
    setIsLoading(true)
    try {
      const response = await submitTest(currentAttempt.attemptId)
      
      // Update the attempt with completed status so TestTaking component can navigate
      setCurrentAttempt({
        ...currentAttempt,
        status: 'completed',
        attemptId: response.attemptId,
      })
      
      return response
    } catch (error) {
      console.error('Failed to submit test:', error)
      throw error
    } finally {
      setIsLoading(false)
      isSubmittingRef.current = false
    }
  }, [currentAttempt])

  /**
   * Sync timer with server (called every 30 seconds)
   */
  const syncTimer = useCallback(async () => {
    if (!currentAttempt) return
    
    try {
      const response = await getAttempt(currentAttempt.attemptId)
      
      // Update server time offset
      const serverTime = new Date(response.serverTime)
      const localTime = new Date()
      setServerTimeOffset(serverTime - localTime)
      
      // Update time remaining from server
      setTimeRemaining(response.timeRemaining || 0)
    } catch (error) {
      console.error('Failed to sync timer:', error)
      // Continue using local time on sync failure
    }
  }, [currentAttempt])

  /**
   * Clear all test state (for cleanup)
   */
  const clearTestState = useCallback(() => {
    setCurrentAttempt(null)
    setCurrentSection(0)
    setQuestions([])
    setAnswers(new Map())
    setMarkedForReview([])
    setTimeRemaining(0)
    setCurrentQuestionIndex(0)
    setServerTimeOffset(0)
    
    // Clear any pending save operations
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    
    // Clear timer sync interval
    if (timerSyncIntervalRef.current) {
      clearInterval(timerSyncIntervalRef.current)
    }
  }, [])

  // Set up timer sync interval when test is active
  useEffect(() => {
    if (currentAttempt) {
      // Sync every 30 seconds
      timerSyncIntervalRef.current = setInterval(() => {
        syncTimer()
      }, 30000)
      
      return () => {
        if (timerSyncIntervalRef.current) {
          clearInterval(timerSyncIntervalRef.current)
        }
      }
    }
  }, [currentAttempt, syncTimer])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
      if (timerSyncIntervalRef.current) {
        clearInterval(timerSyncIntervalRef.current)
      }
    }
  }, [])

  const value = {
    // State
    currentAttempt,
    currentSection,
    questions,
    answers,
    markedForReview,
    timeRemaining,
    currentQuestionIndex,
    serverTimeOffset,
    isLoading,
    isSaving,
    
    // Actions
    startNewTest,
    resumeTest,
    selectAnswer,
    toggleMarkForReview,
    navigateToQuestion,
    nextQuestion,
    previousQuestion,
    submitCurrentSection,
    submitFinalTest,
    syncTimer,
    clearTestState,
  }

  return <TestContext.Provider value={value}>{children}</TestContext.Provider>
}

export function useTest() {
  return useContext(TestContext)
}

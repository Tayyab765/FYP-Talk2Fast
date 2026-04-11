import { createContext, useContext, useState, useCallback } from 'react'

const NotificationContext = createContext()

export function useNotification() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider')
  }
  return context
}

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([])

  const showNotification = useCallback((message, type = 'info', options = {}) => {
    const id = Date.now() + Math.random()
    const notification = {
      id,
      message,
      type, // 'success', 'error', 'warning', 'info'
      duration: options.duration || 5000,
      showRetry: options.showRetry || false,
      onRetry: options.onRetry,
    }

    setNotifications(prev => [...prev, notification])

    // Auto-dismiss after duration
    if (notification.duration > 0) {
      setTimeout(() => {
        dismissNotification(id)
      }, notification.duration)
    }

    return id
  }, [])

  const dismissNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }, [])

  const showError = useCallback((message, options = {}) => {
    return showNotification(message, 'error', options)
  }, [showNotification])

  const showSuccess = useCallback((message, options = {}) => {
    return showNotification(message, 'success', options)
  }, [showNotification])

  const showWarning = useCallback((message, options = {}) => {
    return showNotification(message, 'warning', options)
  }, [showNotification])

  const showInfo = useCallback((message, options = {}) => {
    return showNotification(message, 'info', options)
  }, [showNotification])

  const value = {
    notifications,
    showNotification,
    showError,
    showSuccess,
    showWarning,
    showInfo,
    dismissNotification,
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

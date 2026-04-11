import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'
import { TestProvider } from './context/TestContext.jsx'
import Notification from './components/Notification.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <NotificationProvider>
        <TestProvider>
          <App />
          <Notification />
        </TestProvider>
      </NotificationProvider>
    </AuthProvider>
  </React.StrictMode>,
)

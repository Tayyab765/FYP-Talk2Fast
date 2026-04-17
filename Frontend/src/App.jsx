import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import ChatAssistant from './pages/ChatAssistant'
import Landing from './pages/Landing'
import MockTestList from './pages/MockTests/MockTestList'
import TestTaking from './pages/MockTests/TestTaking'
import TestResults from './pages/MockTests/TestResults'
import TestAnalytics from './pages/MockTests/TestAnalytics'
import PublicLayout from './layouts/PublicLayout'
import DashboardLayout from './layouts/DashboardLayout'
import CareerDashboard from './pages/career/CareerDashboard'
import Questionnaire from './pages/career/Questionnaire'
import CareerProfile from './pages/career/CareerProfile'
import Recommendations from './pages/career/Recommendations'
import CareerChat from './pages/career/CareerChat'
import Payscale from './pages/career/Payscale'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
        <Route element={<ErrorBoundary><DashboardLayout /></ErrorBoundary>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/chat" element={<ChatAssistant />} />
          <Route path="/dashboard/mock-tests" element={<MockTestList />} />
          <Route path="/dashboard/mock-tests/take" element={<TestTaking />} />
          <Route path="/dashboard/mock-tests/results/:attemptId" element={<TestResults />} />
          <Route path="/dashboard/mock-tests/analytics" element={<TestAnalytics />} />
          <Route path="/dashboard/settings" element={<Dashboard />} />
          {/* Career Counseling Module */}
          <Route path="/dashboard/career" element={<CareerDashboard />} />
          <Route path="/dashboard/career/questionnaire" element={<Questionnaire />} />
          <Route path="/dashboard/career/profile" element={<CareerProfile />} />
          <Route path="/dashboard/career/recommendations" element={<Recommendations />} />
          <Route path="/dashboard/career/chat" element={<CareerChat />} />
          <Route path="/dashboard/career/payscale" element={<Payscale />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

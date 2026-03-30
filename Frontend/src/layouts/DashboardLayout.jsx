import { Outlet } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import DashboardHeader from '../components/DashboardHeader'
import './DashboardLayout.css'

export default function DashboardLayout() {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <div className="dashboard-body">
        <DashboardHeader />
        <main className="dashboard-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

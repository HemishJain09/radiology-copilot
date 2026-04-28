import { useState } from 'react'
import { Activity, Upload, FileText } from 'lucide-react'
import UploadDashboard from './components/UploadDashboard'
import ReviewDashboard from './components/ReviewDashboard'

function App() {
  const [activeTab, setActiveTab] = useState('upload')

  return (
    <div className="app-container">
      {/* Header */}
      <header className="header">
        <h1>
          <Activity size={24} />
          Radiology Copilot AI
        </h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className={`btn ${activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={18} />
            New Scan
          </button>
          <button 
            className={`btn ${activeTab === 'review' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('review')}
          >
            <FileText size={18} />
            Review Cases
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {activeTab === 'upload' && <UploadDashboard />}
        {activeTab === 'review' && <ReviewDashboard />}
      </main>
    </div>
  )
}

export default App

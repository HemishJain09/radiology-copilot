import React, { useState, useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Edit3, Loader } from 'lucide-react';

export default function ReviewDashboard() {
  const [reports, setReports] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  const [feedbackGiven, setFeedbackGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedText, setEditedText] = useState("");

  // Fetch pending reports from the Backend (which pulls from Firestore)
  useEffect(() => {
    fetchPendingReports();
  }, []);

  const fetchPendingReports = async () => {
    setIsLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      const response = await fetch(`${apiUrl}/api/reports/pending`);
      const data = await response.json();
      if (data.status === 'success') {
        setReports(data.reports);
        if (data.reports.length > 0) {
          setEditedText(data.reports[0].report_text);
        }
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (action) => {
    setIsSubmitting(true);
    const currentReport = reports[currentIndex];
    
    const formData = new FormData();
    formData.append('report_id', currentReport.id);
    formData.append('action', action);
    formData.append('edited_text', editedText);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
      const response = await fetch(`${apiUrl}/api/feedback`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      if (data.status === 'success') {
        setFeedbackGiven(true);
        alert(`Feedback Recorded in Firestore!\nAction: ${action}\nReward Signal (${data.reward_score}) sent.`);
        
        // Remove the processed report from the queue after a short delay
        setTimeout(() => {
          const newReports = reports.filter((_, index) => index !== currentIndex);
          setReports(newReports);
          if (newReports.length > 0) {
            setEditedText(newReports[0].report_text);
            setCurrentIndex(0);
          }
          setFeedbackGiven(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      alert("Failed to submit feedback. Check backend connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
        <Loader size={48} color="var(--primary-accent)" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
        <h3>Loading Pending Cases...</h3>
      </div>
    );
  }

  if (reports.length === 0) {
    return (
      <div className="card">
        <h2 style={{ marginBottom: '1rem', fontWeight: 600 }}>Case Review</h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          No pending cases for review. You're all caught up!
        </p>
      </div>
    );
  }

  const currentReport = reports[currentIndex];

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontWeight: 600 }}>Case Review</h2>
        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Queue: {currentIndex + 1} of {reports.length}
        </span>
      </div>
      
      <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
        Validate the AI-generated report. Your feedback improves the system's accuracy over time.
      </p>

      <div style={{ display: 'flex', gap: '2rem' }}>
        {/* Real Image Area from Firebase Storage */}
        <div style={{ flex: 1 }}>
          <div style={{ 
            backgroundColor: 'var(--bg-color)', 
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            maxHeight: '500px'
          }}>
            {currentReport.image_url ? (
              <img 
                src={currentReport.image_url} 
                alt="Patient X-Ray" 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
            ) : (
              <span style={{ padding: '4rem', color: 'var(--text-secondary)' }}>No Image Found</span>
            )}
          </div>
          
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px' }}>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}><strong>Routing Status:</strong> {currentReport.routing === 'senior' ? '🔴 Senior Radiologist Required' : '🟢 Junior Radiologist'}</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}><strong>AI Detection:</strong> {currentReport.findings?.disease}</p>
          </div>
        </div>

        {/* Report Editor & Feedback */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Generated Report</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', background: '#e0e7ff', color: 'var(--primary-accent)', borderRadius: '999px', fontWeight: 500 }}>
                Confidence: {(currentReport.findings?.confidence * 100).toFixed(1)}%
              </span>
            </div>
            
            <textarea 
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '1rem',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                fontFamily: 'inherit',
                fontSize: '0.875rem',
                resize: 'vertical',
                lineHeight: '1.5'
              }}
            />
          </div>

          {!feedbackGiven ? (
            <div>
              <p style={{ fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                Provide Feedback (RLHF):
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <button disabled={isSubmitting} className="btn" style={{ background: '#ecfdf5', color: '#047857', border: '1px solid #a7f3d0' }} onClick={() => handleFeedback('Approved (+1)')}>
                  <CheckCircle size={16} /> Approve
                </button>
                <button disabled={isSubmitting} className="btn" style={{ background: '#fef3c7', color: '#b45309', border: '1px solid #fde68a' }} onClick={() => handleFeedback('Minor Edit (-0.5)')}>
                  <Edit3 size={16} /> Minor Edit
                </button>
                <button disabled={isSubmitting} className="btn" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }} onClick={() => handleFeedback('Major Correction (-1)')}>
                  <AlertTriangle size={16} /> Major Issue
                </button>
                <button disabled={isSubmitting} className="btn" style={{ background: '#fef2f2', color: '#b91c1c', border: '1px solid #fecaca' }} onClick={() => handleFeedback('Wrong (-2)')}>
                  <XCircle size={16} /> Wrong Diagnosis
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: '1rem', background: '#ecfdf5', borderRadius: '8px', color: '#047857', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CheckCircle size={20} />
              <span style={{ fontWeight: 500 }}>Feedback saved! Loading next case...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

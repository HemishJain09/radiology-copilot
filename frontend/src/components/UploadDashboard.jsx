import React, { useState } from 'react';
import { Upload, Loader, CheckCircle, AlertCircle } from 'lucide-react';

export default function UploadDashboard() {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, uploading, complete, error
    const [mockResult, setMockResult] = useState(null);
    const [fullReport, setFullReport] = useState(null);
    const [elapsedTime, setElapsedTime] = useState(0);

    React.useEffect(() => {
        let interval;
        if (status === 'uploading') {
            interval = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else {
            setElapsedTime(0);
        }
        return () => clearInterval(interval);
    }, [status]);

    const handleFileDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const loadExampleImage = async (num) => {
        setStatus('idle');
        try {
            // Using local images placed in frontend/public/examples/
            const url = `/examples/example_${num}.jpg`;
            const response = await fetch(url);
            if (!response.ok) throw new Error("File not found");
            const blob = await response.blob();
            const exampleFile = new File([blob], `example_chest_xray_${num}.jpg`, { type: "image/jpeg" });
            setFile(exampleFile);
        } catch (err) {
            console.error("Failed to load example image", err);
            alert(`Could not load example_${num}.jpg. Make sure you have placed it in frontend/public/examples/`);
        }
    };

    const submitToAPI = async () => {
        if (!file) return;
        setStatus('uploading');

        const formData = new FormData();
        formData.append('file', file);

        try {
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8001';
            const response = await fetch(`${apiUrl}/api/upload`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (data.status === 'success') {
                setMockResult(data.data.findings);
                setFullReport(data.data.report);
                setStatus('complete');
            } else {
                setStatus('error');
            }
        } catch (error) {
            console.error("Error uploading file:", error);
            setStatus('error');
        }
    };

    return (
        <div className="card">
            <h2 style={{ marginBottom: '1rem', fontWeight: 600 }}>Upload X-Ray</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Upload a patient chest X-ray to generate an AI-assisted structured report and confidence score.
            </p>

            {status === 'idle' && (
                <>
                    <div
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleFileDrop}
                        style={{
                            border: '2px dashed var(--border-color)',
                            borderRadius: '12px',
                            padding: '4rem 2rem',
                            textAlign: 'center',
                            backgroundColor: 'var(--bg-color)',
                            cursor: 'pointer',
                            marginBottom: '1rem'
                        }}
                        onClick={() => document.getElementById('file-upload').click()}
                    >
                        <Upload size={48} color="var(--primary-accent)" style={{ margin: '0 auto 1rem', opacity: 0.8 }} />
                        <h3 style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Drag & Drop X-Ray Image</h3>
                        <p style={{ color: 'var(--text-secondary)' }}>Supports .png, .jpg, .jpeg</p>
                        <input
                            id="file-upload"
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleFileSelect}
                        />
                    </div>

                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Don't have an X-Ray handy?</p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button className="btn" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569' }} onClick={() => loadExampleImage(1)}>
                                Load Example 1
                            </button>
                            <button className="btn" style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', color: '#475569' }} onClick={() => loadExampleImage(2)}>
                                Load Example 2
                            </button>
                        </div>
                    </div>

                    {file && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                            <span style={{ fontWeight: 500 }}>Selected: {file.name}</span>
                            <button className="btn btn-primary" onClick={submitToAPI}>Process with AI</button>
                        </div>
                    )}
                </>
            )}

            {status === 'uploading' && (
                <div style={{ textAlign: 'center', padding: '4rem 0' }}>
                    <Loader size={48} color="var(--primary-accent)" className="spinner" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
                    <h3>Analyzing Image...</h3>
                    <p style={{ color: 'var(--text-secondary)' }}>Running YOLOv8 Detection & Gemma Report Generation</p>

                    <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#f0f9ff', borderRadius: '8px', display: 'inline-block' }}>
                        <p style={{ fontWeight: 600, color: 'var(--primary-accent)' }}>Time Elapsed: {Math.floor(elapsedTime / 60)}:{(elapsedTime % 60).toString().padStart(2, '0')}</p>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem', maxWidth: '300px' }}>
                            Note: Free Hugging Face Spaces go to sleep. It may take <strong>2 to 3 minutes</strong> for the models to boot up on the very first scan. Please do not refresh.
                        </p>
                    </div>

                    <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
                </div>
            )}

            {status === 'error' && (
                <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--danger-color)' }}>
                    <AlertCircle size={48} style={{ margin: '0 auto 1rem' }} />
                    <h3>Connection Error</h3>
                    <p>Make sure the FastAPI backend is running on port 8001.</p>
                    <button className="btn btn-secondary" style={{ marginTop: '1rem' }} onClick={() => setStatus('idle')}>Try Again</button>
                </div>
            )}

            {status === 'complete' && mockResult && (
                <div style={{ padding: '2rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success-color)', marginBottom: '1.5rem' }}>
                        <CheckCircle size={24} />
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 600 }}>Analysis Complete</h3>
                    </div>

                    <div style={{ background: 'var(--bg-color)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                        <h4 style={{ marginBottom: '1rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.05em' }}>Structured Findings</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Detected Condition</p>
                                <p style={{ fontWeight: 600, fontSize: '1.125rem' }}>{mockResult.disease}</p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Confidence Score</p>
                                <p style={{ fontWeight: 600, fontSize: '1.125rem', color: mockResult.confidence > 0.8 ? 'var(--success-color)' : 'var(--warning-color)' }}>
                                    {(mockResult.confidence * 100).toFixed(1)}%
                                </p>
                            </div>
                            <div>
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Severity</p>
                                <p style={{ fontWeight: 600, fontSize: '1.125rem' }}>{mockResult.severity}</p>
                            </div>
                        </div>
                        {/* Displaying a snippet of the generated report here too */}
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Generated Report Snippet</p>
                            <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.875rem', marginTop: '0.5rem' }}>{fullReport}</p>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem' }}>
                        <button className="btn btn-secondary" onClick={() => { setStatus('idle'); setFile(null); }}>Upload Another</button>
                        <button className="btn btn-primary" onClick={() => alert("This case is now ready for Doctor Review in the Review Cases tab.")}>Send to Review Queue</button>
                    </div>
                </div>
            )}
        </div>
    );
}

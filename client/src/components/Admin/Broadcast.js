import React, { useState } from 'react';

// Icon components using Bootstrap Icon classes (bi bi-*)
const Send = ({ className }) => <i className={`bi bi-send-fill ${className}`}></i>;
const Mail = ({ className }) => <i className={`bi bi-envelope-open-fill fs-3 ${className}`}></i>; 
const UserIcon = ({ className }) => <i className={`bi bi-people-fill ${className}`}></i>;
const SubjectIcon = ({ className }) => <i className={`bi bi-pencil-square ${className}`}></i>;

const Broadcast = () => {
    const [recipient, setRecipient] = useState('all');
    const [subject, setSubject] = useState('');
    const [messageBody, setMessageBody] = useState('');
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatusMessage('');
        setLoading(true);

        // API Integration Note: Replace setTimeout with your actual API POST call
        // Example API call: /api/admin/broadcast
        setTimeout(() => {
            setLoading(false);
            setStatusMessage(`Successfully broadcasted message to ${recipient}. API endpoint: /api/admin/broadcast`);
            setSubject('');
            setMessageBody('');
        }, 1500);
    };

    return (
        <div className="container py-5">
            {/* Custom CSS for a sleek, modern, and mobile-friendly look */}
            <style jsx="true">{`
                /* General Font Setup */
                body {
                    font-family: 'Inter', sans-serif;
                }

                /* Sleek Card Styling */
                .sleek-card {
                    background: #fdfdfe; /* Almost white background */
                    border: 1px solid #e0e0e0;
                    border-radius: 1.5rem !important; 
                    /* Deep, soft shadow */
                    box-shadow: 0 16px 32px rgba(0, 0, 0, 0.08), 0 3px 6px rgba(0, 0, 0, 0.05); 
                }
                
                /* Title Styling */
                .sleek-title {
                    color: #4f46e5; /* Deeper Indigo for primary color */
                    font-weight: 700 !important;
                    padding-bottom: 0.5rem;
                    border-bottom: 2px solid #eef2ff; /* Light separation line */
                }

                /* Input and Select Styling */
                /* Base style for all form controls */
                .form-control, .form-select {
                    border-radius: 0.75rem; /* Rounded inputs */
                    padding: 0.75rem 1rem;
                    border-color: #ddd;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                
                /* Focus style for inputs */
                .form-control:focus, .form-select:focus {
                    border-color: #4f46e5; 
                    box-shadow: 0 0 0 0.25rem rgba(79, 70, 229, 0.2); /* Indigo focus ring */
                }

                /* Floating label adjustments for selects and textareas */
                .form-floating > .form-select {
                    padding-top: 1.625rem;
                    padding-bottom: 0.625rem;
                }
                /* Ensure textarea is styled correctly inside form-floating */
                .form-floating > .form-control:not(textarea) {
                    height: calc(3.5rem + 2px);
                }
                .form-floating > .form-control, .form-floating > .form-select {
                    padding: 1rem 0.75rem; /* Adjusted padding to accommodate floating label */
                }
                .form-floating > label {
                    padding: 1rem 0.75rem;
                }


                /* Gradient Button */
                .sleek-btn {
                    /* Indigo to Purple gradient */
                    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
                    border: none;
                    transition: all 0.3s ease;
                    font-size: 1.1rem;
                    padding: 0.75rem 1.5rem;
                }
                .sleek-btn:hover:not(:disabled) {
                    background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); /* Slight reverse gradient on hover */
                    transform: translateY(-2px);
                    box-shadow: 0 8px 15px rgba(79, 70, 229, 0.4);
                }
                .sleek-btn:disabled {
                    opacity: 0.6;
                }

                
                /* Responsive adjustments for mobile */
                @media (max-width: 768px) {
                    .sleek-card {
                        padding: 1.5rem !important; /* Slightly smaller padding on mobile */
                    }
                    .py-5 {
                        padding-top: 1.5rem !important;
                        padding-bottom: 1.5rem !important;
                    }
                }

            `}</style>

            <div className="sleek-card p-4 p-md-5 mx-auto" style={{maxWidth: '700px'}}> 
                
                {/* Header */}
                <h2 className="text-2xl sleek-title mb-4 d-flex align-items-center">
                    <Mail className="me-3" /> Broadcast Communication
                </h2>
                <p className="text-secondary mb-4">Craft and send real-time announcements to specific user groups across your school.</p>
                
                {/* Status Message / Alert Box */}
                {statusMessage && (
                    <div 
                        className="alert alert-success d-flex align-items-center rounded-3 mb-4 fade show"
                        role="alert"
                    >
                        <i className="bi bi-check-circle-fill me-2 fs-5"></i>
                        <div>{statusMessage}</div>
                        <button type="button" className="btn-close ms-auto" onClick={() => setStatusMessage('')} aria-label="Close"></button>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    
                    {/* Recipient and Subject Row (Responsive Grid) */}
                    <div className="row g-3 mb-3">
                        
                        {/* Recipient Group Select */}
                        <div className="col-12 col-md-6">
                            <div className="form-floating">
                                <select
                                    id="recipient"
                                    value={recipient}
                                    onChange={(e) => setRecipient(e.target.value)}
                                    className="form-select sleek-input"
                                    required
                                >
                                    <option value="all">All Users</option>
                                    <option value="teachers">Teachers Only</option>
                                    <option value="parents">Parents Only</option>
                                    <option value="jss1">JSS 1 Students/Parents</option>
                                    <option value="sss3">SSS 3 Students/Parents</option>
                                </select>
                                <label htmlFor="recipient"><UserIcon className="me-2"/> Recipient Group</label>
                            </div>
                        </div>

                        {/* Subject Input */}
                        <div className="col-12 col-md-6">
                            <div className="form-floating">
                                <input
                                    type="text"
                                    id="subject"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="form-control sleek-input"
                                    placeholder="Subject"
                                    required
                                />
                                <label htmlFor="subject"><SubjectIcon className="me-2"/> Subject</label>
                            </div>
                        </div>
                    </div>

                    {/* Message Body Textarea */}
                    <div className="mb-4">
                        <label htmlFor="messageBody" className="form-label fw-semibold text-dark">Message Content</label>
                        <textarea
                            id="messageBody"
                            rows="8" 
                            value={messageBody}
                            onChange={(e) => setMessageBody(e.target.value)}
                            className="form-control sleek-input"
                            placeholder="Type your urgent announcement or detailed communication here..."
                            style={{ resize: 'vertical' }}
                            required
                        ></textarea>
                    </div>

                    {/* Submit Button */}
                    <div className="d-grid">
                        <button
                            type="submit"
                            className="btn sleek-btn btn-lg rounded-3 shadow-sm d-flex align-items-center justify-content-center fw-bold text-white"
                            disabled={loading || !subject || !messageBody}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Sending Broadcast...
                                </>
                            ) : (
                                <>
                                    <Send className="me-2 fs-5" /> Send Broadcast Now
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Broadcast;

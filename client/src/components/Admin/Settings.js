import React, { useState, useEffect, useCallback } from 'react';
// We don't need to import axios since we are using mock functions
// import axios from 'axios'; 

// Note: Using standard text/icons as a stand-in for Lucide/Font Awesome to keep dependency minimal

// --- MOCK DATA FOR DEVELOPMENT ---
const INITIAL_MOCK_DATA = {
    profile: {
        schoolName: 'Digital Learning Academy',
        schoolEmail: 'admin@dla.edu',
        phone: '+1 (555) 123-4567',
        address: '101 Innovation Drive, Silicon Valley, CA 95014',
        motto: 'Educating the future, today.',
    },
    fees: {
        defaultFee: '1500.00',
        lateFee: '50.00',
    },
    academic: {
        classes: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'],
        subjects: ['Math', 'Science', 'History', 'English'],
        gradingSystem: 'A-F (4.0 Scale)',
        termStart: '2024-09-01',
        termEnd: '2025-06-30',
    },
};

// Internal storage for mock data persistence across component life cycle
let currentMockData = JSON.parse(JSON.stringify(INITIAL_MOCK_DATA));

// --- MOCK API FUNCTIONS (Simulate Network Calls) ---

/**
 * Simulates fetching settings data with a network delay.
 */
const mockFetchSettings = async () => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return currentMockData;
};

/**
 * Simulates saving settings data with a network delay.
 */
const mockSaveSettings = async (section, payload) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Update internal mock storage to reflect saved changes
    if (section !== 'security') {
        currentMockData[section] = payload;
    }
    
    // Check if passwords match for security section (simple client-side check)
    if (section === 'security' && payload.newPassword !== payload.confirmPassword) {
        throw new Error('New password and confirm password do not match.');
    }

    return { 
        message: `${section === 'security' ? 'Password changed' : section + ' settings updated'} successfully!`,
        status: 200 
    };
};

// --- STATUS MESSAGE COMPONENT ---
const StatusMessage = ({ status, message }) => {
    if (!message) return null;

    let alertClass = 'alert-info';
    if (status === 'success') {
        alertClass = 'alert-success';
    } else if (status === 'error') {
        alertClass = 'alert-danger';
    }

    return (
        <div className={`alert ${alertClass} rounded-3 d-flex align-items-center mb-4`} role="alert">
            <i className={`bi ${status === 'info' ? 'bi-hourglass-split' : (status === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill')} me-2`}></i>
            {message}
        </div>
    );
};


// --- MAIN SETTINGS COMPONENT ---
const Settings = () => {
    const [activeTab, setActiveTab] = useState('profile');
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: null, message: '' });

    // ----- Form states -----
    const [profile, setProfile] = useState({});
    const [originalProfile, setOriginalProfile] = useState({}); // For reset on cancel

    const [security, setSecurity] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const [fees, setFees] = useState({});
    const [academic, setAcademic] = useState({});

    // Function to fetch settings, wrapped in useCallback to be dependency-friendly
    const fetchSettings = useCallback(async () => {
        try {
            setLoading(true);
            setStatus({ type: 'info', message: 'Loading settings...' });
            
            // --- MOCK API CALL ---
            const data = await mockFetchSettings();

            // Set profile data
            const fetchedProfile = data.profile || {};
            setProfile(fetchedProfile);
            setOriginalProfile(fetchedProfile); 
            
            // Set other data
            setFees(data.fees || {});
            setAcademic(data.academic || {});

            setStatus({ type: 'success', message: 'Settings loaded successfully!' });
        } catch (err) {
            console.error('Failed to fetch settings:', err);
            setStatus({ type: 'error', message: err.message || 'Failed to load settings.' });
        } finally {
            setLoading(false);
        }
    }, []);

    // ----- Fetch existing settings on mount -----
    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    // Clear status message after 4 seconds
    useEffect(() => {
        if (status.type === 'success' || status.type === 'error') {
            const timer = setTimeout(() => setStatus({ type: null, message: '' }), 4000);
            return () => clearTimeout(timer);
        }
    }, [status]);


    // ----- Handle input changes -----
    const handleChange = (e, stateSetter) => {
        const { name, value } = e.target;
        stateSetter((prev) => ({ ...prev, [name]: value }));
    };

    // ----- Save updates -----
    const handleSave = async (section) => {
        try {
            setLoading(true);
            setStatus({ type: 'info', message: 'Saving changes...' });

            let payload = {};
            // Determine which state to use for the payload based on the section
            if (section === 'profile') payload = profile;
            if (section === 'security') payload = security;
            if (section === 'fees') payload = fees;
            if (section === 'academic') payload = academic;

            // --- MOCK API CALL ---
            const res = await mockSaveSettings(section, payload);
            // ---------------------

            setStatus({ type: 'success', message: res.message || 'Settings updated successfully!' });
            
            // If the section was saved, refresh the data to update the original state
            if (section !== 'security') {
                // Fetching updates the profile/fees/academic and resets the original state
                await fetchSettings(); 
            }

            // Reset security fields after successful save
            if (section === 'security') {
                setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }

            setEditMode(false);
        } catch (err) {
            console.error('Error updating settings:', err);
            setStatus({ type: 'error', message: err.message || 'Failed to update settings.' });
        } finally {
            setLoading(false);
        }
    };

    // Helper function to format field name for display
    const formatFieldName = (field) => {
        return field.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
    };
    
    // Logic for resetting state on Cancel
    const handleCancelEdit = () => {
        if (activeTab === 'profile') setProfile(originalProfile);
        // Fees and Academic use the last fetched state as a source of truth for simplicity in this example
        setEditMode(false);
    };

    // Helper for rendering form fields
    const renderField = (field, value, stateSetter, type = 'text', readOnly = false) => {
        const isEditable = editMode && !readOnly;
        
        return (
            <div className="row mb-3" key={field}>
                {/* Field Label */}
                <label className="col-sm-4 col-form-label text-muted font-weight-bold">
                    {formatFieldName(field)}:
                </label>
                
                <div className="col-sm-8">
                    {isEditable ? (
                        // EDIT MODE: Show Input Field
                        <input
                            type={type}
                            className="form-control rounded-3"
                            name={field}
                            value={value}
                            onChange={(e) => handleChange(e, stateSetter)}
                            readOnly={readOnly}
                            disabled={readOnly}
                            required
                            placeholder={formatFieldName(field)}
                        />
                    ) : (
                        // VIEW MODE: Show Plain Text
                        <p className={`form-control-plaintext fw-bold ${readOnly ? 'text-secondary' : ''}`}>
                            {type === 'number' && value ? `$${value}` : (value || 'N/A')}
                        </p>
                    )}
                </div>
            </div>
        );
    };


    // --- RENDERING SECTIONS ---

    const renderProfileSection = () => (
        <form onSubmit={(e) => { e.preventDefault(); handleSave('profile'); }}>
            <div className="mb-4">
                {renderField('schoolName', profile.schoolName, setProfile)}
                {renderField('schoolEmail', profile.schoolEmail, setProfile, 'email', true)} {/* Always read-only */}
                {renderField('phone', profile.phone, setProfile)}
                {renderField('address', profile.address, setProfile)}
                {renderField('motto', profile.motto, setProfile)}
            </div>
            {renderActionButtons('profile')}
        </form>
    );

    const renderSecuritySection = () => (
        <form onSubmit={(e) => { e.preventDefault(); handleSave('security'); }}>
            <h5 className="mb-4 text-primary">Change Administrator Password</h5>
            <div className="row justify-content-center">
                <div className="col-lg-6">
                    {renderField('currentPassword', security.currentPassword, setSecurity, 'password')}
                    {renderField('newPassword', security.newPassword, setSecurity, 'password')}
                    {renderField('confirmPassword', security.confirmPassword, setSecurity, 'password')}
                </div>
            </div>
            <div className="d-grid gap-2 col-md-4 mx-auto mt-4">
                <button
                    type="submit"
                    className="btn btn-primary rounded-3 btn-lg"
                    disabled={loading}
                >
                    {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> : 'Change Password'}
                </button>
            </div>
        </form>
    );

    const renderFeesSection = () => (
        <form onSubmit={(e) => { e.preventDefault(); handleSave('fees'); }}>
            <h5 className="mb-4 text-primary">Fee Structure</h5>
            <div className="row justify-content-center">
                <div className="col-lg-6">
                    {renderField('defaultFee', fees.defaultFee, setFees, 'number')}
                    {renderField('lateFee', fees.lateFee, setFees, 'number')}
                </div>
            </div>
            {renderActionButtons('fees')}
        </form>
    );
    
    const renderAcademicSection = () => (
        <form onSubmit={(e) => { e.preventDefault(); handleSave('academic'); }}>
            <h5 className="mb-4 text-primary">Academic Term & Grading</h5>
            <div className="row justify-content-center mb-4">
                <div className="col-lg-6">
                    {renderField('gradingSystem', academic.gradingSystem, setAcademic)}
                    {renderField('termStart', academic.termStart, setAcademic, editMode ? 'date' : 'text')}
                    {renderField('termEnd', academic.termEnd, setAcademic, editMode ? 'date' : 'text')}
                </div>
            </div>

            <div className="row mb-3 border-top pt-3">
                <div className="col-sm-4 col-form-label text-muted font-weight-bold">Classes:</div>
                <div className="col-sm-8">
                    <p className="form-control-plaintext fw-bold text-success">
                        {academic.classes?.join(', ') || 'None configured'}
                    </p>
                    <small className="text-warning">
                        {editMode && "Note: Classes and Subjects require a complex editor and are only displayed here."}
                    </small>
                </div>
            </div>

            {renderActionButtons('academic')}
        </form>
    );

    const renderActionButtons = (section) => {
        // Only show edit/save buttons for data sections
        if (section === 'security') return null;

        return (
            <div className="mt-4 pt-3 border-top d-flex justify-content-end">
                {!editMode ? (
                    <button 
                        type="button" 
                        className="btn btn-outline-primary rounded-3 px-4" 
                        onClick={() => setEditMode(true)}
                    >
                        <i className="bi bi-pencil-fill me-2"></i>Edit {formatFieldName(section)}
                    </button>
                ) : (
                    <>
                        <button
                            type="submit"
                            className="btn btn-primary rounded-3 me-2 px-4"
                            disabled={loading}
                        >
                            {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> : 'Save Changes'}
                        </button>
                        <button 
                            type="button" 
                            className="btn btn-secondary rounded-3 px-4" 
                            onClick={handleCancelEdit}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                    </>
                )}
            </div>
        );
    };

    // --- MAIN RENDER ---

    return (
        <div className="container py-5">
            
            <header className="mb-5 border-bottom pb-3">
                <h1 className="text-primary fw-bolder">
                    <i className="bi bi-gear-fill me-2"></i>School Settings Management
                </h1>
                <p className="text-muted">Configure core school information, fees, and academic parameters.</p>
            </header>

            <StatusMessage status={status.type} message={status.message} />

            {/* Tabs Navigation */}
            <ul className="nav nav-tabs mb-4">
                {['profile', 'security', 'fees', 'academic'].map((id) => (
                    <li className="nav-item" key={id}>
                        <button
                            className={`nav-link ${activeTab === id ? 'active' : ''}`}
                            onClick={() => {
                                setActiveTab(id);
                                setEditMode(false); // Reset edit mode when switching tabs
                            }}
                        >
                            {formatFieldName(id)}
                        </button>
                    </li>
                ))}
            </ul>

            {/* Tab Content Card */}
            <div className="card shadow-lg border-0 rounded-4">
                <div className="card-body p-4 p-md-5">
                    {activeTab === 'profile' && renderProfileSection()}
                    {activeTab === 'security' && renderSecuritySection()}
                    {activeTab === 'fees' && renderFeesSection()}
                    {activeTab === 'academic' && renderAcademicSection()}
                </div>
            </div>
        </div>
    );
};


export default Settings;

import React, { useState } from 'react';

// Consistent Icon components using Bootstrap Icon classes
const IconEdit = ({ className }) => <i className={`bi bi-pencil-square ${className}`}></i>;
const IconTrash = ({ className }) => <i className={`bi bi-trash-fill ${className}`}></i>;
const IconPlus = ({ className }) => <i className={`bi bi-plus-circle-fill ${className}`}></i>;
const IconSearch = ({ className }) => <i className={`bi bi-search ${className}`}></i>;
const IconParents = ({ className }) => <i className={`bi bi-people-fill fs-4 ${className}`}></i>;

// Mock Data
const MOCK_PARENTS = [
    { id: 'p001', name: 'Mr. David Okoro', phone: '0803-123-4567', email: 'david.o@example.com', linkedStudents: 2 },
    { id: 'p002', name: 'Mrs. Chioma Eze', phone: '0809-876-5432', email: 'chioma.e@example.com', linkedStudents: 1 },
    { id: 'p003', name: 'Alhaji Abdul Bello', phone: '0705-555-1212', email: 'abdul.b@example.com', linkedStudents: 1 },
    { id: 'p004', name: 'Ms. Tola Adebayo', phone: '0901-222-3333', email: 'tola.a@example.com', linkedStudents: 1 },
];

const ManageParents = () => {
    const [parents, setParents] = useState(MOCK_PARENTS);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    
    const [modalState, setModalState] = useState({ isOpen: false, mode: 'add', currentParent: null });

    const filteredParents = parents.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.phone.includes(searchTerm)
    );

    /**
     * Placeholder API Function: Handles creating a new parent or updating an existing one.
     * Replace the setTimeout logic with your actual API call.
     */
    const handleAddOrEdit = (formData) => {
        setLoading(true);
        setMessage('');
        
        // Simulating API latency
        setTimeout(() => {
            if (modalState.mode === 'add') {
                const newParent = { ...formData, id: 'p' + Date.now(), linkedStudents: 0 };
                setParents(prev => [...prev, newParent]);
                setMessage(`Parent '${newParent.name}' added successfully. (API simulation)`);
            } else {
                setParents(prev => prev.map(p => 
                    p.id === formData.id ? { ...p, ...formData } : p
                ));
                setMessage(`Parent '${formData.name}' updated successfully. (API simulation)`);
            }
            setLoading(false);
            setModalState({ isOpen: false, mode: 'add', currentParent: null });
        }, 800);
    };

    /**
     * Placeholder API Function: Handles deleting a parent.
     * Replace the setTimeout logic with your actual API call.
     */
    const handleDelete = (parentId, parentName) => {
        if (window.confirm(`Are you sure you want to delete parent: ${parentName}? This will unlink all associated students.`)) {
            setLoading(true);
            setMessage('');
            
            // Simulating API latency
            setTimeout(() => {
                setParents(prev => prev.filter(p => p.id !== parentId));
                setMessage(`Parent '${parentName}' deleted successfully. (API simulation)`);
                setLoading(false);
            }, 800);
        }
    };
    
    // Form component for Add/Edit Modal
    const ParentForm = ({ initialData, onSubmit, onCancel, isSaving }) => {
        const [formData, setFormData] = useState({ 
            name: initialData?.name || '', 
            phone: initialData?.phone || '',
            email: initialData?.email || '',
        });

        const handleChange = (e) => {
            setFormData({ ...formData, [e.target.name]: e.target.value });
        };

        const handleSubmit = (e) => {
            e.preventDefault();
            onSubmit({ ...initialData, ...formData });
        };

        return (
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Full Name</label>
                    <input type="text" className="form-control rounded-3" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="mb-3">
                    <label className="form-label">Phone Number</label>
                    <input type="tel" className="form-control rounded-3" name="phone" value={formData.phone} onChange={handleChange} required />
                </div>
                <div className="mb-4">
                    <label className="form-label">Email Address</label>
                    <input type="email" className="form-control rounded-3" name="email" value={formData.email} onChange={handleChange} required />
                </div>
                <div className="d-flex justify-content-end">
                    <button type="button" className="btn btn-secondary me-2 rounded-3" onClick={onCancel}>
                        Cancel
                    </button>
                    <button type="submit" className="btn btn-primary rounded-3" disabled={isSaving}>
                        {isSaving ? 'Saving...' : (initialData ? 'Update Parent' : 'Add Parent')}
                    </button>
                </div>
            </form>
        );
    };


    return (
        // Added container-fluid on mobile, container-md on desktop
        <div className="container-fluid container-md py-4">
            <div className="card shadow-lg rounded-4 p-4 mb-4 border-0">
                
                {/* Responsive Header: Uses flex-column on small screens, reverts to row on medium screens and up */}
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 border-bottom pb-3">
                    <h4 className="card-title text-dark mb-3 mb-md-0 d-flex align-items-center fw-bold">
                        <IconParents className="text-primary me-2" /> Manage Parents/Guardians
                    </h4>
                    
                    {/* Responsive Button: Icon-only on small screen, icon + text on md and up */}
                    <button 
                        className="btn btn-primary rounded-pill d-flex align-items-center px-3 py-2" // Smaller padding for better fit on small screens
                        onClick={() => setModalState({ isOpen: true, mode: 'add', currentParent: null })}
                    >
                        {/* Show icon only on mobile, text is hidden */}
                        <IconPlus className="fs-5 me-md-2" /> 
                        <span className="d-none d-md-inline">Add New Parent</span>
                    </button>
                </div>

                {message && (
                    <div className={`alert ${message.includes('success') ? 'alert-success' : 'alert-info'} rounded-3`} role="alert">
                        {message}
                    </div>
                )}
                
                {/* Search Input: Removed fixed width, uses w-100 on mobile and limits width on larger screens */}
                <div className="input-group mb-4 w-100 w-md-75 w-lg-50">
                    <span className="input-group-text bg-light rounded-start-pill border-0"><IconSearch className="fs-6" /></span>
                    <input
                        type="text"
                        className="form-control rounded-end-pill"
                        placeholder="Search by name, phone, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                {/* Parent Table - table-responsive is already present, hiding columns for better mobile view */}
                <div className="table-responsive">
                    <table className="table table-striped table-hover align-middle">
                        <thead className="table-light">
                            <tr>
                                <th scope="col" className="fw-bold">Name</th>
                                <th scope="col" className="fw-bold">Phone</th>
                                {/* Hidden on small screens (below md) */}
                                <th scope="col" className="fw-bold d-none d-md-table-cell">Email</th>
                                {/* Hidden on small screens (below md) */}
                                <th scope="col" className="fw-bold text-center d-none d-md-table-cell">Linked Students</th>
                                <th scope="col" className="text-center fw-bold">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredParents.length > 0 ? (
                                filteredParents.map((item) => (
                                    <tr key={item.id}>
                                        <td className="fw-semibold">{item.name}</td>
                                        <td>{item.phone}</td>
                                        {/* Hidden on small screens (below md) */}
                                        <td className="d-none d-md-table-cell">{item.email}</td>
                                        {/* Hidden on small screens (below md) */}
                                        <td className="text-center d-none d-md-table-cell">{item.linkedStudents}</td>
                                        <td className="text-center">
                                            <button 
                                                className="btn btn-sm btn-outline-secondary me-2 rounded-3"
                                                onClick={() => setModalState({ isOpen: true, mode: 'edit', currentParent: item })}
                                                title="Edit Parent"
                                                disabled={loading}
                                            >
                                                <IconEdit className="fs-6" />
                                            </button>
                                            <button 
                                                className="btn btn-sm btn-outline-danger rounded-3"
                                                onClick={() => handleDelete(item.id, item.name)} 
                                                title="Delete Parent"
                                                disabled={loading || item.linkedStudents > 0}
                                            >
                                                <IconTrash className="fs-6" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center text-muted py-3">No parents found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Simple Modal Implementation */}
                {modalState.isOpen && (
                    // The modal is naturally responsive due to Bootstrap's modal-dialog-centered
                    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex="-1">
                        <div className="modal-dialog modal-dialog-centered">
                            <div className="modal-content rounded-4 shadow-lg border-0">
                                <div className="modal-header bg-light border-bottom">
                                    <h5 className="modal-title fw-bold text-dark">{modalState.mode === 'add' ? 'Add New Parent' : 'Edit Parent'}</h5>
                                    <button type="button" className="btn-close" onClick={() => setModalState({ isOpen: false, mode: 'add', currentParent: null })}></button>
                                </div>
                                <div className="modal-body">
                                    <ParentForm 
                                        initialData={modalState.currentParent} 
                                        onSubmit={handleAddOrEdit} 
                                        onCancel={() => setModalState({ isOpen: false, mode: 'add', currentParent: null })}
                                        isSaving={loading}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ManageParents;

import React, { useState } from 'react';

// --- Icons ---
import { Edit, Trash2, Search, Users } from 'lucide-react';

const IconEdit = (props) => <Edit {...props} />;
const IconTrash = (props) => <Trash2 {...props} />;
const IconSearch = (props) => <Search {...props} />;
const IconParents = (props) => <Users {...props} />;
const IconChildren = (props) => <Users {...props} />;

// --- Mock Data ---
const MOCK_PARENTS = [
  { id: 'p001', name: 'Mr. David Okoro', phone: '0803-123-4567', email: 'david.okoro@example.com', children: ['John Okoro', 'Mary Okoro'] },
  { id: 'p002', name: 'Mrs. Chioma Eze', phone: '0809-876-5432', email: 'chioma.eze@example.com', children: ['Chuka Eze'] },
  { id: 'p003', name: 'Alhaji Abdul Bello', phone: '0705-555-1212', email: 'abdul.bello@example.com', children: ['Sadiq Bello'] },
  { id: 'p004', name: 'Ms. Tola Adebayo', phone: '0901-222-3333', email: 'tola.adebayo@example.com', children: ['Tobi Adebayo'] },
];

const ManageParents = () => {
  const [parents, setParents] = useState(MOCK_PARENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false, currentParent: null });

  const filteredParents = parents.filter(
    p => p.name.toLowerCase().includes(searchTerm.toLowerCase())
      || p.children.join(', ').toLowerCase().includes(searchTerm.toLowerCase())
      || p.phone.toLowerCase().includes(searchTerm.toLowerCase())
      || p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (updatedParent) => {
    setLoading(true);
    setTimeout(() => {
      setParents(prev => prev.map(p => p.id === updatedParent.id ? updatedParent : p));
      setMessage(`✅ '${updatedParent.name}' updated successfully.`);
      setLoading(false);
      setModalState({ isOpen: false, currentParent: null });
    }, 700);
  };

  const handleDelete = (parentId, parentName) => {
    if (window.confirm(`Are you sure you want to delete ${parentName}?`)) {
      setLoading(true);
      setTimeout(() => {
        setParents(prev => prev.filter(p => p.id !== parentId));
        setMessage(`🗑️ '${parentName}' deleted successfully.`);
        setLoading(false);
      }, 700);
    }
  };

  const ParentForm = ({ initialData, onSubmit, onCancel, isSaving }) => {
    const [formData, setFormData] = useState({ ...initialData });

    const handleChange = (e, index) => {
      const { name, value } = e.target;
      if (name === 'children') {
        const newChildren = [...formData.children];
        newChildren[index] = value;
        setFormData({ ...formData, children: newChildren });
      } else {
        setFormData({ ...formData, [name]: value });
      }
    };

    const addChild = () => setFormData({ ...formData, children: [...formData.children, ''] });
    const removeChild = (index) => setFormData({ ...formData, children: formData.children.filter((_, i) => i !== index) });

    const handleSubmit = (e) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label fw-semibold">Parent Name</label>
          <input type="text" name="name" className="form-control rounded-3" value={formData.name} onChange={handleChange} required />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">Phone Number</label>
          <input type="tel" name="phone" className="form-control rounded-3" value={formData.phone} onChange={handleChange} required />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">Email Address</label>
          <input type="email" name="email" className="form-control rounded-3" value={formData.email} onChange={handleChange} required />
        </div>

        <label className="form-label fw-semibold">Children</label>
        {formData.children.map((child, i) => (
          <div className="input-group mb-2" key={i}>
            <input type="text" name="children" className="form-control rounded-3" value={child} onChange={(e) => handleChange(e, i)} required />
            <button type="button" className="btn btn-outline-danger rounded-3" onClick={() => removeChild(i)}>Remove</button>
          </div>
        ))}
        <button type="button" className="btn btn-outline-primary rounded-3 mb-3" onClick={addChild}>Add Child</button>

        <div className="text-end">
          <button type="button" className="btn btn-secondary me-2 rounded-3" onClick={onCancel} disabled={isSaving}>Cancel</button>
          <button type="submit" className="btn btn-primary rounded-3" disabled={isSaving}>{isSaving ? 'Saving...' : 'Update Parent'}</button>
        </div>
      </form>
    );
  };

  return (
    <div className="container py-4">
      <div className="card shadow-lg rounded-4 p-4 mb-4 border-0">

        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4 border-bottom pb-3">
          <h4 className="card-title text-dark mb-3 mb-md-0 d-flex align-items-center fw-bold">
            <IconParents className="text-primary me-2" /> Manage Parents/Guardians
          </h4>
        </div>

        {/* Overview Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-6">
            <div className="card bg-light border-0 shadow-sm rounded-4 p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Total Parents</h6>
                  <h5 className="fw-bold mb-0">{parents.length}</h5>
                </div>
                <IconParents className="text-primary fs-3" />
              </div>
            </div>
          </div>
          <div className="col-md-6">
            <div className="card bg-light border-0 shadow-sm rounded-4 p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-muted mb-1">Total Children</h6>
                  <h5 className="fw-bold mb-0">{parents.reduce((sum, p) => sum + p.children.length, 0)}</h5>
                </div>
                <IconChildren className="text-success fs-3" />
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="input-group mb-4 w-100 w-md-75 w-lg-50">
          <span className="input-group-text bg-light rounded-start-pill border-0"><IconSearch /></span>
          <input
            type="text"
            className="form-control rounded-end-pill"
            placeholder="Search by parent, child, phone or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="table table-striped table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Parent Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Children</th>
                <th className="text-center">Number of Children</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParents.length > 0 ? filteredParents.map(p => (
                <tr key={p.id}>
                  <td className="fw-semibold">{p.name}</td>
                  <td>{p.phone}</td>
                  <td>{p.email}</td>
                  <td>{p.children.join(', ')}</td>
                  <td className="text-center">{p.children.length}</td>
                  <td className="text-center">
                    <button className="btn btn-sm btn-outline-secondary me-2 rounded-3" onClick={() => setModalState({ isOpen: true, currentParent: p })} title="Edit Parent" disabled={loading}>
                      <IconEdit className="fs-6" />
                    </button>
                    <button className="btn btn-sm btn-outline-danger rounded-3" onClick={() => handleDelete(p.id, p.name)} title="Delete Parent" disabled={loading}>
                      <IconTrash className="fs-6" />
                    </button>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan="6" className="text-center text-muted py-3">No parents found.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Modal */}
        {modalState.isOpen && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content rounded-4 shadow-lg border-0">
                <div className="modal-header bg-light border-bottom">
                  <h5 className="modal-title fw-bold">Edit Parent</h5>
                  <button type="button" className="btn-close" onClick={() => setModalState({ isOpen: false, currentParent: null })}></button>
                </div>
                <div className="modal-body">
                  <ParentForm
                    initialData={modalState.currentParent}
                    onSubmit={handleEdit}
                    onCancel={() => setModalState({ isOpen: false, currentParent: null })}
                    isSaving={loading}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status */}
        {message && <div className="alert alert-success rounded-3 mt-3">{message}</div>}
      </div>
    </div>
  );
};

export default ManageParents;

import React, { useState, useMemo } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
// Mock Data
const MOCK_TEACHERS = [
  { id: 't001', name: 'Mrs. Jane Doe' },
  { id: 't002', name: 'Mr. Ken Adams' },
  { id: 't003', name: 'Ms. Sarah Connor' },
  { id: 't004', name: 'Dr. John Miller' },
];

const MOCK_CLASS_OPTIONS = ['JSS 1', 'JSS 2', 'JSS 3', 'SSS 1', 'SSS 2', 'SSS 3'];

const MOCK_COURSES = [
  { id: 'crs101', name: 'Mathematics', code: 'MAT101', teacherId: 't001', classes: ['JSS 1', 'JSS 2'] },
  { id: 'crs202', name: 'Physics', code: 'PHY202', teacherId: 't002', classes: ['SSS 1', 'SSS 3'] },
  { id: 'crs303', name: 'English Language', code: 'ENG101', teacherId: 't003', classes: ['JSS 1', 'JSS 3', 'SSS 1'] },
  { id: 'crs404', name: 'Chemistry', code: 'CHE303', teacherId: 't004', classes: ['SSS 3'] },
];

const ManageCourses = () => {
  const [courses, setCourses] = useState(MOCK_COURSES);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(''); // user feedback
  const [modalState, setModalState] = useState({ open: false, mode: 'add', course: null });

  // Modal helpers
  const openAdd = () => setModalState({ open: true, mode: 'add', course: null });
  const openEdit = (c) => setModalState({ open: true, mode: 'edit', course: c });
  const openDelete = (c) => setModalState({ open: true, mode: 'delete', course: c });
  const closeModal = () => setModalState({ open: false, mode: 'add', course: null });

  // Filtered list
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return courses;
    return courses.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q) ||
        (getTeacherName(c.teacherId) || '').toLowerCase().includes(q) ||
        c.classes.some((cl) => cl.toLowerCase().includes(q))
    );
  }, [courses, searchTerm]);

  function getTeacherName(id) {
    const t = MOCK_TEACHERS.find((x) => x.id === id);
    return t ? t.name : 'Unassigned';
  }

  // CRUD handlers (mock async behaviour)
  const handleSave = (payload) => {
    setLoading(true);
    setMessage('');
    setTimeout(() => {
      if (modalState.mode === 'add') {
        const newCourse = { ...payload, id: 'crs' + Date.now() };
        setCourses((p) => [newCourse, ...p]);
        setMessage(`Course '${newCourse.name}' added.`);
      } else {
        setCourses((p) => p.map((c) => (c.id === payload.id ? { ...c, ...payload } : c)));
        setMessage(`Course '${payload.name}' updated.`);
      }
      setLoading(false);
      closeModal();
      setTimeout(() => setMessage(''), 3500);
    }, 600);
  };

  const handleDelete = (id) => {
    setLoading(true);
    setMessage('');
    setTimeout(() => {
      const removed = courses.find((c) => c.id === id);
      setCourses((p) => p.filter((c) => c.id !== id));
      setMessage(`Course '${removed?.name || ''}' deleted.`);
      setLoading(false);
      closeModal();
      setTimeout(() => setMessage(''), 3500);
    }, 500);
  };

  // Small stats
  const totalCourses = courses.length;
  const uniqueTeachers = new Set(courses.map((c) => c.teacherId)).size;
  const assignedClasses = new Set(courses.flatMap((c) => c.classes)).size;

  // Subcomponents: CourseForm & DeleteConfirm
  const CourseForm = ({ initial = {}, onCancel, onSubmit, saving }) => {
    const [form, setForm] = useState({
      id: initial.id || null,
      name: initial.name || '',
      code: initial.code || '',
      teacherId: initial.teacherId || MOCK_TEACHERS[0].id,
      classes: initial.classes ? [...initial.classes] : [],
    });

    const toggleClass = (val) => {
      setForm((f) => {
        const exists = f.classes.includes(val);
        return {
          ...f,
          classes: exists ? f.classes.filter((c) => c !== val) : [...f.classes, val],
        };
      });
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      // minimal validation
      if (!form.name.trim() || !form.code.trim()) return;
      onSubmit(form);
    };

    return (
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label fw-semibold">Course Name</label>
          <input
            className="form-control rounded-3"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">Course Code</label>
          <input
            className="form-control rounded-3"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            required
          />
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">Assigned Teacher</label>
          <select
            className="form-select rounded-3"
            value={form.teacherId}
            onChange={(e) => setForm({ ...form, teacherId: e.target.value })}
            required
          >
            {MOCK_TEACHERS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label className="form-label fw-semibold">Applicable Classes (multi-select)</label>
          <div className="d-flex flex-wrap gap-2">
            {MOCK_CLASS_OPTIONS.map((opt) => {
              const active = form.classes.includes(opt);
              return (
                <button
                  type="button"
                  key={opt}
                  onClick={() => toggleClass(opt)}
                  className={`btn btn-sm ${active ? 'btn-primary' : 'btn-outline-secondary'} rounded-pill`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>

        <div className="d-flex justify-content-end">
          <button type="button" className="btn btn-light me-2 rounded-3" onClick={onCancel} disabled={saving}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary rounded-3" disabled={saving}>
            {saving ? 'Saving...' : initial.id ? 'Update Course' : 'Add Course'}
          </button>
        </div>
      </form>
    );
  };

  const DeleteConfirm = ({ course, onCancel, onConfirm, deleting }) => (
    <>
      <div className="alert alert-warning d-flex align-items-start gap-3">
        <i className="bi bi-exclamation-triangle-fill fs-4 text-warning"></i>
        <div>
          <div className="fw-semibold">Confirm deletion</div>
          <div className="small text-muted">Delete <strong>{course?.name}</strong>. This action cannot be undone.</div>
        </div>
      </div>

      <div className="d-flex justify-content-end">
        <button className="btn btn-light me-2" onClick={onCancel} disabled={deleting}>
          Cancel
        </button>
        <button className="btn btn-danger" onClick={() => onConfirm(course.id)} disabled={deleting}>
          {deleting ? 'Deleting...' : 'Confirm Delete'}
        </button>
      </div>
    </>
  );

  return (
    <div className="container py-4">
      <div className="mb-3 d-flex justify-content-between align-items-center">
        <h3 className="mb-0 fw-bold text-primary">Manage Courses & Subjects</h3>

        <div className="d-flex gap-2 align-items-center">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0"><i className="bi bi-search"></i></span>
            <input
              className="form-control"
              placeholder="Search courses, codes, teachers, classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <button className="btn btn-primary ms-2 d-flex align-items-center" onClick={openAdd}>
            <i className="bi bi-plus-circle me-2"></i> Add Course
          </button>
        </div>
      </div>

      {/* top stat cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card rounded-4 shadow-sm p-3 text-center h-100">
            <div className="text-muted small">Total Courses</div>
            <div className="fw-bold fs-4">{totalCourses}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card rounded-4 shadow-sm p-3 text-center h-100">
            <div className="text-muted small">Active Teachers</div>
            <div className="fw-bold fs-4">{uniqueTeachers}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card rounded-4 shadow-sm p-3 text-center h-100">
            <div className="text-muted small">Assigned Classes</div>
            <div className="fw-bold fs-4">{assignedClasses}</div>
          </div>
        </div>
        <div className="col-6 col-md-3">
          <div className="card rounded-4 shadow-sm p-3 h-100">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <div className="text-muted small">Quick Note</div>
                <div className="fw-semibold">MVP mode</div>
              </div>
              <i className="bi bi-lightning-fill fs-3 text-primary"></i>
            </div>
          </div>
        </div>
      </div>

      {/* main table card */}
      <div className="card shadow-lg rounded-4">
        <div className="card-body p-3 p-md-4">
          {message && <div className="alert alert-success mb-3">{message}</div>}

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
              <thead className="table-light">
                <tr>
                  <th>Course</th>
                  <th>Code</th>
                  <th className="d-none d-md-table-cell">Teacher</th>
                  <th className="d-none d-lg-table-cell">Classes</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">No courses found.</td>
                  </tr>
                )}
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td className="fw-semibold">{c.name}</td>
                    <td>{c.code}</td>
                    <td className="d-none d-md-table-cell">{getTeacherName(c.teacherId)}</td>
                    <td className="d-none d-lg-table-cell">
                      {c.classes.map((cl) => (
                        <span key={cl} className="badge bg-secondary me-1">{cl}</span>
                      ))}
                    </td>
                    <td className="text-center">
                      <div className="d-flex justify-content-center gap-2">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => openEdit(c)}>
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => openDelete(c)}>
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal overlay */}
      {modalState.open && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.45)', zIndex: 1050 }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content rounded-4">
              <div className="modal-header">
                <h5 className="modal-title">
                  {modalState.mode === 'add' && <><i className="bi bi-plus-circle me-2"></i> Add Course</>}
                  {modalState.mode === 'edit' && <><i className="bi bi-pencil-square me-2"></i> Edit Course</>}
                  {modalState.mode === 'delete' && <><i className="bi bi-trash me-2"></i> Delete Course</>}
                </h5>
                <button type="button" className="btn-close" onClick={closeModal} disabled={loading}></button>
              </div>
              <div className="modal-body">
                {modalState.mode === 'delete' ? (
                  <DeleteConfirm
                    course={modalState.course}
                    onCancel={closeModal}
                    onConfirm={handleDelete}
                    deleting={loading}
                  />
                ) : (
                  <CourseForm
                    initial={modalState.course}
                    onCancel={closeModal}
                    onSubmit={handleSave}
                    saving={loading}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCourses;

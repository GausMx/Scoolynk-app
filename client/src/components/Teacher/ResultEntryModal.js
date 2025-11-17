// src/components/Teacher/ResultEntryModal.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Save, Send, Scan, Plus, Trash2, AlertCircle } from 'lucide-react';
import BrowserOCR from '../utils/ocrHelper';
import InteractiveTemplateEntry from './VisualResultEntry'; // <-- already imported

const { REACT_APP_API_URL } = process.env;

const COMMON_SUBJECTS = [
  'Mathematics',
  'English Language',
  'Yoruba Language',
  'Social Studies',
  'Basic Science',
  'Basic Technology',
  'Computer Science',
  'History',
  'Agricultural Science',
  'Civic Education',
  'Business Studies'
];

// --- RegularFormEntry moved above ---
const RegularFormEntry = ({
  subjects, setSubjects,
  affectiveTraits, setAffectiveTraits,
  fees, setFees,
  attendance, setAttendance,
  comments, setComments
}) => {
  return (
    <div>
      <h6>Subjects</h6>
      {subjects.map((subj, idx) => (
        <div key={idx} className="mb-3">
          <input
            type="text"
            value={subj.subject}
            onChange={(e) => {
              const updated = [...subjects];
              updated[idx].subject = e.target.value;
              setSubjects(updated);
            }}
            placeholder="Subject"
            className="form-control mb-1"
          />
          <div className="d-flex gap-2">
            <input
              type="number"
              value={subj.ca1}
              onChange={(e) => {
                const updated = [...subjects];
                updated[idx].ca1 = +e.target.value;
                setSubjects(updated);
              }}
              placeholder="CA1"
              className="form-control"
            />
            <input
              type="number"
              value={subj.ca2}
              onChange={(e) => {
                const updated = [...subjects];
                updated[idx].ca2 = +e.target.value;
                setSubjects(updated);
              }}
              placeholder="CA2"
              className="form-control"
            />
            <input
              type="number"
              value={subj.exam}
              onChange={(e) => {
                const updated = [...subjects];
                updated[idx].exam = +e.target.value;
                setSubjects(updated);
              }}
              placeholder="Exam"
              className="form-control"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

// --- Main Component ---
const ResultEntryModal = ({
  mode = 'manual',
  student = {},
  existingResult = null,
  term,
  session,
  onClose = () => {},
  onSuccess = () => {},
  token = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentMode, setCurrentMode] = useState(mode);
  const [template, setTemplate] = useState(null);
  const [loadingTemplate, setLoadingTemplate] = useState(true);

  const [subjects, setSubjects] = useState([]);
  const [affectiveTraits, setAffectiveTraits] = useState({
    punctuality: 3,
    behaviour: 3,
    neatness: 3,
    relationship: 3,
    attentiveness: 3,
    initiative: 3
  });
  const [fees, setFees] = useState({ tuition: 0, uniform: 0, books: 0, lesson: 0, other: 0 });
  const [attendance, setAttendance] = useState({ opened: 0, present: 0, absent: 0 });
  const [comments, setComments] = useState({ teacher: '', principal: '' });

  const [scanImage, setScanImage] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => { fetchTemplate(); }, [term, session]);

  const fetchTemplate = async () => {
    try {
      setLoadingTemplate(true);
      const res = await axios.get(`${REACT_APP_API_URL}/api/teacher/results/template`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { term, session }
      });
      setTemplate(res.data?.template || null);
    } catch (err) {
      console.warn('No template found or failed to fetch:', err?.message || err);
      setTemplate(null);
    } finally {
      setLoadingTemplate(false);
    }
  };

  useEffect(() => {
    if (existingResult) {
      setSubjects(existingResult.subjects || []);
      setAffectiveTraits(existingResult.affectiveTraits || affectiveTraits);
      setFees(existingResult.fees || fees);
      setAttendance(existingResult.attendance || attendance);
      setComments(existingResult.comments || comments);
    } else {
      setSubjects(COMMON_SUBJECTS.map((subject) => ({ subject, ca1: 0, ca2: 0, exam: 0 })));
    }
  }, [existingResult]);

  const handleSave = async (submitToAdmin = false, filledTemplateImage = null) => {
    try {
      setLoading(true);
      setError('');

      const validSubjects = subjects.filter((s) => s && s.subject && s.subject.toString().trim() !== '');
      if (validSubjects.length === 0) {
        setError('Please add at least one subject with scores.');
        setLoading(false);
        return;
      }

      const payload = {
        studentId: student._id,
        term,
        session,
        subjects: validSubjects,
        affectiveTraits,
        fees,
        attendance,
        comments,
        status: submitToAdmin ? 'submitted' : 'draft',
        filledTemplateImage
      };

      if (existingResult) payload.resultId = existingResult._id;

      const res = await axios.post(`${REACT_APP_API_URL}/api/teacher/results`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res?.data?.message) alert(res.data.message);
      onSuccess && onSuccess(res?.data);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save result');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setScanImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async () => {
    if (!scanImage) return setError('Please upload an image first');
    try {
      setScanning(true); setError(''); setScanProgress(0);
      const result = await BrowserOCR.extractScores(scanImage, (progress) => setScanProgress(progress));

      if (!result || !result.success || !Array.isArray(result.scores) || result.scores.length === 0) {
        setError(result?.error || 'Failed to extract scores from image');
        return;
      }

      setSubjects(result.scores);
      alert(`Found ${result.scores.length} subject(s). Please review before saving.`);
      setCurrentMode('manual');
    } catch (err) {
      console.error('[OCR] Error:', err);
      setError('Failed to process image: ' + (err?.message || err));
    } finally {
      setScanning(false); setScanProgress(0);
    }
  };

  return (
    <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
      <div className="modal-dialog modal-xl modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Result Entry - {student?.name || 'Student'} ({student?.regNo || 'RegNo'})</h5>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
          </div>

          <div className="modal-body">
            {error && <div className="alert alert-danger d-flex align-items-center"><AlertCircle size={20} className="me-2" /><div>{error}</div></div>}

            {loadingTemplate ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status" />
                <p className="mt-2 text-muted">Loading result template...</p>
              </div>
            ) : (
              <>
                {template && <div className="alert alert-info mb-3"><strong>Using Template:</strong> {template.name}</div>}

                <div className="btn-group mb-4" role="group">
                  <button
                    type="button"
                    className={`btn ${currentMode === 'manual' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setCurrentMode('manual')}
                  >
                    {template ? 'Fill on Template' : 'Manual Entry'}
                  </button>
                  <button
                    type="button"
                    className={`btn ${currentMode === 'scan' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setCurrentMode('scan')}
                  >
                    Scan Scores (OCR)
                  </button>
                </div>

                {/* Render Form */}
                {currentMode === 'manual' && template ? (
                  <InteractiveTemplateEntry
                    template={template}
                    student={student}
                    subjects={subjects}
                    setSubjects={setSubjects}
                    affectiveTraits={affectiveTraits}
                    setAffectiveTraits={setAffectiveTraits}
                    fees={fees}
                    setFees={setFees}
                    attendance={attendance}
                    setAttendance={setAttendance}
                    comments={comments}
                    setComments={setComments}
                    onSave={(filledImage) => handleSave(false, filledImage)}
                    onSubmit={(filledImage) => handleSave(true, filledImage)}
                  />
                ) : currentMode === 'manual' ? (
                  <RegularFormEntry
                    subjects={subjects}
                    setSubjects={setSubjects}
                    affectiveTraits={affectiveTraits}
                    setAffectiveTraits={setAffectiveTraits}
                    fees={fees}
                    setFees={setFees}
                    attendance={attendance}
                    setAttendance={setAttendance}
                    comments={comments}
                    setComments={setComments}
                  />
                ) : null}

                {currentMode === 'scan' && (
                  <div className="mb-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="form-control mb-2"
                    />
                    <button
                      className="btn btn-primary"
                      onClick={handleScan}
                      disabled={scanning || !scanImage}
                    >
                      {scanning ? `Scanning... ${scanProgress}%` : 'Scan Image'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
            {currentMode === 'manual' && (
              <>
                <button type="button" className="btn btn-primary" onClick={() => handleSave(false)} disabled={loading}>
                  {loading ? <span className="spinner-border spinner-border-sm" role="status" /> : <><Save size={18} className="me-2" />Save as Draft</>}
                </button>
                <button type="button" className="btn btn-success" onClick={() => handleSave(true)} disabled={loading}>
                  {loading ? <span className="spinner-border spinner-border-sm" role="status" /> : <><Send size={18} className="me-2" />Submit to Admin</>}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultEntryModal;

import React, { useEffect, useState } from 'react';
import API from '../utils/api';
import GradeInput from '../Teacher/GradeInput';

const TeacherDashboard = () => {
	const [classes, setClasses] = useState([]);
	const [selectedClass, setSelectedClass] = useState(null);
	const [students, setStudents] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');

	useEffect(() => {
		const fetchClasses = async () => {
			try {
				const res = await API.get('/api/teacher/classes');
				setClasses(res.data.classes || []);
			} catch (err) {
				setError('Failed to load classes.');
			}
			setLoading(false);
		};
		fetchClasses();
	}, []);

		const handleClassSelect = async (classId) => {
			setSelectedClass(classId);
			setLoading(true);
			setError('');
			try {
				const res = await API.get(`/api/teacher/students?classId=${classId}`);
				setStudents(res.data.students || []);
			} catch (err) {
				setError(err.response?.data?.message || 'Failed to load students.');
			}
			setLoading(false);
		};

	if (loading) return <div>Loading...</div>;
	if (error) return <div className="alert alert-danger">{error}</div>;

	return (
		<div className="container mt-4">
			<h2 className="mb-4">Teacher Dashboard</h2>
			<div className="mb-3">
				<label>Select Class/Course:</label>
				<select className="form-select" value={selectedClass || ''} onChange={e => handleClassSelect(e.target.value)}>
					<option value="">-- Select --</option>
					{classes.map(cls => (
						<option key={cls._id} value={cls._id}>{cls.name}</option>
					))}
				</select>
			</div>
					{selectedClass && (
						<GradeInput classId={selectedClass} students={students} onSubmitted={() => handleClassSelect(selectedClass)} />
					)}
		</div>
	);
};

export default TeacherDashboard;

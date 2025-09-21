import React, { useState } from 'react';
import API from '../utils/api';

const GradeInput = ({ classId, students, onSubmitted }) => {
	const [grades, setGrades] = useState({});
	const [message, setMessage] = useState('');
	const [loading, setLoading] = useState(false);

	const handleGradeChange = (studentId, subject, value) => {
		setGrades(prev => ({
			...prev,
			[studentId]: {
				...prev[studentId],
				[subject]: value
			}
		}));
	};

	const handleSaveDraft = () => {
		localStorage.setItem(`grades-draft-${classId}`, JSON.stringify(grades));
		setMessage('Draft saved locally.');
	};

		const handleSubmit = async () => {
			setLoading(true);
			setMessage('');
			try {
				await API.post('/teacher/grades', { classId, grades });
				setMessage('Grades submitted to admin for verification.');
				localStorage.removeItem(`grades-draft-${classId}`);
				if (onSubmitted) onSubmitted();
			} catch (err) {
				setMessage(err.response?.data?.message || 'Failed to submit grades.');
			}
			setLoading(false);
		};

	return (
		<div className="card p-3 mb-4">
			<h5>Input Grades</h5>
			{message && <div className="alert alert-info">{message}</div>}
			<table className="table table-bordered">
				<thead>
					<tr>
						<th>Student</th>
						<th>Subject</th>
						<th>Grade</th>
					</tr>
				</thead>
				<tbody>
					{students.map(student => (
						<React.Fragment key={student._id}>
							{(student.subjects || ['Math', 'English']).map(subject => (
								<tr key={subject}>
									<td>{student.name}</td>
									<td>{subject}</td>
									<td>
										<input
											type="text"
											className="form-control"
											value={grades[student._id]?.[subject] || ''}
											onChange={e => handleGradeChange(student._id, subject, e.target.value)}
										/>
									</td>
								</tr>
							))}
						</React.Fragment>
					))}
				</tbody>
			</table>
			<button className="btn btn-secondary me-2" onClick={handleSaveDraft} disabled={loading}>Save Draft</button>
			<button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>Submit to Admin</button>
		</div>
	);
};

export default GradeInput;

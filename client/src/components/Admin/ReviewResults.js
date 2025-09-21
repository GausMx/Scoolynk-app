import React, { useEffect, useState } from 'react';
import API from '../utils/api';

const ReviewResults = () => {
	const [results, setResults] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [message, setMessage] = useState('');

	useEffect(() => {
		const fetchResults = async () => {
			setLoading(true);
			setError('');
			try {
				const res = await API.get('/api/admin/results');
				setResults(res.data.results || []);
			} catch (err) {
				setError('Failed to load results.');
			}
			setLoading(false);
		};
		fetchResults();
	}, []);

	const handleReview = async (resultId, action) => {
		setMessage('');
		try {
				await API.post('/api/admin/results/review', { resultId, action });
			setMessage(`Result ${action}ed.`);
			setResults(results => results.filter(r => r._id !== resultId));
		} catch (err) {
			setMessage('Failed to update result.');
		}
	};

	if (loading) return <div>Loading...</div>;
	if (error) return <div className="alert alert-danger">{error}</div>;

	return (
		<div className="card p-3 mb-4">
			<h5>Review Teacher-Submitted Results</h5>
			{message && <div className="alert alert-info">{message}</div>}
			{results.length === 0 ? (
				<div className="alert alert-success">No pending results.</div>
			) : (
				<table className="table table-bordered">
					<thead>
						<tr>
							<th>Student</th>
							<th>Class</th>
							<th>Subject</th>
							<th>Grade</th>
							<th>Teacher</th>
							<th>Action</th>
						</tr>
					</thead>
					<tbody>
						{results.map(result => (
							<tr key={result._id}>
								<td>{result.student?.name}</td>
								<td>{result.student?.classId?.name}</td>
								<td>{result.subject}</td>
								<td>{result.grade}</td>
								<td>{result.teacher?.name}</td>
								<td>
									<button className="btn btn-success btn-sm me-2" onClick={() => handleReview(result._id, 'verify')}>Verify</button>
									<button className="btn btn-danger btn-sm" onClick={() => handleReview(result._id, 'reject')}>Reject</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			)}
		</div>
	);
};

export default ReviewResults;

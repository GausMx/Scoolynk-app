import React, { useEffect, useState } from 'react';
import API from '../utils/api';

const ParentDashboard = () => {
	const [children, setChildren] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [notifications, setNotifications] = useState([]);

	useEffect(() => {
		const fetchData = async () => {
			try {
				// Fetch all children for the logged-in parent
				const res = await API.get('/api/parent/children');
				setChildren(res.data.children || []);
				setNotifications(res.data.notifications || []);
			} catch (err) {
				setError('Failed to load dashboard data.');
			}
			setLoading(false);
		};
		fetchData();
	}, []);

	if (loading) return <div>Loading...</div>;
	if (error) return <div className="alert alert-danger">{error}</div>;

	return (
		<div className="container mt-4">
			<h2 className="mb-4">Parent Dashboard</h2>

			<h4>Notifications</h4>
			{notifications.length === 0 ? (
				<div className="alert alert-info">No notifications.</div>
			) : (
				<ul className="list-group mb-4">
					{notifications.map((n, i) => (
						<li key={i} className="list-group-item">{n.message}</li>
					))}
				</ul>
			)}

			<h4>Children</h4>
			{children.length === 0 ? (
				<div className="alert alert-info">No children found.</div>
			) : (
				<div className="row">
					{children.map(child => (
						<div className="col-md-6 mb-4" key={child._id}>
							<div className="card shadow-sm">
								<div className="card-body">
									<h5 className="card-title">{child.name}</h5>
									<p>Class: {child.className || child.classId?.name || 'N/A'}</p>
									<p>Reg No: {child.regNo}</p>
									<h6>Results</h6>
									{child.results && child.results.length > 0 ? (
										<ul>
											{child.results.map((result, idx) => (
												<li key={idx}>{result.subject}: {result.grade}</li>
											))}
										</ul>
									) : (
										<p>No results yet.</p>
									)}
									<h6>School Fees</h6>
									{child.fees ? (
										<p>Amount: ₦{child.fees.amount} | Status: {child.fees.status}</p>
									) : (
										<p>No fee record.</p>
									)}
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
};

export default ParentDashboard;

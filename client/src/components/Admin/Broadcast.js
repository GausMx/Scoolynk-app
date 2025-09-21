import React, { useState } from 'react';
import API from '../utils/api';

const Broadcast = () => {
	const [message, setMessage] = useState('');
	const [status, setStatus] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e) => {
		e.preventDefault();
		setStatus('');
		setLoading(true);
		try {
			await API.post('/admin/broadcast', { message });
			setStatus('Notification sent to all users.');
			setMessage('');
		} catch (err) {
			setStatus('Failed to send notification.');
		}
		setLoading(false);
	};

	return (
		<div className="card p-3 mb-4">
			<h5>Broadcast Notification</h5>
			{status && <div className="alert alert-info">{status}</div>}
			<form onSubmit={handleSubmit}>
				<div className="mb-3">
					<textarea
						className="form-control"
						rows={3}
						value={message}
						onChange={e => setMessage(e.target.value)}
						placeholder="Enter notification message..."
						required
					/>
				</div>
				<button className="btn btn-primary" type="submit" disabled={loading || !message}>
					{loading ? 'Sending...' : 'Send Notification'}
				</button>
			</form>
		</div>
	);
};

export default Broadcast;

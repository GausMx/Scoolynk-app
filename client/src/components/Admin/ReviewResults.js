import React, { useState } from 'react';
import { Search, ListChecks, FileText } from 'lucide-react';

// Mock data for results waiting for admin final review/approval
const MOCK_RESULTS = [
    { id: 'res-101', class: 'JSS 2', term: 'First Term', teacher: 'Mr. Ken Adams', status: 'Pending Review', dateSubmitted: '2024-12-01' },
    { id: 'res-102', class: 'SSS 3', term: 'Second Term', teacher: 'Dr. John Miller', status: 'Approved', dateSubmitted: '2024-11-20' },
    { id: 'res-103', class: 'JSS 1', term: 'First Term', teacher: 'Ms. Sarah Connor', status: 'Pending Review', dateSubmitted: '2024-12-05' },
    { id: 'res-104', class: 'SSS 1', term: 'First Term', teacher: 'Mrs. Jane Doe', status: 'Rejected', dateSubmitted: '2024-11-28' },
];

const ReviewResult = () => {
    const [results, setResults] = useState(MOCK_RESULTS);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const filteredResults = results.filter(r => 
        r.class.toLowerCase().includes(searchTerm.toLowerCase()) || 
        r.teacher.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const updateResultStatus = (resultId, newStatus) => {
        setLoading(true);
        setMessage('');

        // ** API Integration Note: Replace setTimeout with your actual API PUT call **
        // Example API call: /api/admin/results/{resultId}/status
        setTimeout(() => {
            setResults(prev => prev.map(r => 
                r.id === resultId ? { ...r, status: newStatus } : r
            ));
            setLoading(false);
            setMessage(`Result ${resultId} status updated to ${newStatus}. (API simulation)`);
        }, 800);
    };

    const getStatusClasses = (status) => {
        switch (status) {
            case 'Approved': return 'bg-green-100 text-green-700';
            case 'Pending Review': return 'bg-yellow-100 text-yellow-700';
            case 'Rejected': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
            <h2 className="text-3xl font-bold text-gray-800 mb-5 flex items-center">
                <ListChecks size={28} className="mr-3 text-primary" /> Review Academic Results
            </h2>

            {message && (
                <div className={`p-3 rounded-lg mb-4 text-sm ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                    {message}
                </div>
            )}

            <div className="flex justify-between items-center mb-4">
                <div className="relative flex-grow max-w-md">
                    <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by class or teacher..."
                        className="form-control w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-primary focus:border-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading && <div className="text-center py-4 text-primary">Loading...</div>}

            <div className="table-responsive overflow-x-auto rounded-lg border">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Term</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted By</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredResults.length > 0 ? (
                            filteredResults.map((result) => (
                                <tr key={result.id} className="hover:bg-gray-50 transition duration-100">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{result.class}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.term}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.teacher}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{result.dateSubmitted}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClasses(result.status)}`}>
                                            {result.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                        <button
                                            className="text-blue-600 hover:text-blue-900 mx-1 p-2 rounded-full hover:bg-blue-100 transition"
                                            title="View Details"
                                            onClick={() => setMessage(`Viewing details for result: ${result.id}`)}
                                            disabled={loading}
                                        >
                                            <FileText size={18} />
                                        </button>
                                        {result.status === 'Pending Review' && (
                                            <>
                                                <button
                                                    className="text-green-600 hover:text-green-900 mx-1 p-2 rounded-full hover:bg-green-100 transition"
                                                    title="Approve Result"
                                                    onClick={() => updateResultStatus(result.id, 'Approved')}
                                                    disabled={loading}
                                                >
                                                    <Check size={18} />
                                                </button>
                                                <button
                                                    className="text-red-600 hover:text-red-900 mx-1 p-2 rounded-full hover:bg-red-100 transition"
                                                    title="Reject Result"
                                                    onClick={() => updateResultStatus(result.id, 'Rejected')}
                                                    disabled={loading}
                                                >
                                                    <X size={18} />
                                                </button>
                                            </>
                                        )}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">No results found matching your criteria.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <p className="mt-6 text-sm text-gray-500 p-3 bg-gray-50 rounded-lg">
                **API Integration Note:** Fetch data from `/api/admin/results-for-review` and use mutation endpoints like `/api/admin/results/{id}/approve`.
            </p>
        </div>
    );
};

export default ReviewResult;

// src/components/Admin/PaymentHistory.js - WITH REAL-TIME UPDATES

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  CreditCard,
  Info,
  RefreshCw
} from 'lucide-react';
import { toast } from 'react-toastify';
import Loading from '../common/Loading';

const { REACT_APP_API_URL } = process.env;

const PaymentHistory = () => {
  const [loading, setLoading] = useState(true);
  const [loadingPercent, setLoadingPercent] = useState(0);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, totalAmount: 0 });
  const [filteredPayments, setFilteredPayments] = useState([]);
  
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const token = localStorage.getItem('accessToken');

  // ✅ Initial fetch
  useEffect(() => {
    fetchPaymentHistory();
  }, []);

  // ✅ Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPaymentHistory(true); // Silent refresh
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  // ✅ Apply filters when data changes
  useEffect(() => {
    applyFilters();
  }, [payments, statusFilter, searchTerm, dateFilter]);

  const fetchPaymentHistory = useCallback(async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
        setLoadingPercent(10);
      } else {
        setRefreshing(true);
      }

      const res = await axios.get(`${REACT_APP_API_URL}/api/payments/history`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { paystackOnly: 'true' } // Only show Paystack payments
      });

      if (!silent) {
        setLoadingPercent(70);
      }

      // Check for new payments
      const newCompletedCount = res.data.stats.completed;
      const oldCompletedCount = stats.completed;
      
      if (silent && newCompletedCount > oldCompletedCount) {
        const diff = newCompletedCount - oldCompletedCount;
        toast.success(`${diff} new payment${diff > 1 ? 's' : ''} received!`, {
          position: 'top-right',
          autoClose: 5000
        });
      }

      setPayments(res.data.payments);
      setStats(res.data.stats);
      setLastRefresh(new Date());

      if (!silent) {
        setLoadingPercent(100);
      }
    } catch (err) {
      console.error('Failed to fetch payment history:', err);
      if (!silent) {
        setLoadingPercent(100);
        toast.error('Failed to load payment history');
      }
    } finally {
      if (!silent) {
        setLoading(false);
      } else {
        setRefreshing(false);
      }
    }
  }, [token, stats.completed]);

  const handleManualRefresh = () => {
    fetchPaymentHistory(false);
  };

  const applyFilters = () => {
    let filtered = [...payments];

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.studentId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.studentId?.regNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.paystackReference?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(p => {
        const paymentDate = new Date(p.createdAt);
        
        if (dateFilter === 'today') {
          return paymentDate.toDateString() === now.toDateString();
        } else if (dateFilter === 'week') {
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return paymentDate >= weekAgo;
        } else if (dateFilter === 'month') {
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return paymentDate >= monthAgo;
        }
        return true;
      });
    }

    setFilteredPayments(filtered);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Student Name', 'Reg No', 'Amount', 'Method', 'Reference', 'Status'];
    const rows = filteredPayments.map(p => [
      new Date(p.createdAt).toLocaleDateString(),
      p.studentId?.name || 'N/A',
      p.studentId?.regNo || 'N/A',
      p.amount,
      p.paymentMethod,
      p.paystackReference || 'N/A',
      p.status
    ]);

    let csvContent = headers.join(',') + '\n';
    rows.forEach(row => {
      csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const getStatusBadge = (status) => {
    const badges = {
      completed: { color: 'success', icon: CheckCircle, text: 'Completed' },
      pending: { color: 'warning', icon: Clock, text: 'Pending' },
      failed: { color: 'danger', icon: XCircle, text: 'Failed' },
      cancelled: { color: 'secondary', icon: XCircle, text: 'Cancelled' }
    };

    const badge = badges[status] || badges.pending;
    const Icon = badge.icon;

    return (
      <span className={`badge bg-${badge.color}`}>
        <Icon size={14} className="me-1" />
        {badge.text}
      </span>
    );
  };

  const getTimeSinceRefresh = () => {
    const seconds = Math.floor((new Date() - lastRefresh) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m ago`;
  };

  if (loading) {
    return <Loading percentage={loadingPercent} />;
  }

  return (
    <div className="container-fluid py-4" style={{ paddingTop: '80px' }}>
      {/* Header with Refresh */}
      <div className="mb-4 d-flex justify-content-between align-items-center">
        <div>
          <h2 className="fw-bold text-primary d-flex align-items-center fs-4 fs-md-3">
            <DollarSign size={28} className="me-2" />
            Payment History
          </h2>
          <p className="text-muted small mb-0">
            Track all initiated payment transactions
            <span className="badge bg-light text-dark ms-2">
              {refreshing ? (
                <><RefreshCw size={12} className="me-1" style={{ animation: 'spin 1s linear infinite' }} />Refreshing...</>
              ) : (
                <>Updated {getTimeSinceRefresh()}</>
              )}
            </span>
          </p>
        </div>
        <button 
          className="btn btn-outline-primary btn-sm rounded-3"
          onClick={handleManualRefresh}
          disabled={refreshing}
        >
          <RefreshCw size={16} className="me-1" />
          Refresh
        </button>
      </div>

      {/* Info Alert */}
      <div className="alert alert-info border-0 rounded-4 mb-4">
        <div className="d-flex align-items-start">
          <Info size={20} className="me-2 mt-1 flex-shrink-0" />
          <div>
            <small>
              <strong>Note:</strong> This page shows only payments that have been initiated through Paystack 
              (when parents click the payment link and start the checkout process). Payment links that have 
              been sent but not yet clicked will not appear here. The page auto-refreshes every 30 seconds.
            </small>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 bg-primary text-white">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="opacity-75">Total Transactions</small>
                  <h3 className="mb-0 mt-1 fs-4 fs-md-3">{stats.total}</h3>
                </div>
                <DollarSign size={32} className="opacity-50 d-none d-md-block" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 bg-success text-white">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="opacity-75">Completed</small>
                  <h3 className="mb-0 mt-1 fs-4 fs-md-3">{stats.completed}</h3>
                </div>
                <CheckCircle size={32} className="opacity-50 d-none d-md-block" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 bg-warning text-white">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="opacity-75">Pending</small>
                  <h3 className="mb-0 mt-1 fs-4 fs-md-3">{stats.pending}</h3>
                </div>
                <Clock size={32} className="opacity-50 d-none d-md-block" />
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-md-3">
          <div className="card border-0 shadow-sm rounded-4 bg-info text-white">
            <div className="card-body p-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <small className="opacity-75">Total Revenue</small>
                  <h3 className="mb-0 mt-1 fs-5 fs-md-4">₦{(stats.totalAmount / 1000).toFixed(1)}K</h3>
                </div>
                <TrendingUp size={32} className="opacity-50 d-none d-md-block" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="card border-0 shadow-sm rounded-4 mb-4">
        <div className="card-body p-3 p-md-4">
          <div className="row g-3">
            <div className="col-12 col-md-4">
              <label className="form-label fw-semibold small">
                <Search size={16} className="me-2" />
                Search
              </label>
              <input
                type="text"
                className="form-control rounded-3"
                placeholder="Student name, reg no, reference..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label fw-semibold small">
                <Filter size={16} className="me-2" />
                Status
              </label>
              <select
                className="form-select rounded-3"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div className="col-6 col-md-3">
              <label className="form-label fw-semibold small">
                <Calendar size={16} className="me-2" />
                Date Range
              </label>
              <select
                className="form-select rounded-3"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>

            <div className="col-12 col-md-2 d-flex align-items-end">
              <button
                className="btn btn-outline-primary rounded-3 w-100"
                onClick={exportToCSV}
                disabled={filteredPayments.length === 0}
              >
                <Download size={16} className="me-2" />
                <span className="d-none d-md-inline">Export</span>
                <span className="d-md-none">CSV</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="card border-0 shadow-sm rounded-4">
        <div className="card-body p-0">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-5">
              <DollarSign size={48} className="text-muted mb-3" />
              <h5 className="text-muted">No Payment Transactions Yet</h5>
              <p className="text-muted small">
                Payment transactions will appear here once parents click payment links and initiate checkout.
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="px-3 px-md-4 small">Date & Time</th>
                    <th className="small">Student</th>
                    <th className="d-none d-md-table-cell small">Reg No</th>
                    <th className="small">Amount</th>
                    <th className="d-none d-lg-table-cell small">Method</th>
                    <th className="d-none d-lg-table-cell small">Reference</th>
                    <th className="small">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((payment) => (
                    <tr key={payment._id}>
                      <td className="px-3 px-md-4">
                        <small className="fw-semibold">{new Date(payment.createdAt).toLocaleDateString()}</small>
                        <br />
                        <small className="text-muted">
                          {new Date(payment.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </small>
                      </td>
                      <td>
                        <div className="d-flex align-items-start flex-column">
                          <strong className="small">{payment.studentId?.name || 'Unknown'}</strong>
                          <span className="badge bg-light text-dark d-md-none mt-1" style={{ fontSize: '0.7rem' }}>
                            {payment.studentId?.regNo || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="d-none d-md-table-cell">
                        <span className="badge bg-light text-dark">{payment.studentId?.regNo || 'N/A'}</span>
                      </td>
                      <td>
                        <strong className="text-success small">₦{payment.amount.toLocaleString()}</strong>
                      </td>
                      <td className="d-none d-lg-table-cell">
                        <div className="d-flex align-items-center">
                          <CreditCard size={14} className="text-muted me-2" />
                          <small className="text-capitalize">{payment.paymentMethod || 'Card'}</small>
                        </div>
                      </td>
                      <td className="d-none d-lg-table-cell">
                        <small className="font-monospace text-muted">
                          {payment.paystackReference ? (
                            <span title={payment.paystackReference}>
                              {payment.paystackReference.substring(0, 12)}...
                            </span>
                          ) : (
                            'N/A'
                          )}
                        </small>
                      </td>
                      <td>
                        {getStatusBadge(payment.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {filteredPayments.length > 0 && (
          <div className="card-footer bg-light border-0 p-3">
            <small className="text-muted">
              Showing {filteredPayments.length} of {payments.length} total transactions
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

// Add spinning animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);

export default PaymentHistory;
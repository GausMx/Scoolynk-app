// server/services/auditService.js - NEW FILE

import PaymentAuditLog from '../models/PaymentAuditLog.js';

class AuditService {
  /**
   * Log payment action
   * @param {Object} data - Audit log data
   */
  async logPaymentAction(data) {
    try {
      const {
        paymentId,
        studentId,
        schoolId,
        action,
        amount,
        paymentToken,
        paystackReference,
        ipAddress,
        userAgent,
        email,
        status = 'success',
        errorMessage,
        errorCode,
        metadata = {}
      } = data;

      // Validate required fields
      if (!paymentId || !studentId || !schoolId || !action || !amount || !ipAddress) {
        console.error('[AuditService] Missing required fields:', data);
        return null;
      }

      const auditLog = new PaymentAuditLog({
        paymentId,
        studentId,
        schoolId,
        action,
        amount,
        paymentToken,
        paystackReference,
        ipAddress,
        userAgent,
        email,
        status,
        errorMessage,
        errorCode,
        metadata,
        timestamp: new Date()
      });

      await auditLog.save();
      
      console.log(`[AuditService] Logged ${action} for payment ${paymentId}`);
      return auditLog;
    } catch (error) {
      // Don't throw - logging failures shouldn't break payment flow
      console.error('[AuditService] Failed to log audit:', error);
      return null;
    }
  }

  /**
   * Get payment audit trail for a specific payment
   */
  async getPaymentAuditTrail(paymentId) {
    try {
      const logs = await PaymentAuditLog.find({ paymentId })
        .sort({ timestamp: 1 })
        .lean();
      
      return logs;
    } catch (error) {
      console.error('[AuditService] Failed to fetch audit trail:', error);
      return [];
    }
  }

  /**
   * Get audit logs for a school (filtered by date range)
   */
  async getSchoolAuditLogs(schoolId, options = {}) {
    try {
      const {
        startDate,
        endDate,
        action,
        status,
        limit = 100,
        skip = 0
      } = options;

      const query = { schoolId };

      if (startDate || endDate) {
        query.timestamp = {};
        if (startDate) query.timestamp.$gte = new Date(startDate);
        if (endDate) query.timestamp.$lte = new Date(endDate);
      }

      if (action) query.action = action;
      if (status) query.status = status;

      const logs = await PaymentAuditLog.find(query)
        .sort({ timestamp: -1 })
        .limit(limit)
        .skip(skip)
        .populate('studentId', 'name regNo')
        .lean();

      const total = await PaymentAuditLog.countDocuments(query);

      return { logs, total };
    } catch (error) {
      console.error('[AuditService] Failed to fetch school logs:', error);
      return { logs: [], total: 0 };
    }
  }

  /**
   * Get suspicious payment activities (for fraud detection)
   */
  async getSuspiciousActivities(schoolId, hours = 24) {
    try {
      const since = new Date(Date.now() - hours * 60 * 60 * 1000);

      // Find multiple failed attempts from same IP
      const suspiciousIPs = await PaymentAuditLog.aggregate([
        {
          $match: {
            schoolId: schoolId,
            timestamp: { $gte: since },
            status: 'failed'
          }
        },
        {
          $group: {
            _id: '$ipAddress',
            failedAttempts: { $sum: 1 },
            lastAttempt: { $max: '$timestamp' }
          }
        },
        {
          $match: {
            failedAttempts: { $gte: 5 } // 5+ failed attempts
          }
        },
        {
          $sort: { failedAttempts: -1 }
        }
      ]);

      return suspiciousIPs;
    } catch (error) {
      console.error('[AuditService] Failed to check suspicious activities:', error);
      return [];
    }
  }

  /**
   * Get payment statistics for reporting
   */
  async getPaymentStats(schoolId, startDate, endDate) {
    try {
      const stats = await PaymentAuditLog.aggregate([
        {
          $match: {
            schoolId: schoolId,
            timestamp: {
              $gte: new Date(startDate),
              $lte: new Date(endDate)
            }
          }
        },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      return stats;
    } catch (error) {
      console.error('[AuditService] Failed to get payment stats:', error);
      return [];
    }
  }

  /**
   * Clean up old audit logs (manual cleanup, TTL index handles automatic)
   */
  async cleanupOldLogs(daysOld = 730) { // 2 years default
    try {
      const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
      
      const result = await PaymentAuditLog.deleteMany({
        timestamp: { $lt: cutoffDate }
      });

      console.log(`[AuditService] Cleaned up ${result.deletedCount} old logs`);
      return result.deletedCount;
    } catch (error) {
      console.error('[AuditService] Failed to cleanup logs:', error);
      return 0;
    }
  }
}

export default new AuditService();
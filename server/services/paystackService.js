// server/services/paystackService.js - UPDATED WITH SUBACCOUNT METHODS

import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

class PaystackService {
  constructor() {
    this.client = axios.create({
      baseURL: PAYSTACK_BASE_URL,
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // ========== EXISTING METHODS ==========

  async initializeTransaction(params) {
    try {
      const { email, amount, reference, metadata, channels, callback_url, subaccount, transaction_charge, bearer } = params;

      const payload = {
        email,
        amount: amount * 100, // Convert to kobo
        reference,
        metadata: metadata || {},
        channels: channels || ['card', 'ussd', 'bank'],
        callback_url
      };

      // Add subaccount params for split payment (multi-tenant)
      if (subaccount) {
        payload.subaccount = subaccount;
        payload.transaction_charge = transaction_charge || 5; // Platform fee percentage
        payload.bearer = bearer || 'account'; // Who pays Paystack fees: 'account' (school) or 'subaccount'
      }

      const response = await this.client.post('/transaction/initialize', payload);

      return response.data;
    } catch (error) {
      console.error('[Paystack Initialize Error]', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to initialize payment');
    }
  }

  async verifyTransaction(reference) {
    try {
      const response = await this.client.get(`/transaction/verify/${reference}`);
      return response.data;
    } catch (error) {
      console.error('[Paystack Verify Error]', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to verify payment');
    }
  }

  async getTransaction(transactionId) {
    try {
      const response = await this.client.get(`/transaction/${transactionId}`);
      return response.data;
    } catch (error) {
      console.error('[Paystack Get Transaction Error]', error.response?.data || error.message);
      throw new Error('Failed to fetch transaction details');
    }
  }

  async listTransactions(params = {}) {
    try {
      const { perPage = 50, page = 1, from, to } = params;
      const response = await this.client.get('/transaction', {
        params: { perPage, page, from, to }
      });
      return response.data;
    } catch (error) {
      console.error('[Paystack List Transactions Error]', error.response?.data || error.message);
      throw new Error('Failed to fetch transactions');
    }
  }

  generateReference(studentId) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `PAY-${studentId.substring(0, 8)}-${timestamp}-${random}`;
  }

  // ========== NEW METHODS FOR MULTI-TENANT (SUBACCOUNTS) ==========

  /**
   * Get list of all Nigerian banks
   * @returns {Promise<Object>} List of banks with name and code
   */
  async getBanks() {
    try {
      const response = await this.client.get('/bank');
      return response.data;
    } catch (error) {
      console.error('[Paystack GetBanks Error]', error.response?.data || error.message);
      throw new Error('Failed to fetch banks list');
    }
  }

  /**
   * Verify bank account number
   * @param {String} accountNumber - 10-digit account number
   * @param {String} bankCode - Bank code from getBanks()
   * @returns {Promise<Object>} Account name and number
   */
  async verifyAccountNumber(accountNumber, bankCode) {
    try {
      const response = await this.client.get(
        `/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`
      );
      return response.data;
    } catch (error) {
      console.error('[Paystack VerifyAccount Error]', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to verify bank account');
    }
  }

  /**
   * Create a subaccount for a school
   * @param {Object} params - Subaccount parameters
   * @returns {Promise<Object>} Subaccount details with subaccount_code
   */
  async createSubaccount(params) {
    try {
      const {
        business_name,
        settlement_bank,
        account_number,
        percentage_charge,
        description,
        primary_contact_email,
        primary_contact_name,
        primary_contact_phone
      } = params;

      const response = await this.client.post('/subaccount', {
        business_name,
        settlement_bank,
        account_number,
        percentage_charge, // Your platform fee (e.g., 5 for 5%)
        description: description || `Subaccount for ${business_name}`,
        primary_contact_email,
        primary_contact_name,
        primary_contact_phone
      });

      return response.data;
    } catch (error) {
      console.error('[Paystack CreateSubaccount Error]', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to create subaccount');
    }
  }

  /**
   * Update existing subaccount
   * @param {String} subaccountCode - Subaccount code (e.g., ACCT_xxxxx)
   * @param {Object} params - Fields to update
   * @returns {Promise<Object>} Updated subaccount details
   */
  async updateSubaccount(subaccountCode, params) {
    try {
      const response = await this.client.put(`/subaccount/${subaccountCode}`, params);
      return response.data;
    } catch (error) {
      console.error('[Paystack UpdateSubaccount Error]', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || 'Failed to update subaccount');
    }
  }

  /**
   * Get details of a specific subaccount
   * @param {String} subaccountCode - Subaccount code
   * @returns {Promise<Object>} Subaccount details
   */
  async getSubaccount(subaccountCode) {
    try {
      const response = await this.client.get(`/subaccount/${subaccountCode}`);
      return response.data;
    } catch (error) {
      console.error('[Paystack GetSubaccount Error]', error.response?.data || error.message);
      throw new Error('Failed to fetch subaccount details');
    }
  }

  /**
   * List all subaccounts
   * @param {Object} params - Query parameters (perPage, page)
   * @returns {Promise<Object>} List of subaccounts
   */
  async listSubaccounts(params = {}) {
    try {
      const { perPage = 50, page = 1 } = params;
      const response = await this.client.get('/subaccount', {
        params: { perPage, page }
      });
      return response.data;
    } catch (error) {
      console.error('[Paystack ListSubaccounts Error]', error.response?.data || error.message);
      throw new Error('Failed to list subaccounts');
    }
  }

  /**
   * Delete/Deactivate a subaccount
   * @param {String} subaccountCode - Subaccount code
   * @returns {Promise<Object>} Deletion confirmation
   */
  async deleteSubaccount(subaccountCode) {
    try {
      const response = await this.client.delete(`/subaccount/${subaccountCode}`);
      return response.data;
    } catch (error) {
      console.error('[Paystack DeleteSubaccount Error]', error.response?.data || error.message);
      throw new Error('Failed to delete subaccount');
    }
  }

  /**
   * Get settlements for a specific subaccount
   * @param {String} subaccountCode - Subaccount code
   * @returns {Promise<Object>} Settlement history
   */
  async getSubaccountSettlements(subaccountCode) {
    try {
      const response = await this.client.get(`/settlement?subaccount=${subaccountCode}`);
      return response.data;
    } catch (error) {
      console.error('[Paystack GetSettlements Error]', error.response?.data || error.message);
      throw new Error('Failed to fetch settlements');
    }
  }

  /**
   * Validate bank account matches BVN (for verification)
   * @param {Object} params - Validation parameters
   * @returns {Promise<Object>} Validation result
   */
  async validateBankAccount(params) {
    try {
      const { account_number, account_name, account_type, bank_code, country_code } = params;
      
      const response = await this.client.post('/bank/validate', {
        account_number,
        account_name,
        account_type: account_type || 'personal',
        bank_code,
        country_code: country_code || 'NG'
      });

      return response.data;
    } catch (error) {
      console.error('[Paystack ValidateAccount Error]', error.response?.data || error.message);
      throw new Error('Failed to validate bank account');
    }
  }
}

export default new PaystackService();
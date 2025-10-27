import School from '../models/School.js';
import paystackService from '../services/paystackService.js';

// Get Nigerian Banks List
export const getBankList = async (req, res) => {
  try {
    const banks = await paystackService.getBanks();
    res.json({ banks: banks.data });
  } catch (err) {
    console.error('[GetBanks]', err);
    res.status(500).json({ message: 'Failed to fetch banks.' });
  }
};

// Verify Bank Account
export const verifyBankAccount = async (req, res) => {
  try {
    const { accountNumber, bankCode } = req.body;
    
    if (!accountNumber || !bankCode) {
      return res.status(400).json({ message: 'Account number and bank code required.' });
    }

    const verification = await paystackService.verifyAccountNumber(accountNumber, bankCode);
    
    if (verification.status) {
      res.json({
        accountName: verification.data.account_name,
        accountNumber: verification.data.account_number
      });
    } else {
      res.status(400).json({ message: 'Account verification failed.' });
    }
  } catch (err) {
    console.error('[VerifyAccount]', err);
    res.status(500).json({ message: 'Failed to verify account.' });
  }
};

// Create Subaccount for School
export const createSubaccount = async (req, res) => {
  try {
    const schoolId = req.user.schoolId;
    const { accountNumber, bankCode, bankName } = req.body;

    // Get school
    const school = await School.findById(schoolId);
    if (!school) {
      return res.status(404).json({ message: 'School not found.' });
    }

    // Check if subaccount already exists
    if (school.paystackSubaccountId) {
      return res.status(400).json({ message: 'Payment account already configured.' });
    }

    // Verify account first
    const verification = await paystackService.verifyAccountNumber(accountNumber, bankCode);
    
    if (!verification.status) {
      return res.status(400).json({ message: 'Invalid bank account details.' });
    }

    // Create subaccount with Paystack
    const platformFee = school.paymentSettings?.platformFeePercentage || 5;
    
    const subaccountData = await paystackService.createSubaccount({
      business_name: school.name,
      settlement_bank: bankCode,
      account_number: accountNumber,
      percentage_charge: platformFee, // Your platform fee
      description: `Payment account for ${school.name}`,
      primary_contact_email: req.user.email,
      primary_contact_name: school.name,
      primary_contact_phone: school.phone
    });

    // Save to school record
    school.paystackSubaccountId = subaccountData.data.id;
    school.paystackSubaccountCode = subaccountData.data.subaccount_code;
    school.bankDetails = {
      accountNumber,
      accountName: verification.data.account_name,
      bankCode, 
      bankName
    };
    school.paymentSettings.isActive = true;
    school.paymentSettings.verificationStatus = 'verified';

    await school.save();

    res.json({
      message: 'Payment account configured successfully!',
      subaccount: {
        accountName: verification.data.account_name,
        accountNumber,
        bankName,
        platformFee: `${platformFee}%`
      }
    });
  } catch (err) {
    console.error('[CreateSubaccount]', err);
    res.status(500).json({ 
      message: err.message || 'Failed to configure payment account.' 
    });
  }
};

// Get School Payment Configuration
export const getPaymentConfig = async (req, res) => {
  try {
    const school = await School.findById(req.user.schoolId).select(
      'paystackSubaccountId paystackSubaccountCode bankDetails paymentSettings'
    );

    if (!school) {
      return res.status(404).json({ message: 'School not found.' });
    }

    res.json({
      isConfigured: !!school.paystackSubaccountId,
      bankDetails: school.bankDetails || null,
      paymentSettings: school.paymentSettings || null
    });
  } catch (err) {
    console.error('[GetPaymentConfig]', err);
    res.status(500).json({ message: 'Failed to fetch configuration.' });
  }
};

// Update Subaccount
export const updateSubaccount = async (req, res) => {
  try {
    const school = await School.findById(req.user.schoolId);
    
    if (!school || !school.paystackSubaccountCode) {
      return res.status(400).json({ message: 'No payment account configured.' });
    }

    const { accountNumber, bankCode, bankName } = req.body;

    // Verify new account
    const verification = await paystackService.verifyAccountNumber(accountNumber, bankCode);
    
    if (!verification.status) {
      return res.status(400).json({ message: 'Invalid bank account.' });
    }

    // Update subaccount with Paystack
    await paystackService.updateSubaccount(school.paystackSubaccountCode, {
      settlement_bank: bankCode,
      account_number: accountNumber,
      business_name: school.name
    });

    // Update school record
    school.bankDetails = {
      accountNumber,
      accountName: verification.data.account_name,
      bankCode,
      bankName
    };

    await school.save();

    res.json({ message: 'Payment account updated successfully!' });
  } catch (err) {
    console.error('[UpdateSubaccount]', err);
    res.status(500).json({ message: 'Failed to update account.' });
  }
};
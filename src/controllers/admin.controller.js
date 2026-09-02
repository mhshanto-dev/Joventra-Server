import { User } from '../models/User.model.js';
import { Company } from '../models/Company.model.js';
import { Job } from '../models/Job.model.js';
import { Application } from '../models/Application.model.js';
import { Payment } from '../models/Payment.model.js';
import { Subscription } from '../models/Subscription.model.js';
import { SeekerProfile } from '../models/SeekerProfile.model.js';
import { ROLES } from '../constants/roles.js';
import { COMPANY_STATUS } from '../constants/statuses.js';

export const getAllUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;

    const query = { _id: { $ne: req.user._id } }; // Exclude current admin

    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }

    if (role && role !== 'All') {
      query.role = role;
    }

    if (status !== undefined && status !== 'All') {
      query.isActive = status === 'active';
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password -refreshTokenHash')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message,
    });
  }
};

export const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (![ROLES.SEEKER, ROLES.RECRUITER].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role assignment. Only Seeker and Recruiter roles are allowed.',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Cannot alter admin role.',
      });
    }

    user.role = role;
    await user.save();

    // Ensure corresponding profile/subscription structures exist
    if (role === ROLES.SEEKER) {
      const existingProfile = await SeekerProfile.findOne({ userId: user._id });
      if (!existingProfile) {
        await SeekerProfile.create({ userId: user._id });
      }
    }

    await Subscription.findOneAndUpdate(
      { userId: user._id },
      { userRole: role },
      { upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: `User role successfully updated to ${role}.`,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update user role',
      error: error.message,
    });
  }
};

export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Cannot suspend admin accounts.',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    return res.status(200).json({
      success: true,
      message: `User account has been ${user.isActive ? 'activated' : 'suspended'}.`,
      data: {
        id: user._id,
        isActive: user.isActive,
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle user status',
      error: error.message,
    });
  }
};

export const getAllCompaniesAdmin = async (req, res) => {
  try {
    const { status, search, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status && status !== 'All') {
      query.status = status;
    }

    if (search) {
      query.name = new RegExp(search, 'i');
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Company.countDocuments(query);
    const companies = await Company.find(query)
      .populate('recruiterId', 'name email avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: companies,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch companies for admin',
      error: error.message,
    });
  }
};

export const approveCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id).populate('recruiterId', 'name email');
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    company.status = COMPANY_STATUS.APPROVED;
    await company.save();

    return res.status(200).json({
      success: true,
      message: `Company "${company.name}" approved and is now publicly visible!`,
      data: company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to approve company',
      error: error.message,
    });
  }
};

export const rejectCompany = async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id).populate('recruiterId', 'name email');
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    company.status = COMPANY_STATUS.REJECTED;
    await company.save();

    return res.status(200).json({
      success: true,
      message: `Company "${company.name}" has been rejected.`,
      data: company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reject company',
      error: error.message,
    });
  }
};

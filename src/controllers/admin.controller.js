import { User } from '../models/User.model.js';
import { Company } from '../models/Company.model.js';
import { Job } from '../models/Job.model.js';
import { Application } from '../models/Application.model.js';
import { Payment } from '../models/Payment.model.js';
import { Subscription } from '../models/Subscription.model.js';
import { SeekerProfile } from '../models/SeekerProfile.model.js';
import { ROLES } from '../constants/roles.js';
import { COMPANY_STATUS, JOB_STATUS } from '../constants/statuses.js';
import { sendCompanyApprovalEmail } from '../services/email.service.js';

export const getAllUsers = async (req, res) => {
  try {
    const { search, role, status, page = 1, limit = 10 } = req.query;

    const query = { _id: { $ne: req.user._id } };

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

export const deleteUserAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account.',
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Find all jobs posted by recruiter (if user is recruiter) to clean their applications
    const jobs = await Job.find({ recruiterId: user._id }).select('_id');
    const jobIds = jobs.map((j) => j._id);
    if (jobIds.length > 0) {
      await Application.deleteMany({ jobId: { $in: jobIds } });
    }

    // Cascade delete user data across models
    await Promise.all([
      SeekerProfile.deleteMany({ userId: user._id }),
      Application.deleteMany({ seekerId: user._id }),
      Job.deleteMany({ recruiterId: user._id }),
      Company.deleteMany({ recruiterId: user._id }),
      Subscription.deleteMany({ userId: user._id }),
      Payment.deleteMany({ userId: user._id }),
      User.findByIdAndDelete(id),
    ]);

    return res.status(200).json({
      success: true,
      message: 'User account and associated records deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user account',
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

    if (company.recruiterId?.email) {
      sendCompanyApprovalEmail({
        recruiter: company.recruiterId,
        company,
        isApproved: true,
      }).catch(err => console.error('Company approval email error:', err));
    }

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

    if (company.recruiterId?.email) {
      sendCompanyApprovalEmail({
        recruiter: company.recruiterId,
        company,
        isApproved: false,
      }).catch(err => console.error('Company rejection email error:', err));
    }

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

export const getAllJobsAdmin = async (req, res) => {
  try {
    const { search, status, category, page = 1, limit = 10 } = req.query;

    const query = {};
    if (status && status !== 'All') {
      query.status = status;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .populate('companyId', 'name logoUrl location')
      .populate('recruiterId', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: jobs,
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
      message: 'Failed to fetch jobs for admin',
      error: error.message,
    });
  }
};

export const removeJobAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const job = await Job.findByIdAndDelete(id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    await Application.deleteMany({ jobId: id });

    return res.status(200).json({
      success: true,
      message: 'Job listing removed by admin successfully.',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete job',
      error: error.message,
    });
  }
};

export const getPlatformStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: { $ne: ROLES.ADMIN } });
    const totalRecruiters = await User.countDocuments({ role: ROLES.RECRUITER });
    const totalSeekers = await User.countDocuments({ role: ROLES.SEEKER });
    const totalCompanies = await Company.countDocuments();
    const totalApprovedCompanies = await Company.countDocuments({ status: COMPANY_STATUS.APPROVED });
    const totalJobsPosted = await Job.countDocuments();
    const activeJobs = await Job.countDocuments({ status: JOB_STATUS.ACTIVE });
    const totalApplications = await Application.countDocuments();

    const revenueAgg = await Payment.aggregate([
      { $match: { status: 'succeeded' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const platformRevenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

    return res.status(200).json({
      success: true,
      data: {
        totalUsers,
        totalRecruiters,
        totalSeekers,
        totalCompanies,
        totalApprovedCompanies,
        totalJobsPosted,
        activeJobs,
        totalApplications,
        platformRevenue,
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate platform statistics',
      error: error.message,
    });
  }
};

export const getUserGrowthAnalytics = async (req, res) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const userRegistrations = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 },
          seekers: {
            $sum: { $cond: [{ $eq: ["$role", "seeker"] }, 1, 0] }
          },
          recruiters: {
            $sum: { $cond: [{ $eq: ["$role", "recruiter"] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const result = [];
    const dateMap = {};
    userRegistrations.forEach(item => {
      dateMap[item._id] = item;
    });

    for (let i = 0; i < 30; i++) {
      const d = new Date(thirtyDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const monthDay = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      result.push({
        date: monthDay,
        fullDate: dateStr,
        count: dateMap[dateStr]?.count || 0,
        seekers: dateMap[dateStr]?.seekers || 0,
        recruiters: dateMap[dateStr]?.recruiters || 0,
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate user growth analytics',
      error: error.message,
    });
  }
};

export const getJobsPerCategoryAnalytics = async (req, res) => {
  try {
    const categoryStats = await Job.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const formatted = categoryStats.map(item => ({
      category: item._id,
      shortCategory: item._id.split('&')[0].trim(),
      count: item.count,
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to generate jobs per category analytics',
      error: error.message,
    });
  }
};

export const getRecentPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('userId', 'name email avatarUrl role')
      .sort({ paidAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      data: payments,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recent payments',
      error: error.message,
    });
  }
};

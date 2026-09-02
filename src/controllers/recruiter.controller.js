import { Job } from '../models/Job.model.js';
import { Application } from '../models/Application.model.js';
import { Company } from '../models/Company.model.js';
import { Subscription } from '../models/Subscription.model.js';
import { RECRUITER_PLANS } from '../constants/plans.js';
import { JOB_STATUS } from '../constants/statuses.js';

export const getRecruiterStats = async (req, res) => {
  try {
    const recruiterId = req.user._id;

    const totalJobPosts = await Job.countDocuments({ recruiterId });
    const activeJobs = await Job.countDocuments({ recruiterId, status: JOB_STATUS.ACTIVE });
    const closedJobs = await Job.countDocuments({ recruiterId, status: JOB_STATUS.CLOSED });

    const recruiterJobs = await Job.find({ recruiterId }).select('_id');
    const jobIds = recruiterJobs.map(j => j._id);

    const totalApplicants = await Application.countDocuments({ jobId: { $in: jobIds } });

    return res.status(200).json({
      success: true,
      data: {
        totalJobPosts,
        activeJobs,
        closedJobs,
        totalApplicants,
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recruiter stats',
      error: error.message,
    });
  }
};

export const getApplicantsPerJobAnalytics = async (req, res) => {
  try {
    const recruiterId = req.user._id;

    const jobs = await Job.find({ recruiterId })
      .select('title applicationCount createdAt status')
      .sort({ createdAt: -1 })
      .limit(8);

    const formatted = jobs.map(job => ({
      id: job._id,
      title: job.title.length > 18 ? `${job.title.substring(0, 18)}...` : job.title,
      fullTitle: job.title,
      applicants: job.applicationCount,
      status: job.status,
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch applicants per job chart data',
      error: error.message,
    });
  }
};

export const getRecentApplications = async (req, res) => {
  try {
    const recruiterId = req.user._id;

    const recruiterJobs = await Job.find({ recruiterId }).select('_id');
    const jobIds = recruiterJobs.map(j => j._id);

    const applications = await Application.find({ jobId: { $in: jobIds } })
      .populate('seekerId', 'name email avatarUrl')
      .populate('jobId', 'title category jobType')
      .sort({ appliedAt: -1 })
      .limit(10);

    return res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recent applications for recruiter',
      error: error.message,
    });
  }
};

export const getJobPlanUsage = async (req, res) => {
  try {
    const recruiterId = req.user._id;

    let subscription = await Subscription.findOne({ userId: recruiterId });
    if (!subscription) {
      subscription = await Subscription.create({
        userId: recruiterId,
        userRole: 'recruiter',
        planType: 'free',
        status: 'active',
      });
    }

    const planKey = (subscription.planType || 'free').toUpperCase();
    const planConfig = RECRUITER_PLANS[planKey] || RECRUITER_PLANS.FREE;
    const maxActiveJobs = planConfig.maxActiveJobs;

    const activeJobsCount = await Job.countDocuments({
      recruiterId,
      status: JOB_STATUS.ACTIVE,
    });

    return res.status(200).json({
      success: true,
      data: {
        plan: planConfig.name,
        planId: planConfig.id,
        price: planConfig.price,
        activeJobsCount,
        maxActiveJobs,
        remainingJobs: Math.max(0, maxActiveJobs - activeJobsCount),
        usagePercentage: Math.min(100, Math.round((activeJobsCount / maxActiveJobs) * 100)),
        canPostJob: activeJobsCount < maxActiveJobs,
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch job plan usage',
      error: error.message,
    });
  }
};

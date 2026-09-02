import { Application } from '../models/Application.model.js';
import { SeekerProfile } from '../models/SeekerProfile.model.js';
import { Subscription } from '../models/Subscription.model.js';
import { Job } from '../models/Job.model.js';
import { SEEKER_PLANS } from '../constants/plans.js';
import { APPLICATION_STATUS, JOB_STATUS } from '../constants/statuses.js';

export const getSeekerStats = async (req, res) => {
  try {
    const seekerId = req.user._id;

    const profile = await SeekerProfile.findOne({ userId: seekerId });
    const savedJobsCount = profile?.savedJobs?.length || 0;

    const applicationsSubmitted = await Application.countDocuments({ seekerId });
    const interviewsScheduled = await Application.countDocuments({
      seekerId,
      status: APPLICATION_STATUS.SHORTLISTED,
    });
    const offersReceived = await Application.countDocuments({
      seekerId,
      status: APPLICATION_STATUS.OFFERED,
    });

    return res.status(200).json({
      success: true,
      data: {
        savedJobsCount,
        applicationsSubmitted,
        interviewsScheduled,
        offersReceived,
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch seeker statistics',
      error: error.message,
    });
  }
};

export const getSeekerRecentActivity = async (req, res) => {
  try {
    const seekerId = req.user._id;

    const recentApplications = await Application.find({ seekerId })
      .populate('jobId', 'title category location')
      .populate('companyId', 'name logoUrl')
      .sort({ updatedAt: -1 })
      .limit(6);

    const activities = recentApplications.map(app => {
      let message = '';
      let type = 'application';

      switch (app.status) {
        case APPLICATION_STATUS.OFFERED:
          message = `Received an offer for "${app.jobId?.title || 'Job'}" at ${app.companyId?.name || 'Company'}! 🎉`;
          type = 'offer';
          break;
        case APPLICATION_STATUS.SHORTLISTED:
          message = `Shortlisted for interview at ${app.companyId?.name || 'Company'} for "${app.jobId?.title || 'Job'}".`;
          type = 'interview';
          break;
        case APPLICATION_STATUS.UNDER_REVIEW:
          message = `Your application for "${app.jobId?.title || 'Job'}" is under review.`;
          type = 'review';
          break;
        case APPLICATION_STATUS.REJECTED:
          message = `Status updated for "${app.jobId?.title || 'Job'}" at ${app.companyId?.name || 'Company'}.`;
          type = 'update';
          break;
        default:
          message = `Applied to "${app.jobId?.title || 'Job'}" at ${app.companyId?.name || 'Company'}.`;
          type = 'applied';
      }

      return {
        id: app._id,
        message,
        type,
        status: app.status,
        date: app.updatedAt || app.appliedAt,
        jobId: app.jobId?._id,
        companyName: app.companyId?.name,
        companyLogo: app.companyId?.logoUrl,
      };
    });

    return res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch seeker recent activity',
      error: error.message,
    });
  }
};

export const getSeekerPlanUsage = async (req, res) => {
  try {
    const seekerId = req.user._id;

    let subscription = await Subscription.findOne({ userId: seekerId });
    if (!subscription) {
      subscription = await Subscription.create({
        userId: seekerId,
        userRole: 'seeker',
        planType: 'free',
        status: 'active',
      });
    }

    const planKey = (subscription.planType || 'free').toUpperCase();
    const planConfig = SEEKER_PLANS[planKey] || SEEKER_PLANS.FREE;

    const profile = await SeekerProfile.findOne({ userId: seekerId });
    const savedJobsCount = profile?.savedJobs?.length || 0;

    return res.status(200).json({
      success: true,
      data: {
        plan: planConfig.name,
        planId: planConfig.id,
        price: planConfig.price,
        applicationsUsedThisMonth: subscription.applicationsUsedThisMonth,
        maxApplicationsPerMonth: planConfig.maxApplicationsPerMonth === Infinity ? 'Unlimited' : planConfig.maxApplicationsPerMonth,
        savedJobsCount,
        maxSavedJobs: planConfig.maxSavedJobs === Infinity ? 'Unlimited' : planConfig.maxSavedJobs,
        canApply: planConfig.maxApplicationsPerMonth === Infinity || subscription.applicationsUsedThisMonth < planConfig.maxApplicationsPerMonth,
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch seeker plan usage',
      error: error.message,
    });
  }
};

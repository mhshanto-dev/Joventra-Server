import { Application } from '../models/Application.model.js';
import { Job } from '../models/Job.model.js';
import { User } from '../models/User.model.js';
import { SeekerProfile } from '../models/SeekerProfile.model.js';
import { Subscription } from '../models/Subscription.model.js';
import { SEEKER_PLANS } from '../constants/plans.js';
import { APPLICATION_STATUS, JOB_STATUS } from '../constants/statuses.js';
import { sendApplicationConfirmationEmail, sendStatusUpdateEmail } from '../services/email.service.js';

export const applyToJob = async (req, res) => {
  try {
    const seekerId = req.user._id;
    const { jobId } = req.params;
    const { coverLetter, resumeUrl } = req.body;

    const job = await Job.findById(jobId).populate('companyId');
    if (!job || job.status !== JOB_STATUS.ACTIVE) {
      return res.status(404).json({
        success: false,
        message: 'Job is no longer active or does not exist.',
      });
    }

    if (new Date(job.deadline) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'The deadline for this job has passed.',
      });
    }

    const existingApplication = await Application.findOne({ seekerId, jobId });
    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted an application for this job.',
      });
    }

    let subscription = await Subscription.findOne({ userId: seekerId });
    if (!subscription) {
      subscription = await Subscription.create({
        userId: seekerId,
        userRole: 'seeker',
        planType: 'free',
      });
    }

    const now = new Date();
    const lastReset = new Date(subscription.lastApplicationReset || subscription.createdAt);
    const isDifferentMonth = now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear();
    
    if (isDifferentMonth) {
      subscription.applicationsUsedThisMonth = 0;
      subscription.lastApplicationReset = now;
      await subscription.save();
    }

    const planKey = (subscription.planType || 'free').toUpperCase();
    const planConfig = SEEKER_PLANS[planKey] || SEEKER_PLANS.FREE;
    const maxApplications = planConfig.maxApplicationsPerMonth;

    if (subscription.applicationsUsedThisMonth >= maxApplications) {
      return res.status(403).json({
        success: false,
        message: `Monthly application limit of ${maxApplications} reached for your ${planConfig.name} plan. Upgrade to Pro or Premium for more applications!`,
      });
    }

    let finalResumeUrl = resumeUrl;
    if (!finalResumeUrl) {
      const profile = await SeekerProfile.findOne({ userId: seekerId });
      finalResumeUrl = profile?.resumeUrl || '';
    }

    const application = await Application.create({
      seekerId,
      jobId,
      companyId: job.companyId._id,
      coverLetter: coverLetter || '',
      resumeUrl: finalResumeUrl,
      status: APPLICATION_STATUS.APPLIED,
    });

    await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } });
    await Subscription.findByIdAndUpdate(subscription._id, { $inc: { applicationsUsedThisMonth: 1 } });

    // Send email asynchronously
    sendApplicationConfirmationEmail({
      seeker: req.user,
      job,
      company: job.companyId,
    }).catch(err => console.error('Application confirmation email error:', err));

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      data: application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to submit application',
      error: error.message,
    });
  }
};

export const getMyApplications = async (req, res) => {
  try {
    const seekerId = req.user._id;
    const { status, page = 1, limit = 10 } = req.query;

    const query = { seekerId };
    if (status && status !== 'All') {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Application.countDocuments(query);
    const applications = await Application.find(query)
      .populate({
        path: 'jobId',
        select: 'title category jobType location salaryMin salaryMax currency deadline status',
      })
      .populate({
        path: 'companyId',
        select: 'name logoUrl location industry',
      })
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      data: applications,
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
      message: 'Failed to fetch applications',
      error: error.message,
    });
  }
};

export const getJobApplicants = async (req, res) => {
  try {
    const { jobId } = req.params;
    const recruiterId = req.user._id;

    const job = await Job.findOne({ _id: jobId, recruiterId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job post not found or unauthorized access.',
      });
    }

    const applicants = await Application.find({ jobId })
      .populate('seekerId', 'name email avatarUrl')
      .sort({ appliedAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        job: {
          id: job._id,
          title: job.title,
          status: job.status,
          applicationCount: job.applicationCount,
        },
        applicants,
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch applicants',
      error: error.message,
    });
  }
};

export const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const recruiterId = req.user._id;

    if (!Object.values(APPLICATION_STATUS).includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid application status value.',
      });
    }

    const application = await Application.findById(id)
      .populate('jobId')
      .populate('seekerId', 'name email')
      .populate('companyId', 'name');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    if (application.jobId.recruiterId.toString() !== recruiterId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to manage applicants for this job.',
      });
    }

    application.status = status;
    await application.save();

    // Trigger status update email to seeker
    if (application.seekerId?.email) {
      sendStatusUpdateEmail({
        seeker: application.seekerId,
        job: application.jobId,
        company: application.companyId,
        status,
      }).catch(err => console.error('Status update email error:', err));
    }

    return res.status(200).json({
      success: true,
      message: `Applicant status updated to ${status.replace('_', ' ')}`,
      data: application,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update application status',
      error: error.message,
    });
  }
};

export const getApplicationStats = async (req, res) => {
  try {
    const seekerId = req.user._id;

    const stats = await Application.aggregate([
      { $match: { seekerId } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    const formatted = {
      applied: 0,
      under_review: 0,
      shortlisted: 0,
      rejected: 0,
      offered: 0,
    };

    stats.forEach(item => {
      if (formatted[item._id] !== undefined) {
        formatted[item._id] = item.count;
      }
    });

    return res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch application distribution stats',
      error: error.message,
    });
  }
};

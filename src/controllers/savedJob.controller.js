import { SeekerProfile } from '../models/SeekerProfile.model.js';
import { Job } from '../models/Job.model.js';
import { Subscription } from '../models/Subscription.model.js';
import { SEEKER_PLANS } from '../constants/plans.js';

export const saveJob = async (req, res) => {
  try {
    const seekerId = req.user._id;
    const { jobId } = req.params;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    let profile = await SeekerProfile.findOne({ userId: seekerId });
    if (!profile) {
      profile = await SeekerProfile.create({ userId: seekerId });
    }

    if (profile.savedJobs.some(id => id.toString() === jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Job is already saved in your bookmarks.',
      });
    }

    // Check limit for free plan
    const subscription = await Subscription.findOne({ userId: seekerId });
    const planKey = (subscription?.planType || 'free').toUpperCase();
    const planConfig = SEEKER_PLANS[planKey] || SEEKER_PLANS.FREE;
    const maxSavedJobs = planConfig.maxSavedJobs;

    if (profile.savedJobs.length >= maxSavedJobs) {
      return res.status(403).json({
        success: false,
        message: `Saved jobs limit of ${maxSavedJobs} reached for your ${planConfig.name} plan. Upgrade to Pro for unlimited bookmarks!`,
      });
    }

    profile.savedJobs.push(jobId);
    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Job saved to your bookmarks!',
      data: profile.savedJobs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to save job',
      error: error.message,
    });
  }
};

export const unsaveJob = async (req, res) => {
  try {
    const seekerId = req.user._id;
    const { jobId } = req.params;

    let profile = await SeekerProfile.findOne({ userId: seekerId });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found',
      });
    }

    profile.savedJobs = profile.savedJobs.filter(id => id.toString() !== jobId);
    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Job removed from bookmarks.',
      data: profile.savedJobs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to remove saved job',
      error: error.message,
    });
  }
};

export const getSavedJobs = async (req, res) => {
  try {
    const seekerId = req.user._id;

    const profile = await SeekerProfile.findOne({ userId: seekerId }).populate({
      path: 'savedJobs',
      populate: {
        path: 'companyId',
        select: 'name logoUrl location industry slug',
      }
    });

    return res.status(200).json({
      success: true,
      data: profile?.savedJobs || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch saved jobs',
      error: error.message,
    });
  }
};

export const checkJobSaved = async (req, res) => {
  try {
    const seekerId = req.user._id;
    const { jobId } = req.params;

    const profile = await SeekerProfile.findOne({ userId: seekerId });
    const isSaved = profile?.savedJobs.some(id => id.toString() === jobId) || false;

    return res.status(200).json({
      success: true,
      isSaved,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to check saved status',
      error: error.message,
    });
  }
};

import { Job } from '../models/Job.model.js';
import { Company } from '../models/Company.model.js';
import { Subscription } from '../models/Subscription.model.js';
import { Application } from '../models/Application.model.js';
import { RECRUITER_PLANS } from '../constants/plans.js';
import { COMPANY_STATUS, JOB_STATUS } from '../constants/statuses.js';

export const createJob = async (req, res) => {
  try {
    const recruiterId = req.user._id;

    // 1. Check company
    const company = await Company.findOne({ recruiterId });
    if (!company) {
      return res.status(400).json({
        success: false,
        message: 'You must register a company profile before posting jobs.',
      });
    }

    if (company.status !== COMPANY_STATUS.APPROVED) {
      return res.status(403).json({
        success: false,
        message: 'Your company registration is pending admin approval. You can post jobs once approved.',
      });
    }

    // 2. Check recruiter subscription & active job limits
    let subscription = await Subscription.findOne({ userId: recruiterId });
    const planKey = (subscription?.planType || 'free').toUpperCase();
    const planConfig = RECRUITER_PLANS[planKey] || RECRUITER_PLANS.FREE;
    const maxActiveJobs = planConfig.maxActiveJobs;

    const currentActiveJobs = await Job.countDocuments({
      recruiterId,
      status: JOB_STATUS.ACTIVE,
    });

    if (currentActiveJobs >= maxActiveJobs) {
      return res.status(403).json({
        success: false,
        message: `Plan limit reached! Your ${planConfig.name} plan allows up to ${maxActiveJobs} active job posts. Please upgrade your plan.`,
      });
    }

    const {
      title,
      category,
      jobType,
      salaryMin,
      salaryMax,
      currency,
      location,
      isRemote,
      deadline,
      responsibilities,
      requirements,
      benefits,
    } = req.body;

    const slug = `${title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}-${Date.now().toString().slice(-6)}`;

    const job = await Job.create({
      title,
      slug,
      companyId: company._id,
      recruiterId,
      category,
      jobType,
      salaryMin: Number(salaryMin),
      salaryMax: Number(salaryMax),
      currency: currency || 'USD',
      location: location || { city: company.location?.city || '', country: company.location?.country || '' },
      isRemote: Boolean(isRemote),
      deadline: new Date(deadline),
      responsibilities,
      requirements,
      benefits: benefits || '',
      status: JOB_STATUS.ACTIVE,
    });

    return res.status(201).json({
      success: true,
      message: 'Job posted successfully!',
      data: job,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create job post',
      error: error.message,
    });
  }
};

export const getAllJobs = async (req, res) => {
  try {
    const {
      search,
      category,
      jobType,
      location,
      minSalary,
      maxSalary,
      isRemote,
      sort = 'newest',
      page = 1,
      limit = 10,
    } = req.query;

    const query = { status: JOB_STATUS.ACTIVE };

    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { responsibilities: new RegExp(search, 'i') },
        { requirements: new RegExp(search, 'i') }
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (jobType && jobType !== 'All') {
      query.jobType = jobType;
    }

    if (location) {
      query.$or = [
        { 'location.city': new RegExp(location, 'i') },
        { 'location.country': new RegExp(location, 'i') }
      ];
    }

    if (isRemote === 'true' || isRemote === true) {
      query.isRemote = true;
    }

    if (minSalary) {
      query.salaryMax = { $gte: Number(minSalary) };
    }

    if (maxSalary) {
      query.salaryMin = { $lte: Number(maxSalary) };
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'salary-high') {
      sortOptions = { salaryMax: -1 };
    } else if (sort === 'salary-low') {
      sortOptions = { salaryMin: 1 };
    } else if (sort === 'oldest') {
      sortOptions = { createdAt: 1 };
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .populate('companyId', 'name logoUrl location industry slug')
      .sort(sortOptions)
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
      message: 'Failed to fetch jobs',
      error: error.message,
    });
  }
};

export const getFeaturedJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ status: JOB_STATUS.ACTIVE })
      .populate('companyId', 'name logoUrl location industry slug')
      .sort({ createdAt: -1 })
      .limit(6);

    return res.status(200).json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch featured jobs',
      error: error.message,
    });
  }
};

export const getJobById = async (req, res) => {
  try {
    const { id } = req.params;
    let job;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      job = await Job.findById(id).populate('companyId');
    } else {
      job = await Job.findOne({ slug: id }).populate('companyId');
    }

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch job details',
      error: error.message,
    });
  }
};

export const getSimilarJobs = async (req, res) => {
  try {
    const { id } = req.params;
    const currentJob = await Job.findById(id);
    if (!currentJob) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    const similarJobs = await Job.find({
      _id: { $ne: currentJob._id },
      category: currentJob.category,
      status: JOB_STATUS.ACTIVE,
    })
      .populate('companyId', 'name logoUrl location industry')
      .limit(4);

    return res.status(200).json({
      success: true,
      data: similarJobs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch similar jobs',
      error: error.message,
    });
  }
};

export const getRecruiterJobs = async (req, res) => {
  try {
    const recruiterId = req.user._id;
    const jobs = await Job.find({ recruiterId })
      .populate('companyId', 'name logoUrl')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: jobs,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch recruiter jobs',
      error: error.message,
    });
  }
};

export const updateJob = async (req, res) => {
  try {
    const { id } = req.params;
    const recruiterId = req.user._id;

    const job = await Job.findOne({ _id: id, recruiterId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job post not found or unauthorized',
      });
    }

    const {
      title,
      category,
      jobType,
      salaryMin,
      salaryMax,
      currency,
      location,
      isRemote,
      deadline,
      responsibilities,
      requirements,
      benefits,
      status,
    } = req.body;

    if (title) job.title = title;
    if (category) job.category = category;
    if (jobType) job.jobType = jobType;
    if (salaryMin !== undefined) job.salaryMin = Number(salaryMin);
    if (salaryMax !== undefined) job.salaryMax = Number(salaryMax);
    if (currency) job.currency = currency;
    if (location) job.location = location;
    if (isRemote !== undefined) job.isRemote = Boolean(isRemote);
    if (deadline) job.deadline = new Date(deadline);
    if (responsibilities) job.responsibilities = responsibilities;
    if (requirements) job.requirements = requirements;
    if (benefits !== undefined) job.benefits = benefits;
    if (status && Object.values(JOB_STATUS).includes(status)) job.status = status;

    await job.save();

    return res.status(200).json({
      success: true,
      message: 'Job updated successfully',
      data: job,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update job post',
      error: error.message,
    });
  }
};

export const toggleJobStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const recruiterId = req.user._id;

    const job = await Job.findOne({ _id: id, recruiterId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job post not found or unauthorized',
      });
    }

    if (job.status === JOB_STATUS.ACTIVE) {
      job.status = JOB_STATUS.CLOSED;
      await job.save();
      return res.status(200).json({
        success: true,
        message: 'Job closed successfully',
        data: job,
      });
    } else {
      // Reopening check active job limit
      const subscription = await Subscription.findOne({ userId: recruiterId });
      const planKey = (subscription?.planType || 'free').toUpperCase();
      const planConfig = RECRUITER_PLANS[planKey] || RECRUITER_PLANS.FREE;
      const maxActiveJobs = planConfig.maxActiveJobs;

      const currentActiveJobs = await Job.countDocuments({
        recruiterId,
        status: JOB_STATUS.ACTIVE,
      });

      if (currentActiveJobs >= maxActiveJobs) {
        return res.status(403).json({
          success: false,
          message: `Active job limit of ${maxActiveJobs} reached for your ${planConfig.name} plan.`,
        });
      }

      job.status = JOB_STATUS.ACTIVE;
      await job.save();
      return res.status(200).json({
        success: true,
        message: 'Job reopened successfully',
        data: job,
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to toggle job status',
      error: error.message,
    });
  }
};

export const deleteJob = async (req, res) => {
  try {
    const { id } = req.params;
    const recruiterId = req.user._id;

    const job = await Job.findOneAndDelete({ _id: id, recruiterId });
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job post not found or unauthorized',
      });
    }

    // Clean up applications for this job
    await Application.deleteMany({ jobId: id });

    return res.status(200).json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete job post',
      error: error.message,
    });
  }
};

import { Company } from '../models/Company.model.js';
import { Job } from '../models/Job.model.js';
import { COMPANY_STATUS, JOB_STATUS } from '../constants/statuses.js';

export const registerCompany = async (req, res) => {
  try {
    const { name, industry, website, location, employeeCount, description, logoUrl } = req.body;

    const existingCompany = await Company.findOne({ recruiterId: req.user._id });
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'You have already registered a company.',
      });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const slugExists = await Company.findOne({ slug });
    const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug;

    const company = await Company.create({
      name,
      slug: finalSlug,
      industry,
      website: website || '',
      location: location || { city: '', country: '' },
      employeeCount: employeeCount || '1-10',
      description: description || '',
      logoUrl: logoUrl || '',
      status: COMPANY_STATUS.PENDING,
      recruiterId: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Company registered successfully. Waiting for admin approval.',
      data: company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to register company',
      error: error.message,
    });
  }
};

export const getMyCompany = async (req, res) => {
  try {
    const company = await Company.findOne({ recruiterId: req.user._id });
    return res.status(200).json({
      success: true,
      data: company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your company profile',
      error: error.message,
    });
  }
};

export const updateMyCompany = async (req, res) => {
  try {
    const { name, industry, website, location, employeeCount, description, logoUrl } = req.body;

    let company = await Company.findOne({ recruiterId: req.user._id });
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'No company found to update',
      });
    }

    if (name) company.name = name;
    if (industry) company.industry = industry;
    if (website !== undefined) company.website = website;
    if (location) company.location = { ...company.location, ...location };
    if (employeeCount) company.employeeCount = employeeCount;
    if (description !== undefined) company.description = description;
    if (logoUrl !== undefined) company.logoUrl = logoUrl;

    await company.save();

    return res.status(200).json({
      success: true,
      message: 'Company details updated successfully',
      data: company,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update company profile',
      error: error.message,
    });
  }
};

export const getAllCompanies = async (req, res) => {
  try {
    const { industry, search, page = 1, limit = 12 } = req.query;
    const query = { status: COMPANY_STATUS.APPROVED };

    if (industry && industry !== 'All') {
      query.industry = new RegExp(industry, 'i');
    }

    if (search) {
      query.name = new RegExp(search, 'i');
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Company.countDocuments(query);
    const companies = await Company.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Attach active job count for each company
    const companyIds = companies.map(c => c._id);
    const jobCounts = await Job.aggregate([
      { $match: { companyId: { $in: companyIds }, status: JOB_STATUS.ACTIVE } },
      { $group: { _id: '$companyId', count: { $sum: 1 } } }
    ]);

    const countMap = {};
    jobCounts.forEach(jc => {
      countMap[jc._id.toString()] = jc.count;
    });

    const formattedCompanies = companies.map(c => ({
      ...c.toObject(),
      openJobsCount: countMap[c._id.toString()] || 0,
    }));

    return res.status(200).json({
      success: true,
      data: formattedCompanies,
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
      message: 'Failed to fetch companies',
      error: error.message,
    });
  }
};

export const getCompanyById = async (req, res) => {
  try {
    const { id } = req.params;
    let company;
    
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      company = await Company.findById(id);
    } else {
      company = await Company.findOne({ slug: id });
    }

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found',
      });
    }

    const openJobs = await Job.find({ companyId: company._id, status: JOB_STATUS.ACTIVE }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: {
        ...company.toObject(),
        openJobs,
        openJobsCount: openJobs.length,
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch company profile',
      error: error.message,
    });
  }
};

export const uploadCompanyLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No logo image uploaded',
      });
    }

    const logoUrl = `/uploads/images/${req.file.filename}`;
    const company = await Company.findOneAndUpdate(
      { recruiterId: req.user._id },
      { logoUrl },
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Company logo uploaded successfully',
      data: { logoUrl, company },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Logo upload failed',
      error: error.message,
    });
  }
};

import { Job } from '../models/Job.model.js';
import { Company } from '../models/Company.model.js';
import { JOB_CATEGORIES, JOB_TYPES, JOB_STATUS, COMPANY_STATUS } from '../constants/statuses.js';

export const getAutocompleteSuggestions = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(200).json({ success: true, data: { jobs: [], companies: [] } });
    }

    const regex = new RegExp(q.trim(), 'i');

    const [jobs, companies] = await Promise.all([
      Job.find({ status: JOB_STATUS.ACTIVE, title: regex })
        .select('title slug location category')
        .limit(6),
      Company.find({ status: COMPANY_STATUS.APPROVED, name: regex })
        .select('name slug logoUrl industry')
        .limit(4),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        jobs,
        companies,
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch autocomplete suggestions',
      error: error.message,
    });
  }
};

export const getFilterOptions = async (req, res) => {
  try {
    const [locations, industries] = await Promise.all([
      Job.distinct('location.city', { status: JOB_STATUS.ACTIVE }),
      Company.distinct('industry', { status: COMPANY_STATUS.APPROVED }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        categories: JOB_CATEGORIES,
        jobTypes: JOB_TYPES,
        locations: locations.filter(Boolean),
        industries: industries.filter(Boolean),
        salaryRanges: [
          { label: 'Under $40k', min: 0, max: 40000 },
          { label: '$40k - $80k', min: 40000, max: 80000 },
          { label: '$80k - $120k', min: 80000, max: 120000 },
          { label: '$120k - $180k', min: 120000, max: 180000 },
          { label: '$180k+', min: 180000, max: 1000000 },
        ]
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch filter options',
      error: error.message,
    });
  }
};

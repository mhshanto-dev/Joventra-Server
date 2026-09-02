export const SEEKER_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'forever',
    maxApplicationsPerMonth: 3,
    maxSavedJobs: 10,
    features: [
      'Browse & save up to 10 jobs',
      'Apply to up to 3 jobs per month',
      'Basic profile',
      'Email alerts'
    ]
  },
  PRO: {
    id: 'pro',
    name: 'Pro',
    price: 19,
    interval: 'month',
    maxApplicationsPerMonth: 30,
    maxSavedJobs: Infinity,
    features: [
      'Apply to up to 30 jobs per month',
      'Unlimited saved jobs',
      'Application tracking',
      'Salary insights'
    ]
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 39,
    interval: 'month',
    maxApplicationsPerMonth: Infinity,
    maxSavedJobs: Infinity,
    features: [
      'Unlimited applications',
      'Profile boost to recruiters',
      'Early access to new jobs',
      'Priority support'
    ]
  }
};

export const RECRUITER_PLANS = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'forever',
    maxActiveJobs: 3,
    analytics: 'basic',
    features: [
      'Up to 3 active job posts',
      'Basic applicant management',
      'Standard listing visibility'
    ]
  },
  GROWTH: {
    id: 'growth',
    name: 'Growth',
    price: 49,
    interval: 'month',
    maxActiveJobs: 10,
    analytics: 'standard',
    features: [
      'Up to 10 active job posts',
      'Applicant tracking',
      'Basic analytics',
      'Email support'
    ]
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 149,
    interval: 'month',
    maxActiveJobs: 50,
    analytics: 'advanced',
    features: [
      'Up to 50 active job posts',
      'Advanced analytics dashboard',
      'Featured job listings',
      'Team collaboration',
      'Custom branding',
      'Priority support'
    ]
  }
};

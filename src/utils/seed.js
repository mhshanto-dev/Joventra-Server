import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { ENV } from '../config/env.js';
import { User } from '../models/User.model.js';
import { SeekerProfile } from '../models/SeekerProfile.model.js';
import { Company } from '../models/Company.model.js';
import { Job } from '../models/Job.model.js';
import { Application } from '../models/Application.model.js';
import { Subscription } from '../models/Subscription.model.js';
import { Payment } from '../models/Payment.model.js';
import { ROLES } from '../constants/roles.js';
import { COMPANY_STATUS, APPLICATION_STATUS, JOB_STATUS } from '../constants/statuses.js';

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('[Seed] Connected successfully.');

    console.log('[Seed] Cleaning existing data...');
    await Promise.all([
      User.deleteMany({}),
      SeekerProfile.deleteMany({}),
      Company.deleteMany({}),
      Job.deleteMany({}),
      Application.deleteMany({}),
      Subscription.deleteMany({}),
      Payment.deleteMany({}),
    ]);

    console.log('[Seed] Creating Admin account...');
    const admin = await User.create({
      name: 'System Admin',
      email: ENV.ADMIN_EMAIL,
      password: ENV.ADMIN_PASSWORD, // Will be hashed by pre-save hook
      role: ROLES.ADMIN,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    });

    console.log('[Seed] Creating Recruiters & Companies...');
    const recruitersData = [
      {
        name: 'Sarah Jenkins',
        email: 'sarah@techcorp.io',
        companyName: 'TechCorp Solutions',
        slug: 'techcorp-solutions',
        industry: 'Developer Tools',
        website: 'https://techcorp.io',
        location: { city: 'San Francisco', country: 'United States' },
        employeeCount: '50-200',
        logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
        description: 'TechCorp builds next-generation cloud developer infrastructure and deployment tooling used by millions of engineers worldwide.',
      },
      {
        name: 'Marcus Vance',
        email: 'marcus@finflow.co',
        companyName: 'FinFlow Technologies',
        slug: 'finflow-technologies',
        industry: 'Fintech',
        website: 'https://finflow.co',
        location: { city: 'New York', country: 'United States' },
        employeeCount: '201-500',
        logoUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=150',
        description: 'FinFlow is modernizing global payments and treasury workflows with real-time settlement APIs and borderless banking.',
      },
      {
        name: 'Elena Rostova',
        email: 'elena@cloudai.dev',
        companyName: 'CloudAI Labs',
        slug: 'cloudai-labs',
        industry: 'AI',
        website: 'https://cloudai.dev',
        location: { city: 'London', country: 'United Kingdom' },
        employeeCount: '11-50',
        logoUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150',
        description: 'CloudAI develops multimodal foundational agents and specialized neural inference systems for enterprises.',
      },
    ];

    const createdRecruiters = [];
    const createdCompanies = [];

    for (const r of recruitersData) {
      const recruiterUser = await User.create({
        name: r.name,
        email: r.email,
        password: 'password123',
        role: ROLES.RECRUITER,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.name}`,
      });

      const company = await Company.create({
        name: r.companyName,
        slug: r.slug,
        industry: r.industry,
        website: r.website,
        location: r.location,
        employeeCount: r.employeeCount,
        logoUrl: r.logoUrl,
        description: r.description,
        status: COMPANY_STATUS.APPROVED,
        recruiterId: recruiterUser._id,
      });

      await Subscription.create({
        userId: recruiterUser._id,
        userRole: ROLES.RECRUITER,
        planType: 'growth',
        status: 'active',
      });

      createdRecruiters.push(recruiterUser);
      createdCompanies.push(company);
    }

    console.log('[Seed] Creating Job Postings...');
    const jobsData = [
      {
        companyIndex: 0,
        title: 'Senior Full Stack Engineer (React & Node.js)',
        category: 'Technology & Engineering',
        jobType: 'Full-time',
        salaryMin: 130000,
        salaryMax: 175000,
        currency: 'USD',
        location: { city: 'San Francisco', country: 'United States' },
        isRemote: true,
        deadline: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000),
        responsibilities: '• Architect and build high-performance web applications using React, Next.js, and Node.js.\n• Collaborate with product managers and designers to deliver customer-facing features.\n• Optimize database queries and API response times across distributed microservices.',
        requirements: '• 5+ years of production experience with TypeScript, React, and Node.js.\n• Strong grasp of SQL and NoSQL database modeling.\n• Experience with AWS, Docker, and CI/CD automation pipelines.',
        benefits: '• Competitive salary and equity grants\n• Unlimited PTO and remote work stipend\n• Comprehensive health, dental, and vision insurance',
      },
      {
        companyIndex: 0,
        title: 'DevOps & Cloud Infrastructure Architect',
        category: 'Technology & Engineering',
        jobType: 'Full-time',
        salaryMin: 145000,
        salaryMax: 190000,
        currency: 'USD',
        location: { city: 'San Francisco', country: 'United States' },
        isRemote: true,
        deadline: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
        responsibilities: '• Design resilient Kubernetes clusters and Terraform infrastructure modules.\n• Maintain 99.99% system availability and implement zero-downtime deployment strategies.\n• Implement automated security scanning and compliance checks.',
        requirements: '• Strong expertise with Kubernetes, Terraform, and AWS/GCP.\n• Deep knowledge of monitoring tools (Prometheus, Grafana, Datadog).\n• Proven experience managing multi-region cloud environments.',
        benefits: '• 401(k) matching up to 6%\n• Annual wellness and education budget\n• Flexible working hours',
      },
      {
        companyIndex: 1,
        title: 'Lead Product Designer (UI/UX)',
        category: 'Design & Creative',
        jobType: 'Full-time',
        salaryMin: 110000,
        salaryMax: 150000,
        currency: 'USD',
        location: { city: 'New York', country: 'United States' },
        isRemote: false,
        deadline: new Date(Date.now() + 18 * 24 * 60 * 60 * 1000),
        responsibilities: '• Lead end-to-end design strategy for core financial dashboards and onboarding flows.\n• Create high-fidelity Figma prototypes and user testing workflows.\n• Expand and maintain the multi-platform design system.',
        requirements: '• 4+ years of UX/UI design experience in B2B SaaS or Fintech.\n• Mastery of Figma, design systems, and rapid prototyping.\n• Outstanding portfolio demonstrating user-centric problem solving.',
        benefits: '• Commuter benefits and catered lunches\n• Top-tier health insurance\n• Generous parental leave',
      },
      {
        companyIndex: 1,
        title: 'Senior Backend Engineer (Golang & Distributed Systems)',
        category: 'Technology & Engineering',
        jobType: 'Full-time',
        salaryMin: 140000,
        salaryMax: 185000,
        currency: 'USD',
        location: { city: 'New York', country: 'United States' },
        isRemote: true,
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        responsibilities: '• Build high-throughput financial transaction processing engines.\n• Ensure idempotent payment execution and data integrity across banking rails.\n• Collaborate on system design and low-latency microservices.',
        requirements: '• 4+ years experience with Go or Java high-concurrency systems.\n• Deep understanding of distributed transactions, Kafka, and PostgreSQL.\n• Experience in fintech or regulated industries is a huge plus.',
        benefits: '• Performance bonuses\n• Home office setup stipend\n• Stock options',
      },
      {
        companyIndex: 2,
        title: 'AI Research Scientist (Multimodal LLMs)',
        category: 'Technology & Engineering',
        jobType: 'Full-time',
        salaryMin: 160000,
        salaryMax: 220000,
        currency: 'USD',
        location: { city: 'London', country: 'United Kingdom' },
        isRemote: true,
        deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
        responsibilities: '• Research and fine-tune transformer models for vision-language tasks.\n• Publish novel algorithmic advances and collaborate with engineering teams.\n• Optimize model inference efficiency for edge and server workloads.',
        requirements: '• Ph.D. or Master\'s degree in Computer Science, Machine Learning, or related field.\n• Strong publication record in NeurIPS, ICML, CVPR, or ICLR.\n• Proficiency with PyTorch, CUDA, and distributed training setups.',
        benefits: '• Dedicated GPU cluster access\n• International conference travel budget\n• Highly competitive compensation and equity',
      },
      {
        companyIndex: 2,
        title: 'Growth Marketing Manager',
        category: 'Sales & Marketing',
        jobType: 'Full-time',
        salaryMin: 85000,
        salaryMax: 120000,
        currency: 'USD',
        location: { city: 'London', country: 'United Kingdom' },
        isRemote: true,
        deadline: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        responsibilities: '• Drive user acquisition across search, paid social, and content channels.\n• Formulate conversion rate optimization (CRO) experiments for landing pages.\n• Analyze funnel drop-offs using Mixpanel and Google Analytics 4.',
        requirements: '• 3+ years experience in B2B SaaS growth or performance marketing.\n• Data-driven mindset with proficiency in SQL and analytics suites.\n• Excellent copy crafting and campaign management skills.',
        benefits: '• Flexible hybrid setup\n• Quarterly performance bonuses\n• Learning stipend',
      },
    ];

    const createdJobs = [];
    for (const j of jobsData) {
      const company = createdCompanies[j.companyIndex];
      const recruiter = createdRecruiters[j.companyIndex];
      const slug = `${j.title.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-')}-${Date.now().toString().slice(-4)}`;

      const job = await Job.create({
        title: j.title,
        slug,
        companyId: company._id,
        recruiterId: recruiter._id,
        category: j.category,
        jobType: j.jobType,
        salaryMin: j.salaryMin,
        salaryMax: j.salaryMax,
        currency: j.currency,
        location: j.location,
        isRemote: j.isRemote,
        deadline: j.deadline,
        responsibilities: j.responsibilities,
        requirements: j.requirements,
        benefits: j.benefits,
        status: JOB_STATUS.ACTIVE,
      });

      createdJobs.push(job);
    }

    console.log('[Seed] Creating Seekers & Profiles...');
    const seekersData = [
      {
        name: 'Alex Johnson',
        email: 'alex@example.com',
        headline: 'Senior Full Stack Engineer | React, Node.js, TypeScript',
        bio: 'Passionate software engineer with 6 years of experience building responsive, accessible web applications and distributed backend services.',
        skills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'Tailwind CSS', 'MongoDB', 'Docker', 'AWS'],
      },
      {
        name: 'Sophia Chen',
        email: 'sophia@example.com',
        headline: 'Product Designer (UX/UI) & Design Systems Specialist',
        bio: 'Crafting intuitive digital experiences with a focus on simplicity, user research, and scalable design systems.',
        skills: ['Figma', 'UI Design', 'User Research', 'Design Systems', 'Prototyping', 'Wireframing'],
      },
      {
        name: 'David Miller',
        email: 'david@example.com',
        headline: 'AI & Data Engineer | PyTorch, Python, LLMs',
        bio: 'Machine learning practitioner specializing in NLP and automated inference systems.',
        skills: ['Python', 'PyTorch', 'FastAPI', 'Machine Learning', 'Transformers', 'PostgreSQL'],
      },
    ];

    const createdSeekers = [];
    for (const s of seekersData) {
      const seekerUser = await User.create({
        name: s.name,
        email: s.email,
        password: 'password123',
        role: ROLES.SEEKER,
        avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.name}`,
      });

      await SeekerProfile.create({
        userId: seekerUser._id,
        headline: s.headline,
        bio: s.bio,
        skills: s.skills,
        savedJobs: [createdJobs[0]._id, createdJobs[2]._id],
      });

      await Subscription.create({
        userId: seekerUser._id,
        userRole: ROLES.SEEKER,
        planType: 'pro',
        status: 'active',
        applicationsUsedThisMonth: 2,
      });

      createdSeekers.push(seekerUser);
    }

    console.log('[Seed] Creating Sample Applications...');
    const applicationsData = [
      {
        seekerIndex: 0,
        jobIndex: 0,
        status: APPLICATION_STATUS.SHORTLISTED,
        coverLetter: 'I have 6+ years of production experience working with React and Node.js microservices. I would love to bring my technical expertise to TechCorp.',
      },
      {
        seekerIndex: 0,
        jobIndex: 3,
        status: APPLICATION_STATUS.UNDER_REVIEW,
        coverLetter: 'I am excited about FinFlow’s vision for borderless financial infrastructure.',
      },
      {
        seekerIndex: 1,
        jobIndex: 2,
        status: APPLICATION_STATUS.OFFERED,
        coverLetter: 'My background in B2B design systems matches your design requirements perfectly.',
      },
      {
        seekerIndex: 2,
        jobIndex: 4,
        status: APPLICATION_STATUS.APPLIED,
        coverLetter: 'I have researched multimodal transformer architectures and would love to contribute to CloudAI Labs.',
      },
    ];

    for (const app of applicationsData) {
      const seeker = createdSeekers[app.seekerIndex];
      const job = createdJobs[app.jobIndex];
      const company = createdCompanies[jobsData[app.jobIndex].companyIndex];

      await Application.create({
        seekerId: seeker._id,
        jobId: job._id,
        companyId: company._id,
        coverLetter: app.coverLetter,
        resumeUrl: '',
        status: app.status,
      });

      await Job.findByIdAndUpdate(job._id, { $inc: { applicationCount: 1 } });
    }

    console.log('[Seed] Creating Initial Payment Records...');
    await Payment.create([
      {
        userId: createdRecruiters[0]._id,
        amount: 49,
        currency: 'USD',
        plan: 'Growth (Recruiter)',
        transactionId: 'txn_mock_seed_101',
        status: 'succeeded',
        paidAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        userId: createdRecruiters[1]._id,
        amount: 149,
        currency: 'USD',
        plan: 'Enterprise (Recruiter)',
        transactionId: 'txn_mock_seed_102',
        status: 'succeeded',
        paidAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      },
      {
        userId: createdSeekers[0]._id,
        amount: 19,
        currency: 'USD',
        plan: 'Pro (Seeker)',
        transactionId: 'txn_mock_seed_103',
        status: 'succeeded',
        paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ]);

    console.log('\n========================================');
    console.log('🎉 [Seed] Database successfully populated!');
    console.log('========================================');
    console.log('🔑 TEST ACCOUNTS:');
    console.log('----------------------------------------');
    console.log('• Admin:     admin@joventra.com    / admin123');
    console.log('• Recruiter: sarah@techcorp.io     / password123');
    console.log('• Recruiter: marcus@finflow.co     / password123');
    console.log('• Seeker:    alex@example.com      / password123');
    console.log('• Seeker:    sophia@example.com    / password123');
    console.log('========================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error]:', error);
    process.exit(1);
  }
};

seedDatabase();


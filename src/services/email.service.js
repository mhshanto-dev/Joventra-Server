import { transporter } from '../config/email.js';
import { ENV } from '../config/env.js';

export const sendWelcomeEmail = async (user) => {
  try {
    const roleText = user.role === 'recruiter' ? 'Recruiter' : 'Job Seeker';
    await transporter.sendMail({
      from: `"HireLoop" <${ENV.SMTP_USER || 'no-reply@hireloop.com'}>`,
      to: user.email,
      subject: `Welcome to HireLoop, ${user.name}! 🚀`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #2563eb;">Welcome to HireLoop!</h2>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Your account as a <strong>${roleText}</strong> has been successfully created.</p>
          <p>${user.role === 'recruiter' 
            ? 'You can now register your company profile and start posting jobs.' 
            : 'You can now browse thousands of open opportunities and apply with one click.'}</p>
          <div style="margin: 30px 0;">
            <a href="${ENV.CLIENT_URL}/login" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Dashboard</a>
          </div>
          <p style="color: #64748b; font-size: 13px;">The HireLoop Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('[Email Error] Failed to send welcome email:', error.message);
  }
};

export const sendApplicationConfirmationEmail = async ({ seeker, job, company }) => {
  try {
    await transporter.sendMail({
      from: `"HireLoop" <${ENV.SMTP_USER || 'no-reply@hireloop.com'}>`,
      to: seeker.email,
      subject: `Application Received: ${job.title} at ${company.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #2563eb;">Application Confirmed!</h2>
          <p>Hi <strong>${seeker.name}</strong>,</p>
          <p>Your application for <strong>${job.title}</strong> at <strong>${company.name}</strong> has been received successfully.</p>
          <p>The recruiting team will review your credentials and you will be notified of any status changes right here on HireLoop.</p>
          <div style="margin: 25px 0;">
            <a href="${ENV.CLIENT_URL}/dashboard/seeker/applications" style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Track Application</a>
          </div>
          <p style="color: #64748b; font-size: 13px;">Good luck with your job search!<br/>The HireLoop Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('[Email Error] Failed to send application confirmation email:', error.message);
  }
};

export const sendStatusUpdateEmail = async ({ seeker, job, company, status }) => {
  try {
    const formattedStatus = status.replace('_', ' ').toUpperCase();
    let statusMessage = '';

    switch (status) {
      case 'under_review':
        statusMessage = `Your application is now <strong>Under Review</strong> by the hiring team at ${company.name}.`;
        break;
      case 'shortlisted':
        statusMessage = `🎉 Congratulations! You have been <strong>Shortlisted</strong> for the position of <strong>${job.title}</strong> at ${company.name}. The recruiter will reach out regarding next steps.`;
        break;
      case 'offered':
        statusMessage = `🌟 Congratulations! You have received a job <strong>Offer</strong> for <strong>${job.title}</strong> at ${company.name}!`;
        break;
      case 'rejected':
        statusMessage = `Thank you for your interest in the <strong>${job.title}</strong> position at ${company.name}. After careful review, they have decided to move forward with other candidates at this time.`;
        break;
      default:
        statusMessage = `Your application status has been updated to: <strong>${formattedStatus}</strong>.`;
    }

    await transporter.sendMail({
      from: `"HireLoop Updates" <${ENV.SMTP_USER || 'no-reply@hireloop.com'}>`,
      to: seeker.email,
      subject: `Status Update: ${job.title} (${formattedStatus})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a;">Application Status Update</h2>
          <p>Hi <strong>${seeker.name}</strong>,</p>
          <p>${statusMessage}</p>
          <div style="margin: 25px 0;">
            <a href="${ENV.CLIENT_URL}/dashboard/seeker/applications" style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Details</a>
          </div>
          <p style="color: #64748b; font-size: 13px;">The HireLoop Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('[Email Error] Failed to send status update email:', error.message);
  }
};

export const sendCompanyApprovalEmail = async ({ recruiter, company, isApproved }) => {
  try {
    const statusText = isApproved ? 'Approved ✅' : 'Declined ❌';
    await transporter.sendMail({
      from: `"HireLoop Team" <${ENV.SMTP_USER || 'no-reply@hireloop.com'}>`,
      to: recruiter.email,
      subject: `Company Verification Update: ${company.name} (${statusText})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: ${isApproved ? '#16a34a' : '#dc2626'};">${isApproved ? 'Company Approved!' : 'Company Registration Notice'}</h2>
          <p>Hi <strong>${recruiter.name}</strong>,</p>
          <p>${isApproved 
            ? `Your company profile for <strong>${company.name}</strong> has been verified and approved by the HireLoop administration. You can now post jobs and start receiving candidate applications.` 
            : `Your company profile for <strong>${company.name}</strong> has been reviewed and declined. Please review your company information or contact support for clarification.`}</p>
          <div style="margin: 25px 0;">
            <a href="${ENV.CLIENT_URL}/dashboard/recruiter/company" style="background-color: #2563eb; color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">Go to Company Dashboard</a>
          </div>
          <p style="color: #64748b; font-size: 13px;">The HireLoop Team</p>
        </div>
      `,
    });
  } catch (error) {
    console.error('[Email Error] Failed to send company approval email:', error.message);
  }
};

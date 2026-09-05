import { User } from '../models/User.model.js';
import { SeekerProfile } from '../models/SeekerProfile.model.js';
import bcrypt from 'bcryptjs';

export const updateProfile = async (req, res) => {
  try {
    const { name, email, avatarUrl, currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (name) user.name = name;
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'This email is already in use by another account.',
        });
      }
      user.email = email.toLowerCase();
    }

    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: 'Current password is required to change password.',
        });
      }
      const isMatch = await user.comparePassword(currentPassword);
      if (!isMatch) {
        return res.status(400).json({
          success: false,
          message: 'Current password does not match.',
        });
      }
      user.password = newPassword;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message,
    });
  }
};

export const getSeekerProfile = async (req, res) => {
  try {
    let profile = await SeekerProfile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = await SeekerProfile.create({ userId: req.user._id });
    }

    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch seeker profile',
      error: error.message,
    });
  }
};

export const updateSeekerProfile = async (req, res) => {
  try {
    const { headline, bio, skills, socialLinks } = req.body;

    let profile = await SeekerProfile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = new SeekerProfile({ userId: req.user._id });
    }

    if (headline !== undefined) profile.headline = headline;
    if (bio !== undefined) profile.bio = bio;
    if (skills !== undefined) profile.skills = Array.isArray(skills) ? skills : skills.split(',').map(s => s.trim()).filter(Boolean);
    if (socialLinks !== undefined) profile.socialLinks = { ...profile.socialLinks, ...socialLinks };

    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Seeker profile updated successfully',
      data: profile,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update seeker profile',
      error: error.message,
    });
  }
};

export const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No PDF resume uploaded',
      });
    }

    // multer-storage-cloudinary provides the secure URL in req.file.path
    const resumeUrl = req.file.path;
    const resumeOriginalName = req.file.originalname;

    let profile = await SeekerProfile.findOne({ userId: req.user._id });
    if (!profile) {
      profile = new SeekerProfile({ userId: req.user._id });
    }

    profile.resumeUrl = resumeUrl;
    profile.resumeOriginalName = resumeOriginalName;
    await profile.save();

    return res.status(200).json({
      success: true,
      message: 'Resume uploaded successfully',
      data: {
        resumeUrl,
        resumeOriginalName,
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Resume upload failed',
      error: error.message,
    });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image uploaded',
      });
    }

    // multer-storage-cloudinary provides the secure URL in req.file.path
    const avatarUrl = req.file.path;
    await User.findByIdAndUpdate(req.user._id, { avatarUrl });

    return res.status(200).json({
      success: true,
      message: 'Avatar updated successfully',
      data: { avatarUrl },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Avatar upload failed',
      error: error.message,
    });
  }
};

import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { connectToDatabase } from './_lib/db.js';
import { User, Profile } from './_lib/models.js';
import { signToken, createAuthCookie, authenticate } from './_lib/auth.js';
import { sendJson, sendError, parseAndValidate } from './_lib/utils.js';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

export default async function handler(req, res) {
  try {
    await connectToDatabase();
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const action = url.searchParams.get('action') || (req.body && req.body.action);

    // 1. GET Current User / Me
    if (req.method === 'GET' || action === 'me') {
      const user = await authenticate(req);
      if (!user) {
        return sendError(res, 401, 'Not authenticated');
      }

      const profile = await Profile.findOne({ userId: user._id });
      return sendJson(res, 200, {
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          badges: user.badges || []
        },
        profile
      });
    }

    // 2. POST Register
    if (req.method === 'POST' && action === 'register') {
      const { name, email, password } = await parseAndValidate(req, registerSchema);

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return sendError(res, 400, 'An account with this email already exists.');
      }

      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      const newUser = await User.create({
        name,
        email: email.toLowerCase(),
        passwordHash,
        badges: [{ id: 'first_step', earnedAt: new Date() }]
      });

      // Create default Profile with exam date 6 months ahead
      const defaultExamDate = new Date();
      defaultExamDate.setMonth(defaultExamDate.getMonth() + 5);

      const newProfile = await Profile.create({
        userId: newUser._id,
        examDate: defaultExamDate,
        targetScore: 350,
        weekdayHours: 4,
        weekendHours: 6,
        isSetupCompleted: false,
        subjectStrengths: {
          pharmaceutics: 'medium',
          pharmacology: 'weak',
          chemistry: 'weak',
          pharmacognosy: 'medium',
          other: 'strong'
        }
      });

      const token = signToken(newUser);
      const cookieHeader = createAuthCookie(token);

      return sendJson(
        res,
        201,
        {
          success: true,
          message: 'Account created successfully',
          user: {
            id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            badges: newUser.badges
          },
          profile: newProfile,
          token
        },
        { 'Set-Cookie': cookieHeader }
      );
    }

    // 3. POST Login
    if (req.method === 'POST' && action === 'login') {
      const { email, password } = await parseAndValidate(req, loginSchema);

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return sendError(res, 401, 'Invalid email or password.');
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        return sendError(res, 401, 'Invalid email or password.');
      }

      const profile = await Profile.findOne({ userId: user._id });
      const token = signToken(user);
      const cookieHeader = createAuthCookie(token);

      return sendJson(
        res,
        200,
        {
          success: true,
          message: 'Welcome back!',
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
            badges: user.badges || []
          },
          profile,
          token
        },
        { 'Set-Cookie': cookieHeader }
      );
    }

    // 4. POST Logout
    if (req.method === 'POST' && action === 'logout') {
      const cookieHeader = createAuthCookie('', true);
      return sendJson(
        res,
        200,
        { success: true, message: 'Logged out successfully' },
        { 'Set-Cookie': cookieHeader }
      );
    }

    return sendError(res, 405, 'Method or action not allowed');
  } catch (error) {
    return sendError(res, error.status || 500, error.message || 'Server error during authentication');
  }
}


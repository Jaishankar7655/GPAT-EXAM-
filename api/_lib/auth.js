import 'dotenv/config';
import jwt from 'jsonwebtoken';
import * as cookie from 'cookie';
import { User } from './models.js';
import { connectToDatabase } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'gpat_prep_secret_jwt_key_2026_super_secure_random_hash';
const COOKIE_NAME = 'gpat_token';

/**
 * Sign a JWT token for a user
 */
export function signToken(user) {
  return jwt.sign(
    { userId: user._id.toString(), email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

/**
 * Serialize JWT into an httpOnly cookie string
 */
export function createAuthCookie(token, isLogout = false) {
  return cookie.serialize(COOKIE_NAME, isLogout ? '' : token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: isLogout ? 0 : 30 * 24 * 60 * 60 // 30 days
  });
}

/**
 * Authenticate incoming request via cookie or Authorization header
 * Returns user document or null
 */
export async function authenticate(req) {
  try {
    let token = null;

    // 1. Check Cookie
    if (req.headers.cookie) {
      const parsedCookies = cookie.parse(req.headers.cookie);
      if (parsedCookies[COOKIE_NAME]) {
        token = parsedCookies[COOKIE_NAME];
      }
    }

    // 2. Check Authorization Header (Bearer ...)
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return null;
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.userId) {
      return null;
    }

    await connectToDatabase();
    const user = await User.findById(decoded.userId).select('-passwordHash');
    return user;
  } catch (err) {
    return null;
  }
}


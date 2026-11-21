import { z } from 'zod';

/**
 * Return today's date formatted as YYYY-MM-DD in local/IST timezone
 */
export function getTodayDateString(offsetDays = 0) {
  const d = new Date();
  if (offsetDays !== 0) {
    d.setDate(d.getDate() + offsetDays);
  }
  // Format as YYYY-MM-DD
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Safe JSON response helper for Vercel Serverless Functions
 */
export function sendJson(res, statusCode, data, headers = {}) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
  res.end(JSON.stringify(data));
}

/**
 * Safe error response
 */
export function sendError(res, statusCode, message, errors = null) {
  return sendJson(res, statusCode, {
    success: false,
    message,
    errors
  });
}

/**
 * Parse and validate request body with Zod schema
 */
export async function parseAndValidate(req, schema) {
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      throw new Error('Invalid JSON payload');
    }
  } else if (!body) {
    // When running under raw node/vite dev middleware
    body = await new Promise((resolve) => {
      let data = '';
      req.on('data', (chunk) => {
        data += chunk;
      });
      req.on('end', () => {
        try {
          resolve(data ? JSON.parse(data) : {});
        } catch {
          resolve({});
        }
      });
    });
  }

  const result = schema.safeParse(body);
  if (!result.success) {
    const errorDetails = result.error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
    const err = new Error(errorDetails);
    err.status = 400;
    err.details = result.error.issues;
    throw err;
  }
  return result.data;
}

/**
 * Check if today is a weekend
 */
export function isWeekend(dateStr = getTodayDateString()) {
  const d = new Date(dateStr);
  const day = d.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}


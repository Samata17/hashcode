import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError.js';

// Runs after express-validator rules. If any rule failed, respond with 400
// and a list like [{ field: "email", message: "Please enter a valid email." }].
export function validate(req, _res, next) {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    const details = result.array().map((e) => ({ field: e.path, message: e.msg }));
    throw new ApiError(400, details[0].message, details);
  }
  next();
}

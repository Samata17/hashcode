// Handles requests to URLs that don't exist.
export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

// Central place that turns any thrown error into a clean JSON response.
// Express 5 automatically sends errors from async functions here.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let status = err.statusCode || 500;
  let message = err.message || 'Something went wrong.';
  let details = err.details;

  // Mongoose: a field failed schema validation
  if (err.name === 'ValidationError') {
    status = 400;
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = details[0]?.message || 'Invalid data.';
  }

  // Mongoose: an id in the URL is not a valid ObjectId
  if (err.name === 'CastError') {
    status = 400;
    message = `Invalid ${err.path}.`;
  }

  // MongoDB: unique field already exists (e.g. email)
  if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `That ${field} is already in use.`;
  }

  // Bad JSON in the request body
  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Request body is not valid JSON.';
  }

  if (status >= 500) {
    console.error(err);
    // Don't leak internal error details to users in production.
    if (process.env.NODE_ENV === 'production') message = 'Something went wrong on our side.';
  }

  res.status(status).json({ message, ...(details ? { errors: details } : {}) });
}

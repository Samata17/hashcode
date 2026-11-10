// A normal Error that also carries an HTTP status code (e.g. 400, 401, 404).
// Throw it anywhere in a controller and the error handler turns it into a JSON response.
export class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.details = details; // optional: e.g. a list of validation errors
  }
}

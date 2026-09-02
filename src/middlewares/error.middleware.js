import { ENV } from '../config/env.js';

export const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  let error = { ...err };
  error.message = err.message;
  error.name = err.name;

  // Handle Mongoose Bad ObjectId
  if (err.name === 'CastError') {
    error.message = `Resource not found with id: ${err.value}`;
    error.statusCode = 404;
  }

  // Handle Mongoose Duplicate Key (11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    error.message = `Duplicate value entered for ${field}. Please use another value.`;
    error.statusCode = 400;
  }

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error.message = `Invalid input data: ${messages.join('. ')}`;
    error.statusCode = 400;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid authentication token. Please log in again.';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Authentication token has expired. Please log in again.';
    error.statusCode = 401;
  }

  return res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal Server Error',
    ...(ENV.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

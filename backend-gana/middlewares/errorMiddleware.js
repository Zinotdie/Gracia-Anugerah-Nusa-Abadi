// Global Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  console.error("Global API Error Log:", err);
  const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Terjadi kesalahan internal pada server backend.",
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = { errorHandler };

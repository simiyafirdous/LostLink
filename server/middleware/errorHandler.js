const notFound = (req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });

const errorHandler = (error, req, res, next) => {
  console.error(error);
  if (error.name === "ValidationError") return res.status(400).json({ message: Object.values(error.errors).map((entry) => entry.message).join(", ") });
  if (error.code === 11000) return res.status(400).json({ message: "A record with this value already exists." });
  if (error.name === "MulterError") return res.status(400).json({ message: error.message });
  res.status(error.statusCode || 500).json({ message: error.message || "Something went wrong." });
};

module.exports = { notFound, errorHandler };

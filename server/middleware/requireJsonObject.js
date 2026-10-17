const requireJsonObject = (req, res, next) => {
  if (
    req.body !== null &&
    typeof req.body === "object" &&
    !Array.isArray(req.body)
  ) {
    return next();
  }

  return res.status(400).json({
    message: "Request body must be a JSON object",
  });
};

module.exports = { requireJsonObject };

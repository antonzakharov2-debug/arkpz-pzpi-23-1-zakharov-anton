module.exports = (req, res, next) => {
  // очікуємо user.role в req.user (JWT або інший спосіб авторизації)
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admin access required" });
};

import jwt from"jsonwebtoken";

const SECRET = 'biomercados-app-api';
const secret = process.env.TOKEN_KEY || SECRET;

const verifyToken = (req, res, next) => {
  const token =
    req.body.refresh_token || req.query.token || req.headers["x-access-token"];

  if (!token) {
    return res.status(403).json("A token is required for authentication");
  }
  try {
    const decoded = jwt.verify(token, secret);
    req.userId = decoded.id;
  } catch (err) {
    return res.status(401).json("Invalid Token");
  }
  return next();
};

module.exports = verifyToken;
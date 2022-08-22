const jwt = require("jsonwebtoken");
const { stream } = require("npmlog");

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization;
    const split_token = token.split(" ");
    const decode = jwt.verify(
      split_token[1],
      process.env.TOKEN_KEY
    );
    console.log(decode, "decode");
    (req.user_id = decode.user_id), (req.email = decode.email), next();
  } catch {
    res.status(401).json({
      staus: false,
      message: "Not authorized to access this route",
    });
  }
};

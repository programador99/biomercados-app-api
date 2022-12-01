import randtoken from 'rand-token';
import jwt from "jsonwebtoken"

const secret = process.env.TOKEN_KEY;

const generateToken = (numberOfCharacters) => {
  return randtoken.generate(numberOfCharacters)
}

const generateJWT = (user) => {
  return jwt.sign({ id: user._id }, secret, {
    expiresIn: 86400
  })  
}
const generateRefreshJWT = (user) => {
  return jwt.sign({ id: user._id }, secret, {
    expiresIn: 604800
  })  
}

module.exports = {generateToken, generateJWT, generateRefreshJWT}
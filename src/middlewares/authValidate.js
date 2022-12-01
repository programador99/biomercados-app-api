import { userRegisterSchema, bodyRegisterSchema, userLoginSchema } from '../schemas/auth';
import validateSchema from '../services/validatorSchema';

const validateLogin = (req, res, next) => {
  const { valid, errors } = validateSchema(req.body, userLoginSchema);
  if (!valid) {
    res.status(403).json(errors);
  } else {
    next();
  }
}

const validateRegister = (req, res, next) => {
  const { valid, errors } = validateSchema(req.body, bodyRegisterSchema);
  if (!valid) {
    res.status(403).json(errors);
  } else {
   const validUser = validateSchema(req.body.user, userRegisterSchema);
    if (!validUser.valid) {
      res.status(403).json(validUser.errors);
    } else {
      next();
    }
  }
}

module.exports = {validateLogin, validateRegister}
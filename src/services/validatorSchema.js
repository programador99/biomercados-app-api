import Ajv from "ajv";
import addFormats from "ajv-formats"
import addErrors from "ajv-errors"

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
addErrors(ajv);

const validateSchema = (object, schema) => {
  const validate = ajv.compile(schema)
  const valid = validate(object); 
  return {valid, errors: validate.errors};
}

module.exports = validateSchema;
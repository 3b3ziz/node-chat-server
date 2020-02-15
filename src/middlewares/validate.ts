import { RequestHandler } from 'express';
import { check, body, validationResult, param, oneOf } from 'express-validator';

const userValidationRules = () => [
  body('user_type').isIn(['Client', 'Freelancer']),
  param('id').isInt()
];

const chatValidationRules = () => [
  body('job_title').exists(),
  body('job_id').exists(),
  body('message').exists(),
  body('client_name').exists(),
  body('freelancer_name').exists(),
  check('client_id').custom((value, { req }) => {
    const {
      decodedToken: { type: userType }
    } = req;
    return userType === 'Freelancer' ? !!value : true;
  }),
  check('freelancer_id').custom((value, { req }) => {
    const {
      decodedToken: { type: userType }
    } = req;
    return userType === 'Client' ? !!value : true;
  })
];

const validate = (validations: any[]) => {
  const validator: RequestHandler = async (req, res, next) => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    const extractedErrors = <any>[];
    errors.array().map(err => extractedErrors.push({ [err.param]: err.msg }));

    return res.status(422).json({
      errors: extractedErrors
    });
  };
  return validator;
};

export { userValidationRules, chatValidationRules, validate };

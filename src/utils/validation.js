import Joi from 'joi';
import _ from 'lodash';

export const validate = (schema, values) => {
  let warning = '';
  Joi.validate(values, schema, (err) => {
    if (!_.isEmpty(err)) {
      warning = err.details[0].message;
    }
  });
  return warning;
};

import _ from 'lodash';
import bcrypt from 'bcrypt';
import knex from '../../config';
import { updateUserProfileSchema } from '../utils/validateSchemas';
import { validate } from '../utils/validation';

export const updateUserProfile = (req, res) => {
  const id = req.params.id;
  const { name, phone, image, password, isPasswordChange } = req.body;
  const values = { name, phone, image, password };
  const validateResult = validate(updateUserProfileSchema, values);

  const oldHash = knex.first('hash').from('users').where('id', id);
  const newHash = isPasswordChange ? bcrypt.hashSync(password, 10) : oldHash;

  const data = {
    name: name,
    phone: phone,
    image: image,
    hash: newHash,
    updated_at: new Date(),
  };

  if (_.isEmpty(validateResult)) {
    knex.first('*').from('users').where('id', id).update(data).returning('*').then((user) => {
      if (!_.isEmpty(user)) {
        res.json(user);
      } else {
        res.json({
          warning: 'Nothing to update',
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.json({
        error: err,
      });
    });
  } else {
    res.json({
      warning: validateResult,
    });
  }
};

export const getUserEvents = (req, res) => {

};

export const addToUserFavoritePlayground = (req, res) => {

};

export const getUserFavoritePlaygrounds = (req, res) => {

};

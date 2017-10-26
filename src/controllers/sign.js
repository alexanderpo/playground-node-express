import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import knex from '../../config';
import _ from 'lodash';
import  { signInSchema, signUpSchema } from '../utils/validateSchemas';
import { validate } from '../utils/validation';

export const signIn = (req, res) => {
  const { email, password } = req.body;
  const values = { email, password };
  const validateResult = validate(signInSchema, values);

  if (_.isEmpty(validateResult)) {
    knex.first('*').from('users').where('email', email).then((user) => {
      if (!_.isEmpty(user)) {
        bcrypt.compare(password, user.hash, (err, isCompare) => {
          if (isCompare) {
            const token = jwt.sign({
              user: user.email,
            }, 'qweqweqweqweqweqweq');
            const userWithToken = Object.assign({}, user, {
              token: token,
            });
            res.json(userWithToken);
          } else {
            res.json({
              error: 'Wrong password',
            });
          }
        });
      } else {
        res.json({
          warning: 'User doesn\'t exist',
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

export const signUp = (req, res) => {
  const { name, email, phone, password, repeatPassword } = req.body;
  const values = { email, password, repeatPassword };
  const validateResult = validate(signUpSchema, values);
  console.log('RESULT ' + validateResult);
  if (_.isEmpty(validateResult)) {
    knex.select('*').from('users').where('email', email).then((users) => {
      if(_.isEmpty(users)) {
        const hash = bcrypt.hashSync(password, 10);
        const newUser = {
          name: name,
          email: email,
          hash: hash,
          phone: phone,
          created_at: new Date(),
          updated_at: new Date(),
        };
        knex.insert(newUser).into('users').returning('*').then((user) => {
          res.json(user);
        });
      } else {
        res.json({
          warning: 'This email already used',
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

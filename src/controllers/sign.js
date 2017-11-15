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
            const getUserSubscribedEvents = () => knex('users_events').select('event_id').where('user_id', user.id);
            const getUserFavoritePlaygrounds = () => knex('users_favorite_playgrounds')
              .select('playground_id').where('user_id', user.id);

            Promise.all([getUserSubscribedEvents(), getUserFavoritePlaygrounds()]).then((result) => {
                const token = jwt.sign({
                  user: user.email,
                }, 'qweqweqweqweqweqweq');

                const subscribedEvents = result[0].map((event) => event.event_id);
                const favoritePlaygrounds = result[1].map((playground) => playground.playground_id);

                const userWithToken = Object.assign({}, user, {
                  subscribedEvents: subscribedEvents,
                  favoritePlaygrounds: favoritePlaygrounds,
                  token: token,
                });
                res.status(200).json(userWithToken);
            })
            .catch((err) => {
              console.log(err);
              res.status(500).json({
                error: err,
              });
            });

          } else {
            res.status(400).json({
              error: 'Wrong password',
            });
          }
        });
      } else {
        res.status(400).json({
          error: 'User doesn\'t exist',
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
  } else {
    res.status(400).json({
      error: validateResult,
    });
  }
};

export const signUp = (req, res) => {
  const { name, email, phone, password, rePassword } = req.body;
  const values = { email, password, rePassword };
  const validateResult = validate(signUpSchema, values);

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
          res.json(user[0]);
        });
      } else {
        res.json({
          error: 'This email already used',
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        error: err,
      });
    });
  } else {
      res.status(400).json({
        error: validateResult,
      });
  }

};

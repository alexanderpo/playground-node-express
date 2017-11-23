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
            const getUserImage = () => knex('images').select('*').where('id', user.image);
            const getUserSubscribedEvents = () => knex('users_events')
              .select('event_id').where('user_id', user.id);
            const getUserFavoritePlaygrounds = () => knex('users_favorite_playgrounds')
              .select('playground_id').where('user_id', user.id);

            Promise.all([getUserSubscribedEvents(), getUserFavoritePlaygrounds(), getUserImage()])
            .then((result) => {
                const token = jwt.sign({
                  user: user.email,
                }, 'qweqweqweqweqweqweq');

                const subscribedEvents = result[0].map((event) => event.event_id);
                const favoritePlaygrounds = result[1].map((playground) => playground.playground_id);
                const imageContentType = result[2].map((image) => image.content_type);
                const imageData = result[2].map((image) => image.image_data);
                const userImage = imageContentType + imageData;

                const detailsUser = Object.assign({}, user, {
                  image: userImage,
                  subscribedEvents: subscribedEvents,
                  favoritePlaygrounds: favoritePlaygrounds,
                  token: token,
                });
                res.status(200).json(detailsUser);
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
        const emptyImage = {
          image_data: '',
          content_type: '',
        };
        knex.insert(emptyImage).into('images').returning('*').then((images) => {
          const imageId = images[0].id;
          const hash = bcrypt.hashSync(password, 10);
          const newUser = {
            name: name,
            email: email,
            hash: hash,
            phone: phone,
            image: imageId,
            created_at: new Date(),
            updated_at: new Date(),
          };

          knex.insert(newUser).into('users').then(() => { res.status(200).json({}); });
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

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import _ from 'lodash';
import {
  createNewUser,
  getImageMinioIdByPgId,
  getUserByEmail,
  getCreatedEventsCountByUserId,
} from '../queries/users';
import { getEventIdByUserId } from '../queries/events';
import { getUserFavoritePlaygroundsByUserId } from '../queries/playgrounds';
import  { signInSchema, signUpSchema } from '../utils/validateSchemas';
import { validate } from '../utils/validation';

export const signIn = (req, res) => {
  const { email, password } = req.body;

  const values = { email, password };
  const validateResult = validate(signInSchema, values);

  if (_.isEmpty(validateResult)) {
    getUserByEmail(email).then((user) => {
      if (!_.isEmpty(user)) {
        bcrypt.compare(password, user.hash, (err, isCompare) => {
          if (isCompare) {
            Promise.all([getEventIdByUserId(user.id), getUserFavoritePlaygroundsByUserId(user.id), getImageMinioIdByPgId(user.image), getCreatedEventsCountByUserId(user.id)])
            .then((result) => {
                const token = jwt.sign({
                  user: user.email,
                }, 'qweqweqweqweqweqweq');

                const subscribedEvents = result[0].map((event) => event.event_id);
                const favoritePlaygrounds = result[1].map((playground) => playground.playground_id);
                const imageMinioId = (result[2] === undefined || result[2] === null) ? null : result[2].minio_id;
                const createdEventsCount = result[3].count;

                const detailsUser = Object.assign({}, user, {
                  image: imageMinioId,
                  subscribedEvents: subscribedEvents,
                  favoritePlaygrounds: favoritePlaygrounds,
                  createdEvents: createdEventsCount,
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
    getUserByEmail(email).then((users) => {
      if(_.isEmpty(users)) {
        const hash = bcrypt.hashSync(password, 10);
        const newUser = {
          name: name,
          email: email,
          hash: hash,
          phone: phone,
          image: null,
          created_at: new Date(),
          updated_at: new Date(),
        };

        createNewUser(newUser).then(() => { res.status(200).json({}); });
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

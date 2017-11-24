import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import _ from 'lodash';
import {
  createNewUser,
  getImageById,
  getUserByEmail,
  createUserProfileImage,
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
            Promise.all([getEventIdByUserId(user.id), getUserFavoritePlaygroundsByUserId(user.id), getImageById(user.image)])
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
    getUserByEmail(email).then((users) => {
      if(_.isEmpty(users)) {
        const emptyImage = {
          image_data: '',
          content_type: '',
        };
        createUserProfileImage(emptyImage).then((images) => {
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

          createNewUser(newUser).then(() => { res.status(200).json({}); });
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

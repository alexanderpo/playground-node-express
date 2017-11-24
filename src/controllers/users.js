import _ from 'lodash';
import bcrypt from 'bcrypt';
import {
  updateUserProfileById,
  updateUserProfileImageById,
  getUserHashById,
} from '../queries/users';
import {
  getUserEventsByUserId,
  getEventIdByUserId,
  getUserEventsByData,
  updateUserEventByData,
  removeUserEventByData,
  getEventDataByEventIdWithJoin,
} from '../queries/events';
import {
  getPlaygroundById,
  getUserFavoritePlaygroundsByUserId,
  getFavoritePlaygrounds,
  updateFavoritePlayground,
  deleteFavoritePlayground,
} from '../queries/playgrounds';
import { updateUserProfileSchema } from '../utils/validateSchemas';
import { validate } from '../utils/validation';

export const updateUserProfile = (req, res) => {
  const id = req.params.id;
  const { name, phone, image, password, isPasswordChange } = req.body;
  const values = { name, phone, password, isPasswordChange };
  const validateResult = validate(updateUserProfileSchema, values);

  const oldHash = getUserHashById(id);
  const newHash = (isPasswordChange === true) ? bcrypt.hashSync(password, 10) : oldHash.hash;

  const regexContentType = /^data:image\/\w+;base64,/;
  const imageContentType = !image ? '' : regexContentType.exec(image)[0];
  const imageContent = !image ? '' : image.replace(regexContentType, '');

  const data = {
    name: name,
    phone: phone,
    hash: newHash,
    updated_at: new Date(),
  };
  // IDEA: проверить на совпадение данных и если да то вернуть сообщение что нечего изменять
  if (_.isEmpty(validateResult)) {
    updateUserProfileById(id, data).then((users) => {
      if (!_.isEmpty(users)) {
        const user = users[0];
        const imageId = user.image;
        const imageData = {
          image_data: imageContent,
          content_type: imageContentType,
        };

        updateUserProfileImageById(imageId, imageData).then((images) => {
          const newImage = images[0].content_type + images[0].image_data;
          const userData = Object.assign({}, user, {
            image: newImage,
          });
          res.status(200).json(userData);
        });
      } else {
        res.status(400).json({
          error: 'Nothing to update',
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

export const getUserEvents = (req, res) => {
  const id = req.params.id;

  getUserEventsByUserId(id).then((events) => {
      if(!_.isEmpty(events)) {
        res.status(200).json(events);
      } else {
        res.json({
          error: 'You don\'t have any events',
        });
      }
  })
  .catch((err) => {
    console.log(err);
    res.json({
      error: err,
    });
  });
};

export const getUserFavoritePlaygrounds = (req, res) => {
  const id = req.params.id;

  getUserFavoritePlaygroundsByUserId(id).then((playgrounds) => {
    const ids = playgrounds.map(playground => playground.playground_id);
    const playgroundPromises = ids.map(id => getPlaygroundById(id));

    Promise.all(playgroundPromises).then((results) => {
      if (!_.isEmpty(results)) {
        res.status(200).json(results);
      } else {
        res.json({
          error: 'You don\'t have favorite playgrounds',
        });
      }
    });
  })
  .catch((err) => {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  });
};

export const userFavoritePlaygroundControl = (req, res) => {
  const { userId, playgroundId } = req.body;
  const data = {
    user_id: userId,
    playground_id: playgroundId,
  };

  const sendUserFavoritePlaygrounds = () => {
    getUserFavoritePlaygroundsByUserId(userId).then((playgrounds) => {
      const favoritePlaygrounds = playgrounds.map(playground => playground.playground_id);
      res.status(200).json({
        favoritePlaygrounds: favoritePlaygrounds,
      });
    });
  };

  getFavoritePlaygrounds(data).then((result) => {
    if(_.isEmpty(result)) {
    updateFavoritePlayground(data).then(() => { sendUserFavoritePlaygrounds(); });
    } else {
      deleteFavoritePlayground(data).then(() => { sendUserFavoritePlaygrounds(); });
    }
  })
  .catch((err) => {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  });
};

export const subscribeEventControl = (req, res) => {
  const { userId, eventId } = req.body;
  const data = {
    user_id: userId,
    event_id: eventId,
  };

  const sendEventSubscribers = () => {
    getEventIdByUserId(userId).then((events) => {
      const subscribedEvents = events.map(event => event.event_id);
      res.status(200).json({
        subscribedEvents: subscribedEvents,
      });
    });
  };

  getUserEventsByData(data).then((result) => {
    if(_.isEmpty(result)) {
      updateUserEventByData(data).then(() => { sendEventSubscribers(); });
    } else {
      removeUserEventByData(data).then(() => { sendEventSubscribers(); });
    }
  })
  .catch((err) => {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  });
};

export const getUpcomingEvents = (req, res) => {
  const userId = req.params.id;

  getEventIdByUserId(userId).then((events) => {
    if (_.isEmpty(events)) {
      res.json({
        error: 'Don\'t have upcoming events',
      });
    } else {
      const eventsIds = events.map(event => event.event_id);
      const eventsPromises = eventsIds.map(id => getEventDataByEventIdWithJoin(id));

      Promise.all(eventsPromises).then((result) => {
        const sortedData = _.sortBy(result, (item) => { return item.event_datetime; }).reverse();
        res.status(200).json(sortedData);
      });
    }
  });
};

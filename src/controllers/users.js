import _ from 'lodash';
import bcrypt from 'bcrypt';
import {
  createImageByData,
  getUserById,
  updateImageInUserProfile,
  getImageMinioIdByPgId,
  updateImageById,
  getUserHashById,
  updateUserProfileById,
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
  getUserFavoritePlaygroundsByUserId,
  getFavoritePlaygrounds,
  updateFavoritePlayground,
  deleteFavoritePlayground,
  getPlaygroundByIdWithMinioId,
} from '../queries/playgrounds';
import { updateUserProfileSchema } from '../utils/validateSchemas';
import { validate } from '../utils/validation';

export const updateUserProfileImage = (req, res) => {
  const id = req.params.id;
  const newImage = {
    minio_id: req.body.minioId,
    original_name: req.body.originalName,
  };

  const sendDetailsUserAfterUpdateImage = (newImageId) => {
    updateImageInUserProfile(id, newImageId).then((results) => {
      getImageMinioIdByPgId(results[0].image).then((image) => {
        const detailsUser = Object.assign({}, results[0], {
          image: image.minio_id,
        });
        res.status(200).json(detailsUser);
      });
    });
  };

  getUserById(id).then((user) => {
    if (user.image === null) {
      createImageByData(newImage).then((images) => {
        sendDetailsUserAfterUpdateImage(images[0].id);
      });
    } else {
      updateImageById(user.id, newImage).then((images) => {
        sendDetailsUserAfterUpdateImage(images[0].id);
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

export const updateUserProfile = (req, res) => {
  const id = req.params.id;
  const { name, phone, password, isPasswordChange } = req.body;
  const values = { name, phone, password, isPasswordChange };
  const validateResult = validate(updateUserProfileSchema, values);

  const oldHash = getUserHashById(id);
  const newHash = (isPasswordChange === true) ? bcrypt.hashSync(password, 10) : oldHash.hash;

  const data = {
    name: name,
    phone: phone,
    hash: newHash,
  };

  if (_.isEmpty(validateResult)) {
    updateUserProfileById(id, data).then((users) => {
      if (!_.isEmpty(users)) {
        res.status(200).json(users[0]);
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
    const playgroundPromises = ids.map(id => getPlaygroundByIdWithMinioId(id));

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

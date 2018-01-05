import _ from 'lodash';
import bcrypt from 'bcrypt';
import moment from 'moment';
import {
  createImageByData,
  getUserById,
  updateImageInUserProfile,
  getImageMinioIdByPgId,
  updateImageById,
  getUserHashById,
  updateUserProfileById,
  getCreatedEventsCountByUserId,
} from '../queries/users';
import {
  getUserEventsByUserId,
  getEventIdByUserId,
  getUserEventsByData,
  updateUserEventByData,
  removeUserEventByData,
  getEventDataByEventIdWithJoin,
  getEventByEventIdWithoutImages,
} from '../queries/events';
import {
  getUserFavoritePlaygroundsByUserId,
  getFavoritePlaygrounds,
  updateFavoritePlayground,
  deleteFavoritePlayground,
  getPlaygroundByIdWithMinioId,
  getPlaygroundsByCreatorId,
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
      updateImageById(user.image, newImage).then((images) => {
        console.log(images, 'IMAGE AFTER UPDATE');
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

export const updateUserProfile = async (req, res) => {
  const id = req.params.id;
  const { name, phone, oldPassword, password, isPasswordChange } = req.body;
  const values = { name, phone, oldPassword, password, isPasswordChange };
  const validateResult = validate(updateUserProfileSchema, values);

  if (_.isEmpty(validateResult)) {
    const oldHash = await getUserHashById(id);
    const isCompare = isPasswordChange ? await bcrypt.compare(oldPassword, oldHash.hash) : null;

    if (isPasswordChange && !isCompare) {
      res.status(400).json({
        error: 'Old password doesn\'t match',
      });
    } else {
      const newHash = (isPasswordChange && isCompare) ? bcrypt.hashSync(password, 10) : oldHash.hash;
      const data = {
        name: name,
        phone: phone,
        hash: newHash,
      };
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
    }
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
        const sortedEvents = _.sortBy(events, (item) => { return item.event_datetime; });
        res.status(200).json(sortedEvents);
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

export const getUserPlaygrounds = (req, res) => {
  const { id } = req.params;

  getPlaygroundsByCreatorId(id).then((playgrounds) => {
    if (!_.isEmpty(playgrounds)) {
      res.status(200).json(playgrounds);
    } else {
      res.json({
        error: 'You doesn\'t create playgrounds yet',
      });
    }
  })
  .catch((err) => {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  });
};

export const getUserFavoritePlaygrounds = (req, res) => {
  const { id } = req.params;

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

export const getUpcomingEvents = async (req, res) => {
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
        const actualData = _.filter(result, (item) => { return item !== undefined; });
        const sortedData = _.sortBy(actualData, (item) => { return item.event_datetime; });
        res.status(200).json(sortedData);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: err,
        });
      });
    }
  });
};

export const getOrganisedEvents = (req, res) => {
  const { id } = req.params;

  getCreatedEventsCountByUserId(id).then((result) => {
    if (!_.isEmpty(result)) {
      res.status(200).json(result);
    }
  })
  .catch((err) => {
    console.log(err);
    res.status(500).json({
      error: err,
    });
  });
};

export const getUpcomingEventsByDate = (req, res) => {
  const { id, date } = req.params;

  getEventIdByUserId(id).then((events) => {
    if (_.isEmpty(events)) {
      res.json({
        error: 'Don\'t have upcoming events',
      });
    } else {
      const eventsIds = events.map(event => event.event_id);
      const eventsPromises = eventsIds.map(id => getEventByEventIdWithoutImages(id));

      Promise.all(eventsPromises).then((result) => {
        const actualData = _.filter(result, (item) => { return item !== undefined; });
        const filteredResult = _.filter(actualData, (item) => {
          return moment(item.event_datetime).format('YYYY-MM-DD') === date;
        });
        const sortedData = _.sortBy(filteredResult, (item) => { return item.event_datetime; });
        res.status(200).json(sortedData);
      })
      .catch((err) => {
        console.log(err);
        res.status(500).json({
          error: err,
        });
      });
    }
  });
};

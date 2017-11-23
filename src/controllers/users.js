import _ from 'lodash';
import bcrypt from 'bcrypt';
import knex from '../../config';
import { updateUserProfileSchema } from '../utils/validateSchemas';
import { validate } from '../utils/validation';

export const updateUserProfile = async (req, res) => {
  const id = req.params.id;
  const { name, phone, image, password, isPasswordChange } = req.body;
  const values = { name, phone, password, isPasswordChange };
  const validateResult = validate(updateUserProfileSchema, values);

  const oldHash = await knex.first('hash').from('users').where('id', id);
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
    knex.first('*').from('users').where('id', id).update(data).returning('*').then((users) => {
      if (!_.isEmpty(users)) {
        const user = users[0];
        const imageId = user.image;
        const imageData = {
          image_data: imageContent,
          content_type: imageContentType,
        };

        knex.first('*').from('images').where('id', imageId).update(imageData).returning('*').then((images) => {
          const newImage = images[0].content_type + images[0].image_data;
          const userData = Object.assign({}, user, {
            image: newImage,
          });
          res.json(userData);
        });
      } else {
        res.json({
          error: 'Nothing to update',
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
    res.status(400).json({
      error: validateResult,
    });
  }
};

export const getUserEvents = (req, res) => {
  const id = req.params.id;
  knex.select('*').from('events').where('creator_id', id).then((events) => {
    if(!_.isEmpty(events)) {
      res.json(events);
    } else {
      res.json({
        warning: 'You don\'t have any events',
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

  knex('users_favorite_playgrounds').select('playground_id')
  .where('user_id', id).then((playgrounds) => {
    const ids = playgrounds.map(playground => playground.playground_id);
    const getPlayground = (id) => knex.first('*').from('playgrounds').where('id', id);
    const playgroundPromises = ids.map(id => getPlayground(id));

    Promise.all(playgroundPromises).then((results) => {
      if (!_.isEmpty(results)) {
        res.json(results);
      } else {
        res.json({
          warning: 'You don\'t have favorite playgrounds',
        });
      }
    });
  })
  .catch((err) => {
    console.log(err);
    res.json({
      error: err,
    });
  });
};

export const userFavoritePlaygroundControl = (req, res) => {
  const { userId, playgroundId } = req.body;
  const userFavoritePlayground = {
    user_id: userId,
    playground_id: playgroundId,
  };

  const getFavoritePlaygrounds = () => knex('users_favorite_playgrounds').select('*')
  .where(userFavoritePlayground);
  const getUserFavoritePlaygrounds = () => knex('users_favorite_playgrounds').select('playground_id').where('user_id', userId);

  const sendUserFavoritePlaygrounds = () => {
    getUserFavoritePlaygrounds().then((playgrounds) => {
      const favoritePlaygrounds = playgrounds.map(playground => playground.playground_id);
      res.json({
        favoritePlaygrounds: favoritePlaygrounds,
      });
    });
  };

  getFavoritePlaygrounds().then((result) => {
    if(_.isEmpty(result)) {
      knex('users_favorite_playgrounds').insert(userFavoritePlayground).then(() => { sendUserFavoritePlaygrounds(); });
    } else {
      getFavoritePlaygrounds().del().then(() => { sendUserFavoritePlaygrounds(); });
    }
  })
  .catch((err) => {
    console.log(err);
    res.json({
      error: err,
    });
  });
};

export const subscribeEventControl = (req, res) => {
  const { userId, eventId } = req.body;
  const userEventsSubscribe = {
    user_id: userId,
    event_id: eventId,
  };

  const getUserEvents = () => knex('users_events').select('*').where(userEventsSubscribe);
  const getEventSubscribers = () => knex('users_events').select('event_id').where('user_id', userId);

  const sendEventSubscribers = () => {
    getEventSubscribers().then((events) => {
      const subscribedEvents = events.map(event => event.event_id);
      res.json({
        subscribedEvents: subscribedEvents,
      });
    });
  };

  getUserEvents().then((result) => {
    if(_.isEmpty(result)) {
      knex('users_events').insert(userEventsSubscribe).then(() => { sendEventSubscribers(); });
    } else {
      getUserEvents().del().then(() => { sendEventSubscribers(); });
    }
  })
  .catch((err) => {
    console.log(err);
    res.json({
      error: err,
    });
  });
};

export const getUpcomingEvents = (req, res) => {
  const userId = req.params.id;

  knex('users_events').select('event_id').where('user_id', userId)
  .then((events) => {
    if (_.isEmpty(events)) {
      res.status(200).json({
        warning: 'Don\'t have upcoming events',
      });
    } else {
      const eventsIds = events.map(event => event.event_id);
      const getEvent = (id) => knex('events')
      .first(
        'events.id as event_id',
        'events.datetime as event_datetime',
        'events.title as event_title',
        'events.created_at as event_created_at',
      )
      .where('events.id', id)
      .groupBy('events.id')
      .innerJoin('playgrounds', 'playground_id', 'playgrounds.id')
      .select(
        'playgrounds.id as playground_id',
        'playgrounds.name as playground_name',
        'playgrounds.description as playground_description',
        'playgrounds.images as playground_images',
        'playgrounds.address as playground_address',
        'playgrounds.latitude as playground_latitude',
        'playgrounds.longitude as playground_longitude',
        'playgrounds.creator as playground_creator',
      )
      .groupBy('playgrounds.id')
      .innerJoin('users','creator_id', 'users.id' )
      .select(
        'users.id as creator_id',
        'users.name as creator_name',
        'users.email as creator_email',
        'users.phone as creator_phone',
      )
      .groupBy('users.id')
      .leftJoin('images', 'users.image', 'images.id')
      .select(
        knex.raw('CONCAT(images.content_type, images.image_data) as creator_image'),
      )
      .groupBy('images.id')
      .leftJoin('users_events', 'events.id', 'users_events.event_id')
      .count('user_id as subscribed_users');

      const eventsPromises = eventsIds.map(id => getEvent(id));

      Promise.all(eventsPromises).then((result) => {
        const sortedData = _.sortBy(result, (item) => { return item.event_datetime; }).reverse();
        res.status(200).json(sortedData);
      });
    }
  });
};

import _ from 'lodash';
import bcrypt from 'bcrypt';
import knex from '../../config';
import { updateUserProfileSchema } from '../utils/validateSchemas';
import { validate } from '../utils/validation';

export const updateUserProfile = async (req, res) => {
  const id = req.params.id;
  const { name, phone, image, password, isPasswordChange } = req.body;
  const values = { name, phone, image, password };
  const validateResult = validate(updateUserProfileSchema, values);

  const oldHash = await knex.first('hash').from('users').where('id', id);
  const newHash = (isPasswordChange === true) ? bcrypt.hashSync(password, 10) : oldHash.hash;

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

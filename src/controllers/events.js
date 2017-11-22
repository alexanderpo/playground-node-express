import _ from 'lodash';
import knex from '../../config.js';
import { createEventSchema, updateEventSchema } from '../utils/validateSchemas';
import { validate } from '../utils/validation';

export const createEvent = (req, res) => {
  const { title, datetime, userId, playgroundId } = req.body;
  const values = { title, datetime };
  const validateResult = validate(createEventSchema, values);

  if (_.isEmpty(validateResult)) {
    knex.select('*').from('events').where('title', title).then((event) => {
      if(_.isEmpty(event)) {
        const newEvent = {
          title: title,
          datetime: datetime,
          creator_id: userId,
          playground_id: playgroundId,
          created_at: new Date(),
          updated_at: new Date(),
        };
        knex.insert(newEvent).into('events').returning('*').then((event) => {
          res.json(event);
        });
      } else {
        res.json({
          warning: 'Event with this title exist',
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

export const getEvents = (req, res) => {
  knex.select('*').from('events').then((events) => {
    if (_.isEmpty(events)) {
      res.json({
        warning: 'Events not found',
      });
    } else {
      knex('events')
      .select(
        'events.id as event_id',
        'events.datetime as event_datetime',
        'events.title as event_title',
        'events.created_at as event_created_at',
      )
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
      .innerJoin('users','creator_id', 'users.id' )
      .select(
        'users.id as creator_id',
        'users.name as creator_name',
        'users.email as creator_email',
        'users.phone as creator_phone',
      )
      .then((data) => {
        // вытянуть все id картинок пользователей
        // через Promise all достать и преобразовать изображения
        // добавить изображения к текущим данным
          const sortedData = _.sortBy(data, (item) => { return item.event_datetime; }).reverse();
          res.status(200).json(sortedData);
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

export const getSingleEvent = (req, res) => {
  const id = req.params.id;

  knex.first('*').from('events').where('id', id).then((event) => {
    if (_.isEmpty(event)) {
      res.json({
        warning: 'Event not found',
      });
    } else {
      knex('events')
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
        'users.image as creator_image',
        'users.phone as creator_phone',
      )
      .groupBy('users.id')
      .leftJoin('users_events', 'events.id', 'users_events.event_id')
      .count('user_id as subscribed_users')
      .then((data) => {
          res.status(200).json([data]);
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

export const updateEvent = (req, res) => {
  const id = req.params.id;

  const { title, datetime, userId, playgroundId } = req.body;
  const values = { title, datetime };
  const validateResult = validate(updateEventSchema, values);

  const data = {
    title: title,
    datetime: datetime,
    creator_id: userId,
    playground_id: playgroundId,
    updated_at: new Date(),
  };

  if (_.isEmpty(validateResult)) {
    knex.first('*').from('events').where('id', id).update(data).returning('*').then((event) => {
      if (!_.isEmpty(event)) {
        res.json(event);
      } else {
        res.json({
          warning: 'Nothing to update',
        });
      }
    });
  } else {
    res.json({
      warning: validateResult,
    });
  }
};

export const deleteEvent = (req, res) => {
  const id = req.params.id;

  knex.first('*').from('events').where('id', id).del().then((count) => {
    if (count !== 0) {
      res.json({
        message: `Delete ${count} event`,
      });
    } else {
      res.json({
        warning: 'Nothing to delete',
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

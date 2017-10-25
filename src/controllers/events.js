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
      res.json(events);
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
        warning: 'Event does\'t exist',
      });
    } else {
      res.json(event);
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
    knex.select('*').from('events').where('id', id).update(data).then((count) => {
      if (count !== 0) {
        res.json({
          message: `Update ${count} events `,
        });
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

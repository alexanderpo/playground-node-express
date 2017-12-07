import _ from 'lodash';
import knex from '../../config.js';
import {
  getAllEvents,
  getEventsDataWithJoin,
  getOneEventById,
  getEventDataByEventIdWithJoin,
} from '../queries/events';
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
          res.status(200).json(event);
        });
      } else {
        res.json({
          error: 'Event with this title exist',
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
  getAllEvents().then((events) => {
    if (_.isEmpty(events)) {
      res.json({
        error: 'Events not found',
      });
    } else {
        getEventsDataWithJoin().then((data) => {
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

  getOneEventById(id).then((event) => {
    if (_.isEmpty(event)) {
      res.json({
        error: 'Event not found',
      });
    } else {
      getEventDataByEventIdWithJoin(id).then((data) => {
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

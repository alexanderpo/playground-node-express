import _ from 'lodash';
import moment from 'moment';
import knex from '../../config.js';
import {
  getAllEvents,
  getEventsDataWithJoin,
  getOneEventById,
  getEventDataByEventIdWithJoin,
  getSubscribersCountByEventId,
} from '../queries/events';
import { getEventByPlaygroundIdWithoutImages } from '../queries/playgrounds';
import { createEventSchema, updateEventSchema } from '../utils/validateSchemas';
import { validate } from '../utils/validation';

export const createEvent = (req, res) => {
  const { title, datetime, userId, playgroundId } = req.body;
  const values = { title, datetime };
  const validateResult = validate(createEventSchema, values);

  if (_.isEmpty(validateResult)) {
    knex.select('*').from('events').where('title', title).then((event) => {
      if(_.isEmpty(event)) {
        getEventByPlaygroundIdWithoutImages(playgroundId).then((events) => {
          const formatedDatetime = moment(datetime).format('YYYY-MM-DD-HH:mm');
          const pgEventsDatetime = events.map((pgEvent) => moment(pgEvent.event_datetime).format('YYYY-MM-DD-HH:mm'));

          const isIncludeDatetime = _.includes(pgEventsDatetime, formatedDatetime);

          if (!isIncludeDatetime) {
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
            res.status(400).json({
              error: 'Event for this datetime already exist. Select another date.'
            });
          }
        });
      } else {
        res.status(400).json({
          error: 'Event with this title exist.',
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
          const sortedData = _.sortBy(data, (item) => { return item.event_datetime; });
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
      Promise.all([getEventDataByEventIdWithJoin(id), getSubscribersCountByEventId(id)]).then((results) => {
        const data = results[0];
        const dataWithSubscribersCount = Object.assign({}, data, {
          subscribed_users: results[1][0].subscribed_users,
        });
        res.status(200).json([dataWithSubscribersCount]);
      })
      .catch((err) => {
        console.log(err);
        res.json({
          error: err,
        });
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

export const deleteEvent = async (req, res) => {
  const id = req.params.id;
  const deleteEventById = (id) => knex.first('*').from('events').where('id', id).del();
  const getEventSubscribersById = async (id) => await knex('users_events').select('*').where('event_id', id);
  const unsubscribeUsersAtEvent = async (id) => await knex('users_events').select('*').where('event_id', id).del();

  const eventSubscribers = await getEventSubscribersById(id);
  if (_.isEmpty(eventSubscribers)) {
    deleteEventById(id).then(() => res.status(200).json({}));
  } else {
    Promise.all([unsubscribeUsersAtEvent(id), deleteEventById(id)]).then((results) => {
      if (!_.isEmpty(results)) {
        res.status(200).json({});
      } else {
        res.status(400).json({
          error: 'Nothing to delete',
        });
      }
    })
    .catch((err) => {
      console.log(err);
      res.json({
        error: err,
      });
    });
  }

};

import knex from '../../config';

export const getAllEvents = () => knex.select('*').from('events');

export const getOneEventById = (id) => knex.first('*').from('events').where('id', id);

export const getEventsDataWithJoin = () => knex('events')
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
  .leftJoin('images', 'users.image', 'images.id')
  .select(
    knex.raw('CONCAT(images.content_type, images.image_data) as creator_image'),
  );

export const getUserEventsByUserId = (id) => knex('events')
  .select(
    'events.id as event_id',
    'events.datetime as event_datetime',
    'events.title as event_title',
    'events.created_at as event_created_at',
  )
  .where('creator_id', id)
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
  .leftJoin('images', 'users.image', 'images.id')
  .select(
    knex.raw('CONCAT(images.content_type, images.image_data) as creator_image'),
  );

export const getEventDataByEventIdWithJoin = (id) => knex('events')
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

export const getEventIdByUserId = (id) => knex('users_events').select('event_id').where('user_id', id);

export const getUserEventsByData = (data) => knex('users_events').select('*').where(data);

export const updateUserEventByData = (data) => knex('users_events').insert(data);

export const removeUserEventByData = (data) => knex('users_events').select('*').where(data).del();

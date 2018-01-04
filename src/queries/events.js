import knex from '../../config';

export const getAllEvents = () => knex.select('*').from('events').where('events.datetime', '>=', new Date());

export const getOneEventById = (id) => knex.first('*').from('events').where('id', id);

export const getEventsDataWithJoin = () => knex('events')
  .select(
    'events.id as event_id',
    'events.datetime as event_datetime',
    'events.title as event_title',
    'events.created_at as event_created_at',
  )
  .where('events.datetime', '>=', new Date())
  .groupBy('events.id')
  .innerJoin('playgrounds', 'playground_id', 'playgrounds.id')
  .select(
    'playgrounds.id as playground_id',
    'playgrounds.name as playground_name',
    'playgrounds.description as playground_description',
    'playgrounds.address as playground_address',
    'playgrounds.latitude as playground_latitude',
    'playgrounds.longitude as playground_longitude',
    'playgrounds.creator as playground_creator',
    knex.raw('ARRAY_AGG(images.minio_id) as images'),
  )
  .groupBy('playgrounds.id')
  .leftJoin('images', 'images.id', knex.raw('ANY(playgrounds.images)'))
  .groupBy('images')
  .innerJoin('users','creator_id', 'users.id' )
  .select(
    'users.id as creator_id',
    'users.name as creator_name',
    'users.email as creator_email',
    'users.phone as creator_phone',
  )
  .groupBy('users.id')
  .leftJoin('images as users_images', 'users_images.id', 'users.image')
  .select('users_images.minio_id as creator_image')
  .groupBy('users_images.minio_id');

export const getUserEventsByUserId = (id) => knex('events')
  .select(
    'events.id as event_id',
    'events.datetime as event_datetime',
    'events.title as event_title',
    'events.created_at as event_created_at',
  )
  .where('creator_id', id)
  .andWhere('events.datetime', '>=', new Date())
  .groupBy('events.id')
  .innerJoin('playgrounds', 'playground_id', 'playgrounds.id')
  .select(
    'playgrounds.id as playground_id',
    'playgrounds.name as playground_name',
    'playgrounds.description as playground_description',
    'playgrounds.address as playground_address',
    'playgrounds.latitude as playground_latitude',
    'playgrounds.longitude as playground_longitude',
    'playgrounds.creator as playground_creator',
    knex.raw('ARRAY_AGG(images.minio_id) as images'),
  )
  .groupBy('playgrounds.id')
  .leftJoin('images', 'images.id', knex.raw('ANY(playgrounds.images)'))
  .groupBy('images')
  .innerJoin('users','creator_id', 'users.id' )
  .select(
    'users.id as creator_id',
    'users.name as creator_name',
    'users.email as creator_email',
    'users.phone as creator_phone',
  )
  .groupBy('users.id')
  .leftJoin('images as users_images', 'users_images.id', 'users.image')
  .select('users_images.minio_id as creator_image')
  .groupBy('users_images.minio_id');

export const getEventDataByEventIdWithJoin = (id) => knex('events')
  .first(
    'events.id as event_id',
    'events.datetime as event_datetime',
    'events.title as event_title',
    'events.created_at as event_created_at',
  )
  .where('events.id', id)
  .andWhere('events.datetime', '>=', new Date())
  .groupBy('events.id')
  .innerJoin('playgrounds', 'playground_id', 'playgrounds.id')
  .select(
    'playgrounds.id as playground_id',
    'playgrounds.name as playground_name',
    'playgrounds.description as playground_description',
    'playgrounds.address as playground_address',
    'playgrounds.latitude as playground_latitude',
    'playgrounds.longitude as playground_longitude',
    'playgrounds.creator as playground_creator',
    knex.raw('ARRAY_AGG(images.minio_id) as images'),
  )
  .groupBy('playgrounds.id')
  .leftJoin('images', 'images.id', knex.raw('ANY(playgrounds.images)'))
  .groupBy('images')
  .innerJoin('users','creator_id', 'users.id' )
  .select(
    'users.id as creator_id',
    'users.name as creator_name',
    'users.email as creator_email',
    'users.phone as creator_phone',
  )
  .groupBy('users.id')
  .leftJoin('images as users_images', 'users_images.id', 'users.image')
  .select('users_images.minio_id as creator_image')
  .groupBy('users_images.minio_id');

  export const getEventByEventIdWithoutImages = (id) => knex('events')
    .first(
      'events.id as event_id',
      'events.datetime as event_datetime',
      'events.title as event_title',
      'events.created_at as event_created_at',
    )
    .where('events.id', id)
    .andWhere('events.datetime', '>=', new Date())
    .groupBy('events.id')
    .innerJoin('playgrounds', 'playground_id', 'playgrounds.id')
    .select(
      'playgrounds.id as playground_id',
      'playgrounds.name as playground_name',
      'playgrounds.description as playground_description',
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
    .leftJoin('users_events', 'users_events.event_id', 'events.id')
    .count('user_id as subscribed_users');

export const getSubscribersCountByEventId = (id) => knex('users_events').count('user_id as subscribed_users').where('event_id', id);

export const getEventIdByUserId = (id) => knex('users_events').select('event_id').where('user_id', id);

export const getUserEventsByData = (data) => knex('users_events').select('*').where(data);

export const updateUserEventByData = (data) => knex('users_events').insert(data);

export const removeUserEventByData = async (data) => await knex('users_events').select('*').where(data).del();

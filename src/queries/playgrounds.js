import knex from '../../config';

export const getAllPlaygrounds = () => knex.select('*').from('playgrounds');

export const getPlaygroundById = (id) => knex.first('*').from('playgrounds').where('id', id);

export const getPlaygroundByIdWithMinioId = async (id) => await knex.first(
    'playgrounds.id',
    'playgrounds.name',
    'playgrounds.description',
    'playgrounds.latitude',
    'playgrounds.longitude',
    'playgrounds.address',
    'playgrounds.created_at',
    'playgrounds.updated_at',
    'playgrounds.creator',
    knex.raw('ARRAY_AGG(images.minio_id) as images')
  )
  .from('playgrounds')
  .where('playgrounds.id', id)
  .leftJoin('images', 'images.id', knex.raw('ANY(playgrounds.images)'))
  .groupBy('playgrounds.id');

export const getUserFavoritePlaygroundsByUserId = (id) => knex('users_favorite_playgrounds').select('playground_id').where('user_id', id);

export const getFavoritePlaygrounds = (data) => knex('users_favorite_playgrounds').select('*').where(data);

export const updateFavoritePlayground = (data) => knex('users_favorite_playgrounds').insert(data);

export const deleteFavoritePlayground = (data) => knex('users_favorite_playgrounds').select('*').where(data).del();

export const getPlaygroundsByCoords = (data) => knex.select('*').from('playgrounds').where(data);

export const createPlaygroundByData = (data) => knex.insert(data).into('playgrounds').returning('*');

export const createImagesByData = (data) => knex.insert(data).into('images').returning('*');

export const getImageMetaDataById = async (id) => await knex.first('*').from('images').where('id', id);

export const getPlaygroundsByCreatorId = (id) => knex.select('*').from('playgrounds').where('created_by', id);

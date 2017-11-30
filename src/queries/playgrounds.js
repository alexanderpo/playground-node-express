import knex from '../../config';

export const getAllPlaygrounds = () => knex.select('*').from('playgrounds');

export const getPlaygroundById = (id) => knex.first('*').from('playgrounds').where('id', id);

export const getUserFavoritePlaygroundsByUserId = (id) => knex('users_favorite_playgrounds').select('playground_id').where('user_id', id);

export const getFavoritePlaygrounds = (data) => knex('users_favorite_playgrounds').select('*').where(data);

export const updateFavoritePlayground = (data) => knex('users_favorite_playgrounds').insert(data);

export const deleteFavoritePlayground = (data) => knex('users_favorite_playgrounds').select('*').where(data).del();

export const getPlaygroundsByCoords = (data) => knex.select('*').from('playgrounds').where(data);

export const createPlaygroundByData = (data) => knex.insert(data).into('playgrounds').returning('*');

export const createImagesByData = (data) => knex.insert(data).into('images').returning('*');

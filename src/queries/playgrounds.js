import knex from '../../config';

export const getAllPlaygrounds = () => knex.select('*').from('playgrounds');

export const getPlaygroundById = (id) => knex.first('*').from('playgrounds').where('id', id);

export const getUserFavoritePlaygroundsByUserId = (id) => knex('users_favorite_playgrounds').select('playground_id').where('user_id', id);

export const getFavoritePlaygrounds = (data) => knex('users_favorite_playgrounds').select('*').where(data);

export const updateFavoritePlayground = (data) => knex('users_favorite_playgrounds').insert(data);

export const deleteFavoritePlayground = (data) => knex('users_favorite_playgrounds').select('*').where(data).del();

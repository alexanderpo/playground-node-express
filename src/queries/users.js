import knex from '../../config';

export const createNewUser = (data) => knex.insert(data).into('users');

export const updateUserProfileById = (id, data) => knex.first('*').from('users').where('id', id).update(data).returning('*');

export const updateUserProfileImageById = (id, data) => knex.first('*').from('images').where('id', id).update(data).returning('*');

export const createUserProfileImage = (data) => knex.insert(data).into('images').returning('*');

export const getUserHashById = async (id) => await knex.first('hash').from('users').where('id', id);

export const getUserByEmail = (email) => knex.first('*').from('users').where('email', email);

export const getImageById = (id) => knex('images').select('*').where('id', id);

import knex from '../../config';

export const createNewUser = (data) => knex.insert(data).into('users');

export const updateUserProfileById = (id, data) => knex.first('*').from('users').where('id', id).update(data).returning('*');

export const createUserProfileImage = (data) => knex.insert(data).into('images').returning('*');

export const getUserHashById = async (id) => await knex.first('hash').from('users').where('id', id);

export const getUserByEmail = (email) => knex.first('*').from('users').where('email', email);

export const getUserById = (id) => knex.first('*').from('users').where('id', id);

export const getImageMinioIdByPgId = (id) => knex('images').first('minio_id').where('id', id);

export const getImageMetaDataById = async (id) => await knex('images').first('*').where('id', id);

export const createImageByData = (data) => knex.insert(data).into('images').returning('*');

export const updateImageById = (id, data) => knex.first('*').from('images').where('id', id).update(data).returning('*');

export const updateImageInUserProfile = (id, newImageId) => knex.first('*').from('users').where('id', id).update({ image: newImageId }).returning('*');

export const getCreatedEventsCountByUserId = (id) => knex('events').first().where('creator_id', id).count();

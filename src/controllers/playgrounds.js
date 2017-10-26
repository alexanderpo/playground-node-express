import knex from '../../config';
import _ from 'lodash';
import { createPlaygroundSchema, updatePlaygroundSchema } from '../utils/validateSchemas';
import { validate } from '../utils/validation';

export const createPlayground = (req, res) => {
  const { name, description, address, images, latitude, longitude, creator } = req.body;
  const values = { name, description, address, images, latitude, longitude, creator };
  const validateResult = validate(createPlaygroundSchema, values);

  // TODO: implement load images in to database

  if (_.isEmpty(validateResult)) {
    knex.select('*').from('playgrounds').where('name', name).then((playground) => {
      if(_.isEmpty(playground)) {
        const newPlayground = {
          name: name,
          description: description,
          address: address,
          images: images,
          latitude: latitude,
          longitude: longitude,
          creator: creator, // email address
          created_at: new Date(),
          updated_at: new Date(),
        };
        knex.insert(newPlayground).into('playgrounds').returning('*').then((playground) => {
          res.json(playground);
        });
      } else {
        res.json({
          warning: 'This playground already created',
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

export const getPlaygrounds = (req, res) => {
  knex.select('*').from('playgrounds').then((playgrounds) => {
    if (_.isEmpty(playgrounds)) {
      res.json({
        warning: 'Playgrounds not found',
      });
    } else {
      res.json(playgrounds);
    }
  })
  .catch((err) => {
    console.log(err);
    res.json({
      error: err,
    });
  });
};

export const getSinglePlayground = (req, res) => {
  const id = req.params.id;

  knex.first('*').from('playgrounds').where('id', id).then((playground) => {
    if (_.isEmpty(playground)) {
      res.json({
        warning: 'Playground does\'t exist',
      });
    } else {
      res.json(playground);
    }
  })
  .catch((err) => {
    console.log(err);
    res.json({
      error: err,
    });
  });
};

export const updatePlayground = (req, res) => {
  const id = req.params.id;
  const { name, description, address, images, latitude, longitude } = req.body;
  const values = { name, description, address, images, latitude, longitude };
  const validateResult = validate(updatePlaygroundSchema, values);
  const data = {
    name: name,
    description: description,
    address: address,
    images: images,
    latitude: latitude,
    longitude: longitude,
    updated_at: new Date(),
  };

  if (_.isEmpty(validateResult)) {
    knex.first('*').from('playgrounds').where('id', id).update(data).returning('*').then((playground) => {
      if (!_.isEmpty(playground)) {
        res.json(playground);
      } else {
        res.json({
          warning: 'Nothing to update',
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

export const deletePlayground = (req, res) => {
  const id = req.params.id;

  knex.first('*').from('playgrounds').where('id', id).del().then((count) => {
    if (count !== 0) {
      res.json({
        message: `Delete ${count} playground`,
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
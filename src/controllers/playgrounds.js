import knex from '../../config';
import _ from 'lodash';
import {
  getAllPlaygrounds,
  getPlaygroundById,
  getPlaygroundsByCoords,
  createPlaygroundByData,
  createImagesByData,
  getImageMetaDataById,
  getPlaygroundByIdWithMinioId,
} from '../queries/playgrounds';
import { createPlaygroundSchema, updatePlaygroundSchema } from '../utils/validateSchemas';
import { validate } from '../utils/validation';

export const createPlayground = (req, res) => {
  const { name, description, address, images, latitude, longitude, creator } = req.body;
  const values = { name, description, address, latitude, longitude, creator };
  const validateResult = validate(createPlaygroundSchema, values);

  const coords = {
    latitude: latitude,
    longitude: longitude,
  };

  if (_.isEmpty(validateResult)) {
    getPlaygroundsByCoords(coords).then((playground) => {
      if(_.isEmpty(playground)) {
        const pgImages = !_.isEmpty(images) ? images.map((image) => ({
          minio_id: image.id,
          original_name: image.originalName,
        })) : [];

        createImagesByData(pgImages).then((images) => {
          const imagesIds = (images.rowCount !== null) ? images.map(image => image.id) : [];
          const newPlayground = {
            name: name,
            description: description,
            address: address,
            images: imagesIds,
            latitude: latitude,
            longitude: longitude,
            creator: creator, // email address
            created_at: new Date(),
            updated_at: new Date(),
          };
          createPlaygroundByData(newPlayground).then((playground) => {
            res.json(playground);
          });
        });
      } else {
        res.json({
          error: 'Playground on this place already created',
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
  getAllPlaygrounds().then((playgrounds) => {
    if (_.isEmpty(playgrounds)) {
      res.json({
        warning: 'Playgrounds not found',
      });
    } else {
      const playgroundsWithMinioIds = playgrounds.map(playground => getPlaygroundByIdWithMinioId(playground.id));
      Promise.all(playgroundsWithMinioIds).then((results) => {
        res.status(200).json(results);
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

export const getSinglePlayground = (req, res) => {
  const id = req.params.id;

  getPlaygroundById(id).then((playground) => {
    if (_.isEmpty(playground)) {
      res.json({
        error: 'Playground does\'t exist',
      });
    } else {
      const imagesIds = playground.images;
      const imagesMetaDataPromises = imagesIds.map(id => getImageMetaDataById(id));

      Promise.all(imagesMetaDataPromises).then((results) => {
        const minioIds = results.map(result => result.minio_id);
        const detailPlayground = Object.assign({}, playground, {
          images: minioIds,
        });
        res.status(200).json([detailPlayground]);
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

export const deletePlayground = async (req, res) => {
  const id = req.params.id;
  const getEventsQuery = knex.select().from('events').where('playground_id', id);
  const isIncludeEventsPlayground = await getEventsQuery.then((result) => {
    if (_.isEmpty(result)) { return false; } else { return true; }
  });
  const deleteUserFavoritePromise = (id) => knex.select('*').from('users_favorite_playgrounds').where('playground_id', id).del();
  const deletePlaygroundPromise = (id) => knex.first('*').from('playgrounds').where('id', id).del();

  if (isIncludeEventsPlayground) {
    res.json({
      warning: 'You can\'t remove this playground because it\'s in event',
    });
  } else {
    Promise.all([deleteUserFavoritePromise(id), deletePlaygroundPromise(id)]).then((result) => {
      if (result[1] !== 0 ) {
        res.json({
          message: 'Successfully deleted',
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
  }
};

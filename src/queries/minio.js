import uuid from 'uuid/v1';
import minioClient from '../../minio';

export const uploadImage = (buffer) => new Promise((resolve, reject) => {
  const imageId = uuid();
  minioClient.putObject('playgrounds-images', imageId, buffer, (err) => {
    if (err) {
      return reject(err);
    }
    return resolve(imageId);
  });
});

export const getImageById = (imageId) => new Promise((resolve, reject) => {
  minioClient.getObject('playgrounds-images', imageId, (err, imageStream) => {
    if (err) {
      return reject(err);
    }
    return resolve(imageStream);
  });
});

export const removeImageById = (imageId) => new Promise((resolve, reject) => {
  minioClient.removeObject('playgrounds-images', imageId, (err) => {
    if (err) {
      return reject(err);
    }
    return resolve(true);
  });
});

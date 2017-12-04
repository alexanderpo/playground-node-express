import {
  uploadImage,
  getImageById,
  removeImageById,
} from '../queries/minio';

export const createImage = async (req, res) => {
  const { file } = req;
  const imageId = await uploadImage(file.buffer);

  return res.status(201).json({
    id: imageId,
    originalName: file.originalname,
  });
};

export const getImage = async (req, res) => {
  const { imageId } = req.params;
  const imageStream = await getImageById(imageId);

  return imageStream.pipe(res);
};

export const deleteImage = async (req, res) => {
  const imageId = req.params.imageId;
  const response = await removeImageById(imageId);
  return res.status(200).json(response);
};

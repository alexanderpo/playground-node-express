import Joi from 'joi';

export const signInSchema = Joi.object().keys({
  email: Joi.string().email().required().label('Email'),
  password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required().label('Password'),
});

export const signUpSchema = Joi.object().keys({
  email: Joi.string().email().required().label('Email'),
  password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).required().label('Password'),
  repeatPassword: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/)
    .valid(Joi.ref('password')).required()
    .options({ language: { any: { allowOnly: 'Passwords must match' } } }).label('Repeat password'),
});

export const updateUserProfileSchema = Joi.object().keys({
  name: Joi.string().min(3).max(120).label('User name'),
  phone: Joi.string().regex(/^\+375\((17|25|29|33|44)\)[0-9]{3}-[0-9]{2}-[0-9]{2}$/).required().label('Phone number'),
  image: Joi.string().label('Profile image'),
  password: Joi.string().regex(/^[a-zA-Z0-9]{3,30}$/).label('Password'),
});

export const createPlaygroundSchema = Joi.object().keys({
  name: Joi.string().min(6).max(120).required().label('Playground title'),
  description: Joi.string().min(5).max(600).required().label('Playground description'),
  address: Joi.string().min(5).max(100).required().label('Playground address'),
  images: Joi.array().items(Joi.string()).label('Playground images'),
  latitude: Joi.number().min(0).max(90).required().label('Latitude'),
  longitude: Joi.number().min(-180).max(180).required().label('Longitude'),
  creator: Joi.string().email().required().label('Playground creator'),
});

export const updatePlaygroundSchema = Joi.object().keys({
  name: Joi.string().min(6).max(120).label('Playground title'),
  description: Joi.string().min(5).max(600).label('Playground description'),
  address: Joi.string().min(5).max(100).label('Playground address'),
  images: Joi.array().items(Joi.string()).label('Playground images'),
  latitude: Joi.number().min(0).max(90).label('Latitude'),
  longitude: Joi.number().min(-180).max(180).label('Longitude'),
  creator: Joi.string().email().label('Playground creator'),
});

export const createEventSchema = Joi.object().keys({
  title: Joi.string().min(6).max(120).required().label('Event title'),
  datetime: Joi.date().iso().required().label('Event date'),
});

export const updateEventSchema = Joi.object().keys({
  title: Joi.string().min(6).max(120).label('Event title'),
  datetime: Joi.date().iso().label('Event date'),
});

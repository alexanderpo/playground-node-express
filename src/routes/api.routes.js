import { Router } from 'express';
import multer from 'multer';
import { signIn, signUp } from '../controllers/sign';
import {
  updateUserProfile,
  getUserEvents,
  userFavoritePlaygroundControl,
  subscribeEventControl,
  getUserPlaygrounds,
  getUserFavoritePlaygrounds,
  getUpcomingEvents,
  updateUserProfileImage,
  getOrganisedEvents,
} from '../controllers/users';
import {
  getPlaygrounds,
  getSinglePlayground,
  createPlayground,
  updatePlayground,
  deletePlayground,
} from '../controllers/playgrounds';
import {
  getEvents,
  createEvent,
  getSingleEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/events';
import {
  createImage,
  getImage,
  deleteImage,
} from '../controllers/images';

const apiRouter = Router();
const upload = multer({ storage: multer.memoryStorage() });

/* Images */

apiRouter.post('/images', upload.single('image'), createImage);

apiRouter.delete('/images/:imageId', deleteImage);

apiRouter.get('/images/:imageId', getImage);

/* Sign routes */
apiRouter.post('/signin', signIn);

apiRouter.post('/signup', signUp);

/* Users routes */
apiRouter.put('/users/:id', updateUserProfile);

apiRouter.put('/users/:id/image', updateUserProfileImage);

apiRouter.get('/users/:id/events', getUserEvents);

apiRouter.post('/users/events/subscribe', subscribeEventControl);

apiRouter.get('/users/:id/events/upcoming', getUpcomingEvents);

apiRouter.post('/users/favorite/playground', userFavoritePlaygroundControl);

apiRouter.get('/users/:id/playgrounds', getUserPlaygrounds);

apiRouter.get('/users/:id/favorite/playgrounds', getUserFavoritePlaygrounds);

apiRouter.get('/users/:id/events/organised', getOrganisedEvents);

/* Playgrounds routes */
apiRouter.get('/playgrounds', getPlaygrounds);

apiRouter.get('/playgrounds/:id', getSinglePlayground);

apiRouter.post('/playgrounds', createPlayground);

apiRouter.put('/playgrounds/:id', updatePlayground);

apiRouter.delete('/playgrounds/:id', deletePlayground);

/* Events routes */
apiRouter.get('/events', getEvents);

apiRouter.get('/events/:id', getSingleEvent);

apiRouter.post('/events', createEvent);

apiRouter.put('/events/:id', updateEvent);

apiRouter.delete('/events/:id', deleteEvent);

export default apiRouter;

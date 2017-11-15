import { Router } from 'express';
import { signIn, signUp } from '../controllers/sign';
import {
  updateUserProfile,
  getUserEvents,
  userFavoritePlaygroundControl,
  subscribeEventControl,
  getUserFavoritePlaygrounds,
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

const apiRouter = Router();

/* Sign routes */
apiRouter.post('/signin', signIn);

apiRouter.post('/signup', signUp);

/* Users routes */
apiRouter.put('/users/:id', updateUserProfile);

apiRouter.get('/users/:id/events', getUserEvents);

apiRouter.post('/users/events/subscribe', subscribeEventControl);

apiRouter.post('/users/favorite/playground', userFavoritePlaygroundControl);

apiRouter.get('/users/:id/favorite/playgrounds', getUserFavoritePlaygrounds);

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

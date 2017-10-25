import { Router } from 'express';
import { signIn, signUp } from '../controllers/sign';
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
apiRouter.put('/users/:id', (req, res) => {
  res.send('update user profile');
});

apiRouter.get('/users/:id/events', (req, res) => {
  res.send('get users events');
});

apiRouter.post('/users/favorite/playgrounds', (req, res) => {
  res.send('added playground to favorite');
});

apiRouter.get('/users/:id/favorite/playgrounds', (req, res) => {
  res.send('get user favorite playgrounds');
});

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

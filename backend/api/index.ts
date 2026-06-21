import app from '../src/server';

export const config = {
  api: {
    bodyParser: false,
  },
  maxDuration: 60,
};

export default app;

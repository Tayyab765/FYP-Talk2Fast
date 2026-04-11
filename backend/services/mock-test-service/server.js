import 'dotenv/config';
import http from 'http';
import app from './src/app.js';
import { connectToMongo } from './src/config/mongoClient.js';

const PORT = process.env.PORT || 5005;

async function start() {
  await connectToMongo();

  const server = http.createServer(app);
  server.listen(PORT, () => {
    console.log(`🧪 Mock Test Service listening on port ${PORT}`);
  });
}

start().catch(err => {
  console.error('Failed to start mock test service', err);
  process.exit(1);
});

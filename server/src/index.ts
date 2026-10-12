import { app } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

async function bootstrap() {
  try {
    await connectDB();
    const server = app.listen(env.PORT, '0.0.0.0', () => {
      console.log(`===============================================`);
      console.log(` FreshStock Backend running on http://localhost:${env.PORT}`);
      console.log(` API Health Check: http://localhost:${env.PORT}/api/health`);
      console.log(` Swagger Docs:     http://localhost:${env.PORT}/api/docs`);
      console.log(`===============================================`);
    });

    const shutdown = async () => {
      console.log('\nShutting down FreshStock server gracefully...');
      server.close(() => {
        console.log('HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();

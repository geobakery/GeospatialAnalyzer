import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { checkTopic, setUpOpenAPIAndValidation } from './app-init';
import { AppModule } from './app.module';

async function bootstrap() {
  await checkTopic();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: process.env.geospatial_analyzer_payload
        ? Number(process.env.geospatial_analyzer_payload)
        : 1048576,
    }),
  );
  app.enableVersioning({
    type: VersioningType.URI,
  });

  await setUpOpenAPIAndValidation(app);

  // graceful shutdown handler
  const shutdown = async (signal: string) => {
    console.log(`Got termination signal: ${signal}`);
    try {
      await app.close();
      process.exit(0);
    } catch (err) {
      console.error('Error closing the app:', err);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  await app.listen(3000, '0.0.0.0');
}

void bootstrap();

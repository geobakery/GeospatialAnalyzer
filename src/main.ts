import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { checkTopic, setUpOpenAPIAndValidation } from './app-init';
import { AppModule } from './app.module';
import cors from '@fastify/cors';

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

  // Register the CORS plugin and allow requests from http://localhost:5173
  app.register(cors, {
    origin: 'http://localhost:5173',
  });

  await app.listen(3000, '0.0.0.0');
}

void bootstrap();

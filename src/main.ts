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

  await app.listen(3000, '0.0.0.0');
}

void bootstrap();

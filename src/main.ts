import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { checkTopic, setUpOpenAPIAndValidation } from './app-init';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  await checkTopic();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      bodyLimit: process.env.GEOSPATIAL_ANALYZER_PAYLOAD
        ? Number(process.env.GEOSPATIAL_ANALYZER_PAYLOAD)
        : 1048576,
    }),
  );

  const configService = app.get(ConfigService);
  const urlPrefix = configService.get("GEOSPATIAL_ANALYZER_URL_PREFIX");
  if (urlPrefix) app.setGlobalPrefix(urlPrefix);
  
  app.enableVersioning({
    type: VersioningType.URI,
  });

  await setUpOpenAPIAndValidation(app, urlPrefix);

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

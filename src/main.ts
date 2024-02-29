import { VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import * as fs from 'fs';
import { join } from 'path';
import { setUpOpenAPIAndValidation } from './app-init';
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

async function checkTopic(): Promise<void> {
  const fileExists = async (path) =>
    !!(await fs.promises.stat(path).catch(() => false));

  const exist = await fileExists(join(__dirname, './../topic.json'));
  if (!exist) {
    console.warn(
      'No topic.json defined. Please read the README (chapter configuration) and add the specific configuration file. A default one will be added.',
    );
    await copyTopic(__dirname);
  }
  return;
}

async function copyTopic(dirPath: string): Promise<void> {
  fs.copyFile(
    join(dirPath, './../topic-example-geosn.json'),
    join(dirPath, './../topic.json'),
    (err) => {
      if (err) {
        console.log('Error Found:', err);
        process.exit(1);
      }
    },
  );
}

bootstrap();

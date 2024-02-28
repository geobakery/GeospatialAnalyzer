import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpStatus, ValidationPipe, VersioningType } from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';

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

  const config = new DocumentBuilder()
    .setTitle('GeospatialAnalyzer')
    .setDescription('API description')
    .setVersion('1.2.15')
    .addTag('Geobakery')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(
    new ValidationPipe({ errorHttpStatusCode: HttpStatus.BAD_REQUEST }),
  );

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

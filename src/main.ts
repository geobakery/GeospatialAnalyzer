import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import type { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import inputValidation from 'openapi-validator-middleware';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { join } from 'path';
import * as fs from 'fs';

@Catch(inputValidation.InputValidationError)
class InputValidationErrorHandler implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost): any {
    return host
      .switchToHttp()
      .getResponse()
      .status(400)
      .send({ more_info: exception.errors });
  }
}

async function bootstrap() {
  await checkTopic();
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
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

  // Pretty Hacky: We want to reject all properties not defined in our DTOs. It seems we cannot set the OpenAPI flag
  // via NestJS' decorators, so we set it on the parsed document instead.
  Object.entries(document.components.schemas)
    // Skip { $ref } schemas since we cannot configure anything about them.
    .filter(
      (schema): schema is [string, SchemaObject] => !('$ref' in schema[1]),
    )
    .forEach(([schemaName, schema]) => {
      // As of writing this, `additionalProperties` had never been set. If it happens to be set now, something about
      // NestJS' OpenAPI integration must have changed, and we need to review this approach.
      if ('additionalProperties' in schema)
        throw new Error(
          `Unexpected OpenAPI schema: ${schemaName}.additionalProperties should not be set at this point`,
        );

      schema.additionalProperties = false;
    });

  SwaggerModule.setup('api', app, document);

  inputValidation.init(document, {
    beautifyErrors: true,
    framework: 'fastify',
  });
  await app.register(inputValidation.validate({}));
  app.useGlobalFilters(new InputValidationErrorHandler());

  // For input validation, we use `openapi-validator-middleware`. However, we still want to transform the input objects
  // to actual class instances, so we still use ValidationPipe's for its `class-transformer` integration but disable its
  // `class-validator` integration.
  app.useGlobalPipes(
    new ValidationPipe({ validatorPackage: { validate: () => [] } }),
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

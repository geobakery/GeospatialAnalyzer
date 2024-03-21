import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ValidationPipe,
} from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';
import fs from 'node:fs/promises';
import inputValidation, {
  ErrorDetails,
  InputValidationError,
} from 'openapi-validator-middleware';
import { join } from 'path';
import * as process from 'process';

@Catch(inputValidation.InputValidationError)
class InputValidationErrorHandler
  implements ExceptionFilter<inputValidation.InputValidationError>
{
  catch(exception: InputValidationError, host: ArgumentsHost): void {
    let errorOutput = exception.errors;
    // If errors are about the input geometry, add notice as first element for invalid input

    const anyInputGeometryError = exception.errors.some(
      (e: string | ErrorDetails) => {
        if (typeof e === 'string') {
          return e.includes('body/inputGeometries');
        }
      },
    );
    if (anyInputGeometryError) {
      errorOutput = [
        'Invalid geometry input. Check the possible following errors. For help have a look at the schema definition of the swagger OpenAPI documentation.',
      ];
      errorOutput.push(...exception.errors);
    }

    return host.switchToHttp().getResponse().status(400).send({
      statusCode: 400,
      message: 'Invalid user input',
      detailed_errors: errorOutput,
    });
  }
}

async function checkFile(
  fileName: string,
  pathToExample: string,
  errorString: string,
): Promise<void> {
  const fileExists = async (path: string) =>
    !!(await fs.stat(path).catch(() => false));

  const exist = await fileExists(join(__dirname, './../' + fileName));
  if (!exist) {
    console.warn(errorString);
    await createDefaultFile(fileName, pathToExample);

    await new Promise((resolve) => setTimeout(() => resolve(true), 1000));
  }
  return;
}

async function readDescription(): Promise<string> {
  await checkDescription();
  return fs.readFile('./swagger-description.md', 'utf8');
}

async function checkDescription() {
  const warning =
    'No swagger-description.md ist defined. Please read the README and add the specific description file. A default one will be added.';
  await checkFile(
    'swagger-description.md',
    'swagger-description-example.md',
    warning,
  );
}

export async function checkTopic(): Promise<void> {
  const warning =
    'No topic.json defined. Please read the README (chapter configuration) and add the specific configuration file. A default one will be added.';
  await checkFile('topic.json', 'topic-example-geosn.json', warning);
}

async function createDefaultFile(
  targetFile: string,
  exampleFile: string,
): Promise<void> {
  await fs
    .copyFile(
      join(__dirname, './../' + exampleFile),
      join(__dirname, './../' + targetFile),
    )
    .catch((err) => {
      console.error('Error Found:', err);
      process.exit(1);
    });
}

export async function setUpOpenAPIAndValidation(
  app: NestFastifyApplication,
): Promise<void> {
  const config = new DocumentBuilder()
    .setTitle(
      process.env.geospatial_analyzer_swagger_document_title ||
        'GeospatialAnalyzer',
    )
    .setDescription((await readDescription()) || 'API description')
    .setVersion(process.env.geospatial_analyzer_swagger_version || '1.0')
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

      // allow esriJSON to have additionalProperties for user friendly usage
      schema.additionalProperties = schemaName.includes('Esri');
    });

  SwaggerModule.setup('api', app, document);

  // Set beautifyErrors to false for schemaPath information
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
    new ValidationPipe({
      transform: true,
      validatorPackage: { validate: () => [] },
    }),
  );
}

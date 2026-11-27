import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ValidationPipe,
} from '@nestjs/common';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { SchemaObject } from './general/types/swagger-schema';
import fs from 'node:fs/promises';
import inputValidation, {
  ErrorDetails,
  InputValidationError,
} from 'openapi-validator-middleware';
import { join } from 'path';
import * as process from 'process';
import * as yaml from 'js-yaml';
import fastifyStatic from '@fastify/static';

@Catch(inputValidation.InputValidationError)
class InputValidationErrorHandler implements ExceptionFilter<inputValidation.InputValidationError> {
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
  errorString: string,
  defaultFileName?: string,
): Promise<void> {
  const fileExists = async (path: string) =>
    !!(await fs.stat(path).catch(() => false));

  const exist = await fileExists(join(__dirname, './../' + fileName));
  if (!exist) {
    if (defaultFileName) {
      console.warn(errorString);
      await createFromDefaultFile(fileName, defaultFileName);

      await new Promise((resolve) => setTimeout(() => resolve(true), 1000));
    } else {
      console.error(errorString);
      process.exit(1);
    }
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
    warning,
    'swagger-description-example.md',
  );
}

export async function checkTopic(): Promise<void> {
  const error =
    'No topic.json defined. Please read the README (chapter configuration) and add the specific configuration file.';
  await checkFile('topic.json', error);
}

async function createFromDefaultFile(
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

/**
 * Customize Swagger UI's response body rendering to pretty-print JSON while preserving trailing decimal places.
 * For example, JSON.parse/stringify would turn 1.0 into 1, whereas this formatter keeps the original representation.
 */

const rawJsonResponsePlugin = (system: any) => {
  const formatJsonPreservingNumbers = (json: string): string => {
    let result = '';
    let indent = 0;
    let inString = false;
    let escaped = false;

    const newline = () => {
      result += '\n' + '  '.repeat(indent);
    };

    for (let i = 0; i < json.length; i++) {
      const char = json[i];

      if (inString) {
        result += char;

        if (escaped) {
          escaped = false;
        } else if (char === '\\') {
          escaped = true;
        } else if (char === '"') {
          inString = false;
        }

        continue;
      }

      switch (char) {
        case '"':
          inString = true;
          result += char;
          break;

        case '{':
        case '[':
          result += char;
          indent++;
          newline();
          break;

        case '}':
        case ']':
          indent--;
          result = result.trimEnd();
          newline();
          result += char;
          break;

        case ',':
          result += char;
          newline();
          break;

        case ':':
          result += ': ';
          break;

        default:
          if (!/\s/.test(char)) {
            result += char;
          }
      }
    }

    return result;
  };

  return {
    wrapComponents: {
      responseBody: (Original: any) => (props: any) => {
        const isJson = /json/i.test(props.contentType ?? '');

        if (!isJson || typeof props.content !== 'string') {
          return system.React.createElement(Original, props);
        }

        const HighlightCode = props.getComponent('HighlightCode', true);

        return system.React.createElement(
          'div',
          null,
          system.React.createElement('h5', null, 'Response body'),
          system.React.createElement(
            HighlightCode,
            {
              language: 'json',
              downloadable: true,
              fileName: 'response.json',
              canCopy: true,
            },
            formatJsonPreservingNumbers(props.content),
          ),
        );
      },
    },
  };
};

export async function setUpOpenAPIAndValidation(
  app: NestFastifyApplication,
  urlPrefix: string = '',
): Promise<void> {
  const config = new DocumentBuilder()
    .setTitle(
      process.env.GEOSPATIAL_ANALYZER_SWAGGER_DOCUMENT_TITLE ||
        'GeospatialAnalyzer',
    )
    .setDescription((await readDescription()) || 'API description')
    .setVersion(process.env.GEOSPATIAL_ANALYZER_SWAGGER_VERSION || '1.0')
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

  SwaggerModule.setup('api', app, document, {
    useGlobalPrefix: true,
    swaggerOptions: {
      plugins: [rawJsonResponsePlugin],
    } as any,
  });

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

  // Write OpenAPI artifacts and serve as static files (openapi.json, openapi.yaml)
  // Resulting URL: `/<prefix?>/v{major}/openapi.yaml`
  try {
    const outDir = join(process.cwd(), 'public');
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(
      join(outDir, 'openapi.json'),
      JSON.stringify(document, null, 2),
      'utf8',
    );
    await fs.writeFile(
      join(outDir, 'openapi.yaml'),
      yaml.dump(document),
      'utf8',
    );

    const prefix = urlPrefix ? `/${urlPrefix.replace(/^\/+|\/+$/g, '')}` : '';
    const major = document.info.version.split('.')[0].replace(/\D/g, '') || '1';
    await app.register(fastifyStatic, {
      root: outDir,
      prefix: `${prefix}/v${major}/`,
    });
  } catch (err) {
    console.warn('Failed to write or serve OpenAPI static files:', err);
  }
}

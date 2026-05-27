import type { OpenAPIObject } from '@nestjs/swagger';

type ComponentSchemas = NonNullable<
  NonNullable<OpenAPIObject['components']>['schemas']
>;

export type SchemaObject = Exclude<ComponentSchemas[string], { $ref: string }>;

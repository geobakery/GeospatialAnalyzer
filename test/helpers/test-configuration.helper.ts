import { ConfigModule } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Jest-compatible configuration function that loads topic.json configuration
 * Uses require() instead of dynamic import() for Jest compatibility
 */
export async function createTestConfiguration() {
  await checkTopic();
  // Use require instead of dynamic import for Jest compatibility
  const topicJsonPath = path.join(process.cwd(), 'topic.json');
  const topicConfig = require(topicJsonPath);
  return topicConfig as Record<string, any>;
}

/**
 * Checks if topic.json exists and creates it from example if needed
 */
async function checkTopic(): Promise<void> {
  try {
    const fileExists = async (filePath: string) =>
      !!(await fs.promises.stat(filePath).catch(() => false));

    const topicJsonPath = path.join(process.cwd(), 'topic.json');
    const exist = await fileExists(topicJsonPath);
    if (!exist) {
      console.warn(
        'No topic.json defined. Please read the README (chapter configuration) and add the specific configuration file. A default one will be added.',
      );
      await copyTopic();
    }
  } catch (error) {
    console.error('Error during topic.json validation:', error);
    console.error('Failed to check or create topic.json file. This may cause configuration issues.');
    // Don't re-throw to maintain compatibility with original behavior
  }
  return;
}

/**
 * Copies the example topic file to topic.json synchronously
 */
async function copyTopic(): Promise<void> {
  const sourceFile = path.join(process.cwd(), 'topic-example-geosn.json');
  const targetFile = path.join(process.cwd(), 'topic.json');
  
  try {
    // Check if source file exists before attempting copy
    if (!fs.existsSync(sourceFile)) {
      console.error(`Source file not found: ${sourceFile}`);
      console.error('Cannot create topic.json from example. Please ensure topic-example-geosn.json exists.');
      process.exit(1);
    }
    
    // Use synchronous copy to ensure file is available immediately
    fs.copyFileSync(sourceFile, targetFile);
    console.log(`Successfully created topic.json from ${sourceFile}`);
  } catch (err) {
    console.error('Error copying topic configuration file:');
    console.error(`  Source: ${sourceFile}`);
    console.error(`  Target: ${targetFile}`);
    console.error(`  Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

/**
 * Creates a configuration module for tests that includes topic.json validation and loading
 * This ensures topic.json validation and fallback behavior is consistent with the main app
 */
export function createTestConfigModule() {
  return ConfigModule.forRoot({
    envFilePath: ['.env.test', '.env'],
    load: [createTestConfiguration],
    isGlobal: true,
  });
}
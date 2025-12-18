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
      console.error('No topic.json defined. Please read the README (chapter configuration) and add the specific configuration file.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error during topic.json validation:', error);
    console.error('Failed to check or create topic.json file. This may cause configuration issues.');
    // Don't re-throw to maintain compatibility with original behavior
  }
  return;
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
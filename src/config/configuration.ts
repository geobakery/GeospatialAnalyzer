// import * as topic from '../../topic.json';
import fs from 'fs';
import { join } from 'path';

export default async () => {
  await checkTopic();
  return import('../../topic.json').then((topic) => {
    return topic as Record<string, any>;
  });
};

async function checkTopic(): Promise<void> {
  try {
    const fileExists = async (path: string) =>
      !!(await fs.promises.stat(path).catch(() => false));

    const exist = await fileExists(join(__dirname, './../../topic.json'));
    if (!exist) {
      console.warn(
        'No topic.json defined. Please read the README (chapter configuration) and add the specific configuration file. A default one will be added.',
      );
      await copyTopic(__dirname);
    }
  } catch (error) {
    console.error('Error during topic.json validation:', error);
    console.error('Failed to check or create topic.json file. This may cause configuration issues.');
    // Don't re-throw to maintain compatibility with original behavior
  }
  return;
}

async function copyTopic(dirPath: string): Promise<void> {
  const sourceFile = join(dirPath, './../../topic-example-geosn.json');
  const targetFile = join(dirPath, './../../topic.json');
  
  try {
    // Check if source file exists before attempting copy
    if (!fs.existsSync(sourceFile)) {
      console.error(`Source file not found: ${sourceFile}`);
      console.error('Cannot create topic.json from example. Please ensure topic-example-geosn.json exists.');
      process.exit(1);
    }
    
    // Use callback-based copy for async operation
    fs.copyFile(sourceFile, targetFile, (err) => {
      if (err) {
        console.error('Error copying topic configuration file:');
        console.error(`  Source: ${sourceFile}`);
        console.error(`  Target: ${targetFile}`);
        console.error(`  Error: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
      } else {
        console.log(`Successfully created topic.json from ${sourceFile}`);
      }
    });
  } catch (err) {
    console.error('Error copying topic configuration file:');
    console.error(`  Source: ${sourceFile}`);
    console.error(`  Target: ${targetFile}`);
    console.error(`  Error: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

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
      console.error(
        'No topic.json defined. Please read the README (chapter configuration) and add the specific configuration file.',
      );
      process.exit(1);
    }
  } catch (error) {
    console.error('Error during topic.json validation:', error);
    console.error('Failed to check or create topic.json file. This may cause configuration issues.');
    // Don't re-throw to maintain compatibility with original behavior
  }
  return;
}


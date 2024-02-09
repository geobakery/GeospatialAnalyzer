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
    const fileExists = async (path) =>
      !!(await fs.promises.stat(path).catch(() => false));

    const exist = await fileExists(join(__dirname, './../../topic.json'));
    if (!exist) {
      console.warn(
        'No topic.json defined. Please read the README (chapter configuration) and add the specific configuration file. A default one will be added.',
      );
      await copyTopic(__dirname);
    }
  } catch (e) {
    //
  }
  return;
}

async function copyTopic(dirPath: string): Promise<void> {
  fs.copyFile(
    join(dirPath, './../../topic-example-geosn.json'),
    join(dirPath, './../../topic.json'),
    (err) => {
      if (err) {
        console.log('Error Found:', err);
        process.exit(1);
      }
    },
  );
}

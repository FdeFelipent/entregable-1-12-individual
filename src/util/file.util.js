import { readFile, writeFile } from 'node:fs/promises';

export async function readData(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

export async function writeData(filePath, data) {
  await writeFile(filePath, JSON.stringify(data, null, 2));
}
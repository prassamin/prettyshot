import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

function getTimestamp() {
  const now = new Date();
  const yyyy = now.getUTCFullYear();
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  const hh = String(now.getUTCHours()).padStart(2, '0');
  const mi = String(now.getUTCMinutes()).padStart(2, '0');
  const ss = String(now.getUTCSeconds()).padStart(2, '0');
  return `${yyyy}${mm}${dd}${hh}${mi}${ss}`;
}

function toSnakeCase(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/_{2,}/g, '_');
}

async function main() {
  const rawName = process.argv.slice(2).join(' ');

  if (!rawName) {
    console.error('Usage: pnpm db:new -- "migration_name"');
    process.exit(1);
  }

  const migrationName = toSnakeCase(rawName);
  if (!migrationName) {
    console.error('Migration name cannot be empty after normalization.');
    process.exit(1);
  }

  const name = `${getTimestamp()}_${migrationName}`;
  const migrationDir = join(process.cwd(), 'supabase', 'migrations');
  const migrationFile = join(migrationDir, `${name}.sql`);

  await mkdir(migrationDir, { recursive: true });
  await writeFile(
    migrationFile,
    '-- Write SQL manually in this file.\n',
    'utf8',
  );

  console.log(`Created ${migrationFile}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
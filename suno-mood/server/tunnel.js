import localtunnel from 'localtunnel';
import fs from 'fs';
import path from 'path';

async function main() {
  const random = Math.random().toString(36).slice(2, 8);
  const subdomain = `suno-mood-${random}`;
  const port = 3000;
  const outfile = path.join(process.cwd(), 'public_url.txt');

  const tunnel = await localtunnel({ port, subdomain });
  const url = tunnel.url;
  const line = `Public URL: ${url}\n`;
  process.stdout.write(line);
  try {
    fs.writeFileSync(outfile, url, 'utf8');
  } catch {}

  tunnel.on('close', () => {
    // Tunnel closed
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
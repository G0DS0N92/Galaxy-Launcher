import * as fs from 'fs';
import * as path from 'path';

async function downloadSkins() {
  const dir = path.join(process.cwd(), 'src', 'renderer', 'assets', 'skins');
  fs.mkdirSync(dir, { recursive: true });

  const steveRes = await fetch('https://minotar.net/skin/MHF_Steve');
  const steveBuf = Buffer.from(await steveRes.arrayBuffer());
  fs.writeFileSync(path.join(dir, 'steve.png'), steveBuf);
  console.log('Saved steve.png, size:', steveBuf.length);

  const alexRes = await fetch('https://minotar.net/skin/MHF_Alex');
  const alexBuf = Buffer.from(await alexRes.arrayBuffer());
  fs.writeFileSync(path.join(dir, 'alex.png'), alexBuf);
  console.log('Saved alex.png, size:', alexBuf.length);

  const tsContent = `// Official Minecraft Steve & Alex authentic 64x64 skins
export const STEVE_SKIN_BASE64 = "data:image/png;base64,${steveBuf.toString('base64')}";
export const ALEX_SKIN_BASE64 = "data:image/png;base64,${alexBuf.toString('base64')}";
`;
  fs.writeFileSync(path.join(dir, 'defaultSkins.ts'), tsContent, 'utf-8');
  console.log('Generated defaultSkins.ts successfully!');
}

downloadSkins();

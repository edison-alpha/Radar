import sharp from 'sharp';

for (const size of [192, 512]) {
  const inset = Math.round(size * 0.14);
  const icon = await sharp('public/radar-icon.png')
    .resize(size - inset * 2, size - inset * 2, { fit: 'contain' })
    .png()
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: '#131313' } })
    .composite([{ input: icon, gravity: 'centre' }])
    .png()
    .toFile(`public/pwa-${size}.png`);
}

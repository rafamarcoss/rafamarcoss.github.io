import { createGscClients } from './gsc-auth.mjs';

const SITE_URL = 'https://rafaelmarcos.tech/';
const SITEMAP_URL = `${SITE_URL}sitemap.xml`;

function errorMessage(error) {
  const status = error.response?.status;
  const detail = error.response?.data?.error?.message || error.message || 'Error desconocido';
  return status ? `HTTP ${status}: ${detail}` : detail;
}

try {
  const { webmasters } = createGscClients();
  await webmasters.sitemaps.submit({ siteUrl: SITE_URL, feedpath: SITEMAP_URL });
  console.log('[GSC] Sitemap submitted');
  console.log(`Property: ${SITE_URL}`);
  console.log(`Sitemap: ${SITEMAP_URL}`);
} catch (error) {
  if (error.response?.status === 409) {
    console.log('[GSC] Sitemap already submitted');
    console.log(`Property: ${SITE_URL}`);
    console.log(`Sitemap: ${SITEMAP_URL}`);
  } else {
    console.error(`[GSC] Sitemap submission failed: ${errorMessage(error)}`);
    process.exitCode = 1;
  }
}

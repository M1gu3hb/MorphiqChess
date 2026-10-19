import type { Plugin } from 'vite';

/**
 * Metadatos que dependen de la URL pública del sitio (canonical, Open Graph con imagen absoluta,
 * robots.txt y sitemap.xml). La URL no está escrita en ningún archivo: sale de la variable de entorno
 * SITE_URL o, en Vercel, del dominio de producción del proyecto (VERCEL_PROJECT_PRODUCTION_URL).
 * Así, al conectar un dominio propio no hay nada que editar en el código.
 */

/** Devuelve el origen sin barra final ("https://ejemplo.com"), o "" si no hay una URL http(s) válida. */
export function normalizeSiteUrl(raw: string | undefined): string {
  const value = raw?.trim();
  if (!value) return '';
  const withScheme = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return '';
    return url.origin;
  } catch {
    return '';
  }
}

/** Elige la URL del sitio según el entorno de compilación. */
export function resolveSiteUrl(env: Readonly<Record<string, string | undefined>>): string {
  const explicit = normalizeSiteUrl(env.SITE_URL);
  if (explicit) return explicit;
  return normalizeSiteUrl(env.VERCEL_PROJECT_PRODUCTION_URL);
}

export function robotsTxt(siteUrl: string): string {
  const lines = ['User-agent: *', 'Allow: /'];
  if (siteUrl) lines.push('', `Sitemap: ${siteUrl}/sitemap.xml`);
  return `${lines.join('\n')}\n`;
}

export function sitemapXml(siteUrl: string): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    `  <url><loc>${siteUrl}/</loc></url>`,
    '</urlset>',
    '',
  ].join('\n');
}

const IMAGE_ALT = 'MorphiqChess: tablero de ajedrez azul y blanco con las piezas de Morphiq';

export function siteMeta(siteUrl: string): Plugin {
  return {
    name: 'morphiqchess:site-meta',
    transformIndexHtml() {
      if (!siteUrl) return [];
      const image = `${siteUrl}/og-image.png`;
      return [
        { tag: 'link', attrs: { rel: 'canonical', href: `${siteUrl}/` }, injectTo: 'head' as const },
        { tag: 'meta', attrs: { property: 'og:url', content: `${siteUrl}/` }, injectTo: 'head' as const },
        { tag: 'meta', attrs: { property: 'og:image', content: image }, injectTo: 'head' as const },
        { tag: 'meta', attrs: { property: 'og:image:width', content: '1200' }, injectTo: 'head' as const },
        { tag: 'meta', attrs: { property: 'og:image:height', content: '630' }, injectTo: 'head' as const },
        { tag: 'meta', attrs: { property: 'og:image:alt', content: IMAGE_ALT }, injectTo: 'head' as const },
        { tag: 'meta', attrs: { name: 'twitter:image', content: image }, injectTo: 'head' as const },
        { tag: 'meta', attrs: { name: 'twitter:image:alt', content: IMAGE_ALT }, injectTo: 'head' as const },
      ];
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robotsTxt(siteUrl) });
      if (siteUrl) this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: sitemapXml(siteUrl) });
    },
  };
}

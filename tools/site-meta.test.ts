import { describe, expect, it } from 'vitest';
import { normalizeSiteUrl, resolveSiteUrl, robotsTxt, sitemapXml } from './site-meta.ts';

describe('normalizeSiteUrl', () => {
  it('deja solo el origen, sin barra final ni ruta', () => {
    expect(normalizeSiteUrl('https://morphiqchess.vercel.app/')).toBe('https://morphiqchess.vercel.app');
    expect(normalizeSiteUrl('https://ejemplo.com/ruta?x=1#y')).toBe('https://ejemplo.com');
  });

  it('agrega https cuando solo llega el dominio (así lo entrega Vercel)', () => {
    expect(normalizeSiteUrl('morphiqchess.vercel.app')).toBe('https://morphiqchess.vercel.app');
  });

  it('descarta valores vacíos o inválidos', () => {
    expect(normalizeSiteUrl(undefined)).toBe('');
    expect(normalizeSiteUrl('   ')).toBe('');
    expect(normalizeSiteUrl('javascript:alert(1)')).toBe('');
    expect(normalizeSiteUrl('https://')).toBe('');
  });
});

describe('resolveSiteUrl', () => {
  it('SITE_URL manda sobre el dominio de Vercel', () => {
    expect(resolveSiteUrl({ SITE_URL: 'https://chess.morphiq.com.mx', VERCEL_PROJECT_PRODUCTION_URL: 'a.vercel.app' })).toBe(
      'https://chess.morphiq.com.mx',
    );
  });

  it('usa el dominio de producción de Vercel si no hay SITE_URL', () => {
    expect(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'morphiqchess.vercel.app' })).toBe(
      'https://morphiqchess.vercel.app',
    );
  });

  it('sin variables devuelve vacío (compilación local)', () => {
    expect(resolveSiteUrl({})).toBe('');
  });
});

describe('robots.txt y sitemap.xml', () => {
  it('robots permite todo y apunta al sitemap solo si hay URL', () => {
    expect(robotsTxt('https://x.app')).toBe('User-agent: *\nAllow: /\n\nSitemap: https://x.app/sitemap.xml\n');
    expect(robotsTxt('')).toBe('User-agent: *\nAllow: /\n');
  });

  it('sitemap lista la portada con URL absoluta', () => {
    expect(sitemapXml('https://x.app')).toContain('<loc>https://x.app/</loc>');
  });
});

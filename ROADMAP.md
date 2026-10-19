# Hoja de ruta

Lo que sigue, en el orden en que más valor da. Nada de esto está hecho todavía.

## Siguiente

1. **Dominio propio.** Conectar el dominio de Morphiq en Vercel; el canonical, el sitemap y la imagen
   para compartir se actualizan solos en el siguiente despliegue (ver `SITE_URL` en el README).
2. **Modo entrenamiento.** Aprender y practicar aperturas (Italiana, Siciliana y Londres, con todas sus
   variantes y gambitos) con porcentaje de dominio por apertura. Está investigado y documentado en la
   rama `modo-entrenamiento` (carpeta `docs/entrenamiento/`); aún no se implementa.
3. **Sonido.** Efectos para mover, capturar, jaque y jaque mate, con interruptor en Ajustes y apagado
   por defecto si el dispositivo pide movimiento reducido.
4. **Relojes.** Ritmos de juego (blitz, rápido, clásico) con incremento.
5. **PGN.** Exportar e importar partidas y copiar la posición en FEN.

## Después

6. **Contra la computadora.** Motor en un Web Worker (por ejemplo Stockfish compilado a WebAssembly) con
   niveles de dificultad; la CSP pedirá permitir ese worker.
7. **Partidas en línea.** Enlace para invitar a otra persona, con un servidor mínimo para sincronizar jugadas.
8. **Aspectos.** Otros juegos de piezas y tableros, y modo claro.
9. **Instalable y sin conexión.** Service worker para jugar sin internet.
10. **Otros idiomas.** Inglés primero; la estructura de textos ya lo permite.
11. **Estadísticas de uso** respetuosas con la privacidad, si hacen falta.

## Deuda conocida

- El cajón lateral y la pantalla completa se probaron en Chromium con táctil emulado (tamaños de
  teléfono, tableta y escritorio). Falta probarlos en dispositivos reales: iOS Safari y Android Chrome
  (en Android, el gesto de «atrás» por el borde puede competir con el asa; el asa ya extiende su zona
  de toque hacia dentro para dejar margen).
- Las pruebas de la interfaz (arrastre, teclado, táctil, diálogos y animaciones) se hicieron con
  scripts de navegador fuera del repositorio; conviene llevarlas a Playwright dentro del proyecto.
- El arte de las piezas y del tablero se recortó a partir de los originales de diseño; falta guardar en
  el repositorio los originales y los scripts que generan los recortes (carpeta `design/`).

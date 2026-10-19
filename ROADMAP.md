# Hoja de ruta

Lo que sigue, en el orden en que más valor da. Nada de esto está hecho todavía.

## Siguiente

1. **Dominio propio.** Conectar el dominio de Morphiq en Vercel; el canonical, el sitemap y la imagen
   para compartir se actualizan solos en el siguiente despliegue (ver `SITE_URL` en el README).
2. **Sonido.** Efectos para mover, capturar, jaque y jaque mate, con interruptor en Ajustes y apagado
   por defecto si el dispositivo pide movimiento reducido.
3. **Relojes.** Ritmos de juego (blitz, rápido, clásico) con incremento.
4. **PGN.** Exportar e importar partidas y copiar la posición en FEN.

## Después

5. **Contra la computadora.** Motor en un Web Worker (por ejemplo Stockfish compilado a WebAssembly) con
   niveles de dificultad; la CSP pedirá permitir ese worker.
6. **Partidas en línea.** Enlace para invitar a otra persona, con un servidor mínimo para sincronizar jugadas.
7. **Aspectos.** Otros juegos de piezas y tableros, y modo claro.
8. **Instalable y sin conexión.** Service worker para jugar sin internet.
9. **Otros idiomas.** Inglés primero; la estructura de textos ya lo permite.
10. **Estadísticas de uso** respetuosas con la privacidad, si hacen falta.

## Deuda conocida

- Las pruebas de la interfaz (arrastre, teclado, táctil, diálogos y animaciones) se hicieron con
  scripts de navegador fuera del repositorio; conviene llevarlas a Playwright dentro del proyecto.
- El arte de las piezas y del tablero se recortó a partir de los originales de diseño; falta guardar en
  el repositorio los originales y los scripts que generan los recortes (carpeta `design/`).

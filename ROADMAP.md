# Hoja de ruta

## Hecho

- **Modo entrenamiento** (octubre de 2026): 19 temas con 18 lecciones en español y dominio en porcentaje por
  apertura con repetición espaciada. Contenido de KarpaChess y FreeChessTrainer (MIT); ver
  `THIRD_PARTY_NOTICES.md`.
- **Practicar en las 15 aperturas y defensas** (octubre de 2026): 1 619 variantes, con blancas y con azules (el
  bot abre y el tablero se ve girado). Las de las doce aperturas nuevas salen de la base de Lichess (CC0), las
  más cortas primero hasta 200 posiciones por decidir; los fundamentos siguen siendo solo lecciones.
- **Modo Práctica** (octubre de 2026): jugar contra doce rivales, uno por pieza y color, de Elo 400 a 3000+, con
  Stockfish.js en un Web Worker del dispositivo. Elo medido con 9 524 partidas de prueba (ver
  `docs/practica/calibracion.md`).

Lo que sigue, en el orden en que más valor da. Nada de esto está hecho todavía.

## Siguiente

1. **Dominio propio.** Conectar el dominio de Morphiq en Vercel; el canonical, el sitemap y la imagen
   para compartir se actualizan solos en el siguiente despliegue (ver `SITE_URL` en el README).
2. **Más entrenamiento.** Lecciones con todas las ramas (las actuales son cortas y lineales), práctica de más
   aperturas (la base de Lichess tiene 3 865 líneas; hoy se usan las de 12 aperturas) y estadísticas por
   sesión.
3. **Después de cada partida contra un rival: análisis.** Con el motor que ya está, marcar los errores y la mejor
   jugada de cada posición crítica; es lo que más ayuda a mejorar tras jugar.
4. **Sonido.** Efectos para mover, capturar, jaque y jaque mate, con interruptor en Ajustes y apagado
   por defecto si el dispositivo pide movimiento reducido.
5. **Relojes.** Ritmos de juego (blitz, rápido, clásico) con incremento.
6. **PGN.** Exportar e importar partidas y copiar la posición en FEN.

## Después

7. **Partidas en línea.** Enlace para invitar a otra persona, con un servidor mínimo para sincronizar jugadas.
8. **Aspectos.** Otros juegos de piezas y tableros, y modo claro.
9. **Instalable y sin conexión.** Service worker para jugar sin internet.
10. **Otros idiomas.** Inglés primero; la estructura de textos ya lo permite.
11. **Estadísticas de uso** respetuosas con la privacidad, si hacen falta.

## Deuda conocida

- El Elo de los rivales es aproximado (escala de Stockfish) y los de arriba se midieron con pocas partidas y poco
  tiempo por jugada; con más tiempo de cómputo se podrían afinar (ver los límites en
  `docs/practica/calibracion.md`). Los rivales de más fuerza dependen de la velocidad del dispositivo: en un
  teléfono lento llegan a menos profundidad en el mismo tiempo.
- El modo Práctica y las 12 aperturas nuevas de Practicar se probaron en Chromium con táctil emulado (tamaños de
  teléfono, tableta y escritorio) y bajo la CSP de producción; falta un teléfono real, sobre todo para el
  rendimiento del motor (WebAssembly) en gama baja.
- Los nombres en español de las variantes de Lichess salen de reglas de traducción (`tools/training/names.ts`);
  los casos delicados están en pruebas, pero entre 1 492 nombres puede quedar alguno raro. El original en inglés
  se conserva en `nameEn` para corregirlo.
- Stockfish.js es GPL-3.0 y el resto del proyecto, de derechos reservados. Se distribuyen como programas
  separados (el motor corre en un Web Worker y solo habla UCI), con su licencia y su código fuente enlazados; si
  algún día se publica o se vende el código de la app con otra licencia, conviene revisar esta separación con
  alguien que sepa de licencias.
- El modo entrenamiento (menú, lecciones, práctica) se probó en Chromium con táctil emulado y en varios
  tamaños; falta un teléfono real. Si falla la descarga de esa sección, «Recargar» es el único reintento
  (React guarda el rechazo de una carga perezosa hasta recargar la página).
- El cajón lateral y la pantalla completa se probaron en Chromium con táctil emulado (tamaños de
  teléfono, tableta y escritorio). Falta probarlos en dispositivos reales: iOS Safari y Android Chrome
  (en Android, el gesto de «atrás» por el borde puede competir con el asa; el asa ya extiende su zona
  de toque hacia dentro para dejar margen).
- Las pruebas de la interfaz (arrastre, teclado, táctil, diálogos y animaciones) se hicieron con
  scripts de navegador fuera del repositorio; conviene llevarlas a Playwright dentro del proyecto.
- El arte de las piezas y del tablero se recortó a partir de los originales de diseño; falta guardar en
  el repositorio los originales y los scripts que generan los recortes (carpeta `design/`).

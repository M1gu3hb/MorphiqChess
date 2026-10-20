Motor de los rivales del modo Práctica de MorphiqChess
======================================================

Es Stockfish.js 19 en su edición «lite» de un solo hilo, SIN NINGUNA MODIFICACIÓN, tal como se
publica en npm (paquete «stockfish» 19.0.1):

  stockfish-19-lite-single.js     código de enlace (JavaScript)
  stockfish-19-lite-single.wasm   el motor compilado a WebAssembly, con la red neuronal nn-61e7af4bb97d

  SHA-256  ccb130d7ff29408531c47d859a49f91d59d4f482d05a53eb1a3231a4f624c91a  stockfish-19-lite-single.js
  SHA-256  ee4f115bdb2d32cadf96cada104a05b5ec257d7ad6f57582190b49bc71f096de  stockfish-19-lite-single.wasm

MorphiqChess lo ejecuta como un programa aparte, dentro de un Web Worker, y solo se comunica con él
mediante el protocolo UCI (mensajes de texto). No se mezcla con el código de la aplicación.

Licencia: GNU General Public License versión 3 (texto completo en Copying.txt).
Derechos de autor: © 2026 Chess.com, LLC (Stockfish.js); © T. Romstad, M. Costalba, J. Kiiski,
G. Linscott y demás colaboradores de Stockfish.

Código fuente correspondiente (lo que se compiló para obtener estos archivos):

  Stockfish.js 19.0.1   https://github.com/nmrugg/stockfish.js/tree/v19.0.1
                        (incluye en src/ el código C++ de Stockfish y el script de compilación build.js)
  Stockfish             https://github.com/official-stockfish/Stockfish
  Red neuronal          https://tests.stockfishchess.org/nns?network_name=nn-61e7af4bb97d

Para recompilar: emscripten 6.0.9 y «./build.js --single-threaded --lite» en el repositorio de
Stockfish.js. Si cambias estos archivos, cambia también su nombre: el sitio los guarda en caché por un año.

Source code / English: this is the unmodified Stockfish.js 19.0.1 "lite single-threaded" build, licensed
under GPL-3.0. The complete corresponding source is available at the links above.

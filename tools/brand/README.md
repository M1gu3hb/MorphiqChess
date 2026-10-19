# Herramientas de marca

Scripts para volver a generar los recursos gráficos a partir de los originales de diseño
(`design/originales/`). No son parte de la aplicación: solo hacen falta si cambia el diseño.

## Logo de MorphiqChess

`compose.py` toma el logo original de Morphiq y lo convierte en el de MorphiqChess:

- quita el lema original,
- cambia el punto de la «i» por un mini tablero de 2 × 2 casillas,
- redibuja el cuadrado de la «M» en plata,
- agrega la fila inferior con tiras de tablero y la palabra **CHESS** (tipografía Michroma, licencia OFL).

```bash
npm install --no-save @fontsource/michroma      # la tipografía solo se usa aquí
pip install -r tools/brand/requirements.txt
python3 tools/brand/compose.py
```

Genera `design/morphiqchess-logo-maestro.png` (con transparencia y a tamaño completo) y una vista
previa. De ese maestro salen las versiones WebP de `src/assets/brand/`.

`bevel.py` es el biselado metálico (luz arriba a la izquierda) que usa `compose.py`.

# Calculadora de Despachos Inductometal

Aplicación estática sin dependencias en producción. Diseño inspirado en la calculadora de instalación y montaje de Inductometal.

URL pública: https://alexrqm.github.io/calculadora-despachos/

Repositorio independiente: https://github.com/alexrqm/calculadora-despachos

## Uso local

Con Node.js instalado, ejecutar `npm start` y abrir http://127.0.0.1:4173.

Ejecutar `npm test` para verificar tarifas, límites, decimales, IVA y cotización especial.

## Configuración

Todas las tarifas, el recargo Chiloé, el IVA y los límites de distancia están al inicio de `dist/tarifas.mjs`, dentro de `CONFIG`. Los textos, la tabla y los resultados se generan a partir de esa configuración.

La tarifa alterna tramos progresivos y fijos según los límites y precios definidos en `CONFIG`. Las mesetas incluyen ambos extremos; las subidas excluyen sus extremos para asignar cada transición al tramo fijo correspondiente.

Los tramos progresivos usan interpolación exacta entre sus extremos. Se redondea el despacho neto al peso más cercano, luego se suma el recargo y se calcula el IVA sobre el total neto, redondeado al peso. El total final es la suma del neto y el IVA mostrado.

Una distancia vacía o inválida no muestra importes. Cero kilómetros es válido y aplica la tarifa fija del primer tramo. Sobre el límite máximo se solicita cotización especial sin calcular importes, incluso con Chiloé activado.

## Archivos

- `index.html`: entrada de la aplicación en la raíz.
- `dist/styles.css`: diseño responsive.
- `dist/tarifas.mjs`: configuración y cálculo.
- `dist/app.js`: interacción y presentación.
- `dist/logo.png`: logotipo de la calculadora de referencia.

## GitHub Pages

Publicación desde la rama `main`, carpeta raíz `/`, con `.nojekyll`. `index.html` carga los estilos, módulos y logo mediante rutas relativas dentro de `dist/`, compatibles con la URL del proyecto.

Para cualquier alojamiento estático, publicar `index.html` junto a la carpeta `dist/`. Los módulos JavaScript requieren servir los archivos mediante HTTP.

## Verificación de la versión publicada

El workflow **Verificar calculadora publicada** se ejecuta después de una publicación exitosa de GitHub Pages o manualmente desde Actions. Usa Chromium en tamaños de computador y teléfono (emulación Pixel 7), revisa todos los ejemplos de tarifas, el recargo Chiloé, IVA, los límites y entradas inválidas, carga de recursos, estilos, ausencia de desbordamiento horizontal y errores de consola. Adjunta capturas y un informe HTML como artefacto.

Para repetir esa prueba: `npm ci`, `npx playwright install chromium` y `npm run test:published`. Siempre comprueba la URL pública de GitHub Pages.

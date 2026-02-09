# Ambulancia

Simulación del caso de estudio 1 del servicio de ambulancias de Londres usando
HTML, CSS, JavaScript (clases y promesas), OpenStreetMap (Leaflet) y un esquema
SQL de apoyo.

## Contenido

- `index.html`: interfaz con formulario, paneles operativos y mapa.
- `styles.css`: estilo de la interfaz.
- `app.js`: lógica de simulación (CAD, operadores y flujo operativo).
- `schema.sql`: modelo SQL sugerido para persistencia.

## Cómo ejecutar

1. Inicia un servidor local en la raíz del proyecto:

```bash
python3 -m http.server 8000
```

2. Abre <http://localhost:8000> en el navegador.

## Uso rápido

1. Completa la información del incidente y registra.
2. Solicita la propuesta del sistema CAD.
3. Acepta o rechaza la ambulancia propuesta.
4. El operador logístico realiza la llamada.
5. El operador de radio inicia la guía.

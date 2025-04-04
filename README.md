# Map elevation app

Simple proof-of-concept web app for getting elevation data in a certain map area.

The app allows users to:
- View a map (MapLibre + OpenStreetMap)
- Draw polygon areas
- Calculate and display elevation (average, min, max) for the area
- Clear and redraw as needed

## Features

- Runs locally in any browser (no backend needed)
- Free, open-source libraries only
- Works offline except for map tiles and elevation API calls
- No registration or keys required

## Tech Stack

- MapLibre GL JS (open-source map renderer)
- Mapbox GL Draw (polygon drawing)
- Turf.js (geometry tools)
- Open-Elevation API (elevation data)
- HTML, CSS, JavaScript

## How to Run

1. Clone or download the repository
2. Open `index.html` in your browser (Brave, Chrome, etc.)
3. Done — no build tools or server needed

## License

MIT

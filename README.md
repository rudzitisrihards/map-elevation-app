# Map elevation app

This is a very simple proof-of-concept web app for planning combat unit placement using elevation data. Eventual goal is to help military personnel quickly understand terrain in unfamiliar areas, or react to known enemy positions.

The app allows users to:
- View a map (MapLibre + OpenStreetMap)
- Draw polygon areas
- Calculate and display elevation (average, min, max) for the area
- Clear and redraw as needed

## Features

- Fully client-side: runs locally in any browser (no backend needed)
- Free, open-source libraries only
- Styled UI
- Works offline except for map tiles and elevation API calls
- No registration or keys required

## Tech Stack

- MapLibre GL JS (open-source map renderer)
- Mapbox GL Draw (polygon drawing)
- Turf.js (geometry tools)
- Open-Elevation API (for elevation data)
- HTML, CSS, JavaScript

## How to Run

1. Clone or download the repository
2. Open `index.html` in your browser (Brave, Chrome, etc.)
3. Done — no build tools or server needed

## License

MIT

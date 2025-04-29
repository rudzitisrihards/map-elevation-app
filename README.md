# Map elevation app

Simple proof-of-concept web app for getting elevation data in a certain map area and placing military unit icons on the map based on predefined rules.

The app allows users to:

- View a map (MapLibre + OpenStreetMap)
- Draw polygon areas
- Calculate and display elevation for the area
- Place military unit icons on the map based on elevation and placement rules
- Clear and redraw as needed

Once the pin button is pressed, the app fetches elevation points, and applies these placement rules:

- HQ is the single highest point in the polygon
- Artillery is the next highest point that isn’t the HQ
- Infantry is the point at the middle of the elevation list
- Armor is the point in the lower 25% of the elevation list
- Recon is the point farthest from the HQ

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
2. Open `index.html` with LiveServer extension from VScode (map needs an IP in browser to run)
3. Done!

## License

MIT

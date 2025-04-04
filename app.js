// Initialize the map
const map = new maplibregl.Map({
    container: "map",
    style: "https://tiles.stadiamaps.com/styles/outdoors/style.json",
    center: [25.07921854641682, 57.239711356360694],
    zoom: 15,
});
  
// Add navigation control
map.addControl(new maplibregl.NavigationControl(), "top-right");
  
// Set up drawing tool with custom styles
const Draw = new MapboxDraw({
displayControlsDefault: false,
styles: [
    {
    id: 'gl-draw-polygon-fill',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    paint: {
        'fill-color': '#88c0d0',
        'fill-opacity': 0.3
    }
    },
    {
    id: 'gl-draw-polygon-stroke-active',
    type: 'line',
    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static']],
    paint: {
        'line-color': '#2e3440',
        'line-width': 2
    }
    },
    {
    id: 'gl-draw-polygon-and-line-vertex-halo-active',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
    paint: {
        'circle-radius': 8,
        'circle-color': '#fff'
    }
    },
    {
    id: 'gl-draw-polygon-and-line-vertex-active',
    type: 'circle',
    filter: ['all', ['==', 'meta', 'vertex'], ['==', '$type', 'Point']],
    paint: {
        'circle-radius': 5,
        'circle-color': '#2e3440'
    }
    }
]
});

map.addControl(Draw);

// State and button references
let isDrawing = false;
const drawButton = document.getElementById("toggleDraw");
const deleteButton = document.getElementById("deleteDraw");

// Toggle draw mode
drawButton.addEventListener("click", () => {
isDrawing = !isDrawing;
if (isDrawing) {
    Draw.changeMode("draw_polygon");
    drawButton.classList.add("active");
} else {
    Draw.changeMode("simple_select");
    drawButton.classList.remove("active");
}
});

// Auto exit draw mode after polygon is completed
map.on("draw.create", () => {
setTimeout(() => {
    isDrawing = false;
    Draw.changeMode("simple_select");
    drawButton.classList.remove("active");
}, 0);
});
  
// Delete all drawings
deleteButton.addEventListener("click", () => {
Draw.deleteAll();
drawButton.classList.remove("active");
isDrawing = false;
document.getElementById("elevation-info").classList.add("hidden");
});

// Elevation calc
const elevationButton = document.getElementById("calculateElevation");

elevationButton.addEventListener("click", async () => {
    const data = Draw.getAll();
    if (!data || data.features.length === 0) {
      alert("No polygons found.");
      return;
    }
  
const samplePoints = [];
  
data.features.forEach(feature => {
    if (feature.geometry.type === "Polygon") {
    const bounds = turf.bbox(feature);
    const grid = turf.pointGrid(bounds, 0.05); // fewer points

    turf.pointsWithinPolygon(grid, feature).features.forEach(pt => {
        samplePoints.push(pt.geometry.coordinates);
    });
    }
});
  
if (samplePoints.length === 0) {
    alert("No sample points found inside polygons.");
    return;
}
  
const slicedPoints = samplePoints.slice(0, 100); // limit to 100 max
const locationsParam = slicedPoints
    .map(coord => `${coord[1]},${coord[0]}`)
    .join("|");  
const url = `https://api.open-elevation.com/api/v1/lookup?locations=${locationsParam}`;
console.log("Elevation API URL:", url);
  
try {
    const response = await fetch(url);
    const json = await response.json();
    const elevations = json.results.map(r => r.elevation);

    const min = Math.min(...elevations);
    const max = Math.max(...elevations);
    const avg = elevations.reduce((a, b) => a + b, 0) / elevations.length;

    document.getElementById("elevation-values").innerHTML = `
    <p>Average: ${avg.toFixed(2)} m</p>
    <p>Min: ${min} m</p>
    <p>Max: ${max} m</p>
    `;

    document.getElementById("elevation-info").classList.remove("hidden");

    } catch (err) {
      alert("Failed to fetch elevation data.");
      console.error(err);
    }
  });
  
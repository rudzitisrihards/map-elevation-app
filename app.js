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
      id: "gl-draw-polygon-fill",
      type: "fill",
      filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
      paint: {
        "fill-color": "#88c0d0",
        "fill-opacity": 0.3,
      },
    },
    {
      id: "gl-draw-polygon-stroke-active",
      type: "line",
      filter: ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
      paint: {
        "line-color": "#2e3440",
        "line-width": 2,
      },
    },
    {
      id: "gl-draw-polygon-and-line-vertex-halo-active",
      type: "circle",
      filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]],
      paint: {
        "circle-radius": 8,
        "circle-color": "#fff",
      },
    },
    {
      id: "gl-draw-polygon-and-line-vertex-active",
      type: "circle",
      filter: ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"]],
      paint: {
        "circle-radius": 5,
        "circle-color": "#2e3440",
      },
    },
  ],
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

  // Hide panel
  document.getElementById("elevation-info").classList.add("hidden");

  // Remove heatmap and labels
  if (map.getLayer("elevation-heat")) {
    map.removeLayer("elevation-heat");
  }
  if (map.getLayer("elevation-labels")) {
    map.removeLayer("elevation-labels");
  }
  if (map.getSource("elevation-points")) {
    map.removeSource("elevation-points");
  }
});

// Elevation calc
const elevationButton = document.getElementById("calculateElevation");

elevationButton.addEventListener("click", async () => {
  const loadingPanel = document.getElementById("elevation-loading");
  if (loadingPanel) loadingPanel.classList.remove("hidden");
  const data = Draw.getAll();
  if (!data || data.features.length === 0) {
    alert("No polygons found.");
    return;
  }

  let samplePoints = [];

  for (const feature of data.features) {
    if (feature.geometry.type === "Polygon") {
      const bounds = turf.bbox(feature);
      const area = turf.area(feature); // in square meters

      // Automatically adjust spacing to get ~100 points
      const spacing = Math.max(Math.min(Math.sqrt(area / 80000), 0.05), 0.002); // 1 point per ~800m²

      const alignedBounds = [
        Math.floor(bounds[0] / spacing) * spacing,
        Math.floor(bounds[1] / spacing) * spacing,
        Math.ceil(bounds[2] / spacing) * spacing,
        Math.ceil(bounds[3] / spacing) * spacing,
      ];

      const grid = turf.pointGrid(alignedBounds, spacing);
      const pointsInPoly = turf.pointsWithinPolygon(grid, feature);

      if (pointsInPoly.features.length > 0) {
        turf.featureEach(pointsInPoly, (pt) => {
          samplePoints.push(pt.geometry.coordinates);
        });
      }
    }
  }

  // Safety check — prevent elevation request if nothing found
  if (samplePoints.length === 0) {
    alert("No sample points found inside polygons.");
    return;
  }

  // Limit to 100 max for API
  try {
    const chunkSize = 100;
    const elevationPoints = [];

    for (let i = 0; i < samplePoints.length; i += chunkSize) {
      const chunk = samplePoints.slice(i, i + chunkSize);
      const locationsParam = chunk
        .map((coord) => `${coord[1]},${coord[0]}`)
        .join("|");

      const url = `https://api.open-elevation.com/api/v1/lookup?locations=${locationsParam}`;
      await new Promise((resolve) => setTimeout(resolve, 500));
      const response = await fetch(url);
      const json = await response.json();

      json.results.forEach((result, j) => {
        elevationPoints.push({
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: chunk[j],
          },
          properties: {
            elevation: result.elevation,
          },
        });
      });
    }

    // Save to map layer
    updateElevationHeatmap({
      type: "FeatureCollection",
      features: elevationPoints,
    });

    // Calculate and show stats
    const elevations = elevationPoints.map((pt) => pt.properties.elevation);
    const min = Math.min(...elevations);
    const max = Math.max(...elevations);
    const avg = elevations.reduce((a, b) => a + b, 0) / elevations.length;

    document.getElementById("elevation-values").innerHTML = `
      <p>Average: ${avg.toFixed(2)} m</p>
      <p>Min: ${min} m</p>
      <p>Max: ${max} m</p>
    `;
    document.getElementById("elevation-info").classList.remove("hidden");
    if (loadingPanel) loadingPanel.classList.add("hidden");
  } catch (err) {
    if (loadingPanel) loadingPanel.classList.add("hidden");
    alert("Failed to fetch elevation data.");
    console.error(err);
  }
});

// Helper to show elevation heatmap and labels
function updateElevationHeatmap(geojson) {
  if (map.getSource("elevation-points")) {
    map.getSource("elevation-points").setData(geojson);
  } else {
    map.addSource("elevation-points", {
      type: "geojson",
      data: geojson,
    });

    // Colored dots
    map.addLayer({
      id: "elevation-heat",
      type: "circle",
      source: "elevation-points",
      paint: {
        "circle-radius": 6,
        "circle-color": [
          "interpolate",
          ["linear"],
          ["get", "elevation"],
          0,
          "#00bcd4",
          100,
          "#ffc107",
          300,
          "#f44336",
        ],
        "circle-opacity": 0.6,
      },
    });

    // Labels for each dot
    map.addLayer({
      id: "elevation-labels",
      type: "symbol",
      source: "elevation-points",
      layout: {
        "text-field": ["to-string", ["get", "elevation"]],
        "text-size": 10,
        "text-offset": [0, 0.6],
        "text-anchor": "top",
      },
      paint: {
        "text-color": "#333",
        "text-halo-color": "#fff",
        "text-halo-width": 1,
      },
    });
  }
}

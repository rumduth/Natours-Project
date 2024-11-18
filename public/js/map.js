console.log("Hello from the client side");

const locations = JSON.parse(document.getElementById("map").dataset.locations);
const token =
  "pk.eyJ1IjoiZHV0aG5nIiwiYSI6ImNtM2xhZnd0czBuaTAyanBrcXk0NmU5cTcifQ.NQkARs56vDYB0mtPQSwU1w";
mapboxgl.accessToken = token;
const map = new mapboxgl.Map({
  container: "map", // container ID
  style: "mapbox://styles/duthng/cm3ldwd7500jl01ry2w9m7sm1", // style URL
  center: [-118, 34], // starting position [lng, lat]
  zoom: 5, // starting zoom
  scrollZoom: false,
});

const bounds = new mapboxgl.LngLatBounds();
locations.forEach((loc) => {
  // Add maker
  const el = document.createElement("div");
  el.className = "marker";

  //Add the marker
  new mapboxgl.Marker({
    element: el,
    anchor: "bottom",
  })
    .setLngLat(loc.coordinates)
    .addTo(map);

  //Add the popup
  new mapboxgl.Popup({ offset: 40 })
    .setLngLat(loc.coordinates)
    .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
    .addTo(map);

  //Extends the map bound to include this location
  bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
  padding: {
    top: 200,
    bottom: 150,
    left: 100,
    right: 100,
  },
});

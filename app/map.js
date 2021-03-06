var mymap = L.map('mapid').setView([48.980917, 8.261283950000063], 5);

L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
    maxZoom: 18,
    attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, ' +
        '<a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, ' +
        'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    id: 'mapbox.streets'
}).addTo(mymap);

var layerGroup = L.featureGroup();
layerGroup.addTo(mymap);

//initial requesting of RDF data
initData();

/**
 * Function for handling the loading indicator that is displayed whenever data is requested.
 * @param message 
 */
function showLoadingIndicator(message) {
    const el = document.querySelector('#loading-message')
    if (!message) return el.classList.add('hidden')
    el.classList.remove('hidden')
    el.innerHTML = `<span class="nav-link"><img src="./loader.gif"/>&nbsp;${message}</span>`
}

/**
 * Function for querying the latest waste data for all NUTS0 shapes.
 * The `SPARQL` query is build and the result of the `queryTripleStore` function with the build query.
 * @param nutsCode 
 */
async function queryLatestWasteGenForNuts0(nutsCode) {
    const query = `
      SELECT DISTINCT * WHERE {
        ?obs a qb:Observation.
        ?obs euwaste:refArea nuts:${nutsCode}.
        ?obs euwaste:attrWastePerCapita ?wasteGeneration.
        ?obs euwaste:refPeriod ?year.
      } ORDER BY DESC(?year) LIMIT 20
    `;

    return queryTripleStore(query);
}

/**
 * Function for querying the latest waste data for all NUTS2 shapes.
 * The `SPARQL` query is build and the result of the `queryTripleStore` function with the build query.
 * @param nutsCode 
 */
async function queryLatestWasteGenForNuts2(nutsCode) {
    const query = `
      SELECT DISTINCT * WHERE {
        ?obs a qb:Observation.
        ?obs euwaste:refArea nuts:${nutsCode}.
        ?obs euwaste:attrWastePerCapita ?wasteGeneration.
        ?obs euwaste:attrPopulation ?population.
        ?obs euwaste:refPeriod ?year.
      } ORDER BY DESC(?year) LIMIT 20
    `;

    return queryTripleStore(query);
}

/**
 * Function for querying the latest waste, recycling and energy-recovery data for a given NUTS code.
 * The `SPARQL` query is build and the result of the `queryTripleStore` function with the build query.
 * @param nutsCode 
 */
async function queryLatestForNuts(nutsCode) {
    const query = `
      SELECT DISTINCT * WHERE {
        ?obs a qb:Observation.
        ?obs euwaste:refArea nuts:${nutsCode}.
        ?obs euwaste:attrWastePerCapita ?wasteGeneration.
        ?obs euwaste:attrRecycling ?recycling.
        ?obs euwaste:attrEnergyRecovery ?energyRecovery.
        ?obs euwaste:refPeriod ?year.
      } ORDER BY DESC(?year)
    `;

    return queryTripleStore(query);
}

/**
 * Function for sending a query to a given triple store and receiving the result as a `JSON`.
 * The prefixes are appended to the beginning of the query and send to the triple store using the `fetch` function.
 * @param query 
 */
async function queryTripleStore(query) {
    const baseUrl = 'http://giv-oct.uni-muenster.de:8890/sparql?default-graph-uri=http%3A%2F%2Fcourse.geoinfo2018.org%2FG3&format=application/json&timeout=0&debug=on&query='
    //building the query by appending the needed prefixes to the beginnig
    const q = `
        PREFIX euwaste: <http://course.geoinfo2018.org/G3#>
        PREFIX qb: <http://purl.org/linked-data/cube#>
        PREFIX nuts: <http://rdfdata.eionet.europa.eu/page/ramon/nuts/>

        ${query}
    `;

    const response = await fetch(baseUrl + encodeURIComponent(q));
    const json = await response.json();
    return json;
}

/**
 * Function for initially loading data on application start.
 * First, the NUTS0 region data is loaded and added to the map. Only after the NUTS0 regions are loaded
 * the NUTS2 region data is loaded to reduce the time it takes to see something on the map.
 * The NUTS2 regions are grayed out until all the data is fetched from the server.
 */
async function initData() {
    // add NUTS0 choropleth to map
    showLoadingIndicator('loading countries...')
    const layer0 = await prepareNutsLevel(geodataNuts0, queryLatestWasteGenForNuts0);
    addChoroplethToMap(layer0)

    // create placeholder layer for NUTS2, b/c loading the RDF data for NUTS2 takes a while
    const layer2NoData = L.geoJson(geodataNuts2, {
        style: {
            // interactive: false,
            fillColor: '#666',
            fillOpacity: 0.4,
            color: '#fff',
            weight: 1,
        },
        onEachFeature,
    });
    let layer2 = layer2NoData

    // zoom based layer change
    mymap.on('zoomend', function (e) {
        if (mymap.getZoom() > 6)
            addChoroplethToMap(layer2)
        else
            addChoroplethToMap(layer0)
    });

    // replace NUTS2 placeholder with actual chorolpleth layer
    showLoadingIndicator('loading regions...')
    const layer2WithData = await prepareNutsLevel(geodataNuts2, queryLatestWasteGenForNuts2);
    layerGroup.removeLayer(layer2)
    layer2 = layer2WithData
    if (mymap.getZoom() > 6) layer2.addTo(layerGroup)
    showLoadingIndicator(false)
}

let legend = L.control();

/**
 * Function adding a choropleth layer to the map.
 * First, all previous layers are removed to prevent layer chaos.
 * @param layer 
 */
function addChoroplethToMap(layer) {
    layerGroup.clearLayers();
    layer.addTo(layerGroup)
    buildLegend(layer)
}

/**
 * Function for building a legend for a given choropleth layer and add it tp the map.
 * @param layer 
 */
function buildLegend(layer) {
    mymap.removeControl(legend)

    if (!layer.options.limits) {
        return;
    }

    legend = L.control({ position: 'bottomright' })
    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend')
        var limits = layer.options.limits
        var colors = layer.options.colors
        var labels = []

        // Add min & max
        div.innerHTML = 'Waste Generation in kg/Capita<div class="labels"><div class="min">' + Math.floor(limits[0]) + '</div> \
              <div class="max">' + Math.floor(limits[limits.length - 1]) + '</div></div>'

        limits.forEach(function (limit, index) {
            labels.push('<li style="background-color: ' + colors[index] + '"></li>')
        })

        div.innerHTML += '<ul>' + labels.join('') + '</ul>'
        return div
    }
    legend.addTo(mymap)
}

/**
 * Function for preprocessing the NUTS data.
 * The waste generation is normalized by dividing it by the population of the given NUTS region.
 * Returns the result of the `buildChoroplethLayer` function with a given geojson.
 * @param url 
 * @param queryFunction 
 */
async function prepareNutsLevel(url, queryFunction) {
    const geojson = url

    // apply RDF data to geojson
    const nutsCodes = geojson.features.map(feat => feat.properties.NUTS_ID);
    const wasteData = await fetchWasteData(nutsCodes, queryFunction);
    for (const feat of geojson.features) {
        if (!wasteData[feat.properties.NUTS_ID])
            continue;

        const { population, wasteGeneration, year } = wasteData[feat.properties.NUTS_ID];
        feat.properties['wasteGeneration'] = wasteGeneration / population;
        feat.properties['year'] = year;

        // transform back to kg/capita (population is !== 1 for NUTS2 data,
        // which is in kilotonnes per region)
        if (population !== 1)
            feat.properties['wasteGeneration'] *= 1e6;

        // round the value to 2 digits
        feat.properties['wasteGeneration'] = Math.round(feat.properties['wasteGeneration'] * 100) / 100;
    }

    return buildChoroplethLayer(geojson);
}

/**
 * Function for fetching the latest values for waste generation for every NUTS code in a set of codes.
 * @param nutsCodes 
 * @param queryFunction 
 */
async function fetchWasteData(nutsCodes, queryFunction) {
    const results = {};
    for (const nutsCode of nutsCodes) {
        const json = await queryFunction(nutsCode)
        if (json.results.bindings.length > 1) {
            const { obs, wasteGeneration, population, year } = json.results.bindings[0]
            const nuts = obs.value.split('_').pop();

            results[nuts] = {
                wasteGeneration: Number.parseFloat(wasteGeneration.value),
                year: Number.parseFloat(year.value),
                // fallback value `1` for NUTS0, where no population data is available / needed
                population: Number.parseFloat(population ? population.value : 1),
            }
        }
    }
    return results;
}

/**
 * Function for building a choropleth layer with a given `GeoJSON`.
 * @param geojson 
 */
function buildChoroplethLayer(geojson) {
    return L.choropleth(geojson, {
        valueProperty: 'wasteGeneration', // geojson properties property
        scale: ['yellow', 'red'], // chroma.js scale - include as many as you like
        steps: 15,
        mode: 'k', // q for quantile, e for equidistant, k for k-means
        style: {
            color: '#fff', // border color
            weight: 1,
            fillOpacity: 0.7
        },
        onEachFeature,
    })
}

/**
 * Function for defining mouseover and click functionality of every shape of a choropleth layer.
 * @param feature 
 * @param layer 
 */
function onEachFeature(feature, layer) {
    layer.on({
        //Mouseover displayes NUTS name and the last waste generation value in kg/capita
        mouseover: (event) => {
            event.target.setStyle({
                weight: 3,
                color: '#666',
            }).bringToFront();
            const { NUTS_NAME, wasteGeneration, year } = event.target.feature.properties;
            if (wasteGeneration) { // only if data is already loaded
                const popup = `
                    <b>${NUTS_NAME}</b>
                    <table>
                        <tr><th>Solid Waste Generation: </th><td>${wasteGeneration} kg / capita (${year})</td></tr>
                    </table>`
                layer.bindPopup(popup, { closeButton: false });
                layer.openPopup();
            }
        },
        mouseout: (event) => {
            event.target.setStyle({
                weight: 1,
                color: '#fff',
            }).bringToFront();
            mymap.closePopup();
        },
        //Clicking on a shape opens side panel and visualizes additional information, if available, as a line and pie chart.
        click: async (event) => {
            const { NUTS_ID, NUTS_NAME } = event.target.feature.properties;
            const name = NUTS_NAME.charAt(0).toUpperCase() + NUTS_NAME.slice(1);
            document.getElementById('dataTitle').innerHTML = name;
            openNav();

            const json = await queryLatestWasteGenForNuts0(NUTS_ID)
            setLineChart(json.results.bindings);

            const pieData = await queryLatestForNuts(NUTS_ID);
            setPrcChart(pieData.results.bindings[0]);
        },
    });
}

/**
 * Function for defining the side panel for the display of additional data as graphs, on open.
 */
function openNav() {
    document.getElementById("main").style.marginRight = "25%";
    document.getElementById("mySidenav").style.width = "25%";
    document.getElementById("mySidenav").style.display = "block";
}

/**
 * Function for defining the side panel for the display of additional data as graphs, on close.
 */
function closeNav() {
    document.getElementById("main").style.marginRight = "0%";
    document.getElementById("mySidenav").style.display = "none";
}

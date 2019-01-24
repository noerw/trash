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

initData();

//Build query to get max amount of waste for a given array of nut codes
//Order desc to make the latest data always available at index 0
async function queryLatestWasteGenForNuts (nutsCode) {
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

async function queryLatestForNuts (nutsCode) {
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


async function queryTripleStore (query) {
    const baseUrl = 'http://giv-oct.uni-muenster.de:8890/sparql?default-graph-uri=http%3A%2F%2Fcourse.geoinfo2018.org%2FG3&format=application/json&timeout=0&debug=on&query='
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

async function initData() {
    // add NUTS0 choropleth to map
    const layer0 = await prepareNutsLevel(geodataNuts0);
    layer0.addTo(layerGroup);

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
        layerGroup.clearLayers();
        if (mymap.getZoom() > 6)
            layer2.addTo(layerGroup)
        else
            layer0.addTo(layerGroup)
    });

    // replace NUTS2 placeholder with actual chorolpleth layer
    const layer2WithData = await prepareNutsLevel(geodataNuts2);
    layerGroup.remove(layer2)
    layer2 = layer2WithData
    layer2.addToMap(mymap)
}

async function prepareNutsLevel (url) {
    // fetch geojson
    // const req = await fetch(url)
    // const geojson = await req.json()
    const geojson = url

    // apply RDF data to geojson
    const nutsCodes = geojson.features.map(feat => feat.properties.NUTS_ID);
    const wasteData = await fetchWasteData(nutsCodes);
    for (const feat of geojson.features) {
        feat.properties['wasteGeneration'] = wasteData[feat.properties.NUTS_ID]
    }

    return buildChoroplethLayer(geojson);
}

//Asyc fetch latest value for waste for every nut code in set of codes.
//Push all values into an array and return max value of all.
async function fetchWasteData (nutsCodes) {
    const wasteGeneration = {};
    for (const nutsCode of nutsCodes) {
        const json = await queryLatestWasteGenForNuts(nutsCode)

        if (json.results.bindings.length > 1) {
            const id = json.results.bindings[0].obs.value.substring(json.results.bindings[0].obs.value.length - 2);
            const value = json.results.bindings[0].wasteGeneration.value
            wasteGeneration[id] = Number.parseFloat(value);
        }
    }
    return wasteGeneration;
}

function buildChoroplethLayer (geojson) {
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

function onEachFeature (feature, layer) {
    layer.on({
        mouseover: (event) => {
            event.target.setStyle({
                weight: 3,
                color: '#666',
            }).bringToFront();
        },
        mouseout: (event) => {
            event.target.setStyle({
                weight: 1,
                color: '#fff',
            }).bringToFront();
        },
        click: async (event) => {
            const nut = event.sourceTarget.feature.id;
            document.getElementById('dataTitle').innerHTML = nut;
            openNav();
            const json = await queryLatestWasteGenForNuts(nut)
            setLineChart(json.results.bindings);
            setPrcChart(json.results.bindings);
        },
    });
}

function openNav() {
    document.getElementById("main").style.marginRight = "25%";
    document.getElementById("mySidenav").style.width = "25%";
    document.getElementById("mySidenav").style.display = "block";
}

function closeNav() {
    document.getElementById("main").style.marginRight = "0%";
    document.getElementById("mySidenav").style.display = "none";
}

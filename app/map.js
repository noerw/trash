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


var maxWaste0;
var wasteArray0;
var maxWaste2;
var wasteArray2;


async function initData() {
    // extract NUTS ids form geojson
    const nut0Codes = nutsLevel0.features.map(feat => feat.id);
    const nut2Codes = nutsLevel2.features.map(feat => feat.id);

    const waste0 = await fetchWasteData(nut0Codes);
    maxWaste0 = waste0.maxWaste;
    wasteArray0 = waste0.wasteGeneration;
    console.log(waste0)

    // apply fetched RDF data to geojson
    for (const feat of nutsLevel0.features) {
        feat.properties['wasteGeneration'] = waste0.wasteGeneration[feat.id]
    }


    //same for nut2
    // const wast2 = await maxWaste(nut2Codes)
    // maxWaste2 = waste2.maxWaste;
    // wasteArray2 = waste2.wasteArray;
    // console.log(maxWaste2)

    loadNUTS();
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
    const maxWaste = Math.max.apply(Math, Object.values(wasteGeneration))
    return { maxWaste, wasteGeneration };
}

function loadNUTS() {
    if (mymap.getZoom() > 6) {
        layerGroup.clearLayers();
        geojson = L.geoJson(nutsLevel2, {
            onEachFeature,
            style: function (feature) {
                //console.log(feature)
            }
        }).addTo(layerGroup);
    } else {
        geojson = L.choropleth(nutsLevel0, {
            valueProperty: 'wasteGeneration', // geojson properties property
            scale: ['yellow', 'red'], // chroma.js scale - include as many as you like
            steps: 15,
            mode: 'k', // q for quantile, e for equidistant, k for k-means
            onEachFeature,
            style: {
                color: '#fff', // border color
                weight: 2,
                fillOpacity: 0.8
            },
        }).addTo(mymap)
    }
}

//#################################
//#### Map Stuff and coloring #####
//#################################

async function onclick(e) {
    var nut = e.sourceTarget.feature.id;
    document.getElementById('dataTitle').innerHTML = nut;
    openNav();

    const json = await queryLatestWasteGenForNuts(nut);

    const pieData = await queryLatestForNuts(nut);

    setLineChart(json.results.bindings);

    console.log(pieData.results.bindings);
    setPrcChart(pieData.results.bindings[0]);
}

function onEachFeature(feature, layer) {
    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: onclick
    });
}

function resetHighlight(e) {
    geojson.resetStyle(e.target);
}

function highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
        weight: 5,
        color: '#666',
        dashArray: '',
        fillOpacity: 0.7
    });

    if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
        layer.bringToFront();
    }
}
mymap.on('zoomend', function (e) {
    zoom_based_layerchange();
});

function zoom_based_layerchange() {
    loadNUTS();
}

function style(feature) {
    const region = wasteArray0.find(elem => {
        if (elem.nut == feature.id) return elem;
    })
    if (region) {
        const normalizedWaste = region.waste / maxWaste0;

        return {
            fillColor: getColor(normalizedWaste),
            weight: 2,
            opacity: 1,
            color: 'white',
            dashArray: '3',
            fillOpacity: 0.7
        };
    }
}

function getColor(d) {
    return  d >= 1 ? '#E500AD' :
            d > .9 ? '#CE13A0' :
            d > .8 ? '#B72693' :
            d > .7 ? '#A03986' :
            d > .6 ? '#894C7A' :
            d > .5 ? '#725F6D' :
            d > .4 ? '#5B7260' :
            d > .3 ? '#448554' :
            d > .2 ? '#2D9847' :
            d > .1 ? '#16AB3A' :
            d == undefined ? '#000000':
                     '#00BF2E'
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

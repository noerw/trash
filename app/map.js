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

var address = "http://giv-oct.uni-muenster.de:8890/sparql?default-graph-uri=http%3A%2F%2Fcourse.geoinfo2018.org%2FG3&format=application/json&timeout=0&debug=on&query=";
var namespace = "http://course.geoinfo2018.org/G3#";
var queryHeader = 'PREFIX euwaste: <http://course.geoinfo2018.org/G3#> PREFIX qb: <http://purl.org/linked-data/cube#> PREFIX nuts: <http://rdfdata.eionet.europa.eu/page/ramon/nuts/> ';



var nut0Codes = [];
var nut2Codes = [];


init();

//extracting nut codes 
function getAllNuts() {
    nutsLevel0.features.forEach(element => {
        nut0Codes.push(element.id)
    });

    nutsLevel2.features.forEach(element => {
        nut2Codes.push(element.id)
    });
}

//Build query to get max amount of waste for a given array of nut codes
//Order desc to make the latest data always available at index 0
function queryMaxWaste(nut0) {
    var queryContent = "?obs a qb:Observation.   ?obs euwaste:refArea nuts:" + nut0 + ".  ?obs euwaste:attrWastePerCapita ?wasteGeneration.   ?obs euwaste:refPeriod ?year."
    var completeQuery = queryHeader + "SELECT DISTINCT * WHERE {" + queryContent + "}ORDER BY DESC(?year)"
    return completeQuery
}

function queryYearly(selCode){
    var queryContent = "?obs a qb:Observation. ?obs euwaste:refArea nuts:" + selCode + ". ?obs euwaste:attrWastePerCapita ?wasteGeneration. ?obs euwaste:refPeriod ?year."
    var completeQuery = queryHeader + "SELECT DISTINCT * WHERE {" + queryContent + "}ORDER BY DESC(?year)"
    return completeQuery
}


var maxWaste0;
var wasteArray0;
var maxWaste2;
var wasteArray2;


async function init() {
    getAllNuts();
    const waste0 = await maxWaste(nut0Codes);
    maxWaste0 = waste0.maxWaste;
    wasteArray0 = waste0.wasteArray;
    console.log(waste0)
    //same for nut2
    // const wast2 = await maxWaste(nut2Codes)
    // maxWaste2 = waste2.maxWaste;
    // wasteArray2 = waste2.wasteArray;
    // console.log(maxWaste2)

    loadNUTS();
}

//Asyc fetch latest value for waste for every nut code in set of codes. 
//Push all values into an array and return max value of all.
async function maxWaste(nutCode) {
    const waste = [];
    for (const element of nutCode) {
        const query = queryMaxWaste(element);
        const response = await fetch(address + encodeURIComponent(query));
        const json = await response.json();
        if (json.results.bindings.length > 1) {
            const id = json.results.bindings[0].obs.value.substring(json.results.bindings[0].obs.value.length - 2);
            const value = json.results.bindings[0].wasteGeneration.value
            waste.push({ nut: id, waste: value });
        }
    }
    console.log(waste)
    const maxWaste = Math.max.apply(Math, waste.map(function (element) { return element.waste }))
    return { maxWaste: maxWaste, wasteArray: waste };
}


function loadNUTS() {
    if (mymap.getZoom() > 6) {
        layerGroup.clearLayers();
        geojson = L.geoJson(nutsLevel2, {
            onEachFeature: onEachFeature,
            style: function (feature) {
                console.log(feature)
            }
        }).addTo(layerGroup);
    } else {
        layerGroup.clearLayers();
        geojson = L.geoJson(nutsLevel0, {
            onEachFeature: onEachFeature,
            style: style
        }).addTo(layerGroup);
    }
}





//#################################
//#### Map Stuff and coloring #####
//#################################

async function onclick(e) {
    var nut = e.sourceTarget.feature.id;
    document.getElementById('dataTitle').innerHTML = nut;
    openNav();

    const query = queryYearly(nut);
    const response = await fetch(address + encodeURIComponent(query));
    const json = await response.json();

    setChart(json.results.bindings);

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
    console.log(mymap.getZoom());
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
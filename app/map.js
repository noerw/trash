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

/**
 * nuts0 = Länder
 * nuts1 = bundesländer
 * nuts2 = Regierungsbezirke
 * nuts3 = Kreise
 */

const nuts0 = ["BE", "GR", "BG", "CZ", "DK", "DE", "EE", "IE", "ES", "FR", "HR", "IT", "CY", "LV", "LT", "LU", "HU", "MT", "NL", "AT", "PL", "PT", "RO", "SI", "SK", "FI", "SE", "UK"];
const nuts1 = ["DE1", "DE2", "DE3", "DE4", "DE5", "DE6", "DE7", "DE8", "DE9", "DEA", "DEB", "DEC", "DED", "DEE", "DEF", "DEG"];
const nuts2 = [];
const nuts3 = [];

//Die normale URL ist http://nuts.geovocab.org/id/" + nutID + "_geometry.kml  aber dann kommt es immer zu einem fehler wegen crossorigin.
//Deshalb einfach über die cors.io seite als proxy laufen lassen. 
//Wenn bessere idee dann bitte ändern!!!!

function visualizeNuts0() {
    layerGroup.clearLayers();    
    nuts0.forEach(nutID => {
        url = "https://cors.io/?http://nuts.geovocab.org/id/" + nutID + "_geometry.kml";
        var nutLayer = omnivore.kml(url)
            .on('ready', function () {
                console.log("ID: " + nutID + " loaded...");
                nutLayer.eachLayer(function (layer) {
                    layer.bindPopup(layer.feature.properties.name);
                })
            })
            .addTo(layerGroup);
    });
}

function visualizeNuts1() {
    layerGroup.clearLayers();    
    nuts1.forEach(nutID => {
        url = "https://cors.io/?http://nuts.geovocab.org/id/" + nutID + "_geometry.kml";
        var nutLayer = omnivore.kml(url)
            .on('ready', function () {
                console.log("ID: " + nutID + " loaded...");
                nutLayer.eachLayer(function (layer) {
                    layer.bindPopup(layer.feature.properties.name);
                })
            })
            .addTo(layerGroup);
    });
}


mymap.on('zoomend', function (e) {
    zoom_based_layerchange();
});


function zoom_based_layerchange() {
    console.log(mymap.getZoom());
}
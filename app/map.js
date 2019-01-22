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
var queryHeader =  'PREFIX euwaste: <http://course.geoinfo2018.org/G3#> PREFIX qb: <http://purl.org/linked-data/cube#> PREFIX nuts: <http://rdfdata.eionet.europa.eu/page/ramon/nuts/> ';



var nut0Codes = [];
var nut2Codes = [];


loadNUTS();
init();


function getAllNuts(){
    nutsLevel0.features.forEach(element => {
        nut0Codes.push(element.id)
    });

    nutsLevel2.features.forEach(element => {
        nut2Codes.push(element.id)
    });
}

function builQuery(){
    var queryContent = "?obs a qb:Observation.   ?obs euwaste:refArea nuts:DE.  ?obs euwaste:attrWastePerCapita ?wasteGeneration."
    var completeQuery = queryHeader + "SELECT DISTINCT * WHERE {"+queryContent+"}"
    return completeQuery
}


function init(){
    getAllNuts()
    let query = builQuery()
    console.log(query)
    fetch(address + encodeURIComponent(query))
        .then(response => {
            console.log(response)
            return response.json()
        })
        .then(response => {
            console.log(response)
        });           
}

function onclick(e) {
    var nut = e.sourceTarget.feature.id;
    console.log(nut);
    getAllNuts();

}
  
function onEachFeature(feature, layer) {
    layer.on({
        click: onclick
    });
}

function loadNUTS(){
    
    if(mymap.getZoom() > 6){
        layerGroup.clearLayers();
        geojson = L.geoJson(nutsLevel2, {
            onEachFeature: onEachFeature,
            style : function(feature){

            }
        }).addTo(layerGroup);
    }else{
        layerGroup.clearLayers();
        geojson = L.geoJson(nutsLevel0, {
            onEachFeature: onEachFeature,
            style : function(feature){

            }
        }).addTo(layerGroup);
    }
}

mymap.on('zoomend', function (e) {
    zoom_based_layerchange();
});

function zoom_based_layerchange() {
    console.log(mymap.getZoom());
    loadNUTS();
}
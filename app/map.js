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


loadNUTS();


function onclick(e) {
    
    index.postQuery();


    console.log(e);
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
            onEachFeature: onEachFeature
        }).addTo(layerGroup);
    }else{
        layerGroup.clearLayers();
        geojson = L.geoJson(nutsLevel0, {
            onEachFeature: onEachFeature
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
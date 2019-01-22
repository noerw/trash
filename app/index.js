var express = require('express');
var app = express();
app.use('/', express.static(__dirname + '/'));


var address = "http://giv-oct.uni-muenster.de:8890/sparql?default-graph-uri=http%3A%2F%2Fcourse.geoinfo2018.org%2FG3&query=";
var namespace = "http://course.geoinfo2018.org/G3#";
var query =  'SELECT DISTINCT * WHERE {?s ?p ?o}LIMIT 10'

app.get('/', function (req, res) {
    res.render('index.html');
});

app.post('/', function(req, res) {
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
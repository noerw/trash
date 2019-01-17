var express = require('express');
var app = express();
app.use('/', express.static(__dirname + '/'));


var address = "euwaste: <http://course.geoinfo2018.org/G3#>";





// Parse a SPARQL query to a JSON object
var SparqlParser = require('sparqljs').Parser;


var parser = new SparqlParser();

var parsedQuery = parser.parse(
  'PREFIX euwaste: <http://course.geoinfo2018.org/G3#>' +
  'SELECT ?p ?o  {  <http://course.geoinfo2018.org/G3#> ?p ?o }'
  );

function postQuery(){
  $.post(this.address, {
        query: this.parsedQuery,
        output: 'json'
      })
}
 

app.get('/', function (req, res) {
    res.render('index.html');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
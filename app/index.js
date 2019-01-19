var express = require('express');
var app = express();
app.use('/', express.static(__dirname + '/'));


var address = "http://course.geoinfo2018.org/G3#";





// Parse a SPARQL query to a JSON object
var SparqlParser = require('sparqljs').Parser;


var parser = new SparqlParser();

var parsedQuery = parser.parse(
  'SELECT DISTINCT * WHERE {?s ?p ?o}'
  );

function postQuery(){
  $.post(address, {
        query: parsedQuery,
        output: 'json'
      })
  alert("hi")
}


 

app.get('/', function (req, res) {
    res.render('index.html');
});

app.post('/', function(req, res) {
    console.log(res)
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
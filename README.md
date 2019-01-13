# trash
> project in geoinformation in society, ifgi 2018

Linked Data geo-visualization of European waste generation.

To generate the RDF data either run `make`, or if not available:

```sh
node rdf_generator/parse_csv.js \
  --input src_data/subset/eu_states_waste_generation_timeseries_subset.csv \
  --output rdf_data/group3_euwaste.turtle
```


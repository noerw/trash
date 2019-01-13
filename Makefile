CSV=$(wildcard src_data/subset/*.csv)
TURTLE=$(addsuffix .turtle,$(basename $(CSV)))

.PHONY: rdf rdf.debu

default: debug

rdf: $(TURTLE)

%.turtle: %.csv
	rdfgen --input $< --output rdf_data/$(notdir $*).turtle

rdf.debug:
	@echo "==========================================="
	@echo " => generating test RDF for a single file"
	@echo "==========================================="

	@rdfgen -v \
	  --input src_data/subset/eu_states_waste_generation_timeseries_subset.csv



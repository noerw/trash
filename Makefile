CSV=$(src_data/subset/*.csv)

.PHONY: debug

default: debug

debug:
	@echo "==========================================="
	@echo " => generating test RDF for a single file"
	@echo "==========================================="

	@node rdf_generator/parse_csv.js -v \
	  --input src_data/subset/eu_states_waste_generation_timeseries_subset.csv \
	  --output rdf_data/group3_euwaste.turtle

%.turtle: %.csv
	# FIXME: strip path prefix from output
	node rdf_generator/parse_csv.js \
	  --input $< \
	  --output rdf_data/$*.turtle


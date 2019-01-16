.PHONY: rdf build
default: rdf

rdf:
	rdfgen -v --output rdf_data/euwaste.turtle src_data/subset/*.csv

build:
	cd rdf_generator && npm install -g

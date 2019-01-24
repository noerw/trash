# Waste Generation Group 3
> project in geoinformation in society, ifgi 2018
Linked Data geo-visualization of European waste generation.

This project was developed in M. Sc. Goinformatics program. ”Waste production in the EU states” and
                is the result of the course Geoinformation in Society. In this course we get to know the connection
                between Linked Data in the Semantic Web and Linked Open Science. The result is our project, where we
                show on a leaflet choropleth map of Europe the respective garbage production per head and country.


## Motivation
We humans produce more and more garbage. We do not want to tolerate this development any longer.
                    For this reason, we have taken a closer look at the amount of waste generated and found that the
                    reported waste production is differs greatly between countries and between regions.
                    We asked ourselves whether a visualization that shows people how much waste is produced could
                    initiate a
                    dialog between instances that produce a lot of waste and instances with a better waste balance.
                    For now, we focus on the EU and regional levels.
                  
                  
## Goals
 We live in the age of linked data. This allows us to link data and retrieve it through semantic
                     queries. But more importantly, it allows us to share information in a way that computers can read
                     automatically. That’s why we work with RDF. So every connection in RDF is coherent and traceable
                     and can be retrieved thanks to linked data. But through linked data alone we do not reach our goal
                     of
                     making people more responsible with resources. For this reason, simple but elegant visualization
                     is very important. We want to provide meaningful information only a few clicks away.
                     
                     
                     
 ## Tools used to Achieve the Goal and Outcomes
For this tool we decided to use a leaflet choropleth map. This representation can be used
                    effectively
                    to report area values on virtually any scale, from global to local. In addition, the data can be
                    viewed
                    on different levels and in different ways. Starting at the lowest zoom level, the EU data is
                    visualized.
                    Zooming in will visualize the regional data.
                    It is also helpful in identifying contexts or informing people about how their area compares to
                    others.
                    This tool should visualize the generated waste per instance on a map. In addition, the user should
                    be able to click on a specific instance and get an additional visualization of the available data in
                    the form of graphs.
                    
                    
## How RDF Data is build
Below you can see an example of the triplestore (RDF store).  The excerpt shows observation 
                    from the year 2004. The NUTS region is Germany. Two values are also transferred. One is per capita
                    waste generation and the other is energy recovery.

```
euwaste:obs_2004_DE a qb:Observation;
     qb:dataSet euwaste:dataset;
     euwaste:refArea nuts:DE;
     euwaste:refPeriod "2004"^^xsd:gYear;
     euwaste:attrWastePerCapita "4412"^^xsd:decimal;
     euwaste:attrEnergyRecovery "138"^^xsd:decimal.
```
The code excerpt was taken from the file euwaste.turtle. The file is stored in the folder `rdf_data`.                                              
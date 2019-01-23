var ctx = document.getElementById("wasteOverTime").getContext('2d');

var labels = [];
var datas = [];
var data = {

};
var options = {

};



function setChart(input){
    labels = [];
    datas = [];
    data = {    
        labels: labels,
        datasets: [
            {
                label: "Waste generation",
                fillColor: "rgba(220,220,220,0.2)",
                strokeColor: "rgba(220,220,220,1)",
                pointColor: "rgba(220,220,220,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(220,220,220,1)",
                data: datas
            }
        ]};
        
    for(i = input.length-1; i >= 0; i--){
        labels.push(input[i].year.value);
        datas.push(input[i].wasteGeneration.value);
    }

    var wasteOverTime = new Chart(ctx, {
        type: 'line',
        data: data,
        options: options
    });
}
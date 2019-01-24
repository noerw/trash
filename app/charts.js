var lineChart = document.getElementById("wasteOverTime").getContext('2d');

var pieChart = document.getElementById("wastePrc").getContext('2d');

var labels = [];
var datas = [];
var data = {

};
var options = {

};



function setLineChart(input){
    labels = [];
    datas = [];
    data = {    
        labels: labels,
        datasets: [
            {
                label: "Waste generation",
                backgroundColor: "#64A8FF",
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

    var wasteOverTime = new Chart(lineChart, {
        type: 'line',
        data: data,
        options: options
    });
}

function setPrcChart(input){
    pieLabels = [];
    pieData = [];
    data2 = {    
        labels: pieLabels,
        datasets: [
            {
                label: "Waste Distribution",
                backgroundColor: ["#CDCD2F", "#2ECC40", "#FF4136"],
                fillColor: "rgba(220,220,220,0.2)",
                strokeColor: "rgba(220,220,220,1)",
                pointColor: "rgba(220,220,220,1)",
                pointStrokeColor: "#fff",
                pointHighlightFill: "#fff",
                pointHighlightStroke: "rgba(220,220,220,1)",
                data: pieData
            }
        ]
    };


    if(input  == null){
        console.log("test");
        var PieChart = new Chart(pieChart,{
            type: 'doughnut',
            data: [],
            options: options
        });



        return;


    }else{

        const energyRecovery = input.energyRecovery.value;
        const recycling = input.recycling.value;
    
    
        pieData.push(energyRecovery);
        pieData.push(recycling);
        pieData.push(input.wasteGeneration.value - energyRecovery - recycling);
    
        pieLabels.push("Energy Recovery");
        pieLabels.push("Recycling");
        pieLabels.push("Waste");
        var PieChart = new Chart(pieChart,{
            type: 'doughnut',
            data: data2,
            options: options
        });

    }




}





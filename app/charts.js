var lineChart = document.getElementById("wasteOverTime").getContext('2d');

var pieChart = document.getElementById("wastePrc").getContext('2d');

var labels = [];
var datas = [];
var data = {

};

var wasteOverTime;

var PieChart;

var options = {
    scales: {
        yAxes: [{
            scaleLabel: {
                display: true,
                labelString: 'kg/Capita'
            }
        }],
        xAxes: [{
            scaleLabel: {
                display: true,
                labelString: 'Year'
            }
        }]
    },
    responsive: false,
    width: 800,
    height: 800,
};

function setLineChart(input) {
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
        ]
    };

    for (i = input.length - 1; i >= 0; i--) {
        labels.push(input[i].year.value);
        datas.push(input[i].wasteGeneration.value);
    }

    if (wasteOverTime != undefined || wasteOverTime != null) {
        wasteOverTime.destroy();
    }

    wasteOverTime = new Chart(lineChart, {
        type: 'line',
        data: data,
        options: options
    });
}

function setPrcChart(input) {
    console.log("newChart");
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

    if (input == null) {
        if (PieChart != undefined || PieChart != null) {
            PieChart.destroy();
        }

        PieChart = new Chart(pieChart, {
            type: 'doughnut',
            data: [],
            options: pieOptions
        });

        pieOptions = {
            responsive: false,
            width: 800,
            height: 800,
            title: {
            }
        }
        return;
    } else {
        var pieOptions = {
            responsive: false,
            width: 800,
            height: 800,
            title: {
                display: true,
                text: 'Waste Distribution'
            },
            tooltips: {
                callbacks: {
                    label: function (tooltipItem, data) {
                        var dataset = data.datasets[tooltipItem.datasetIndex];
                        var currentValue = dataset.data[tooltipItem.index];

                        var total = parseInt(dataset.data[0]) + parseInt(dataset.data[1]) + parseInt(dataset.data[2]);
                        var percentage = Math.floor(((currentValue / total) * 100) + 0.5);
                        return " " + percentage + "%";
                    }
                }
            }
        }
        const energyRecovery = input.energyRecovery.value;
        const recycling = input.recycling.value;

        pieData.push(energyRecovery);
        pieData.push(recycling);
        pieData.push(input.wasteGeneration.value - energyRecovery - recycling);

        pieLabels.push("Energy Recovery");
        pieLabels.push("Recycling");
        pieLabels.push("Waste");

        if (PieChart != undefined || PieChart != null) {
            PieChart.destroy();
        }

        PieChart = new Chart(pieChart, {
            type: 'doughnut',
            data: data2,
            options: pieOptions
        });

    }
}





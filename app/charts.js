var ctx = document.getElementById("wasteOverTime").getContext('2d');

var data = [];

var options = {

};

var wasteOverTime = new Chart(ctx, {
    type: 'line',
    data: data,
    options: options
});
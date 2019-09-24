/**
 * 颜色：区分版本
 * 圆形面积： 区分
 * X 轴位置： Charge 创建数
 * Y 轴位置： Charge 支付数
 */
var countries, myChart;

var ctx = document.getElementById("myChart").getContext('2d');

var rScale = d3.scaleSqrt().domain([0, 5e8]);
var incomeFormat = d3.format(',');

var levelColor = {
	basic: 'rgb(127, 235, 0)',
	free: 'rgb(255, 231, 0)',
	standard: 'rgb(0, 213, 233)',
	advance: 'rgb(255, 88, 114)'
};

Chart.defaults.global.defaultFontFamily = "'Open Sans', sans-serif";
Chart.defaults.global.defaultFontColor = '#333';
Chart.defaults.global.animation.duration = 0;

var startYear = 1800, endYear = 1804, chosenYear = 1800;


var yearLabelPlugin = {
	beforeDraw() {
		if(!myChart) return;

		myChart.ctx.save();
		var geom = myChart.chartArea;
		var w = geom.right - geom.left;
		var h = geom.bottom - geom.top;
		var fontSize = Math.min(w * 0.4, 400);

		// Draw background year label
		myChart.ctx.textAlign = 'center';
		myChart.ctx.textBaseline = 'middle';
		myChart.ctx.fillStyle= '#eee';
		myChart.ctx.font = fontSize + 'px Aleo';
		myChart.ctx.fillText(chosenYear, geom.left + 0.5 * w, geom.top + 0.5 * h);
		myChart.ctx.restore();
	}
}

function initChart() {
	myChart = new Chart(ctx, {
	  type: 'bubble',
	  options: {
      maintainAspectRatio: false,
			legend: {
				display: false,
			},
	    scales: {
	      yAxes: [{
					ticks: {
						min: 10,
						max: 90
					},
					scaleLabel: {
						display: true,
						labelString: '支付数',
						fontSize: 16,
						lineHeight: 2
					}
	      }],
	      xAxes: [{
					type: 'logarithmic',
					ticks: {
						min: 300,
						max: 5000,
						callback: function(value) {
							var ticks = [300, 500, 1000, 5000];
							return ticks.indexOf(value) === -1 ? '' : incomeFormat(value);
						}
					},
					scaleLabel: {
						display: true,
						labelString: '创建数',
						fontSize: 16,
						lineHeight: 2
					}
	      }]
	    },
			tooltips: {
				xPadding: 10,
				yPadding: 10,
				titleFontSize: 20,
				titleMarginBottom: 10,
				bodyFontSize: 14,
				callbacks: {
					title: function(tooltipItem, data) {
						var d = data.datasets[tooltipItem[0].datasetIndex];
						return d.label;
					},
					label: function(tooltipItem, data) {
						return '支付数：' + incomeFormat(tooltipItem.xLabel) + ' 创建数： ' + tooltipItem.yLabel.toFixed(1);
					}
				}
			}
	  },
    plugins: [yearLabelPlugin]
	});
}

function getDataset() {
	var i = chosenYear - startYear;

	// Get the data for chosenYear
	var data = countries.map(function(d) {
		return {
			acct: d.acct,
			acctLevel: d.acctLevel,
			yDimension: +d.yDimension[i],
			xDimension: +d.xDimension[i],
			pop: +d.population[i],
		};
	});

	// Filter out nations w/out data
	data = data.filter(function(d) {return d.yDimension && d.xDimension && d.pop;});

	// Sort by population size so that small circles are in front
	data = _.sortBy(data, function(d) {return -d.pop;});

	// Get data array (in structure required by Chart.js)
	var points = data.map(function(d) {
		return {
			x: d.yDimension,
			y: d.xDimension,
			r: rScale(d.pop)
		};
	});

	// Get color array
	var colors = data.map(function(d) {return levelColor[d.acctLevel];});

	// Get label array
	var labels = data.map(function(d) {return d.label;});

	// Create dataset
	var dataset = {
		data: points,
		backgroundColor: colors,
		borderColor: '#777',
		myLabels: labels
	};

	return dataset;
}

function update() {
	if(!countries) return;

	var rMax = (myChart.chartArea.bottom - myChart.chartArea.top) / 20;
	rScale.range([0, rMax]);

	myChart.data = {
    datasets: [getDataset()]
  };
	myChart.update();
}

d3.json('http://localhost:1234/gapminder-data.json')
  .then(function(json) {
	countries = json;

	initChart();
	update();
});

document.getElementById('year-slider').addEventListener('input', function(e) {
	chosenYear = e.target.value;
	update();
});

// Call update on resize to ensure rScale is up to date
window.addEventListener('resize', update);

// Call update when fonts have loaded
WebFont.load({
  google: {
    families: ['Open Sans', 'Aleo']
  },
	active: update
});

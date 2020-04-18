var width = 960, height = 650;

// MERCATOR
var projection = d3.geo.mercator()
    .center([72.8777, 19.089]) // Approximately the coordinates of Mumbai (slightly North)
    .scale(90000)
    .translate([width / 2, 310]);

var path = d3.geo.path()
    .projection(projection);


var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);

// Div for the tooltip 
var tooltip = d3.select('body').append('div')
    .attr('class', 'hidden tooltip');

queue()
    .defer(d3.json, 'Mumbai_Topojson.topojson')               
    .defer(d3.csv, 'Facilities_in_Mumbai_COVID_19_Cases.csv')
    .defer(d3.csv,'input_file_v1_dashboard.csv')
    .await(ready);

// The default property to be mapped
var property1 = 'Number of Cases- Very Congested Area';
var property2 = 'Number of Cases- Medium Congested';
var property3 = 'Number of Cases- Standalone Structure';

function ready(error, MAP, DATA, LOC) {
    if (error) throw error; 
    
    // Mumbai data
    var mumbai = topojson.feature(MAP, MAP.objects.Mumbai);  

    var ward_id = {};
    DATA.forEach(function(d) { ward_id[d.Ward] = d.Ward})

    var population = {};
    LOC.forEach(function(d) { population[d.Ward] = parseInt(d.Population)})

    var ward_names = {};
    LOC.forEach(function(d) { ward_names[d.Ward] = d["Ward location"]});

    var prop_value = {};
    var percent_value = {};
    var prop_value_multiply = {};
    DATA.forEach(function(d) {
        prop_value[d.Ward] = 0;
        prop_value_multiply[d.Ward] = 0;
        if(d[property1]){
            prop_value[d.Ward] += parseInt(d[property1]);
            prop_value_multiply[d.Ward] += prop_value[d.Ward]*3.6;
        } 
        if(d[property2]){
            prop_value[d.Ward] += parseInt(d[property2]);
            prop_value_multiply[d.Ward] += prop_value[d.Ward]*2.6;
        } 
        if(d[property3]){
            prop_value[d.Ward] += parseInt(d[property3]);
            prop_value_multiply[d.Ward] += prop_value[d.Ward]*1.5;
        } 

        if(d[property1]==null || d[property2]==null || d[property3]==null || d[property1]==0 || d[property2]==0 || d[property3]==0)
            prop_value_multiply[d.Ward] = 0;
        
        percent_value[d.Ward] = prop_value_multiply[d.Ward]/population[d.Ward];
        console.log(ward_names[d.Ward] + " " + ward_id[d.Ward] + " " + prop_value[d.Ward] + " " + population[d.Ward] + " " + percent_value[d.Ward]);
    });

    svg.append("g")
        .attr("class", "mumbai")
        .selectAll("path")
        .data(mumbai.features)
        .enter()
        .append("path")
        .attr("class", "ward")
        .attr("d", path)

        // WARD FILLING STYLE
        .style("fill", function(d) { 
            if(percent_value[d.properties.name] == 0)
                return "green";
            else if(percent_value[d.properties.name] > 0 && percent_value[d.properties.name] < 0.0001)
                return "blue";
            else if(percent_value[d.properties.name] >=0.0001 && percent_value[d.properties.name] < 0.0002)
                return "orange";
            else if(percent_value[d.properties.name] >= 0.0002)
                return "red";
        
        })
        .on('mousemove', function(d) {
            // Gets coordinates for the Mouse pointer
            var mouse = d3.mouse(svg.node()).map(function(d) {
                return parseInt(d);
        });
    // Un hides the div for the tooltip and the positions it Also adds the html content
    // @TODO: Format the population values to put commas
    tooltip.classed('hidden', false)
        .attr('style', 'left:' + (mouse[0] + 15) +
                'px; top:' + (mouse[1] + 40) + 'px')
        .html(ward_names[d.properties.name] + ": "+ prop_value[d.properties.name].toLocaleString());
    })
    .on('mouseout', function() {
        tooltip.classed('hidden', true);
    });

    //Borders 
    svg.append("path")
        .datum(topojson.mesh(MAP, MAP.objects.Mumbai, function(a, b) { return a !== b; }))
        .attr("class", "mumbai-boundary")
        .attr("d", path);  

    var borderPath = svg.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("height", height)
        .attr("width", width)
        .style("stroke", 'black')
        .style("fill", "none")
        .style("stroke-width", 2);

    // LEGEND OF MAP
    svg.append("circle").attr("cx",50).attr("cy",130).attr("r", 6).style("fill", "red")
    svg.append("circle").attr("cx",50).attr("cy",160).attr("r", 6).style("fill", "orange")
    svg.append("circle").attr("cx",50).attr("cy",190).attr("r", 6).style("fill", "blue")
    svg.append("circle").attr("cx",50).attr("cy",220).attr("r", 6).style("fill", "green")
    svg.append("text").attr("x", 70).attr("y", 130).text(">0.02% (Very High Risk Zone)").style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append("text").attr("x", 70).attr("y", 160).text("0.01% - 0.02% (High Risk Zone)").style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append("text").attr("x", 70).attr("y", 190).text("0% - 0.01% (Moderate Risk Zone)").style("font-size", "15px").attr("alignment-baseline","middle")
    svg.append("text").attr("x", 70).attr("y", 220).text("0% (Low Risk Zone)").style("font-size", "15px").attr("alignment-baseline","middle")
};
function loadKaryoFile(file, callback) {
	$.getJSON(file, function(data) {
		if (typeof callback !== "undefined") {
			callback(data);
		}
	});
	return file;
}



function karyo_to_coords(data) {
	var total = 0;
	var spacer = set_spacer(data);
	$.each(data.chromosomes, function(key, value) {
		total += value.length + spacer;
	});
	var current = 0;
	var index = 0;
	for (var i = 0; i < data.order.length; i++) {
		var key = data.order[i];
		var value = data.chromosomes[key];
		data.chromosomes[key] = {
			"value" : value.length,
			"startAngle" : ((current + spacer) / total) * (2 * Math.PI),
			"index" : index++,
			"genome_id" : value.genome_id,
			"name" : key,
			"rc" : value.rc
		};
		current += value.length + spacer;
		data.chromosomes[key].endAngle = (current / total) * (2 * Math.PI);

		if (value.rc == true) {
			var startAngle = data.chromosomes[key].startAngle;
			var endAngle = data.chromosomes[key].endAngle;
			data.chromosomes[key].startAngle = endAngle;
			data.chromosomes[key].endAngle = startAngle;
		}

	}
	return data.chromosomes;
}

function set_spacer(data) {
	var spacer = 0;
	$.each(data.chromosomes, function(key, value) {
		spacer += value.length;
	});
	spacer = spacer * 0.0038; // ca. 4% der Gesamtsumme aller Sequenzen //
	// entsprechen dem geeigneten Spacer
	return spacer;
}

function create_new_karyo(karyo, g){
	var key = g.name;
	var x = karyo[key].x + karyo[key].width;
	var width = karyo[key].width * (-1);
	karyo[key] = {
			"value" : karyo[key].value,
			"index" : karyo[key].index,
			"x" : x,
			"width": width,
			"genome_id" : karyo[key].genome_id,
			"name" : key,
			"rc" : karyo[key].rc
		};
return karyo;
}

var fill = d3.scale.category20c();

function fillByIdy(identity) {
	if (identity < 46) {
		return "#FF1600";
	} else if (identity < 50) {
		return "#FF3500";
	} else if (identity < 54) {
		return "#FF5300";
	} else if (identity < 58) {
		return "#FF7C01";
	} else if (identity < 62) {
		return "#FF9B01";
	} else if (identity < 66) {
		return "#FFC301";
	} else if (identity < 70) {
		return "#FFE201";
	} else if (identity < 74) {
		return "#EBDD02";
	} else if (identity < 78) {
		return "#CCD603";
	} else if (identity < 82) {
		return "#B7D103";
	} else if (identity < 86) {
		return "#99C905";
	} else if (identity < 90) {
		return "#7AC206";
	} else if (identity < 94) {
		return "#FFDD00";
	} else {
		return "#32B008";
	}
}


function loadLinkFile(file, karyo, callback) {
	$.getJSON(file, function(data) {
		if (typeof callback !== 'undefined') {
			callback(data);
		}
	});
	return file;
}

function link_to_coords(links, karyo) {
	$.each(links, function(key, value) {
		var s = karyo[value.source.name];
		var s_totalAngle = s.endAngle - s.startAngle;
		links[key].source.startAngle = s.startAngle + s_totalAngle *
				(value.source.start / s.value);
		links[key].source.endAngle = s.startAngle + s_totalAngle *
				(value.source.end / s.value);
		links[key].source.index = s.index;
		links[key].source.value = Math.abs(value.source.end -
				value.source.start);
		var t = karyo[value.target.name];
		var t_totalAngle = t.endAngle - t.startAngle;
		links[key].target.endAngle = t.startAngle + t_totalAngle *
				(value.target.start / t.value);
		links[key].target.startAngle = t.startAngle + t_totalAngle *
				(value.target.end / t.value);
		links[key].target.index = t.index;
		links[key].target.value = Math.abs(value.target.end -
				value.target.start);
	});
	return links;
}
function drawLinks(links) {
	circularSvg.append("g").attr("class", "chord").selectAll("path").data(links)
			.enter().append("path").attr("d",
					d3.svg.chord().radius(innerRadius)).style("fill",
					function(d) {
						// return fillByLength(Math.abs(d.target.end -
						// d.target.start));
						return fillByIdy(Math.abs(d.identity));
					}).style("opacity", 1);
}
var width = 1200;
var height = 3000;
var innerRadius = Math.min(width, height) * .41;
var outerRadius = innerRadius * 1.1;

var div = d3.select("body")
			.append("div")
			.attr("class", "tooltip")
			.style("opacity", 0);

div.append("div")
	.attr("class", "label");

var circularSvg = d3.select("body").append("svg").attr("width", width).attr("height",
		height).append("g").attr("transform",
		"translate(" + width / 2 + "," + height / 2 + ")");

function drawKaryo(karyo) {
	var array = $.map(karyo, function(value, index) {
		return [ value ];
	});
	circularSvg.append("g").attr("class", "karyo").selectAll("path").data(array)
			.enter().append("path").style("fill", function(d) {
				return fill(d.index);
			})
			.style("stroke", function(d) {
				return fill(d.index);
			})
			.attr(
					"d",
					d3.svg.arc().innerRadius(innerRadius).outerRadius(
							outerRadius)).on("mouseover", function(g, i) {
				fade(g, i, 0.1);
				add_tooltip_legend(g);
			})
			.on("mouseout", function(g, i) {
				fade(g, i, 1);
				reAdd_tooltip_legend();
			})
			.on("click", function(g, i) {
				circularSvg.selectAll(".chord path").remove();
				circularSvg.selectAll(".ticks g").remove();
				create_new_karyo(karyo, g);
				var array = $.map(karyo, function(value, index) {
					return [ value ];
				});
				addTicks(array);
				loadLinkFile("data/link.json", karyo, function(links) {
					full_links = links;
					redraw(identity_range, min_length);
				});
			})
	//addTicks(array);
}

function fade(g, i, opacity) {
	circularSvg.selectAll(".chord path")
		.filter(function(d) {
			return d.source.index != g.index && d.target.index != g.index;
		})
		.transition()
		.style("opacity", opacity);
}

function add_tooltip_legend(g){
	var name = "name: " + g.name;
	var length = "length: " + g.value + " bp";
	var text = name.concat(" \n", length);
	div.transition()
		.duration(200)
		.style("opacity", 0.9)
		.style("left", (d3.event.pageX - 34) + "px")
		.style("top", (d3.event.pageY - 12) + "px");
		div.html(name + "<br/>" + length);
		
}

function reAdd_tooltip_legend(d) {
	div.transition()
		.duration(500)
		.style("opacity", 0);
}

function clear_chords() {
	circularSvg.selectAll(".chord path").remove();
}

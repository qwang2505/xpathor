Object.prototype.toType = function() {
  return ({}).toString.call(this).match(/\s([a-zA-Z]+)/)[1].toLowerCase()
}

String.prototype.endswith = function(str){
	var index = this.indexOf(str);
	return index == this.length - str.length;
}

String.prototype.startswith = function(str){
	return this.indexOf(str) == 0;
}

Array.prototype.index = function(elem){
	for (var i=0; i < this.length; i++){
		if (this[i] == elem){
			return i;
		}
	}
	return -1;
}


// global var
var NOT_SET = "NOT_SET";

function _empty(value){
	if (value == undefined || value == null){
		return true;
	} else if (typeof(value) == "number"){
		return false;
	} else if (typeof(value) == "string"){
		value = value.trim();
		// if value is string, zero length means empty
		return value.length == 0;
	} else if (typeof(value) == "object" && value.length != undefined){
		return value.length == 0;
	} else {
		console.log("Unknow situation in _empty: ");
		console.log(value);
		return false;
	}
}

/*
 * Extract result.
 */
var ExtractResult = Class.extend({
	title: null,
	content: null,
	images: null,
	pubDate: null,
	source: null,
	nextPage: null,

	valid: function(){
		// whether this extract result is valid
		return this.title != null && this.content != null && this.title.length > 0;
	},

	// whether the new result is better than this one.
	better_result: function(new_result){
		// all result have already been validated
		// TODO select better result by content too
		console.log("compare results: ");
		console.log(this);
		console.log(new_result);
		if (_empty(this.images) && !_empty(new_result.images)){
			return true;
		} else if (_empty(this.nextPage) && !_empty(new_result.nextPage)){
			return true;
		} else if (_empty(this.source) && !_empty(new_result.source)){
			return true;
		} else if (_empty(this.pubDate) && !_empty(new_result.pubDate)){
			return true;
		} else {
			return false;
		}
	},
});

/*
 * Extract template
 */
var NewsTemplate = Class.extend({
	title: NOT_SET, 
	content: NOT_SET,
	pubDate: NOT_SET,
	source: NOT_SET,
	nextPage: NOT_SET,
	images: NOT_SET,
	removed: NOT_SET,

	init: function(data){
		this.title = data.title;
		this.content = data.content;
		this.pubDate = data.publish_time;
		this.source = data.source;
		this.nextPage = data.next_page;
		this.images = data.images;
	},
});

function show(elem){
	var result = "";
	for (attr in elem){
		result += attr + ": " + elem[attr] + "; ";
	}
	return result;
};

jQuery.fn.justtext = function() {
	var first = $(this).prop("firstChild");
	if (first == null || first == undefined){
		return "";
	}
	while (first.nodeType == 8){
		first = first.nextSibling;
	}
    return first.wholeText == null ? "" : first.wholeText;
};

jQuery.fn.tail = function(){
	var next = $(this).prop("nextSibling");
	if (next == null || next == undefined){
		return "";
	}
	return next.wholeText == null ? "" : next.wholeText;
}

var _top_domains = ["com", "edu", "gov", "int", "mil", "net", "org", "biz", 
	"info", "pro", "name", "museum", "coop", "aero", "idv", "xxx"];

function get_top_domain(){
	var url = window.location.href;
	var domain = url.split("://")[1].split("/")[0];
	var domain_frags = domain.split(".");
	var top_domain = domain;
	while (domain_frags.length >= 2){
		if (domain_frags.length == 2 && _top_domains.indexOf(domain_frags[0]) != -1){
			break;
		}
		var temp = domain_frags.join(".");
		if (temp == domain){
			domain_frags = domain_frags.slice(1);
			continue;
		}
		top_domain = temp;
		domain_frags = domain_frags.slice(1);
	}
	return top_domain;
}

// dragging element
var _dragging_elem = null;
var _delta_x = 0;
var _delta_y = 0;

// make dragging element movable
$("body").mousemove(function(event){
	if (_dragging_elem != null){
		$(_dragging_elem).css("top", event.clientY + _delta_y);
		$(_dragging_elem).css("left", event.clientX + _delta_x);
	}
});
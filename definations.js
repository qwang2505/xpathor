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
		return this.title != null && this.content != null;
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
    return first.wholeText == null ? "" : first.wholeText;
};

jQuery.fn.tail = function(){
	var next = $(this).prop("nextSibling");
	if (next == null || next == undefined){
		return "";
	}
	return next.wholeText == null ? "" : next.wholeText;
}
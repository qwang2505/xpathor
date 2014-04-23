/*
 * NewsProcessor, to process news extracting.
 */

var NewsProcessor = Processor.extend({

	name: "news",

	// start to extracting and generating xpath
	start: function(){
		var inject  = document.createElement("div");
		inject.innerHTML = "<div class='xpathor-tips' id='xpathor_tips'>Select Title</div></script>";
		document.body.insertBefore (inject, document.body.firstChild);
		setTimeout("$('#xpathor_tips').fadeOut('slow')", 3000);
		// TODO start to select title
		// TODO add click event handler for all elements in the website.
		var message = {
			type: "news",
			item: "title",
			data: {},
		};
		this.start_select(message, this.next);
	},
	// next step to process message
	next: function(message){
		
	},
});
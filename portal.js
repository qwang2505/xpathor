/*
 * NewsProcessor, to process news extracting.
 */

var PortalProcessor = Processor.extend({

	name: "portal",

	_tip_elem: null,
	_preview_elem: null,
	_dialog_elem: null,

	_step_map: {
		start: "block",
		block: "news",
		news: "headline",
	},

	_tip_map: {
		block: "News Block",
		news: "Normal News",
		headline: "Headline News",
	},

	show_tip: function(item_name){
		if (this._tip_elem == null){
			this._tip_elem  = document.createElement("div");
			this._tip_elem.id = "xpathor_tips";
			this._tip_elem.className = "xpathor-tips";
			document.body.insertBefore (this._tip_elem, document.body.firstChild);

		} else {
			$("#xpathor_tips").show();
		}
		//this._tip_elem.innerHTML = "<div class='xpathor-tips-wrapper'><div class='xpathor-tips' id='xpathor_tips'>Select " + this._tip_map[item_name] + "</div></div>";
		this._tip_elem.innerHTML = "Select " + this._tip_map[item_name];
		//setTimeout("$('#xpathor_tips').fadeOut('slow')", 3000);
	},

	move_tip: function(){
		$("#xpahtor_tips").unbind("mouseenter");
		$("#xpathor_tips").mouseenter(function(event){
			var cls = $(this).attr("class");
			if (cls == 'xpathor-tips'){
				$(this).attr("class", "xpathor-tips-bottom");
			} else {
				$(this).attr("class", "xpathor-tips");
			}
			return false;
		});
	},

	hide_tip: function(){
		$("#xpathor_tips").hide();
	},

	// start to extracting and generating xpath
	start: function(){
		this.pre_process();
		var message = {
			type: "portal",
			item: "start",
			obj: this,
			data: {},
		};
		this.next(message);
	},

	// next step to process message
	next: function(message){
		var item = message.item;
		if (item == undefined){
			console.log("[Portal] error: item is undefined while go to next step");
			return;
		} else if (this._step_map[item] != undefined){
			var next_item = this._step_map[item];
			message.item = next_item;
			this.show_tip(next_item);
			//this.stop_select();
			if (next_item == "block"){
				this.start_select(message, this.next);
				this.move_tip();
			}
		} else if (item == "headline"){
			// TODO select category, status, headline status
			this.stop_select();
			this.hide_tip();
			this.post_process(message);
		} else {
			console.log("[Portal] unknow item: " + item);
			return;
		}
	},

	// pre process, like run algorithm to get xpath, etc.
	pre_process: function(){
		// create dialog to let user select category, news status, headline status, etc.
		if (this._dialog_elem == null){
			$("body").append('<div id="xpathor_dialog" class="xpathor-dialog"></div>');
			this._dialog_elem = $("#xpathor_dialog");
		}
		return;
	},

	// in portal algorithm, single block xpath may select multiple blocks,
	// but we use index to select the only block user selected.
	_get_block_index: function(xpath, block){
		var blocks = XpathEvaluator.evaluate(document, xpath);
		for (var i=0; i < blocks.length; i++){
			if (blocks[i] == block){
				return i;
			}
		}
		// if reach here, something wrong happened
		return -1;
	},

	// post process data, preview, etc.
	post_process: function(message){
		// use generated xpath to extract block to get index of news block
		message.data.index = this._get_block_index(message.data.block, message.block);
		if (message.data.index == -1){
			alert("can not find block with block xpath, please contact the developer");
			return;
		}
		// prompt dislog to let user select category, status, headline status
		$("#xpathor_dialog").toggleClass("dialog-show");
		// log xpath
		console.log("block: " + message.data.block);
		console.log("index: " + message.data.index);
		console.log("news: " + message.data.news);
		console.log("headline: " + message.data.headline);
	},

    start_select: function(message, callback){
        $(window).mouseenter(function(event){
            $(event.target).addClass("xpathor-selection");
        });
        $(window).mouseleave(function(event){
            $(event.target).removeClass("xpathor-selection");
        });
        $(window).click(function(event){
            $(event.target).removeClass("xpathor-selection");
            //try {
                // get xpath
                var xpathor = new BlockXpathGenerator();
                var xpath;
                if (message.item == "block"){
	                xpath = xpath = xpathor.get_fixed_xpath(event.target);
	                message.block = xpathor.normalize_element(event.target);
	            } else if (message.item == "news"){
	            	var block = message.block;
	                xpath = xpathor.get_news_xpath(event.target, block, false);	
	                message.news = event.target;
	            } else if (message.item == "headline"){
	            	var block = message.block;
	            	// TODO get headline xpath
	                xpath = xpathor.get_headline_xpath(event.target, block, message.news, message.data.news);	
	            }
            //} catch (err) {
            //    console.log(err.name + ": " + err.message);
            //    return false;
            //}
            // TODO process xpath, pass to specific receiver
            var item_name = message.item;
            var obj = message.obj;
            message.data[item_name] = xpath;
            callback.call(obj, message);
            return false;
        });
        $(window).bind("contextmenu", function(event){
            $(event.target).removeClass("xpathor-selection");
            var item_name = message.item;
            var obj = message.obj;
            message.data[item_name] = NOT_SET;
            callback.call(obj, message);
            return false;
        });
    },
});
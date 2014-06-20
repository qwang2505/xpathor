/*
 * NewsProcessor, to process news extracting.
 */

var PortalProcessor = Processor.extend({

	name: "portal",

	message: null,

	_tip_elem: null,
	_preview_elem: null,
	_dialog_elem: null,

	_category_map: {
		1: "Important News",
		2: "International",
		3: "National",
		4: "Society",
		5: "Entertainment",
		6: "Sport",
		7: "Finance",
		8: "Technology",
	},
	_priority_map: {
		8: "P0",
		0: "P1",
		4: "P2",
	},

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

	_default_selection: '-1',
	_category_selection: '<select class="dialog-select"><option value="-1" selected>------</option><option value="1">Important News</option>' + 
						'<option value="2">International</option><option value="3">National</option>' + 
						'<option value="4">Society</option><option value="5">Entertainment</option>' +
						'<option value="6">Sport</option><option value="7">Finance</option>' +
						'<option value="8">Technology</option><option value="9">Military</option><option value="11">History</option>' +
						'<option value="10">Auto</option><option value="20">Fashion</option></select>',
	_priority_selection: '<select class="dialog-select"><option value="-1" selected>------</option><option value="8">P0</option>' +
						 '<option value="0">P1</option><option value="4">P2</option></select>',

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
			blocks: [],
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

	_next_block: function(message){
		if(confirm("Continue to select anothor block?")){
			message.item = "start";
			this.next(message);
		} else {
			this._finish_blocks(message);
		}
	},

	_create_select_dialog: function(callback){
		// create dialog to let user select category, news status, headline status, etc.
		if (this._dialog_elem == null){
			$("body").append('<div id="xpathor_dialog" class="xpathor-dialog">' + 
				'<div id="xpathor_dialog_selection_category" class="selection-block category">' + this._category_selection + '</div>' + 
				'<div id="xpathor_dialog_selection_headline" class="selection-block headline">' + this._priority_selection + '</div>' +
				'<div id="xpathor_dialog_selection_normal" class="selection-block normal">' + this._priority_selection + '</div>' +
				'<div class="selection-buttons"><input type="button" value="取消" id="xpathor_dialog_cancel" class="xpathor-dialog-button"></input>' + 
				'<input type="button" value="确定" id="xpathor_dialog_confirm" class="xpathor-dialog-button confirm"></input></div>' +
				'</div>');
			// add event listener for buttons
			var obj = this;
			$("#xpathor_dialog_cancel").click(function(){
				$("#xpathor_dialog").toggleClass("dialog-show");
				return false;
			});
			$("#xpathor_dialog_confirm").click(function(){
				var cate = $("#xpathor_dialog_selection_category .dialog-select").val();
				if (cate == "-1"){
					alert("Please select category of news block!");
					return;
				}
				var headline_p = $("#xpathor_dialog_selection_headline .dialog-select").val();
				if (headline_p == "-1"){
					alert("Please select priority of headline news!");
					return;
				}
				var normal_p = $("#xpathor_dialog_selection_normal .dialog-select").val();
				if (normal_p == "-1"){
					alert("Please select priority of normal news!");
					return;
				}
				obj.message.data.category = cate;
				obj.message.data.headline_priority = headline_p;
				obj.message.data.normal_priority = normal_p;
				// save blocks
				var block = {};
				block.block = obj.message.data.block;
				block.news = obj.message.data.news;
				block.headline = obj.message.data.headline;
				block.index = obj.message.data.index;
				block.category = obj.message.data.category;
				block.headline_priority = obj.message.data.headline_priority;
				block.normal_priority = obj.message.data.normal_priority;
				obj.message.blocks.push(block);
				$("#xpathor_dialog").toggleClass("dialog-show");
				callback.call(obj, obj.message);
				return false;
			});
			this._dialog_elem = $("#xpathor_dialog");
		}
	},

	// post process data, preview, etc.
	post_process: function(message){
		// use generated xpath to extract block to get index of news block
		message.data.index = this._get_block_index(message.data.block, message.block);
		if (message.data.index == -1){
			alert("can not find block with block xpath, please contact the developer");
			return;
		}
		// save selected data and generated xpath
		this.message = message;
		// prompt dislog to let user select category, status, headline status
		this._create_select_dialog(this._next_block);
		$("#xpathor_dialog").toggleClass("dialog-show");
	},

	_finish_blocks: function(message){
		// log xpath
		// alert template
		var template = '    "' + document.location.href + '": [\n';
		for (var i=0; i < message.blocks.length; i++){
			if (message.blocks[i].news == "NOT_SET"){
				message.blocks[i].news = "";
			}
			if (message.blocks[i].headline == "NOT_SET"){
				message.blocks[i].headline = "";
			}
			template += '        {\n';
			template += '            "block": \'' + message.blocks[i].block + '\',\n';
			template += '            "index": '+ message.blocks[i].index + ',\n';
			template += '            "category": ' + message.blocks[i].category + ',\n';
			template += '            "news": \'' + message.blocks[i].news + '\',\n';
			template += '            "headline": \'' + message.blocks[i].headline + '\',\n';
			template += '            "headline_status": ' + message.blocks[i].headline_priority + ',\n';
			template += '            "status": ' + message.blocks[i].normal_priority + ',\n';
			template += '        },\n';
			console.log("block: " + message.blocks[i].block);
			console.log("index: " + message.blocks[i].index);
			console.log("news: " + message.blocks[i].news);
			console.log("headline: " + message.blocks[i].headline);
			console.log("category: " + message.blocks[i].category);
			console.log("headline priority: " + message.blocks[i].headline_priority);
			console.log("normal priority: " + message.blocks[i].normal_priority);
		}
		template += '    ],\n';
		console.log(template);
		chrome.extension.sendMessage({ text: template });
		console.log("copy finish");
		// preview result
		this._preview_by_templates(message);
	},

	// extract result by portal template blocks
	_extract: function(blocks){
		var results = [];
		var template, result, elements, block, headlines, news, urls, item;
		for (var i=0; i < blocks.length; i++){
			template = blocks[i];
			result = [];
			elements = XpathEvaluator.evaluate(document, template.block);
			if (elements == null || elements.length < template.index){
				console.log("[Portal] Error when extract by template: block index out of range");
				continue;
			}
			block = elements[template.index];
			headlines = XpathEvaluator.evaluate(block, template.headline);
			headlines = headlines == null ? [] : headlines;
			news = XpathEvaluator.evaluate(block, template.news);
			news = news == null ? [] : news;
			urls = [];
			for (var j=0; j < headlines.length; j++){
				item = {};
				item.url = $(headlines[j]).attr("href").trim();
				if (urls.indexOf(item.url) != -1){
					continue;
				}
				item.title = $(headlines[j]).text().trim();
				item.category = template.category;
				item.status = template.headline_priority;
				console.log(item.url);
				console.log(item.title);
				result.push(item);
				urls.push(item.url);
			}
			for (var j=0; j < news.length; j++){
				item = {};
				item.url = $(news[j]).attr("href").trim();
				if (urls.indexOf(item.url) != -1){
					continue;
				}
				item.title = $(news[j]).text().trim();
				item.category = template.category;
				item.status = template.normal_priority;
				console.log(item.url);
				console.log(item.title);
				result.push(item);
				urls.push(item.url);
			}
			results.push(result);
		}
		return results;
	},

	preview: function(){
		// get template from local storage
		XpathorStorage.load_temp_template(document.location.host, "news", this._preview_by_templates, this);
	},

	// preview extracting result
	_preview: function(results){
		// generating html code by result
		var html = "";
		console.log(results.length);
		for (var i=0; i < results.length; i++){
			if (results[i].length == 0){
				continue;
			}
			html += "<table border='1' cellspacing='0' cellpadding='5' class='xpathor-preview-news-list-table'><tr>" +
					"<th>News</th><th>Category</th><th>Priority</th></tr>";
			for (var j=0; j < results[i].length; j++){
				html += "<tr><td class='xpathor-preview-news-list-title'><a href='" + results[i][j].url + "' target='_blank'>" + results[i][j].title + "</td>" + 
						"<td align='center' class='xpathor-preview-news-list-category'>" + this._category_map[results[i][j].category] + 
						"</td><td align='center' class='xpahtor-preview-news-list-priority'>" + 
						this._priority_map[results[i][j].status] + "</td></tr>";
			}
			html += "</table>";
		}
		$("#xpathor-preview-news-list").html(html);
		// show preview block
		$("#xpathor-preview").toggleClass("preview-show");
	},

	_preview_by_templates: function(result){
		var blocks = result.blocks;
		// create preview element and show result.
		if (this._preview_elem == null && $("#xpathor-preview").length === 0){
			var width = $(window).width();
			var height = $(window).height();
			var left = 0.3 * width / 2;
			$("body").append("<div class='xpathor-preview' id='xpathor-preview'><a class=\"xpathor-boxclose\" id=\"xpathor-boxclose\"></a>" + 
				"<div class='xpathor-preview-news-list' id='xpathor-preview-news-list'></div></div>");
			this._preview_elem = $("#xpathor-preview");
			this._preview_elem.css("left", left);
			$("#xpathor-preview-news-list").css("max-height", height - 195);
			$("#xpathor-preview-news-list").bind('mousewheel DOMMouseScroll', function(e){
				var e0 = e.originalEvent, delta = e0.wheelDelta || -e0.detail;
			    this.scrollTop += ( delta < 0 ? 1 : -1 ) * 30;
			    e.preventDefault();
			});
			$("#xpathor-boxclose").click(function(event){
				$("#xpathor-preview").toggleClass("preview-show");
			});
		} else if (this._preview_elem == null){
			this._preview_elem = $("#xpathor-preview");
		}
		// extract result by blocks
		var extract_result = this._extract(blocks);
		// generate html by result
		this._preview(extract_result);
		// show preview element
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
	                xpath = xpathor.get_fixed_xpath(event.target);
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
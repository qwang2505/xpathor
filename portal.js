/*
 * NewsProcessor, to process news extracting.
 */

var PortalProcessor = Processor.extend({

	name: "portal",

	message: null,

	_tip_elem: null,
	_preview_elem: null,
	_dialog_elem: null,

	_title_length_threshold: 5,

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
	_category_selection: '<select class="xpathor-dialog-select"><option value="-1" selected>------</option><option value="1">Important News</option>' + 
						'<option value="2">International</option><option value="3">National</option>' + 
						'<option value="4">Society</option><option value="5">Entertainment</option>' +
						'<option value="6">Sport</option><option value="7">Finance</option><option value="12">Other</option>' +
						'<option value="8">Technology</option><option value="9">Military</option><option value="11">History</option>' +
						'<option value="10">Auto</option><option value="13">Life</option><option value="15">Humor</option><option value="20">Fashion</option>' + 
						'<option value="18">Politics</option><option value="24">Law</option><option value="27">Beauty</option>' + 
						'<option value="35">Health</option><option value="38">Views</option>' +
						'<option value="40">Emotion</option><option value="41">Food</option></select>',
	_priority_selection: '<select class="xpathor-dialog-select"><option value="-1" selected>------</option><option value="8">P0</option>' +
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

	// pre process, like run algorithm to get xpath, etc.
	pre_process: function(){
		return;
	},

	// in portal algorithm, single block xpath may select multiple blocks,
	// but we use index to select the only block user selected.
	_get_block_index: function(xpath, block){
		console.log("block xpath in get block index: " + xpath);
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
				'<div id="xpathor_dialog_selection_category" class="xpathor-selection-block xpathor-category">' + this._category_selection + '</div>' + 
				'<div id="xpathor_dialog_selection_headline" class="xpathor-selection-block xpathor-headline">' + this._priority_selection + '</div>' +
				'<div id="xpathor_dialog_selection_normal" class="xpathor-selection-block xpathor-normal">' + this._priority_selection + '</div>' +
				'<div class="xpathor-selection-buttons"><input type="button" value="取消" id="xpathor_dialog_cancel" class="xpathor-dialog-button"></input>' + 
				'<input type="button" value="确定" id="xpathor_dialog_confirm" class="xpathor-dialog-button confirm"></input></div>' +
				'</div>');
			// add event listener for buttons
			var obj = this;
			$("#xpathor_dialog_cancel").click(function(){
				$("#xpathor_dialog").toggleClass("xpathor-dialog-show");
				return false;
			});
			$("#xpathor_dialog_confirm").click(function(){
				var cate = $("#xpathor_dialog_selection_category .xpathor-dialog-select").val();
				if (cate == "-1"){
					alert("Please select category of news block!");
					return;
				}
				var headline_p = $("#xpathor_dialog_selection_headline .xpathor-dialog-select").val();
				if (headline_p == "-1"){
					alert("Please select priority of headline news!");
					return;
				}
				var normal_p = $("#xpathor_dialog_selection_normal .xpathor-dialog-select").val();
				if (normal_p == "-1"){
					alert("Please select priority of normal news!");
					return;
				}
				obj.message.data.category = parseInt(cate);
				obj.message.data.headline_status = parseInt(headline_p);
				obj.message.data.status = parseInt(normal_p);
				// save blocks
				var block = {};
				block.block = obj.message.data.block;
				block.news = obj.message.data.news;
				block.headline = obj.message.data.headline;
				block.index = obj.message.data.index;
				block.category = obj.message.data.category;
				block.headline_status = obj.message.data.headline_status;
				block.status = obj.message.data.status;
				obj.message.blocks.push(block);
				$("#xpathor_dialog").toggleClass("xpathor-dialog-show");
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
			alert("can not find block with block xpath, please re-select block");
			this.restart(message);
			return;
		}
		// save selected data and generated xpath
		this.message = message;
		// prompt dislog to let user select category, status, headline status
		this._create_select_dialog(this._next_block);
		$("#xpathor_dialog").toggleClass("xpathor-dialog-show");
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
			template += '            "headline_status": ' + message.blocks[i].headline_status + ',\n';
			template += '            "status": ' + message.blocks[i].status + ',\n';
			template += '        },\n';
			console.log("block: " + message.blocks[i].block);
			console.log("index: " + message.blocks[i].index);
			console.log("news: " + message.blocks[i].news);
			console.log("headline: " + message.blocks[i].headline);
			console.log("category: " + message.blocks[i].category);
			console.log("headline priority: " + message.blocks[i].headline_status);
			console.log("normal priority: " + message.blocks[i].status);
		}
		template += '    ],\n';
		console.log(template);
		chrome.extension.sendMessage({ text: template });
		console.log("copy finish");
		// save template to local storage
		// TODO generate block id
		//XpathorStorage.save_portal_template(message.blocks);
		TemplateManager.add_blocks(message.blocks);
		// preview result
		this.preview_by_templates(message);
	},

	// extract result by portal template blocks
	_extract: function(blocks){
		var results = [];
		var template, result, elements, block, headlines, news, urls, item;
		for (var i=0; i < blocks.length; i++){
			try {
				template = blocks[i];
				result = [];
				try {
					elements = XpathEvaluator.evaluate(document, template.block);
				} catch (err){
					console.log("extract block elements failed by template");
					console.log(err);
					console.log(template.block);
					blocks[i].invalid = true;
					continue;
				}
				if (elements == null || elements.length < template.index){
					console.log("[Portal] Error when extract by template: block index out of range");
					blocks[i].invalid = true;
					continue;
				}
				block = elements[template.index];
				headlines = [];
				if (template.headline.length > 0){
					try {
						headlines = XpathEvaluator.evaluate(block, template.headline);
					} catch (err){
						console.log("extract headline failed by template");
						console.log(err);
						console.log(template.headline);
						blocks[i].invalid = true;
						continue;
					}
					headlines = headlines == null ? [] : headlines;
				}
				news = [];
				if (template.news.length > 0){
					try {
						news = XpathEvaluator.evaluate(block, template.news);
					} catch (err){
						console.log("extract normal news failed by template");
						console.log(err);
						console.log(template.news);
						blocks[i].invalid = true;
						continue;
					}
					news = news == null ? [] : news;
				}
				urls = [];
				for (var j=0; j < headlines.length; j++){
					item = {};
					item.url = $(headlines[j]).attr("href");
					if (item.url == null || item.url == undefined){
						console.log("can not get url for headline item: ");
						console.log(news[j]);
						continue;
					}
					item.url = item.url.trim();
					if (urls.indexOf(item.url) != -1){
						continue;
					}
					item.title = $(headlines[j]).text().trim();
					if (item.title.length != 0 && item.title.length < this._title_length_threshold){
						continue;
					}
					item.category = template.category;
					item.status = template.headline_status;
					item.elem = headlines[j];
					item.seed_id = template.id + "1";
					result.push(item);
					urls.push(item.url);
				}
				for (var j=0; j < news.length; j++){
					item = {};
					item.url = $(news[j]).attr("href");
					if (item.url == null || item.url == undefined){
						console.log("can not get url for item: ");
						console.log(news[j]);
						continue;
					}
					item.url = item.url.trim();
					if (urls.indexOf(item.url) != -1){
						continue;
					}
					item.title = $(news[j]).text().trim();
					if (item.title.length != 0 && item.title.length < this._title_length_threshold){
						continue;
					}
					item.category = template.category;
					item.status = template.status;
					item.elem = news[j];
					item.seed_id = template.id + "2";
					result.push(item);
					urls.push(item.url);
				}
				if (result.length == 0){
					blocks[i].invalid = true;
				}
				results.push({block: block, category: template.category, blockId: template.id, newslist: result});
			} catch (err) {
				console.log("extract failed by template");
				console.log(err);
				console.log(blocks[i]);
			}
		}
		return results;
	},

	preview: function(){
		// get template from local storage
		XpathorStorage.load_temp_template(document.location.host, "news", this.preview_by_templates, this);
	},

	preview_block: function(template, block_id){
		var blocks = template.blocks;
		var block = null;
		for (var i=0; i < blocks.length; i++){
			if (blocks[i].id == block_id.substr(0, block_id.length - 1)){
				block = blocks[i];
				break;
			}
		}
		if (block == null){
			console.log("Error: can not find block by id: " + block_id);
			return;
		}
		var ext = block_id[block_id.length-1];
		if (ext == "1"){
			block.news = "";
			block.priority = block.headline_status;
		} else if (ext == "2"){
			block.headline = "";
			block.priority = block.status;
		} else {
			console.log("Error: invlaid block id: " + block_id);
			return;
		}
		var extract_result = this._extract([block]);
		console.log(extract_result);
		this._preview_block(extract_result, block);
	},

	preview_by_templates: function(result){
		var blocks = result.blocks;
		// create preview element and show result.
		if (this._preview_elem == null && $("#xpathor-preview").length === 0){
			// create preview element
			// TODO need a close button?
			$("body").append("<div class='xpathor-preview' id='xpathor-preview'>" + 
				"<div class='xpathor-preview-news-list' id='xpathor-preview-news-list'></div></div>");
			this._preview_elem = $("#xpathor-preview");
		} else if (this._preview_elem == null){
			this._preview_elem = $("#xpathor-preview");
		}
		// extract result by blocks
		var extract_result = this._extract(blocks);
		// TODO save blocck news list
		TemplateManager.save_newslist(extract_result);
		console.log("extract result: ");
		console.log(extract_result);
		// generate html by result
		this._preview(extract_result, this);
		// show preview element
	},

	// preview extracting result, used by admin to show single block.
	_preview_block: function(results, block_template){
		// generating html code by result
		var block;
		for (var i=0; i < results.length; i++){
			if (results[i].newslist.length == 0){
				continue;
			}
			for (var j=0; j < results[i].newslist.length; j++){
				$(results[i].newslist[j].elem).parent().attr("xpathor_priority", this._priority_map[results[i].newslist[j].status] || "P2");
				$(results[i].newslist[j].elem).parent().addClass("xpathor-preview-block-news");
			}
			block = results[i].block;
			$(block).attr("xpathor_category", this._category_map[results[i].category]);
			$(block).attr("xpathor_priority", this._priority_map[block_template.priority] || "P2");
			$(block).addClass("xpathor-preview-block-block");
			var p = $(block).offset()
           	$(".xpathor-preview-block-div").css({left: p.left, top: p.top, width: $(block).width(), height: $(block).height()});
           	// scroll to element
           	$(window).scrollTop($(block).position().top);
		}
	},

	// get block preview div. If no available, create one
	_get_preview_block_div: function(block_id){
		var elems = $("div[class='xpathor-preview-block'][used='false']");
		if (elems.length > 0){
			var elem = elems[0];
			$(elem).attr("xpathor_block_id", block_id);
			$("span", $(elem)).each(function(){
				$(this).attr("xpathor_block_id", block_id);
			});
			return elem;
		}
		$("body").append("<div class='xpathor-preview-block' used='false' xpathor_block_id=\"" + block_id + "\">" + 
			"<div class='xpathor-preview-buttons'><span class='xpathor-preview-edit'" + 
			" xpathor_block_id=\"" + block_id + "\">Edit</span>" + "<span class='xpathor-preview-delete' " + 
			" xpathor_block_id=\"" + block_id + "\">Delete</span><span class='xpathor-preview-hide' " + 
			">Hide</span><span class='xpathor-preview-newslist-btn'>NewsList</span></div>" + 
			"<div class='xpathor-preview-category'></div><div class='xpathor-preview-newslist'></div></div>");
		var elems = $("div[class='xpathor-preview-block'][used='false']");
		if (elems.length > 0){
			var elem = elems[0];
			$(elem).attr("xpathor_block_id", block_id);
			$("span", $(elem)).each(function(){
				$(this).attr("xpathor_block_id", block_id);
			});
			return elem;
		}
		console.log("Error: create preview block failed");
	},

	// preview extracting result
	_preview: function(results, obj){
		console.log(results);
		// generating html code by result
		for (var i=0; i < results.length; i++){
			// use div to cover preview area, but need to show priority of news in the middel of news.
			if (results[i].newslist.length == 0){
				// if no news, should preview the block at least.
				//continue;
			}
			// construct newslist html
			var newslist_html = "<table style='min-width: 800px' cellspacing='0'><tr><td width='10%' class='xpathor-preview-newslist-seed'><strong>Seed Id</strong></td>" + 
								"<td style='width:10%' class='xpathor-preview-newslist-priority'><strong>Priority</strong></td><td><strong>Title</strong></td></tr>";
			var left = 999999, right = 0, top = 999999, bottom = 0;
			for (var j=0; j < results[i].newslist.length; j++){
				var p = this._priority_map[results[i].newslist[j].status] || "P2";
				$(results[i].newslist[j].elem).attr("xpathor_priority", p);
				$(results[i].newslist[j].elem).addClass("xpathor-preview-news");
				// TODO add news into newslist preview div
				var title = results[i].newslist[j].title;
				if (title == null || title == undefined || title.length == 0){
					// TODO solve relative link
					title = results[i].newslist[j].url;
				}
				newslist_html += "<tr><td class='xpathor-preview-newslist-seed'>" + results[i].newslist[j].seed_id + 
								"</td><td class='xpathor-preview-newslist-priority'>" + p + "</td><td><a target='_blank' href='" + 
								results[i].newslist[j].url + "'>" + title + "</a></td></tr>";
				var p = $(results[i].newslist[j].elem).offset();
				var width = $(results[i].newslist[j].elem).width();
				var height = $(results[i].newslist[j].elem).outerHeight();
				if (p.left < left){
					left = p.left;
				}
				if (p.top < top){
					top = p.top;
				}
				if (p.left + width > right){
					right =p.left + width;
				}
				if (p.top + height > bottom){
					bottom = p.top + height;
				}
			}
			newslist_html += "</table>";
			var block = results[i].block;
			// TODO need to record template id for later management, like delete, edit, etc.
			var preview_block = this._get_preview_block_div(results[i].blockId);
			var p = $(block).offset();
			var width = $(block).width();
			var height = $(block).outerHeight();
			if ((width / height > 10 || height / width > 10) && left >= 0 && top >= 0){
				if (p.left < left){
					left = p.left;
				}
				if (p.top < top){
					top = p.top;
				}
				if (left + width < right){
					width = right - left;
				}
				if (top + height < bottom){
					height = bottom - top;
				}
			} else {
				left = p.left;
				top = p.top;
			}
			
			// set preview position
			$(preview_block).css({left: left, top: top - 24, width: width, height: height + 24, display: "block"});
			// set to used to avoid using by other preview block.
			$(preview_block).attr("used", "true");
			// set newslist html
			$(".xpathor-preview-newslist", $(preview_block)).html(newslist_html);
			$("table", $(preview_block)).css({width: width - 50});
			// set extra attr on preview block to get later
			$(block).attr("xpathor_preview_block_id", results[i].blockId);
			// update cateogry
			$(".xpathor-preview-category", $(preview_block)).html(this._category_map[results[i].category]);
			$(".xpathor-preview-hide", $(preview_block)).click(function(){
				var block_id = $(this).attr("xpathor_block_id");
				var pre_block = $(this).parent().parent();
				$(pre_block).css({left: 0, top: 0, width: 0, height: 0, display: "none"});
				$(pre_block).attr("used", "false");
				$(pre_block).attr("xpathor_block_id", "");
				$(".xpathor-preview-news", $("*[xpathor_preview_block_id=\"" + block_id + "\"]")).each(function(){
					$(this).removeClass("xpathor-preview-news");
				});
				$("*[xpathor_preview_block_id=\"" + block_id + "\"]").attr("xpathor_preview_block_id", "");
				// remove button listeners
				$(".xpathor-preview-hide", $(pre_block)).unbind("click");
				$(".xpathor-preview-delete", $(pre_block)).unbind("click");
				$(".xpathor-preview-edit", $(pre_block)).unbind("click");
				$(".xpathor-preview-newslist-btn", $(pre_block)).unbind("click");
			});
			$(".xpathor-preview-delete", $(preview_block)).click(function(){
				var block_id = $(this).attr("xpathor_block_id");
				var pre_block = $(this).parent().parent();
				$(pre_block).css({left: 0, top: 0, width: 0, height: 0, display: "none"});
				$(pre_block).attr("used", "false");
				$(pre_block).attr("xpathor_block_id", "");
				$(".xpathor-preview-news", $("*[xpathor_preview_block_id=\"" + block_id + "\"]")).each(function(){
					$(this).removeClass("xpathor-preview-news");
				});
				$("*[xpathor_preview_block_id=\"" + block_id + "\"]").attr("xpathor_preview_block_id", "");
				TemplateManager.delete_block(block_id);
				// remove button listeners
				$(".xpathor-preview-hide", $(pre_block)).unbind("click");
				$(".xpathor-preview-delete", $(pre_block)).unbind("click");
				$(".xpathor-preview-edit", $(pre_block)).unbind("click");
				$(".xpathor-preview-newslist-btn", $(pre_block)).unbind("click");
			});
			$(".xpathor-preview-edit", $(preview_block)).click(function(){
				console.log("edit click");
				var bid = $(this).attr("xpathor_block_id");
				obj._create_edit_dialog(bid, obj);
				$("#xpathor_edit_dialog").toggleClass("xpathor-dialog-show");
			});
			$(".xpathor-preview-newslist-btn", $(preview_block)).click(function(){
				$(".xpathor-preview-newslist", $(this).parent().parent()).toggleClass("xpathor-preview-newslist-show");
			});
		}
	},

	_create_edit_dialog: function(block_id, obj){
		console.log(this);
		// create dialog to let user select category, news status, headline status, etc.
		if (this._edit_dialog_elem == null){
			$("body").append('<div id="xpathor_edit_dialog" class="xpathor-dialog">' + 
				'<div id="xpathor_dialog_edit_category" class="xpathor-selection-block xpathor-category">' + this._category_selection + '</div>' + 
				'<div id="xpathor_dialog_edit_headline" class="xpathor-selection-block xpathor-headline">' + this._priority_selection + '</div>' +
				'<div id="xpathor_dialog_edit_normal" class="xpathor-selection-block xpathor-normal">' + this._priority_selection + '</div>' +
				'<div id="xpathor_dialog_edit_block" class="xpathor-selection-block xpathor-block"><input type="text" value=\'\' /></div>' +
				'<div id="xpathor_dialog_edit_headline_xpath" class="xpathor-selection-block xpathor-headline-xpath"><input type="text" value=\'\' /></div>' +
				'<div id="xpathor_dialog_edit_news_xpath" class="xpathor-selection-block xpathor-news-xpath"><input type="text" value=\'\' /></div>' +
				'<div class="xpathor-selection-buttons"><input type="button" value="取消" id="xpathor_edit_dialog_cancel" class="xpathor-dialog-button"></input>' + 
				'<input type="button" value="确定" id="xpathor_edit_dialog_confirm" class="xpathor-dialog-button confirm"></input></div>' +
				'</div>');
			// add event listener for buttons
			$("#xpathor_edit_dialog_cancel").click(function(){
				$("#xpathor_edit_dialog").toggleClass("xpathor-dialog-show");
				return false;
			});
			$("#xpathor_edit_dialog_confirm").click(function(){
				var cate = $("#xpathor_dialog_edit_category .xpathor-dialog-select").val();
				if (cate == "-1"){
					alert("Please select category of news block!");
					return;
				}
				var headline_p = $("#xpathor_dialog_edit_headline .xpathor-dialog-select").val();
				if (headline_p == "-1"){
					alert("Please select priority of headline news!");
					return;
				}
				var normal_p = $("#xpathor_dialog_edit_normal .xpathor-dialog-select").val();
				if (normal_p == "-1"){
					alert("Please select priority of normal news!");
					return;
				}
				var block_xpath = $("#xpathor_dialog_edit_block input").val();
				var headline_xpath = $("#xpathor_dialog_edit_headline_xpath input").val();
				var news_xpath = $("#xpathor_dialog_edit_news_xpath input").val();
				// update templates and re-preview result
				var block_id = $(this).attr("xpathor_block_id");
				TemplateManager.edit_block(block_id, {category: parseInt(cate), headline_status: parseInt(headline_p), 
					status: parseInt(normal_p), headline: headline_xpath, news: news_xpath, block: block_xpath});
				obj.refresh_block_preview.call(obj, block_id);
				// hide dialog
				$("#xpathor_edit_dialog").toggleClass("xpathor-dialog-show");
				return false;
			});
			this._edit_dialog_elem = $("#xpathor_edit_dialog");
		}
		// update dialog values
		$("#xpathor_edit_dialog_confirm").attr("xpathor_block_id", block_id);
		var block = TemplateManager.get_block(block_id);
		$("#xpathor_dialog_edit_category select").val(block.category);
		$("#xpathor_dialog_edit_headline select").val(block.headline_status);
		$("#xpathor_dialog_edit_normal select").val(block.status);
		$("#xpathor_dialog_edit_block input").val(block.block);
		$("#xpathor_dialog_edit_headline_xpath input").val(block.headline);
		$("#xpathor_dialog_edit_news_xpath input").val(block.news);
	},

	refresh_block_preview: function(block_id){
		// refresh preview result of block 
		// first, stop preview block
		var pre_block = $("div[class='xpathor-preview-block'][xpathor_block_id='" + block_id + "']")[0];
        $(pre_block).css({left: 0, top: 0, width: 0, height: 0, display: "none"});
        $(pre_block).attr("used", "false");
        $(pre_block).attr("xpathor_block_id", "");
        $(".xpathor-preview-news", $("*[xpathor_preview_block_id=\"" + block_id + "\"]")).each(function(){
            $(this).removeClass("xpathor-preview-news");
        });
        // remove button listeners
        $(".xpathor-preview-hide", $(pre_block)).unbind("click");
		$(".xpathor-preview-delete", $(pre_block)).unbind("click");
		$(".xpathor-preview-edit", $(pre_block)).unbind("click");
		$(".xpathor-preview-newslist-btn", $(pre_block)).unbind("click");
        $("*[xpathor_preview_block_id=\"" + block_id + "\"]").attr("xpathor_preview_block_id", "");
        // then, preview by new template
        var template = TemplateManager.get_block(block_id);
        this.preview_by_templates({blocks: [template]})
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

	// restart
	restart: function(message){
        this.stop_select();
        this.hide_tip();
        this._next_block(message);
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
				message.block_paths = new Array();
				this.select_block(this, message, this.next, this.restart);
				this.move_tip();
			} else if (next_item == "news"){
				this.start_select(message, this.next);
			}
			// TODO fix here to select news and headline
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

	select_block: function(obj, message, callback, restart_callback){
        $(window).mouseenter(function(event){
            $(event.target).addClass("xpathor-selection");
            //var p = $(event.target).offset()
            //$(".xpathor-selection-2").css({left: p.left, top: p.top, width: $(event.target).width(), height: $(event.target).height()});
        });
        $(window).mouseleave(function(event){
            $(event.target).removeClass("xpathor-selection");
            //$(".xpathor-selection-2").css({left: 0, right: 0, width: 0, height: 0});
        });
        $(window).bind("contextmenu", function(event){
            $(event.target).removeClass("xpathor-selection");
            restart_callback.call(obj, message);
            return false;
        });
        $(window).click(function(event){
        	obj.stop_select();
        	$(window).keyup(function(event){
        		var code = event.which;
        		if (code == 38){
        			// press up
        			var elem =  $(".xpathor-selection")[0];
        			var parent = elem.parentNode;
        			if (parent.tagName == "BODY"){
        				return false;
        			}
        			console.log(elem);
        			message.block_paths.push(elem);
        			console.log(message.block_paths.length);
        			$(elem).removeClass("xpathor-selection");
        			$(parent).addClass("xpathor-selection");
        			var p = $(parent).offset()
            		$(".xpathor-selection-2").css({left: p.left, top: p.top, width: $(parent).width(), height: $(parent).height()});
        			return false;
        		} else if (code == 40){
        			// press down
        			if (message.block_paths.length == 0){
        				return false;
        			}
        			var child = message.block_paths.pop();
        			var elem =  $(".xpathor-selection")[0];
        			$(elem).removeClass("xpathor-selection");
        			$(child).addClass("xpathor-selection");
        			var p = $(child).offset()
            		$(".xpathor-selection-2").css({left: p.left, top: p.top, width: $(child).width(), height: $(child).height()});
        			return false;
        		} else if (code == 13){
        			$(window).unbind("keyup");
        			// press enter
        			var elem =  $(".xpathor-selection")[0];
        			var xpathor = new BlockXpathGenerator();
        			xpath = xpathor.get_fixed_xpath(elem);
	                message.block = xpathor.normalize_element(elem);
	                // stop select and switch
	                $(elem).removeClass("xpathor-selection");
            		$(".xpathor-selection-2").css({left: 0, top: 0, width: 0, height: 0});
	                // get to next step
	                var item_name = message.item;
            		var obj = message.obj;
            		message.data[item_name] = xpath;
            		message.block_paths = new Array();
            		callback.call(obj, message);
        			return false;
        		} else if (code == 27){
        			$(window).unbind("keyup");
        			var elem =  $(".xpathor-selection")[0];
	                // stop select and switch
	                $(elem).removeClass("xpathor-selection");
            		$(".xpathor-selection-2").css({left: 0, top: 0, width: 0, height: 0});
        			// press esc, restart select block
        			restart_callback.call(message.obj, message);
        			return false;
        		}
        		return true;
        	});
            return false;
        });
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
                if (message.item == "news"){
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


    // peep blocks, show peep dialog, contains all the templates
    peep_blocks: function(template){
    	// extract by template first, find out which blocks is used and which is not.
		this._extract(template.blocks);
    	// show dialog to display all the blocks.
    	console.log(template);
    },
});
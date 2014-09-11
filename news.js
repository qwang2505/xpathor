/*
 * NewsProcessor, to process news extracting.
 */

var NewsProcessor = Processor.extend({

	name: "news",

	_tip_elem: null,
	_preview_elem: null,

	_step_map: {
		start: "title",
		title: "content",
		content: "source",
		source: "publish_time",
		publish_time: "next_page",
		next_page: "images",
	},

	_tip_map: {
		title: "Title",
		content: "Content",
		source: "Source",
		publish_time: "Publish Time",
		next_page: "Next Page",
		images: "Images",
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
			type: "news",
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
			console.log("[News] error: item is undefined while go to next step");
			return;
		} else if (this._step_map[item] != undefined){
			var next_item = this._step_map[item];
			message.item = next_item;
			this.show_tip(next_item);
			//this.stop_select();
			if (next_item == "title"){
				this.start_select(message, this.next);
				this.move_tip();
			} else if (next_item == "content"){
				this.stop_select();
				message.content_paths = new Array();
				this.select_content(this, message, this.next);
			} else if (next_item == "source"){
				this.start_select(message, this.next);
			}
		} else if (item == "images"){
			this.stop_select();
			this.hide_tip();
			this.post_process(message);
		} else {
			console.log("[News] unknow item: " + item);
			return;
		}
	},

	// start to select element with mouse
    start_select: function(message, callback){
        $(window).mouseenter(function(event){
            $(event.target).addClass("xpathor-selection");
        });
        $(window).mouseleave(function(event){
            $(event.target).removeClass("xpathor-selection");
        });
        $(window).click(function(event){
            $(event.target).removeClass("xpathor-selection");
            var xpathor = new NewsXpathGenerator();
            if (message.item == "images"){
            	var xpath = xpathor.get_images_xpath(event.target);
            } else {
            	var xpath = xpathor.get_fixed_xpath(event.target);
            }
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

	// TODO add restart callback
	select_content: function(obj, message, callback){
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
            //restart_callback.call(obj, message);
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
        			message.content_paths.push(elem);
        			console.log(message.content_paths.length);
        			$(elem).removeClass("xpathor-selection");
        			$(parent).addClass("xpathor-selection");
        			console.log(parent);
        			var p = $(parent).offset()
            		$(".xpathor-selection-2").css({left: p.left, top: p.top, width: $(parent).width(), height: $(parent).height()});
        			return false;
        		} else if (code == 40){
        			// press down
        			if (message.content_paths.length == 0){
        				return false;
        			}
        			var child = message.content_paths.pop();
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
        			var xpathor = new ReliableXpathGenerator();
                	var xpath = xpathor.get_fixed_xpath(elem);
	                // stop select and switch
	                $(elem).removeClass("xpathor-selection");
            		$(".xpathor-selection-2").css({left: 0, top: 0, width: 0, height: 0});
	                // get to next step
	                var item_name = message.item;
            		var obj = message.obj;
            		message.data[item_name] = xpath;
            		message.content_paths = new Array();
            		callback.call(obj, message);
        			return false;
        		} else if (code == 27){
        			$(window).unbind("keyup");
        			var elem =  $(".xpathor-selection")[0];
	                // stop select and switch
	                $(elem).removeClass("xpathor-selection");
            		$(".xpathor-selection-2").css({left: 0, top: 0, width: 0, height: 0});
        			// press esc, restart select block
        			//restart_callback.call(message.obj, message);
        			return false;
        		}
        		return true;
        	});
            return false;
        });
    },

	// pre process, like run algorithm to get xpath, etc.
	pre_process: function(){
		return;
	},

	fill_template: function(template){
		template.domain = get_top_domain();
		template.pattern = "";
		template.title = XpathEvaluator.fill_xpath(template.title, "text");
		template.source = XpathEvaluator.fill_xpath(template.source, "full_text");
		template.pubDate = XpathEvaluator.fill_xpath(template.pubDate, "full_text");
		template.nextPage = XpathEvaluator.fill_xpath(template.nextPage, "attr", "href");
		template.images = template.images;
		return template;
	},

	// post process data, preview, etc.
	post_process: function(message){
		console.log(message);
		var template = new NewsTemplate(message.data);
		template = this.fill_template(template);
		// log xpath
		console.log("[News] domain: " + template.domain);
		console.log("[News] title xpath: " + template.title);
		console.log("[News] content xpath: " + template.content);
		console.log("[News] source xpath: " + template.source);
		console.log("[News] publish time xpath: " + template.pubDate);
		console.log("[News] next page xpath: " + template.nextPage);
		console.log("[News] images xpath: " + template.images);

		var result = this.extract(template);
		// TODO valid result
		// save temporary templates
		//XpathorStorage.save_temp_template(document.location.host, "news", template);
		TemplateManager.set_news_template([template], true);
		// TODO preview result
		this._preview(result);
		// TODO save extract result
	},

	// extract news detail by given template
	extract: function(template){
		var result = new ExtractResult();
		result.title = XpathEvaluator.evaluate(document, template.title);
		//console.log("[News] get title: " + result.title);
		// extract head images by template
		var head_images = [];
		if (template.images != undefined && template.images != null && template.images.length > 0){
			head_images = XpathEvaluator.evaluate(document, template.images);
			if (typeof(head_images) == "string"){
				head_images = [head_images];
			}
		}
		result.content = XpathEvaluator.evaluate(document, template.content);
		result.content = NewsDetailExtractor.extract_content(result.content, head_images);
		//console.log("[News] get content node: " + result.content);
		result.source = XpathEvaluator.evaluate(document, template.source);
		result.source = NewsDetailExtractor.extract_source(result.source);
		//console.log("[News] get source: " + result.source);
		result.pubDate = XpathEvaluator.evaluate(document, template.pubDate);
		result.pubDate = NewsDetailExtractor.extract_time(result.pubDate);
		//console.log("[News] get publish date: " + result.pubDate);
		result.nextPage = XpathEvaluator.evaluate(document, template.nextPage);
		//console.log("[News] get next page: " + result.nextPage);
		return result;
	},

	_preview_by_templates: function(result){
		if (result[document.location.host].length == 0){
			alert("no template for this site");
			return;
		}
		// TODO use first template for now 
		var template = result[document.location.host][0];
		//console.log("get template: ");
		//console.log(template);
		//console.log(this.extract);
		var result = this.extract(template);
		this._preview(result);
	},

	// preview extracting result
	preview: function(templates){
		// preview result by templates list
		var result = null;
		for (var i=0; i < templates.length; i++){
			try{
				result = this.extract(templates[i]);	
			} catch (err){
				console.log("error extract use template: ");
				console.log(templates[i]);
				continue;
			}
			if (result.valid()){
				console.log("preview result");
				console.log(result);
				this._preview(result);
				break;
			}
		}
	},

	// preview extract result, put result in new div and show if need to.
	_preview: function(result){
		if (this._preview_elem == null && $("#xpathor-preview").length === 0){
			var width = $(window).width();
			var height = $(window).height();
			var left = 0.3 * width / 2;
			$("body").append("<div class='xpathor-preview' id='xpathor-preview'><a class=\"xpathor-boxclose\" id=\"xpathor-boxclose\"></a>" + 
				"<div class='xpathor-preview-news-header'>" + 
				"<div class='xpathor-preview-news-title' id='xpathor-preview-news-title'></div>" + 
				"<div class='xpathor-preview-news-source' id='xpathor-preview-news-source'></div>" + 
				"<div class='xpathor-preview-news-pubdate' id='xpathor-preview-news-pubdate'></div>" + 
				"<div class='xpathor-preview-news-nextpage' id='xpathor-preview-news-nextpage'></div></div><hr />" + 
				"<div class='xpathor-preview-news-content' id='xpathor-preview-news-content'></div></div>");
			this._preview_elem = $("#xpathor-preview");
			this._preview_elem.css("left", left);
			$("#xpathor-preview-news-content").css("max-height", height - 195);
			$("#xpathor-preview-news-content").bind('mousewheel DOMMouseScroll', function(e){
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
		$("#xpathor-preview-news-title", this._preview_elem).html(result.title);
		$("#xpathor-preview-news-source", this._preview_elem).html(result.source);
		$("#xpathor-preview-news-pubdate", this._preview_elem).html(result.pubDate);
		$("#xpathor-preview-news-nextpage", this._preview_elem).html(result.nextPage);
		$("#xpathor-preview-news-content", this._preview_elem).html(result.content);
		setTimeout(function(){$("#xpathor-preview").toggleClass("preview-show")}, 0);
		return;
	},
});


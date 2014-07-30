/*
 * Simple image extractor, extract images from content dom node.
 * Rewrite from python code.
 */
var ImageExtractor = {

	_args: {
		valid_size_threshold: 50,
		valid_ratio_threshold: 5,
		min_width: 50,
		min_height: 50,
	},

	/*
	 * Default handle src function, get image link from src attribute.
	 */
	_handle_src_func: function(node){
		return $(node).attr("src");
	},

	_validate_img_src: function(src){
		return src != null && src != undefined && src.length > 0 && !src.startswith("data:") && !src.startswith("file:");
	},

	_validate_image: function(image, src){
		//console.log("valid image: ");
		//console.log(image);
		var response = {};
		var width = $(image).width();
		var height = $(image).height();
		//console.log("width: " + width + ", height: " + height);
		response.width = width;
		response.height = height;
		if (width == 0 && height == 0){
			response.valid = true;
			//console.log("get image size failed, seem as valid");
			return response;
		} else if (width < this._args.valid_size_threshold || height < this._args.valid_size_threshold){
			response.valid = false;
			//console.log("validate image failed, width or height small");
			return response;
		} else if (width / height > this._args.valid_ratio_threshold){
			response.valid = false;
			//console.log("validate image failed, ration large");
			return response;
		} else {
			response.valid = true;
			return response;
		}
	},

	_score_image: function(image, src, width, height){
		var score = 2;
		if (width < this._args.min_width || height < this._args.min_height){
			score -= 100;
		} else if (width > this._args.min_width && height > this._args.min_height){
			score += 10;
		}
		// TODO need copy more logic from python code
		return score;
	},

	/*
	 * main API of ImageExtractor.
	 */
	extract_images: function(node){
		//console.log("extract images from ");
		//console.log(node);
		var pictures = [];
		if (node == null || node == undefined){
			return pictures;
		}
		//var imgs = XpathEvaluator.evaluate(node, ".//img");
		var imgs = $(node).xpath(".//img").toArray();
		if (imgs == null || imgs == undefined || imgs.length == 0){
			return pictures;
		}
		//console.log("got images ");
		//console.log(imgs);
		var result, score, image;
		for (var i=0; i < imgs.length; i++){
			var src = this._handle_src_func(imgs[i]);
			if (this._validate_img_src(src)){
				// valid image src
				result = this._validate_image(imgs[i], src);
				if (!result.valid){
					continue;
				}
				score = this._score_image(imgs[i], src, result.width, result.height);
				image = {
					url: src,
					id: Math.uuid(),
					score: score,
					width: result.width,
					height: result.height,
					node: imgs[i],
				};
				pictures.push(image);
			}
		}
		// TODO sort by score
		return pictures;
	}
};


/*
 * NewsProcessor, to process news extracting.
 */

var NewsProcessor = Processor.extend({

	name: "news",

	_tip_elem: null,
	_preview_elem: null,

	_top_domains: ["com", "edu", "gov", "int", "mil", "net", "org", "biz", "info", "pro", "name", "museum", "coop", "aero", "idv", "xxx"],

	// arguments when extract text content from dom node, copy from python source
	_args: {
		unlikelyRe: /page|seo_text|multicntwrap|title|imageCaption|editorialItem|pageHeader|articleHead|nor_warning|photo-warp|bucket|subscribe|date|time|stories|filedby|mod|contributors|byline|filed-under|social-bar |aboutbox|rightcol|copyright|hide|pr_box|pr_text|share|bookmark|adwrapper|ad_wrapper|combx|cmnt|comment|disqus |foot|header|menu|meta|nav|rss|shoutbox|sidebar|sponsor|relate|newsInfo|crumb|foot|byline|tagline|articleInfo/i,
		unlikelyTextRe: /\u672c\u6587\u6765\u6e90|\u5206\u4eab|\u7ea0\u9519|\u7f16\u8f91|\u66f4\u591a|\u67e5\u770b|\u70b9\u51fb|\u76f8\u5173|\u94fe\u63a5|\u8BC4\u8BBA|relate|loading|newest|share|tagline|click here|comment|sponsor|copyright|gallery|learn more/i,
		paragraphTags: ["P", "BR", "DIV", "H1", "H2", "H3", "H4", "H5", "H6", "LI"],
		strongTags: ["STRONG", "B"],
		noTextTags: ["SCRIPT", "NOSCRIPT", "STYLE", "IFRAME"],
		chineseRe: /[\u4e00-\u9fa5]+/i,
		imageRe: /(dolphinimagestart--([0-9a-fA-F]{8})-([0-9a-fA-F]{4})-([0-9a-fA-F]{4})-([0-9a-fA-F]{4})-([0-9a-fA-F]{12})--dolphinimageend)/i,
		oriTitleRe: /\u539f\u6807\u9898(:|\uff1a)/i,
		urlRe: /(http:\/\/|https:\/\/){0,1}[A-Za-z0-9][A-Za-z0-9\-\.]+[A-Za-z0-9]\.[A-Za-z]{2,}[\43-\176]*/i,
		unlikelyKeywordRe: /\s*(\uff08|\u3010|\(|\[)\s*(\u5b98\u65b9)?\u5fae\u535a\s*(\u6570\u636e|\u535a\u5ba2)*\s*(\uff09|\u3011|\)|\])\s*/i,
		paragraphRe: /[\n\r]{3,}/i,
	},

	// regex to extract source
	// TODO copy from python code, just contains chinese, so maybe need to improve
	_source_re: /.*(?:\u7a3f\u6e90|\u6765\u6E90\u4E8E\uFF1A|\u6765\u81ea\uFF1A|\u6765\u81ea|\u6765\u6E90|\u6765\u6E90\uFF1A|\u51fa\u5904\uFF1A|\u6765\u6e90\u4e8e)[\s\xa0]*(?:\:|\uff1a|\/)?(?:\s\xa0)*(.*?)[\u8D5E\u3010\u3000 -_\|\s\xa0].*/i,

	_img_placeholder_re: /(\(dolphinimagestart\-\-.*?\-\-dolphinimageend\))/gi,
	_img_placeholder_re_no_match: /\(dolphinimagestart\-\-.*?\-\-dolphinimageend\)/gi,

	// time regex, copy from python source
	_time_res: {
		all: [
			// with all fields
			/(\d+)\/(\d+)\/(\d+) (\d+)\:(\d+)\:(\d+)/i,
			/(\d+)\-(\d+)\-(\d+) (\d+)\:(\d+)\:(\d+)/i,
			/(\d+)\u5e74(\d+)\u6708(\d+) (\d+)\:(\d+)\:(\d+)/i,
		],
		no_second: [
			// no seconds
			/(\d+)\-(\d+)\-(\d+)[ \xa0]*(\d+):(\d+)/i, 
			/(\d+)\-(\d+)\-(\d+)T(\d+):(\d+)/i, 
			/(\d+)\-(\d+)\-(\d+),(?: )*(\d+):(\d+)/i, 
			/(\d+)\.(\d+)\.(\d+) (\d+):(\d+)/i, 
			/(\d+)\u5e74(\d+)\u6708(\d+)\u65e5[ \xa0]*(\d+):(\d+)/i, 
		],
		no_year_second: [
			// no year, no second
			/(\d+)\u6708(\d+)\u65e5[ \xa0]*(\d+)\:(\d+)/i
		],
		no_time: [
			// no time, just date
			/(\d+)\u5e74(\d+)\u6708(\d+)\u65e5/i,
			/(\d+)\-(\d+)\-(\d+)/i,
		],
	},

	_step_map: {
		start: "title",
		title: "content",
		content: "source",
		source: "publish_time",
		publish_time: "next_page",
	},

	_tip_map: {
		title: "Title",
		content: "Content",
		source: "Source",
		publish_time: "Publish Time",
		next_page: "Next Page",
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
		} else if (item == "next_page"){
			this.stop_select();
			this.hide_tip();
			this.post_process(message);
		} else {
			console.log("[News] unknow item: " + item);
			return;
		}
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
        			var xpathor = new XpathGenerator();
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

	get_top_domain: function(){
		var url = window.location.href;
		var domain = url.split("://")[1].split("/")[0];
		var domain_frags = domain.split(".");
		var top_domain = domain;
		while (domain_frags.length >= 2){
			if (domain_frags.length == 2 && this._top_domains.indexOf(domain_frags[0]) != -1){
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
	},

	fill_template: function(template){
		template.domain = this.get_top_domain();
		template.pattern = "";
		template.title = XpathEvaluator.fill_xpath(template.title, "text");
		template.source = XpathEvaluator.fill_xpath(template.source, "full_text");
		template.pubDate = XpathEvaluator.fill_xpath(template.pubDate, "full_text");
		template.nextPage = XpathEvaluator.fill_xpath(template.nextPage, "attr", "href");
		return template;
	},

	// post process data, preview, etc.
	post_process: function(message){
		var template = new NewsTemplate(message.data);
		template = this.fill_template(template);
		// log xpath
		console.log("[News] title xpath: " + template.title);
		console.log("[News] content xpath: " + template.content);
		console.log("[News] source xpath: " + template.source);
		console.log("[News] publish time xpath: " + template.pubDate);
		console.log("[News] next page xpath: " + template.nextPage);

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
		result.content = XpathEvaluator.evaluate(document, template.content);
		result.content = this._extract_content(result.content);
		//console.log("[News] get content node: " + result.content);
		result.source = XpathEvaluator.evaluate(document, template.source);
		result.source = this._extract_source(result.source);
		//console.log("[News] get source: " + result.source);
		result.pubDate = XpathEvaluator.evaluate(document, template.pubDate);
		result.pubDate = this._extract_time(result.pubDate);
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

	_get_link_density: function(elem){
		var text = elem.text().trim();	
		// sub image text
		text = text.replace(this._args.imageRe, "");
		if (text == null || text.length == 0){
			return 0.0;
		}
		var links = elem.xpath("a");
		if (links.length == 0){
			return 0.0;
		}
		var link_text = "";
		for (var i=0; i < links.length; i++){
			link_text += links[i].text.trim().replace(this._args.imageRe, "");
		}
		return link_text.length / text.length;
	},

	// remove unlikely elements from content node, rewrite from python source
	_remove_unlikely_elem: function(elements){
		var unlikely_elems = new Array();
		elements.reverse();
		var elem, link_density, text, lis, ps, imgs, path, match;
		for (var i=0; i < elements.length; i++){
			elem = $(elements[i]);
			if (elem.css("display") == "none"){
				//console.log("[ContentExtractor] remove hidden: ");
				//console.log(elements[i]);
				unlikely_elems.push(elements[i]);
				continue;
			}
			link_density = this._get_link_density(elem);
			text = elem.text().trim();
			lis = elem.xpath("li").length;
			ps = elem.xpath("p").length;
			imgs = elem.xpath("img").length + text.split("dolphinimagestart").length - 1;
			path = elem.attr("class") + " " + elem.attr("id");

			match = this._args.unlikelyRe.exec(path);
			if (match != null){
				//console.log("[ContentExtractor] remove because match unlikely regex: ");
				//console.log(elements[i]);
				unlikely_elems.push(elements[i]);
				continue;
			} else if (link_density > 0.2 && text.length < 30 && this._args.unlikelyTextRe.exec(text) != null){
				//console.log("[ContentExtractor] remove because have links and sensitive words: ");
				//console.log(elements[i]);
				unlikely_elems.push(elements[i]);
				continue;
			} else if (link_density > 0.4 && imgs == 0 && text.length > 30){
				//console.log("[ContentExtractor] remove because link density high and no image and long text: link density: " + link_density);
				//console.log(elements[i]);
				unlikely_elems.push(elements[i]);
				continue;
			} else if (lis > ps){
				var links = elem.xpath("a");
				if (links.length >= lis){
					//console.log("[ContentExtractor] remove because more lis and links than ps: ");
					//console.log(elements[i]);
					unlikely_elems.push(elements[i]);
					continue;
				}
			}
		}
		// realy remove
		for (var i=0; i < unlikely_elems.length; i++){
			$(elements[i]).remove();
		}
	},

	_clean_text: function(text, tag, prev_tag){
		text = text.replace(/([^ ]+)[\n\r]+([^ ]+)/i, "$1 $2");	
		text = text.replace(/([\n\r]+)/i, "", text);
		if (prev_tag == undefined || prev_tag == null || this._args.strongTags.indexOf(prev_tag) == -1){
			text = text.trim();
		}
		if (this._args.strongTags.indexOf(tag) != -1 && text.length > 0){
			text = "<b>" + text + "</b>";
		}
		return text;
	},

	// get text 
	_get_text: function(node){
		var all_text = "";
		var raw_node = node.get(0);
		// if node is attribute or not text and html element
		if (raw_node.nodeType == 2 || raw_node.nodeType > 3){
			return all_text;
		}
		var tag = raw_node.tagName;
		// skip over title
		if (tag == "H1"){
			//console.log("[ContentExtractor] got h1 title, remove it.");
			//console.log(node);
			return all_text;
		}
		if (this._args.noTextTags.indexOf(tag) != -1){
			console.log("[ContentExtractor] got no text tags: ");
			console.log(node);
			return all_text;
		}
		var paragraph = this._args.paragraphTags.indexOf(tag) != -1;
		var text = node.justtext().trim();
		var length = text.length;
		if (length > 0){
			var domtext = this._clean_text(text, tag);
			all_text += domtext;
		}
		var children = node.children();
		var subtext;
		for (var i=0; i < children.length; i++){
			if (children[i].nodeType == 3){
				continue;
			}
			subtext = this._get_text($(children[i]));
			if (subtext.length > 0){
				all_text += subtext;
			}
		}
		if (paragraph){
			if (tag == "BR"){
				all_text = "\n" + all_text;
			} else {
				all_text = "\n" + all_text;
				all_text += "\n";
			}
		}
		// get tail text
		var tail = node.tail().trim();
		if (tail.length > 0){
			all_text += this._clean_text(tail, "#TEXT", tag);
		}
		return all_text;
	},

	_remove_whitespace: function(content){
		content = content.replace(/[ \t]+/i, " ");
		content = content.replace(/([ ]+[\n\r]+)/i, "\n");
		content = content.replace(/[\r\n]+/i, "\n");
		return content;
	},

	_append_newline: function(content){
		return content.replace(/([^\n])\n([^\n])/i, "$1\n\n$2");
	},

	// get text content of node
	_get_content: function(node){
		var content = this._get_text(node);
		content = this._remove_whitespace(content);
		content = this._append_newline(content);
		return content.trim();
	},

	_remove_unlikely_paragraph: function(content_list, min_length){
		var rmv_list = [];
		var dup_paras = {};
		var real_paras = [];
		for (var j=0; j < content_list.length; j++){
			if (content_list[j].trim().length > 0){
				real_paras.push(content_list[i]);
			}
		}
		var real_len = real_paras.length;

		var para_map = {};

		var i = 0;
		for (var j=0; j < content_list.length; j++){
			var paragraph = content_list[j];
			if (paragraph.trim().length <= 0){
				continue;
			}
			var para = paragraph.replace(this._args.imageRe, "");
			var hash = MD5(para);
			if (hash in para_map){
				console.log("[ContentExtractor] remove duplicated paragraph: " + para);
				dup_paras[paragraph] = false;
				i += 1;
				continue;
			}
			if (i < 3 || i > real_len - 4){
				// remove unlikely text at start or end of content
				if (this._args.unlikelyTextRe.exec(para) != null && para.length < 50){
					console.log("[ContentExtractor] remove unlikely text at start or end of content: %s" + para);
					rmv_list.push(paragraph);
					i += 1;
					continue;
				}
				// remove original title line
				if (this._args.oriTitleRe.exec(para) != null){
					//console.log("[ContentExtractor] remove original title: " + para);
					rmv_list.push(paragraph);
					i += 1;
					continue;
				}
				// remove if too short and contains urls, may be share or something else.
				if (this._args.urlRe.exec(para) != null){
					var pa = para.replace(this._args.urlRe, "");
					if (pa.trim().length < min_length){
						//console.log("[ContentExtractort] remove short paragragh which contains url: " + para);
						rmv_list.push(paragraph);
						i += 1;
						continue;
					}
				}
				// TODO remove if too short and match extra para func, here not implementation decause
				// default all not extra paragraph
			}
			if (i == real_len - 1){
				if (para.endswith(":") || para.endswith("\uff1a")){
					//console.log("[ContentExtractort] remove last paragraph end with a colon: " + para);
					rmv_list.push(paragraph);
					i += 1;
					continue;
				}
			}
			para_map[hash] = true;
			i += 1;
		}
		var new_content_list = [];
		for (var j=0; j < content_list.length; j++){
			if (!(content_list[j] in rmv_list)){
				new_content_list.push(content_list[j]);
			}
		}
		content_list = new_content_list;
		var content_list_2 = [];
		for (var j=0; j < content_list.length; j++){
			var para = content_list[j];
			if (para.trim().length <= 0){
				continue;
			}
			if (!(para in dup_paras) || !dup_paras[para]){
				content_list_2.push(para);
				dup_paras[para] = true;
			}
		}
		return content_list_2;
	},

	_remove_unlikely_keyword: function(content){
		return content.replace(this._args.unlikelyKeywordRe, "");
	},

	_wrap_paragraph: function(paragraph){
		var paras = paragraph.split(this._img_placeholder_re_no_match);
		var matches = [], found;
		var reg = this._img_placeholder_re;
		while (found = reg.exec(paragraph)){
			matches.push(found[0]);
			//console.log("got image: " + found[0]);
			reg.lastIndex = found.index + 1;
		}
		var new_para = "";
		for (var i=0; i < paras.length; i++){
			//console.log("process paragraph: " + paras[i]);
			if (paras[i].length > 0){
				new_para += "<p>" + paras[i] + "</p>";
			}
			if (i < matches.length){
				new_para += matches[i];
			}
		}
		return new_para;
	},

	// wrap content with html tags
	_wrap_content: function(content){
		// temporary, just wrap paragraphs with p
		var paragraphs = content.split("\n\n");
		var new_paragraphs = [];
		for (var i=0; i < paragraphs.length; i++){
			new_paragraphs.push(this._wrap_paragraph(paragraphs[i]));
		}
		return new_paragraphs.join("");
	},

	_replace_images: function(content, pictures){
		for (var i=0; i < pictures.length; i++){
			content = content.replace("(dolphinimagestart--" + pictures[i].id + "--dolphinimageend)", 
				"<div><img style='margin: 0 auto; display: block' src='" + pictures[i].url + "'></img></div>");
		}
		return content;
	},

	// extract content from dom node, rewrite from python source
	_extract_content: function(node){
		var clone = $(node).clone();
		// extract images from content node
		var pictures = ImageExtractor.extract_images(clone);
		//console.log("got " + pictures.length + " images from content node");
		for (var i=0; i < pictures.length; i++){
			$(pictures[i].node).replaceWith("(dolphinimagestart--" + pictures[i].id + "--dolphinimageend)");
		}
		//console.log(clone.html());

		var tags = ["p", "div", "span", "ul", "table", "select"];
		var elements = $(clone).xpath(".//p | .//div | .//span | .//ul | .//table | .//select").toArray();
		this._remove_unlikely_elem(elements);
		var content = this._get_content(clone);
		//console.log(content);
		var chinese = this._args.chineseRe.exec(content) != null;
		var min_length = chinese ? 40 : 20;
		var content_list = this._remove_unlikely_paragraph(content.split("\n"), min_length);
		content = content_list.join("\n\n");
		//console.log(content);
		// remove unlikely keyword
		content = this._remove_unlikely_keyword(content);
		//console.log(content);
		// remove extra paragraph
		content = content.replace(this._args.paragraphRe, "\n\n");
		//console.log(content);
		// wrap content with html tags
		content = this._wrap_content(content);
		// replace images in content
		content = this._replace_images(content, pictures);
		//console.log(content);
		return content;
	},

	// extract source text
	_extract_source: function(text){
		// copy from python source: extractor/extractor.py/_clean_source
		if (text == null || text == undefined){
			return null;
		}
		text = text.replace(/[\n\r\t]/gi, "");
		text = text.replace(/( ){2,}/gi, "");
		text += " ";
		var match = this._source_re.exec(text);
		if (match == null){
			return null;
		} else {
			return match[1];
		}
	},

	// extract time from text
	_extract_time: function(text){
		var res = this._time_res.all;
		var match;
		for (var i=0; i < res.length; i++){
			match = res[i].exec(text);
			if (match != null){
				return new Date(match[1], match[2] - 1, match[3], match[4], match[5], match[6] * 1000);
			}
		}
		res = this._time_res.no_second;
		for (var i=0; i < res.length; i++){
			match = res[i].exec(text);
			if (match != null){
				return new Date(match[1], match[2] - 1, match[3], match[4], match[5], 0);
			}
		}
		res = this._time_res.no_year_second;
		for (var i=0; i < res.length; i++){
			match = res[i].exec(text);
			if (match != null){
				var now = new Date();
				return new Date(now.getFullYear(), match[1] - 1, match[2], match[3], match[4], 0);
			}
		}
		res = this._time_res.no_time;
		for (var i=0; i < res.length; i++){
			match = res[i].exec(text);
			if (match != null){
				var now = new Date();
				return new Date(match[1], match[2] - 1, match[3], now.getHours(), now.getMinutes(), 0);
			}
		}
		var now = new Date();
		return now;
	},
});


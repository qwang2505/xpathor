/*
 * NewsProcessor, to process news extracting.
 */

var NewsProcessor = Processor.extend({

	name: "news",

	_tip_elem: null,

	// arguments when extract text content from dom node, copy from python source
	_args: {
		unlikelyRe: /page|seo_text|multicntwrap|title|imageCaption|editorialItem|pageHeader|articleHead|nor_warning|photo-warp|bucket|subscribe|date|time|stories|filedby|mod|contributors|byline|filed-under|social-bar |aboutbox|rightcol|copyright|hide|pr_box|pr_text|share|bookmark|adwrapper|ad_wrapper|combx|cmnt|comment|disqus |foot|header|menu|meta|nav|rss|shoutbox|sidebar|sponsor|relate|newsInfo|crumb|foot|byline|tagline|articleInfo/i,
		unlikelyTextRe: /\u672c\u6587\u6765\u6e90|\u5206\u4eab|\u7ea0\u9519|\u7f16\u8f91|\u66f4\u591a|\u67e5\u770b|\u70b9\u51fb|\u76f8\u5173|\u94fe\u63a5|\u8BC4\u8BBA|relate|loading|newest|share|tagline|click here|comment|sponsor|copyright|gallery|learn more/i,
	},

	// regex to extract source
	// TODO copy from python code, just contains chinese, so maybe need to improve
	_source_re: /.*(?:\u7a3f\u6e90|\u6765\u6E90\u4E8E\uFF1A|\u6765\u81ea\uFF1A|\u6765\u81ea|\u6765\u6E90|\u6765\u6E90\uFF1A|\u51fa\u5904\uFF1A|\u6765\u6e90\u4e8e)[\s\xa0]*(?:\:|\uff1a|\/)?(?:\s\xa0)*(.*?)[\u8D5E\u3010\u3000 -_\|\s\xa0].*/i,

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

	// pre process, like run algorithm to get xpath, etc.
	pre_process: function(){
		return;
	},

	// post process data, preview, etc.
	post_process: function(message){
		// log xpath
		console.log("[News] title xpath: " + message.data.title);
		console.log("[News] content xpath: " + message.data.content);
		console.log("[News] source xpath: " + message.data.source);
		console.log("[News] publish time xpath: " + message.data.publish_time);
		console.log("[News] next page xpath: " + message.data.next_page);
		var template = new NewsTemplate(message.data);
		var result = this.extract(template);
	},

	// extract news detail by given template
	extract: function(template){
		var result = new ExtractResult();
		result.title = XpathEvaluator.evaluate(document, XpathEvaluator.fill_xpath(template.title, "text"));
		console.log("[News] get title: " + result.title);
		result.content = XpathEvaluator.evaluate(document, template.content);
		result.content = this._extract_content(result.content);
		console.log("[News] get content node: " + result.content);
		result.source = XpathEvaluator.evaluate(document, XpathEvaluator.fill_xpath(template.source, "full_text"));
		result.source = this._extract_source(result.source);
		console.log("[News] get source: " + result.source);
		result.pubDate = XpathEvaluator.evaluate(document, XpathEvaluator.fill_xpath(template.pubDate, "full_text"));
		result.pubDate = this._extract_time(result.pubDate);
		console.log("[News] get publish date: " + result.pubDate);
		result.nextPage = XpathEvaluator.evaluate(document, XpathEvaluator.fill_xpath(template.nextPage, "full_text"));
		console.log("[News] get next page: " + result.nextPage);
	},

	_get_link_density: function(elem){
		var text = elem.text().trim();	
		if (text == null || text.length == 0){
			return 0.0;
		}
		var links = elem.xpath("a");
		if (links.length == 0){
			return 0.0;
		}
		var link_text = "";
		for (var i=0; i < links.length; i++){
			link_text += links[i].text().trim();
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
				console.log("[ContentExtractor] remove hidden: ");
				console.log(elements[i]);
				unlikely_elems.push(elements[i]);
				continue;
			}
			link_density = this._get_link_density(elem);
			text = elem.text().trim();
			lis = elem.xpath("li").length;
			ps = elem.xpath("p").length;
			imgs = elem.xpath("img").length;
			path = elem.attr("class") + " " + elem.attr("id");

			match = this._args.unlikelyRe.exec(path);
			if (match != null){
				console.log("[ContentExtractor] remove because match unlikely regex: ");
				console.log(elements[i]);
				unlikely_elems.push(elements[i]);
				continue;
			} else if (link_density > 0.2 && text.length < 30 && this._args.unlikelyTextRe.exec(text) != null){
				console.log("[ContentExtractor] remove because have links and sensitive words: ");
				console.log(elements[i]);
				unlikely_elems.push(elements[i]);
				continue;
			} else if (link_density > 0.4 && imgs == 0 && text.length > 30){
				console.log("[ContentExtractor] remove because link density high and no image and long text: ");
				console.log(elements[i]);
				unlikely_elems.push(elements[i]);
				continue;
			} else if (lis > ps){
				var links = elem.xpath("a");
				if (links.length >= lis){
					console.log("[ContentExtractor] remove because more lis and links than ps: ");
					console.log(elements[i]);
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

	// extract content from dom node, rewrite from python source
	_extract_content: function(node){
		var clone = $(node).clone();
		var tags = ["p", "div", "span", "ul", "table", "select"];
		var elements = $(clone).xpath(".//p | .//div | .//span | .//ul | .//table | .//select").toArray();
		this._remove_unlikely_elem(elements);
		return node;
	},

	// extract source text
	_extract_source: function(text){
		// copy from python source: extractor/extractor.py/_clean_source
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


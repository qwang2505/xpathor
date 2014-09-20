/*
 * News detail information extractor.
 */
var NewsDetailExtractor = {

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
	// ?: inside () means do not catch the match
	_source_re: /.*(?:\u7a3f\u6e90|\u6765\u6E90\u4E8E\uFF1A|\u6765\u81ea\uFF1A|\u6765\u81ea|\u6765\u6E90|\u6765\u6E90\uFF1A|\u51fa\u5904\uFF1A|\u6765\u6e90\u4e8e)[\u21B5\s\xa0]*(?:\:|\uff1a|\/)?[\u21B5\s\xa0]*(.*?)[\u21B5\u8D5E\u3010\u3000 -_\|\s\xa0\n\r\t].*/i,

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
				console.log("[ContentExtractor] remove hidden: ");
				console.log(elements[i]);
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
				console.log("[ContentExtractor] remove because link density high and no image and long text: link density: " + link_density);
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

	_clean_text: function(text, tag, prev_tag){
		text = text.replace(/([^ ]+)[\n\r]+([^ ]+)/i, "$1 $2");	
		text = text.replace(/([\n\r]+)/i, "", text);
		//if (prev_tag == undefined || prev_tag == null || this._args.strongTags.indexOf(prev_tag) == -1){
		//	text = text.trim();
		//}
		if (this._args.strongTags.indexOf(tag) != -1 && text.length > 0){
			text = "<b>" + text + "</b>";
		}
		return text;
	},

	// get text 
	_get_text: function(node){
		var all_text = "";
		var raw_node = node.get(0);
		//console.log(raw_node);
		//console.log(node.text());
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
			console.log(raw_node);
			return all_text;
		}
		var paragraph = this._args.paragraphTags.indexOf(tag) != -1;
		var text = node.justtext().trim();
		//console.log(raw_node);
		//console.log("get only text: " + text);
		var length = text.length;
		if (length > 0){
			var domtext = this._clean_text(text, tag);
			//console.log("Got dom text: " + domtext);
			//console.log(raw_node);
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
		//console.log(content);
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
	extract_content: function(node, head_images){
		var clone = $(node).clone();
		// extract images from content node
		var pictures = ImageExtractor.extract_images(clone);
		console.log("got " + pictures.length + " images from content node");
		for (var i=0; i < pictures.length; i++){
			$(pictures[i].node).replaceWith("(dolphinimagestart--" + pictures[i].id + "--dolphinimageend)");
		}
		//console.log(clone.html());

		var tags = ["p", "div", "span", "ul", "table", "select"];
		var elements = $(clone).xpath(".//p | .//div | .//span | .//ul | .//table | .//select").toArray();
		this._remove_unlikely_elem(elements);
		//console.log(clone.html());
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
		// insert head images
		if (head_images != undefined && head_images != null && head_images.length > 0){
			for (var i=0; i < head_images.length; i++){
				content = "<div><img style='margin: 0 auto; display: block' src='" + head_images[i] + "'></img></div>" + content;
			}
		}
		return content;
	},

	// extract source text
	extract_source: function(text){
		// copy from python source: extractor/extractor.py/_clean_source
		if (text == null || text == undefined){
			return "";
		}
		text = text.replace(/[\n\r\t]{2,}/gi, "\n");
		text = text.replace(/( ){2,}/gi, " ");
		text += " ";
		var match = this._source_re.exec(text);
		console.log(match);
		if (match == null){
			return null;
		} else {
			return match[1];
		}
	},

	// extract time from text
	extract_time: function(text){
		if (text == null || text == undefined){
			var now = new Date();
			return now;
		}
		var res = this._time_res.all;
		var match;
		for (var i=0; i < res.length; i++){
			match = res[i].exec(text);
			if (match != null){
				console.log("match all");
				console.log(match);
				return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]), parseInt(match[4]), 
					parseInt(match[5]), parseInt(match[6]));
			}
		}
		res = this._time_res.no_second;
		for (var i=0; i < res.length; i++){
			match = res[i].exec(text);
			if (match != null){
				return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]), parseInt(match[4]), 
					parseInt(match[5]), 0);
			}
		}
		res = this._time_res.no_year_second;
		for (var i=0; i < res.length; i++){
			match = res[i].exec(text);
			if (match != null){
				var now = new Date();
				return new Date(now.getFullYear(), parseInt(match[1]) - 1, parseInt(match[2]), parseInt(match[3]), 
					parseInt(match[4]), 0);
			}
		}
		res = this._time_res.no_time;
		for (var i=0; i < res.length; i++){
			match = res[i].exec(text);
			if (match != null){
				var now = new Date();
				return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]), now.getHours(), now.getMinutes(), 0);
			}
		}
		console.log("[NewsDetailExtractor] can not get time from: " + text);
		var now = new Date();
		return now;
	},
};
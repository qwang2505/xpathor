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
					console.log("image not valid: " + src);
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
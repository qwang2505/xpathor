/*
 * Extractor to extract news from html
 */
var Extractor = {
	/*
	 * Extract news detail information. If template provided, extract by template(xpath). If
	 * template not provided, extract by algorithm(readability), and get template from result.
	 */
	extract: function(template){
		return null;
	},
	
	/*
	 * Extract news detail information by template.
	 */
	_extract_by_template: function(template){
		var result = new ExtractResult();
		return result;
	},
	
	/*
	 * Extract news detail information by algorithm.
	 */
	_extract_by_algo: function(){
		var result = new ExtractResult();
		return result;
	},
	
	/*
	 * Generate template by extract result.
	 */
	_generate_template: function(result){
		var template = new NewsTemplate();
		return template;
	},
};
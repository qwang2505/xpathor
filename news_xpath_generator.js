/*
 * Xpath generator for news.
 */
var NewsXpathGenerator = ReliableXpathGenerator.extend({
	
	get_images_xpath: function(element){
		var xpath = this.get_fixed_xpath(element);
		if (xpath.length > 0){
			return xpath + "/@src";
		}
		return "";
	},
});
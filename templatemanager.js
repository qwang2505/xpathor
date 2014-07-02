var TemplateManager = {

	value: null,
	template: null,

	// save portal template
	save_portal_template: function(template, callback){
		var obj = {};
		obj[window.location.href] = {
			type: "portal",
			blocks: template,
		};
		console.log(obj);
		chrome.storage.local.set(obj, callback);
		this.unsave = true;
	},
	// update portal template
	update_portal_template: function(update_map){
		// update template by block id, here need to handle situation
	},
	// get portal template
	get_portal_template: function(callback, obj){
		chrome.storage.local.get(window.location.href, function(result){
			callback.call(obj, result);
		});
	},

	set_portal_template: function(template, loaded){
		// TODO validate portal template, if id not exists, generate one
	},
};
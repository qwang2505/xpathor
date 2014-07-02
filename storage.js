/*
 * Object to save and get templates and other information from local storage.
 * Save templates in two array for each type:
 * 1. Official templates, which have been applied in extracting, may be load from server or
 *	generage locally and uploaded. key format: news_templates, roll_templates, etc.
 *  templates in this array will not be removed, always same as server. (maybe just one locale?)
 * 2. Temporary templates, generated locally, and not uploaded yet. Save to local storage
 * 	for later usage, like preview, etc. When upload temporary templates to server, will remove
 *	from temporary storage and save into official templates storage. Size is limited in this
 * 	queue, if lager than threshold, will remove old templates. key format: temp_news_templates, etc.
 */
var XpathorStorage = {

	version: 1,

	unsave: true,

	_default_callback: function(result){
		console.log("get result: ");
		console.log(result);
	},

	_load: function(data_key, key, callback, obj){
		callback = callback == undefined ? this._default_callback: callback;
		obj = obj == undefined ? this : obj;
		chrome.storage.local.get(data_key, function(result){
			var templates = result[data_key];
			if (templates == null || templates === undefined){
				result[key] = [];
				console.log("no templates found in load, start callback");
				callback(result);
				return;
			}
			console.log(result[data_key]);
			var exist_templates = [];
			for (var i=0; i < templates.length; i++){
				if (templates[i].key == key){
					exist_templates.push(templates[i]);	
				}
			}
			result[key] = exist_templates;
			console.log("start callback in load");
			// call on obj
			callback.call(obj, result);
		});
	},

	_save: function(data_key, value){
		callback = this._default_callback;
		chrome.storage.local.get(data_key, function(result){
			var templates = result[data_key];
			if (templates == null || templates == undefined){
				templates = new Array();
			}
			templates.push(value);
			if (value.temp && templates.length > 10){
				templates.shift();
			}
			var obj = {};
			obj[data_key] = templates;
			chrome.storage.local.set(obj, callback);
		});
	},

	_remove: function(key, callback){
		callback = callback == undefined ? this._default_callback: callback;
	},

	_clear: function(callback){
		callback = callback == undefined ? this._default_callback: callback;
	},

	_get_temp_template_key: function(type){
		return "temp_" + type + "_templates";
	},

	_get_template_key: function(type){
		return type + "_templates";
	},

	save_temp_template: function(key, type, template){
		var data_key = this._get_temp_template_key(type);
		template.key = key;
		template.temp = true;
		// get template count of specific type, if lager than threshold, remove old one
		this._save(data_key, template);
	},

	load_temp_template: function(key, type, callback, obj){
		data_key = this._get_temp_template_key(type);
		this._load(data_key, key, callback, obj);
	},

	save_template: function(key, type, template){
		var data_key = this._get_template_key(type);
		template.key = key;
		// get template count of specific type, if lager than threshold, remove old one
		this._save(data_key, template);
	},

	load_template: function(key, type, callback){
		data_key = this._get_template_key(type);
		tihs._load(data_key, key, callback);
	},


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
};
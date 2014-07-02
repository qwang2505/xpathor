var TemplateManager = {

	template: null,
	changed: false,

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

	_validate_block_id: function(blocks, auto_generate_id){
		// validate block, if some block has no id, if should auto generate id, 
		// do not return invalid status, but auto generate id for block. else
		// return invalid status.
		for (var i=0; i < blocks.length; i++){
			if (blocks[i].id == null || blocks[i].id == undefined){
				// has no id
				if (auto_generate_id){
					blocks[i].id = this._generate_block_id(blocks);
				} else {
					return false;
				}
			}
		}
		return true;
	},

	set_template: function(template, loaded){
		// validate portal template, if id not exists, generate one
		this.template = template;
		if (template.type == "portal" && !this._validate_block_id(template.blocks, !loaded)){
			alert("loaded template invalid, some block has no id");
			return;
		}
	},
	delete_block: function(block_id){
		for (var i=0; i < this.template.blocks.length; i++){
			if (this.template.blocks[i].id == block_id){
				console.log("remove block " + block_id);
				this.template.blocks.splice(i, 1);
				this.changed = true;
				break;
			}
		}
	},
	edit_block: function(block_id, update_map){

	},
	add_block: function(new_block){

	},
	get_block: function(block_id){
		for (var i=0; i < this.template.blocks.length; i++){
			if (this.template.blocks[i].id == block_id){
				return this.template.blocks[i];
			}
		}
	},
};
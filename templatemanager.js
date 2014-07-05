var TemplateManager = {

	template: null,
	type: null,
	changed: false,


	_generate_block_id: function(){
		var sample = null, max_index = 0;
		for (var i=0; i < this.template.blocks.length; i++){
			if (this.template.blocks[i].id != null && this.template.blocks[i].id != undefined){
				sample = this.template.blocks[i].id;
				var index = parseInt(this.template.blocks[i].id.split("B")[1]);
				if (index > max_index){
					max_index = index;
				}
			}
		}
		if (sample == null){
			sample = "";
		} else {
			sample = sample.split("B")[0];
		}
		max_index += 1;
		return sample + "B" + max_index;
	},
	_validate_block_id: function(auto_generate_id){
		// validate block, if some block has no id, if should auto generate id, 
		// do not return invalid status, but auto generate id for block. else
		// return invalid status.
		for (var i=0; i < this.template.blocks.length; i++){
			if (this.template.blocks[i].id == null || this.template.blocks[i].id == undefined){
				// has no id
				if (auto_generate_id){
					this.template.blocks[i].id = this._generate_block_id();
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
		this.type = "portal";
		// if loaded template has no id, generate one used in xpathor, and delete id
		// while updating.
		if (template.type == "portal" && !this._validate_block_id(true)){
			alert("loaded template invalid, some block has no id");
			return;
		}
	},
	set_news_template: function(templates, is_new){
		this.template = templates;
		this.type = "news";
		if (is_new){
			this.changed = true;
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
		for (var i=0; i < this.template.blocks.length; i++){
			if (this.template.blocks[i].id == block_id){
				this.template.blocks[i].category = update_map.category;
				this.template.blocks[i].headline_status = update_map.headline_status;
				this.template.blocks[i].status = update_map.status;
				this.template.blocks[i].headline = update_map.headline;
				this.template.blocks[i].news = update_map.news;
				this.changed = true;
				break;
			}
		}
	},
	add_blocks: function(blocks){
		if (blocks.length == 0){
			return;
		}
		if (this.template == null){
			this.template = {
				type: "portal",
				link: window.location.href,
				new: true,
				blocks: [],
			};
		}
		for (var i=0; i < blocks.length; i++){
			this.template.blocks.push(blocks[i]);
		}
		this._validate_block_id(true);
		this.changed = true;
	},
	get_block: function(block_id){
		for (var i=0; i < this.template.blocks.length; i++){
			if (this.template.blocks[i].id == block_id){
				return this.template.blocks[i];
			}
		}
	},
};
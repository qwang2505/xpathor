/*
 * Management template admin apis.
 */

var Api = {
	// environments
	envs: {
		"china": "dzone.dolphin.com",
		"china-test": "10.2.8.221",
		"global": "now.dolphin.com",
		"global-test": "10.2.10.106",
	},

	paths: {
		"add": "/admin/template/api/add",
		"update": "/admin/template/api/update",
		"get": "/admin/template/api/get",
	},

	get_locale: function(){
		// get locale from option, default should be zh-cn.
		var locale = localStorage["xpathor_locale"];
		if (!locale){
			locale = "zh-cn";
		}
		return locale;
	},

	get_path: function(action){
		var env = localStorage["xpathor_env"];
		if (!env){
			env = "china-test";
		}
		var server = this.envs[env];
		if (!server){
			alert("server not defined for env " + env);
			return;
		}
		var path = this.paths[action];
		if (!path){
			alert("path not defined for action " + action);
			return;
		}
		return "http://" + server + path;
	}
};
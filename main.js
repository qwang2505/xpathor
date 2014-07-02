
// global processors to reuse
var _processors = {};

// $(window).on('beforeunload', function() {
//     if (XpathorStorage.unsave){
//         return "Save templates before exit?";
//     }
// });

$("body").append("<div class='xpathor-selection-2'></div>");

// on status changed listener
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
        if (request.url != null && request.url != undefined){
            if (request.url != window.location.href){
                return;
            }
        }
        var processor;
        if (request.name == "extract_news"){
        	if ("news_processor" in _processors){
        		processor = _processors["news_processor"];
        	} else {
				processor = new NewsProcessor();
				_processors["news_processor"] = processor;
        	}
			processor.start();
			console.log("Extract news in main.js");
		} else if (request.name == "preview_news"){
        	if ("news_processor" in _processors){
        		processor = _processors["news_processor"];
        	} else {
				processor = new NewsProcessor();
				_processors["news_processor"] = processor;
        	}
        	processor.preview();
			console.log("Preview news in main.js");
        } else if (request.name == "extract_links"){
            if ("portal_processor" in _processors){
                processor = _processors["portal_processor"];
            } else {
                processor = new PortalProcessor();
                _processors["portal_processor"] = processor;
            }
            processor.start();
			console.log("Extract links from portal in main.js");
        } else if (request.name == "preview_block" && request.message.url == document.location.href){
            if ("portal_processor" in _processors){
                processor = _processors["portal_processor"];
            } else {
                processor = new PortalProcessor();
                _processors["portal_processor"] = processor;
            }
            var template = request.message.template;
            var block_id = request.message.blockID;
            processor.preview_block(template, block_id);
            console.log("preview block from portal in main.js");
        } else if (request.name == "preview_blocks"){
            if ("portal_processor" in _processors){
                processor = _processors["portal_processor"];
            } else {
                processor = new PortalProcessor();
                _processors["portal_processor"] = processor;
            }
            var template = TemplateManager.template;
            if (template == null || template == undefined){
                console.log("no template in TemplateManager while preview blocks");
                return;
            }
            console.log(template);
            processor._preview_by_templates(template);
            console.log("preview block from portal in main.js");
        } else if (request.name == "template_exists"){
            // whether template already exists, called by popup
            var response = {success: true};
            response.template = TemplateManager.template;
            sendResponse(response);
            return;
        } else if (request.name == "set_template"){
            // set template value, called by popup
            var template = request.template;
            if (template != null && template != undefined){
                TemplateManager.type = template.type;
                TemplateManager.template = template;
            }
            sendResponse({success: true});
            return;
        } else {
            console.log("Unknow request: " + request.name);
        }
		sendResponse({success: true});
    }
);
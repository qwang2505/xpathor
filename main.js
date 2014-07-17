
// global processors to reuse
var _processors = {};
var _content_type = null;

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
        if (request.message != null && request.message != undefined && request.message.url != null 
            && request.message.url != undefined && request.message.url != window.location.href){
            return;
        }
        console.log("got message in " + window.location.href);
        console.log(request);
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
        	processor.preview(TemplateManager.template);
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
        } else if (request.name == "preview_block" && request.message.url == window.location.href){
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
        } else if (request.name == "stop_preview_blocks") {
            $(".xpathor-preview-block").each(function(){
                var pre_block = $(this);
                var block_id = $(pre_block).attr("xpathor_block_id");
                $(pre_block).css({left: 0, top: 0, width: 0, height: 0});
                $(pre_block).attr("used", "false");
                $(pre_block).attr("xpathor_block_id", "");
                $(".xpathor-preview-news", $("*[xpathor_preview_block_id=\"" + block_id + "\"]")).each(function(){
                    $(this).removeClass("xpathor-preview-news");
                });
                $("*[xpathor_preview_block_id=\"" + block_id + "\"]").attr("xpathor_preview_block_id", "");
            });
        } else if (request.name == "template_exists"){
            // whether template already exists, called by popup
            var response = {success: true};
            response.template = TemplateManager.template;
            response.type = TemplateManager.type;
            response.previewing = $("div[class='xpathor-preview-block'][used='true']").length > 0;
            response.changed = TemplateManager.changed;
            sendResponse(response);
            return;
        } else if (request.name == "get_template"){
            var response = {success: true};
            if (TemplateManager.changed){
                response.template = TemplateManager.template;
            }
            sendResponse(response);
        } else if (request.name == "set_template"){
            // set template value, called by popup
            var template = request.template;
            var type = request.type;
            if (type == "portal" && template != null && template != undefined){
                TemplateManager.set_template(template, true);
            } else if (type == "news" && template.length > 0){
                TemplateManager.set_news_template(template);
            }
            sendResponse({success: true});
            return;
        } else if (request.name == "set_content_type"){
            _content_type = request.content_type;
        } else if (request.name == "get_content_type"){
            response = {success: true};
            response.content_type = _content_type;
            sendResponse(response);
            return;
        } else {
            console.log("Unknow request: " + request.name);
        }
		sendResponse({success: true});
    }
);
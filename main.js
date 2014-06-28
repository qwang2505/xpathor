
// global processors to reuse
var _processors = {};

$("body").append("<div class='xpathor-selection-2'></div>");

// on status changed listener
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
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
            var template = request.template;
            processor._preview_by_templates(template);
            console.log("preview block from portal in main.js");
        } else {
            console.log("Unknow request: " + request.name);
        }
		sendResponse({success: true});
    }
);

// global processors to reuse
var _processors = {};

// on status changed listener
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
        if (request.name == "extract_news"){
        	var processor;
        	if ("news_processor" in _processors){
        		processor = _processors["news_processor"];
        	} else {
				processor = new NewsProcessor();
				_processors["news_processor"] = processor;
        	}
			processor.start();
			console.log("Extract news in main.js");
		} else if (request.name == "preview_news"){
			var processor;
        	if ("news_processor" in _processors){
        		processor = _processors["news_processor"];
        	} else {
				processor = new NewsProcessor();
				_processors["news_processor"] = processor;
        	}
        	processor.preview();
			console.log("Preview news in main.js");
        } else if (request.name == "extract_links"){
			console.log("Extract links in main.js");
        } else if (request.name == "extract_links_from_portal"){
			console.log("Extract links from portal in main.js");
        } else if (request.name == "extract_links_from_roll"){
			console.log("Extract links from roll in main.js");
        }
		sendResponse({success: true});
    }
);
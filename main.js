
// on status changed listener
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
        if (request.name == "extract_news"){
			var processor = new NewsProcessor();
			processor.start();
			console.log("Extract news in main.js");
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
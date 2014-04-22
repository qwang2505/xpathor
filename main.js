
function extract_news(){
	var inject  = document.createElement("div");
	inject.innerHTML = "<div class='xpathor-tips' id='xpathor_tips'>Select Title</div></script>";
	document.body.insertBefore (inject, document.body.firstChild);
	setTimeout("$('#xpathor_tips').fadeOut('slow')", 3000);
	// TODO start to select title
	// TODO add click event handler for all elements in the website.
	start_select("title");
};

function start_select(item_name){
	$(window).mouseenter(function(event){
		$(event.target).addClass("xpathor-selection");
	});
	$(window).mouseleave(function(event){
		$(event.target).removeClass("xpathor-selection");
	});
	$(window).click(function(event){
		$(event.target).removeClass("xpathor-selection");
		try {
			// get xpath
			var xpath = XpathGenerator.get_fixed_xpath(event.target);
		} catch (err) {
			console.log(err.name + ": " + err.message);
			return;
		}
		alert(xpath);
		stop_select();
		return false;
	});
}

function stop_select(){
	$(window).unbind("mouseenter");
	$(window).unbind("mouseleave");
	$(window).unbind("click");
}

// on status changed listener
chrome.runtime.onMessage.addListener(
    function(request, sender, sendResponse){
        if (request.name == "extract_news"){
			extract_news();
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
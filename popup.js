
function extract_news() {
	console.log("[Popup] extract news button clicked");
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {name: "extract_news"}, function(response) {
            console.log("[Popup] Response from extract_news: " + response.success);
        });
    });
	window.close();
}

function extract_links() {
	console.log("[Popup] extract links button clicked");
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {name: "extract_links"}, function(response) {
            console.log("[Popup] Response from extract_links: " + response.success);
        });
    });
	window.close();
}

function login(){
	console.log("[Popup] login");
	window.close();
}

function preview(){
    console.log("[Popup] preview");
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {name: "preview_news"}, function(response) {
            console.log("[Popup] Response from preview_news: " + response.success);
        });
    });
    window.close();
}

document.addEventListener('DOMContentLoaded', function () {
	document.getElementById("extract_news_btn").addEventListener('click', extract_news);
	document.getElementById("extract_link_btn").addEventListener('click', extract_links);
	document.getElementById("login_btn").addEventListener('click', login); 
    document.getElementById("preview_result").addEventListener('click', preview); 
});
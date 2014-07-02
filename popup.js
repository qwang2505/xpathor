var TEMPLATE = null;

function extract_news() {
	console.log("[Popup] extract news button clicked");
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {name: "extract_news", url: tabs[0].url}, function(response) {
            console.log("[Popup] Response from extract_news: " + response.success);
            window.close();
        });
    });
}

function extract_links() {
	console.log("[Popup] extract links button clicked");
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {name: "extract_links", url: tabs[0].url}, function(response) {
            console.log("[Popup] Response from extract_links: " + response.success);
            window.close();
        });
    });
}

function login(){
	console.log("[Popup] login");
	window.close();
}

function preview_blocks(){
    console.log("[Popup] preview blocks");
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {name: "preview_blocks", template: TEMPLATE, url: tabs[0].url}, function(response) {
            console.log("[Popup] Response from preview_news: " + response.success);
        });
        window.close();
    });
}

document.addEventListener('DOMContentLoaded', function () {
	document.getElementById("extract_news_btn").addEventListener('click', extract_news);
	document.getElementById("extract_link_btn").addEventListener('click', extract_links);
	document.getElementById("login_btn").addEventListener('click', login); 
    document.getElementById("preview_blocks_btn").addEventListener('click', preview_blocks); 

    // send message to check if supported sites, to display buttons.
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        var url = tabs[0].url;
        // $.get("http://10.2.8.221/admin/template/api/get?lc=zh-cn&type=portal&key=" + url, function(data){
        //     if (data['data'].length == 0){
        //         // new site, show extract links button
        //         $("#extract_link_btn").toggleClass("hide");
        //         return;
        //     }
        //     TEMPLATE = data['data'][0];
        //     // show preview and append blocks button
        //     $("#preview_blocks_btn").toggleClass("hide");
        //     $("#add_blocks_btn").toggleClass("hide");
        // });
        if (TEMPLATE == null){
            // check if portal template available in local storage
            chrome.storage.local.get(url, function(result){
                console.log(result);
                if (url in result){
                    TEMPLATE = result[url];
                    // show preview and append blocks button
                    $("#preview_blocks_btn").toggleClass("hide");
                    $("#add_blocks_btn").toggleClass("hide");
                } else {
                    $("#extract_link_btn").toggleClass("hide");
                }
            });
        }
    });
    // just for test
    //$("#extract_link_btn").toggleClass("hide");
});
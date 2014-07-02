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

function load_template(url){
    // load template in popup scripts
    //$.get("http://10.2.8.221/admin/template/api/get?lc=zh-cn&type=portal&key=" + url, function(data){
    $.get("http://10.2.8.221/admin/template/api/get?lc=zh-cn&type=portal&key=" + url, function(data){
        if (data['data'].length == 0){
            // new site, show extract links button
            $("#extract_link_btn").toggleClass("hide");
            return;
        }
        TEMPLATE = data['data'][0];
        // show preview and append blocks button
        $("#preview_blocks_btn").toggleClass("hide");
        $("#add_blocks_btn").toggleClass("hide");
        // send message to content scripts to pass the template
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.tabs.sendMessage(tabs[0].id, {name: "set_template", template: TEMPLATE, url: tabs[0].url}, function(responsel){
                console.log("[Popup] set template to content scripts succeed");
            });
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
	document.getElementById("extract_news_btn").addEventListener('click', extract_news);
	document.getElementById("extract_link_btn").addEventListener('click', extract_links);
	document.getElementById("login_btn").addEventListener('click', login); 
    document.getElementById("preview_blocks_btn").addEventListener('click', preview_blocks); 


    // just for test
    //$("#extract_link_btn").toggleClass("hide");

    // first, send message to content scripts to check whether the template exists.
    // if exists, use existed templates, otherwise load template in popup and pass
    // back to content script, in content script will save into local storage.
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        var url = tabs[0].url;
        // send messsage to content script to check whether template exists
        chrome.tabs.sendMessage(tabs[0].id, {name: "template_exists", url: url}, function(response) {
            console.log("[Popup] Response from template_exists: ");
            console.log(response);
            var template = response.template;
            if (template != null || template != undefined){
                if (template.type == "portal"){
                    $("#preview_blocks_btn").toggleClass("hide");
                    $("#add_blocks_btn").toggleClass("hide");
                } else if (template.type == "news"){

                } else {
                    console.log("[Popup] unknow template type: " + template.type);
                }
            } else {
                // template not loaded, popup handle template loading.
                load_template(url);
            }
        });
    });
});
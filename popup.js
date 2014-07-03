var SERVER = "10.2.8.221";
var LOCALE = "zh-cn";

function load_template(url){
    // load template in popup scripts
    $.get("http://" + SERVER + "/admin/template/api/get?lc=zh-cn&type=portal&key=" + url, function(data){
        if (data['data'].length == 0){
            // new site, show extract links button
            $("#extract_link_btn").toggleClass("hide");
            return;
        }
        var template = data['data'][0];
        // show preview and append blocks button
        $("#preview_blocks_btn").toggleClass("hide");
        $("#add_blocks_btn").toggleClass("hide");
        // send message to content scripts to pass the template
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.tabs.sendMessage(tabs[0].id, {name: "set_template", template: template, url: tabs[0].url}, function(responsel){
                console.log("[Popup] set template to content scripts succeed");
            });
        });
    });
}
function add_template(template){
    delete template.new;
    if (template.type == "portal"){
        // delete id
        for (var i=0; i < template.blocks.length; i++){
            if (template.blocks[i].id != null && template.blocks[i].id != undefined && template.blocks[i].id[0] == "B"){
                delete template.blocks[i].id;
            }
        }
    }
    // call api to add new template
    $.post("http://" + SERVER + "/admin/template/api/add", {lc: LOCALE, type: template.type, template: JSON.stringify(template)}, function(resp){
        console.log(resp);
        // TODO get object id from response, and send to content script for later update.
        window.close();
    }).fail(function(){
        alert("error on update template, please contact the developer");
    });
}
function update_template(template){
    if (template.type == "portal"){
        // delete id
        for (var i=0; i < template.blocks.length; i++){
            if (template.blocks[i].id != null && template.blocks[i].id != undefined && template.blocks[i].id[0] == "B"){
                delete template.blocks[i].id;
            }
        }
    }
    // call api to update template
    var oid = template._id;
    if (oid == null || oid == undefined){
        alert("oid is null while update template!");
        return;
    }
    delete template._id;
    $.post("http://" + SERVER + "/admin/template/api/update", {lc: LOCALE, type: template.type, oid: oid, template: JSON.stringify(template)}, function(resp){
        console.log(resp);
        window.close();
    }).fail(function(){
        // alert error
        alert("error on update template, please contact the developer");
    });
}

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
    var html = $("#preview_blocks_btn").html();
    if (html == "Stop Preview"){
        console.log("[Popup] stop preview blocks");
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {name: "stop_preview_blocks", url: tabs[0].url}, function(response) {
                console.log("[Popup] Response from stop preview_news: " + response.success);
            });
            window.close();
        });       
    } else {
        console.log("[Popup] preview blocks");
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {name: "preview_blocks", url: tabs[0].url}, function(response) {
                console.log("[Popup] Response from preview_news: " + response.success);
            });
            window.close();
        });
    }
}

function save_template(){
    // send message to get unsaved template from content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {name: "get_template", url: tabs[0].url}, function(response) {
            console.log("[Popup] Response from get_template: " + response.success);
            if (response.template == null || response.template == undefined){
                alert("Nothing to save!");
                return;
            }
            var template = response.template;
            console.log(template);
            if (template.new){
                // add new template
                console.log("add new template");
                add_template(template);
            } else {
                console.log("update template");
                update_template(template);
            }
        });
    });
}

function add_blocks(){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {name: "extract_links", url: tabs[0].url}, function(response) {
            console.log("[Popup] Response from extract_links: " + response.success);
            window.close();
        });
    });
}


document.addEventListener('DOMContentLoaded', function () {
	document.getElementById("extract_news_btn").addEventListener('click', extract_news);
	document.getElementById("extract_link_btn").addEventListener('click', extract_links);
	document.getElementById("login_btn").addEventListener('click', login); 
    document.getElementById("preview_blocks_btn").addEventListener('click', preview_blocks); 
    document.getElementById("save_template_btn").addEventListener('click', save_template); 
    document.getElementById("add_blocks_btn").addEventListener('click', add_blocks); 


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
                    if (response.previewing){
                        $("#preview_blocks_btn").html("Stop Preview");
                    }
                } else if (template.type == "news"){

                } else {
                    console.log("[Popup] unknow template type: " + template.type);
                }
                if (response.changed){
                    $("#save_template_btn").toggleClass("hide");
                }
            } else {
                // template not loaded, popup handle template loading.
                load_template(url);
            }
        });
    });
});
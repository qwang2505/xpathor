
function load_template(url){
    // load template in popup scripts
    var api_path = Api.get_path("get") + "?lc=" + Api.get_locale() + "&type=portal&key=" + url;
    $.get(api_path, function(data){
        if (data['data'].length == 0){
            // new site, show extract links button
            $("#extract_link_btn").removeClass("hide");
            return;
        }
        var template = data['data'][0];
        // show preview and append blocks button
        $("#preview_blocks_btn").removeClass("hide");
        $("#add_blocks_btn").removeClass("hide");
        // send message to content scripts to pass the template
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.tabs.sendMessage(tabs[0].id, {name: "set_template", template: template, url: tabs[0].url, type: "portal"}, function(responsel){
                console.log("[Popup] set template to content scripts succeed");
            });
        });
    });
}
function load_detail_template(url){
    // load template in popup scripts
    var api_path = Api.get_path("get") + "?lc=" + Api.get_locale() + "&type=news&key=" + url;
    $.get(api_path, function(data){
        if (data['data'].length == 0){
            // new site, show extract links button
            $("#extract_news_btn").removeClass("hide");
            return;
        }
        var templates = data['data'];
        // show preview and append blocks button
        $("#preview_detail_btn").removeClass("hide");
        // send message to content scripts to pass the template
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
            chrome.tabs.sendMessage(tabs[0].id, {name: "set_template", template: templates, url: tabs[0].url, type: "news"}, function(responsel){
                console.log("[Popup] set template to content scripts succeed");
            });
        });
    });
}
function add_template(template, response){
    delete template.new;
    var locale = Api.get_locale();
    var data = {lc: locale, type: template.type, template: JSON.stringify(template)};
    if (template.type == "portal"){
        // delete id
        //for (var i=0; i < template.blocks.length; i++){
        //    if (template.blocks[i].id != null && template.blocks[i].id != undefined && template.blocks[i].id[0] == "B"){
        //        delete template.blocks[i].id;
        //    }
        //}
        data['newslist'] = JSON.stringify(response.newslist);
    }
    console.log(data);
    // call api to add new template
    var api_path = Api.get_path("add");
    $.post(api_path, data, function(resp){
        console.log(resp);
        // TODO get object id from response, and send to content script for later update.
        if (!resp.success){
            alert("Add failed! " + resp.msg);
        }
        window.close();
    }).fail(function(){
        alert("error on add template, please contact the developer");
    });
}
function update_template(template, response){
    var locale = Api.get_locale();
    var oid = template._id;
    if (oid == null || oid == undefined){
        alert("oid is null while update template!");
        return;
    }
    delete template._id;
    var data = {lc: locale, type: template.type, oid: oid, template: JSON.stringify(template)};
    if (template.type == "portal"){
        // delete id
        //for (var i=0; i < template.blocks.length; i++){
        //    if (template.blocks[i].id != null && template.blocks[i].id != undefined && template.blocks[i].id[0] == "B"){
        //        delete template.blocks[i].id;
        //    }
        //}
        data['newslist'] = JSON.stringify(response.newslist);
    }
    // call api to update template
    var api_path = Api.get_path("update");
    console.log(data);
    $.post(api_path, data, function(resp){
        console.log(resp);
        if (!resp.success){
            alert("Update failed! " + resp.msg);
        }
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
function preview_detail(){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        chrome.tabs.sendMessage(tabs[0].id, {name: "preview_news", url: tabs[0].url}, function(response) {
            console.log("[Popup] Response from extract_news: " + response.success);
            window.close();
        });
    });
}
function edit_detail(){
    console.log("[Popup] add detail template clicked");
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {name: "extract_news", url: tabs[0].url}, function(response) {
            console.log("[Popup] Response from extract_news: " + response.success);
            window.close();
        });
    });
}
function update_detail_template(template, response){

}
function save_detail_template(){
    // send message to get unsaved template from content script
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {name: "get_template", url: tabs[0].url}, function(response) {
            console.log("[Popup] Response from get_template: " + response.success);
            if (response.template == null || response.template == undefined){
                alert("Nothing to save!");
                return;
                window.close();
            }
            var template = response.template;
            console.log(template);
            if (template.new){
                // add new template
                console.log("add new template");
                add_template(template, response);
            } else {
                console.log("update template");
                update_detail_template(template, response);
            }
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

// check if news in blocks need to validate.
function _need_validate(template, response){
    var newslist = response.newslist;
    for (var i=0; i < template.blocks.length; i++){
        if (!template.blocks[i].new || template.blocks[i].validated){
            continue;
        }
        var bid = template.blocks[i].id;
        if (bid in newslist){
            return true;
        }
    }
    return false;
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
            if (_need_validate(template, response)){
                chrome.tabs.sendMessage(tabs[0].id, {name: "validate_news", url: tabs[0].url}, function(response){
                    return;
                })
                window.close();
                return;
            }
            if (template.new){
                // add new template
                console.log("add new template");
                add_template(template, response);
            } else {
                console.log("update template");
                update_template(template, response);
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

// do this when portal tab is show
function init_portal_tab(){
    // first, send message to content scripts to check whether the template exists.
    // if exists, use existed templates, otherwise load template in popup and pass
    // back to content script, in content script will save into local storage.
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        var url = tabs[0].url;
        // send messsage to content script to check whether template exists
        chrome.tabs.sendMessage(tabs[0].id, {name: "template_exists", url: url, type: "portal"}, function(response) {
            console.log("[Popup] Response from template_exists: ");
            console.log(response);
            var template = response.template;
            if (template != null || template != undefined){
                if (response.type == "portal"){
                    $("#preview_blocks_btn").removeClass("hide");
                    $("#add_blocks_btn").removeClass("hide");
                    if (response.previewing){
                        $("#preview_blocks_btn").html("Stop Preview");
                    }
                } else {
                    console.log("[Popup] unknow template type: " + response.type);
                }
                if (response.changed){
                    $("#save_template_btn").removeClass("hide");
                }
            } else {
                // template not loaded, popup handle template loading.
                load_template(url);
            }
        });
    });
}

// do this when news detail tab is show
function init_detail_tab(){
    // first, send message to content scripts to check whether the template exists.
    // if exists, use existed templates, otherwise load template in popup and pass
    // back to content script, in content script will save into local storage.
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        var url = tabs[0].url;
        // send messsage to content script to check whether template exists
        chrome.tabs.sendMessage(tabs[0].id, {name: "template_exists", url: url, type: "news"}, function(response) {
            console.log("[Popup] Response from template_exists: ");
            console.log(response);
            var template = response.template;
            var type = response.type;
            if (template != null || template != undefined){
                if (type == "news"){
                    $("#preview_detail_btn").removeClass("hide");
                    $("#edit_detail_btn").removeClass("hide");
                    if (response.previewing){
                        $("#preview_detail_btn").html("Stop Preview");
                    }
                } else {
                    console.log("[Popup] unknow template type: " + type);
                }
                if (response.changed){
                    $("#save_detail_template_btn").removeClass("hide");
                }
            } else {
                // template not loaded, popup handle template loading.
                load_detail_template(url);
            }
        });
    });
}

function init_tab(){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        var url = tabs[0].url;
        chrome.tabs.sendMessage(tabs[0].id, {name: "get_content_type", url: url}, function(response) {
            var type = response.content_type;
            console.log(type);
            if (type != null && type != undefined){
                // show tab
                if (type == "news"){
                    $("#news_detail_tab").addClass("selected");
                    $("#news_detail_tab_buttons").addClass("show");
                    init_detail_tab();
                } else if (type == "portal"){
                    $("#portal_link_tab").addClass("selected");
                    $("#portal_link_tab_buttons").addClass("show");
                    init_portal_tab();
                } else {
                    console.log("unknow content type: " + type);
                }
            } else {
                // show news detail tab
                $("#news_detail_tab").addClass("selected");
                $("#news_detail_tab_buttons").addClass("show");
                init_detail_tab();
            }
        });
    });
}

function report_error(){
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        var url = tabs[0].url;
        chrome.tabs.sendMessage(tabs[0].id, {name: "get_content_type", url: url}, function(response) {
            var type = response.content_type;
            window.open("mailto:qwang@bainainfo.com?subject=" + escape("Report Xpathor Error [" + (type || "unknow type") + "]") + 
                        "&body=" + escape("\n\nURL: " + url + "\n\nError message: \n"));
            window.close();
        });
    });
}

document.addEventListener('DOMContentLoaded', function () {
    // news detail buttons
	document.getElementById("extract_news_btn").addEventListener('click', extract_news);
    document.getElementById("preview_detail_btn").addEventListener('click', preview_detail); 
    document.getElementById("edit_detail_btn").addEventListener('click', edit_detail); 
    document.getElementById("save_detail_template_btn").addEventListener('click', save_detail_template); 
    // portal link buttons
	document.getElementById("extract_link_btn").addEventListener('click', extract_links);
    document.getElementById("preview_blocks_btn").addEventListener('click', preview_blocks); 
    document.getElementById("save_template_btn").addEventListener('click', save_template); 
    document.getElementById("add_blocks_btn").addEventListener('click', add_blocks); 
    // extra buttons
    document.getElementById("login_btn").addEventListener('click', login); 
    document.getElementById("report_error_btn").addEventListener('click', report_error); 

    // default all tab content should not show, send message to content script
    // to get content type, if can not get, show the first one.
    init_tab();

    $(".tab").each(function(){
        $(this).click(function(){
            if ($(this).hasClass("selected")){
                // already selected, do nothing
                return;
            }
            $(".tab.selected").removeClass("selected");
            $(this).addClass("selected");
            $(".tab-content").each(function(){
                $(this).removeClass("show");
            });
            var id = $(this).attr("id");
            var type = null;
            $("#" + id + "_buttons").addClass("show");
            if (id == "portal_link_tab"){
                init_portal_tab();
                type = "portal";
            } else if (id == "news_detail_tab"){
                init_detail_tab();
                type = "news";
            } else {
                console.log("error happend, unknow tab clicked");
            }
            // send message to set content type to content script, so when open 
            // again can get from content script and set directly.
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
                var url = tabs[0].url;
                chrome.tabs.sendMessage(tabs[0].id, {name: "set_content_type", url: url, content_type: type});
            });
        });
    });
});
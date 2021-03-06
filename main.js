
// global processors to reuse
var _processors = {};
var _content_type = null;
var _edit_news_dialog = null;

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
        } else if (request.name == "edit_news"){
            var template = TemplateManager.template;
            if (template == null || template == undefined || TemplateManager.type != "news"){
                alert("No news template to edit!");
                return;
            }
            // TODO create dialog to edit news template
            create_edit_news_dialog(template);
            _edit_news_dialog.toggleClass("xpathor-dialog-show");
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
            var response = {success: false};
            try {
                var template = request.message.template;
                var block_id = request.message.blockID;
                processor.preview_seed(template, block_id);
                response.success = true;
                console.log("preview block from portal in main.js");
            } catch (err){
                console.log("error while preview block: " + err);
            } finally {
                sendResponse(response);
                return;
            }
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
            processor.preview_by_templates(template);
            console.log("preview block from portal in main.js");
        } else if (request.name == "stop_preview_blocks") {
            $(".xpathor-preview-block").each(function(){
                var pre_block = $(this);
                var block_id = $(pre_block).attr("xpathor_block_id");
                $(pre_block).css({left: 0, top: 0, width: 0, height: 0, display: "none"});
                $(pre_block).attr("used", "false");
                $(pre_block).attr("xpathor_block_id", "");
                $(".xpathor-preview-news", $("*[xpathor_preview_block_id=\"" + block_id + "\"]")).each(function(){
                    $(this).removeClass("xpathor-preview-news");
                });
                $("*[xpathor_preview_block_id=\"" + block_id + "\"]").attr("xpathor_preview_block_id", "");
                // remove button listeners
                $(".xpathor-preview-hide", $(pre_block)).unbind("click");
                $(".xpathor-preview-delete", $(pre_block)).unbind("click");
                $(".xpathor-preview-edit", $(pre_block)).unbind("click");
                $(".xpathor-preview-newslist-btn", $(pre_block)).unbind("click");
            });
        } else if (request.name == "peep_blocks") {
            // TODO peep blocks
            console.log("peep blocks in main");
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
            processor.peep_blocks(template);
            console.log("peep block from portal in main.js");
        } else if (request.name == "stop_peep_blocks"){
            // TODO stop peep blocks
            console.log("stop peep blocks in main");
            if ("portal_processor" in _processors){
                processor = _processors["portal_processor"];
            } else {
                processor = new PortalProcessor();
                _processors["portal_processor"] = processor;
            }
            processor.stop_peep_blocks();
            console.log("stop peep block from portal in main.js");
        } else if (request.name == "template_exists"){
            // whether template already exists, called by popup
            var response = {success: true};
            var type = request.type;
            if (type == TemplateManager.type){
                response.template = TemplateManager.template;
                response.type = TemplateManager.type;
            } else {
                response.template = null;
                response.type = type;
            }
            response.previewing = $("div[class='xpathor-preview-block'][used='true']").length > 0;
            response.peeping = $("div[peeping='true']").length > 0;
            response.changed = TemplateManager.changed;
            console.log(response);
            sendResponse(response);
            return;
        } else if (request.name == "get_template"){
            var response = {success: true};
            if (TemplateManager.changed){
                if (TemplateManager.type == 'portal'){
                    response.template = TemplateManager.template;
                    response.newslist = TemplateManager.newslist;
                } else if (TemplateManager.type == 'news'){
                    // TODO here just get first template in templates list
                    response.template = TemplateManager.template[0];
                    response.template.new = true;
                    response.template.type = "news";
                }
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
        } else if (request.name == "validate_news"){
            if (TemplateManager.type != "portal"){
                alert("only portal can validate news");
                return;
            }
            var template = TemplateManager.template;
            var newslist = TemplateManager.newslist;
            validate_news(template, newslist);
        } else {
            console.log("Unknow request: " + request.name);
        }
		sendResponse({success: true});
    }
);

function get_validate_news_dialog(){
    var dialog = $("#xpathor-validate-news-dialog");
    if (dialog == null || dialog.length == 0){
        $("body").append("<div id='xpathor-validate-news-dialog' class='xpathor-validate-news-dialog'>" +
                        "<a class=\"xpathor-validate-boxclose\" id=\"xpathor-validate-boxclose\"></a>" +
                        "<div id='xpathor-validate-news-list' style='margin-top: 10px'></div></div>");
        $("#xpathor-validate-boxclose").click(function(){
            $("#xpathor-validate-news-dialog").toggleClass("xpathor-dialog-show");
        });
    }
}

// popup validate news dialog to validate news list. 
function validate_news(template, newslist){
    console.log("validate news");
    console.log(template);
    console.log(newslist);
    get_validate_news_dialog();
    var html = "<table cellspacing='0' border='1' width='95%'><tr><th width='80%'>Title</th><th width='20%'>Validate</th></tr>"
    // get dialog
    var count = 0;
    for (var i=0; i < template.blocks.length; i++){
        if (!template.blocks[i].new || template.blocks[i].validated){
            continue
        }
        var bid = template.blocks[i].id;
        if (bid in newslist){
            var title = newslist[bid][0].title;
            if (title == null || title == undefined || title.length == 0){
                title = newslist[bid][0].url;
            }
            count += 1;
            html += "<tr><td width='80%'><a target='_blank' href='" + newslist[bid][0].url + "'>" + title + "</a></td>" +
                    "<td width='20%'><input class='xpathor-validate-news-btn' type='button' value='Validate' bid='" + bid + "'></td></tr>";
        }
    }
    html += "</table>";
    if (count > 0){
        $("#xpathor-validate-news-list").html(html);
        $(".xpathor-validate-news-btn").each(function(){
            $(this).click(function(){
                var bid = $(this).attr("bid");
                TemplateManager.validate_block_news(bid);
                $(this).attr("disabled", true);
            });
        })
        $("#xpathor-validate-news-dialog").toggleClass("xpathor-dialog-show");
    } else {
        alert("can not extract news links from block, please try again.");
    }
}



function create_edit_news_dialog(template){
    // create dialog to let user select category, news status, headline status, etc.
    if (_edit_news_dialog == null){
        $("body").append('<div id="xpathor_edit_news_dialog" class="xpathor-dialog">' + 
            '<div id="xpathor_edit_news_dialog_title" class="xpathor-selection-block xpathor-edit-news-title"><input type="text" value=\'\'></div>' + 
            '<div id="xpathor_edit_news_dialog_content" class="xpathor-selection-block xpathor-edit-news-content"><input type="text" value=\'\'></div>' +

            '<div class="xpathor-selection-buttons"><input type="button" value="取消" id="xpathor_edit_news_dialog_cancel" class="xpathor-dialog-button"></input>' + 
            '<input type="button" value="确定" id="xpathor_edit_news_dialog_confirm" class="xpathor-dialog-button confirm"></input></div>' +
            '</div>');
        // add event listener for buttons
        $("#xpathor_edit_news_dialog_cancel").click(function(){
            $("#xpathor_edit_news_dialog").toggleClass("xpathor-dialog-show");
            return false;
        });
        $("#xpathor_edit_news_dialog_confirm").click(function(){
            $("#xpathor_edit_news_dialog").toggleClass("xpathor-dialog-show");
            return false;
        });
        _edit_news_dialog = $("#xpathor_edit_news_dialog");
    }
    $("#xpathor_edit_news_dialog_title input").val(template[0].title);
    $("#xpathor_edit_news_dialog_content input").val(template[0].content);
}
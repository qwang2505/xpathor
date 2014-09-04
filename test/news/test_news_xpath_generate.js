/*
 * This script is for testing correct rate of news xpath generating.
 *
 * NOTICE must download pages before run this test.
 */
var page = require("webpage").create();
var fs = require("fs");
var system = require("system");
var args = system.args;

if (args.length == 1){
    console.log("require argument index");
    phantom.exit();
}

var index = parseInt(args[1]);

if (index == null){
    console.log("index not provided");
    phantom.exit();
}

var url_file = "/home/qwang/workspace/xpathor/test/news/news_urls.txt";
var template_file = "/home/qwang/workspace/xpathor/test/news/news_result.txt";

var base_url = "file:///home/qwang/workspace/xpathor/test/news/urls/";

// first, read url list from file
var content = fs.read(url_file);
var urls = content.split("\n");
// second, read xpath result from file TODO how to write into file
content = fs.read(template_file);
var strs = content.split("\n");
var templates = [];
for (var i=0; i < strs.length; i++){
    if (strs[i].length == 0){
        continue;
    }
    templates.push(JSON.parse(strs[i]));
}

page.onResourceRequested = function(requestData, request){
    // abort other request
    if (requestData.url.substr(0, 7) != "file://"){
        request.abort();
    }
};

page.onError = function(){};

page.onAlert = function(msg){
    console.log("Alert: " + msg);
};

// start to test, construct local file uri to start page and run scripts to test xpath generate
if (index >= urls.length){
    console.log("index out of range");
    phantom.exit();
}
if (urls[index].length == 0){
    console.log("url empty");
    phantom.exit();
}
var url = base_url + index + ".html";
page.open(url, function(status){
    if (status == "fail"){
        console.log("Generate result: fail");
        console.log("Generate result detail: download error");
        phantom.exit();
    }
    page.injectJs("../../jquery.js");
    page.injectJs("../../jquery.xpath.min.js");
    page.injectJs("../../class.js");
    page.injectJs("../../definations.js");
    page.injectJs("../../xpath_evaluator.js");
    page.injectJs("../../xpath_generator.js");
    page.injectJs("../../portal_xpath_generator.js");
    page.evaluate(function(template){
        try{
            var exts = template.title.split('/');
            var title_ext = exts[exts.length - 1];
            var title_template = template.title.replace("/" + title_ext, "");
            var title = XpathEvaluator.evaluate(document, title_template);
            var content = XpathEvaluator.evaluate(document, template.content);
            if (title == undefined || title == null || content == undefined || content == null){
                alert("template error: can not extract title or content, template: " + JOSN.stringify(template));
                return;
            }
            if (title.get(0) == undefined || title.get(0) == null || content.get(0) == undefined || content.get(0) == null){
                alert("template error: can not extract title or content element, template: " + JSON.stringify(template));
                return;
            }
            var generator = new XpathGenerator();
            var title_xpath = generator.get_fixed_xpath(title.get(0)) + "/" + title_ext;
            var content_xpath = generator.get_fixed_xpath(content.get(0));
            if (title_xpath == template.title && content_xpath == template.content){
                alert("Generate result: success");
            } else {
                alert("Generate result: fail");
                var result = "";
                if (title_xpath != template.title){
                    result += "title fail, should be: " + template.title + ", got " + title_xpath + ".";
                }
                if (content_xpath != template.content){
                    result += "\tcontent fail, should be: " + template.content + ", got " + content_xpath + ".";
                }
                if (result.length > 0){
                    alert("Generate result detail: " + result);
                }
            }
        } catch (err){
            alert("Error: " + err);
        }
    }, templates[index]);
    phantom.exit();
});

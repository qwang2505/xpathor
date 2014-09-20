/*
 * Xpath evaluator for general usage.
 */
var XpathEvaluator = {

    // fill path with specific types to be used in python algorithm 
    // type ---> postfix
    // text ---> /text()
    // attr ---> /@attr 
    // full text ---> /text_content()
    fill_xpath: function(ori, type, attr){
        if (ori == "NOT_SET" || ori.length == 0){
            return "";
        }
        if (type == "text"){
            ori += "/text()";
        } else if (type == "full_text"){
            ori += "/text_content()";
        } else if (type == "attr") {
            ori += "/@" + attr;
        } else {
            console.log("[Xpath] unknow xpath type: " + type);
        }
        return ori;
    },

    // extract result by xpath
    evaluate: function(context, xpath){
        if (xpath == undefined || xpath == null || xpath == NOT_SET || xpath.length == 0){
            return null;
        }
        if (xpath.indexOf("table") != -1){
            xpath = xpath.replace("table", "table/tbody");
        }
        if (this._is_text(xpath)){
            return this._extract_text(context, xpath);
        } else if (this._is_attr(xpath)){
            return this._extract_text(context, xpath);
        } else if (this._is_full_text(xpath)){
            return this._extract_full_text(context, xpath);
        } else {
            return this._extract(context, xpath);
        }
    },

    // extract element
    _extract: function(context, xpath){
        return $(context).xpath(xpath);
    },

    _is_text: function(xpath){
        return xpath.indexOf("/text()") != -1 && xpath.indexOf("/text()") == (xpath.length - "/text()".length);
    },

    // extract text result by xpath
    _extract_text: function(context, xpath){
        // extract elements first
        var elem = $(context).xpath(xpath);
        // get text of elements
        if (0 in elem) {
            elem = elem[0];
        }
        return elem.textContent;
    },

    _is_attr: function(xpath){
        var xpaths = xpath.split("/");
        var last = xpaths[xpaths.length - 1];
        return last.indexOf("@") == 0;
    },

    _is_full_text: function(xpath){
        return xpath.indexOf("/text_content()") != -1 && (xpath.indexOf("/text_content()") == (xpath.length - "/text_content()".length));
    },

    // extract full text content of elem
    _extract_full_text: function(context, xpath){
        var xpaths = xpath.split("/");
        xpaths = xpaths.slice(0, xpaths.length - 1);
        xpath = xpaths.join("/");
        var elem = $(context).xpath(xpath);
        return elem.text();
    },
};



var XpathGenerator = Class.extend({

    // good class name to locate an element
    _good_class_words: ["content", "cont", "txt", "body", "article", "item", "tit", "news", 
        "list", "post", "summary", "smy", "info", "time", "source", "detail", "zenwen"],

    /*
     * Get tag position in parent's children
     */
    get_child_tag_position: function(parent, elem){
        var children = $(parent).children();
        var index = 0;
        for (var i=0; i < children.length; i++){
            var child = children[i];
            if (child.tagName == elem.tagName){
                index += 1;
            }
            if (child == elem){
                break;
            }
        }
        return index;
        // TODO following code have exceptions
        //return $(parent).children(elem.tagName).index(elem) + 1;
    },

    /*
     * Get children of the given tag, return in an array
     * 
     * Normally we can get by:
     *   $(element).children(tag)
     * but maybe a jquery bug, here always have problem
     */
    _get_tag_children: function(element, tag){
        var children = $(element).children();
        var tag_children = new Array();
        for (var i=0; i < children.length; i++){
            if (children[i].tagName == tag){
                tag_children.push(children[i]);
            }
        }
        return tag_children;
    },

    /*
     * Get full xpath of the given element
     */
    get_full_xpath: function( element )
    {
        console.log("[Xpath] get full xpath");
        var xpath = '';
        for ( ; element && element.nodeType == 1; element = element.parentNode )
        {
            var children = this._get_tag_children(element.parentNode, element.tagName);
            var id = children.index(element) + 1;
            id > 1 ? (id = '[' + id + ']') : (id = '');
            xpath = '/' + element.tagName.toLowerCase() + id + xpath;
        }
        return xpath;
    },

    /*
     * Fix id, such as with numbers: post-123456, etc.
     */
    _fix_id: function(id){
        // TODO need to implement better
        return id.replace(/\d+/g, "");
    },

    /*
     * Fix class
     */
    _fix_class: function(clas){
        //
        clas = clas.replace(/\d+/g, "");
        var clases = clas.split(" ");
        if (clases.length == 1){
            return clas;
        }
        for (var i=0; i < clases.length; i++){
            for (var j=0; j < this._good_class_words.length; j++){
                if (clases[i].indexOf(this._good_class_words[j].toLowerCase()) != -1){
                    return clases[i];
                }
            }
        }
        return clas;
    },

    /*
     * Get node xpath, described by only current node, with class or id to locate the element
     */
    get_node_xpath: function(element){
        var tag = element.tagName;
        if (tag == null || tag == undefined){
            return "";
        }
        tag = element.tagName.toLowerCase();
        var id = element.id;
        if (id != undefined && id != null && id.length > 0){
            // do not need to fix id 
            var new_id = this._fix_id(id);
            if (id.length != new_id.length){
                // fixed
                if (id.indexOf(new_id) == 0){
                    return tag + "[starts-with(@id, \"" + new_id + "\")]";
                } else {
                    // use full id in xpath, maybe contains numbers, but we donot care
                    // this is different with same process in XpathGenerator
                    return tag + "[@id=\"" + id + "\"]";
                }
            } else {
                return tag + "[@id=\"" + id + "\"]";
            }
        }
        // don't have an id, we get xpath by class attribute
        var clas = element.className;
        for (var i=0; i < this._good_class_words.length; i++){
            if (clas.indexOf(this._good_class_words[i].toLowerCase()) != -1){
                var new_clas = this._fix_class(clas);
                if (new_clas.length != clas.length){
                    if (clas.indexOf(new_clas) == 0){
                        return tag + "[starts-with(@class, \"" + new_clas + "\")]";
                    } else if (clas.indexOf(new_clas) != -1){
                        return tag + "[contains(@class, \"" + new_clas + "\")]";
                    }
                } else {
                    return tag + "[@class=\"" + clas + "\"]";
                }
            }
        }
        return "";
    },

    /*
     * Get xpath by parents
     */
    _get_xpath_by_parents: function(xpath, parents){
        parents = parents.reverse();
        for (var i=1; i < parents.length; i++){
            var pos = -1;
            pos = this.get_child_tag_position(parents[i-1], parents[i]);
            if (pos == -1){
                return "";
            }
            if (pos == 1){
                xpath += "/" + parents[i].tagName.toLowerCase();
            } else {
                xpath += "/" + parents[i].tagName.toLowerCase() + "[" + pos + "]";
            }
        }
        return xpath;
    },

    /*
     * Get xpath by parents
     */
    get_xpath_by_parents: function(element){
        console.log("[Xpath] Get xpath by parents");
        var parent = element.parentNode;
        var count = 0;
        var max_count = 5;
        var xpath = "";
        var parents = new Array();
        parents.push(element);
        while (parent != undefined && parent != null){
            if (count > max_count){
                return "";
            }
            xpath = this.get_node_xpath(parent);
            if (xpath.length > 0){
                parents.push(parent);
                return this._get_xpath_by_parents(xpath, parents);
            }
            parents.push(parent);
            count += 1;
            parent = parent.parentNode;
        }
        return "";
    },

    /*
     * Normalize element. If element only have on child, use child instead
     */
    _normalize_element: function(element){
        console.log("[Xpath] normalize element");
        var children = element.childNodes;
        if (children.length == 1 && children[0].nodeType == 1){
            element = children[0];
        }
        return element;
    },

    /*
     * Get fixed xpath, described by id, class, as simple as possible, but can locate
     * the element with xpath
     */
    get_fixed_xpath: function(element){
        //try {
            element = this._normalize_element(element);
            // get xpath from current node, by id or class
            var xpath = this.get_node_xpath(element);
            if (xpath.length > 0){
                return "//" + xpath;
            }
            // get xpath by parents
            console.log(element);
            xpath = this.get_xpath_by_parents(element);
            if (xpath.length > 0){
                return "//" + xpath;
            }
            // TODO get xpath by childdren
            // TODO get xpath by siblings
            // TODO get xpath by parent siblings
            return this.get_full_xpath(element);
        //} catch (err) {
        //    console.log("[Xpath] error when get fixed xpath, " + err.name + ':' + err.message);
        //    return "";
        //}
    },

});

/*
 * This class is for generating xpath for news blocks. Xpath for news blocks
 * is always different with xpath for news detail, like, we can generate xpath
 * by 'class' or 'id' that is not meaningful, and also, we can use index to
 * indicate which block we need in blocks extracted by xpath.
 */
var BlockXpathGenerator = XpathGenerator.extend({

    _good_news_parent_tags: ["UL", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "P", "SPAN", "DD", "TD", "DIV"],
    _good_headline_parent_tags: ["UL", "LI", "H1", "H2", "H3", "H4", "H5", "H6", "STRONG", "B", "DT", "TD", "DIV"],

    /*
     * Get node xpath, described by only current node, with class or id to locate the element
     */
    get_node_xpath: function(element){
        var tag = element.tagName;
        if (tag == null || tag == undefined){
            return "";
        }
        tag = element.tagName.toLowerCase();
        // TODO get by data-* attributes
        var attrs = element.attributes;
        var attr;
        for (var i=0; i < attrs.length; i++){
            attr = attrs.item(i);
            if (attr.nodeName.startswith("data")){
                var name = attr.nodeName;
                var value = attr.nodeValue;
                if (value.length == 0){
                    continue;
                }
                var new_xpath = element.tagName.toLowerCase() + "[@" + name + "=\"" + value + "\"]";
                return new_xpath;
            }
        }
        var id = element.id;
        if (id != undefined && id != null && id.length > 0){
            // get by id
            var new_id = this._fix_id(id);
            if (id.length != new_id.length){
                // fixed
                if (id.indexOf(new_id) == 0){
                    return tag + "[starts-with(@id, \"" + new_id + "\")]";
                }
            } else {
                return tag + "[@id=\"" + id + "\"]";
            }
        }
        var clas = element.className.replace(" xpathor-selection", "").replace("xpathor-selection", "");
        if (clas.length <= 0){
            return "";
        }
        // TODO here just use first class, refine later
        var clases = clas.split(" ");
        if (clases.length == 1){
            return tag + "[@class=\"" + clas + "\"]";
        }
        return tag + "[starts-with(@class, \"" + clases[0] + "\")]";
    },

    /*
     * Normalize element. If element only have on child, use child instead
     */
    normalize_element: function(element){
        console.log("[Xpath] normalize element");
        var children = element.childNodes;
        if (children.length == 1 && children[0].nodeType == 1){
            return this.normalize_element(children[0]);
        }
        var non_empty_children = null;
        var one_valid_child = true;
        for (var i=0; i < children.length; i++){
            if ($(children[i]).children().length > 0){
                if (non_empty_children == null){
                    non_empty_children = children[i];
                } else {
                    one_valid_child = false;
                    break;
                }
            }
        }
        if (non_empty_children != null && one_valid_child){
            return this.normalize_element(non_empty_children);
        }
        return element;
    },

   /*
     * Get fixed xpath, described by id, class, as simple as possible, but can locate
     * the element with xpath
     */
    get_fixed_xpath: function(element){
        //try {
            element = this.normalize_element(element);
            // get xpath from current node, by id or class
            var xpath = this.get_node_xpath(element);
            if (xpath.length > 0){
                return "//" + xpath;
            }
            // get xpath by parents
            xpath = this.get_xpath_by_parents(element);
            if (xpath.length > 0){
                return "//" + xpath;
            }
            // TODO get xpath by childdren
            // TODO get xpath by siblings
            // TODO get xpath by parent siblings
            return this.get_full_xpath(element);
        //} catch (err) {
        //    console.log("[Xpath] error when get fixed xpath, " + err.name + ':' + err.message);
        //    return "";
        //}
    },

    _has_link_children: function(element){
        var children = $(element).children();
        for (var i=0; i < children.length; i++){
            if (children[i].tagName == "A"){
                return true;
            }
        }
        return false;
    },

    /*
     * Check and find link in the selected element.
     */
    _find_link_element: function(element, block){
        // check if there's link in selected element.
        if (element.tagName == "A"){
            return element;
        }
        var links = XpathEvaluator.evaluate(element, ".//a");
        if (links.length > 0){
            return element;
        }
        // no link in selected element, go up to find link in parent.
        var parent = element.parentNode;
        while (parent != block){
            if (parent.tagName == "A"){
                return parent;
            }
            parent = parent.parentNode;
        }
        // if still can not find link, I do not know how to handle either.
        // temporary just return selected element;
        // TODO maybe should check parent siblings?
        return element;
    },

    /*
     * Get news xpath within the block, headline indicate whether for headline or not.
     */
    get_news_xpath: function(element, block, headline){
        element = this._find_link_element(element, block);
        if (element.tagName == "A"){
            if (element.parentNode == block){
                // direct a in block
                return "a";
            } else {
                var parent = element.parentNode;
                var parent_tags = headline ? this._good_headline_parent_tags : this._good_news_parent_tags;
                if (parent_tags.indexOf(parent.tagName) == -1){
                    return this._get_news_xpath_by_parent(parent, block, "a", headline); 
                } else {
                    if (parent.parentNode == block){
                        return parent.tagName.toLowerCase() + "/" + "a";
                    } else {
                        return ".//" + parent.tagName.toLowerCase() + "/" + "a";
                    }
                }
            }
        }
        var postfix;
        if (this._has_link_children(element)){
            postfix = "/a";
        } else {
            postfix = "//a";
        }
        // get reletive xpath of parent and then add /a or //a to get news links
        var xpath = this._get_news_xpath_by_parent(element, block, "", headline);
        return xpath + postfix;
    },

    // get news xpaht by parent node, all tag names, do not use class or id in news xpath
    _get_news_xpath_by_parent: function(element, block, xpath, headline){
        var parent = element.parentNode;
        var new_xpath;
        if (xpath.length == 0){
            new_xpath = element.tagName.toLowerCase();
        } else {
            new_xpath = element.tagName.toLowerCase() + "/" + xpath;
        }
        if (parent == block){
            return new_xpath;
        }
        parent_tags = headline ? this._good_headline_parent_tags : this._good_news_parent_tags;
        if (parent_tags.indexOf(element.tagName) != -1){
            return ".//" + new_xpath;
        }
        if (parent_tags.indexOf(parent.tagName) != -1){
            if (parent.parentNode == block){
                return parent.tagName.toLowerCase() + "/" + new_xpath;
            } else {
                return ".//" + parent.tagName.toLowerCase() + "/" + new_xpath;
            }
        }
        return this._get_news_xpath_by_parent(parent, block, new_xpath, headline);
    },

    // validate headline xpath by evaluating headline xpath and compare with news element
    _validate_headline_xpath: function(xpath, block, news_element){
        console.log("validate headline xpath: " + xpath);
        var elements = XpathEvaluator.evaluate(block, xpath);
        for (var i=0; i < elements.length; i++){
            if (elements[i] == news_element){
                return false;
            }
        }
        return true;
    },

    _get_headline_xpath_by_attr: function(element, block, xpath, news_element){
        // TODO get xpath by data-* attribute
        var attrs = element.attributes;
        var attr;
        for (var i=0; i < attrs.length; i++){
            attr = attrs.item(i);
            if (attr.nodeName.startswith("data")){
                var name = attr.nodeName;
                var value = attr.nodeValue;
                var new_xpath = element.tagName.toLowerCase() + "[@" + name + "=\"" + value + "\"]";
                if (xpath.length > 0){
                    new_xpath += "/" + xpath;
                }
                if (parent != block){
                    new_xpath = ".//" + new_xpath;
                }
                if (this._validate_headline_xpath(new_xpath, block, news_element)){
                    return new_xpath;
                } 
            }
        }
        var id = element.id;
        var parent = element.parentNode;
        if (id.length > 0){
            var new_xpath = element.tagName.toLowerCase() + "[@id=\"" + id + "\"]";
            if (xpath.length > 0){
                new_xpath += "/" + xpath;
            }
            if (parent != block){
                new_xpath = ".//" + new_xpath;
            }
            if (this._validate_headline_xpath(new_xpath, block, news_element)){
                return new_xpath;
            }
        }
        var clas = element.className;
        if (clas.length > 0){
            // TODO split class name
            var new_xpath = element.tagName.toLowerCase() + "[@class=\"" + clas + "\"]";
            if (xpath.length > 0){
                new_xpath += "/" + xpath;
            }
            if (parent != block){
                new_xpath = ".//" + new_xpath;
            }
            if (this._validate_headline_xpath(new_xpath, block, news_element)){
                return new_xpath;
            } 
        }
        // TODO get xpath by data-* attribute
        return "";
    },

    // get headline xpath by parent, and validate after xpath generating.
    // we already get headline xpath by tag names in get_news_xpath, so here
    // just use attribute to locate headline element
    _get_headline_xpath_by_parent: function(element, block, xpath, news_element){
        var new_xpath = this._get_headline_xpath_by_attr(element, block, xpath, news_element);
        if (new_xpath.length > 0){
            return new_xpath;
        }
        if (element.parentNode == block){
            // can not get specific xpath to extract headline, return empty xpath
            return "";
        }
        if (xpath.length > 0){
            new_xpath = element.tagName.toLowerCase() + "/" + xpath;
        } else {
            new_xpath = element.tagName.toLowerCase();
        }
        return this._get_headline_xpath_by_parent(element.parentNode, block, new_xpath, news_element);
    },

    /*
     * Get headline xpath, need to pass in news item and news xpath to compare
     */
    get_headline_xpath: function(element, block, news_item, news_item_xpath){
        // first, check if links exists in selected element, if not, go up and check parent or find links
        // from parent siblings.
        element = this._find_link_element(element, block);
        // get xpath with get_news_xpath. If get different xpath with news_item_xpath, use it.
        // remember, in get_news_xpath, just use tagName in xpath, no class or id or other attribute.
        if (news_item_xpath.length > 0 && news_item_xpath != "NOT_SET"){
            var xpath = this.get_news_xpath(element, block, true);
            if (xpath.length > 0 && xpath != news_item_xpath && this._validate_headline_xpath(xpath, block, news_item)){
                return xpath;
            }
        }
        if (element.tagName == "A"){
            if (element.parentNode == block){
                if (news_item_xpath != "a"){
                    return "a";
                } else {
                    // headline xpath same with news item xpath, all a, so failed to 
                    // get headline xpath, return empty xpath
                    return "";
                }
            } else {
                var parent = element.parentNode;
                if (this._good_headline_parent_tags.indexOf(parent.tagName) == -1){
                    // get by parent
                    return this._get_headline_xpath_by_parent(parent, block, "a", news_item);
                } else {
                    xpath = parent.tagName.toLowerCase() + "/a";
                    if (xpath != news_item_xpath){
                        return xpath;
                    } else {
                        return this._get_headline_xpath_by_parent(parent, block, "a", news_item);
                    }
                }
            }
        }
        var postfix;
        if (this._has_link_children(element)){
            postfix = "/a";
        } else {
            postfix = "//a";
        }
        // get reletive xpath of parent and then add /a or //a to get news links
        var xpath = this._get_headline_xpath_by_parent(element, block, "", news_item);
        if (xpath.length > 0){
            return xpath + postfix;
        } else if (news_item_xpath.length == 0 || news_item_xpath == "NOT_SET") {
            // failed to generate xpath for headline use attribute, and news item not selected, here
            // try again use tag names to generate xpath for headline 
            xpath = this.get_news_xpath(element, block, true);
            if (xpath.length > 0 && xpath != news_item_xpath && this._validate_headline_xpath(xpath, block, news_item)){
                return xpath;
            }
            return "";
        } else {
            // generate xpath for headline failed and news item xpath not empty or not set,
            // return empty xpath for headline.
            return "";
        }
    },
});

var XpathEvaluator = {

    // fill path with specific types to be used in python algorithm 
    // type ---> postfix
    // text ---> /text()
    // attr ---> /@attr 
    // full text ---> /text_content()
    fill_xpath: function(ori, type, attr){
        if (ori == "NOT_SET"){
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

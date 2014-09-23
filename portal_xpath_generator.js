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
        console.log("[Xpath] normalize element: ");
        console.log(element);
        var children = element.childNodes;
        if (children.length == 1 && children[0].nodeType == 1 && children[0].tagName == "DIV"){
            return this.normalize_element(children[0]);
        }
        var non_empty_children = null;
        var one_valid_child = true;
        for (var i=0; i < children.length; i++){
            if ($(children[i]).children().length > 0){
                if (non_empty_children == null && children[i].tagName == "DIV"){
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
        element = this.normalize_element(element);
        // get xpath from current node, by id or class
        var xpath = this.get_node_xpath(element);
        if (xpath.length > 0){
            return "//" + this._fix_table(xpath);
        }
        // get xpath by parents
        xpath = this._get_xpath_by_parents(element);
        if (xpath.length > 0){
            return "//" + this._fix_table(xpath);
        }
        // TODO get xpath by childdren
        // TODO get xpath by siblings
        // TODO get xpath by parent siblings
        return this.get_full_xpath(element);
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
                    return this._fix_table(this._get_news_xpath_by_parent(parent, block, "a", headline)); 
                } else {
                    if (parent.parentNode == block){
                        return this._fix_table(parent.tagName.toLowerCase() + "/" + "a");
                    } else {
                        return this._fix_table(".//" + parent.tagName.toLowerCase() + "/" + "a");
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
        return this._fix_table(xpath + postfix);
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
                console.log("get headline xpath 1");
                return this._fix_table(xpath);
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
                    console.log("get headline xpath 2");
                    return this._fix_table(this._get_headline_xpath_by_parent(parent, block, "a", news_item));
                } else {
                    xpath = ".//" + parent.tagName.toLowerCase() + "/a";
                    if (xpath != news_item_xpath){
                        console.log("get headline xpath 3");
                        return this._fix_table(xpath);
                    } else {
                        console.log("get headline xpath 4");
                        return this._fix_table(this._get_headline_xpath_by_parent(parent, block, "a", news_item));
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
            console.log("get headline xpath 5");
            return this._fix_table(xpath + postfix);
        } else if (news_item_xpath.length == 0 || news_item_xpath == "NOT_SET") {
            // failed to generate xpath for headline use attribute, and news item not selected, here
            // try again use tag names to generate xpath for headline 
            xpath = this.get_news_xpath(element, block, true);
            if (xpath.length > 0 && xpath != news_item_xpath && this._validate_headline_xpath(xpath, block, news_item)){
                console.log("get headline xpath 6");
                return this._fix_table(xpath);
            }
            return "";
        } else {
            // generate xpath for headline failed and news item xpath not empty or not set,
            // return empty xpath for headline.
            return "";
        }
    },
});
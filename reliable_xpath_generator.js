/*
 * Reliable xpath generator for general usage. In this generator, generated xpath
 * use id, class, property, data-*, or other meaningful attributes to locate element,
 * but attribute value may not meaningful. Generated xpath is reliable because will
 * evaluted by generated xpath to verify xpath.
 */
var ReliableXpathGenerator = XpathGenerator.extend({
	
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
        // TODO what if number in middle of class name?
        clas = clas.replace(/\d+/g, "");
        return clas.split(" ");
    },

    /*
     * Get node xpath, described by only current node, with class or id to locate the element
     */
    _get_node_xpath: function(element){
    	var xpaths = [];
        var tag = element.tagName;
        if (tag == null || tag == undefined){
            return xpaths;
        }
        tag = element.tagName.toLowerCase();
        var id = element.id;
        if (id != undefined && id != null && id.length > 0){
            // do not need to fix id 
            var new_id = this._fix_id(id);
            if (id.length != new_id.length){
                // fixed
                if (id.indexOf(new_id) == 0){
                    xpaths.push(tag + "[starts-with(@id, \"" + new_id + "\")]");
                } else {
                    // use full id in xpath, maybe contains numbers, but we donot care
                    // this is different with same process in XpathGenerator
                    xpaths.push(tag + "[contains(@id, \"" + new_id + "\")]");
                }
            } else {
                xpaths.push(tag + "[@id=\"" + id + "\"]");
            }
        }
        // don't have an id, we get xpath by class attribute
        var clas = element.className;
        var clases = this._fix_class(clas);
        for (var i=0; i < clases.length; i++){
            if (this._good_class_words.indexOf(clases[i].toLowerCase()) != -1){
                if (clas.indexOf(clases[i]) != -1){
                	if (clas.length != clases[i].length){
                		xpaths.push(tag + "[contains(@class, \"" + clases[i] + "\")]");
                	} else {
                		xpaths.push(tag + "[@class=\"" + clases[i] + "\"]");
                	}
                }
            }
        }
        for (var i=0; i < clases.length; i++){
            if (this._good_class_words.indexOf(clases[i].toLowerCase()) == -1){
                if (clas.indexOf(clases[i]) != -1){
                	if (clas.length != clases[i].length){
                		xpaths.push(tag + "[contains(@class, \"" + clases[i] + "\")]");
                	} else {
                		xpaths.push(tag + "[@class=\"" + clases[i] + "\"]");
                	}
                }
            }
        }
        return xpaths;
    },

    /*
     * Get xpath by given parents
     */
    _get_xpath_by_given_parents: function(xpath, parents){
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
    _get_xpath_by_parents: function(element){
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
            xpath = this._get_node_xpath(parent);
            if (xpath.length > 0){
                parents.push(parent);
                return this._get_xpath_by_given_parents(xpath, parents);
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
        element = this._normalize_element(element);
        // get xpath from current node, by id or class
        var xpath = this._get_node_xpath(element);
        // TODO verify xpaths
        if (xpath.length > 0){
            return "//" + xpath;
        }
        // get xpath by parents
        xpath = this._get_xpath_by_parents(element);
        if (xpath.length > 0){
            return "//" + xpath;
        }
        // TODO get xpath by childdren
        // TODO get xpath by siblings
        // TODO get xpath by parent siblings
        return "";
    },
});
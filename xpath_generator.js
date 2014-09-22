/*
 * Basic xpath generator to generate xpath by given element.
 */
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
        return this._fix_table(xpath);
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
            xpath = this.get_node_xpath(parent);
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
     * Normalize element. If element only have on div child, use child instead
     */
    _normalize_element: function(element){
        console.log("[Xpath] normalize element");
        var children = element.childNodes;
        if (children.length == 1 && children[0].nodeType == 1 && children[0].tagName == "DIV"){
            element = children[0];
        }
        return element;
    },

    /*
     * Fix table problem
     */
    _fix_table: function(xpath){
        return xpath.replace(/\/tbody(\[.*?\])?\//, "/");
    },

    /*
     * Get fixed xpath, described by id, class, as simple as possible, but can locate
     * the element with xpath
     */
    get_fixed_xpath: function(element){
        element = this._normalize_element(element);
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

});
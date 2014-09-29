/*
 * Base processor, define some common methods of processors.
 */

var Processor = Class.extend({
    name: "base",
    // virtual start method
    start: function(message){},
    // virtaul next method
    next: function(step, data){},
    // virtual stop method
    stop: function(){},
    // upload
    upload: function(){},
    // show result
    display: function(){},

    // share methods
    // stop to select element with mouse
    stop_select: function(message){
        $(window).unbind("mouseenter");
        $(window).unbind("mouseleave");
        $(window).unbind("click");
        $(window).off("contextmenu");
        $(window).unbind("keyup");
    },
    // start to select element with mouse
    start_select: function(message, callback){
        $(window).mouseenter(function(event){
            $(event.target).addClass("xpathor-selection");
        });
        $(window).mouseleave(function(event){
            $(event.target).removeClass("xpathor-selection");
        });
        $(window).click(function(event){
            $(event.target).removeClass("xpathor-selection");
            // get xpath
            var xpathor = new ReliableXpathGenerator();
            var xpath = xpathor.get_fixed_xpath(event.target);
            // process xpath, pass to specific receiver
            var item_name = message.item;
            var obj = message.obj;
            message.data[item_name] = xpath;
            callback.call(obj, message);
            return false;
        });
        $(window).bind("contextmenu", function(event){
            $(event.target).removeClass("xpathor-selection");
            var item_name = message.item;
            var obj = message.obj;
            message.data[item_name] = NOT_SET;
            callback.call(obj, message);
            return false;
        });
    },
});
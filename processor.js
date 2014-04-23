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
        alert("stop select");
        $(window).unbind("mouseenter");
        $(window).unbind("mouseleave");
        $(window).unbind("click");
        alert("stop select finished");
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
            try {
                // get xpath
                var xpath = XpathGenerator.get_fixed_xpath(event.target);
            } catch (err) {
                console.log(err.name + ": " + err.message);
                return false;
            }
            // TODO process xpath, pass to specific receiver
            alert(xpath);
            this.stop_select();
            return false;
        });
    },
});
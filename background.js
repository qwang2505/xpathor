chrome.extension.onMessage.addListener(function (msg, sender, sendResponse) {
    //Set Content
    document.getElementById("tmp-clipboard").value = msg.text;
    //Get Input Element
    document.getElementById("tmp-clipboard").select();

    //Copy Content
    document.execCommand("Copy", false, null);
});

//catch the messages from the web page, then pass the messages to main.js
chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    if (request.name == "preview_block"){
        var api_path = Api.get_path("get") + "?lc=" + Api.get_locale() + "&type=portal&key=" + request.message["url"];
        $.get(api_path, function(data){
            var message = {};
            if (data == undefined) {
                alert("dont has this template");
                return;
            };
            message["url"] = request.message["url"];
            message['template'] = data.data[0];
            // TODO preview multiple blocks?
            message['blockID'] = request.message['block'][0];
            chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
                chrome.tabs.sendMessage(tabs[0].id, {name: "preview_block", message: message}, function(response) {
                    console.log("Response from main: " + response.success);
                });
            });
        });
    }
    sendResponse("success");
});
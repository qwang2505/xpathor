
$(document).ready(function(){
  // load env
  var env = localStorage["xpathor_env"];
  if (!env) {
    env = "china-test";
  }
  var select = document.getElementById("env");
  for (var i = 0; i < select.children.length; i++) {
    var child = select.children[i];
    if (child.value == env) {
      child.selected = "true";
      break;
    }
  }

  // load locale
  var locale = localStorage["xpathor_locale"];
  if (!locale) {
    locale = "zh-cn";
  }
  var select = document.getElementById("locale");
  for (var i = 0; i < select.children.length; i++) {
    var child = select.children[i];
    if (child.value == locale) {
      child.selected = "true";
      break;
    }
  }

  // add event listener
  $("#save").click(function(){
    // get env value
    var select = document.getElementById("env");
    var env = select.children[select.selectedIndex].value;
    localStorage["xpathor_env"] = env;
    // get locale value
    select = document.getElementById("locale");
    var locale = select.children[select.selectedIndex].value;
    localStorage["xpathor_locale"] = locale;
    // Update status to let user know options were saved.
    var status = document.getElementById("status");
    status.innerHTML = "Options Saved.";
    setTimeout(function() {
      status.innerHTML = "";
    }, 750);
  });
});
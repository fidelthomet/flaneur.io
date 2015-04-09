(function(context){

  // appendLog("huhu");


  

      

  document.getElementById("appid").value=chrome.runtime.id;  
  var logField = document.getElementById("log");
  var sendText=document.getElementById("sendText");
  var sendText=document.getElementById("sendText");
  var sendId=document.getElementById("sendId");
  var send=document.getElementById("send");

  send.addEventListener('click', function() {
    chrome.tabs.create({url:chrome.extension.getURL('test.html')});
    appendLog("sending to "+sendId.value);
    chrome.runtime.sendMessage(
      "ghlpaiadplimgfjidljkihjndknodgnk", 
      {myCustomMessage: {
  "name": "flaneur.io extension",
  "version": "1.0.0",
  "description": "This extensions allows you to collect your online research and send it to the flaneur.io app",
  "browser_action": {
    "default_title": "Send message to other apps",
    "default_icon": "icon_16.png",
    "default_popup": "index.html"
  },
  "background": {
    "scripts": ["eventPage.js"],
    "persistent": true
  },
  "permissions": ["notifications"],
  "manifest_version": 2
}
}, 
      function(response) { 
        appendLog("response: "+JSON.stringify(response));
      })
  });

  var appendLog = function(message) {
    logField.innerText+="\n"+message;
  }

  context.appendLog = appendLog;


     selection = window.getSelection().toString();
  if(selection!=""){
    chrome.runtime.sendMessage(
      "ghlpaiadplimgfjidljkihjndknodgnk", 
      {myCustomMessage: selection },

      function(response) { 
        appendLog("response: "+JSON.stringify(response));
      })
  }

})(window)

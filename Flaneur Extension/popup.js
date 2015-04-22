$(function(){
	$("#open").click(function(){
		chrome.tabs.create({ url: "vis.html" });
	})

	chrome.tabs.executeScript({ file: "jquery.js" }, function() {
		chrome.tabs.executeScript({
			file: "inject.js" 
		}, 
		function(data) {
			handleData(data[0])
		})
	})
})

function handleData(data){
	if(data.highlight){
		$("#nothing_selected").hide()
		$("#highlights").show()

		if(data.title){
			$("#title .content").html(data.title)
		} else {
			$("#title .content").html("Untitled")
		}

		if(data.author){
			$("#author .content").html(data.author)
		} else {
			$("#author .content").html("Unknown")
		}

		$("#highlights").append(hlDOM[0]+data.uid+hlDOM[1]+data.highlight+hlDOM[2]+newTagDOM+hlDOM[3])
		$("#hl-"+data.uid+" .addtag").on("focus",function(){
			var hl_id = $(this).parent().parent()[0].id.split("-")[1];
			var an_id = $.now()+"-"+Math.floor((Math.random()*.9+.1)*1000000)
			$(this).before(tagDOM[0]+an_id+tagDOM[1]+" "+tagDOM[2])
			$("#an-"+an_id).focus();
			$("#an-"+an_id).on("keydown", function(e){
				if ($(this).text()==" ") {
					$(this).text('')
				};
				
				if (e.keyCode==13) {
					event.preventDefault();
					if(!$(this).text()){
						this.blur()
					} else {
						$(this).parent().children(".addtag").focus()
					}
				}
			});
			$("#an-"+an_id).on("keyup", function(){
				if (!$(this).text()) {
					$(this).text(' ')
				};
			});
			$("#an-"+an_id).on("focus", function(){
					selectElementContents(this)
			});
			$("#an-"+an_id).on("blur", function(){

				if ($(this).text()==" "||!$(this).text()) {
					$(this).remove()
				};
			});

		})
	} 
}

// HELPER FUNCTIONS
function selectElementContents(el) {
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
}

// DOM
var hlDOM = ['<div id="hl-','" class="highlight"><div class="hl_content"><span>','</span></div><div class="hl_tags">','</div></div>']
var tagDOM = ['<span id="an-','" contentEditable="plaintext-only">','</span>']
var newTagDOM = '<span class="addtag" contentEditable="plaintext-only">Add Tags & Annotaions</span>'
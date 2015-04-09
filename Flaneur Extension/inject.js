var selection = window.getSelection();
var selectedText = selection.toString();

console.log(selection)

var inner = selection.anchorNode.parentElement.innerHTML

if(selection.anchorOffset<selection.focusOffset){
	var selectionBegin = selection.anchorOffset
	var selectionEnd = selection.focusOffset
} else {
	var selectionBegin = selection.focusOffset
	var selectionEnd = selection.anchorOffset
}

if(!previousSibling){
	selection.anchorNode.parentElement.innerHTML=inner.slice(0,selectionBegin)+"<span class='flaneurio_highlight'>"+inner.slice(selectionBegin,selectionEnd)+"</span>"+inner.slice(selectionEnd)
} else {
	
}


selectedText
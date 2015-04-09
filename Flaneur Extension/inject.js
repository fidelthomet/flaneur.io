var selection = window.getSelection();
var selectedText = selection.toString();

if (selection.anchorNode.parentElement==selection.focusNode.parentElement){

	var inner = selection.anchorNode.parentElement.innerHTML

	if(selection.anchorOffset<selection.focusOffset){
		var selectionBegin = selection.anchorOffset
		var selectionEnd = selection.focusOffset
	} else {
		var selectionBegin = selection.focusOffset
		var selectionEnd = selection.anchorOffset
	}

	selection.anchorNode.parentElement.innerHTML=inner.split(selectedText)[0]+"<span class='flaneurio_highlight'>"+selectedText+"</span>"+inner.split(selectedText)[1]
} else {
	// TO BE HANDLED SOMEHOW
}




selectedText
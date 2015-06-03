function debug(msg) {
	console.debug(msg)
}

function getLocalStorage(value) {
	return parseInt(localStorage.getItem(value))
}

function compare(a, b) {
	if (a.linkStrength > b.linkStrength)
		return -1;
	if (a.linkStrength < b.linkStrength)
		return 1;
	return 0;
}

function transform(el, values) {
	// console.log(values.y)
	matrix = $(el).css("transform").split(/, |\(|\)/)

	if (matrix.length < 7) {
		matrix = ["matrix", 1, 0, 0, 1, 0, 0, ""]
	};
	if (values.scale != undefined) {
		matrix[1] = matrix[4] = values.scale
	}
	if (values.x != undefined) {
		matrix[5] = values.x
	}
	if (values.y != undefined) {
		matrix[6] = values.y
	}

	$(el).css("transform", "matrix("+matrix[1]+", "+matrix[2]+", "+matrix[3]+", "+matrix[4]+", "+matrix[5]+", "+matrix[6]+")")
}

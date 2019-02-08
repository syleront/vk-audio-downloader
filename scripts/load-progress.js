module.exports = (totalSize, currentSize, length) => {
	if (!length) length = 100;
	let d = (currentSize / totalSize * 100).toFixed(2);
	if (d > 100) d = 100;
	let diff = Math.floor(100 - d);
	let sCount = Math.floor(d * length / 100);
	let string = "[" + (diff < 100 ? "=".repeat(sCount) : "") + (diff ? " ".repeat(length - sCount) : "") + "]";
	string = insertTextToCenter(string, d.toString() + "%");
	return string;
};

function insertTextToCenter(o, t) {
	if (typeof t == "string" || typeof t == "number") {
		t = t.toString();
		o = o.split("");
		for (var i = 0; i < t.length; i++) {
			o[Math.floor(i + o.length / 2 - t.length / 2)] = t[i];
		}
		return o.join("");
	} else {
		throw "text must be a string or number";
	}
}
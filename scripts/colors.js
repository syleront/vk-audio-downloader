module.exports = {
	init: () => {
		String.prototype.color = (color) => {
			let colors = {
				green: "\x1b[32m",
				red: "\x1b[31m",
				yellow: "\x1b[33m",
				blue: "\x1b[34m",
				magenta: "\x1b[35m",
				cyan: "\x1b[36m",
				white: "\x1b[37m",
				Sgreen: "\x1b[92m",
				Sred: "\x1b[91m",
				Syellow: "\x1b[93m",
				Sblue: "\x1b[94m",
				Smagenta: "\x1b[95m",
				Scyan: "\x1b[96m",
				Swhite: "\x1b[97m"
			};
			return colors[color] ? colors[color] + this + "\x1b[0m" : this.toString();
		};
		return true;
	}
};
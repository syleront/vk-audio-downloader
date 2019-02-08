process.env.FFMPEG_PATH = __dirname + "\\bin\\ffmpeg\\ffmpeg.exe";

const pkg = require("./package.json");

const readline = require("readline");
const http = require("http");
const https = require("https");
const mkdirp = require("mkdirp");
const fs = require("fs");
const ffmetadata = require("ffmetadata");

const vk = require("./scripts/vk-web-api");
const progress = require("./scripts/load-progress");
const colors = require("./scripts/colors");
const CFG = require("./config.json");

const sym = /\\|\/|\*|\?|:|"|<|>|\||[\s.]+$|^[\s]+/g;

colors.init();

CFG.default_title = "Audio downloader for VK by Syleront" + " " + pkg.version;
process.title = CFG.default_title;

let TempData = {};
let cookies = tryRequireCookies();

if (!cookies) {
	auth(CFG.login, CFG.password);
} else {
	vk.load(cookies).then(mainDownloadHandler).catch(() => {
		auth(CFG.login, CFG.password);
	});
}

function auth(login, password) {
	vk.auth(login, password).then(mainDownloadHandler).catch((e) => {
		if (e.code == 1) {
			(function c() {
				const rl = readline.createInterface({
					input: process.stdin,
					output: process.stdout
				});
				rl.question("Write 2fa code: ", (answer) => {
					e.check(answer).then((API) => {
						rl.close();
						fs.writeFile("./bin/cookies.json", JSON.stringify(API.cookies), () => {
							mainDownloadHandler(API);
						});
					}).catch(c);
				});
			})();
		} else {
			console.log(e);
		}
	});
}

function mainDownloadHandler(API) {
	let counters = [0, 0, 0, 0];
	let errors = [];
	new Promise((resolve) => {
		console.log("Listing audios...");
		let container = [];
		API.audioUtils.getFullPlaylist().then((r) => {
			r.forEach((x) => {
				container.push([
					x.url,
					decodeHtmlEntity(x.artist).replace(sym, ""),
					decodeHtmlEntity(x.title).replace(sym, ""),
					x
				]);
			});
			console.log("Audios listed".color("green"));
			resolve(container);
		});
	}).then((container) => {
		mkdirp(CFG.download_path, (err) => {
			if (err) throw err;
			mkdirp(CFG.download_path + "/!Covers", (err) => {
				if (err) throw err;
				fs.readdir(CFG.download_path, (err, directory) => {
					if (err) throw err;
					counters[4] = container.length;
					container = container.filter((e) => !directory.includes(e[1] + " - " + e[2] + ".mp3"));
					counters[2] = counters[4] - container.length;
					console.log("-> ".color("green") + (counters[4] - counters[2]) + " audio not downloaded audio detected, starting download");
					(async function download() {
						if (container.length) {
							let track = container.pop();
							let url = track[0];
							if (!url) {
								try {
									let audio = await API.audioUtils.getAudioById(track[3]);
									url = audio[0].url;
								} catch (e) {
									url = null;
								}
							}
							let artist = track[1];
							let name = track[2];
							process.title = CFG.default_title + " | " + (container.length + 1) + " audios left";
							write(artist + " - " + name + " ...");
							TempData.current_track = artist + " - " + name;
							try {
								let path = CFG.download_path + "/" + artist + " - " + name + ".mp3";
								downToFile(url, path, true).then(() => {
									lastfm(artist, name).then((res) => {
										let data = {
											artist: artist,
											title: name
										};
										let options = {
											"id3v2.3": true
										};
										if (res.toptags && res.toptags.tag[0]) data.genre = res.toptags.tag[0].name.ucFirst();
										if (res.album) {
											if (res.album["@attr"] && res.album["@attr"].position) data.track = res.album["@attr"].position;
											if (res.album.image) options.cover = res.album.image[res.album.image.length - 1]["#text"];
										}
										if (options.cover) {
											let path = CFG.download_path + "/!covers/" + artist + " - " + name + ".png";
											downToFile(options.cover, path).then(() => {
												options.attachments = new Array(CFG.download_path + "/!covers/" + artist + " - " + name + ".png");
												ffmetadata.write(CFG.download_path + "/" + artist + " - " + name + ".mp3", data, options, (err) => {
													if (err) console.error("Error writing metadata", err);
													write(artist + " - " + name + " downloaded!".color("green"), true);
													counters[0]++;
													download();
												});
											}).catch((e) => {
												console.log("request error (cover):", e);
												counters[1]++;
												download();
											});
										} else {
											ffmetadata.write(CFG.download_path + "/" + artist + " - " + name + ".mp3", data, options, (err) => {
												if (err) console.error("Error writing metadata", err);
												write(artist + " - " + name + " downloaded!".color("green"), true);
												counters[0]++;
												download();
											});
										}
									}).catch(console.log);
								}).catch((e) => {
									write(artist + " - " + name + " dowload failed!".color("red"), true);
									errors.push([artist, name, (url == "" ? "-> Error: Track is blocked from VK" : e)]);
									counters[1]++;
									download();
								});
							} catch (e) {
								write(artist + " - " + name + " dowload failed!".color("red"), true);
								counters[1]++;
								errors.push([artist, name, e]);
								download();
							}
						} else {
							process.title = CFG.default_title + " | Download finished!";
							console.log("Download complete!");
							console.log("Downloaded: ".color("green") + counters[0], "Failed: ".color("red") + counters[1], "Already downloaded: ".color("green") + counters[2]);
							if (errors.length) {
								console.log("---------");
								console.log("Failed".color("red") + " tracks list:");
								console.log(errors.map((e) => "-> " + e[0] + " - " + e[1]).join("\n"));
								fs.writeFile("./Audio_download_errors.log", errors.map((e) => "Track name: " + e[0] + " - " + e[1] + "\n" + JSON.stringify(e[2], 2, " ")).join("\n\n"), () => {
									console.log("-- To detailed information view Audio_download_errors.log --".color("yellow"));
								});
							}
						}
					})();
				});
			});
		});
	}).catch(console.log);
}

String.prototype.ucFirst = function () {
	return this[0].toUpperCase() + this.substr(1);
};

function decodeHtmlEntity(str) {
	return str.replace(/&#(\d+);/g, function (match, dec) {
		return String.fromCharCode(dec);
	});
}

function write(text, bool) {
	process.stdout.clearLine();
	process.stdout.cursorTo(0);
	process.stdout.write(text);
	if (bool) console.log();
}

function lastfm(artist, track) {
	return new Promise((resolve) => {
		http.get("http://ws.audioscrobbler.com/2.0/?method=track.getInfo&autocorrect=1&api_key=34ad3ab677f85f43a2e757786a3239ab&track=" + encodeURIComponent(track) + "&artist=" + encodeURIComponent(artist) + "&format=json", (res) => {
			let bufs = [];
			res.on("data", (d) => bufs.push(d));
			res.on("end", () => {
				let b = JSON.parse(Buffer.concat(bufs));
				resolve(b.track || b);
			});
		});
	});
}

function downToFile(link, path, show_percents) {
	return new Promise((resolve, reject) => {
		if (typeof link == "string" && /^http/i.test(link)) {
			(/^https/i.test(link) ? https : http).get(link, (readStream) => {
				if (readStream.statusCode !== 404) {
					let td_path = path + ".td";
					let writeStream = fs.createWriteStream(td_path);
					readStream.pipe(writeStream);
					if (show_percents) {
						let length = readStream.headers["content-length"];
						let downloaded_bytes = 0;
						readStream.on("data", (d) => {
							downloaded_bytes += d.length;
							write((TempData.current_track.length > 60 ? TempData.current_track.substr(0, 60) + "..." : TempData.current_track.substr(0, 60)) + " -> " + progress(length, downloaded_bytes, 30));
						});
					}
					writeStream.on("finish", () => {
						fs.rename(td_path, path, (err) => {
							if (err) throw err;
							resolve(true);
						});
					});
				} else {
					reject({
						error: "error code: " + readStream.statusCode
					});
				}
			});
		} else {
			reject({
				error: "Url is broken or empty",
				url: link
			});
		}
	});
}

function tryRequireCookies() {
	try {
		return require("./bin/cookies.json");
	} catch (e) {
		return null;
	}
}
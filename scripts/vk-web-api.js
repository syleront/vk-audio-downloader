const needle = require("needle"),
  audioUnmaskSource = require("./audio-unmask-source.js"),
  Prototypes = require("./prototypes.js");

Prototypes.init();

let options = {
  multipart: true,
  user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:62.0) Gecko/20100101 Firefox/62.0"
};

let VK = {
  auth: (email, password) => {
    return new Promise((resolve, reject) => {
      needle.get("https://vk.com/login", (e, r, b) => {
        if (e) return reject(e);
        let ip_h = b.match(/name="ip_h" value="([A-z0-9]+)"/i);
        let lg_h = b.match(/name="lg_h" value="([A-z0-9]+)"/i);
        if (!ip_h || !lg_h) return reject("ip_h or lg_h is not finded at this page");
        options.cookies = r.cookies;
        needle.post("https://login.vk.com/?act=login", {
          _origin: "https://vk.com",
          act: "login",
          email: email,
          pass: password,
          role: "al_frame",
          ip_h: ip_h[1],
          lg_h: lg_h[1],
        }, options, (e, r) => {
          if (e) return reject(e);
          options.cookies = Object.assign(options.cookies, r.cookies);
          needle.get(r.headers.location, options, (e, r, b) => {
            if (e) return reject(e);
            options.cookies = Object.assign(options.cookies, r.cookies);
            if (/act=authcheck/i.test(b)) {
              needle.get("https://vk.com/login?act=authcheck", options, (e, r, b) => {
                if (e) return reject(e);
                options.cookies = Object.assign(options.cookies, r.cookies);
                let hash = b.match(/hash: '([0-9A-z]+_[0-9A-z]+)'/)[1];
                reject({
                  code: 1,
                  check: (code) => {
                    return VK.auth_check(code, hash);
                  },
                  sendSms: () => {
                    return new Promise((resolve, reject) => {
                      needle.post("https://vk.com/al_login.php", {
                        act: "a_authcheck_sms",
                        al: 1,
                        hash
                      }, options, (e, r, b) => {
                        if (e) reject(e);
                        else resolve(b);
                      });
                    });
                  }
                });
              });
            } else {
              resolve(VK.load(options.cookies));
            }
          });
        });
      });
    });
  },
  auth_check: (code, hash) => {
    return new Promise((resolve, reject) => {
      delete options.cookies.remixtst;
      needle.post("https://vk.com/al_login.php", {
        act: "a_authcheck_code",
        al: 1,
        code,
        hash,
        remember: 1
      }, options, (e, r, b) => {
        if (e) return reject(e);
        options.cookies = Object.assign(options.cookies, r.cookies);
        let url = b.match(/<!>\/(.+?)</);
        if (!url) {
          reject({
            code: 2,
            text: b
          });
        } else {
          needle.get("https://vk.com/" + url[1], options, (e, r) => {
            if (e) return reject(e);
            options.cookies = Object.assign(options.cookies, r.cookies);
            resolve(VK.load(options.cookies));
          });
        }
      });
    });
  },
  load: (cookies) => {
    return new Promise((resolve, reject) => {
      options.cookies = cookies;
      needle.get("https://vk.com/dev/execute", options, (e, r, b) => {
        if (e) return reject(e);
        let hash = b.match(/Dev\.methodRun\('([A-z0-9:]+)/i);
        if (!hash) return reject({ code: 3, error: "incorect login or password" });
        VK.api = new Proxy({}, {
          get: (t1, method) => {
            return new Proxy(t1, {
              get: (t2, subMethod) => (params) => {
                return new Promise((resolve) => {
                  if (!params) params = {};
                  needle.post("https://vk.com/dev", {
                    param_code: `return API.${method}.${subMethod}(${JSON.stringify(params)});`,
                    act: "a_run_method",
                    al: 1,
                    method: "execute",
                    param_v: "5.80",
                    hash: hash[1],
                  }, options, (e, r, b) => {
                    let res = JSON.parse(b.match(/{.*/)[0]);
                    resolve(res.response || res);
                  });
                });
              }
            });
          }
        });
        VK.api.users.get().then((r) => {
          if (!r) return VK.load(cookies);
          VK.user_id = r[0].id;
          VK.cookies = options.cookies;
          VK.audioUtils.getExportsHash().then((hash) => {
            VK.exports_hash = hash;
            resolve(VK);
          });
        });
      });
    });
  },
  audioUtils: {
    search: (obj) => {
      return new Promise((resolve, reject) => {
        needle.post("https://vk.com/al_audio.php", {
          act: "load_section",
          al: 1,
          claim: 0,
          count: 100,
          offset: obj.offset || 0,
          type: "search",
          owner_id: VK.user_id,
          search_q: obj.q || obj.query,
          search_history: 0,
          track_type: "default"
        }, {
            multipart: true,
            cookies: VK.cookies
          }, (e, r, b) => {
            if (e) return reject(e);
            let json = JSON.parse(b.match(/<!json>(.+?)<!>/i)[1]);
            let list = audioListToObj(json.list);
            resolve(list);
          });
      });
    },
    getRecomsBlocks: (obj) => {
      return new Promise((resolve, reject) => {
        needle.post("https://vk.com/al_audio.php", {
          act: "recoms_blocks",
          al: 1,
          offset: obj.offset || 0,
        }, {
            multipart: true,
            cookies: VK.cookies
          }, (e, r, b) => {
            if (e) return reject(e);
            let json = JSON.parse(b.match(/<!json>(.+?)<!>/i)[1]);
            let sections = json.join("").match(/<a(.+?)href="\/audios[0-9]+\?section=recoms_block(.+?)>/g);
            if (sections) {
              let blocks = sections.map((e) => e.match(/section=recoms_block&type=[A-z0-9]+/ig).map((e) => e.replace("section=recoms_block&type=", ""))[0]);
              let load = blocks.map((e) => {
                return VK.audioUtils.loadBlockById({
                  id: e
                });
              });
              Promise.all(load).then((lists) => {
                let blocks = lists.remap("name");
                resolve(blocks);
              }).catch(reject);
            } else {
              reject({
                error: "result is null"
              });
            }
          });
      });
    },
    getAllSearchBlocks: (obj) => {
      return new Promise((resolve, reject) => {
        needle.post("https://vk.com/al_audio.php", {
          act: "section",
          al: 1,
          is_layer: 0,
          owner_id: VK.user_id,
          q: obj.q,
          offset: obj.offset || 0,
          section: "search",
        }, {
            multipart: true,
            cookies: VK.cookies
          }, (e, r, b) => {
            if (e) return reject(e);
            let albums = b.match(/<a(.+?)href="\/audios[0-9]+\?section=search_block(.+?)>/gm);
            if (albums) {
              let blocks = albums.map((e) => e.match(/section=search_block&type=[A-z0-9]+/ig).map((e) => e.replace("section=search_block&type=", ""))[0]);
              let load = blocks.map((e) => {
                return VK.audioUtils.loadBlockById({
                  id: e
                });
              });
              Promise.all(load).then((lists) => {
                var blocks = lists.remap("name");
                resolve(blocks);
              }).catch(reject);
            } else {
              reject({
                error: "search result is null"
              });
            }
          });
      });
    },
    loadBlockById: (obj) => {
      return new Promise((resolve, reject) => {
        needle.post("https://vk.com/al_audio.php", {
          act: "load_playlists_block",
          al: 1,
          block_id: obj.id,
          render_html: 1
        }, {
            multipart: true,
            cookies: VK.cookies
          }, (e, r, b) => {
            if (e) return reject(e);
            let match = b.match(/audio\?z=audio_playlist(.+?)"/g);
            if (!match) {
              reject({
                error: "Page isn't loaded"
              });
            } else {
              let json = JSON.parse(b.match(/<!json>(.+?)<!>/i)[1]);
              if (json.type == "playlists") {
                let hashes = b.match(/AudioUtils\.showAudioPlaylist\((.+?)\)/g).unique().map((e) => e.match(/'(.*?)'/)[1]);
                json.items = Object.entries(json.items).map((e, i) => {
                  e[1].playlist_id = e[0];
                  e[1].access_hash = hashes[i];
                  return e[1];
                });
                json.items.forEach((e) => {
                  if (e.photo) {
                    let p = e.photo.angles[0].m;
                    e.photo.url = `https://pp.userapi.com/c${p.server}/v${p.volume_id}/${p.volume_local_id}/${p.secret}.jpg`;
                  }
                });
              }
              resolve(json);
            }
          });
      });
    },
    getWallAudioFromPostId: (obj) => {
      return new Promise((resolve, reject) => {
        needle.post("https://vk.com/al_audio.php", {
          access_hash: "",
          act: "load_section",
          al: 1,
          claim: 0,
          offset: obj.offset || 1,
          owner_id: obj.owner_id,
          //playlist_id: 3424665,
          post_id: obj.post_id || "",
          track_type: "default",
          type: "wall",
          wall_query: "",
          wall_type: "own"
        }, {
            multipart: true,
            cookies: VK.cookies
          }, (e, r, b) => {
            if (e) return reject(e);
            let json = JSON.parse(b.match(/<!json>(.+?)<!>/i)[1]);
            if (json.list) {
              resolve(audioListToObj(json.list));
            } else {
              reject(json);
            }
          });
      });
    },
    getWallAudioFromWall: (obj) => {
      return new Promise((resolve, reject) => {
        needle.post("https://vk.com/al_wall.php", {
          act: "get_wall",
          al: 1,
          offset: obj.offset || 0,
          owner_id: obj.owner_id,
          onlyCache: false,
          type: "own",
          wall_start_from: obj.offset ? obj.offset + 1 : 1
        }, {
            multipart: true,
            cookies: VK.cookies
          }, (e, r, b) => {
            if (e) return reject(e);
            let match = b.match(/data-audio="(.+?)"/g);
            let posts = b.match(/data-post-id="(.+?)"/g);
            if (match) {
              let audios = match.map((e) => replaceHtmlUnicode(e.match(/"(.+?)"/i)[1])).map(JSON.parse);
              resolve(audioListToObj(audios));
            } else if (!posts) {
              reject("end of group posts");
            } else {
              resolve([]);
            }
          });
      });
    },
    getPlaylist: (obj, saveOriginalResponse) => {
      return new Promise((resolve, reject) => {
        needle.post("https://vk.com/al_audio.php", {
          access_hash: obj.access_hash || "",
          act: "load_section",
          al: 1,
          claim: 0,
          count: 100,
          offset: obj.offset || 0,
          type: "playlist",
          owner_id: obj.owner_id || VK.user_id,
          playlist_id: obj.playlist_id || -1
        }, {
            multipart: true,
            cookies: VK.cookies
          }, (e, r, b) => {
            if (e) return reject(e);
            let json = JSON.parse(b.match(/<!json>(.+?)<!>/i)[1]);
            if (json.list) {
              let list = audioListToObj(json.list);
              if (saveOriginalResponse) {
                resolve([json, list]);
              } else {
                resolve(list);
              }
            } else {
              reject({
                error: "playlist is not available"
              });
            }
          });
      });
    },
    getFullPlaylist: (obj, saveOriginalResponse) => {
      return new Promise((resolve) => {
        let container = [];
        (function get(offset) {
          VK.audioUtils.getPlaylist(Object.assign(obj || {}, { offset }), true).then((r) => {
            container = container.concat(r[1]);
            if (r[0].nextOffset < r[0].totalCount) {
              get(r[0].nextOffset);
            } else {
              if (saveOriginalResponse) {
                resolve([r, container]);
              } else {
                resolve(container);
              }
            }
          });
        })();
      });
    },
    getUserPlaylists: (obj) => {
      if (!obj) obj = {};
      return new Promise((resolve, reject) => {
        needle.post("https://vk.com/al_audio.php", {
          act: "section",
          al: 1,
          is_layer: 0,
          section: "playlists",
          owner_id: obj.owner_id || VK.user_id
        }, {
            multipart: true,
            cookies: VK.cookies
          }, (e, r, b) => {
            if (e) return reject(e);
            let elems = b.match(/<a\shref="\/audio.+?>/g);
            let titles = b.match(/<a\sclass="audio_item__title".+?>(.+?)</g);
            let playlists = [];
            if (elems) {
              elems.forEach((e, i) => {
                let params = parseNodeParams(e);
                let ids = params.href.match(/audio_playlist([-_0-9]+)/i)[1].split("_");
                let access_hash = params.href.match(/\/([A-z0-9]+)$/i);
                let picture = params.style.match(/http(?:s):\/\/.+?.jpg/i);
                let title = titles[i].match(/>(.+?)</i)[1];
                playlists.push({
                  owner_id: ids[0],
                  playlist_id: ids[1],
                  picture: picture ? picture[0] : null,
                  title: title,
                  access_hash: access_hash ? access_hash[1] : null
                });
              });
              resolve(playlists);
            } else {
              resolve(null);
            }
          });
      });
    },
    getAudioById: (obj) => {
      return new Promise((resolve, reject) => {
        let hash = obj.hashes[2] + "_" + obj.hashes[5];
        needle.post("https://vk.com/al_audio.php", {
          act: "reload_audio",
          al: 1,
          ids: `${obj.owner_id}_${obj.id}_${hash}`
        }, {
            multipart: true,
            cookies: VK.cookies
          }, (e, r, b) => {
            if (e) return reject(e);
            let match = b.match(/<!json>(.+?)<!>/i);
            if (match) {
              let json = JSON.parse(match[1]);
              resolve(audioListToObj(json));
            } else {
              reject(null);
            }
          });
      });
    },
    getRecomendations: (obj) => {
      if (!obj) obj = {};
      return new Promise((resolve, reject) => {
        needle.post("https://vk.com/al_audio.php", {
          act: "load_section",
          owner_id: VK.user_id,
          claim: 0,
          type: "recoms",
          offset: obj.offset || 0,
          al: 1
        }, {
            multipart: true,
            cookies: VK.cookies
          }, (e, r, b) => {
            if (e) return reject(e);
            let json = JSON.parse(b.match(/<!json>(.+?)<!>/i)[1]);
            json.list = audioListToObj(json.list);
            resolve(json);
          });
      });
    },
    getAllRecomendations: () => {
      return new Promise((resolve) => {
        let list = [];
        (function get(offset) {
          VK.audioUtils.getRecomendations({ offset }).then((res) => {
            list = list.concat(res.list);
            if (res.list.length) {
              get(res.nextOffset);
            } else {
              resolve(list);
            }
          });
        })(0);
      });
    },
    addAudio: (obj) => {
      if (!obj) obj = {};
      return new Promise((resolve, reject) => {
        needle.post("https://vk.com/al_audio.php", {
          al: 1,
          act: "add",
          audio_id: obj.id,
          audio_owner_id: obj.owner_id,
          group_id: 0,
          hash: obj.hashes[0]
        }, {
            multipart: true,
            cookies: VK.cookies
          }, (e, r, b) => {
            if (e) return reject(e);
            let match = b.match(/<!json>(.+?)$/i);
            if (match) {
              let json = JSON.parse(b.match(/<!json>(.+?)$/i)[1]);
              resolve(audioListToObj([json]));
            } else {
              reject({
                error: "json is undefined"
              });
            }
          });
      });
    },
    deleteAudio: (obj) => {
      if (!obj) obj = {};
      return new Promise((resolve, reject) => {
        needle.post("https://vk.com/al_audio.php", {
          al: 1,
          act: "delete_audio",
          aid: obj.id,
          oid: obj.owner_id,
          hash: obj.hashes[3],
          restore: 1
        }, {
            multipart: true,
            cookies: VK.cookies
          }, (e, r, b) => {
            if (e) return reject(e);
            resolve(b);
          });
      });
    },
    restoreAudio: (obj) => {
      if (!obj) obj = {};
      return new Promise((resolve, reject) => {
        needle.post("https://vk.com/al_audio.php", {
          al: 1,
          act: "restore_audio",
          aid: obj.id,
          oid: obj.owner_id,
          hash: obj.hashes[1]
        }, {
            multipart: true,
            cookies: VK.cookies
          }, (e, r, b) => {
            if (e) return reject(e);
            resolve(b);
          });
      });
    },
    getAudioCover: (obj) => {
      return new Promise((resolve) => {
        Promise.resolve().then(() => {
          if (obj.playlist_info) {
            return obj;
          } else {
            return VK.audioUtils.getAudioById(obj);
          }
        }).then((r) => {
          VK.audioUtils.getPlaylist({
            owner_id: r.playlist_info.owner_id,
            playlist_id: r.playlist_info.id,
            access_hash: r.playlist_info.access_hash
          }, true).then((c) => {
            resolve(c.coverUrl || null);
          });
        });
      });
    },
    setStatus: (obj, off) => {
      if (!obj) obj = {};
      return new Promise((resolve, reject) => {
        needle.post("https://vk.com/al_audio.php", {
          al: 1,
          exp: off ? 0 : 1,
          act: "toggle_status",
          hash: VK.exports_hash,
          oid: off ? 0 : VK.user_id,
          id: obj.audio || "",
          top: 0
        }, {
            multipart: true,
            cookies: VK.cookies
          }, (e, r, b) => {
            if (e) return reject(e);
            resolve(b);
          });
      });
    },
    getExportsHash: () => {
      return new Promise((resolve, reject) => {
        needle.get("https://vk.com/al_audio.php", {
          multipart: true,
          cookies: VK.cookies
        }, (e, r, b) => {
          if (e) return reject(e);
          let matched = b.match(/statusExportHash:\s'(.+?)'/);
          if (matched) {
            resolve(b.match(/statusExportHash:\s'(.+?)'/)[1]);
          } else {
            resolve(null);
          }
        });
      });
    }
  }
};

function replaceHtmlUnicode(string) {
  return string.replace(/<br>/g, "\n")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
}

function audioListToObj(list) {
  return list.map((e) => {
    return {
      id: e[0],
      owner_id: e[1],
      title: replaceHtmlUnicode(e[3]),
      artist: replaceHtmlUnicode(e[4]),
      duration: e[5],
      hashes: e[13].split("/"),
      picture: e[14] !== "" ? e[14].split(",") : null,
      url: e[2] !== "" ? audioUnmaskSource(e[2], VK.user_id) : null,
      attachment_id: `${e[1]}_${e[0]}`,
      playlist_info: {
        owner_id: e[19][0] || null,
        id: e[19][1] || null,
        access_hash: e[19][2] || null
      }
    };
  });
}

function parseNodeParams(string) {
  let params = string.match(/[A-z]+=(?:""|".+?")/g);
  let obj = {};
  params.forEach((e) => {
    let p = e.split("=\"");
    obj[p[0]] = p[1].replace(/"$/, "");
  });
  return obj;
}

module.exports = VK;
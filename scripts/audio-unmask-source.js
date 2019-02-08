var audioUnmaskSource = function (url, user_id) {
  if (!url || !user_id) throw "once of arguments is missed";
  var vk = {
    id: user_id
  };
  var n = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0PQRSTUVWXYZO123456789+/=",
    i = {
      v: function (e) {
        return e.split("").reverse().join("");
      },
      r: function (e, t) {
        e = e.split("");
        for (var i, o = n + n, s = e.length; s--;) i = o.indexOf(e[s]), ~i && (e[s] = o.substr(i - t, 1));
        return e.join("");
      },
      s: function (e, t) {
        var n = e.length;
        if (n) {
          var i = r(e, t),
            o = 0;
          for (e = e.split(""); ++o < n;) e[o] = e.splice(i[n - 1 - o], 1, e[o])[0];
          e = e.join("");
        }
        return e;
      },
      i: function (e, t) {
        return i.s(e, t ^ vk.id);
      },
      x: function (e, t) {
        var n = [];
        return t = t.charCodeAt(0), each(e.split(""), function (e, i) {
          n.push(String.fromCharCode(i.charCodeAt(0) ^ t));
        }), n.join("");
      }
    };

  function o() {
    return false;
  }

  function s(e) {
    if (!o() && ~e.indexOf("audio_api_unavailable")) {
      var t = e.split("?extra=")[1].split("#"),
        n = "" === t[1] ? "" : a(t[1]);
      if (t = a(t[0]), "string" != typeof n || !t) return e;
      n = n ? n.split(String.fromCharCode(9)) : [];
      for (var s, r, l = n.length; l--;) {
        if (r = n[l].split(String.fromCharCode(11)), s = r.splice(0, 1, t)[0], !i[s]) return e;
        t = i[s].apply(null, r);
      }
      if (t && "http" === t.substr(0, 4)) return t;
    }
    return e;
  }

  function a(e) {
    if (!e || e.length % 4 == 1) return !1;
    for (var t, i, o = 0, s = 0, a = ""; i = e.charAt(s++);) i = n.indexOf(i), ~i && (t = o % 4 ? 64 * t + i : i, o++ % 4) && (a += String.fromCharCode(255 & t >> (-2 * o & 6)));
    return a;
  }

  function r(e, t) {
    var n = e.length,
      i = [];
    if (n) {
      var o = n;
      for (t = Math.abs(t); o--;) t = (n * (o + 1) ^ t + o) % n, i[o] = t;
    }
    return i;
  }

  return s(url);
};

module.exports = audioUnmaskSource;
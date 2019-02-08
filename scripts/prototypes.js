module.exports = {
  init: () => {
    Array.prototype.remap = function(str) {
      var obj = {};
      this.forEach((e) => obj[e[str]] = e);
      return obj;
    };

    Array.prototype.random = function(count) {
      if (count) {
        return new Array(count).fill(1).map(() => this[Math.floor(this.length * Math.random())]);
      } else {
        return this[Math.floor(this.length * Math.random())];
      }
    };

    Array.prototype.unique = function() {
      return this.filter((e, i, array) => array.indexOf(e) === i);
    };

    Array.prototype.removeDuplicates = function(prop) {
      return this.filter((obj, pos, arr) => {
        return arr.map((mapObj) => mapObj[prop]).indexOf(obj[prop]) === pos;
      });
    };

    Array.prototype.last = function() {
      return this[this.length - 1];
    };

    Array.prototype.shuffle = function() {
      return this.sort(() => Math.random() - 0.5);
    };

    Array.prototype.del = function(del, all) {
      if (all) {
        return this.filter((a) => a !== del);
      } else {
        if (typeof del == "object") {
          return this.filter((e) => !del.includes(e));
        } else if (this.indexOf(del) !== -1) {
          return this.slice(this.indexOf(del), 1);
        } else {
          return "Object without array";
        }
      }
    };

    Array.prototype.replace = function(regexp, to) {
      return this.map((a) => {
        if (a.toString().match(regexp)) {
          return a.toString().replace(regexp, to);
        } else {
          return a;
        }
      });
    };

    String.prototype.ucFirst = function() {
      return this.charAt(0).toUpperCase() + this.substr(1);
    };

    String.prototype.stroke = function(num, param) {
      let sym_array = this.split(" ");
      let buf_array = [];
      let stringbuff = "";
      let i = 0;
      let length = 0;
      sym_array.map((a) => {
        if (i < num) {
          stringbuff += a + " ";
          i += a.length + 1;
        } else {
          if (length < stringbuff.length) length = stringbuff.length;
          buf_array.push(stringbuff);
          stringbuff = a + " ";
          i = a.length;
        }
      });
      buf_array.push(stringbuff);
      return param ? [buf_array.replace(/\s$/, ""), length || i] : buf_array.replace(/\s$/, "");
    };

    String.prototype.scream = function() {
      let chars = ["а", "я", "о", "ё", "у", "ю", "ы", "и", "э", "е", "a", "e", "u", "o"];
      let array = [];
      this.split("").map((a) => {
        let b = (chars.indexOf(a.toLowerCase()) > -1 ? a.repeat(getRandomInt(2, 20)) : a);
        array.push(b);
      });
      return array.join("");
    };

    String.prototype.bs = function(mode) {
      switch (mode) {
        case "1":
          return this.split("").join("&#1161;") + "&#1161;";
          break;
        case "2":
          let symboles = {
            "A": ["Ą", "Ã", "Á", "Ẵ", "Â", "Ặ", "Â", "Ā", "Ắ", "Ă", "Ằ", "Ä", "À", "Ά", "Ǻ", "Α", "Å", "А", "Ά", "Ẫ", "Ä", "Λ", "λ", "Ǽ", "Æ", "Δ", "Æ"],
            "B": ["δ", "lЗ", "Ь", "β", "Ъ", "В", "ß", "฿"],
            "C": ["Ç", "Ĉ", "Ḉ", "€", "Ć", "С", "©", "Č"],
            "D": ["Đ", "Ď", "D", "ð"],
            "E": ["ξ", "Ē", "∑", "É", "Ę", "£", "Ḝ", "Σ", "Έ", "É", "∑", "З", "Ě", "Ε", "€", "∑", "Є", "Ế", "E", "Ë", "Ē", "Ә", "Е", "عỀ", "Ĕ", "Э", "Ể", "Э", "Ễ", "Є", "ξ", "Ė", "Ê", "€", "Ę", "Ё", "È", "ξ"],
            "F": ["F", "₣", "₣", "ƒ", "ſ", "f", "ƒ"],
            "G": ["Ģ", "G", "Ĝ", "Ğ", "Ġ", "Ģ"],
            "H": ["Н", "Ĥ", "Ħ", "Ή", "Њ", "ŀl", "Ή"],
            "I": ["ĩ", "أ", "ï", "Ị", "î", "Ĭ", "І", "ϊ", "I", "Į", "Ї", "î", "I", "į", "ϊ", "Í", "ΐ", "İ", "Ϊ", "í", "Ĩ", "ί", "Ì", "ĩ", "ι", "ì", "Ī", "Ï", "Î", "ī", "ї", "î", "Ĭ", "Ί", "I", "ĭ"],
            "J": ["Ĵ", "Ĳ", "Ĵ", "J"],
            "K": ["Ķ", "Ќ", "Ҝ", "₭", "Ќ", "Ķ", "К", "K", "Ќ", "К"],
            "L": ["Ĺ", "Ļ", "Ľ", "Ŀ", "Ł", "Ľ", "L", "Ł", "ł", "Ĺ", "ζ", "Ļ"],
            "M": ["m", "₥"],
            "N": ["Ņ", "Ň", "₦", "Ŋ", "Ń", "И", "Ņ", "Ň", "Ñ", "Ŋ", "Й", "N"],
            "O": ["Ø", "Ǿ", "Ō", "Θ", "Θ", "Ό", "Ở", "Ŏ", "Ó", "Ø", "Ờ", "О", "Ǿ", "Ò", "Ớ", "Ő", "Ổ", "Ợ", "Ô", "Ở", "Ọ", "Ö", "Ό", "Ợ", "Ō", "Õ", "θ", "Ο"],
            "P": ["ρ", "Þ", "ῥ", "þ", "Þ", "р", "ρ"],
            "Q": ["Q", "Œ", "Ø", "Ợ"],
            "R": ["Ŗ", "Ř", "Я", "®", "R", "Ŕ", "Ŗ", "Ř"],
            "S": ["Š", "ﮐ", "ş", "ﮚ", "ﻯ", "§", "Š", "§", "S", "Ś", "Š", "Ş", "Ŝ"],
            "T": ["Ŧ", "†", "Ť", "T", "Ţ", "Ť", "Ŧ"],
            "U": ["Û", "Ū", "Џ", "U", "Ụ", "Ủ", "Ứ", "Ừ", "Ử", "Ữ", "Ự", "Ù", "Ú", "Ц", "Ü", "Џ", "U", "Џ", "Ũ", "Ū", "Ŭ", "Ū", "Ų", "Ű", "Ů"],
            //"V":,
            "W": ["Ŵ", "Ẁ", "Ẃ", "Ẅ", "Ẅ", "Ẃ", "Ẁ", "W", "ŵ", "Ŵ"],
            "X": ["χ", "Ҳ", "ҳ", "х", "×"],
            "Y": ["¥", "Ў", "۳", "У", "¥", "¥", "Ỵ", "¥", "Ў", "Ϋ", "Ύ", "Ŷ", "Ÿ", "Ÿ", "Ý", "Ч", "Ύ", "Ỳ", "Ÿ"],
            "Z": ["ź", "Ž", "Ź"],
          };
          let toRu = {
            "А": "A",
            "Б": "B",
            "В": "B",
            "Г": "G",
            "Е": "E",
            "Ё": "E",
            "Ж": "J",
            "З": "Z",
            "И": "N",
            "Й": "N",
            "К": "K",
            "Л": "L",
            "М": "M",
            "Н": "H",
            "У": "Y",
            "Ф": "F",
            "Х": "X",
            "Ц": "U",
            "Ч": "Y",
            "Ш": "W",
            "Щ": "W",
            "Ъ": "B",
            "Ь": "B",
            "Э": "E",
            "Ю": "U",
            "Я": "R"
          };
          return new Array(15).fill(this.toUpperCase().split("")).map((a) => {
            return a.map((a) => {
              if (toRu[a]) a = toRu[a];
              if (symboles[a]) a = symboles[a].random();
              return a;
            }).join("");
          }).join("\n");
          break;
        case "3":
          let symboles_en = ["卂", "石", "乃", "ㄏ", "亼", "仨", "仨", "水", "弓", "认", "认", "长", "人", "从", "廾", "囗", "冂", "卩", "匚", "丅", "丫", "中", "乂", "凵", "丩", "山", "山", "乙", "辷", "乙", "彐", "扣", "牙"];
          let symboles_ru = ["а", "б", "в", "г", "д", "е", "ё", "ж", "з", "и", "й", "к", "л", "м", "н", "о", "п", "р", "с", "т", "у", "ф", "х", "ц", "ч", "ш", "щ", "ъ", "ы", "ь", "э", "ю", "я"];
          let str = this.toLowerCase().split("").map((a) => symboles_ru.indexOf(a) > -1 ? symboles_en[symboles_ru.indexOf(a)] : a);
          return str.join("");
          break;
      }
    };

    Date.prototype.getMonthName = function() {
      let obj = {
        0: "Января",
        1: "Февраля",
        2: "Марта",
        3: "Апреля",
        4: "Мая",
        5: "Июня",
        6: "Июля",
        7: "Августа",
        8: "Сентября",
        9: "Октября",
        10: "Ноября",
        11: "Декабря"
      };
      let month = this.getMonth();
      return obj[month];
    }

    Date.prototype.getWeekNumber = function() {
      let d = new Date(Date.UTC(this.getFullYear(), this.getMonth(), this.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
      let yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      let weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
      return [d.getUTCFullYear(), weekNum];
    }
  }
};

function getRandomInt(min, max) {
  return Math.round(Math.random() * (max - min)) + min;
}
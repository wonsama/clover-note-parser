require("dotenv").config();

const fs = require("fs");

/**
 * Naver Clover 로 기록된 음성 내역을 txt 로 다운 받은 후 작업 수행
 * @param {string} sourcePath 내려받은 txt 파일 경로
 */
function nparser(sourcePath) {
  let file = fs.readFileSync(sourcePath, "utf-8");
  file = file.replace(String.fromCharCode(65279), "");
  let lines = file.split("\n");

  let results = [];
  let item = {};
  for (let line of lines) {
    if (line.indexOf("참석자 ") == 0) {
      if (item.name !== "undefined") {
        // 이전 값이 있으면 push
        results.push(item);
      }
      item = {};

      let header = line.split(" ");
      item["name"] = `${header[0]} ${header[1]}`;
      item["time"] = header[2];
    } else {
      item["text"] = item["text"] ? `${item["text"]}${line}` : line;
    }
  }
  if (item.name !== "undefined") {
    // 이전 값이 있으면 push
    results.push(item);
  }
  results.shift();
  return results;
}

/**
 * 파싱된 내역을 파일로 기록
 * @param {json} parsed JSONObject
 * @param {string} targetPath 저장 위치
 */
function saveJson(parsed, targetPath) {
  fs.writeFileSync(targetPath, JSON.stringify(parsed, null, 2), "utf-8");
}

function wordsObjectReplacer(wordObject) {
  let words = [];
  const EXCEPTS = process.env.EXCEPTS || "";

  for (let key of Object.keys(wordObject)) {
    if (wordObject[key] > 5) {
      let ekey = key.replace(/[0-9]|\./gi, ""); // 숫자, . 제거
      if (ekey.length > 2) {
        if (
          // 2글자 제거
          ["하는", "으로"].includes(
            ekey.substring(ekey.length - 2, ekey.length)
          )
        ) {
          ekey = ekey.substring(0, ekey.length - 2);
        }
        // 1글자 제거
        if ("은는이가에을를".split("").includes(ekey[ekey.length - 1])) {
          ekey = ekey.substring(0, ekey.length - 1);
        }
      }

      if (EXCEPTS.indexOf(ekey) == -1) {
        words.push({ key: ekey, cnt: wordObject[key] });
      }
    }
  }

  words.sort((a, b) => {
    if (b.cnt == a.cnt) {
      return a.key < b.key ? -1 : a.key > b.key ? 1 : 0;
    }
    return b.cnt - a.cnt;
  });

  return words;
}

/**
 * 진입점
 */
function init() {
  const SOURCE_TXT = process.env.SOURCE_TXT || "";
  const OUTPUT_PARSED_JSON = process.env.OUTPUT_PARSED_JSON || "";
  const OUTPUT_WORDS_JSON = process.env.OUTPUT_WORDS_JSON || "";

  let parsed = nparser(SOURCE_TXT);
  let wordObject = {};
  let wordArr = [];

  parsed.forEach((value, index, array) => {
    if (value.text !== "undefined") {
      let words = value.text.split(" ");
      words.forEach((v, i, a) => {
        wordObject[v] = wordObject[v] ? (wordObject[v] = wordObject[v] + 1) : 1;
      });
    }
  });

  let words = wordsObjectReplacer(wordObject);

  saveJson(parsed, OUTPUT_PARSED_JSON);
  saveJson(words, OUTPUT_WORDS_JSON);
}
async function test() {
  const EXCEPTS = process.env.EXCEPTS || "";
  let parsed = EXCEPTS.split(",");
  parsed.sort((a, b) => {
    return a < b ? -1 : a > b ? 1 : 0;
  });

  fs.writeFileSync("./resources/temp.txt", parsed.join(","));
}
init();
// test();

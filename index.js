const fs = require("fs");

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
      item["name"] = `${header[0]} ${header[1]}`; // 참석자 1
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

function toJson(parsed, targetPath) {
  fs.writeFileSync(targetPath, JSON.stringify(parsed, null, 2), "utf-8");
}

function init() {
  let sourcePath = "./resources/note.txt";
  let targetPath = "./resources/note.json";
  let parsed = nparser(sourcePath);

  toJson(parsed, targetPath);
}
init();

#!/usr/bin/env node

const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const { Select } = require("enquirer");
const arg = process.argv.slice(2);
const MEMODB = "memodata.db";
const memosclass = class {
  constructor() {
    const db = new sqlite3.Database(MEMODB);
    this.db = db;
  }
  appendMemos(input) {
    this.db.run("insert into memo(memo) values($memo)", {
      $memo: input,
    });
  }
  readMemos() {
    return new Promise((resolve) => {
      this.db.all("select id,memo from memo", (_err, rows) => {
        resolve(rows);
      });
    });
  }
  readMemo(id) {
    return new Promise((resolve) => {
      this.db.get("select memo from memo where id =" + id, (_err, row) => {
        resolve(row);
      });
    });
  }
  deleteMemo(id) {
    return new Promise(() => {
      this.db.run("delete from memo where id=" + id);
    });
  }
};

const memos = new memosclass();
async function main() {
  if (arg[0] == null) {
    var input = fs.readFileSync("/dev/stdin", "utf8").trim().split("\n");
    await append(input);
  } else {
    const memoLines = await read();
    if (memoLines.length > 0) {
      if (arg[0] === "-l") {
        console.log(memoLines.map((x) => x[1]).join("\n"));
      } else if (arg[0] === "-r") {
        const prompt = await new Select({
          name: "memo",
          message: "choose a note you want to see:",
          choices: memoLines.map((x) => ({ value: x[0], name: x[1] })),
          result(name) {
            return this.map(name);
          },
        });
        prompt
          .run()
          .then(async (value) => {
            const answer = Object.entries(value);
            const id = answer[0][1];
            const memoLine = await getMemo(id);
            console.log(memoLine.join("\n"));
          })
          .catch(console.error);
      } else if (arg[0] === "-d") {
        const prompt = await new Select({
          name: "memo",
          message: "choose a note you want to delete:",
          choices: memoLines.map((x) => ({ value: x[0], name: x[1] })),
          result(name) {
            return this.map(name);
          },
        });
        prompt
          .run()
          .then(async (value) => {
            const answer = Object.entries(value);
            const id = answer[0][1];
            await delMemo(id);
          })
          .catch(console.error);
      }
    }
  }
}

async function append(input) {
  memos.appendMemos(input);
}

async function read() {
  const rows = await memos.readMemos();
  const memoLines = rows.map((x) => `${x.id},${x.memo}`.split(","));
  return memoLines;
}

async function getMemo(id) {
  const row = await memos.readMemo(id);
  const memoLine = row.memo.split(",");
  return memoLine;
}

async function delMemo(id) {
  await memos.deleteMemo(id);
}

function execMain() {
  return new Promise(() => {
    main();
  });
}

(async () => {
  await execMain();
  memos.db.close();
})();

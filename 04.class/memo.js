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
  append(input) {
    return new Promise(() => {
      this.db.run("insert into memo(memo) values($memo)", {
        $memo: input,
      });
    });
  }
  async readAll() {
    const rows_1 = await new Promise((resolve) => {
      this.db.all("select id,memo from memo", (_error, rows) => {
        resolve(rows);
      });
    });
    const memolines = rows_1.map((x) => `${x.id},${x.memo}`.split(","));
    return memolines;
  }
  async read(id) {
    const row_1 = await new Promise((resolve) => {
      const memo = this.db.prepare("select memo from memo where id=?");
      memo.get(id, (_err, row) => {
        resolve(row);
      });
      memo.finalize();
    });
    const memoLine = row_1.memo.split(",");
    return memoLine;
  }
  delete(id) {
    return new Promise(() => {
      const memo = this.db.prepare("delete from memo where id=?");
      memo.run(id);
      memo.finalize();
    });
  }
};

const questionclass = class {
  async read(memoLines) {
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
        const memoLine = await memos.read(id);
        console.log(memoLine.join("\n"));
      })
      .catch(console.error);
  }
  async delete(memoLines) {
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
        await memos.delete(id);
      })
      .catch(console.error);
  }
};

const memos = new memosclass();
async function main() {
  if (arg[0] == null) {
    const input = fs.readFileSync("/dev/stdin", "utf8").trim().split("\n");
    await memos.append(input);
  } else {
    const memoLines = await memos.readAll();
    if (memoLines.length > 0) {
      if (arg[0] === "-l") {
        console.log(memoLines.map((x) => x[1]).join("\n"));
      } else if (arg[0] === "-r") {
        await new questionclass().read(memoLines);
      } else if (arg[0] === "-d") {
        await new questionclass().delete(memoLines);
      }
    }
  }
}

new Promise(() => {
  main();
}).then(() => {
  memos.db.close();
});

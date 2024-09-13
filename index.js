const fs = require("fs");
const pdf = require("pdf-parse");

// Đọc file PDF
let dataBuffer = fs.readFileSync("./input/data.pdf");

// Phân tích file PDF
pdf(dataBuffer).then(function (data) {
  const text = data.text;
  // const text = fs.readFileSync("./test.txt", "utf8");
  // const pages = data.numpages;
  const lines = text.split("\n").filter((line) => line?.length > 0);
  const transactions = [];

  // 01-10 /09/2024
  const isDateLine = (line) => line.match(/^[0-3][0-9]\/09\/2024$/);
  // Page 1 of 12028
  const isPageLine = (line) => line.match(/Page \d+ of \d+$/);

  let i = 0;
  let currentPage = 1;
  while (true) {
    if (i >= lines.length) break;

    const line = lines[i];

    if (isPageLine(line)) currentPage++;

    if (isDateLine(line)) {
      let date = line.trim();
      i++;
      let ct_num = lines[i].trim();
      i++;
      // 50.000.000
      let money_desc = /^(\d{1,3}(?:\.\d{3})*)(.*)$/.exec(lines[i].trim());
      let money = money_desc[1];

      let desc = money_desc[2] || "";
      while (true) {
        i++;
        if (i >= lines.length) break;
        if (isPageLine(lines[i])) break;
        if (isDateLine(lines[i])) break;
        desc += lines[i] + " ";
      }

      transactions.push({ date, ct_num, money, desc, page: currentPage });
    } else {
      i++;
    }
  }

  fs.writeFileSync("./output/data.json", JSON.stringify(transactions, null, 4));

  const csv = transactions
    .map(
      (t) =>
        `${t.date},${t.ct_num},${t.money},${t.desc.replace(/,/g, " ")},${
          t.page
        }`
    )
    .join("\n");
  fs.writeFileSync("./output/data.csv", "date,ct_num,money,desc,page\n" + csv);
});

const fs = require("fs");
const pdf = require("pdf-parse");

function MTTQ_1_10() {
  const dataBuffer = fs.readFileSync("./input/MTTQ_1-10.pdf");

  // Phân tích file PDF
  pdf(dataBuffer).then(function (data) {
    const text = data.text;
    const lines = text.split("\n").filter((line) => line?.length > 0);
    const transactions = [];

    // 01-10 /09/2024
    const isDateLine = (line) => line.match(/^[0-3][0-9]\/09\/2024$/);
    // Page 1 of 12028
    const isPageLine = (line) => line.match(/Page \d+ of \d+$/);

    let i = 0;
    let currentPage = 1;
    while (true) {
      console.log(i);
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

        let desc = money_desc[2].trim() || "";
        while (true) {
          i++;
          if (i >= lines.length) break;
          if (isPageLine(lines[i])) break;
          if (isDateLine(lines[i])) break;
          desc += lines[i]?.trim() + " ";
        }
        desc = desc.replaceAll("  ", "").trim();

        transactions.push({ date, ct_num, money, desc, page: currentPage });
      } else {
        i++;
      }
    }

    fs.writeFileSync(
      "./output/data.json",
      JSON.stringify(transactions, null, 4)
    );

    const csv = transactions
      .map(
        (t) =>
          `${t.date},${t.ct_num},${t.money},${t.desc.replace(/,/g, " ")},${
            t.page
          }`
      )
      .join("\n");
    fs.writeFileSync(
      "./output/data.csv",
      "date,ct_num,money,desc,page\n" + csv
    );
  });
}

function CTTU_10_12() {
  const dataBuffer = fs.readFileSync("./input/CTTU_10-12.pdf");
  pdf(dataBuffer).then(function (data) {
    const text = data.text;
    const lines = text.split("\n").filter((line) => line?.length > 0);
    const transactions = [];

    // 1810/09/2024
    const isDateLine = (line) => line.match(/^(\d+)(1[0-2]\/09\/2024)$/);
    const isMoney = (line) => /^(\d{1,3}(?:\.\d{3})*)(.*)$/.exec(line);

    let i = 0;
    const allMoney = [];
    while (true) {
      console.log(i);
      if (i >= lines.length) break;

      const [_, index, date] = isDateLine(lines[i].trim()) || [];
      if (index && date) {
        const time = lines[++i];
        let desc = "";
        while (true) {
          i++;
          desc += lines[i].trim() + " ";
          if (lines[i].endsWith("A/C")) break;
        }

        transactions.push({
          date: date + " " + time,
          desc: desc.trim().replaceAll("  ", " "),
        });
        continue;
      }

      const money = isMoney(lines[i].trim());
      if (money)
        allMoney.push(
          parseInt(isMoney(lines[i].trim())?.[0]?.replaceAll(".", ""))
        );

      i++;
    }

    console.log(transactions.length, allMoney.length);

    // fs.writeFileSync("./output/CTTU.txt", text);

    fs.writeFileSync(
      "./output/CTTU.json",
      JSON.stringify(transactions, null, 4)
    );
  });
}
CTTU_10_12();

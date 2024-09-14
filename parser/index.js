import fs from "fs";
import { PdfDataParser } from "pdf-data-parser";

/*
Transaction format:
{
  date: "01/10/2024",
  id: string,
  money: number,
  desc: string,
  page: number
}
*/

async function main() {
  const trans1 = await MTTQ_1_10();
  const trans2 = await MTTQ_10_12();
  const trans3 = await CTTU_10_12();

  const allTrans = [...trans1, ...trans2, ...trans3];
  saveTransactions(allTrans, "./data/output/all");
}
main();

// file Mặt trận tổ quốc ngày 01-10/09/2024
async function MTTQ_1_10(
  pdfPath = "./data/input/MTTQ_1-10.pdf",
  outputPath = "./data/output/MTTQ_1-10"
) {
  console.log("Loading PDF file... " + pdfPath);
  const parser = new PdfDataParser({ url: pdfPath });

  console.log("Parsing PDF...");
  const rows = await parser.parse();

  // const cacheFile = outputPath + "_cache.json";

  // console.log("Saving result to cache file..." + cacheFile);
  // fs.writeFileSync(cacheFile, JSON.stringify(rows, null, 4));

  // console.log("Loading cached file..." + cacheFile);
  // const rows = JSON.parse(fs.readFileSync(cacheFile).toString("utf-8"));

  console.log("Parsing transactions...");
  const transactions = [];
  let i = 0;
  let page = 1;
  while (i < rows.length) {
    if (!Array.isArray(rows[i])) continue;
    /*
      [
        "09/09/2024 5243.90051",
        "1.000.000",
        "MBVCB.6986253876.Zoey ung ho khac phuc"
      ] */
    const [_, date, transId] =
      rows[i]?.[0]?.match(/^([0-3][0-9]\/09\/2024) (.[\d\.]*)$/) || [];
    const [money] = rows[i]?.[1]?.match(/^(\d{1,3}(?:\.\d{3})*)$/) || [];

    if (date && transId && money) {
      const descs = rows[i].slice(2);
      while (true) {
        if (!rows[i + 1] || rows[i + 1].length !== 1) break;
        descs.push(rows[i + 1][0]);
        i++;
      }
      transactions.push({
        date,
        id: transId,
        money: moneyToInt(money),
        desc: descs
          .filter(Boolean)
          .map((_) => _.replace(/,/g, " ").trim())
          .join(" "),
        page,
      });
    }

    if (rows[i]?.length === 1) {
      // "Page 190 of 12028"
      const [_, curPage, totalPage] =
        rows[i][0].match(/Page (\d+) of (\d+)$/) || [];
      if (curPage && totalPage) {
        page = parseInt(curPage) + 1;
      }
    }

    i++;
  }

  // save transactions
  saveTransactions(transactions, outputPath);

  return transactions;
}

// file Cứu trợ trung ương ngày 10-12/09/2024
async function CTTU_10_12(
  pdfPath = "./data/input/CTTU_10-12.pdf",
  outputPath = "./data/output/CTTU_10-12"
) {
  console.log("Loading PDF file... " + pdfPath);
  const parser = new PdfDataParser({ url: pdfPath });

  console.log("Parsing PDF...");
  const rows = await parser.parse();

  // const cacheFile = outputPath + "_cache.json";

  // console.log("Saving result to cache file..." + cacheFile);
  // fs.writeFileSync(cacheFile, JSON.stringify(rows, null, 4));

  // console.log("Loading cached file..." + cacheFile);
  // const rows = JSON.parse(fs.readFileSync(cacheFile).toString("utf-8"));

  console.log("Parsing transactions...");
  const transactions = [];
  let i = 0;
  let page = 1;
  while (i < rows.length) {
    if (!Array.isArray(rows[i])) continue;
    /*
      [
        "110/09/2024 12:01:29",
        "CT nhanh 247 den: TRAN TIEN ANH chuyen tien ung ho nguoi dan vung bao lu",
        "300.000",
        "TRAN TIEN ANH – A/C"
    ] */
    const [_, index, date, time] =
      rows[i]?.[0]?.match(/^(\d+)(1[0-2]\/09\/2024) (\d{2}:\d{2}:\d{2})$/) ||
      [];
    const [money] = rows[i]?.[2]?.match(/^(\d{1,3}(?:\.\d{3})*)$/) || [];

    if (date && index && time && money) {
      const descs = [rows[i][1], ...rows[i].slice(3)];
      page = index;
      transactions.push({
        date: `${date} ${time}`,
        id: index,
        money: moneyToInt(money),
        desc: descs
          .filter(Boolean)
          .map((_) => _.replace(/,/g, " ").trim())
          .join(" "),
        page,
      });
    }
    i++;
  }

  // save transactions
  saveTransactions(transactions, outputPath);

  return transactions;
}

// file Mặt trận tổ quốc ngày 10-12/09/2024
async function MTTQ_10_12(
  pdfPath = "./data/input/MTTQ_10-12.pdf",
  outputPath = "./data/output/MTTQ_10-12"
) {
  console.log("Loading PDF file... " + pdfPath);
  const parser = new PdfDataParser({ url: pdfPath });

  console.log("Parsing PDF...");
  const rows = await parser.parse();

  // const cacheFile = outputPath + "_cache.json";

  // console.log("Saving result to cache file..." + cacheFile);
  // fs.writeFileSync(cacheFile, JSON.stringify(rows, null, 4));

  // console.log("Loading cached file..." + cacheFile);
  // const rows = JSON.parse(fs.readFileSync(cacheFile).toString("utf-8"));

  console.log("Parsing transactions..." + rows.length);
  const transactions = [];
  let i = 0;
  let page = 1;
  while (i < rows.length) {
    if (!Array.isArray(rows[i])) continue;
    /*
      [
        "18",
        "10/09/2024",
        "CHAU MANH CAM",
        "1,000,000"
    ] */
    const [index] = rows[i]?.[0]?.match(/^(\d+)$/) || [];
    const [date] = rows[i]?.[1]?.match(/^[0-1][0-9]\/09\/2024$/) || [];
    const money =
      [2, 3]
        .map((j) => rows[i]?.[j]?.match(/^(\d{1,3}(?:,\d{3})*)$/)?.[0])
        .find((r) => r) || 0;

    if (date && index) {
      const descs = rows[i].length === 4 ? [rows[i][2]] : [];
      page = index;
      if (descs.length > 0 || money) {
        transactions.push({
          date,
          id: index,
          money: moneyToInt(money),
          desc: descs
            .filter(Boolean)
            .map((_) => _.replace(/,/g, " ").trim())
            .join(" "),
          page,
        });
      }
    }
    i++;
  }

  // save transactions
  saveTransactions(transactions, outputPath);

  return transactions;
}

function moneyToInt(money) {
  if (!money) return 0;
  return parseInt(money.replace(/[.,]/g, ""));
}

function saveTransactions(transactions, outputPath) {
  if (!transactions?.length)
    return console.log("> ERROR: No transactions to save");

  fs.writeFileSync(outputPath + ".json", JSON.stringify(transactions, null, 4));
  console.log(
    "Saved " + transactions.length + " transactions to " + outputPath
  );

  const csv = transactions
    .map(
      (t) =>
        `${t.date},${t.id},${t.money},${t.desc.replace(/,/g, " ")},${t.page}`
    )
    .join("\n");
  fs.writeFileSync(outputPath + ".csv", "date,id,money,desc,page\n" + csv);
  console.log(
    "Saved " + transactions.length + " transactions to " + outputPath
  );
}

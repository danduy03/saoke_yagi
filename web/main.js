const loadingDiv = document.querySelector("#loading");
const sumaryDiv = document.querySelector("#sumary");

window.onload = () => {
  try {
    main();
  } catch (e) {
    alert("ERROR: " + e);
  }
};

async function main() {
  // fetch data
  const data = await getBlobFromUrlWithProgress(
    "../output/data.csv",
    (progress) => {
      loadingDiv.innerHTML = `Đang tải dữ liêu... ${formatSize(
        progress.loaded
      )}/${formatSize(progress.total)} (${formatSize(progress.speed)}/s)`;
    }
  );
  const content = await data.text();

  loadingDiv.style.display = "none";

  // prepare data
  const lines = content.split("\n");
  const transactions = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(",");
    transactions.push({
      date: parts[0],
      ct_num: parts[1],
      money: Number(parts[2].replace(/\./g, "")),
      desc: parts[3],
      page: parts[4],
    });
  }
  console.log(transactions);

  // render table
  let table = new DataTable("#myTable", {
    searchHighlight: true,
    data: transactions,
    columns: [
      { data: "date", name: "date" },
      { data: "ct_num", name: "ct_num" },
      {
        data: "money",
        render: (data, type) => {
          var number = DataTable.render
            .number(",", ".", 0, "", "")
            .display(data);
          return number;
        },
      },
      { data: "desc", name: "desc" },
      { data: "page", name: "page" },
    ],
  });

  // highlight
  table.on("draw", function () {
    var body = $(table.table().body());
    body.unhighlight();
    body.highlight(table.search());
  });

  // sumary
  const total = transactions.map((t) => t.money).reduce((a, b) => a + b, 0);
  const avg = total / transactions.length;

  let max = 0,
    min = Infinity;
  transactions.forEach((t) => {
    if (t.money > max) max = t.money;
    if (t.money < min) min = t.money;
  });

  sumaryDiv.innerHTML =
    "<table>" +
    [
      ["Giao dịch", formatNumber(transactions.length)],
      ["Tổng tiền", formatMoney(total)],
      ["Trung bình", formatMoney(avg)],
      ["Cao nhất", formatMoney(max)],
      ["Thấp nhất", formatMoney(min)],
    ]
      .map(([k, v]) => `<tr><td>${k}</td><td>${v}</td></tr>`)
      .join("") +
    "</table>";

  // chart
  const ranges = [
    [1000, 10000],
    [10000, 20000],
    [20000, 50000],
    [50000, 100000],
    [100000, 200000],
    [200000, 500000],
    [500000, 1000000],
    [1000000, 5000000],
    [5000000, 10000000],
    [10000000, 50000000],
    [50000000, 100000000],
    [100000000, 500000000],
    [500000000, 1000000000],
  ];
  // count transaction in each range
  const dataset = ranges.map((range) => {
    return {
      count: transactions.filter(
        (t) => t.money >= range[0] && t.money < range[1]
      ).length,
      name: shortenMoney(range[0]) + " - " + shortenMoney(range[1]),
    };
  });
  console.log(dataset);

  // render chart
  const canvas = document.createElement("canvas");
  canvas.id = "chart";
  const ctx = canvas.getContext("2d");
  const chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: dataset.map((c) => c.name),
      datasets: [
        {
          label: "Tổng giao dịch",
          data: dataset.map((c) => c.count),
        },
      ],
    },
  });

  sumaryDiv.appendChild(canvas);
}

async function getBlobFromUrlWithProgress(url, progressCallback) {
  const response = await fetch(url, {});
  if (!response.ok) {
    throw new Error(`Error: ${response.status} - ${response.statusText}`);
  }
  const contentLength = response.headers.get("content-length");
  const total = parseInt(contentLength, 10);
  let loaded = 0;
  const reader = response.body.getReader();
  const chunks = [];

  const startTime = Date.now();
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    loaded += value.byteLength;
    const ds = (Date.now() - startTime + 1) / 1000;
    progressCallback?.({
      loaded,
      total,
      speed: loaded / ds,
    });
    chunks.push(value);
  }

  const blob = new Blob(chunks, {
    type: response.headers.get("content-type"),
  });

  return blob;
}

// getBlobFromUrlWithProgress("../output/data.csv", (progress) => {
//   console.log((progress.loaded / progress.total) * 100);
// });

function formatSize(size, fixed = 0) {
  size = Number(size);
  if (!size) return "?";

  const units = ["B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return size.toFixed(fixed) + units[unitIndex];
}

function formatNumber(num) {
  return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1,");
}

function shortenMoney(money, fixed = 0) {
  money = Number(money);
  if (!money) return "?";

  const units = ["", "K", "M", "B"];
  let unitIndex = 0;
  while (money >= 1000 && unitIndex < units.length - 1) {
    money /= 1000;
    unitIndex++;
  }
  return money.toFixed(fixed) + units[unitIndex];
}

const formatter = {
  money: new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }),
};
function formatMoney(money) {
  return formatter.money.format(money);
}

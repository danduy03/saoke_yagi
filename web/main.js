const loadingDiv = document.querySelector("#loading");
const sumaryDiv = document.querySelector("#sumary");
const themeBtn = document.querySelector("#theme");

window.onload = () => {
  try {
    main();
  } catch (e) {
    alert("ERROR: " + e);
  }
};

async function main() {
  // theme
  themeBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark"));
  });
  if (localStorage.getItem("theme") === "true") {
    document.body.classList.add("dark");
  }

  // fetch data
  const data = await getBlobFromUrlWithProgress(
    "../data/output/all.csv",
    (progress) => {
      loadingDiv.innerHTML = `Đang tải dữ liêu... ${formatSize(
        progress.loaded
      )}/${formatSize(progress.total)} (${formatSize(progress.speed)}/s)`;
    }
  );
  const content = await data.text();

  // prepare data
  loadingDiv.innerHTML = "Đang xử lý dữ liệu...";
  const lines = content.split("\n").filter(Boolean);
  const transactions = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(",");
    transactions.push({
      date: parts[0],
      bank: parts[1],
      id: parts[2],
      money: Number(parts[3].replace(/\./g, "")),
      desc: parts[4],
      page: parts[5],
    });
  }
  console.log(transactions);

  // render table
  loadingDiv.innerHTML = "Đang tạo bảng...";
  let table = new DataTable("#myTable", {
    searchDelay: 350,
    searchHighlight: true,
    search: {
      // regex: true,
      smart: true,
    },
    language: {
      search: 'Tìm (bọc trong dấu " để tìm chính xác): ',
      searchPlaceholder: "Ngày, mã, nội dung, tiền..",
      emptyTable: "Không có dữ liệu",
      info: "Hiển thị _START_ → _END_ / _TOTAL_ giao dịch",
      infoFiltered: "(Lọc từ _MAX_ giao dịch)",
      lengthMenu: "Hiện _MENU_ giao dịch",
      zeroRecords: "Không tìm thấy giao dịch nào",
      paginate: {
        first: "«",
        last: "»",
        next: ">",
        previous: "<",
      },
    },
    data: transactions,
    columns: [
      { data: "date", name: "date" },
      { data: "bank", name: "bank" },
      { data: "id", name: "id" },
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
    initComplete: function () {
      // Apply the search column
      this.api()
        .columns()
        .every(function () {
          var column = this;
          var title = column.footer().textContent;

          if (["Ngày", "Bank"].indexOf(title) != -1) {
            // Create select element
            let select = document.createElement("select");
            select.add(new Option(""));
            select.classList.add("dt-input");
            column.footer().replaceChildren(select);

            // Apply listener for user change in value
            select.addEventListener("change", function () {
              column.search(select.value, { exact: false }).draw();
            });

            // Add list of options
            column
              .data()
              .map((d) => d.split(" ")[0])
              .unique()
              .sort()
              .each(function (d, j) {
                select.add(new Option(d));
              });
          } else {
            let delay;
            // Create input element and add event listener
            $(
              '<input class="dt-input" type="text" placeholder="Tìm ' +
                title +
                '" style="max-width: 80px" />'
            )
              .appendTo($(column.footer()).empty())
              .on("keyup change clear", function () {
                if (column.search() !== this.value) {
                  if (delay) clearTimeout(delay);
                  delay = setTimeout(() => {
                    column.search(this.value).draw();
                  }, 350);
                }
              });
          }
        });
    },
  });

  // highlight
  table.on("draw", function () {
    const body = $(table.table().body());
    body.unhighlight();
    body.highlight(table.search());
    const search = table.search();

    if (search.startsWith('"') && search.endsWith('"')) {
      body.highlight(search.substring(1, search.length - 1));
    } else {
      search.split(" ").forEach((word) => {
        body.highlight(word);
      });
    }
  });

  // sumary
  loadingDiv.innerHTML = "Đang phân tích dữ liệu...";
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

  // chart money range
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
  const totalTransactionsByRange = ranges.map((range) => {
    return {
      count: transactions.filter(
        (t) => t.money >= range[0] && t.money < range[1]
      ).length,
      name: shortenMoney(range[0]) + " - " + shortenMoney(range[1]),
    };
  });
  console.log(totalTransactionsByRange);

  const totalMoneyByRange = ranges.map((range) => {
    return {
      count: transactions
        .filter((t) => t.money >= range[0] && t.money < range[1])
        .map((t) => t.money)
        .reduce((a, b) => a + b, 0),
      name: shortenMoney(range[0]) + " - " + shortenMoney(range[1]),
    };
  });
  console.log(totalMoneyByRange);

  // render chart
  const canvas = document.createElement("canvas");
  canvas.id = "chart";
  const ctx = canvas.getContext("2d");
  const chart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: totalTransactionsByRange.map((c) => c.name),
      datasets: [
        {
          label: "Tổng giao dịch",
          data: totalTransactionsByRange.map((c) => c.count),
          minBarLength: 2,
          yAxisID: "count",
        },
        {
          label: "Tổng tiền",
          data: totalMoneyByRange.map((c) => c.count),
          minBarLength: 2,
          yAxisID: "money",
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "top",
        },
        title: {
          display: true,
          text: "Tổng tiền/giao dịch theo giá tiền",
        },
      },
      scales: {
        count: {
          position: "left",
        },
        money: {
          position: "right",
        },
      },
    },
  });

  sumaryDiv.appendChild(canvas);

  loadingDiv.style.display = "none";
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

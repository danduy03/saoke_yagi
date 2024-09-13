const loadingDiv = document.querySelector("#loading");

window.onload = () => {
  try {
    main();
  } catch (e) {
    alert("ERROR: " + e);
  }
};

async function main() {
  const data = await getBlobFromUrlWithProgress(
    "../output/data.csv",
    (progress) => {
      loadingDiv.innerHTML = `Đang tải dữ liêu... ${formatSize(
        progress.loaded
      )}/${formatSize(progress.total)} (${formatSize(progress.speed)}/s)`;
    }
  );
  const content = await data.text();

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

  let table = new DataTable("#myTable", {
    data: transactions,
    columns: [
      { data: "date", name: "date" },
      { data: "ct_num", name: "ct_num" },
      {
        data: "money",
        render: (data, type) => {
          var number = DataTable.render
            .number(",", ".", 0, "", " ₫")
            .display(data);
          return number;
        },
      },
      { data: "desc", name: "desc" },
      { data: "page", name: "page" },
    ],
  });
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

import fs from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const sourceDir = path.join(rootDir, "webpage素材");
const outputDir = path.join(rootDir, "public", "works");
const dataFile = path.join(rootDir, "src", "data", "works.ts");
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp", ".JPG", ".JPEG", ".PNG", ".WEBP"]);
const ignoredNames = new Set([".DS_Store", ".gitignore"]);
const separatorPattern = /\s*[-—–]\s*/;
const fallbackSpacePattern = /^([\p{Script=Han}A-Za-z·]{2,12})\s+(.+)$/u;
const positiveKeywordWeights = [
  ["废弃", 10],
  ["闲置", 9],
  ["封死", 9],
  ["失效", 9],
  ["过去时", 8],
  ["退休", 8],
  ["形同虚设", 8],
  ["禁止通行", 8],
  ["死路", 8],
  ["开不了", 8],
  ["没用", 8],
  ["无主", 7],
  ["路障", 7],
  ["围挡", 7],
  ["围栏", 7],
  ["取款机", 7],
  ["电表", 7],
  ["消防栓", 7],
  ["药箱", 7],
  ["监控", 7],
  ["饭桌", 6],
  ["桥", 6],
  ["柜子", 6],
  ["门", 6],
  ["窗", 6],
  ["台阶", 6],
  ["路牌", 6],
  ["告示牌", 6],
  ["布告栏", 6],
  ["公示栏", 6],
  ["牌", 5],
  ["架", 5],
  ["杆", 5],
  ["栏", 5],
  ["管", 5],
  ["水池", 5],
  ["空调", 5],
  ["石墩", 5],
  ["校门", 5],
  ["晾衣杆", 5],
  ["衣架", 4],
  ["铁器", 4],
  ["砖", 4],
  ["椅子", 4],
  ["开关", 8],
  ["打卡点", 6],
  ["欢迎", 4],
  ["蘑菇灯", 5]
];
const negativeKeywordWeights = [
  ["Brothers", -8],
  ["麦麦", -7],
  ["雪碧", -7],
  ["鼠鼠", -7],
  ["南华园", -6],
  ["花园", -6],
  ["生命之源", -6],
  ["忧郁蓝神", -6],
  ["神秘", -4],
  ["某种", -3],
  ["同行", -3],
  ["弃舟", -2]
];

function isSupportedImageName(fileName) {
  const extension = path.extname(fileName);

  if (imageExtensions.has(extension)) {
    return true;
  }

  const lowerName = fileName.toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp"].some((suffix) => lowerName.endsWith(suffix));
}

function naturalCompare(a, b) {
  return a.localeCompare(b, "zh-Hans-CN-u-kn-true", { numeric: true, sensitivity: "base" });
}

function escapeString(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function versionToken(value) {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 33 + char.codePointAt(0)) % 2147483647;
  }
  return hash.toString(36);
}

function parseWorkFileName(fileName) {
  const extension = path.extname(fileName);
  const baseName = path.basename(fileName, extension).trim();

  if (separatorPattern.test(baseName)) {
    const [authorPart, ...rest] = baseName.split(separatorPattern);
    return {
      author: authorPart.trim(),
      title: rest.join("-").trim(),
      parsedBy: "dash"
    };
  }

  const fallbackMatch = baseName.match(fallbackSpacePattern);
  if (fallbackMatch) {
    return {
      author: fallbackMatch[1].trim(),
      title: fallbackMatch[2].trim(),
      parsedBy: "whitespace"
    };
  }

  return {
    author: baseName.replace(/\d+$/, "").trim(),
    title: "",
    parsedBy: "author-only"
  };
}

function scoreWorkCandidate({ title, originalFileName }) {
  const normalizedTitle = title.trim() || "未命名";
  const source = `${normalizedTitle} ${originalFileName}`;
  let score = 0;

  for (const [keyword, weight] of positiveKeywordWeights) {
    if (source.includes(keyword)) {
      score += weight;
    }
  }

  for (const [keyword, weight] of negativeKeywordWeights) {
    if (source.includes(keyword)) {
      score += weight;
    }
  }

  if (!title.trim()) {
    score -= 5;
  }

  if (/[门窗栏杆架牌管桥台阶墙柜路障围挡电表开关池栅栏]/.test(source)) {
    score += 4;
  }

  if (/[花园蓝神麦麦雪碧鼠鼠兄弟]/.test(source)) {
    score -= 3;
  }

  return score;
}

function scoreBucket(score) {
  if (score >= 18) {
    return "high";
  }
  if (score >= 10) {
    return "medium";
  }
  return "low";
}

function interleaveByAuthor(items) {
  const grouped = new Map();

  for (const item of items) {
    if (!grouped.has(item.author)) {
      grouped.set(item.author, []);
    }
    grouped.get(item.author).push(item);
  }

  for (const queue of grouped.values()) {
    queue.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return naturalCompare(a.originalFileName, b.originalFileName);
    });
  }

  const result = [];
  let previousAuthor = "";

  while ([...grouped.values()].some((queue) => queue.length > 0)) {
    const candidates = [...grouped.entries()]
      .filter(([, queue]) => queue.length > 0)
      .sort((a, b) => {
        const [authorA, queueA] = a;
        const [authorB, queueB] = b;
        const penaltyA = authorA === previousAuthor ? 1 : 0;
        const penaltyB = authorB === previousAuthor ? 1 : 0;

        if (penaltyA !== penaltyB) {
          return penaltyA - penaltyB;
        }

        if (queueB[0].score !== queueA[0].score) {
          return queueB[0].score - queueA[0].score;
        }

        if (queueA.length !== queueB.length) {
          return queueA.length - queueB.length;
        }

        return naturalCompare(authorA, authorB);
      });

    const [author, queue] = candidates[0];
    result.push(queue.shift());
    previousAuthor = author;
  }

  return result;
}

function toId(index) {
  return String(index + 1).padStart(3, "0");
}

async function ensureCleanOutputDir() {
  await fs.mkdir(outputDir, { recursive: true });
  const existing = await fs.readdir(outputDir);

  await Promise.all(
    existing
      .filter((name) => /^work-\d{3}\./i.test(name))
      .map((name) => fs.rm(path.join(outputDir, name), { force: true }))
  );
}

async function scanSourceFiles() {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  return entries
    .filter((entry) => {
      if (entry.isDirectory()) {
        return false;
      }

      if (ignoredNames.has(entry.name)) {
        return false;
      }

      return true;
    })
    .map((entry) => entry.name);
}

function buildTsFile(works) {
  const lines = [
    "export type Work = {",
    "  id: string;",
    "  image: string;",
    "  originalFileName: string;",
    "  title?: string;",
    "  author?: string;",
    "};",
    "",
    "export const works: Work[] = ["
  ];

  for (const work of works) {
    lines.push("  {");
    lines.push(`    id: "${work.id}",`);
    lines.push(`    image: "${work.image}",`);
    lines.push(`    originalFileName: "${escapeString(work.originalFileName)}",`);
    lines.push(`    title: "${escapeString(work.title)}",`);
    lines.push(`    author: "${escapeString(work.author)}",`);
    lines.push("  },");
  }

  lines.push("];");
  lines.push("");
  return lines.join("\n");
}

async function main() {
  await ensureCleanOutputDir();

  const sourceFiles = await scanSourceFiles();
  const review = {
    hiddenOrInvalid: [],
    duplicateSourceNames: [],
    emptyAuthor: [],
    emptyTitleAfterDash: [],
    parsedByWhitespaceFallback: []
  };

  const duplicates = new Set();
  const seen = new Set();
  for (const name of sourceFiles) {
    const lower = name.toLocaleLowerCase("zh-CN");
    if (seen.has(lower)) {
      duplicates.add(name);
    } else {
      seen.add(lower);
    }
  }

  const workFiles = [];
  for (const fileName of sourceFiles) {
    if (fileName.startsWith(".")) {
      if (isSupportedImageName(fileName)) {
        review.hiddenOrInvalid.push(fileName);
      }
      continue;
    }

    if (!isSupportedImageName(fileName)) {
      continue;
    }

    workFiles.push(fileName);
  }

  workFiles.sort(naturalCompare);

  const importedWorks = [];
  for (const fileName of workFiles) {
    const parsed = parseWorkFileName(fileName);

    if (!parsed.author) {
      review.emptyAuthor.push(fileName);
    }

    if (parsed.parsedBy === "dash" && !parsed.title) {
      review.emptyTitleAfterDash.push(fileName);
    }

    if (parsed.parsedBy === "whitespace") {
      review.parsedByWhitespaceFallback.push(fileName);
    }

    importedWorks.push({
      originalFileName: fileName,
      originalFileName: fileName,
      title: parsed.title,
      author: parsed.author,
      score: scoreWorkCandidate({
        title: parsed.title,
        originalFileName: fileName
      })
    });
  }

  const high = interleaveByAuthor(importedWorks.filter((item) => scoreBucket(item.score) === "high"));
  const medium = interleaveByAuthor(importedWorks.filter((item) => scoreBucket(item.score) === "medium"));
  const low = interleaveByAuthor(importedWorks.filter((item) => scoreBucket(item.score) === "low"));
  const orderedWorks = [...high, ...medium, ...low];

  const works = [];
  for (const [index, item] of orderedWorks.entries()) {
    const id = toId(index);
    const extension = path.extname(item.originalFileName).toLowerCase();
    const targetFileName = `work-${id}${extension}`;
    const sourcePath = path.join(sourceDir, item.originalFileName);
    const targetPath = path.join(outputDir, targetFileName);

    await fs.copyFile(sourcePath, targetPath);

    works.push({
      id,
      image: `/works/${targetFileName}?v=${versionToken(item.originalFileName)}`,
      originalFileName: item.originalFileName,
      title: item.title,
      author: item.author
    });
  }

  for (const duplicate of duplicates) {
    review.duplicateSourceNames.push(duplicate);
  }

  await fs.writeFile(dataFile, buildTsFile(works), "utf8");

  console.log(`Imported works: ${works.length}`);
  console.log("Review items:");
  console.log(JSON.stringify(review, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import { renderMarkdown } from "jsr:@sapling/markdown";
import { walk } from "https://deno.land/std@0.224.0/fs/mod.ts";
import { basename, join } from "https://deno.land/std@0.224.0/path/mod.ts";

interface DocEntry {
  title: string;
  url: string;
  path: string;
}

const BASE_URL = "https://openaispace.github.io/ai-trend-publish";
const DOCS_INDEX: DocEntry[] = [];

async function convertMdToHtml(mdPath: string): Promise<void> {
  try {
    // 读取 Markdown 文件
    const markdown = await Deno.readTextFile(mdPath);

    // 转换 Markdown 为 HTML，添加主题配置
    const content = await renderMarkdown(markdown, {
      shikiOptions: {
        theme: "github-light",
      },
    });

    // 生成输出文件路径
    const fileName = basename(mdPath).replace(".md", ".html");
    const outputPath = join("./docs", fileName);

    // 写入 HTML 文件
    await Deno.writeTextFile(outputPath, content);

    // 添加到文档索引
    const title = await extractTitle(markdown) || fileName.replace(".html", "");
    DOCS_INDEX.push({
      title,
      url: `${BASE_URL}/${fileName}`,
      path: outputPath,
    });

    console.log(`✅ 已转换: ${mdPath} -> ${outputPath}`);
  } catch (error) {
    console.error(`❌ 转换失败 ${mdPath}:`, error);
  }
}

async function extractTitle(markdown: string): Promise<string | null> {
  // 尝试从 Markdown 中提取第一个标题
  const titleMatch = markdown.match(/^#\s+(.+)$/m);
  return titleMatch ? titleMatch[1].trim() : null;
}

async function generateDocsIndex(): Promise<void> {
  const indexContent = `# 帮助文档

以下是所有可用的文档链接：

${DOCS_INDEX.map((doc) => `- [${doc.title}](${doc.url})`).join("\n")}
`;

  // 转换为 HTML，添加主题配置
  const htmlContent = await renderMarkdown(indexContent, {
    shikiOptions: {
      theme: "github-light",
    },
  });
  await Deno.writeTextFile("./docs/help.html", htmlContent);

  console.log("📚 帮助文档已生成到 help.html");
}

async function main() {
  const mdDir = "./docs/md";

  try {
    // 遍历 md 目录下的所有 .md 文件
    for await (const entry of walk(mdDir, { exts: [".md"] })) {
      if (entry.isFile && !entry.path.endsWith("index.md")) {
        await convertMdToHtml(entry.path);
      }
    }

    // 生成文档索引
    await generateDocsIndex();

    console.log("🎉 所有文件转换完成！");
  } catch (error) {
    console.error("转换过程中出错:", error);
  }
}

if (import.meta.main) {
  main();
}

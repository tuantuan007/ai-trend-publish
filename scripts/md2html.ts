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

// HTML 模板
const HTML_TEMPLATE = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}} - AI Trend Publish</title>
    <style>
        :root {
            --primary-color: #2563eb;
            --text-color: #1f2937;
            --bg-color: #ffffff;
            --nav-bg: #f3f4f6;
            --code-bg: #282c34;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.6;
            color: var(--text-color);
            max-width: 1200px;
            margin: 0 auto;
            padding: 0;
            background: var(--bg-color);
        }
        
        .container {
            display: flex;
            min-height: 100vh;
        }
        
        nav {
            width: 250px;
            padding: 2rem 1rem;
            background: var(--nav-bg);
            border-right: 1px solid #e5e7eb;
        }
        
        main {
            flex: 1;
            padding: 2rem;
            overflow-x: auto;
        }
        
        h1 {
            font-size: 2rem;
            margin-bottom: 1.5rem;
            color: var(--primary-color);
        }
        
        a {
            color: var(--primary-color);
            text-decoration: none;
        }
        
        a:hover {
            text-decoration: underline;
        }
        
        nav ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        
        nav li {
            margin: 0.5rem 0;
        }
        
        pre {
            background: var(--code-bg);
            padding: 1rem;
            border-radius: 8px;
            overflow-x: auto;
            margin: 1.5rem 0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        code {
            font-family: "JetBrains Mono", Consolas, Monaco, "Andale Mono", monospace;
            font-size: 0.9em;
        }
        
        :not(pre) > code {
            background: #f3f4f6;
            padding: 0.2em 0.4em;
            border-radius: 4px;
            color: #e06c75;
        }
        
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 1rem 0;
        }
        
        th, td {
            border: 1px solid #e5e7eb;
            padding: 0.5rem;
        }
        
        th {
            background: var(--nav-bg);
        }
        
        img {
            max-width: 100%;
            height: auto;
        }
        
        blockquote {
            border-left: 4px solid var(--primary-color);
            margin: 1rem 0;
            padding: 0.5rem 1rem;
            background: var(--nav-bg);
        }
        
        @media (max-width: 768px) {
            .container {
                flex-direction: column;
            }
            
            nav {
                width: 100%;
                border-right: none;
                border-bottom: 1px solid #e5e7eb;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <nav>
            <h1>文档导航</h1>
            <ul>
                {{navigation}}
            </ul>
        </nav>
        <main>
            {{content}}
        </main>
    </div>
</body>
</html>`;

async function convertMdToHtml(mdPath: string): Promise<void> {
  try {
    // 读取 Markdown 文件
    const markdown = await Deno.readTextFile(mdPath);

    // 转换 Markdown 为 HTML，使用 one-dark-pro 主题
    const content = await renderMarkdown(markdown, {
      shikiOptions: {
        theme: "one-dark-pro",
      },
    });

    // 生成输出文件路径
    const fileName = basename(mdPath).replace(".md", ".html");
    const outputPath = join("./docs", fileName);

    // 提取标题
    const title = await extractTitle(markdown) || fileName.replace(".html", "");

    // 添加到文档索引
    DOCS_INDEX.push({
      title,
      url: `${BASE_URL}/${fileName}`,
      path: outputPath,
    });

    // 生成导航链接
    const navigation = DOCS_INDEX.map((doc) =>
      `<li><a href="${doc.url}">${doc.title}</a></li>`
    ).join("\n");

    // 应用模板
    const html = HTML_TEMPLATE
      .replace("{{title}}", title)
      .replace("{{navigation}}", navigation)
      .replace("{{content}}", content);

    // 写入 HTML 文件
    await Deno.writeTextFile(outputPath, html);

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

  // 转换为 HTML，使用 one-dark-pro 主题
  const content = await renderMarkdown(indexContent, {
    shikiOptions: {
      theme: "one-dark-pro",
    },
  });

  // 生成导航链接
  const navigation = DOCS_INDEX.map((doc) =>
    `<li><a href="${doc.url}">${doc.title}</a></li>`
  ).join("\n");

  // 应用模板
  const html = HTML_TEMPLATE
    .replace("{{title}}", "帮助文档")
    .replace("{{navigation}}", navigation)
    .replace("{{content}}", content);

  await Deno.writeTextFile("./docs/help.html", html);
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

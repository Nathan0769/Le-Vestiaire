import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let currentList: string[] = [];
  let inList = false;

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul
          key={`list-${elements.length}`}
          className="list-disc pl-6 text-gray-700 mb-4"
        >
          {currentList.map((item, idx) => (
            <li key={idx} dangerouslySetInnerHTML={{ __html: item }} />
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.trim()) {
      if (inList) {
        flushList();
        inList = false;
      }
      continue;
    }

    if (line.startsWith("# ")) {
      flushList();
      inList = false;
      elements.push(
        <h1 key={i} className="text-3xl font-bold text-gray-900 mb-4">
          {line.substring(2)}
        </h1>
      );
      continue;
    }

    if (line.startsWith("## ")) {
      flushList();
      inList = false;
      elements.push(
        <h2 key={i} className="text-2xl font-semibold text-gray-900 mb-4 mt-8">
          {line.substring(3)}
        </h2>
      );
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      flushList();
      inList = false;
      elements.push(
        <h3 key={i} className="text-xl font-medium text-gray-800 mb-3 mt-6">
          {line.substring(4)}
        </h3>
      );
      continue;
    }

    // Bold text (in paragraph)
    if (line.startsWith("**")) {
      flushList();
      inList = false;
      const match = line.match(/\*\*(.*?)\*\*\s*:\s*(.*)/);
      if (match) {
        elements.push(
          <p key={i} className="text-gray-600 mb-2">
            <strong>{match[1]}</strong>: {match[2]}
          </p>
        );
      } else {
        elements.push(
          <p
            key={i}
            className="text-gray-600 mb-2"
            dangerouslySetInnerHTML={{
              __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
            }}
          />
        );
      }
      continue;
    }

    if (line.startsWith("- ")) {
      inList = true;
      const content = line
        .substring(2)
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(
          /\[(.*?)\]\((.*?)\)/g,
          '<a href="$2" class="text-primary hover:underline">$1</a>'
        );
      currentList.push(content);
      continue;
    }

    flushList();
    inList = false;
    const processedLine = line
      .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      .replace(
        /\[(.*?)\]\((.*?)\)/g,
        '<a href="$2" class="text-primary hover:underline font-medium">$1</a>'
      );

    elements.push(
      <p
        key={i}
        className="text-gray-700 leading-relaxed mb-4"
        dangerouslySetInnerHTML={{ __html: processedLine }}
      />
    );
  }

  flushList();

  return <div className="prose prose-lg max-w-none">{elements}</div>;
}

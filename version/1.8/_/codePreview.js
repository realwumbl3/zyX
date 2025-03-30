import { html, css } from "../";

css`
  .code-preview {
    background-color: #1a1a1a;
    padding: 20px;
    border-radius: 5px;
    font-family: monospace;
    position: relative;
    overflow: auto;
    max-width: 100%;
    font-size: 16px;
  }
  .line-numbers {
    position: absolute;
    left: 10px;
    top: 20px;
    color: #666;
    user-select: none;
    text-align: right;
    padding-right: 10px;
    border-right: 1px solid #444;
    font-size: 16px;
  }
  .code-container {
    margin-left: 40px;
    overflow-x: auto;
    display: block;
  }
  /* Pre element with preserved whitespace and horizontal scrolling */
  .code-preview div {
    white-space: pre;
    overflow-x: visible;
    min-height: 1.2em;
    line-height: 1.2em;
  }
  /* Syntax highlighting colors */
  .keyword {
    color: #569cd6;
  }
  .string {
    color: #ce9178;
  }
  .comment {
    color: #6a9955;
  }
  .function {
    color: #dcdcaa;
  }
  .number {
    color: #b5cea8;
  }
  .operator {
    color: #d4d4d4;
  }
  .class {
    color: #4ec9b0;
  }
  .variable {
    color: #9cdcfe;
  }
  .property {
    color: #9cdcfe;
  }
  .html-tag {
    color: #569cd6;
  }
  .html-attr {
    color: #9cdcfe;
  }
  .punctuation {
    color: #d4d4d4;
  }
`;

export class CodePreview {
  constructor() {
    // if type url fetch the script if script tag fetch the code from the script tag

    html` <div class="code-preview">
      <div class="line-numbers" this="lineNumbers"></div>
      <div class="code-container">
        <div this="pre"></div>
      </div>
    </div>`.bind(this);
  }

  async updateCode(code) {
    if (typeof code === "string") {
      const res = await fetch(code);
      this.code = await res.text();
    } else if (code instanceof HTMLElement) {
      this.code = code.textContent;
    }

    this.applyHighlighting();
  }

  applyHighlighting() {
    // Clear pre element
    this.pre.innerHTML = "";
    this.lineNumbers.innerHTML = "";

    if (!this.code) return;

    // Split code into lines
    const lines = this.code.split("\n");

    // Check if the first line is empty and adjust the lines array
    const startIndex = lines[0].trim() === "" ? 1 : 0;

    // Add line numbers
    lines.slice(startIndex).forEach((_, i) => {
      const lineNum = document.createElement("div");
      lineNum.textContent = i + 1; // Adjusted to start from 1
      this.lineNumbers.appendChild(lineNum);
    });

    // Process each line for syntax highlighting
    lines.slice(startIndex).forEach((line, index) => {
      const lineElement = document.createElement("div");

      // If line is empty, add a non-breaking space to preserve the line height
      if (line.trim() === "") {
        lineElement.innerHTML = "&nbsp;";
      } else {
        // Apply syntax highlighting to the line
        lineElement.innerHTML = this.highlightSyntax(line);
      }

      // Add the highlighted line to the pre element
      this.pre.appendChild(lineElement);
    });
  }

  highlightSyntax(line) {
    // Replace tabs with visible tab markers before escaping HTML
    const tabSpaces = "    "; // 4 spaces per tab
    let processedLine = line.replace(/\t/g, tabSpaces);

    // Escape HTML special characters
    let escapedLine = processedLine.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Define the tokens we want to match
    const tokenPatterns = [
      // HTML entities - must come first to handle properly
      { regex: /(&amp;|&lt;|&gt;|&quot;|&nbsp;|&#\d+;)/g, className: "html-tag" },

      // Comments
      { regex: /(\/\/.*$|\/\*[\s\S]*?\*\/)/g, className: "comment" },

      // Strings
      { regex: /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)/g, className: "string" },

      // Keywords
      {
        regex:
          /\b(const|let|var|function|class|if|else|for|while|return|export|import|from|async|await|instanceof|typeof|new|this|try|catch|finally|throw|break|continue|switch|case|default|of|in|extends|implements|static|get|set)\b/g,
        className: "keyword",
      },

      // Missing opening brackets in constructor calls - must come before other function handling
      {
        regex: /\bnew\s+([A-Z][a-zA-Z0-9_$]*)\s*\)/g,
        className: "punctuation",
        transform: (match) => {
          const parts = match.match(/\bnew\s+([A-Z][a-zA-Z0-9_$]*)/);
          if (parts && parts[1]) {
            return `<span class="keyword">new</span> <span class="class">${parts[1]}</span><span class="punctuation">(</span>`;
          }
          return match;
        },
      },

      // Method calls with missing opening bracket (object.method))
      {
        regex: /\.([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)/g,
        className: "property",
        transform: (match) => {
          if (match.includes("(")) return match; // Skip if it already has an opening bracket
          const parts = match.match(/\.([a-zA-Z_$][a-zA-Z0-9_$]*)/);
          if (parts && parts[1]) {
            return `<span class="property">${parts[1]}</span><span class="punctuation">(</span>`;
          }
          return match;
        },
      },

      // Constructor calls
      {
        regex: /\bnew\s+([A-Z][a-zA-Z0-9_$]*)/g,
        className: "class",
        transform: (match) => {
          const parts = match.match(/\bnew\s+([A-Z][a-zA-Z0-9_$]*)/);
          if (parts && parts[1]) {
            return `<span class="keyword">new</span> <span class="class">${parts[1]}</span>`;
          }
          return match;
        },
      },

      // Function calls with missing opening bracket - must come before regular function handling
      {
        regex: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\)/g,
        className: "function",
        transform: (match) => {
          if (match.includes("(")) return match; // Skip if it already has an opening bracket
          const parts = match.match(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)/);
          if (parts && parts[1]) {
            return `<span class="function">${parts[1]}</span><span class="punctuation">(</span>`;
          }
          return match;
        },
      },

      // Standalone closing parenthesis that hasn't been captured by other patterns
      { regex: /(\))/g, className: "punctuation" },

      // Function names with parentheses
      { regex: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, className: "function", transform: (match) => match.slice(0, -1) },

      // Numbers
      { regex: /\b(\d+(\.\d+)?)\b/g, className: "number" },

      // Class names - must come before variables
      { regex: /\b([A-Z][a-zA-Z0-9_$]*)\b/g, className: "class" },

      // Properties - must come before variables
      { regex: /\.([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g, className: "property", transform: (match) => match.slice(1) },

      // HTML attributes
      { regex: /\s([a-zA-Z0-9_-]+)=/g, className: "html-attr", transform: (match) => match.trim() },

      // Variables - must come after keywords, functions, and classes
      { regex: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g, className: "variable" },

      // Operators
      { regex: /([=+\-*/%&|^<>!?:;.,])/g, className: "operator" },

      // Punctuation
      { regex: /([(){}[\]])/g, className: "punctuation" },
    ];

    // Create an array of tokens from the line
    const tokens = [];
    let lastIndex = 0;

    // Function to add a token
    const addToken = (start, end, text, className = null) => {
      if (start > lastIndex) {
        // Add plain text before this token
        tokens.push({
          text: escapedLine.substring(lastIndex, start),
          className: null,
        });
      }

      // Add the token
      tokens.push({
        text: text,
        className: className,
      });

      lastIndex = end;
    };

    // Process each pattern
    for (const pattern of tokenPatterns) {
      // Reset regex lastIndex
      pattern.regex.lastIndex = 0;

      // Find all matches for this pattern in the escaped line
      const matches = [...escapedLine.matchAll(pattern.regex)];

      for (const match of matches) {
        const start = match.index;
        const matchText = match[0];
        const end = start + matchText.length;

        // Skip if this region has already been tokenized
        if (start < lastIndex) continue;

        // If this pattern has a transform function, apply it
        const text = pattern.transform ? pattern.transform(matchText) : matchText;

        // Add this token
        addToken(start, end, text, pattern.className);
      }
    }

    // Add any remaining text
    if (lastIndex < escapedLine.length) {
      tokens.push({
        text: escapedLine.substring(lastIndex),
        className: null,
      });
    }

    // Combine tokens back into HTML
    return tokens
      .map((token) => {
        if (token.className) {
          return `<span class="${token.className}">${token.text}</span>`;
        } else {
          return token.text;
        }
      })
      .join("");
  }
}

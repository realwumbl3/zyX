import { html, css } from "../../../";

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
        display: flex;
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
            // Fix indentation for code from script tags
            this.code = this.normalizeIndentation(this.code);
        }

        this.applyHighlighting();
    }

    normalizeIndentation(code) {
        // Split into lines
        const lines = code.split("\n");

        // Remove empty lines from the beginning and end
        while (lines.length > 0 && lines[0].trim() === "") lines.shift();
        while (lines.length > 0 && lines[lines.length - 1].trim() === "") lines.pop();

        if (lines.length === 0) return "";

        // Find minimum indentation (ignoring empty lines)
        const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
        if (nonEmptyLines.length === 0) return code;

        // Calculate the common leading whitespace
        const leadingSpaces = nonEmptyLines.map((line) => {
            const match = line.match(/^[ \t]*/);
            return match ? match[0].length : 0;
        });

        const minIndent = Math.min(...leadingSpaces);

        // Remove the common indentation from all lines
        if (minIndent > 0) {
            return lines
                .map((line) => {
                    if (line.trim().length === 0) return "";
                    return line.substring(minIndent);
                })
                .join("\n");
        }

        return code;
    }

    applyHighlighting() {
        // Clear pre element
        this.pre.innerHTML = "";
        this.lineNumbers.innerHTML = "";

        if (!this.code) return;

        // Split code into lines
        const lines = this.code.split("\n");

        // Don't skip the first line anymore as empty lines at the beginning
        // should have been removed by normalizeIndentation
        const startIndex = 0;

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

        // Define the tokens we want to match in order of precedence
        const tokenPatterns = [
            // HTML entities - must come first to handle properly
            { regex: /(&amp;|&lt;|&gt;|&quot;|&nbsp;|&#\d+;)/g, className: "html-tag" },

            // Comments
            { regex: /(\/\/.*$|\/\*[\s\S]*?\*\/)/g, className: "comment" },

            // Interpolation markers - high priority to break out of strings
            { regex: /\${/g, className: "punctuation" },
            { regex: /}/g, className: "punctuation" },

            // Strings (double and single quotes) - match only if no interpolation inside to allow it to be broken down
            // NOTE: The negative lookahead must check the character *after* `$`.
            // If we check for `${` after consuming `$`, the next char is `{`, so `${` can never match.
            // We want to prevent strings from swallowing `${...}` so the interpolations can be highlighted.
            { regex: /"([^"\\$]|\\.|(\$(?!\{)))*"/g, className: "string" },
            { regex: /'([^'\\$]|\\.|(\$(?!\{)))*'/g, className: "string" },

            // Template literal delimiters and individual quotes
            { regex: /[`"']/g, className: "string" },

            // Keywords
            {
                regex: /\b(const|let|var|function|class|if|else|for|while|return|export|import|from|async|await|instanceof|typeof|new|this|try|catch|finally|throw|break|continue|switch|case|default|of|in|extends|implements|static|get|set)\b/g,
                className: "keyword",
            },

            // Tagged template literals (like html`)
            { regex: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*`/g, className: "function" },

            // Arrow functions
            { regex: /=>/g, className: "operator" },

            // Function names with parentheses
            { regex: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g, className: "function" },

            // Numbers
            { regex: /\b(\d+(\.\d+)?)\b/g, className: "number" },

            // Class names - must come before variables
            { regex: /\b([A-Z][a-zA-Z0-9_$]*)\b/g, className: "class" },

            // Properties - must come before variables
            { regex: /\.([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g, className: "property" },

            // HTML Tags (escaped)
            { regex: /&lt;\/?[a-zA-Z0-9-]+/g, className: "html-tag" },
            { regex: /&gt;/g, className: "html-tag" },

            // HTML attributes
            { regex: /\s([a-zA-Z0-9_-]+)=/g, className: "html-attr" },

            // Variables - must come after keywords, functions, and classes
            { regex: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\b/g, className: "variable" },

            // Operators and Punctuation
            { regex: /([=+\-*/%&|^<>!?:;.,(){}[\]])/g, className: "punctuation" },
        ];

        // Create an array of all possible matches from all patterns
        const allMatches = [];
        tokenPatterns.forEach((pattern, priority) => {
            pattern.regex.lastIndex = 0;
            let match;
            while ((match = pattern.regex.exec(escapedLine)) !== null) {
                allMatches.push({
                    start: match.index,
                    end: match.index + match[0].length,
                    text: match[0],
                    className: pattern.className,
                    transform: pattern.transform,
                    priority: priority,
                });
            }
        });

        // Sort matches: first by start index, then by length (longer first), then by priority
        allMatches.sort((a, b) => {
            if (a.start !== b.start) return a.start - b.start;
            const aLen = a.end - a.start;
            const bLen = b.end - b.start;
            if (aLen !== bLen) return bLen - aLen;
            return a.priority - b.priority;
        });

        // Filter out overlapping matches and build tokens
        const tokens = [];
        let lastIndex = 0;

        for (const match of allMatches) {
            // Skip if this match starts before the last one ended (overlap)
            if (match.start < lastIndex) continue;

            // Add plain text before this token
            if (match.start > lastIndex) {
                tokens.push({
                    text: escapedLine.substring(lastIndex, match.start),
                    className: null,
                });
            }

            // Add the token
            tokens.push({
                text: match.transform ? match.transform(match.text) : match.text,
                className: match.className,
            });

            lastIndex = match.end;
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

import { Marked } from "marked";
import { markedHighlight } from "marked-highlight";
import type { HandcraftNode } from "@handcraft/lib";
import { h } from "@handcraft/lib/h";
import attr from "@handcraft/lib/attr";
import hljs from "highlight.js";
import * as parse5 from "parse5";
import text from "@handcraft/lib/text";

hljs.configure({ classPrefix: "" });

const marked = new Marked(
  markedHighlight({
    emptyLangClass: "",
    langPrefix: "hljs ",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  }),
);

export async function parse(
  markdown: string,
): Promise<Array<HandcraftNode>> {
  const html = await marked.parse(markdown);
  const parsed = parse5.parseFragment(html);

  return nodeify(parsed.childNodes);
}

function nodeify(
  children: Array<parse5.DefaultTreeAdapterMap["childNode"]>,
): Array<HandcraftNode> {
  const result: Array<HandcraftNode> = [];

  for (const child of children) {
    if (child.nodeName === "#text") {
      result.push(
        text((child as parse5.DefaultTreeAdapterMap["textNode"]).value),
      );
    } else {
      const element = child as parse5.DefaultTreeAdapterMap["element"];

      result.push(
        h(element.namespaceURI)[element.nodeName](
          ...element.attrs.map((
            a,
          ) => attr[a.name](a.value)),
          ...nodeify(element.childNodes ?? []),
        ),
      );
    }
  }

  return result;
}

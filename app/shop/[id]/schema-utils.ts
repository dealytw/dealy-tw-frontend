/**
 * Utilities for parsing Strapi rich text blocks for schema + UI.
 * Kept separate so `head.tsx` and `page.tsx` can share logic.
 */

/**
 * Clean question text by removing leading "?" or ":?"
 * Keeps emoji in the text
 */
function cleanQuestionText(text: string): string {
  if (!text) return '';
  return text.replace(/^[:\?]+\s*/, '').trim();
}

/**
 * Extract text content from a Strapi block (for questions only)
 */
function extractTextFromBlock(block: any): string {
  if (!block || !block.children) return '';

  return (block.children || [])
    .map((child: any) => {
      if (child.text) return child.text;
      if (child.type === 'text') return child.text || '';
      if (child.children) return extractTextFromBlock(child);
      return '';
    })
    .filter(Boolean)
    .join(' ');
}

/**
 * Strip HTML tags from a string, preserving text content
 */
function stripHTMLTags(html: string): string {
  if (!html) return '';

  return html
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/p>/gi, ' ')
    .replace(/<\/?[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Convert Strapi block to HTML, preserving list structure
 */
function blockToHTML(block: any): string {
  if (!block) return '';

  const processChildren = (children: any[]): string => {
    if (!children || !Array.isArray(children)) return '';

    return children
      .map((child: any) => {
        if (child.type === 'text') {
          let text = child.text || '';
          if (child.bold) text = `<strong>${text}</strong>`;
          if (child.italic) text = `<em>${text}</em>`;
          if (child.code) text = `<code>${text}</code>`;
          if (child.strikethrough) text = `<s>${text}</s>`;
          if (child.underline) text = `<u>${text}</u>`;
          return text;
        }
        if (child.type === 'link') {
          const linkText = processChildren(child.children || []);
          return `<a href="${child.url || '#'}">${linkText}</a>`;
        }
        if (child.children) {
          return processChildren(child.children);
        }
        return '';
      })
      .join('');
  };

  if (block.type === 'paragraph') {
    const content = processChildren(block.children || []);
    return `<p>${content || '<br>'}</p>`;
  }

  if (block.type === 'heading') {
    const level = block.level || 2;
    const content = processChildren(block.children || []);
    return `<h${level}>${content}</h${level}>`;
  }

  if (block.type === 'list') {
    const isOrdered = block.format === 'ordered';
    const items = (block.children || [])
      .map((item: any) => {
        const content = processChildren(item.children || []);
        return `<li>${content}</li>`;
      })
      .join('');
    return isOrdered ? `<ol>${items}</ol>` : `<ul>${items}</ul>`;
  }

  return extractTextFromBlock(block);
}

/**
 * Parse FAQs from HTML string
 * Extracts H3 headings as questions and following content as answers
 * Preserves list HTML structure (ul, ol, li)
 */
function parseFAQsFromHTML(html: string): Array<{ question: string; answer: string }> {
  if (!html || typeof html !== 'string') return [];

  const faqs: Array<{ question: string; answer: string }> = [];
  const h3Pattern = /<h3[^>]*>(.*?)<\/h3>/gi;
  const matches = Array.from(html.matchAll(h3Pattern));
  if (matches.length === 0) return [];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const questionStart = match.index!;
    const questionEnd = questionStart + match[0].length;
    const rawQuestion = stripHTMLTags(match[1]).trim();
    const question = cleanQuestionText(rawQuestion);

    const nextMatch = matches[i + 1];
    const answerEnd = nextMatch ? nextMatch.index! : html.length;
    let answerHTML = html.substring(questionEnd, answerEnd).trim();

    answerHTML = answerHTML
      .replace(/^\s+|\s+$/g, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    if (question && answerHTML) {
      faqs.push({ question, answer: answerHTML });
    }
  }

  return faqs;
}

/**
 * Parse FAQs from rich text (HTML format or Strapi blocks)
 * Extracts H3 headings as questions and following text as answers
 */
export function parseFAQsFromRichText(richText: any): Array<{ question: string; answer: string }> {
  if (!richText) return [];

  // If richText is already an array of parsed FAQs, return as-is
  if (
    Array.isArray(richText) &&
    richText.length > 0 &&
    typeof richText[0] === 'object' &&
    ('question' in richText[0] || 'q' in richText[0])
  ) {
    return richText
      .map((f: any) => {
        let question = f?.question || f?.q || '';
        question = cleanQuestionText(question);

        return {
          question,
          answer: f?.answer || f?.a || '',
        };
      })
      .filter((f: any) => f.question && f.answer);
  }

  // If richText is Strapi blocks format (JSON array)
  if (Array.isArray(richText)) {
    const faqs: Array<{ question: string; answer: string }> = [];
    let currentQuestion = '';
    let currentAnswer = '';

    for (const block of richText) {
      if (block.type === 'heading' && block.level === 3) {
        if (currentQuestion && currentAnswer) {
          faqs.push({
            question: currentQuestion.trim(),
            answer: currentAnswer.trim(),
          });
        }
        const rawQuestion = extractTextFromBlock(block);
        currentQuestion = cleanQuestionText(rawQuestion);
        currentAnswer = '';
      } else if (currentQuestion) {
        const html = blockToHTML(block);
        if (html) {
          currentAnswer = currentAnswer ? currentAnswer + html : html;
        }
      }
    }

    if (currentQuestion && currentAnswer) {
      faqs.push({
        question: currentQuestion.trim(),
        answer: currentAnswer.trim(),
      });
    }

    return faqs;
  }

  // If richText is HTML string, parse it
  if (typeof richText === 'string') {
    return parseFAQsFromHTML(richText);
  }

  return [];
}

/**
 * Extract bold text from a block (for step titles)
 */
function extractBoldTextFromBlock(block: any): string {
  if (!block || !block.children) return '';

  return (block.children || [])
    .filter((child: any) => child.bold)
    .map((child: any) => child.text || '')
    .filter(Boolean)
    .join(' ')
    .trim();
}

/**
 * Extract list items from a list block
 */
function extractListItemsFromBlock(block: any): string[] {
  if (!block || !block.children) return [];

  const items: string[] = [];
  for (const listItem of block.children || []) {
    if (listItem.children) {
      const text = (listItem.children || [])
        .map((child: any) => {
          if (child.text) return child.text;
          if (child.children) {
            return (child.children || []).map((c: any) => c.text || '').join('');
          }
          return '';
        })
        .filter(Boolean)
        .join(' ');
      if (text) items.push(text.trim());
    }
  }
  return items;
}

/**
 * Parse How-To guide from rich text (Strapi blocks or HTML string)
 * Extracts bold text as steps and bulleted list items as descriptions
 */
export function parseHowToFromRichText(richText: any): Array<{ step: string; descriptions: string[] }> {
  if (!richText) return [];

  // If already parsed
  if (Array.isArray(richText) && richText.length > 0 && typeof richText[0] === 'object' && ('step' in richText[0] || 'title' in richText[0])) {
    return richText
      .map((item: any) => ({
        step: item?.step || item?.title || '',
        descriptions: Array.isArray(item?.descriptions) ? item.descriptions : item?.content ? [item.content] : [],
      }))
      .filter((item: any) => item.step);
  }

  // Strapi blocks format
  if (Array.isArray(richText)) {
    const howToSteps: Array<{ step: string; descriptions: string[] }> = [];
    let currentStep = '';
    let currentDescriptions: string[] = [];

    for (const block of richText) {
      if (block.type === 'paragraph') {
        const hasBold = block.children?.some((child: any) => child.bold);
        if (hasBold) {
          if (currentStep && currentDescriptions.length > 0) {
            howToSteps.push({ step: currentStep.trim(), descriptions: currentDescriptions });
          }
          currentStep = extractBoldTextFromBlock(block);
          currentDescriptions = [];
        } else if (currentStep) {
          const text = extractTextFromBlock(block);
          if (text) currentDescriptions.push(text);
        }
      } else if (block.type === 'list' && currentStep) {
        currentDescriptions.push(...extractListItemsFromBlock(block));
      } else if (block.type === 'heading' && block.level === 3 && currentStep) {
        if (currentStep && currentDescriptions.length > 0) {
          howToSteps.push({ step: currentStep.trim(), descriptions: currentDescriptions });
        }
        currentStep = extractTextFromBlock(block);
        currentDescriptions = [];
      }
    }

    if (currentStep && currentDescriptions.length > 0) {
      howToSteps.push({ step: currentStep.trim(), descriptions: currentDescriptions });
    }

    return howToSteps;
  }

  // HTML string fallback (lightweight)
  if (typeof richText === 'string') {
    const steps: Array<{ step: string; descriptions: string[] }> = [];
    const liPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
    const matches = Array.from(richText.matchAll(liPattern));

    for (const match of matches) {
      const liContent = match[1];
      const boldMatch = liContent.match(/<(?:strong|b)[^>]*>(.*?)<\/(?:strong|b)>/i);
      const step = boldMatch ? stripHTMLTags(boldMatch[1]).trim() : '';
      if (!step) continue;

      const descriptions: string[] = [];
      const afterBold = liContent.replace(/<(?:strong|b)[^>]*>.*?<\/(?:strong|b)>/i, '');
      const ulMatch = afterBold.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i);

      if (ulMatch) {
        const nestedLiPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
        const nestedMatches = Array.from(ulMatch[1].matchAll(nestedLiPattern));
        for (const nested of nestedMatches) {
          const text = stripHTMLTags(nested[1]).trim();
          if (text) descriptions.push(text);
        }
      } else {
        const text = stripHTMLTags(afterBold).trim();
        if (text) descriptions.push(text);
      }

      if (descriptions.length > 0) steps.push({ step, descriptions });
    }

    return steps;
  }

  return [];
}


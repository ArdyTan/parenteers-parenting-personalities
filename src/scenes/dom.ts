export type ElementOptions = Readonly<{
  className?: string;
  text?: string;
  attributes?: Readonly<Record<string, string>>;
}>;

export function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  options: ElementOptions = {},
  children: readonly Node[] = [],
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (options.className) node.className = options.className;
  if (options.text !== undefined) node.textContent = options.text;
  for (const [name, value] of Object.entries(options.attributes ?? {})) {
    node.setAttribute(name, value);
  }
  children.forEach((child) => node.appendChild(child));
  return node;
}

export function actionButton(
  text: string,
  action: () => void,
  signal: AbortSignal,
  options: ElementOptions = {},
): HTMLButtonElement {
  const button = element('button', {
    ...options,
    className: ['button', options.className].filter(Boolean).join(' '),
    text,
    attributes: { type: 'button', ...options.attributes },
  });
  button.addEventListener('click', action, { signal });
  return button;
}

/**
 * The two bands every Brilliant frame shares: a filling `Body` and a hugging
 * `Bottom Section` (pad 0/34/34, gap 10) that keeps its CTA in the thumb zone.
 * Scenes append exactly these two children so the shell grid stays predictable.
 */
export function sceneBody(className: string, children: readonly Node[]): HTMLElement {
  return element('div', { className: `scene__body ${className}` }, children);
}

export function sceneBottom(className: string, children: readonly Node[]): HTMLElement {
  return element('div', { className: `scene__bottom ${className}` }, children);
}

export function sceneCaption(text: string, className?: string): HTMLParagraphElement {
  return element('p', {
    className: ['scene__caption', className].filter(Boolean).join(' '),
    text,
  });
}

export function localizedList(items: readonly string[], className?: string): HTMLUListElement {
  return element(
    'ul',
    className ? { className } : {},
    items.map((item) => element('li', { text: item })),
  );
}

export function externalLink(
  text: string,
  href: string,
  className?: string,
): HTMLAnchorElement {
  return element('a', {
    className: ['button', className].filter(Boolean).join(' '),
    text,
    attributes: {
      href,
      target: '_blank',
      rel: 'noreferrer noopener',
    },
  });
}

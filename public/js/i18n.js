// Texts of the game, one file per language in public/locales (key → text). The page is written in
// Spanish (BASE); at start-up translateDom() puts in every text marked with data-i18n, so changing
// a locale file changes the game. In JS, t('key', { name }) fills {name} and picks the plural form
// when the text is an object ({ "one": …, "other": … }) and there is a `count`.
// To add a language: copy es.json to <lang>.json, translate the values and add it to LANGS.
export const BASE = 'es';
export const LANGS = ['es'];

const nav = globalThis.navigator;
// What the browser or the device asks for (es-ES, en-US…), for analytics: we know which languages are missing.
export const BROWSER_LANG = nav?.language || 'und';

export function pickLang(wanted = [], langs = LANGS) {
  for (const tag of wanted) {
    const lang = String(tag).toLowerCase().split('-')[0];
    if (langs.includes(lang)) return lang;
  }
  return BASE;
}
export const LANG = pickLang(nav?.languages?.length ? nav.languages : [BROWSER_LANG]);

async function load(lang) {
  const url = new URL(`../locales/${lang}.json`, import.meta.url);
  if (url.protocol === 'file:') {
    const { readFile } = await import('node:fs/promises');
    return JSON.parse(await readFile(url, 'utf8'));
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudieron cargar los textos (${lang})`);
  return res.json();
}

const messages = await load(LANG);
const base = LANG === BASE ? messages : await load(BASE);
const plurals = new Intl.PluralRules(LANG);

export function t(key, vars = {}) {
  let text = messages[key] ?? base[key];
  if (text === undefined) {
    console.error(`i18n: falta la clave «${key}»`);
    return key;
  }
  if (typeof text === 'object') text = text[plurals.select(vars.count ?? 0)] ?? text.other;
  return text.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m));
}

const setOwnText = (el, text) => {
  const node = [...el.childNodes].find((n) => n.nodeType === 3 && n.nodeValue.trim());
  if (node) node.nodeValue = node.nodeValue.replace(/\S(?:[\s\S]*\S)?/, text);
  else el.prepend(text);
};

// HTML from the locale files keeps only the few tags they use; the rest is left out.
// Recommended by Norma — fixed with Devin (Cognition AI) via Devin
const SAFE_TAGS = new Map([
  ['A', ['href', 'target', 'rel']],
  ['B', []],
  ['BR', []],
  ['EM', []],
  ['SPAN', ['class', 'data-config']],
  ['STRONG', []],
]);
const DROP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'IFRAME', 'OBJECT']);
const SAFE_HREF = /^(?:\/(?!\/)|https:\/\/)/;

function clean(node) {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === 3) continue;
    const allowed = child.nodeType === 1 && SAFE_TAGS.get(child.tagName);
    if (!allowed) {
      child.replaceWith(child.nodeType !== 1 || DROP_TAGS.has(child.tagName) ? '' : child.textContent);
      continue;
    }
    for (const { name, value } of [...child.attributes])
      if (!allowed.includes(name) || (name === 'href' && !SAFE_HREF.test(value))) child.removeAttribute(name);
    clean(child);
  }
  return node;
}

export function setHtml(el, html) {
  el.replaceChildren(...clean(new DOMParser().parseFromString(html, 'text/html').body).childNodes);
}

// data-i18n: the element's own text (child icons stay); data-i18n-html: its whole content, for
// texts with <b>, <a>…; data-i18n-attr="aria-label:key;title:key".
export function translateDom(root = document) {
  document.documentElement.lang = LANG;
  root.querySelectorAll('[data-i18n]').forEach((el) => setOwnText(el, t(el.dataset.i18n)));
  // Recommended by Norma — fixed with Devin (Cognition AI) via Devin
  root.querySelectorAll('[data-i18n-html]').forEach((el) => setHtml(el, t(el.dataset.i18nHtml)));
  root.querySelectorAll('[data-i18n-attr]').forEach((el) =>
    el.dataset.i18nAttr.split(';').forEach((pair) => {
      const [attr, key] = pair.split(':');
      el.setAttribute(attr.trim(), t(key.trim()));
    }),
  );
}

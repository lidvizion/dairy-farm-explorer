export const $ = id => document.getElementById(id);
export const el = (tag, className, html) => {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (html != null) element.innerHTML = html;
  return element;
};

export const toast = text => {
  const notice = el('div', 'toast', text);
  $('toasts').appendChild(notice);
  setTimeout(() => notice.remove(), 1800);
};

export const caption = text => { $('caption').textContent = text || ''; };

'use strict';

const counterId = document.documentElement.dataset.metrika;
function goal(eventName) {
  if (counterId && typeof window.ym === 'function') window.ym(Number(counterId), 'reachGoal', eventName);
}
if (/^[1-9]\d+$/.test(counterId || '')) {
  window.ym = window.ym || function () { (window.ym.a = window.ym.a || []).push(arguments); };
  window.ym.l = Date.now();
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://mc.yandex.ru/metrika/tag.js?id=' + counterId;
  document.head.append(tag);
  window.ym(Number(counterId), 'init', { accurateTrackBounce: true, trackLinks: false, webvisor: false });
  document.addEventListener('click', event => {
    const action = event.target.closest('a[data-action]')?.dataset.action;
    if (action) goal(action + '_click');
  });
}

const menuButton = document.querySelector('.menu-toggle');
const nav = document.getElementById('navigation');
function setMenu(open) {
  nav.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
}
menuButton.addEventListener('click', () => setMenu(!nav.classList.contains('open')));
nav.addEventListener('click', () => setMenu(false));
document.addEventListener('click', event => {
  if (!event.target.closest('.header')) setMenu(false);
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && nav.classList.contains('open')) {
    setMenu(false);
    menuButton.focus();
  }
});

const heroImages = [...document.querySelectorAll('.hero-photo')];
if (heroImages.length > 1) {
  const captions = JSON.parse(document.getElementById('hero-captions').textContent);
  const caption = document.querySelector('.hero-caption');
  let selected = 0;
  document.querySelectorAll('[data-hero]').forEach(button => {
    button.addEventListener('click', async () => {
      selected = (selected + Number(button.dataset.hero) + heroImages.length) % heroImages.length;
      const index = selected;
      const next = heroImages[index];
      if (!next.hasAttribute('src')) next.src = next.dataset.src;
      try { await next.decode(); } catch { return; }
      if (index !== selected) return;
      heroImages.forEach((image, i) => image.classList.toggle('active', i === index));
      caption.textContent = captions[index];
    });
  });
}

document.addEventListener('input', event => {
  if (event.target.matches('.compare-range')) {
    event.target.closest('.compare').style.setProperty('--pos', event.target.value + '%');
  }
});

const dialog = document.getElementById('gallery-dialog');
if (dialog) {
  const cards = [...document.querySelectorAll('.work-card')];
  const viewport = document.getElementById('dialog-photos');
  let selected = 0;
  function showProject(index) {
    selected = (index + cards.length) % cards.length;
    const card = cards[selected];
    const visual = card.querySelector('.compare,.single-work').cloneNode(true);
    if (visual.matches('.compare')) {
      const pair = document.createElement('div');
      pair.className = 'full-pair';
      for (const stage of ['before', 'after']) {
        const figure = document.createElement('figure');
        const image = visual.querySelector('.compare-' + stage);
        image.className = '';
        image.loading = 'eager';
        const label = document.createElement('figcaption');
        label.textContent = visual.querySelector('.tag-' + stage).textContent;
        figure.append(image, label);
        pair.append(figure);
      }
      viewport.replaceChildren(pair);
    } else {
      visual.querySelector('img').loading = 'eager';
      viewport.replaceChildren(visual);
    }
    const projectTitle = card.querySelector('h3').textContent;
    document.getElementById('dialog-title').textContent = projectTitle;
    const similar = document.getElementById('similar-project');
    const estimateUrl = new URL(similar.href);
    estimateUrl.searchParams.set('project', projectTitle);
    similar.href = estimateUrl.href;
    document.getElementById('dialog-counter').textContent = (selected + 1) + ' / ' + cards.length;
  }
  cards.forEach((card, i) => {
    card.querySelector('.view-work').addEventListener('click', () => {
      showProject(i);
      dialog.showModal();
      document.body.classList.add('dialog-open');
    });
  });
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.querySelectorAll('[data-project-step]').forEach(button => {
    button.addEventListener('click', () => showProject(selected + Number(button.dataset.projectStep)));
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => document.body.classList.remove('dialog-open'));
}

const estimate = document.getElementById('estimate-form');
if (estimate) {
  const project = new URLSearchParams(location.search).get('project');
  if (project) estimate.elements.details.value = 'Мне понравился проект «' + project.slice(0, 100) + '».';
  estimate.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(estimate);
    const details = data.get('details').trim();
    const lines = [
      'Здравствуйте! Хочу узнать стоимость ремонта квартиры.',
      'Тип квартиры — ' + data.get('property') + '.',
      'Площадь — ' + data.get('area') + ' м².'
    ];
    if (details) lines.push('Пожелания — ' + details);
    const chat = new URL(estimate.dataset.whatsapp);
    chat.searchParams.set('text', lines.join('\n'));
    goal('whatsapp_estimate_open');
    location.assign(chat.href);
  });
}

// Keep the incoming ad attribution on internal navigation and the company's estimate form.
// Only campaign parameters are forwarded. Contact channels receive no query parameters.
const allowed = /^(utm_(source|medium|campaign|content|term|id|referrer)|yclid|yadclid|ysclid)$/i;
const fromAd = [...new URLSearchParams(location.search)].filter(([name]) => allowed.test(name));
if (fromAd.length) {
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (href.startsWith('#')) return;
    const url = new URL(link.href);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return;
    if (url.origin !== location.origin && !link.hasAttribute('data-attribution')) return;
    for (const [key, value] of fromAd) {
      if (!url.searchParams.has(key)) url.searchParams.set(key, value);
    }
    link.href = url.href;
  });
}

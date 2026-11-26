'use strict';

const attributionPattern = /^(utm_[a-z0-9_]{1,40}|yclid)$/i;
const attributionStorageKey = 'larsson-remont:campaign';
const currentAttribution = [...new URLSearchParams(location.search)]
  .filter(([name]) => attributionPattern.test(name))
  .map(([name, value]) => [name, value.slice(0, 500)]);
let attribution = currentAttribution;

try {
  if (currentAttribution.length) {
    sessionStorage.setItem(attributionStorageKey, JSON.stringify(currentAttribution));
  } else {
    const saved = JSON.parse(sessionStorage.getItem(attributionStorageKey) || '[]');
    if (Array.isArray(saved)) {
      attribution = saved.filter(entry => Array.isArray(entry)
        && entry.length === 2
        && attributionPattern.test(entry[0])
        && typeof entry[1] === 'string');
    }
  }
} catch {
  // Navigation still carries campaign parameters when browser storage is unavailable.
}

function attributedUrl(value) {
  const url = new URL(value, location.href);
  for (const [name, parameter] of attribution) {
    if (!url.searchParams.has(name)) url.searchParams.set(name, parameter);
  }
  return url;
}

document.querySelectorAll('a[href]').forEach(link => {
  const href = link.getAttribute('href');
  if (!href || href.startsWith('#')) return;
  const url = new URL(href, location.href);
  if (!/^https?:$/.test(url.protocol)) return;
  if (url.origin === location.origin || link.hasAttribute('data-attribution')) {
    link.href = attributedUrl(url.href).href;
  }
});

const counterId = document.documentElement.dataset.metrika;
function goal(name) {
  if (/^[1-9]\d+$/.test(counterId || '') && typeof window.ym === 'function') {
    window.ym(Number(counterId), 'reachGoal', name);
  }
}

if (/^[1-9]\d+$/.test(counterId || '')) {
  window.ym = window.ym || function () {
    (window.ym.a = window.ym.a || []).push(arguments);
  };
  window.ym.l = Date.now();
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://mc.yandex.ru/metrika/tag.js?id=' + counterId;
  document.head.append(tag);
  window.ym(Number(counterId), 'init', {
    accurateTrackBounce: true,
    trackLinks: false,
    webvisor: false
  });
}

document.addEventListener('click', event => {
  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action) goal(action + '_click');
});

const menuButton = document.querySelector('.menu-toggle');
const mainNav = document.getElementById('main-nav');
function setMenu(open) {
  if (!menuButton || !mainNav) return;
  mainNav.classList.toggle('open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
}

if (menuButton && mainNav) {
  menuButton.addEventListener('click', () => setMenu(!mainNav.classList.contains('open')));
  mainNav.addEventListener('click', event => {
    if (event.target.closest('a,button')) setMenu(false);
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) setMenu(false);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && mainNav.classList.contains('open')) {
      setMenu(false);
      menuButton.focus();
    }
  });
}

const quoteDialog = document.getElementById('quote-dialog');
const projectDialog = document.getElementById('project-dialog');
const compareDialog = document.getElementById('compare-dialog');

function openDialog(dialog) {
  if (!dialog) return;
  document.querySelectorAll('dialog[open]').forEach(open => {
    if (open !== dialog) open.close();
  });
  setMenu(false);
  if (!dialog.open) dialog.showModal();
  document.body.classList.add('dialog-open');
}

document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelectorAll('[data-close-dialog]').forEach(button => {
    button.addEventListener('click', () => dialog.close());
  });
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    const outside = event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom;
    if (outside) dialog.close();
  });
  dialog.addEventListener('close', () => {
    document.body.classList.toggle('dialog-open', Boolean(document.querySelector('dialog[open]')));
  });
});

function openQuote() {
  if (!quoteDialog) return;
  const frame = quoteDialog.querySelector('.quote-frame');
  const fallback = quoteDialog.querySelector('a.quote-fallback,.quote-fallback a');
  if (frame && !frame.hasAttribute('src')) {
    const quiz = attributedUrl(frame.dataset.src);
    if (quiz.origin !== 'https://quiz.marquiz.ru') return;
    const loading = quoteDialog.querySelector('.quote-loading');
    function finishLoading() {
      if (frame.contentDocument?.URL === 'about:blank') return;
      if (loading) loading.hidden = true;
      frame.removeEventListener('load', finishLoading);
    }
    frame.addEventListener('load', finishLoading);
    frame.src = quiz.href;
    if (fallback) fallback.href = quiz.href;
  }
  openDialog(quoteDialog);
  goal('estimate_open');
}

document.querySelectorAll('.js-quote').forEach(button => {
  button.addEventListener('click', event => {
    event.preventDefault();
    openQuote();
  });
});

const budgetForm = document.getElementById('budget-form');
if (budgetForm) {
  const areaInput = document.getElementById('budget-area');
  const areaRange = document.getElementById('budget-range');
  const lowOutput = document.getElementById('budget-low');
  const highOutput = document.getElementById('budget-high');
  const money = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0
  });
  const rates = {
    novostroyka: { comfort: [20000, 35000], premium: [35000, 50000] },
    vtorichka: { comfort: [22000, 37000], premium: [37000, 52000] }
  };

  function updateBudget(source) {
    const area = Number(source.value);
    if (!source.validity.valid || !Number.isFinite(area)) return;
    areaInput.value = String(area);
    areaRange.value = String(area);
    const values = new FormData(budgetForm);
    const property = rates[values.get('property')] || rates.novostroyka;
    const [low, high] = property[values.get('level')] || property.comfort;
    lowOutput.textContent = money.format(low * area);
    highOutput.textContent = money.format(high * area);
  }

  areaInput.addEventListener('input', () => updateBudget(areaInput));
  areaRange.addEventListener('input', () => updateBudget(areaRange));
  budgetForm.addEventListener('change', () => updateBudget(areaInput));
  budgetForm.addEventListener('submit', event => {
    event.preventDefault();
    if (budgetForm.reportValidity()) openQuote();
  });
  updateBudget(areaInput);
}

const filters = [...document.querySelectorAll('.filter-buttons button[data-filter]')];
const projectCards = [...document.querySelectorAll('.project-card[data-area]')];
if (filters.length && projectCards.length) {
  filters.forEach(button => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter;
      let visible = 0;
      projectCards.forEach(card => {
        const area = Number(card.dataset.area);
        const matches = filter === 'all'
          || (filter === 'compact' && area <= 60)
          || (filter === 'spacious' && area > 60)
          || card.dataset.rooms === filter;
        card.hidden = !matches;
        if (matches) visible += 1;
      });
      filters.forEach(option => option.setAttribute('aria-pressed', String(option === button)));
      const counter = document.getElementById('project-result-count');
      if (counter) counter.textContent = 'Показано проектов — ' + visible;
      const empty = document.getElementById('project-empty');
      if (empty) empty.hidden = visible > 0;
    });
  });
}

const projectDataElement = document.getElementById('project-data');
let projects = [];
if (projectDataElement) {
  try {
    projects = JSON.parse(projectDataElement.textContent);
  } catch {
    projects = [];
  }
}

if (projectDialog && Array.isArray(projects) && projects.length) {
  const photoElement = projectDialog.querySelector('.gallery-photo');
  const photo = photoElement.matches('img') ? photoElement : photoElement.querySelector('img');
  const thumbnails = projectDialog.querySelector('.gallery-thumbs');
  const counter = projectDialog.querySelector('.gallery-counter');
  let selectedProject = projects[0];
  let selectedPhoto = 0;
  const assetBase = new URL(document.body.dataset.base || './', location.href);

  function projectImageUrl(path) {
    if (typeof path !== 'string' || !path.startsWith('assets/')) return '';
    return new URL(path, assetBase).href;
  }

  function showPhoto(index) {
    selectedPhoto = (index + selectedProject.images.length) % selectedProject.images.length;
    photo.src = projectImageUrl(selectedProject.images[selectedPhoto]);
    photo.alt = selectedProject.imageAlts?.[selectedPhoto] || selectedProject.title;
    counter.textContent = (selectedPhoto + 1) + ' / ' + selectedProject.images.length;
    [...thumbnails.children].forEach((button, i) => {
      button.setAttribute('aria-pressed', String(i === selectedPhoto));
    });
  }

  function showProject(project, imageIndex) {
    selectedProject = project;
    projectDialog.querySelector('.gallery-title').textContent = project.title;
    projectDialog.querySelector('.gallery-description').textContent = project.description;
    projectDialog.querySelector('.gallery-area').textContent = project.area + ' м² · ' + project.type;
    const estimate = projectDialog.querySelector('.js-quote');
    if (estimate) estimate.dataset.project = project.slug;
    const buttons = project.images.map((path, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-label', 'Фото ' + (index + 1) + ' — ' + project.title);
      const thumbnail = document.createElement('img');
      thumbnail.src = projectImageUrl(path);
      thumbnail.alt = '';
      thumbnail.loading = 'lazy';
      button.append(thumbnail);
      button.addEventListener('click', () => showPhoto(index));
      return button;
    });
    thumbnails.replaceChildren(...buttons);
    showPhoto(imageIndex);
    openDialog(projectDialog);
  }

  document.querySelectorAll('.js-project').forEach(button => {
    button.addEventListener('click', event => {
      const key = button.dataset.project;
      const project = projects.find(item => item.slug === key) || projects[Number(key)];
      if (!project?.images?.length) return;
      event.preventDefault();
      showProject(project, Number(button.dataset.photo) || 0);
    });
  });
  projectDialog.querySelector('.gallery-prev').addEventListener('click', () => showPhoto(selectedPhoto - 1));
  projectDialog.querySelector('.gallery-next').addEventListener('click', () => showPhoto(selectedPhoto + 1));
  projectDialog.addEventListener('keydown', event => {
    if (event.target.closest('input,select,textarea,iframe')) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      showPhoto(selectedPhoto + (event.key === 'ArrowLeft' ? -1 : 1));
    }
  });
}

document.querySelectorAll('.compare-range').forEach(input => {
  input.addEventListener('input', () => {
    input.closest('.comparison').style.setProperty('--position', input.value + '%');
  });
});

if (compareDialog) {
  document.querySelectorAll('.js-compare').forEach(button => {
    button.addEventListener('click', event => {
      const source = document.getElementById('comparison-' + button.dataset.compare)?.querySelector('.comparison')
        || button.closest('.comparison-card')?.querySelector('.comparison');
      if (!source) return;
      event.preventDefault();
      const pair = compareDialog.querySelector('.compare-full');
      const title = compareDialog.querySelector('.compare-title,.dialog-header h2');
      const card = source.closest('.comparison-card');
      if (title) title.textContent = card.querySelector('h3').textContent;
      const figures = ['before', 'after'].map(stage => {
        const figure = document.createElement('figure');
        const image = source.querySelector('.compare-' + stage).cloneNode(true);
        image.className = '';
        image.loading = 'eager';
        const caption = document.createElement('figcaption');
        caption.textContent = source.querySelector('.compare-label.' + stage).textContent;
        figure.append(image, caption);
        return figure;
      });
      pair.replaceChildren(...figures);
      openDialog(compareDialog);
    });
  });
}

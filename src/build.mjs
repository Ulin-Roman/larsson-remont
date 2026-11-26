import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { estimatePage } from './estimate.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => JSON.parse(readFileSync(resolve(root, name), 'utf8'));
const services = read('services.json');
const works = read('works.json');
const heroes = read('heroes.json');
const site = read('site.json');
const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const json = value => JSON.stringify(value).replaceAll('<', '\\u003c');
const icons = {
  up: '<path d="M5 19 19 5M6 5h13v13"/>',
  right: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  left: '<path d="M20 12H5m6-6-6 6 6 6"/>',
  down: '<path d="M12 4v15m-6-6 6 6 6-6"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2.1"/>',
  contract: '<path d="M7 3h7l4 4v14H5V3h2Zm7 0v5h4M8 12h7m-7 4h5"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="m5 6 12-3v3m4 5h-6v5h6"/><path d="M17 13.5h.3"/>',
  shield: '<path d="m12 2 8 3v6c0 5-4 9-8 11-4-2-8-6-8-11V5l8-3Z"/><path d="m8.5 11.5 2.5 2.5 5-5"/>',
  phone: '<path d="M7 3H4a1 1 0 0 0-1 1c0 9 8 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2c-3-1-6-4-7-7l2-2-2-5Z"/>',
  arrows: '<path d="m8 7-5 5 5 5m8-10 5 5-5 5"/>',
  expand: '<path d="M15 3h6v6m-6 0 6-6M9 21H3v-6m0 6 6-6"/>',
  close: '<path d="m5 5 14 14m0-14L5 19"/>',
  menu: '<path d="M3 7h18M3 12h18M3 17h18"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  plus: '<path d="M4 12h16M12 4v16"/>'
};
const icon = (name, size = 20) => `<svg aria-hidden="true" focusable="false" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
const logo = '<span class="logo-mark" aria-hidden="true"><i></i><i></i><i></i></span><span class="wordmark">Larsson<span>.</span></span>';
const local = (base, path) => /^(?:https?:|tel:|mailto:)/.test(path) ? esc(path) : base + esc(path);
const target = (path, hash = '') => (path ? path + '/' : '') + hash;
const pageUrl = slug => new URL(target(slug), site.publicUrl).href;
const img = (base, path, alt, cls = '', eager = false) => `<img class="${cls}" src="${local(base, path)}" alt="${esc(alt)}" ${eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy" decoding="async"'}>`;
const calculator = (base, cls) => `<a class="${cls}" data-action="estimate" href="${base}smeta/">Узнать стоимость ${icon('up',17)}</a>`;
const phone = cls => `<a class="${cls}" data-action="phone" href="tel:${esc(site.phoneHref)}">${esc(site.phone)}</a>`;
const telegram = cls => `<a class="${cls}" data-action="telegram" href="${esc(site.telegram)}">Написать в Telegram ${icon('up',16)}</a>`;
const eyebrow = label => `<div class="eyebrow"><span aria-hidden="true"></span>${esc(label)}</div>`;

function header(b) {
  return `<a class="skip" href="#main">К содержанию</a><header class="header"><div class="wrap header-inner"><a class="brand" href="${b}" aria-label="Larsson — главная">${logo}</a><nav id="navigation" aria-label="Основная навигация"><a href="${b}#uslugi">Услуги</a><a href="${b}portfolio/">Портфолио</a><a href="${b}#process">Как работаем</a><a href="${b}kontakty/">Контакты</a></nav><div class="header-end">${phone('head-phone')}<a class="button button-outline head-cta" href="${b}kontakty/">Обсудить ремонт ${icon('up',14)}</a><button type="button" class="menu-toggle" aria-label="Открыть меню" aria-controls="navigation" aria-expanded="false">${icon('menu')}</button></div></div></header>`;
}
function footer(b) {
  return `<footer><div class="wrap foot"><a class="brand" aria-label="Larsson — главная" href="${b}">${logo}</a><span>Ремонт квартир в Москве и области</span><a href="${b}portfolio/">Портфолио</a><a href="${b}kontakty/">Контакты</a><a class="to-top" href="#top">Наверх ↑</a></div></footer>`;
}
function benefits() {
  return `<div class="benefits"><span>${icon('contract')}Работаем по договору</span><span>${icon('wallet')}Поэтапная оплата</span><span>${icon('shield')}Гарантия до 3 лет</span></div>`;
}
function hero(b) {
  const first = heroes[0];
  return `<div class="wrap"><section class="hero" aria-label="Ремонт квартир под ключ"><div class="hero-photos">${heroes.map((h,i) => i===0 ? img(b,h.image,h.title,'hero-photo active',true) : `<img class="hero-photo" data-src="${local(b,h.image)}" alt="${esc(h.title)}" decoding="async">`).join('')}</div><div class="hero-shade"></div><div class="hero-copy"><div class="geo">${icon('pin',14)} Москва и Московская область</div><h1>Ремонт квартир<br><em>под ключ</em></h1><p>От первого замера до чистовой отделки.<br>Согласуем смету и график работ до начала ремонта.</p><div class="hero-actions">${calculator(b,'button button-green')}<a class="hero-link" href="#raboty">Смотреть работы ${icon('down',15)}</a></div></div><div class="hero-controls"><span class="hero-caption" aria-live="polite">${esc(first.title)}</span>${heroes.length>1 ? `<button aria-label="Предыдущий интерьер" data-hero="-1">${icon('left',16)}</button><button aria-label="Следующий интерьер" data-hero="1">${icon('right',16)}</button>` : ''}</div><script type="application/json" id="hero-captions">${json(heroes.map(h=>h.title))}</script></section>${benefits()}</div>`;
}
function heading(tag, title, action = '') {
  return `<div class="section-head"><div>${eyebrow(tag)}<h2>${title}</h2></div>${action}</div>`;
}
function compare(b, w, modal = false) {
  const before = w.before, after = w.after;
  const position = 46;
  return `<div class="compare${modal ? ' compare-large' : ''}" style="--pos:${position}%">${img(b,after,w.afterAlt || (w.title+' после ремонта'),'compare-after')}${img(b,before,w.beforeAlt || (w.title+' — '+(w.beforeLabel || 'до ремонта')),'compare-before')}<span class="photo-tag tag-before">${esc(w.beforeLabel || 'Было')}</span><span class="photo-tag tag-after">${esc(w.afterLabel || 'Стало')}</span><div class="compare-line" aria-hidden="true"><span>${icon('arrows',23)}</span></div><input class="compare-range" aria-label="Сравнить до и после ремонта — ${esc(w.title)}" type="range" min="0" max="100" value="${position}"></div>`;
}
function workCard(b,w,index) {
  const visual = w.before && w.after ? compare(b,w) : `<div class="single-work">${img(b,w.after || w.images[0],w.afterAlt||w.title)}<span class="photo-tag tag-after">После ремонта</span></div>`;
  const detail = [w.area,w.rooms].filter(Boolean).join(' · ');
  return `<article class="work-card">${visual}<div class="work-caption"><div>${detail?`<p class="work-meta">${esc(detail)}</p>`:''}<h3>${esc(w.title)}</h3></div><button class="round view-work" data-work="${index}" aria-label="Увеличить фото — ${esc(w.title)}">${icon('expand',17)}</button></div>${w.note?`<p class="work-note">${esc(w.note)}</p>`:''}</article>`;
}
function gallery(b,all=false) {
  const cards = all ? works : works.slice(0,2);
  return `<section class="wrap content-section portfolio" id="raboty">${all ? '' : heading('Портфолио','Было <em>и</em> стало',`<a class="section-link" href="${b}portfolio/">Все работы ${icon('up',16)}</a>`)}<div class="works-grid">${cards.map((w,i)=>workCard(b,w,i)).join('')}</div></section><dialog id="gallery-dialog" aria-labelledby="dialog-title"><div class="dialog-head"><h2 id="dialog-title">Фотографии проекта</h2><button class="round" data-close aria-label="Закрыть фотографии">${icon('close')}</button></div><div id="dialog-photos"></div><div class="dialog-foot"><a class="button button-dark" id="similar-project" href="${b}smeta/">Хочу такой ремонт ${icon('up',15)}</a><div id="dialog-nav"><button type="button" class="round" data-project-step="-1" aria-label="Предыдущий проект">${icon('left',16)}</button><span id="dialog-counter"></span><button type="button" class="round" data-project-step="1" aria-label="Следующий проект">${icon('right',16)}</button></div></div></dialog>`;
}
function servicesBlock(b) {
  return `<section id="uslugi" class="services-section"><div class="wrap services-layout"><div>${eyebrow('Услуги')}<h2>Какой ремонт<br><em>вам нужен?</em></h2></div><div class="service-list">${services.map(s=>`<a href="${b}${s.slug}/"><span>${esc(s.h1)}</span><i>${icon('up',20)}</i></a>`).join('')}</div></div></section>`;
}
function process() {
  const steps=[['Замер квартиры','Инженер осмотрит квартиру и обсудит с вами планировку, отделку и пожелания по материалам.'],['Смета и договор','Согласуем перечень работ по помещениям, бюджет и последовательность этапов.'],['Работы и приёмка','Прораб ведёт объект. Вы принимаете выполненные этапы и оплачиваете их по договору.']];
  return `<section id="process" class="wrap content-section process">${heading('Процесс','Как проходит <em>ремонт</em>')}<div class="steps">${steps.map(([t,d],i)=>`<article><span class="step-index">0${i+1}</span><h3>${t}</h3><p>${d}</p></article>`).join('')}</div></section>`;
}
function contactBand(b) {
  return `<section class="wrap contact-wrap"><div class="contact-band"><div>${eyebrow('Бесплатный замер')}<h2>Обсудим <em>ваш ремонт?</em></h2><p>Покажите план квартиры или расскажите, что хотите изменить.<br>Подскажем, с чего начать, и договоримся о замере.</p></div><div class="contact-actions">${calculator(b,'button button-green')}${telegram('light-link')}</div></div></section>`;
}
function crumbs(b,name) {
  return `<nav class="crumbs" aria-label="Хлебные крошки"><a href="${b}">Главная</a><span aria-hidden="true">/</span><span aria-current="page">${esc(name)}</span></nav>`;
}
function servicePage(b,s,i) {
  const photo=heroes[(i+1)%heroes.length];
  return `<div class="wrap">${crumbs(b,s.short)}<section class="service-hero"><div>${eyebrow('Москва и Московская область')}<h1>${esc(s.h1)}</h1><p>${esc(s.intro)}</p>${calculator(b,'button button-dark')}</div><figure>${img(b,photo.image,photo.title,'',true)}<figcaption>${esc(photo.title)}</figcaption></figure></section>${benefits()}</div><section class="wrap content-section scope"><div>${eyebrow('Состав работ')}<h2>Что входит<br><em>в ремонт</em></h2></div><ul>${s.scope.map(item=>`<li>${icon('check',19)}<span>${esc(item)}</span></li>`).join('')}</ul></section><section class="faq-section"><div class="wrap scope"><div>${eyebrow('Перед началом')}<h2>Частые<br><em>вопросы</em></h2></div><div>${s.faq.map(([q,a])=>`<details><summary>${esc(q)}${icon('plus',18)}</summary><p>${esc(a)}</p></details>`).join('')}</div></div></section>${contactBand(b)}`;
}
function contactPage(b) {
  return `<div class="wrap">${crumbs(b,'Контакты')}<section class="contact-page"><div>${eyebrow('Larsson')}<h1>Обсудим<br><em>ваш ремонт?</em></h1><p>Работаем в Москве и Московской области. Расскажите, в каком состоянии квартира, и договоритесь о бесплатном замере.</p></div><div class="contact-sheet"><h2>Связаться с нами</h2>${phone('contact-number')}<p>${esc(site.hours)}</p><p class="office-address">Москва, бульвар Энтузиастов, 2. БЦ «Golden Gate», 24 этаж, офис 17.<br><a class="section-link" href="${esc(site.map)}">На Яндекс Картах ${icon('up',14)}</a></p>${telegram('button button-dark')}${calculator(b,'section-link')}<a href="mailto:${esc(site.email)}" data-action="email">${esc(site.email)}</a></div></section></div>`;
}
function make(slug,title,description,render,extra={}) {
  const b=slug?'../':'./';
  const canonical=pageUrl(slug);
  const org={'@type':'HomeAndConstructionBusiness','@id':pageUrl('')+'#organization',name:'Larsson',telephone:site.phoneHref,url:pageUrl(''),areaServed:['Москва','Московская область']};
  const graph=[org,{'@type':'WebPage',url:canonical,name:title,description,inLanguage:'ru',isPartOf:{'@type':'WebSite',url:pageUrl(''),name:'Larsson'}}];
  if(extra.service)graph.push({'@type':'Service',name:extra.service,provider:{'@id':org['@id']},areaServed:'Москва и Московская область'});
  const html=`<!doctype html><html lang="ru" id="top" data-metrika="${esc(site.metrikaId || '')}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="theme-color" content="#f8f8f4"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="website"><meta property="og:locale" content="ru_RU"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${esc(new URL(heroes[0].image,site.publicUrl).href)}"><link rel="icon" href="${b}assets/mark.svg" type="image/svg+xml"><link rel="stylesheet" href="${b}assets/site.css"><script defer src="${b}assets/site.js"></script><script type="application/ld+json">${json({'@context':'https://schema.org','@graph':graph})}</script></head><body>${header(b)}<main id="main">${render(b)}</main>${footer(b)}</body></html>`;
  const path=resolve(root,slug,'index.html');
  mkdirSync(dirname(path),{recursive:true});writeFileSync(path,html);
}
make('','Ремонт квартир под ключ в Москве и области — Larsson','Ремонт квартир под ключ с поэтапной оплатой. Посмотрите реальные объекты Larsson, сравните фотографии и запишитесь на бесплатный замер в Москве и области.',b=>hero(b)+gallery(b)+servicesBlock(b)+process()+contactBand(b));
services.forEach((s,i)=>make(s.slug,s.h1+' в Москве — Larsson',s.description,b=>servicePage(b,s,i),{service:s.h1}));
make('portfolio','Портфолио ремонтов квартир в Москве — Larsson','Фотографии квартир до и после ремонта и готовые интерьеры Larsson. Откройте изображения, чтобы рассмотреть детали отделки.',b=>`<div class="wrap">${crumbs(b,'Портфолио')}<header class="page-heading">${eyebrow('Наши работы')}<h1>Портфолио <em>ремонтов</em></h1><p>Сравните, как менялись квартиры, и откройте фотографии, чтобы рассмотреть отделку в деталях.</p></header></div>`+gallery(b,true)+contactBand(b));
make('kontakty','Контакты Larsson — ремонт квартир в Москве и области','Свяжитесь с Larsson по телефону, электронной почте или в Telegram. Запись на замер квартиры в Москве и Московской области.',contactPage);
make('smeta','Рассчитать стоимость ремонта квартиры — Larsson','Расскажите о квартире и запросите смету у Larsson. Бесплатный замер в Москве и области. Можно обсудить ремонт в WhatsApp или по телефону.',base=>estimatePage({base,site,crumbs,eyebrow,icon,esc}));
const slugs=['',...services.map(s=>s.slug),'portfolio','kontakty','smeta'];
writeFileSync(resolve(root,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+slugs.map(s=>`<url><loc>${esc(pageUrl(s))}</loc></url>`).join('')+'</urlset>\n');
writeFileSync(resolve(root,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+new URL('sitemap.xml',site.publicUrl).href+'\n');
writeFileSync(resolve(root,'.nojekyll'),'');

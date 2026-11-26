import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = name => JSON.parse(readFileSync(resolve(root, name), 'utf8'));
const site = read('site.json');
const services = read('services.json');
const projects = read('projects.json');
const works = read('works.json').filter(w => w.before && w.after);
const content = read('content-verified.json');
const team = read('team.json');
const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const safeJson = value => JSON.stringify(value).replaceAll('<', '\\u003c');
const money = value => new Intl.NumberFormat('ru-RU').format(value);
const pageUrl = slug => new URL(slug ? slug + '/' : '', site.publicUrl).href;
const pagePaths = [];
const icons = {
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  diagonal: '<path d="M5 19 19 5M5 5h14v14"/>',
  phone: '<path d="m7 3 3 5-3 2a13 13 0 0 0 7 7l2-3 5 3v3c0 1-1 1-2 1C10 20 4 14 3 5c0-1 0-2 1-2h3Z"/>',
  pin: '<path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z"/><circle cx="12" cy="10" r="2"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  document: '<path d="M5 3h9l5 5v13H5V3Zm9 0v6h5M8 13h8m-8 4h6"/>',
  shield: '<path d="m12 2 8 3v6c0 5-4 9-8 11-4-2-8-6-8-11V5l8-3Z"/><path d="m8 12 3 3 5-6"/>',
  layers: '<path d="m3 7 9-5 9 5-9 5-9-5Zm0 5 9 5 9-5M3 17l9 5 9-5"/>',
  tool: '<path d="m14 4 3 3 4-4c1 5-3 8-7 7L5 20l-3-3 10-9c-1-4 2-8 7-7l-5 3Z"/>',
  wallet: '<rect x="3" y="6" width="18" height="14" rx="2"/><path d="m5 6 11-3v3m5 5h-6v5h6"/><circle cx="17.5" cy="13.5" r=".5"/>',
  ruler: '<path d="m4 17 13-13 4 4L8 21l-4-4Zm3-3 2 2m1-5 2 2m1-5 2 2m1-5 2 2"/>',
  home: '<path d="m3 10 9-7 9 7M5 9v12h14V9M9 21v-8h6v8"/>',
  bulb: '<path d="M9 18h6m-6 3h6M8 13a6 6 0 1 1 8 0c-1 1-1 2-1 3H9c0-1 0-2-1-3Z"/>',
  water: '<path d="M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13Z"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="m5 5 14 14M19 5 5 19"/>',
  plus: '<path d="M4 12h16M12 4v16"/>',
  compare: '<path d="m7 8-4 4 4 4m10-8 4 4-4 4M12 3v18"/>',
  expand: '<path d="M15 3h6v6m0-6-6 6M9 21H3v-6m0 6 6-6"/>'
};
const icon = (name, size = 22) => `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icons[name]}</svg>`;
const image = (b, source, alt, cls = '', eager = false) => `<img src="${b}${esc(source)}" alt="${esc(alt)}" class="${cls}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager ? ' fetchpriority="high"' : ''}>`;
const quote = (label = 'Рассчитать стоимость', cls = 'btn btn-primary', service = '') => `<button type="button" class="${cls} js-quote" data-service="${esc(service)}" data-action="estimate">${label}${icon('arrow', 18)}</button>`;
const phone = cls => `<a class="${cls}" href="tel:${esc(site.phoneHref)}" data-action="phone">${esc(site.phone)}</a>`;
const kicker = text => `<p class="kicker">${esc(text)}</p>`;
const heading = (label, title, description = '', action = '') => `<div class="section-head"><div>${kicker(label)}<h2>${title}</h2>${description ? `<p>${description}</p>` : ''}</div>${action}</div>`;

function header(b) {
  return `<a class="skip-link" href="#main">Перейти к содержанию</a><div class="topbar"><div class="container topbar-inner"><span>${icon('pin',14)} Москва и Московская область</span><a href="${esc(site.map)}" target="_blank" rel="noopener">Шоурум на м. Римская</a><span>Ежедневно с 9:00 до 22:00</span></div></div><header class="site-header"><div class="container header-inner"><a class="brand" href="${b}" aria-label="Larsson — главная">${image(b,'assets/logo.svg','Larsson')}<span class="brand-copy">Дизайн и ремонт квартир<br>с 2018 года</span></a><nav class="main-nav" id="main-nav" aria-label="Основная навигация"><a href="${b}#stoimost">Ремонт и цены</a><a href="${b}portfolio/">Наши работы</a><a href="${b}#process">Как работаем</a><a href="${b}#reviews">Отзывы</a><a href="${b}kontakty/">Контакты</a></nav><div class="header-contact">${phone('phone')}<button class="callback-link js-quote" type="button">Обсудить ремонт</button></div><button class="menu-toggle" type="button" aria-expanded="false" aria-controls="main-nav" aria-label="Открыть меню">${icon('menu')}</button></div></header>`;
}

function footer(b) {
  return `<footer class="site-footer"><div class="container footer-main"><div class="footer-brand"><a href="${b}" aria-label="Larsson — главная">${image(b,'assets/logo.svg','Larsson')}</a><p>Дизайн, комплектация<br>и ремонт квартир под ключ.</p></div><nav class="footer-nav" aria-label="Услуги">${services.map(s=>`<a href="${b}${s.slug}/">${esc(s.h1)}</a>`).join('')}</nav><div class="footer-contact">${phone('phone')}<span>Ежедневно с 9:00 до 22:00</span><a href="mailto:${esc(site.email)}" data-action="email">${esc(site.email)}</a><a href="${esc(site.telegram)}" target="_blank" rel="noopener" data-action="telegram">Написать в Telegram ${icon('diagonal',14)}</a></div></div><div class="container footer-bottom"><span>© ${new Date().getFullYear()} Larsson · ООО «ЛАРССОН», ИНН 9705148482</span><a href="https://larsson-remont.ru/politica/" target="_blank" rel="noopener">Политика конфиденциальности</a><span>Стоимость рассчитывается индивидуально.</span></div></footer><div class="mobile-bar"><a href="tel:${esc(site.phoneHref)}" data-action="phone">${icon('phone',18)}Позвонить</a>${quote('Узнать стоимость')}</div>`;
}

function trust() {
  const items = [['ruler','Бесплатный замер','Смета по вашей квартире'],['wallet','Поэтапная оплата','После приёмки работ'],['document','Работаем по договору','Согласуем состав и сроки'],['shield','Гарантия на работы','Условия — в договоре']];
  return `<div class="container trust-strip">${items.map(([i,t,d])=>`<div class="trust-item">${icon(i,27)}<div><strong>${t}</strong><span>${d}</span></div></div>`).join('')}</div>`;
}

const heroCopy = {
  'remont-kvartiry-pod-klyuch': ['Ремонт квартир','под ключ в Москве','Один подрядчик на весь ремонт — от подготовки квартиры и инженерных работ до чистовой отделки и комплектации.'],
  'remont-v-novostroyke': ['Ремонт квартиры','в новостройке','Для квартиры без отделки и White Box. Подготовим основания, смонтируем инженерные системы и выполним чистовую отделку.'],
  'remont-vtorichnogo-zhilya': ['Новая жизнь','вашей квартиры','Ремонт вторичного жилья в Москве. От демонтажа и замены коммуникаций до готовой отделки по вашему плану.'],
  'kapitalnyy-remont-kvartiry': ['Капитальный ремонт','квартиры в Москве','Обновим основания и инженерные системы, согласуем скрытые работы и выполним отделку по этапам.'],
  'dizaynerskiy-remont-kvartiry': ['Дизайнерский ремонт','вашей квартиры','Воплотим интерьер по проекту — с рабочими чертежами, продуманным светом, подбором отделки и комплектацией.']
};
function hero(b, service) {
  const copy = service ? heroCopy[service.slug] : ['Ремонт квартир','под ключ в Москве','От первого замера до готовой квартиры. Возьмём на себя работы, закупку материалов и контроль каждого этапа.'];
  const p = service?.slug === 'dizaynerskiy-remont-kvartiry' ? projects[0] : projects[1];
  return `<section class="hero container"><div class="hero-grid"><div class="hero-content">${kicker('Москва и Московская область')}<h1>${copy[0]}<br><span class="accent">${copy[1]}</span></h1><p class="hero-intro">${copy[2]}</p><ul class="hero-checks"><li>${icon('check',18)}Согласуем смету и график до начала работ</li><li>${icon('check',18)}Оплата после приёмки выполненных этапов</li><li>${icon('check',18)}Прораб отвечает за организацию ремонта</li></ul><div class="hero-actions"><a class="btn btn-primary" href="#raschet" data-action="calculator">Рассчитать стоимость ${icon('arrow',18)}</a><a class="btn btn-secondary" href="#projects">Посмотреть работы</a></div><p class="hero-note">${icon('ruler',16)}Выезд инженера и замер — бесплатно</p></div><figure class="hero-visual">${image(b,p.images[0],p.imageAlts[0],'hero-image',true)}<figcaption class="project-caption"><div><span>Реальный проект Larsson</span><strong>${esc(p.title)} · ${p.area} м²</strong></div><a href="#projects" aria-label="Посмотреть проекты">${icon('diagonal',22)}</a></figcaption></figure></div></section>${trust()}`;
}

function prices(b) {
  const slugs = ['remont-v-novostroyke','remont-vtorichnogo-zhilya','dizaynerskiy-remont-kvartiry'];
  return `<section class="section container" id="stoimost">${heading('Ремонт и стоимость','Подберём ремонт под вашу квартиру','Площадь, состояние квартиры и уровень отделки определяют бюджет. Сравните состав работ и ориентиры стоимости.')}<div class="pricing-grid">${content.pricing.cards.map((c,i)=>`<article class="price-card${i===1?' featured':''}"><span class="price-card-label">${esc(c.level)}</span><h3>${['Ремонт в новостройке','Ремонт вторички','Дизайнерский ремонт'][i]}</h3><div class="price"><strong>${money(c.minimum/1000)}–${money(c.maximum/1000)} тыс. ₽</strong><span>за м² · работы</span></div><ul class="price-scope">${c.scope.map(t=>`<li>${icon('check',16)}${esc(t)}</li>`).join('')}</ul>${quote('Рассчитать мою квартиру',i===1?'btn btn-primary':'btn btn-secondary',c.title)}<a class="text-link price-foot" href="${b}${slugs[i]}/">Подробнее о ремонте ${icon('diagonal',15)}</a></article>`).join('')}</div><p class="pricing-note">Ориентиры Larsson для квартиры 60 м². Материалы, дизайн-проект и комплектация рассчитываются отдельно. Точная стоимость и сроки — после замера и согласования состава работ.</p></section>`;
}

function budget(b, service = '') {
  return `<section class="budget-section" id="raschet"><div class="container budget-grid"><div class="budget-intro">${kicker('Стоимость ремонта')}<h2>Узнайте бюджет<br>вашего ремонта</h2><p>Выберите параметры квартиры, чтобы увидеть предварительный ориентир. Для подробной сметы запишитесь на бесплатный замер.</p><div class="budget-expert">${image(b,team.engineer.image,team.engineer.alt)}<div><strong>${esc(team.engineer.name)}</strong><span>${esc(team.engineer.role)}</span></div></div></div><form class="budget-form" id="budget-form"><fieldset class="object-choice"><legend>Какая у вас квартира?</legend><label><input type="radio" name="property" value="novostroyka"${service==='remont-vtorichnogo-zhilya'?'':' checked'}><span>Новостройка</span></label><label><input type="radio" name="property" value="vtorichka"${service==='remont-vtorichnogo-zhilya'?' checked':''}><span>Вторичка</span></label></fieldset><div class="budget-fields"><label class="input-label" for="budget-area">Площадь квартиры, м²<input id="budget-area" name="area" type="number" min="15" max="250" step="1" value="60" inputmode="numeric" required></label><label class="input-label" for="budget-level">Уровень ремонта<select id="budget-level" name="level"><option value="comfort">Комфорт</option><option value="premium"${service==='dizaynerskiy-remont-kvartiry'?' selected':''}>Премиум</option></select></label></div><label class="range-label" for="budget-range">Площадь от 15 до 250 м²</label><input id="budget-range" type="range" min="15" max="250" value="60" aria-label="Площадь квартиры в квадратных метрах"><div class="budget-result" aria-live="polite" aria-atomic="true"><span>Предварительно за работы</span><strong><span id="budget-low">1 200 000 ₽</span> — <span id="budget-high">2 100 000 ₽</span></strong></div><button type="submit" class="btn btn-primary">Получить подробную смету ${icon('arrow',18)}</button><p class="budget-disclaimer">Пропорциональный расчёт по тарифам для 60 м². Состав работ и состояние квартиры могут изменить стоимость. Материалы — отдельно.</p><noscript><a class="text-link" href="${site.calculator}">Открыть калькулятор Larsson</a></noscript></form></div></section>`;
}

function projectCard(b, p) {
  const index = projects.indexOf(p);
  return `<article class="project-card" data-area="${p.area}"><button type="button" class="project-cover js-project" data-project="${index}" aria-label="Посмотреть проект — ${esc(p.title)}">${image(b,p.images[0],p.imageAlts[0])}<span class="project-count">${icon('expand',16)} ${p.images.length} фото</span></button><div class="project-info"><div class="project-title-row"><h3><a href="${b}proekt-${p.slug}/">${esc(p.title)}</a></h3><span class="project-area">${p.area} м²</span></div><p class="project-meta">${esc(p.location)} · ${esc(p.type)}</p>${p.price?`<p class="project-case-price">Смета объекта ${money(p.price)} ₽ · ${p.duration} дней</p>`:''}<button type="button" class="text-link js-project" data-project="${index}">Смотреть проект ${icon('arrow',17)}</button></div></article>`;
}
function portfolio(b, full = false) {
  return `<section class="section container" id="projects">${full?'':heading('Портфолио','Наши завершённые ремонты','Фотографии завершённых объектов Larsson. Откройте проект, чтобы рассмотреть отделку, свет и детали.',`<a class="text-link" href="${b}portfolio/">Все проекты ${icon('diagonal',18)}</a>`)}<div class="portfolio-tools"><div class="filter-buttons" role="group" aria-label="Фильтр по площади"><button type="button" data-filter="all" aria-pressed="true">Все квартиры</button><button type="button" data-filter="compact" aria-pressed="false">До 60 м²</button><button type="button" data-filter="spacious" aria-pressed="false">Более 60 м²</button></div><span id="project-result-count">${projects.length} проекта</span></div><div class="projects-grid">${projects.map(p=>projectCard(b,p)).join('')}</div></section>`;
}
function comparisons(b) {
  return `<section class="section compare-section"><div class="container">${heading('Было / стало','Посмотрите, как меняется квартира','Реальные фотографии на разных этапах. Потяните разделитель, чтобы сравнить результат.')}<div class="compare-grid">${works.slice(0,2).map((w,i)=>`<article class="comparison-card" id="comparison-${i}"><div class="comparison" style="--position:50%">${image(b,w.after,w.afterAlt,'compare-after')}${image(b,w.before,w.beforeAlt,'compare-before')}<span class="compare-label before">${esc(w.beforeLabel)}</span><span class="compare-label after">${esc(w.afterLabel)}</span><span class="compare-handle" aria-hidden="true">${icon('compare',23)}</span><input class="compare-range" type="range" min="0" max="100" value="50" aria-label="Сравнить фотографии — ${esc(w.title)}"></div><div class="comparison-title"><h3>${esc(w.title)}</h3><button class="round-button js-compare" data-compare="${i}" type="button" aria-label="Открыть фотографии целиком">${icon('expand',18)}</button></div><p>${esc(w.note)}</p></article>`).join('')}</div></div></section>`;
}
function included() {
  const items = [
    ['home','Подготовка квартиры','Демонтаж отделки, перегородки и подготовка оснований под согласованный проект.'],
    ['bulb','Электрика и свет','Расположение розеток, выводы под технику, линии питания и сценарии освещения.'],
    ['water','Сантехника','Разводка воды и канализации, гидроизоляция и установка сантехнического оборудования.'],
    ['layers','Черновая отделка','Выравнивание стен и пола, подготовка поверхностей под выбранную отделку.'],
    ['tool','Чистовая отделка','Плитка, напольные покрытия, покраска или обои, потолки, двери и плинтусы.'],
    ['document','Комплектация','Поможем подобрать материалы в шоуруме и организовать их закупку и доставку.']
  ];
  return `<section class="section container" id="included">${heading('Состав ремонта','Весь ремонт — у одной команды','Перечень работ согласуем по вашей квартире. Каждую позицию включаем в смету.')}<div class="included-grid">${items.map(([i,t,d])=>`<article>${icon(i,28)}<h3>${t}</h3><p>${d}</p></article>`).join('')}</div></section>`;
}
function serviceScope(service) {
  return `<section class="section container" id="included">${heading('Состав работ','Что учтём в вашей квартире',esc(service.intro))}<div class="included-grid service-scope">${service.scope.map((text,i)=>`<article>${icon(['ruler','document','tool','check'][i%4],28)}<p>${esc(text)}</p></article>`).join('')}</div></section>`;
}
function process() {
  return `<section class="section process-section" id="process"><div class="container">${heading('Как работаем','От замера до приёмки квартиры','До начала работ согласуем состав ремонта, бюджет и план-график. Прораб организует работы на объекте.')}<div class="process-grid">${content.process.map((s,i)=>`<article><span class="step-number">${i+1}</span><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></article>`).join('')}</div><a class="text-link contract-link" href="${esc(content.evidence.contractUrl)}" target="_blank" rel="noopener">${icon('document',18)}Посмотреть образец договора ${icon('diagonal',15)}</a></div></section>`;
}
function company(b) {
  return `<section class="section container"><div class="company-grid"><figure class="company-photo">${image(b,team.master.image,team.master.alt)}<figcaption><strong>${esc(team.master.name)}</strong><span>${esc(team.master.role)} Larsson</span></figcaption></figure><div class="company-copy">${kicker('Команда Larsson')}<h2>Берём организацию<br>ремонта на себя</h2><p>С 2018 года делаем ремонт квартир в Москве и области. На объекте работает бригада мастеров, а за последовательность работ и приёмку этапов отвечает прораб.</p><ul class="company-points"><li>${icon('check',19)}Состав работ и порядок оплаты — в договоре</li><li>${icon('check',19)}Дополнительные работы согласуем отдельно</li><li>${icon('check',19)}Гарантийные условия зависят от вида работ</li></ul>${quote('Обсудить мой ремонт','btn btn-dark')}</div></div></section>`;
}
function reviews() {
  const sources = [['yandex-logo','Я','Яндекс Карты','https://yandex.com/maps/org/larsson/116510795227/reviews/','Отзывы о ремонте, фотографии и впечатления заказчиков'],['gis-logo','2ГИС','2ГИС','https://2gis.ru/moscow/firm/70000001043179911/tab/reviews','Мнения клиентов и информация о компании Larsson']];
  return `<section class="section reviews-section" id="reviews"><div class="container">${heading('Отзывы о Larsson','Узнайте о ремонте у наших клиентов','Посмотрите отзывы на независимых площадках — с фотографиями и ответами компании.')}<div class="reviews-grid">${sources.map(([c,l,t,u,d])=>`<a class="review-source" href="${u}" target="_blank" rel="noopener"><span class="review-source-logo ${c}">${l}</span><div><h3>${t}</h3><p>${d}</p><span class="text-link">Читать отзывы ${icon('diagonal',18)}</span></div></a>`).join('')}</div></div></section>`;
}
function faq(service) {
  const items = service ? services.find(s=>s.slug===service).faq.map(([q,a])=>({q,a})) : content.faq;
  return `<section class="section container"><div class="faq-grid"><div class="faq-intro">${kicker('До начала ремонта')}<h2>Ответы на<br>ваши вопросы</h2><p>Обсудите детали вашей квартиры со специалистом.</p>${quote('Задать вопрос','text-link')}</div><div class="faq-list">${items.map(x=>`<details><summary>${esc(x.q)}${icon('plus',20)}</summary><p>${esc(x.a)}</p></details>`).join('')}</div></div></section>`;
}
function contacts(b) {
  return `<section class="section contact-section" id="contacts"><div class="container contact-grid"><figure class="showroom-photo">${image(b,team.showroom.image,team.showroom.alt)}<figcaption>Шоурум отделочных материалов Larsson</figcaption></figure><div class="contact-card">${kicker('Приходите знакомиться')}<h2>Обсудим ремонт<br>в нашем шоуруме</h2><p>Посмотрите материалы вживую, задайте вопросы инженеру и расскажите, каким вы видите будущий интерьер.</p><address>${icon('pin',20)}<span>Москва, бульвар Энтузиастов, 2<br>БЦ Golden Gate, 24 этаж, офис 17<br><small>Метро Римская / Площадь Ильича</small></span></address><div class="contact-links">${phone('phone')}<a href="mailto:${site.email}" data-action="email">${esc(site.email)}</a></div><p class="contact-hours">${esc(site.hours)}</p><div class="contact-buttons">${quote('Записаться на встречу')}<a class="text-link" href="${esc(site.map)}" target="_blank" rel="noopener">Как добраться ${icon('diagonal',16)}</a></div></div></div></section>`;
}
function quoteModal() {
  return `<dialog id="quote-dialog" aria-labelledby="quote-title"><div class="quote-dialog-inner"><div class="dialog-header"><div><span class="kicker">Бесплатный расчёт</span><h2 id="quote-title">Рассчитаем ремонт вашей квартиры</h2></div><button type="button" class="close-dialog round-button" data-close-dialog aria-label="Закрыть расчёт">${icon('close')}</button></div><div class="quote-loading" role="status">Загружаем калькулятор Larsson…</div><iframe class="quote-frame" data-src="https://quiz.marquiz.ru/63ea2ab4ad7b370042c779b7" title="Калькулятор стоимости ремонта Larsson" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe><a class="quote-fallback" href="https://quiz.marquiz.ru/63ea2ab4ad7b370042c779b7" target="_blank" rel="noopener">Открыть расчёт в отдельной вкладке ${icon('diagonal',14)}</a></div></dialog>`;
}
function galleries() {
  return `<dialog id="project-dialog" aria-labelledby="gallery-title"><div class="dialog-header"><h2 class="gallery-title" id="gallery-title">Фотографии проекта</h2><button type="button" class="close-dialog round-button" data-close-dialog aria-label="Закрыть проект">${icon('close')}</button></div><div class="gallery-layout"><div><div class="gallery-main"><img class="gallery-photo" alt=""><button class="round-button gallery-prev" type="button" aria-label="Предыдущее фото">${icon('back',20)}</button><button class="round-button gallery-next" type="button" aria-label="Следующее фото">${icon('arrow',20)}</button><span class="gallery-counter" aria-live="polite"></span></div><div class="gallery-thumbs" aria-label="Фотографии проекта"></div></div><div class="gallery-side"><span class="gallery-area"></span><p class="gallery-description"></p><button type="button" class="btn btn-primary js-quote">Хочу такой ремонт ${icon('arrow',16)}</button></div></div></dialog><dialog id="compare-dialog" aria-label="Фотографии до и после отделки"><div class="dialog-header"><h2>Было и стало</h2><button class="round-button close-dialog" data-close-dialog type="button" aria-label="Закрыть фотографии">${icon('close')}</button></div><div class="compare-full"></div></dialog><script type="application/json" id="project-data">${safeJson(projects)}</script>`;
}
function crumbs(b, title) {
  return `<nav class="breadcrumb container" aria-label="Хлебные крошки"><a href="${b}">Главная</a><span>/</span><span aria-current="page">${esc(title)}</span></nav>`;
}
function projectPage(b, p) {
  const index = projects.indexOf(p);
  return crumbs(b,p.title)+`<section class="section container project-detail-hero">${heading('Реальный проект Larsson',esc(p.title),`${p.area} м² · ${esc(p.location)} · ${esc(p.type)}`)}<button type="button" class="project-detail-cover js-project" data-project="${index}" aria-label="Открыть фотографии проекта">${image(b,p.images[0],p.imageAlts[0],'',true)}<span>Открыть все фотографии ${icon('expand',18)}</span></button><div class="project-details-grid"><div><h2>О проекте</h2><p>${esc(p.description)}</p></div><div><h3>Что можно рассмотреть</h3><ul>${p.scope.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>${p.price?`<p class="project-cost">Смета объекта — ${money(p.price)} ₽<br>Срок реализации — ${p.duration} дней</p><small>${esc(p.priceNote)}</small>`:''}</div></div><div class="project-full-gallery">${p.images.slice(1).map((src,i)=>`<button class="js-project" type="button" data-project="${index}" data-photo="${i+1}" aria-label="Увеличить фото ${i+2}">${image(b,src,p.imageAlts[i+1])}</button>`).join('')}</div></section>`+budget(b);
}
function make(slug, title, description, render, options = {}) {
  const b = slug ? '../' : './';
  const canonical = pageUrl(slug);
  const graph = [
    {'@type':'HomeAndConstructionBusiness','@id':pageUrl('')+'#company',name:'Larsson',url:pageUrl(''),telephone:site.phoneHref,email:site.email,areaServed:['Москва','Московская область'],address:{'@type':'PostalAddress',streetAddress:'бульвар Энтузиастов, 2',addressLocality:'Москва',addressCountry:'RU'}},
    {'@type':'WebPage',name:title,description,url:canonical,inLanguage:'ru',isPartOf:{'@type':'WebSite',name:'Larsson',url:pageUrl('')}}
  ];
  if(options.service)graph.push({'@type':'Service',name:options.service,provider:{'@id':pageUrl('')+'#company'},areaServed:'Москва и Московская область'});
  let body = render(b);
  if (!body.includes('<h1')) body = body.replace('<h2>', '<h1 class="page-title">').replace('</h2>', '</h1>');
  const html = `<!doctype html><html lang="ru" data-metrika="${esc(site.metrikaId || '')}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#183d55"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><link rel="canonical" href="${esc(canonical)}"><meta property="og:type" content="website"><meta property="og:locale" content="ru_RU"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${new URL(projects[1].images[0],site.publicUrl).href}"><link rel="icon" type="image/svg+xml" href="${b}assets/mark.svg"><link rel="preload" as="font" type="font/woff2" href="${b}assets/fonts/golos-regular.woff2" crossorigin><link rel="stylesheet" href="${b}assets/site.css"><script src="${b}assets/site.js" defer></script><script type="application/ld+json">${safeJson({'@context':'https://schema.org','@graph':graph})}</script></head><body data-base="${b}">${header(b)}<main id="main">${body}</main>${footer(b)}${quoteModal()}${galleries()}</body></html>`;
  const target = resolve(root,slug,'index.html');
  mkdirSync(dirname(target),{recursive:true});
  writeFileSync(target,html);
  pagePaths.push(slug);
}

make('','Ремонт квартир под ключ в Москве — цены и проекты Larsson','Ремонт квартир в Москве и области. Цены и состав работ, реальные проекты, бесплатный замер и подробная смета. Оплата по этапам после приёмки.',b=>hero(b)+prices(b)+budget(b)+portfolio(b)+comparisons(b)+included()+process()+company(b)+reviews()+faq()+contacts(b));
services.forEach(s=>make(s.slug,s.h1+' в Москве — стоимость и проекты Larsson',s.description,b=>crumbs(b,s.h1)+hero(b,s)+prices(b)+budget(b,s.slug)+serviceScope(s)+portfolio(b)+process()+faq(s.slug)+contacts(b),{service:s.h1}));
make('portfolio','Наши работы — ремонт квартир Larsson в Москве','Завершённые ремонты квартир Larsson с фотографиями кухни, спальни, санузла и гостиной. Проекты разной площади и реальные этапы до и после отделки.',b=>crumbs(b,'Наши работы')+`<section class="container page-intro">${heading('Наши работы','Посмотрите квартиры после ремонта','Выберите близкую вам площадь и откройте фотографии проекта. Все квартиры в этой подборке — завершённые объекты Larsson.')}</section>`+portfolio(b,true)+comparisons(b)+budget(b));
make('kontakty','Контакты Larsson — ремонт квартир в Москве','Larsson. Москва, бульвар Энтузиастов, 2, БЦ Golden Gate. Запись в шоурум и на бесплатный замер, телефон и Telegram компании.',b=>crumbs(b,'Контакты')+contacts(b)+budget(b));
make('smeta','Рассчитать стоимость ремонта квартиры — Larsson','Предварительный расчёт стоимости работ, подробная смета и запись на бесплатный замер. Ремонт новостройки и вторичного жилья в Москве.',b=>crumbs(b,'Расчёт стоимости')+budget(b)+prices(b)+faq());
projects.forEach(p=>make('proekt-'+p.slug,p.title+' — ремонт '+p.area+' м² | Larsson',p.description,b=>projectPage(b,p)));
writeFileSync(resolve(root,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'+pagePaths.map(slug=>`<url><loc>${esc(pageUrl(slug))}</loc></url>`).join('')+'</urlset>\n');
writeFileSync(resolve(root,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+new URL('sitemap.xml',site.publicUrl).href+'\n');
writeFileSync(resolve(root,'.nojekyll'),'');
console.log('Built '+pagePaths.length+' pages.');

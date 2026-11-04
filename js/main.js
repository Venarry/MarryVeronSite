(function () {
  'use strict';

  var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var root = document.documentElement;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var config = window.INVITATION || {};

  /* ---------- Конверт ---------- */

  var gate = document.getElementById('gate');
  var env = document.getElementById('env');
  var main = document.getElementById('main');

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, ms); });
  }

  function play(el, frames, options) {
    return el.animate(frames, Object.assign({ easing: EASE, fill: 'forwards' }, options)).finished;
  }

  function finishOpening() {
    root.classList.remove('is-sealed');
    root.classList.add('is-open');
    main.inert = false;
    main.focus({ preventScroll: true });
    gate.remove();
  }

  function scatterPetals() {
    var box = env.getBoundingClientRect();
    var colors = ['--lav-200', '--lav-300', '--lav-400', '--lav-500'];
    for (var i = 0; i < 22; i++) {
      var petal = document.createElement('span');
      petal.className = 'petal';
      petal.style.background = 'var(' + colors[i % colors.length] + ')';
      document.body.appendChild(petal);

      var startX = box.left + box.width * (0.2 + Math.random() * 0.6);
      var startY = box.top + box.height * 0.1;
      var driftX = (Math.random() - 0.5) * window.innerWidth * 0.9;
      var peakY = startY - 60 - Math.random() * 160;
      var endY = window.innerHeight + 40;
      var spin = 240 + Math.random() * 520;
      var anim = petal.animate([
        { transform: 'translate(' + startX + 'px,' + startY + 'px) rotate(0deg)', opacity: 0 },
        { transform: 'translate(' + (startX + driftX * 0.35) + 'px,' + peakY + 'px) rotate(' + spin * 0.3 + 'deg)', opacity: 1, offset: 0.22 },
        { transform: 'translate(' + (startX + driftX) + 'px,' + endY + 'px) rotate(' + spin + 'deg)', opacity: 0.9 }
      ], {
        duration: 2600 + Math.random() * 1400,
        delay: Math.random() * 500,
        easing: 'cubic-bezier(.3, .15, .6, 1)',
        fill: 'both'
      });
      anim.finished.then(petal.remove.bind(petal));
    }
  }

  async function openEnvelope() {
    env.disabled = true;
    env.setAttribute('aria-busy', 'true');
    document.querySelectorAll('.gate-hint, .gate-label').forEach(function (el) {
      play(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
    });

    if (reducedMotion) {
      await play(gate, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
      finishOpening();
      return;
    }

    var flapClosed = env.querySelector('.env-flap-closed');
    var flap = env.querySelector('.env-flap');
    var card = env.querySelector('.env-card');
    var seal = env.querySelector('.env-seal');
    var height = env.offsetHeight;

    // 1. Печать трескается и падает
    await wait(60);
    play(env.querySelector('.seal-left'), [
      { transform: 'none', opacity: 1 },
      { transform: 'translate(-34%, 70%) rotate(-28deg)', opacity: 0 }
    ], { duration: 620 });
    await play(env.querySelector('.seal-right'), [
      { transform: 'none', opacity: 1 },
      { transform: 'translate(34%, 70%) rotate(24deg)', opacity: 0 }
    ], { duration: 620 });
    seal.style.visibility = 'hidden';

    // 2. Клапан поднимается: сверху конверта он вращается, половину пути лежит над письмом
    flapClosed.style.visibility = 'hidden';
    flap.style.visibility = 'visible';
    flap.style.zIndex = 5;
    var flapAnim = play(flap, [
      { transform: 'perspective(1400px) rotateX(0deg)' },
      { transform: 'perspective(1400px) rotateX(180deg)' }
    ], { duration: 900, easing: 'cubic-bezier(.5, 0, .2, 1)' });
    await wait(450);
    flap.style.zIndex = 2;
    await flapAnim;

    // 3. Письмо выезжает из кармана
    await play(card, [
      { transform: 'translateY(0)' },
      { transform: 'translateY(' + (-height * 0.66) + 'px)' }
    ], { duration: 1000 });

    scatterPetals();

    // 4. Конверт уходит вниз, письмо встаёт в центр и растворяется в странице
    var slide = [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(' + window.innerHeight + 'px)', opacity: 0 }];
    var away = [env.querySelector('.env-back'), env.querySelector('.env-pocket')].map(function (el) {
      return play(el, slide, { duration: 900, easing: 'cubic-bezier(.5, 0, .75, .4)' });
    });
    flap.style.visibility = 'hidden';

    await play(card, [
      { transform: 'translateY(' + (-height * 0.66) + 'px)' },
      { transform: 'translateY(0) scale(1.12)' }
    ], { duration: 1000 });
    await Promise.all(away);

    root.classList.add('is-open');
    play(gate.querySelector('.gate-paper'), [{ opacity: 0 }, { opacity: 1 }], { duration: 500 });
    await play(card, [{ opacity: 1, transform: 'scale(1.12)' }, { opacity: 0, transform: 'scale(1.3)' }], { duration: 700 });
    await play(gate, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
    finishOpening();
  }

  if (gate) {
    if (location.hash) {
      finishOpening();
    } else {
      main.inert = true;
      env.addEventListener('click', openEnvelope, { once: true });
    }
  }

  /* ---------- Веточки лаванды ---------- */

  function seeded(seed) {
    return function () {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  }

  function sprigMarkup(x, baseY, tall, lean, random) {
    var topX = x + lean;
    var topY = baseY - tall;
    var midX = x + lean * 0.25;
    var midY = baseY - tall * 0.55;
    var parts = ['<g class="sprig">'];
    parts.push('<path d="M' + x + ' ' + baseY + 'Q' + midX + ' ' + midY + ' ' + topX + ' ' + topY + '" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>');

    // Цветочная часть занимает верхнюю треть стебля
    var buds = 14 + Math.floor(random() * 6);
    for (var i = 0; i < buds; i++) {
      var t = 1 - (i / buds) * 0.34;
      var px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * midX + t * t * topX;
      var py = (1 - t) * (1 - t) * baseY + 2 * (1 - t) * t * midY + t * t * topY;
      var side = i % 2 ? 1 : -1;
      var size = 3 + (1 - i / buds) * 0.4 + (i / buds) * 2.4;
      var angle = side * (28 + random() * 22);
      parts.push('<ellipse cx="' + (px + side * size * 0.8).toFixed(1) + '" cy="' + py.toFixed(1) + '" rx="' + (size * 0.62).toFixed(1) + '" ry="' + (size * 1.2).toFixed(1) + '" transform="rotate(' + angle.toFixed(0) + ' ' + px.toFixed(1) + ' ' + py.toFixed(1) + ')" fill="currentColor" fill-opacity="' + (0.65 + random() * 0.35).toFixed(2) + '"/>');
    }
    // Узкий лист у основания
    var leafY = baseY - tall * (0.18 + random() * 0.14);
    var leafSide = random() > 0.5 ? 1 : -1;
    parts.push('<path d="M' + (x + lean * 0.05) + ' ' + leafY + 'q' + leafSide * 12 + ' -22 ' + leafSide * 18 + ' -46q' + leafSide * -14 + ' 16 ' + leafSide * -18 + ' 46Z" fill="currentColor" fill-opacity=".55"/>');
    parts.push('</g>');
    return parts.join('');
  }

  // Веточки качаются только пока их видно, чтобы не тратить батарею телефона
  var sprigObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      entry.target.classList.toggle('live', entry.isIntersecting);
    });
  });

  document.querySelectorAll('[data-sprigs]').forEach(function (holder, index) {
    var count = Number(holder.dataset.sprigs);
    var random = seeded(97 + index * 31);
    var markup = '<svg class="sprigs" viewBox="0 0 400 400" preserveAspectRatio="xMidYMax meet">';
    for (var i = 0; i < count; i++) {
      var x = 60 + (280 / Math.max(count - 1, 1)) * i + random() * 20 - 10;
      var tall = 190 + random() * 180;
      var lean = (x - 200) * 0.35 + random() * 40 - 20;
      markup += sprigMarkup(x, 402, tall, lean, random);
    }
    holder.innerHTML = markup + '</svg>';
    sprigObserver.observe(holder);
  });

  /* ---------- Появление при прокрутке ---------- */

  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -10% 0px' });

  document.querySelectorAll('[data-reveal]').forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ---------- Слова загораются по одному ---------- */

  var vow = document.querySelector('[data-words]');
  if (vow) {
    // Нечётные части после разбиения это сами теги <br>, их оставляем как есть
    vow.innerHTML = vow.innerHTML.split(/(<br[^>]*>)/).map(function (part, index) {
      if (index % 2) return part;
      return part.trim().split(/\s+/).map(function (word) {
        return '<span class="w">' + word + '</span>';
      }).join(' ');
    }).join(' ');

    if (!reducedMotion) {
      var queue = [];
      var ticking = false;
      var nextWord = function () {
        var word = queue.shift();
        if (!word) { ticking = false; return; }
        word.classList.add('on');
        setTimeout(nextWord, 90);
      };
      var wordObserver = new IntersectionObserver(function (entries) {
        entries.filter(function (e) { return e.isIntersecting; }).forEach(function (entry) {
          queue.push(entry.target);
          wordObserver.unobserve(entry.target);
        });
        if (queue.length && !ticking) {
          ticking = true;
          nextWord();
        }
      }, { rootMargin: '0px 0px -30% 0px', threshold: 1 });
      vow.querySelectorAll('.w').forEach(function (word) { wordObserver.observe(word); });
    }
  }

  /* ---------- Контакт ---------- */

  var contactHolder = document.querySelector('[data-contact]');
  if (contactHolder) {
    var contacts = config.contacts || [];
    contacts.forEach(function (contact) {
      var link = document.createElement('a');
      link.className = 'btn btn-outline button-sm';
      link.href = contact.url;
      if (/^https?:/.test(contact.url)) {
        link.target = '_blank';
        link.rel = 'noopener';
      }
      link.textContent = contact.label;
      contactHolder.appendChild(link);
    });
    if (!contacts.length) {
      var empty = document.createElement('span');
      empty.className = 'contact-empty';
      empty.textContent = 'Контакт появится здесь';
      contactHolder.appendChild(empty);
    }
  }

  /* ---------- Обратный отсчёт ---------- */

  function daysWord(n) {
    var tens = n % 100;
    var ones = n % 10;
    if (tens > 10 && tens < 20) return 'дней';
    if (ones === 1) return 'день';
    if (ones > 1 && ones < 5) return 'дня';
    return 'дней';
  }

  var countdown = document.getElementById('countdown');
  var daysLeft = Math.ceil((new Date(config.weddingDate) - new Date()) / 86400000);
  if (countdown && daysLeft > 0) {
    countdown.textContent = 'Осталось ' + daysLeft + ' ' + daysWord(daysLeft);
    countdown.hidden = false;
  }

  /* ---------- Анкета ---------- */

  var form = document.getElementById('rsvp-form');
  var more = document.getElementById('form-more');
  var statusBox = document.getElementById('rsvp-status');
  var submit = document.getElementById('rsvp-submit');
  var nameInput = document.getElementById('f-name');
  var nameError = document.getElementById('f-name-error');
  var attendError = document.getElementById('f-attend-error');
  var drinksOtherBox = document.getElementById('f-drinks-other-box');

  function showStatus(text, isError) {
    statusBox.textContent = text;
    statusBox.classList.toggle('is-error', Boolean(isError));
    statusBox.hidden = false;
  }

  function validate() {
    var nameOk = nameInput.value.trim().length > 1;
    var attend = form.elements.attend.value;
    nameError.hidden = nameOk;
    nameInput.setAttribute('aria-invalid', String(!nameOk));
    attendError.hidden = Boolean(attend);
    if (!nameOk) {
      nameInput.focus();
    } else if (!attend) {
      form.elements.attend[0].focus();
    }
    return nameOk && Boolean(attend);
  }

  function collect() {
    var attending = form.elements.attend.value === 'Да';
    var data = { name: nameInput.value.trim(), attend: form.elements.attend.value };
    if (attending) {
      data.guests = form.elements.guests.value.trim();
      data.drinks = Array.from(form.querySelectorAll('input[name="drinks"]:checked')).map(function (el) {
        var other = form.elements.drinksOther.value.trim();
        return el.value === 'Другое' && other ? 'Другое: ' + other : el.value;
      }).join(', ');
      data.food = form.elements.food.value.trim();
      data.song = form.elements.song.value.trim();
    }
    return data;
  }

  function showThanks(data) {
    var firstName = data.name.split(/\s+/)[0];
    var done = document.createElement('div');
    done.className = 'form-done';
    done.tabIndex = -1;
    var title = document.createElement('p');
    var text = document.createElement('p');
    text.className = 'body-3';
    if (data.attend === 'Да') {
      title.textContent = 'Спасибо, ' + firstName + '. Ответ получен.';
      text.textContent = 'Ждём вас 7 июля к 16:30 в кафе «Артист». Не забудьте про лавандовые и фиолетовые оттенки.';
    } else {
      title.textContent = 'Спасибо, что сообщили, ' + firstName + '.';
      text.textContent = 'Ответ получен. Нам будет вас не хватать.';
    }
    done.append(title, text);
    form.replaceWith(done);
    done.focus({ preventScroll: true });
  }

  if (form) {
    form.addEventListener('change', function (event) {
      if (event.target.name === 'attend') {
        more.hidden = event.target.value !== 'Да';
        attendError.hidden = true;
      }
      if (event.target.id === 'f-drinks-other-check') {
        drinksOtherBox.hidden = !event.target.checked;
        if (event.target.checked) form.elements.drinksOther.focus();
      }
    });

    nameInput.addEventListener('input', function () {
      if (nameInput.value.trim().length > 1) {
        nameError.hidden = true;
        nameInput.setAttribute('aria-invalid', 'false');
      }
    });

    form.addEventListener('submit', async function (event) {
      event.preventDefault();
      statusBox.hidden = true;
      if (!validate()) return;

      var data = collect();

      if (!config.rsvpEndpoint) {
        showStatus('Анкета пока не подключена, поэтому ответ не отправлен. Это видно только до запуска сайта.');
        return;
      }

      var label = submit.textContent;
      submit.disabled = true;
      submit.textContent = 'Отправляем…';
      // Без ограничения по времени гость при зависшей сети ждал бы бесконечно
      var aborter = new AbortController();
      var timer = setTimeout(function () { aborter.abort(); }, 25000);
      try {
        // text/plain не требует предварительного запроса и подходит для Google Apps Script
        var response = await fetch(config.rsvpEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(data),
          signal: aborter.signal
        });
        var result = await response.json();
        if (!result.ok) throw new Error('Таблица не приняла ответ');
        showThanks(data);
      } catch (error) {
        submit.disabled = false;
        submit.textContent = label;
        showStatus('Не удалось отправить анкету. Проверьте интернет и попробуйте ещё раз.', true);
      } finally {
        clearTimeout(timer);
      }
    });
  }
})();

(function () {
  'use strict';

  var EASE = 'cubic-bezier(0.22, 1, 0.36, 1)';
  var root = document.documentElement;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var config = window.INVITATION || {};

  /* ---------- Занавес ---------- */

  var gate = document.getElementById('gate');
  var main = document.getElementById('main');

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
    var colors = ['--lav-200', '--lav-300', '--lav-400', '--lav-500'];
    var centerX = window.innerWidth / 2;
    for (var i = 0; i < 24; i++) {
      var petal = document.createElement('span');
      petal.className = 'petal';
      petal.style.background = 'var(' + colors[i % colors.length] + ')';
      document.body.appendChild(petal);

      var startX = centerX + (Math.random() - 0.5) * 60;
      var startY = window.innerHeight * (0.1 + Math.random() * 0.5);
      var driftX = (Math.random() - 0.5) * window.innerWidth * 1.1;
      var endY = window.innerHeight + 40;
      var spin = 240 + Math.random() * 520;
      var anim = petal.animate([
        { transform: 'translate(' + startX + 'px,' + startY + 'px) rotate(0deg)', opacity: 0 },
        { transform: 'translate(' + (startX + driftX * 0.5) + 'px,' + (startY + 40) + 'px) rotate(' + spin * 0.3 + 'deg)', opacity: 1, offset: 0.2 },
        { transform: 'translate(' + (startX + driftX) + 'px,' + endY + 'px) rotate(' + spin + 'deg)', opacity: 0.8 }
      ], {
        duration: 2800 + Math.random() * 1600,
        delay: Math.random() * 400,
        easing: 'cubic-bezier(.3, .15, .6, 1)',
        fill: 'both'
      });
      anim.finished.then(petal.remove.bind(petal));
    }
  }

  async function openCurtain() {
    gate.disabled = true;

    if (reducedMotion) {
      root.classList.add('is-open');
      await play(gate, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
      finishOpening();
      return;
    }

    // 1. По шву между половинами пробегает свет
    await play(gate.querySelector('.gate-seam'), [
      { transform: 'scaleY(0)', opacity: 0 },
      { transform: 'scaleY(1)', opacity: 1 }
    ], { duration: 320 });

    // 2. Половины разъезжаются и собираются к краям, как настоящая ткань
    root.classList.add('is-open');
    scatterPetals();
    var slide = { duration: 1700, easing: 'cubic-bezier(.6, .02, .2, 1)' };
    play(gate.querySelector('.gate-seam'), [{ opacity: 1 }, { opacity: 0 }], { duration: 300 });
    play(gate.querySelector('.curtain-left'), [
      { transform: 'translateX(0) scaleX(1)', opacity: 1 },
      { transform: 'translateX(-30%) scaleX(.72)', opacity: 1, offset: 0.55 },
      { transform: 'translateX(-105%) scaleX(.5)', opacity: 0 }
    ], slide);
    await play(gate.querySelector('.curtain-right'), [
      { transform: 'translateX(0) scaleX(1)', opacity: 1 },
      { transform: 'translateX(30%) scaleX(.72)', opacity: 1, offset: 0.55 },
      { transform: 'translateX(105%) scaleX(.5)', opacity: 0 }
    ], slide);
    finishOpening();
  }

  if (gate) {
    if (location.hash) {
      finishOpening();
    } else {
      var left = gate.querySelector('.curtain-left');
      var right = left.cloneNode(true);
      right.className = 'curtain curtain-right';
      left.after(right);
      main.inert = true;
      gate.addEventListener('click', openCurtain, { once: true });
    }
  }

  /* ---------- Живые детали работают, только пока их видно ---------- */

  var liveObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      entry.target.classList.toggle('live', entry.isIntersecting);
    });
  });
  document.querySelectorAll('[data-live]').forEach(function (el) { liveObserver.observe(el); });

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

  function plural(n, forms) {
    var tens = n % 100;
    var ones = n % 10;
    if (tens > 10 && tens < 20) return forms[2];
    if (ones === 1) return forms[0];
    if (ones > 1 && ones < 5) return forms[1];
    return forms[2];
  }

  var timer = document.getElementById('timer');
  var weddingTime = new Date(config.weddingDate).getTime();
  var timerForms = {
    days: ['день', 'дня', 'дней'],
    hours: ['час', 'часа', 'часов'],
    minutes: ['минута', 'минуты', 'минут'],
    seconds: ['секунда', 'секунды', 'секунд']
  };

  function tick() {
    var left = Math.floor((weddingTime - Date.now()) / 1000);
    if (left <= 0) {
      timer.hidden = true;
      return;
    }
    var values = {
      days: Math.floor(left / 86400),
      hours: Math.floor(left / 3600) % 24,
      minutes: Math.floor(left / 60) % 60,
      seconds: left % 60
    };
    Object.keys(values).forEach(function (unit) {
      timer.querySelector('[data-unit="' + unit + '"]').textContent = values[unit];
      timer.querySelector('[data-label="' + unit + '"]').textContent = plural(values[unit], timerForms[unit]);
    });
    timer.hidden = false;
    setTimeout(tick, 1000);
  }

  if (timer) tick();

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

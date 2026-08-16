/**
 * Phase 5.5 interface QA. Drives a CDP-attached Chrome at 390x844 with touch
 * emulation (which bypasses the desktop QR gate) and asserts the Brilliant
 * layout contract on every recomposed surface: three bands, seamless art,
 * bottom-docked CTAs, the star progress rail, and the docked result share bar.
 *
 * Usage: start `npm run dev`, start Chrome with --remote-debugging-port=9223,
 * then `node ./scripts/qa-phase55.mjs [--reduced]`.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const endpoint = 'http://127.0.0.1:9223';
const baseUrl = 'http://127.0.0.1:5173';
const reduced = process.argv.includes('--reduced');
const outputDirectory = resolve('artifacts', reduced ? 'phase55-qa-reduced' : 'phase55-qa');
await mkdir(outputDirectory, { recursive: true });

const targets = await fetch(`${endpoint}/json/list`).then((response) => response.json());
const target = targets.find((candidate) => candidate.type === 'page');
if (!target) throw new Error('No Chrome page target is available.');

const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolveOpen, rejectOpen) => {
  socket.addEventListener('open', resolveOpen, { once: true });
  socket.addEventListener('error', rejectOpen, { once: true });
});

let sequence = 0;
const pending = new Map();
const runtimeErrors = [];
socket.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id) {
    const handler = pending.get(message.id);
    if (!handler) return;
    pending.delete(message.id);
    if (message.error) handler.reject(new Error(message.error.message));
    else handler.resolve(message.result);
    return;
  }
  if (message.method === 'Runtime.exceptionThrown') {
    runtimeErrors.push(message.params.exceptionDetails.text);
  }
  if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
    runtimeErrors.push(
      message.params.args.map((argument) => argument.value ?? argument.description ?? '').join(' '),
    );
  }
});

function command(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolveCommand, rejectCommand) => {
    pending.set(id, { resolve: resolveCommand, reject: rejectCommand });
  });
}

await command('Page.enable');
await command('Runtime.enable');
await command('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
  screenWidth: 390,
  screenHeight: 844,
});
await command('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await command('Emulation.setEmulatedMedia', {
  features: [
    { name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' },
  ],
});

const failures = [];
const report = {};
const SHELL = `(() => {
  const round = (value) => Math.round(value * 10) / 10;
  const box = (el) => {
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { x: round(b.x), y: round(b.y), w: round(b.width), h: round(b.height), bottom: round(b.bottom) };
  };
  const scene = document.querySelector('.scene');
  const body = document.querySelector('.scene__body');
  const bottom = document.querySelector('.scene__bottom');
  const header = document.querySelector('.app-header');
  return {
    scene: scene?.dataset.scene ?? null,
    headerPosition: header ? getComputedStyle(header).position : null,
    headerBox: box(header),
    sceneBox: box(scene),
    bodyBox: box(body),
    bottomBox: box(bottom),
    overflow: document.documentElement.scrollWidth - innerWidth,
    langVisible: !!document.querySelector('.app-header__language')?.offsetParent,
    brokenImages: [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.getAttribute('src')),
    ctaExpression: (() => {
      const cta = bottom?.querySelector('.button--primary');
      if (!cta) return null;
      const cs = getComputedStyle(cta, '::after');
      const own = getComputedStyle(cta);
      return {
        bg: cs.backgroundImage,
        radius: own.borderRadius,
        gap: parseFloat(own.gap),
        height: round(cta.getBoundingClientRect().height),
        afterRotate: cs.rotate,
        afterHeight: parseFloat(cs.height),
      };
    })(),
  };
})()`;

/** True when the image sits equidistant from its band's top and bottom edges. */
const CENTRED = (band, image) => `(() => {
  const b = document.querySelector(${JSON.stringify(band)});
  const i = document.querySelector(${JSON.stringify(image)});
  if (!b || !i) return null;
  const bb = b.getBoundingClientRect();
  const ib = i.getBoundingClientRect();
  return Math.abs((ib.top - bb.top) - (bb.bottom - ib.bottom)) < 1.5;
})()`;

/** The spec's `Bullet Point` is a 27px circle, not a stretched pill. */
const BULLET = (item) => `(() => {
  const el = document.querySelector(${JSON.stringify(item)});
  if (!el) return null;
  const cs = getComputedStyle(el, '::before');
  return { w: parseFloat(cs.width), h: parseFloat(cs.height), radius: cs.borderRadius };
})()`;

/** Native vs rendered aspect: equal means `cover` crops nothing. */
const ART = (selector) => `(() => {
  const round = (value) => Math.round(value * 100) / 100;
  const el = document.querySelector(${JSON.stringify(selector)});
  if (!el) return null;
  const b = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const image = el.matches('img') ? el : el.querySelector('img');
  const imageStyle = image ? getComputedStyle(image) : null;
  return {
    src: el.getAttribute('src') ?? el.querySelector('img')?.getAttribute('src') ?? null,
    natural: el.naturalWidth ? [el.naturalWidth, el.naturalHeight] : null,
    rendered: [round(b.width), round(b.height)],
    x: round(b.x),
    y: round(b.y),
    fullBleed: Math.abs(b.x) < 0.6 && Math.abs(b.width - innerWidth) < 1.2,
    mask: cs.maskImage,
    objectFit: cs.objectFit,
    opacity: cs.opacity,
    imageOpacity: imageStyle?.opacity ?? null,
    visible:
      parseFloat(cs.opacity) >= 0.99 &&
      cs.visibility !== 'hidden' &&
      (!imageStyle || (parseFloat(imageStyle.opacity) >= 0.99 && imageStyle.visibility !== 'hidden')),
  };
})()`;

const LANDING_SENSOR_TILT = `(() => {
  const event = new Event('deviceorientation');
  Object.defineProperties(event, {
    gamma: { value: 24 },
    beta: { value: 68 },
  });
  window.dispatchEvent(event);
})()`;

// --- 0 Preloader ------------------------------------------------------------
// The preloader is gone in about a second, so it is re-run deliberately with a
// slowed clock rather than raced. The seam figure is what matters: the clip's
// paper is a shade deeper than the page, and the check composites the video
// plus its wash exactly as the page does, then walks the whole perimeter of
// the box. Anything above zero means a visible rectangle is back.
await go('/');
report.preloader = await evaluate(`(async () => {
  const source = await fetch('/src/motion/preloader.ts').then((response) => response.text());
  const gsapSpecifier = source.match(/from "([^"]*gsap[^"]*)"/)[1];
  const { gsap } = await import(gsapSpecifier);
  gsap.globalTimeline.timeScale(0.02);
  const module = await import('/src/motion/preloader.ts');
  const runtime = document.querySelector('.app-runtime');
  const running = module.runExperiencePreloader(runtime, 'QA', '/motion/preloader.mp4');

  const video = document.querySelector('.experience-preloader__art');
  const stage = document.querySelector('.experience-preloader__stage');
  // Snapshot now: getComputedStyle returns a live declaration, and it reads
  // back empty once the overlay detaches, which reduced motion does at once.
  const live = getComputedStyle(video);
  const styles = {
    mixBlendMode: live.mixBlendMode,
    boxShadow: live.boxShadow,
    borderRadius: live.borderRadius,
    borderTopWidth: live.borderTopWidth,
  };
  const wash = stage ? getComputedStyle(stage, '::after').backgroundImage : '';

  // Reduced motion collapses every duration to zero, so the overlay can be gone
  // before a frame decodes. Wait only while there is still something to
  // measure, and report a null seam rather than measuring a detached box.
  const deadline = Date.now() + 1200;
  while (
    stage.isConnected
    && video.readyState < 2
    && Date.now() < deadline
  ) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  const measurable = stage.isConnected && video.readyState >= 2;
  const rect = measurable ? stage.getBoundingClientRect() : { width: 0, height: 0 };
  const width = Math.round(rect.width);
  const height = Math.round(rect.height);
  let worstEdgeDelta = null;

  if (measurable && width > 0 && height > 0) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    context.fillStyle = '#FDF2E1';
    context.fillRect(0, 0, width, height);
    context.drawImage(video, 0, 0, width, height);
    const gradient = context.createRadialGradient(
      width / 2, height / 2, 0, width / 2, height / 2, Math.min(width, height) / 2,
    );
    gradient.addColorStop(0.56, 'rgba(253,242,225,0)');
    gradient.addColorStop(0.78, 'rgba(253,242,225,0.65)');
    gradient.addColorStop(0.98, 'rgba(253,242,225,1)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    const pixels = context.getImageData(0, 0, width, height).data;
    const perimeter = [];
    for (let x = 0; x < width; x += 1) perimeter.push([x, 0], [x, height - 1]);
    for (let y = 0; y < height; y += 1) perimeter.push([0, y], [width - 1, y]);
    worstEdgeDelta = 0;
    for (const [x, y] of perimeter) {
      const index = (y * width + x) * 4;
      const delta = Math.abs(pixels[index] - 253)
        + Math.abs(pixels[index + 1] - 242)
        + Math.abs(pixels[index + 2] - 225);
      if (delta > worstEdgeDelta) worstEdgeDelta = delta;
    }
  }

  const state = {
    tag: video.tagName,
    inStage: video.parentElement.className,
    muted: video.muted,
    loop: video.loop,
    playsInline: video.playsInline,
    ariaHidden: video.getAttribute('aria-hidden'),
    autoplay: video.autoplay,
    paused: video.paused,
    readyState: video.readyState,
    currentTime: Math.round(video.currentTime * 100) / 100,
    blendMode: styles.mixBlendMode,
    boxShadow: styles.boxShadow,
    borderRadius: styles.borderRadius,
    borderWidth: styles.borderTopWidth,
    washIsGradient: /gradient/.test(wash ?? ''),
    box: [width, height],
    worstEdgeDelta,
  };
  await running;
  state.overlayRemoved = !document.querySelector('.experience-preloader');
  return state;
})()`);

// --- 1 Splash ---------------------------------------------------------------
await go('/');
await evaluate(`localStorage.removeItem('pb1.sound'); localStorage.removeItem('pb1.lang')`);
await go('/', 450, LANDING_SENSOR_TILT);
report.landing = await evaluate(`(() => {
  const round = (v) => Math.round(v * 10) / 10;
  const eyebrow = document.querySelector('.landing__eyebrow');
  const subtitle = document.querySelector('.landing__subtitle');
  const title = document.querySelector('.landing__title');
  const caption = document.querySelector('.landing__caption');
  const cs = eyebrow && getComputedStyle(eyebrow);
  const masks = [...document.querySelectorAll('.split-char-mask')];
  const descender = masks.find((m) => /[ygpj]/.test(m.textContent));
  return {
    ...${SHELL},
    art: ${ART('.landing__art')},
    eyebrowText: eyebrow?.textContent ?? null,
    eyebrowBackground: cs?.backgroundColor ?? null,
    eyebrowColor: cs?.color ?? null,
    eyebrowIsCapsule: cs ? parseFloat(cs.borderRadius) >= 20 : false,
    titleLineHeightRatio: title ? round(parseFloat(getComputedStyle(title).lineHeight) / parseFloat(getComputedStyle(title).fontSize) * 100) / 100 : null,
    maskPaddingBottom: descender ? getComputedStyle(descender).paddingBottom : null,
    subtitleWidth: subtitle ? round(subtitle.getBoundingClientRect().width) : null,
    subtitleAlign: subtitle ? getComputedStyle(subtitle).textAlign : null,
    captionText: caption?.textContent ?? null,
    timePillPresent: !!document.querySelector('.landing__time-pill'),
  };
})()`);
await capture('01-splash');

// Fresh visitors show sound on, but a mobile browser may keep the element
// paused until a trusted gesture. The first pointer interaction must start it
// without requiring a separate click on the sound toggle.
report.audioLifecycle = {
  before: await evaluate(`(() => {
    const element = document.querySelector('[data-app-music="theme"]');
    return {
      toggle: document.querySelector('.sound-toggle')?.dataset.state ?? null,
      present: !!element,
      paused: element?.paused ?? null,
      currentTime: element?.currentTime ?? null,
      preload: element?.preload ?? null,
      loop: element?.loop ?? null,
    };
  })()`),
};
await command('Input.dispatchMouseEvent', {
  type: 'mousePressed',
  x: 10,
  y: 10,
  button: 'left',
  clickCount: 1,
});
await command('Input.dispatchMouseEvent', {
  type: 'mouseReleased',
  x: 10,
  y: 10,
  button: 'left',
  clickCount: 1,
});
const audioDeadline = Date.now() + 2500;
do {
  report.audioLifecycle.after = await evaluate(`(() => {
    const element = document.querySelector('[data-app-music="theme"]');
    return {
      present: !!element,
      paused: element?.paused ?? null,
      currentTime: element?.currentTime ?? null,
      readyState: element?.readyState ?? null,
      loop: element?.loop ?? null,
    };
  })()`);
  if (report.audioLifecycle.after?.paused === false && report.audioLifecycle.after.currentTime > 0) break;
  await delay(100);
} while (Date.now() < audioDeadline);

// Header controls: both toggles are circles, and the sound glyph is centred
// inside its own viewBox (a `contain` mask centres the box, not the drawing).
report.headerControls = await evaluate(`(() => {
  const round = (v) => Math.round(v * 10) / 10;
  const ring = (selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const b = el.getBoundingClientRect();
    return { w: round(b.width), h: round(b.height), radius: getComputedStyle(el).borderRadius };
  };
  return {
    langThumb: ring('.language-switch__thumb'),
    langButton: ring('.language-switch__button'),
    soundCapsule: ring('.sound-toggle__capsule'),
  };
})()`);

report.soundGlyph = await evaluate(`(async () => {
  const out = {};
  for (const name of ['sound-on', 'sound-off']) {
    const markup = await fetch('/icons/' + name + '.svg').then((response) => response.text());
    const host = document.createElement('div');
    host.style.cssText = 'position:absolute;left:-9999px;top:0';
    host.innerHTML = markup;
    document.body.append(host);
    const box = host.querySelector('svg > g').getBBox();
    out[name] = {
      centreX: Math.round((box.x + box.width / 2) * 100) / 100,
      centreY: Math.round((box.y + box.height / 2) * 100) / 100,
    };
    host.remove();
  }
  return out;
})()`);

// --- 2 Quiz Opening --------------------------------------------------------
await go('/intro');
report.intro = await evaluate(`(() => ({
  ...${SHELL},
  art: ${ART('.intro__art')},
  artCentred: ${CENTRED('.intro__art-band', '.intro__art')},
  bulletBox: ${BULLET('.intro__point')},
  points: document.querySelectorAll('.intro__point').length,
  titleAlign: (() => { const t = document.querySelector('.intro__title'); return t ? getComputedStyle(t).textAlign : null; })(),
}))()`);
await capture('02-quiz-opening');

// --- 3 Questions: shortest, both step-down tiers, and the last one ---------
report.questions = [];
for (const question of [1, 2, 5, 10, 12]) {
  const answers = Array.from({ length: question - 1 }, (_, index) => ({
    q: index + 1,
    pole: poleForQuestion(index + 1),
  }));
  await evaluate(`sessionStorage.setItem('pb1.answers', ${JSON.stringify(JSON.stringify(answers))})`);
  await go(`/q/${question}`);
  report.questions.push(await evaluate(`(() => {
    const round = (v) => Math.round(v * 10) / 10;
    const stops = [...document.querySelectorAll('.quiz-progress__stop')];
    const label = document.querySelector('.quiz-progress__label');
    const cards = [...document.querySelectorAll('.answer-card')];
    const rail = document.querySelector('.quiz-progress__rail');
    return {
      ...${SHELL},
      id: ${question},
      art: ${ART('.question__art')},
      stops: stops.length,
      complete: stops.filter((s) => s.classList.contains('is-complete')).length,
      starImage: stops[0] ? getComputedStyle(stops[0]).backgroundImage : null,
      dimOpacity: stops.at(-1) ? getComputedStyle(stops.at(-1)).opacity : null,
      railHeight: rail ? round(rail.getBoundingClientRect().height) : null,
      labelNodes: label ? label.childNodes.length : null,
      labelNodeType: label?.firstChild?.nodeType ?? null,
      labelText: label?.textContent ?? null,
      labelColor: label ? getComputedStyle(label).color : null,
      titleFontPx: (() => {
        const t = document.querySelector('.question__title');
        return t ? Math.round(parseFloat(getComputedStyle(t).fontSize)) : null;
      })(),
      titleScale: document.querySelector('.question__title')?.dataset.scale ?? null,
      titleLines: (() => {
        const t = document.querySelector('.question__title');
        if (!t) return null;
        const cs = getComputedStyle(t);
        return Math.round(t.getBoundingClientRect().height / parseFloat(cs.lineHeight));
      })(),
      artMask: (() => {
        const a = document.querySelector('.question__art');
        return a ? getComputedStyle(a).maskImage : null;
      })(),
      // The band is the scene's background layer; the copy paints over it. This
      // is z-order, not a fade — assert the stacking rather than a gradient.
      layerOrder: (() => {
        const band = document.querySelector('.question__art-band');
        const stack = document.querySelector('.question__stack');
        const body = document.querySelector('.question__body');
        if (!band || !stack || !body) return null;
        return {
          band: getComputedStyle(band).zIndex,
          stack: getComputedStyle(stack).zIndex,
          stackPositioned: getComputedStyle(stack).position,
          isolated: getComputedStyle(body).isolation,
        };
      })(),
      // The art band spans the headline's row, so the stack must be pinned to
      // column 1 or it auto-places into an implicit second column and the whole
      // scene halves. Named explicitly: the symptom (a cropped art band) is a
      // long way from the cause.
      stackColumn: (() => {
        const s = document.querySelector('.question__stack');
        return s ? getComputedStyle(s).gridColumnStart : null;
      })(),
      stackWidth: (() => {
        const s = document.querySelector('.question__stack');
        return s ? round(s.getBoundingClientRect().width) : null;
      })(),
      changeAnswerPresent: !!document.querySelector('.question__stack .button--text, .question__bottom .button--text'),
      cards: cards.length,
      cardBottom: cards.at(-1) ? round(cards.at(-1).getBoundingClientRect().bottom) : null,
      cardRadius: cards[0] ? getComputedStyle(cards[0]).borderRadius : null,
      ctaDisabled: document.querySelector('.question__cta')?.disabled ?? null,
      ctaText: document.querySelector('.question__cta')?.textContent ?? null,
      artBottom: (() => { const a = document.querySelector('.question__art'); return a ? round(a.getBoundingClientRect().bottom) : null; })(),
      bandTop: (() => { const a = document.querySelector('.question__art-band'); return a ? round(a.getBoundingClientRect().top) : null; })(),
      railBottom: rail ? round(rail.getBoundingClientRect().bottom) : null,
      titleTop: (() => { const t = document.querySelector('.question__title'); return t ? round(t.getBoundingClientRect().top) : null; })(),
    };
  })()`));
  await capture(`03-question-${question}`);
}

// --- 3b The short-viewport case: a real phone minus its browser chrome ------
await command('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 720,
  deviceScaleFactor: 2,
  mobile: true,
  screenWidth: 390,
  screenHeight: 720,
});
await go('/q/5');
report.shortViewport = await evaluate(`(() => {
  const round = (v) => Math.round(v * 10) / 10;
  const art = document.querySelector('.question__art');
  const title = document.querySelector('.question__title');
  const cta = document.querySelector('.question__cta');
  return {
    artHeight: art ? round(art.getBoundingClientRect().height) : null,
    artBottom: art ? round(art.getBoundingClientRect().bottom) : null,
    titleTop: title ? round(title.getBoundingClientRect().top) : null,
    titleFontPx: title ? Math.round(parseFloat(getComputedStyle(title).fontSize)) : null,
    ctaBottom: cta ? round(cta.getBoundingClientRect().bottom) : null,
    artMask: art ? getComputedStyle(art).maskImage : null,
    overflow: document.documentElement.scrollWidth - innerWidth,
  };
})()`);
await capture('03-question-5-short');
await go('/q/10');
report.shortQuestion10 = await evaluate(`(() => {
  const round = (v) => Math.round(v * 10) / 10;
  const art = document.querySelector('.question__art');
  const cta = document.querySelector('.question__cta');
  return {
    artHeight: art ? round(art.getBoundingClientRect().height) : null,
    ctaBottom: cta ? round(cta.getBoundingClientRect().bottom) : null,
    overflow: document.documentElement.scrollWidth - innerWidth,
  };
})()`);
await capture('03-question-10-short');
await command('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 844,
  deviceScaleFactor: 2,
  mobile: true,
  screenWidth: 390,
  screenHeight: 844,
});

// --- Baking ----------------------------------------------------------------
await evaluate(`sessionStorage.setItem('pb1.answers', JSON.stringify(${JSON.stringify(fullAnswers())}))`);
// Well inside the 5s hold: the scene now leaves on its own, so everything the
// contract reads has to be read before it does.
await go('/baking', 900);
report.baking = await evaluate(`(() => {
  const items = [...document.querySelectorAll('.baking__marquee-item')];
  const thumbs = performance.getEntriesByType('resource').filter((r) => r.name.includes('/characters/thumbs/'));
  const full = performance.getEntriesByType('resource').filter((r) => /\\/characters\\/[a-z-]+\\.webp/.test(r.name));
  return {
    ...${SHELL},
    ovenPresent: !!document.querySelector('.calculating__oven'),
    cardPresent: !!document.querySelector('.scene-content--center'),
    rows: document.querySelectorAll('.baking__marquee').length,
    items: items.length,
    allThumbs: items.every((i) => i.getAttribute('src').includes('/characters/thumbs/')),
    uniqueThumbRequests: new Set(thumbs.map((r) => r.name)).size,
    thumbKB: Math.round(thumbs.reduce((sum, r) => sum + (r.encodedBodySize || 0), 0) / 1024),
    fullSizeRequests: full.length,
    lines: document.querySelectorAll('.loading-lines > li').length,
    sequential: !!document.querySelector('.loading-lines--sequential'),
    // One line, held still. Anything animating its opacity is the flashing the
    // sequential cross-fade used to cause.
    visibleLines: [...document.querySelectorAll('.loading-lines > li')]
      .filter((li) => parseFloat(getComputedStyle(li).opacity) > 0.5).length,
    lineFontPx: (() => {
      const li = document.querySelector('.loading-lines > li');
      return li ? Math.round(parseFloat(getComputedStyle(li).fontSize)) : null;
    })(),
    continuePresent: !!document.querySelector('.baking__continue'),
    itemPx: items[0] ? Math.round(items[0].getBoundingClientRect().height) : null,
    itemSquare: items[0]
      ? Math.abs(items[0].getBoundingClientRect().width - items[0].getBoundingClientRect().height) < 1.5
      : null,
  };
})()`);
await capture('04-baking');

// It leaves on its own, with no control to press. Polled rather than sampled at
// a fixed delay: the hold and the scene transition that follows it are separate
// clocks, and a single read lands between them.
report.bakingAdvanced = await (async () => {
  const deadline = Date.now() + 9000;
  let state;
  for (;;) {
    state = await evaluate(
      `({ path: location.pathname, scene: document.querySelector('.scene')?.dataset.scene ?? null })`,
    );
    if (state.scene === 'result' || Date.now() > deadline) return state;
    await delay(250);
  }
})();

// --- 5 Result --------------------------------------------------------------
await go('/r/pgde');
report.result = await evaluate(`(() => {
  const round = (v) => Math.round(v * 10) / 10;
  const art = document.querySelector('.result__illustration');
  const identity = document.querySelector('.result__identity');
  const code = document.querySelector('.result__code');
  const bar = document.querySelector('.result__bottom');
  const saveButton = document.querySelector('.result__save-image');
  return {
    ...${SHELL},
    artY: art ? round(art.getBoundingClientRect().y) : null,
    identityY: identity ? round(identity.getBoundingClientRect().y) : null,
    artBeforeIdentity: !!(art && identity && art.compareDocumentPosition(identity) & Node.DOCUMENT_POSITION_FOLLOWING),
    codeText: code?.textContent ?? null,
    codeBackground: code ? getComputedStyle(code).backgroundColor : null,
    sections: document.querySelectorAll('.result__section').length,
    storyTitle: document.querySelector('.result__story-title')?.textContent?.trim() ?? null,
    storyParagraphs: document.querySelectorAll('.result__story-paragraph').length,
    storyImageAfter: document.querySelector('.result__parent-story')?.dataset.storyImageAfter ?? null,
    storyChildOrder: (() => {
      const children = [...(document.querySelector('.result__story-prose')?.children ?? [])];
      return children.map((child) => child.classList.contains('result__story-figure') ? 'image' : 'paragraph');
    })(),
    supportOrder: [...document.querySelectorAll('.result__support-item')]
      .map((item) => item.dataset.supportField),
    weeklyActions: document.querySelectorAll('.result__weekly-list > li').length,
    parentFirstBeforePowers: (() => {
      const story = document.querySelector('.result__parent-story');
      const support = document.querySelector('.result__parent-support');
      const weekly = document.querySelector('.result__weekly-section');
      const powers = document.querySelector('.result__powers');
      return !!(story && support && weekly && powers
        && story.compareDocumentPosition(support) & Node.DOCUMENT_POSITION_FOLLOWING
        && support.compareDocumentPosition(weekly) & Node.DOCUMENT_POSITION_FOLLOWING
        && weekly.compareDocumentPosition(powers) & Node.DOCUMENT_POSITION_FOLLOWING);
    })(),
    softSell: !!document.querySelector('.result__soft-sell'),
    disclaimer: !!document.querySelector('.result__disclaimer'),
    chips: document.querySelectorAll('.result__chips .result__chip').length,
    chipIcons: document.querySelectorAll('.result__chips .result__chip-icon').length,
    otherTiles: document.querySelectorAll('.result__other-tile').length,
    otherHeading: document.querySelector('.result__other-types h2')?.textContent ?? null,
    otherHeadingFont: (() => {
      const h = document.querySelector('.result__other-types h2');
      return h ? Math.round(parseFloat(getComputedStyle(h).fontSize)) : null;
    })(),
    sectionHeadingFont: (() => {
      const h = document.querySelector('.result__reflection h2');
      return h ? Math.round(parseFloat(getComputedStyle(h).fontSize)) : null;
    })(),
    seeAllHeight: (() => {
      const b = document.querySelector('.result__see-all');
      return b ? round(b.getBoundingClientRect().height) : null;
    })(),
    seeAllFullWidth: (() => {
      const b = document.querySelector('.result__see-all');
      const s = document.querySelector('.result__other-strip');
      if (!b || !s) return null;
      return Math.abs(b.getBoundingClientRect().width - s.getBoundingClientRect().width) < 1.5;
    })(),
    chipRadius: (() => { const c = document.querySelector('.result__chip'); return c ? getComputedStyle(c).borderRadius : null; })(),
    // offsetWidth, not the client rect: the character's entrance tween scales it,
    // so a rect read mid-flight reports the animated size rather than the layout.
    artWidth: art ? art.offsetWidth : null,
    nameRight: (() => { const n = document.querySelector('.result__name'); return n ? round(n.getBoundingClientRect().right) : null; })(),
    nameFont: (() => { const n = document.querySelector('.result__name'); return n ? Math.round(parseFloat(getComputedStyle(n).fontSize)) : null; })(),
    bulletBox: ${BULLET('.result__power-list > li')},
    dockedAtTop: bar?.dataset.docked ?? null,
    barTransformAtTop: bar ? getComputedStyle(bar).transform : null,
    barBackground: bar ? getComputedStyle(bar).backgroundColor : null,
    barShadow: bar ? getComputedStyle(bar).boxShadow : null,
    saveButtonBackground: saveButton ? getComputedStyle(saveButton).backgroundColor : null,
    saveButtonShadow: saveButton ? getComputedStyle(saveButton).boxShadow : null,
    products: document.querySelectorAll('.result__product-card').length,
    productLinks: [...document.querySelectorAll('.result__product-card')].map((card) => card.href),
    brokenProductImages: [...document.querySelectorAll('.result__product-card img')]
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.getAttribute('src')),
    productRailScrollable: (() => {
      const rail = document.querySelector('.result__product-rail');
      return rail ? rail.scrollWidth > rail.clientWidth : null;
    })(),
    comingSoon: document.querySelector('.result__products-coming-soon')?.textContent ?? null,
    resultMusicLoop: document.querySelector('[data-app-music="result"]')?.loop ?? null,
  };
})()`);
await capture('05-result-top');

await evaluate(`(() => {
  const surface = document.querySelector('.phone-frame__screen');
  if (surface) surface.scrollTo({ top: 280, behavior: 'instant' });
  else window.scrollTo({ top: 280, behavior: 'instant' });
})()`);
await delay(650);
report.resultFirstScroll = await evaluate(`(() => ({
  docked: document.querySelector('.result__bottom')?.dataset.docked ?? null,
  scrollTop: document.querySelector('.phone-frame__screen')?.scrollTop ?? scrollY,
  overflow: document.documentElement.scrollWidth - innerWidth,
}))()`);
await capture('05a-result-first-scroll');

await evaluate(`document.querySelector('.result__story-figure')?.scrollIntoView({ block: 'center' })`);
await delay(650);
report.resultStory = await evaluate(`(() => {
  const image = document.querySelector('.result__story-image');
  const figure = document.querySelector('.result__story-figure');
  return {
    imageComplete: image?.complete ?? false,
    imageNaturalWidth: image?.naturalWidth ?? 0,
    imageAlt: image?.getAttribute('alt') ?? null,
    figureWidth: figure ? Math.round(figure.getBoundingClientRect().width) : null,
    docked: document.querySelector('.result__bottom')?.dataset.docked ?? null,
    overflow: document.documentElement.scrollWidth - innerWidth,
  };
})()`);
await capture('05b-result-story');

await evaluate(`document.querySelector('.result__parent-support')?.scrollIntoView({ block: 'center' })`);
await delay(650);
report.resultSupport = await evaluate(`(() => ({
  items: document.querySelectorAll('.result__support-item').length,
  weeklyActions: document.querySelectorAll('.result__weekly-list li').length,
  sectionWidth: Math.round(document.querySelector('.result__parent-support')?.getBoundingClientRect().width ?? 0),
  background: getComputedStyle(document.querySelector('.result__parent-support')).backgroundColor,
  headingColor: getComputedStyle(document.querySelector('.result__parent-support > h2')).color,
  bodyColor: getComputedStyle(document.querySelector('.result__support-item > p')).color,
  weeklyColor: getComputedStyle(document.querySelector('.result__weekly-list > li')).color,
  weeklyTitleColor: getComputedStyle(document.querySelector('.result__weekly-title')).color,
  weeklyBulletColor: getComputedStyle(document.querySelector('.result__weekly-list > li'), '::before').color,
  weeklyInsideSupport: !!document.querySelector('.result__parent-support .result__weekly-list'),
  careBackground: getComputedStyle(document.querySelector('[data-support-field="careForYou"]')).backgroundColor,
  saveOutline: getComputedStyle(document.querySelector('.result__save-image')).outlineColor,
  saveText: document.querySelector('.result__save-image')?.textContent?.trim() ?? null,
  saveColor: getComputedStyle(document.querySelector('.result__save-image')).color,
  saveLabelOpacity: getComputedStyle(document.querySelector('.result__save-image .async-button__label')).opacity,
  saveLabelVisibility: getComputedStyle(document.querySelector('.result__save-image .async-button__label')).visibility,
  docked: document.querySelector('.result__bottom')?.dataset.docked ?? null,
  overflow: document.documentElement.scrollWidth - innerWidth,
}))()`);
await capture('05c-result-support');

await evaluate(`document.querySelector('.result__copy-status')?.scrollIntoView({ block: 'end' })`);
await delay(900);
report.resultDocked = await evaluate(`(() => {
  const bar = document.querySelector('.result__bottom');
  const links = document.querySelector('.result__quiet-links');
  const barBox = bar?.getBoundingClientRect();
  const linkBox = links?.getBoundingClientRect();
  return {
    docked: bar?.dataset.docked ?? null,
    transform: bar ? getComputedStyle(bar).transform : null,
    coversLastLinks: !!(barBox && linkBox && linkBox.bottom > barBox.top),
    overflow: document.documentElement.scrollWidth - innerWidth,
  };
})()`);
await capture('06-result-docked');

await evaluate(`document.querySelector('.result__hero')?.scrollIntoView({ block: 'start' })`);
await delay(900);
report.resultUndocked = await evaluate(
  `(() => ({ docked: document.querySelector('.result__bottom')?.dataset.docked ?? null }))()`,
);

await evaluate(`localStorage.setItem('pb1.lang', 'en')`);
await go('/r/pgde');
await evaluate(`document.querySelector('.result__soft-sell')?.scrollIntoView({ block: 'center' })`);
await delay(450);
report.resultEnglish = await evaluate(`(() => ({
  products: document.querySelectorAll('.result__product-card').length,
  comingSoon: document.querySelector('.result__products-coming-soon')?.textContent?.trim() ?? null,
  storyLabel: document.querySelector('.result__story-label')?.textContent?.trim() ?? null,
  storyImageAlt: document.querySelector('.result__story-image')?.getAttribute('alt') ?? null,
  weeklyActions: document.querySelectorAll('.result__weekly-list > li').length,
  overflow: document.documentElement.scrollWidth - innerWidth,
}))()`);
await capture('07-result-products-en');

// --- 7b Shareable result card ----------------------------------------------
// The card is a canvas export, so it is measured the only way it can be: by
// reading pixels back and reporting ink bands in the artwork's own 390x768
// units (`images/Result Card.jpg`). Bands are what the design specifies, so a
// font swap that keeps the composition intact will not trip this.
await evaluate(`localStorage.setItem('pb1.lang', 'id')`);
await go('/r/pgde');
report.shareCard = await evaluate(`(async () => {
  const share = await import('/src/core/share.ts');
  const data = await import('/src/data/index.ts');
  const personality = data.appData.types.find((type) => type.code === 'PGDE');
  const translations = data.appData.translations.id;
  const blob = await share.composeResultStoryCard({
    personality,
    language: 'id',
    shareUrl: 'https://quiz.parenteers.id/r/pgde',
    instagramUrl: data.appData.config.links.instagram,
    labels: {
      intro: translations['result.intro_label'],
      cta: translations['share.card_cta'],
    },
  });
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const context = canvas.getContext('2d');
  context.drawImage(bitmap, 0, 0);
  const { data: pixels } = context.getImageData(0, 0, canvas.width, canvas.height);

  const scale = canvas.height / 768;
  const inset = (canvas.width - 390 * scale) / 2;
  const at = (x, y) => {
    const index = (y * canvas.width + x) * 4;
    return [pixels[index], pixels[index + 1], pixels[index + 2]];
  };
  const background = at(2, 2);
  const inked = (x, y, threshold) => {
    const [r, g, b] = at(x, y);
    return Math.abs(r - background[0]) + Math.abs(g - background[1])
      + Math.abs(b - background[2]) > threshold;
  };
  const round = (value) => Math.round(value * 10) / 10;
  const band = (top, bottom, threshold) => {
    let first = null;
    let last = null;
    let left = canvas.width;
    let right = -1;
    for (let y = Math.round(top * scale); y <= Math.round(bottom * scale); y += 1) {
      for (let x = 0; x < canvas.width; x += 1) {
        if (!inked(x, y, threshold)) continue;
        if (first === null) first = y;
        last = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
    if (first === null) return null;
    return {
      top: round(first / scale),
      bottom: round(last / scale),
      left: round((left - inset) / scale),
      right: round((right - inset) / scale),
    };
  };

  // Brand blue only, so the pill fill and the orange code never register.
  let nameOverPill = 0;
  for (let y = Math.round(549 * scale); y <= Math.round(584 * scale); y += 1) {
    for (let x = Math.round(inset + 140 * scale); x <= Math.round(inset + 250 * scale); x += 1) {
      const [r, g, b] = at(x, y);
      if (Math.abs(r - 24) + Math.abs(g - 39) + Math.abs(b - 153) < 90) nameOverPill += 1;
    }
  }

  const pillCentre = at(Math.round(inset + 195 * scale), Math.round(566 * scale));
  return {
    size: [canvas.width, canvas.height],
    wordmark: band(30, 75, 40),
    character: band(80, 460, 26),
    eyebrow: band(470, 496, 40),
    name: band(496, 546, 40),
    pill: band(546, 588, 30),
    tagline: band(596, 686, 40),
    footer: band(688, 726, 20),
    pillFill: pillCentre.join(','),
    nameOverPill,
  };
})()`);

// --- 8 Gallery spacing -----------------------------------------------------
await go('/gallery');
report.gallerySpacing = await evaluate(`(() => {
  const firstCard = document.querySelector('.gallery__item');
  const sendButton = document.querySelector('.gallery__send');
  const cardRect = firstCard?.getBoundingClientRect();
  const buttonRect = sendButton?.getBoundingClientRect();
  return {
    cardLeft: cardRect ? Math.round(cardRect.left) : null,
    buttonLeft: buttonRect ? Math.round(buttonRect.left) : null,
    buttonRightGap: buttonRect ? Math.round(innerWidth - buttonRect.right) : null,
    overflow: document.documentElement.scrollWidth - innerWidth,
  };
})()`);
await capture('08-gallery-spacing');

// --- 9 Desktop gate ---------------------------------------------------------
// The only surface a desktop visitor sees, and the only one this script has to
// leave phone emulation to reach: the gate triggers on a wide viewport or on a
// fine pointer with no touch points.
report.gate = {};
for (const [label, width, height] of [
  ['wide', 1440, 900],
  ['laptop', 1366, 768],
  ['stacked', 820, 900],
]) {
  await command('Emulation.setTouchEmulationEnabled', { enabled: false });
  await command('Emulation.setDeviceMetricsOverride', {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false,
    screenWidth: width,
    screenHeight: height,
  });
  await command('Page.navigate', { url: `${baseUrl}/?gate=${width}` });
  await delay(1600);
  report.gate[label] = await evaluate(`(() => {
    const round = (value) => Math.round(value);
    const copy = document.querySelector('.gate__copy');
    const scan = document.querySelector('.gate__scan');
    const qr = document.querySelector('.gate__qr svg');
    const card = document.querySelector('.gate__card');
    const art = document.querySelector('.gate__art');
    if (!copy || !scan || !card) return { mounted: false };
    const copyBox = copy.getBoundingClientRect();
    const scanBox = scan.getBoundingClientRect();
    return {
      mounted: true,
      presentation: document.documentElement.dataset.presentation,
      copyLeft: round(copyBox.left),
      copyRight: round(copyBox.right),
      scanLeft: round(scanBox.left),
      copyTop: round(copyBox.top),
      scanTop: round(scanBox.top),
      sideBySide: scanBox.left >= copyBox.right - 1,
      copyTextAlign: getComputedStyle(copy).textAlign,
      qrLabel: qr?.getAttribute('aria-label') ?? null,
      url: document.querySelector('.gate__url')?.textContent ?? null,
      facts: document.querySelectorAll('.gate__meta > li').length,
      continueLabel: document.querySelector('.gate__continue')?.textContent?.trim() ?? null,
      artDisplay: art ? getComputedStyle(art).display : null,
      overflowX: document.documentElement.scrollWidth - innerWidth,
      overflowY: document.documentElement.scrollHeight - innerHeight,
    };
  })()`);
  await capture(`09-gate-${label}`);
}

// --- Assertions ------------------------------------------------------------
const shells = [
  ['landing', report.landing],
  ['intro', report.intro],
  ['baking', report.baking],
  ['result', report.result],
  ...report.questions.map((row) => [`q${row.id}`, row]),
];
// Baking deliberately has neither: it advances on a timer, so there is nothing
// to press and no bottom band to hold it.
const BANDLESS_SCENES = new Set(['baking']);

for (const [name, state] of shells) {
  if (!state.scene) failures.push(`${name}: scene did not mount`);
  if (state.overflow > 0) failures.push(`${name}: ${state.overflow}px horizontal overflow`);
  if (state.brokenImages.length > 0) failures.push(`${name}: broken images ${state.brokenImages.join(',')}`);
  if (state.headerPosition === 'absolute') failures.push(`${name}: header is still out of flow`);
  if (BANDLESS_SCENES.has(name)) {
    if (state.bottomBox) failures.push(`${name}: should have no bottom band`);
  } else {
    if (!state.bottomBox) failures.push(`${name}: no bottom band`);
    const cta = state.ctaExpression;
    if (!cta?.bg?.includes('button-expression')) {
      failures.push(`${name}: bottom CTA is missing the expression mark`);
    }
    // 52px is pad(16,32) around a 16/1.25 label — the spec's Button-blue height.
    if (cta && cta.height > 0 && Math.abs(cta.height - 52) > 1.5) {
      failures.push(`${name}: bottom CTA is ${cta.height}px tall, expected 52`);
    }
    if (cta && cta.gap > 3) failures.push(`${name}: ${cta.gap}px between CTA label and mark`);
    if (cta && cta.afterRotate !== 'none') failures.push(`${name}: expression mark is still rotated`);
    if (cta && cta.afterHeight >= 20) {
      failures.push(`${name}: expression mark (${cta.afterHeight}px) can drive the CTA height`);
    }
  }
  // The bands own their insets; any gap here means a stale scene padding is
  // stealing height from the artwork.
  if (state.bodyBox && state.headerBox && state.bodyBox.y - state.headerBox.bottom > 1) {
    failures.push(
      `${name}: ${Math.round(state.bodyBox.y - state.headerBox.bottom)}px of dead space between the header and the body`,
    );
  }
}

// Fixed-height scenes must dock their bottom band to the viewport bottom.
for (const [name, state] of [['landing', report.landing], ['intro', report.intro], ...report.questions.map((r) => [`q${r.id}`, r])]) {
  if (Math.abs(state.sceneBox.bottom - 844) > 1.5) {
    failures.push(`${name}: scene is ${state.sceneBox.h}px tall, expected one viewport`);
  }
  if (state.bottomBox && state.sceneBox.bottom - state.bottomBox.bottom > 2) {
    failures.push(`${name}: bottom band floats ${Math.round(state.sceneBox.bottom - state.bottomBox.bottom)}px above the scene bottom`);
  }
}

if (report.landing.timePillPresent) failures.push('splash: the 3-minute capsule is still rendered');
if (/menit|minute/i.test(report.landing.eyebrowText ?? '')) failures.push('splash: eyebrow still shows the duration');
if (!report.landing.eyebrowIsCapsule) failures.push('splash: eyebrow is not a warm capsule');
if (report.landing.titleLineHeightRatio < 1.15) {
  failures.push(`splash: title line-height ${report.landing.titleLineHeightRatio} still clips descenders`);
}
if (parseFloat(report.landing.maskPaddingBottom ?? '0') <= 0) {
  failures.push('splash: split-char mask has no descender clearance');
}
if (Math.abs(report.landing.subtitleWidth - 284.8) > 6) {
  failures.push(`splash: subtitle is ${report.landing.subtitleWidth}px, expected ~284.8`);
}
if (report.landing.subtitleAlign !== 'center') failures.push('splash: subtitle is not centered');
if (!report.landing.captionText) failures.push('splash: no caption under the CTA');
if (!report.landing.art?.fullBleed) failures.push('splash: art is not full-bleed');
if (!report.landing.art?.visible) failures.push('splash: art is hidden');

if (report.audioLifecycle.before.toggle !== 'on') {
  failures.push('audio: fresh visitor does not default to sound on');
}
if (!report.audioLifecycle.before.present || report.audioLifecycle.before.preload !== 'auto') {
  failures.push('audio: theme is not buffering ahead of the first interaction');
}
if (!report.audioLifecycle.after?.present || report.audioLifecycle.after.paused !== false) {
  failures.push('audio: theme did not start on the first pointer interaction');
}
if (!(report.audioLifecycle.after?.currentTime > 0)) {
  failures.push('audio: theme currentTime did not advance after the first interaction');
}
if (report.audioLifecycle.before.loop !== true || report.audioLifecycle.after?.loop !== true) {
  failures.push('audio: theme music is not configured to loop');
}

// A circle is a square box at 50% radius — an oval means the box is not square.
for (const [name, ring] of Object.entries(report.headerControls)) {
  if (!ring) {
    failures.push(`header: ${name} is missing`);
    continue;
  }
  if (Math.abs(ring.w - ring.h) > 0.5) {
    failures.push(`header: ${name} is ${ring.w}x${ring.h}, not a square box`);
  }
  if (ring.radius !== '50%') failures.push(`header: ${name} radius is ${ring.radius}, expected 50%`);
}

for (const [name, centre] of Object.entries(report.soundGlyph)) {
  if (Math.abs(centre.centreX - 32) > 0.75 || Math.abs(centre.centreY - 32) > 0.75) {
    failures.push(
      `icons/${name}.svg: artwork centres at ${centre.centreX},${centre.centreY} in a 64 viewBox`,
    );
  }
}

if (!report.intro.art?.src?.includes('q03-daily-schedule')) {
  failures.push(`intro: art is ${report.intro.art?.src}, expected the 3:2 scene derivative`);
}
if (!report.intro.art?.fullBleed) failures.push('intro: art band is not full-bleed');
if (report.intro.art?.mask !== 'none') failures.push('intro: art still carries a mask gradient');
if (!aspectMatches(report.intro.art)) {
  failures.push(`intro: art is cropped (native ${report.intro.art?.natural}, rendered ${report.intro.art?.rendered})`);
}
// Never rescaled: the illustration keeps its native 3:2 at 390 wide.
if (Math.abs(report.intro.art.rendered[1] - 260) > 1) {
  failures.push(`intro: art is ${report.intro.art.rendered[1]}px tall, expected its native 260`);
}
if (!report.intro.artCentred) failures.push('intro: art is not centred in the leftover space');
if (report.intro.langVisible) failures.push('intro: language toggle should be hidden');
if (report.intro.points !== 3) failures.push('intro: expected 3 numbered points');
if (report.intro.titleAlign !== 'left' && report.intro.titleAlign !== 'start') {
  failures.push('intro: headline is not left-aligned');
}

for (const row of report.questions) {
  const tag = `q${row.id}`;
  if (row.stops !== 12) failures.push(`${tag}: ${row.stops} progress stops`);
  if (row.complete !== row.id) failures.push(`${tag}: ${row.complete} stars lit, expected ${row.id}`);
  if (!row.starImage?.includes('progress-bar-star')) failures.push(`${tag}: rail is not using progress-bar-star.svg`);
  if (Math.abs(parseFloat(row.dimOpacity) - 0.2) > 0.01 && row.id !== 12) {
    failures.push(`${tag}: remaining stars at opacity ${row.dimOpacity}, expected 0.2`);
  }
  if (Math.abs(row.railHeight - 35) > 1) failures.push(`${tag}: rail is ${row.railHeight}px, expected 35`);
  if (row.labelNodes !== 1 || row.labelNodeType !== 3) {
    failures.push(`${tag}: progress label is ${row.labelNodes} nodes, expected a single text node`);
  }
  if (row.changeAnswerPresent) failures.push(`${tag}: the change-answer link is still rendered`);
  if (row.cards !== 2) failures.push(`${tag}: ${row.cards} answer cards`);
  if (!row.art?.fullBleed) failures.push(`${tag}: art band is not full-bleed`);
  // Never rescaled at any viewport height: always its native 3:2 at 390 wide.
  // The band now spans the headline row too, so this holds even when the copy
  // is long — which is the whole point of the change.
  if (Math.abs(row.art.rendered[1] - 260) > 1) {
    failures.push(`${tag}: art is ${row.art.rendered[1]}px tall, expected its native 260`);
  }
  // At the 844 canvas the copy clears the artwork, so the illustration is a
  // plain layer. The fade belongs only to the short-viewport case below.
  if (row.artMask !== 'none') {
    failures.push(`${tag}@844: art carries a mask (${row.artMask}); it should be a plain layer`);
  }
  const layers = row.layerOrder;
  if (!layers || Number(layers.stack) <= Number(layers.band)) {
    failures.push(
      `${tag}: copy is not above the art layer (band ${layers?.band}, stack ${layers?.stack})`,
    );
  }
  if (layers && layers.stackPositioned === 'static') {
    failures.push(`${tag}: the copy stack is static, so its z-index does nothing`);
  }
  if (layers && layers.isolated !== 'isolate') {
    failures.push(`${tag}: the scene body is not an isolated stacking context`);
  }
  if (row.stackColumn !== '1' || Math.abs(row.stackWidth - 390) > 1) {
    failures.push(
      `${tag}: headline column collapsed — stack is ${row.stackWidth}px in grid column ${row.stackColumn}`,
    );
  }
  if (row.langVisible) failures.push(`${tag}: language toggle should be hidden`);
  if (row.ctaDisabled !== true) failures.push(`${tag}: CTA should start disabled`);
  // Answers must sit low enough that the art keeps the upper composition.
  if (row.cardBottom < 470) failures.push(`${tag}: answers end at ${row.cardBottom}px, too high up the screen`);
  // The star rail must still read against flat cream: the band starts below it.
  if (row.railBottom > row.bandTop + 0.5) failures.push(`${tag}: star rail sits on the artwork`);
  // Long prompts step down so no scenario costs more than three lines.
  if (row.titleLines > 3) {
    failures.push(`${tag}: headline runs ${row.titleLines} lines at ${row.titleFontPx}px`);
  }
  if (row.labelColor === 'rgb(223, 199, 171)') {
    failures.push(`${tag}: indicator row is still the 1.4:1 outline tan`);
  }
}

// The short-viewport case this was built for: a Galaxy A55 with browser chrome
// is ~720 CSS px, not the 844 design canvas. The art must still be its full
// 260px there — it runs behind the headline rather than giving up its height.
if (report.shortViewport) {
  const short = report.shortViewport;
  if (Math.abs(short.artHeight - 260) > 1) {
    failures.push(`q5@720: art collapsed to ${short.artHeight}px, expected its native 260`);
  }
  if (short.artBottom <= short.titleTop) {
    failures.push('q5@720: art stops above the headline instead of running behind it');
  }
  if (short.ctaBottom > 720.5) {
    failures.push(`q5@720: the CTA is ${Math.round(short.ctaBottom - 720)}px below the fold`);
  }
  if (short.overflow > 0) failures.push(`q5@720: ${short.overflow}px horizontal overflow`);
  // The display scale is a percentage of the screen, not a fixed size: the same
  // headline on a 124px-shorter viewport must actually come down.
  const tall = report.questions.find((row) => row.id === 5);
  if (tall && !(short.titleFontPx < tall.titleFontPx)) {
    failures.push(
      `q5@720: headline is ${short.titleFontPx}px, same as at 844 — the height term is not applying`,
    );
  }
  // Here the copy genuinely sits on the picture (~95px of it at this height), so
  // the fade is on — the one place it is wanted.
  if (!short.artMask?.includes('gradient')) {
    failures.push('q5@720: art has no fade where the copy runs onto it');
  }
}

if (report.shortQuestion10) {
  const short = report.shortQuestion10;
  if (Math.abs(short.artHeight - 260) > 1) {
    failures.push(`q10@720: art collapsed to ${short.artHeight}px, expected its native 260`);
  }
  if (short.ctaBottom > 720.5) {
    failures.push(`q10@720: the CTA is ${Math.round(short.ctaBottom - 720)}px below the fold`);
  }
  if (short.overflow > 0) failures.push(`q10@720: ${short.overflow}px horizontal overflow`);
}

if (report.baking.ovenPresent) failures.push('baking: the oven dial is still rendered');
if (report.baking.cardPresent) failures.push('baking: the centered card is still rendered');
if (report.baking.rows !== 3) failures.push(`baking: ${report.baking.rows} marquee rows, expected 3`);
if (report.baking.items < 16) failures.push(`baking: only ${report.baking.items} marquee items`);
if (!report.baking.allThumbs) failures.push('baking: marquee is not using thumbnails');
if (report.baking.uniqueThumbRequests !== 16) {
  failures.push(`baking: ${report.baking.uniqueThumbRequests} unique thumb requests, expected 16`);
}
if (report.baking.thumbKB > 300) failures.push(`baking: marquee cost ${report.baking.thumbKB} KB, over the 300 KB budget`);
if (report.baking.lines !== 1) failures.push(`baking: ${report.baking.lines} status lines, expected 1 held still`);
if (report.baking.sequential) failures.push('baking: the cross-fading line sequence is back');
if (report.baking.visibleLines !== 1) failures.push('baking: the status line is not fully visible');
if (report.baking.lineFontPx < 18) {
  failures.push(`baking: status line is ${report.baking.lineFontPx}px, expected 18`);
}
if (report.baking.continuePresent) failures.push('baking: the continue button is still rendered');
if (!report.baking.itemSquare) failures.push('baking: marquee thumbnails are not square');
// Sized off the row rather than a fixed 104px, so the cast reads big.
if (report.baking.itemPx < 120) {
  failures.push(`baking: thumbnails are ${report.baking.itemPx}px, expected the row to make them >=120`);
}
if (report.bakingAdvanced.scene !== 'result') {
  failures.push(`baking: still on "${report.bakingAdvanced.scene}" (${report.bakingAdvanced.path}) after the 5s hold`);
}

if (!report.result.artBeforeIdentity) failures.push('result: identity is not below the character');
if (report.result.artY > report.result.identityY) failures.push('result: character does not lead the hero');
if (!/\w( \w){3}/.test(report.result.codeText ?? '')) {
  failures.push(`result: code reads "${report.result.codeText}", expected space-separated letters`);
}
if (report.result.codeBackground !== 'rgb(243, 227, 203)') {
  failures.push(`result: code capsule is ${report.result.codeBackground}, expected the warm tan`);
}
if (report.result.sections !== 7) failures.push(`result: ${report.result.sections} detail sections, expected 7`);
if (!report.result.storyTitle) failures.push('result: parent story title is missing');
if (report.result.storyParagraphs < 4) {
  failures.push(`result: story has ${report.result.storyParagraphs} paragraphs, expected at least 4`);
}
if (report.result.storyImageAfter !== '2') {
  failures.push(`result: story image contract is ${report.result.storyImageAfter}, expected 2`);
}
if (report.result.storyChildOrder.join(',') !== 'paragraph,paragraph,image,paragraph,paragraph') {
  failures.push(`result: story child order is ${report.result.storyChildOrder.join(',')}`);
}
if (report.result.supportOrder.join(',') !== 'realLife,guiltRelease,careForYou,forYourChild') {
  failures.push(`result: parent-first support order is ${report.result.supportOrder.join(',')}`);
}
if (report.result.weeklyActions !== 3) {
  failures.push(`result: ${report.result.weeklyActions} weekly actions, expected 3`);
}
if (!report.result.parentFirstBeforePowers) {
  failures.push('result: parent-first story and support do not precede the legacy personality summary');
}
if (!report.resultStory.imageComplete || report.resultStory.imageNaturalWidth !== 1200) {
  failures.push(`result: story image did not load at 1200px (${report.resultStory.imageNaturalWidth})`);
}
if (!report.resultStory.imageAlt) failures.push('result: story image has no localized alt text');
if (Math.abs(report.resultStory.figureWidth - 390) > 1) {
  failures.push(`result: story figure is ${report.resultStory.figureWidth}px wide in a 390px viewport`);
}
if (report.resultStory.overflow > 0) {
  failures.push(`result story: ${report.resultStory.overflow}px horizontal overflow`);
}
if (report.resultFirstScroll.scrollTop < 240 || report.resultFirstScroll.docked !== 'true') {
  failures.push(
    `result: save CTA did not dock after the first scroll (${report.resultFirstScroll.scrollTop}px, ${report.resultFirstScroll.docked})`,
  );
}
if (report.resultFirstScroll.overflow > 0) {
  failures.push(`result first scroll: ${report.resultFirstScroll.overflow}px horizontal overflow`);
}
if (report.resultStory.docked !== 'true') {
  failures.push('result: save CTA disappeared while the parent story was being read');
}
if (report.resultSupport.items !== 4 || report.resultSupport.weeklyActions !== 3) {
  failures.push(
    `result: support view has ${report.resultSupport.items} takeaways and ${report.resultSupport.weeklyActions} actions`,
  );
}
if (Math.abs(report.resultSupport.sectionWidth - 390) > 1) {
  failures.push(`result support: blue block is ${report.resultSupport.sectionWidth}px wide`);
}
if (report.resultSupport.background !== 'rgb(24, 39, 153)') {
  failures.push(`result support: background is ${report.resultSupport.background}`);
}
for (const [role, color] of [
  ['heading', report.resultSupport.headingColor],
  ['body', report.resultSupport.bodyColor],
]) {
  if (color !== 'rgb(255, 255, 255)') failures.push(`result support: ${role} color is ${color}`);
}
if (report.resultSupport.weeklyInsideSupport) {
  failures.push('result weekly actions: section is still nested inside the blue support block');
}
for (const [role, color] of [
  ['heading', report.resultSupport.weeklyTitleColor],
  ['action', report.resultSupport.weeklyColor],
]) {
  if (color !== 'rgb(24, 39, 153)') failures.push(`result weekly actions: ${role} color is ${color}`);
}
if (report.resultSupport.weeklyBulletColor !== 'rgb(232, 104, 17)') {
  failures.push(`result weekly actions: bullet color is ${report.resultSupport.weeklyBulletColor}`);
}
if (report.resultSupport.careBackground !== 'rgba(255, 255, 255, 0.1)') {
  failures.push(`result support: parent-care emphasis is ${report.resultSupport.careBackground}`);
}
if (report.resultSupport.saveOutline !== 'rgb(255, 255, 255)') {
  failures.push(`result support: save button outline is ${report.resultSupport.saveOutline}`);
}
if (!report.resultSupport.saveText
  || report.resultSupport.saveLabelOpacity !== '1'
  || report.resultSupport.saveLabelVisibility !== 'visible'
  || report.resultSupport.saveColor === 'rgb(24, 39, 153)') {
  failures.push(
    `result support: save label is not visible (${report.resultSupport.saveText}, ${report.resultSupport.saveColor}, ${report.resultSupport.saveLabelOpacity}, ${report.resultSupport.saveLabelVisibility})`,
  );
}
if (report.resultSupport.docked !== 'true') {
  failures.push('result: save CTA disappeared while the parent-first takeaways were being read');
}
if (report.resultSupport.overflow > 0) {
  failures.push(`result support: ${report.resultSupport.overflow}px horizontal overflow`);
}
if (!report.result.softSell) failures.push('result: soft-sell block is missing');
if (!report.result.disclaimer) failures.push('result: disclaimer is missing');
// Copy link and Retake only: the gallery got a section of its own and `/end` is
// gone, so "Continue" went with it.
if (report.result.chips !== 2) failures.push(`result: ${report.result.chips} action chips, expected 2`);
if (report.result.chipIcons !== 2) failures.push(`result: ${report.result.chipIcons} chip icons, expected 2`);
if (parseFloat(report.result.chipRadius) < 20) failures.push('result: chips are not warm capsules');
// The other-types teaser sits at the same weight as the pop-culture cousin.
if (report.result.otherTiles !== 3) {
  failures.push(`result: ${report.result.otherTiles} other-type tiles, expected 3`);
}
if (!report.result.otherHeading) failures.push('result: the other-types section has no heading');
if (report.result.otherHeadingFont !== report.result.sectionHeadingFont) {
  failures.push('result: the other-types heading is not at cousin-section weight');
}
if (report.result.seeAllHeight < 48) {
  failures.push(`result: the see-all button is ${report.result.seeAllHeight}px, expected a wide one`);
}
if (!report.result.seeAllFullWidth) failures.push('result: the see-all button is not full width');
// The long-name guard: both the name and the illustration must stay on screen.
if (Math.abs(report.result.artWidth - 390) > 1) {
  failures.push(`result: character is ${report.result.artWidth}px wide in a 390px viewport`);
}
if (report.result.nameRight > 390.5) {
  failures.push(`result: name runs ${Math.round(report.result.nameRight - 390)}px past the viewport`);
}
const bullet = report.result.bulletBox;
if (!bullet || Math.abs(bullet.w - 27) > 0.5 || Math.abs(bullet.h - 27) > 0.5) {
  failures.push(`result: power bullet is ${bullet?.w}x${bullet?.h}, expected a 27px circle`);
}
const introBullet = report.intro.bulletBox;
if (!introBullet || Math.abs(introBullet.w - 27) > 0.5 || Math.abs(introBullet.h - 27) > 0.5) {
  failures.push(`intro: point bullet is ${introBullet?.w}x${introBullet?.h}, expected a 27px circle`);
}
if (report.result.dockedAtTop !== 'false') failures.push('result: share bar is docked while at the top');
if (report.result.barBackground !== 'rgba(0, 0, 0, 0)') {
  failures.push(`result: save dock background is ${report.result.barBackground}, expected transparent`);
}
if (report.result.barShadow !== 'none') {
  failures.push(`result: save dock shadow is ${report.result.barShadow}, expected none`);
}
if (report.result.saveButtonBackground !== 'rgb(24, 39, 153)') {
  failures.push(`result: save CTA background is ${report.result.saveButtonBackground}, expected brand blue`);
}
if (report.result.saveButtonShadow !== 'none') {
  failures.push(`result: save CTA shadow is ${report.result.saveButtonShadow}, expected none`);
}
if (report.result.products !== 9) {
  failures.push(`result: ID product rail has ${report.result.products} cards, expected 9`);
}
if (!report.result.productLinks.every((href) => href === 'https://parenteers.id/')) {
  failures.push(`result: product links do not all target parenteers.id (${report.result.productLinks.join(', ')})`);
}
if (report.result.brokenProductImages.length > 0) {
  failures.push(`result: broken product images: ${report.result.brokenProductImages.join(', ')}`);
}
if (report.result.productRailScrollable !== true) failures.push('result: ID product rail is not horizontally scrollable');
if (report.result.comingSoon !== null) failures.push('result: ID product rail was replaced by the EN coming-soon state');
if (report.result.resultMusicLoop !== true) failures.push('audio: result music is not configured to loop');
if (report.resultDocked.docked !== 'true') failures.push('result: share bar did not dock after scrolling');
if (report.resultDocked.coversLastLinks) failures.push('result: docked bar covers the last links');
if (report.resultUndocked.docked !== 'false') failures.push('result: share bar stayed docked back at the top');
if (report.resultEnglish.products !== 0) failures.push('result: EN still renders Indonesian product cards');
if (!report.resultEnglish.comingSoon?.includes('English-language products are coming soon.')) {
  failures.push(`result: EN coming-soon copy is missing (${report.resultEnglish.comingSoon})`);
}
if (report.resultEnglish.storyLabel !== 'An everyday story') {
  failures.push(`result EN: story label is missing (${report.resultEnglish.storyLabel})`);
}
if (!report.resultEnglish.storyImageAlt || report.resultEnglish.storyImageAlt.includes('Orang tua')) {
  failures.push(`result EN: story image alt is not localized (${report.resultEnglish.storyImageAlt})`);
}
if (report.resultEnglish.weeklyActions !== 3) {
  failures.push(`result EN: ${report.resultEnglish.weeklyActions} weekly actions, expected 3`);
}
if (report.resultEnglish.overflow > 0) failures.push(`result EN: ${report.resultEnglish.overflow}px horizontal overflow`);

for (const [edge, inset] of [
  ['first card', report.gallerySpacing.cardLeft],
  ['send button left', report.gallerySpacing.buttonLeft],
  ['send button right', report.gallerySpacing.buttonRightGap],
]) {
  if (inset == null || inset < 15) failures.push(`gallery spacing: ${edge} inset is ${inset}px`);
}
if (report.gallerySpacing.overflow > 0) {
  failures.push(`gallery spacing: ${report.gallerySpacing.overflow}px horizontal overflow`);
}

// The desktop gate: copy on the left, scan panel on the right, and it has to
// fit a laptop without turning a hand-off screen into a scroll.
for (const [label, expectSideBySide, expectFits] of [
  ['wide', true, true],
  ['laptop', true, true],
  ['stacked', false, false],
]) {
  const state = report.gate[label];
  if (!state?.mounted) {
    failures.push(`gate ${label}: did not mount`);
    continue;
  }
  if (state.presentation !== 'gate') {
    failures.push(`gate ${label}: presentation is ${state.presentation}`);
  }
  if (state.sideBySide !== expectSideBySide) {
    failures.push(
      `gate ${label}: sideBySide is ${state.sideBySide}, expected ${expectSideBySide}`,
    );
  }
  if (expectSideBySide) {
    if (state.scanLeft < state.copyRight) {
      failures.push(`gate ${label}: the scan panel is not right of the copy`);
    }
    if (state.copyTextAlign !== 'start' && state.copyTextAlign !== 'left') {
      failures.push(`gate ${label}: copy is ${state.copyTextAlign}-aligned, expected start`);
    }
    if (state.artDisplay !== 'none') {
      failures.push(`gate ${label}: the portrait art is shown in the two-column layout`);
    }
  } else if (state.scanTop > state.copyTop) {
    failures.push(`gate ${label}: stacked, but the QR is below the copy`);
  }
  if (state.overflowX > 0) failures.push(`gate ${label}: ${state.overflowX}px horizontal overflow`);
  if (expectFits && state.overflowY > 0) {
    failures.push(`gate ${label}: ${state.overflowY}px of vertical scroll on a hand-off screen`);
  }
  if (!state.qrLabel) failures.push(`gate ${label}: the QR has no accessible name`);
  if (!state.url) failures.push(`gate ${label}: the typeable host is missing`);
  if (state.facts !== 3) failures.push(`gate ${label}: ${state.facts} facts, expected 3`);
  if (!state.continueLabel) failures.push(`gate ${label}: no continue-anyway escape hatch`);
}

// The preloader clip has to read as artwork on the page, not as a card sitting
// on it, and it must never be able to make a sound.
const preloader = report.preloader;
if (!preloader) failures.push('preloader: did not run');
else {
  if (preloader.tag !== 'VIDEO') failures.push(`preloader: art is a ${preloader.tag}`);
  if (preloader.inStage !== 'experience-preloader__stage') {
    failures.push(`preloader: clip is not inside the stage (${preloader.inStage})`);
  }
  if (!preloader.muted) failures.push('preloader: clip is not muted');
  if (!preloader.playsInline) failures.push('preloader: clip is not playsinline');
  if (preloader.ariaHidden !== 'true') failures.push('preloader: clip is not hidden from AT');
  if (!preloader.washIsGradient) failures.push('preloader: the stage wash is missing');
  if (preloader.blendMode !== 'normal') {
    failures.push(`preloader: clip blend mode is ${preloader.blendMode}, expected normal`);
  }
  if (preloader.boxShadow !== 'none') failures.push(`preloader: clip has a shadow (${preloader.boxShadow})`);
  if (parseFloat(preloader.borderRadius) !== 0) failures.push(`preloader: clip is rounded (${preloader.borderRadius})`);
  if (parseFloat(preloader.borderWidth) !== 0) failures.push(`preloader: clip has a border (${preloader.borderWidth})`);
  if (preloader.worstEdgeDelta !== null && preloader.worstEdgeDelta > 6) {
    failures.push(`preloader: clip edge differs from the page by ${preloader.worstEdgeDelta}, expected a seamless 0`);
  }
  if (!preloader.overlayRemoved) failures.push('preloader: overlay stayed on screen');
  if (reduced) {
    // Reduced motion keeps the bake and drops the stirring, and it collapses
    // the whole preloader to zero duration, so there is nothing left to sample.
    if (preloader.autoplay) failures.push('preloader: clip autoplays under reduced motion');
  } else {
    if (!preloader.autoplay) failures.push('preloader: clip does not autoplay');
    if (preloader.readyState < 2) {
      failures.push(`preloader: clip never produced a frame (readyState ${preloader.readyState})`);
    }
    if (preloader.paused) failures.push('preloader: clip is not playing');
    if (preloader.worstEdgeDelta === null) failures.push('preloader: the seam could not be measured');
  }
}

// The result card reproduces `images/Result Card.jpg`. Bands are asserted in
// that file's 390x768 units, with a tolerance wide enough for hinting and
// antialiasing but not for a band that has moved or gone missing.
const card = report.shareCard;
if (!card) failures.push('share card: did not compose');
else {
  if (card.size[0] !== 1080 || card.size[1] !== 1920) {
    failures.push(`share card: ${card.size.join('x')}, expected 1080x1920`);
  }
  for (const [name, expected, tolerance] of [
    ['wordmark', { top: 42, bottom: 62, left: 128, right: 261 }, 2],
    ['character', { top: 88, bottom: 445, left: 23, right: 367 }, 4],
    ['eyebrow', { top: 480, bottom: 488, left: 138, right: 250 }, 3],
    ['name', { top: 501, bottom: 537, left: 59, right: 331 }, 4],
    ['pill', { top: 549, bottom: 584, left: 144, right: 246 }, 3],
    ['footer', { top: 691, bottom: 718, left: 35, right: 356 }, 3],
  ]) {
    const measured = card[name];
    if (!measured) {
      failures.push(`share card: ${name} band is missing`);
      continue;
    }
    for (const edge of ['top', 'bottom', 'left', 'right']) {
      const drift = Math.abs(measured[edge] - expected[edge]);
      if (drift > tolerance) {
        failures.push(
          `share card: ${name} ${edge} is ${measured[edge]}, expected ~${expected[edge]}`,
        );
      }
    }
  }
  // The tagline is data, so only its block is pinned, not its line count.
  if (!card.tagline || card.tagline.top > 608 || card.tagline.bottom > 660) {
    failures.push(`share card: tagline block at ${JSON.stringify(card.tagline)}`);
  }
  if (card.pillFill !== '243,227,202') {
    failures.push(`share card: code pill is ${card.pillFill}, expected 243,227,202`);
  }
  if (card.nameOverPill > 0) {
    failures.push(`share card: ${card.nameOverPill}px of name ink reaches the code pill`);
  }
}

if (runtimeErrors.length > 0) failures.push(`runtime errors: ${runtimeErrors.join(' | ')}`);

console.log(JSON.stringify({ reduced, report, runtimeErrors, failures }, null, 2));
socket.close();
if (failures.length > 0) process.exitCode = 1;

function aspectMatches(art) {
  if (!art?.natural || !art?.rendered) return true;
  const native = art.natural[0] / art.natural[1];
  const rendered = art.rendered[0] / art.rendered[1];
  return Math.abs(native - rendered) < 0.03;
}

/**
 * Navigates and then polls until the scene has actually mounted. The first load
 * has to clear the preloader (fonts + eager art), so a fixed
 * delay is not reliable enough to assert against.
 */
async function go(path, settle = 450, afterMountExpression = null) {
  await command('Page.navigate', { url: `${baseUrl}${path}` });
  const deadline = Date.now() + 15_000;
  for (;;) {
    await delay(250);
    const ready = await evaluate(
      `!!document.querySelector('.scene[data-scene]') && !document.querySelector('.experience-preloader')`,
    ).catch(() => false);
    if (ready) break;
    if (Date.now() > deadline) throw new Error(`${path} never mounted a scene`);
  }
  if (afterMountExpression) await evaluate(afterMountExpression);
  await delay(settle);
}

async function evaluate(expression) {
  const { result, exceptionDetails } = await command('Runtime.evaluate', {
    expression,
    returnByValue: true,
    awaitPromise: true,
  });
  if (exceptionDetails) throw new Error(exceptionDetails.text ?? 'evaluate failed');
  return result.value;
}

async function capture(name) {
  const { data } = await command('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(resolve(outputDirectory, `${name}.png`), Buffer.from(data, 'base64'));
}

function poleForQuestion(question) {
  if (question <= 3) return 'P';
  if (question <= 6) return 'C';
  if (question <= 9) return 'T';
  return 'E';
}

function fullAnswers() {
  return Array.from({ length: 12 }, (_, index) => ({
    q: index + 1,
    pole: poleForQuestion(index + 1),
  }));
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

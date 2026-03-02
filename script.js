/**
 * TRAJANO — Fotografia de Moda
 * script.js
 * ─────────────────────────────────────────────────────────────────
 * Módulos:
 *   1. Config            — constantes e configuração global
 *   2. CustomCursor      — cursor animado (somente desktop)
 *   3. ScrollReveal      — animações de entrada por IntersectionObserver
 *   4. SmoothScroll      — scroll suave para âncoras
 *   5. Navigation        — menu mobile + comportamento da nav
 *   6. WhatsApp          — lógica de agendamento via WhatsApp
 *   7. Utils             — helpers reutilizáveis
 *   8. Init              — inicialização após DOM pronto
 * ─────────────────────────────────────────────────────────────────
 */

'use strict';

/* ================================================================
   1. CONFIG
   ─ Centraliza todos os valores configuráveis em um único objeto.
   ─ Para alterar o número de WhatsApp, edite APENAS esta linha.
================================================================ */
const CONFIG = {
  // ⚠️  Substitua pelo número real no formato internacional (sem +)
  whatsappPhone: '5519971531233',

  // Breakpoint abaixo do qual o cursor customizado é desativado
  cursorBreakpoint: 1024,

  // Mensagem padrão quando nenhum tipo de ensaio é selecionado
  whatsappDefaultType: 'Ensaio Fotográfico',

  // Template de mensagem — {type} é substituído pelo tipo selecionado
  whatsappMessage: (type) =>
    `Olá, Guilherme! Gostaria de agendar um ensaio de ${type}. Podemos conversar sobre disponibilidade e orçamento?`,
};


/* ================================================================
   2. CUSTOM CURSOR
   ─ Ativado apenas em dispositivos não-touch com tela ≥ 1024px.
   ─ Usa requestAnimationFrame para o anel "lazy" — sem setInterval.
   ─ Posiciona via transform (não top/left) para evitar reflows.
================================================================ */
const CustomCursor = (() => {
  const cursorEl  = document.getElementById('cursor');
  const ringEl    = document.getElementById('cursorRing');

  if (!cursorEl || !ringEl) return { init: () => {} };

  let mouseX = 0, mouseY = 0;
  let ringX  = 0, ringY  = 0;

  const isDesktopPointer = () =>
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    window.innerWidth >= CONFIG.cursorBreakpoint;

  const enable = () => {
    document.body.classList.add('custom-cursor');
    cursorEl.classList.add('active');
    ringEl.classList.add('active');
  };

  const disable = () => {
    document.body.classList.remove('custom-cursor');
    cursorEl.classList.remove('active');
    ringEl.classList.remove('active');
  };

  const onMouseMove = ({ clientX, clientY }) => {
    mouseX = clientX;
    mouseY = clientY;
    cursorEl.style.left = `${mouseX}px`;
    cursorEl.style.top  = `${mouseY}px`;
  };

  const animateRing = () => {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ringEl.style.left = `${ringX}px`;
    ringEl.style.top  = `${ringY}px`;
    requestAnimationFrame(animateRing);
  };

  const attachHoverListeners = () => {
    document.querySelectorAll('a, button').forEach((el) => {
      el.addEventListener('mouseenter', () => {
        cursorEl.classList.add('cursor--hover');
        ringEl.classList.add('cursor--hover');
      });
      el.addEventListener('mouseleave', () => {
        cursorEl.classList.remove('cursor--hover');
        ringEl.classList.remove('cursor--hover');
      });
    });
  };

  const init = () => {
    if (!isDesktopPointer()) return;

    enable();
    cursorEl.style.pointerEvents = 'none';
    ringEl.style.pointerEvents = 'none';
    document.addEventListener('mousemove', onMouseMove, { passive: true });
    requestAnimationFrame(animateRing);
    attachHoverListeners();

    window.addEventListener('resize', () => {
      isDesktopPointer() ? enable() : disable();
    }, { passive: true });
  };

  return { init };
})();


/* ================================================================
   3. SCROLL REVEAL
   ─ Usa IntersectionObserver (performático, não usa scroll events).
================================================================ */
const ScrollReveal = (() => {
  const observerOptions = {
    threshold: 0.08,
    rootMargin: '0px 0px -40px 0px',
  };

  const onIntersect = (entries, observer) => {
    entries.forEach(({ isIntersecting, target }) => {
      if (!isIntersecting) return;
      target.classList.add('visible');
      observer.unobserve(target);
    });
  };

  const init = () => {
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach((el) =>
        el.classList.add('visible')
      );
      return;
    }

    const observer = new IntersectionObserver(onIntersect, observerOptions);
    document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));
  };

  return { init };
})();


/* ================================================================
   4. SMOOTH SCROLL
   ─ Scroll suave para links de âncora (#secao).
   ─ CORREÇÃO MOBILE: usa window.scrollTo() com cálculo manual
     de offset em vez de scrollIntoView({ behavior: 'smooth' }),
     que é ignorado em alguns browsers mobile (Safari iOS, WebView).
   ─ Desconta a altura do header fixo para não esconder o título.
================================================================ */
const SmoothScroll = (() => {
  const scrollToTarget = (target) => {
    const navHeight = document.querySelector('.nav')?.offsetHeight ?? 0;
    const targetTop = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

    try {
      window.scrollTo({ top: targetTop, behavior: 'smooth' });
    } catch (_) {
      // Fallback para browsers muito antigos
      window.scrollTo(0, targetTop);
    }
  };

  const init = () => {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const href = link.getAttribute('href');
        if (!href || href === '#') return;

        const target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();
        scrollToTarget(target);
      });
    });
  };

  return { init };
})();


/* ================================================================
   5. NAVIGATION
   ─ Toggle do menu mobile.
   ─ Fecha o menu ao clicar em um link ou fora da nav.
================================================================ */
const Navigation = (() => {
  const toggleBtn = document.getElementById('navToggle');
  const navMenu   = document.getElementById('navMenu');

  if (!toggleBtn || !navMenu) return { init: () => {} };

  const open = () => {
    navMenu.classList.add('is-open');
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.setAttribute('aria-label', 'Fechar menu de navegação');
  };

  const close = () => {
    navMenu.classList.remove('is-open');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-label', 'Abrir menu de navegação');
  };

  const toggle = () => {
    const isOpen = navMenu.classList.contains('is-open');
    isOpen ? close() : open();
  };

  const init = () => {
    toggleBtn.addEventListener('click', toggle);

    navMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', close);
    });

    document.addEventListener('click', ({ target }) => {
      const nav = document.querySelector('.nav');
      if (nav && !nav.contains(target)) close();
    });

    document.addEventListener('keydown', ({ key }) => {
      if (key === 'Escape') close();
    });
  };

  return { init };
})();


/* ================================================================
   6. WHATSAPP
   ─ Centraliza toda a lógica de redirecionamento.
   ─ Número configurado em CONFIG (único ponto de edição).
   ─ Botões de tipo usam data-whatsapp-type no HTML.
   ─ Botão principal #waLink usa href nativo (evita bloqueio mobile).
================================================================ */
const WhatsApp = (() => {
  const buildUrl = (type = CONFIG.whatsappDefaultType) => {
    const message = encodeURIComponent(CONFIG.whatsappMessage(type));
    return `https://wa.me/${CONFIG.whatsappPhone}?text=${message}`;
  };

  const openViaJS = (type) => {
    window.open(buildUrl(type), '_blank', 'noopener,noreferrer');
  };

  const init = () => {
    // Botões de tipo de ensaio (data-whatsapp-type)
    document.querySelectorAll('[data-whatsapp-type]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.whatsappType || CONFIG.whatsappDefaultType;
        openViaJS(type);
      });
    });

    // Botão principal "Agendar via WhatsApp" — href nativo para mobile
    const mainBtn = document.getElementById('waLink');
    if (mainBtn) {
      mainBtn.setAttribute('href', buildUrl(CONFIG.whatsappDefaultType));
      mainBtn.setAttribute('target', '_blank');
      mainBtn.setAttribute('rel', 'noopener noreferrer');
    }
  };

  return { init };
})();


/* ================================================================
   7. UTILS
================================================================ */
const Utils = {
  setCurrentYear() {
    const el = document.getElementById('currentYear');
    if (el) el.textContent = new Date().getFullYear();
  },
};


/* ================================================================
   8. INIT
================================================================ */
const App = {
  init() {
    CustomCursor.init();
    ScrollReveal.init();
    SmoothScroll.init();
    Navigation.init();
    WhatsApp.init();
    Utils.setCurrentYear();
  },
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}

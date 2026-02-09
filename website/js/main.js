/**
 * Stefan Zweig Genootschap Nederland
 * Main JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initScrollHeader();
  initFadeAnimations();
  initSmoothScroll();
  initLangSwitch();
  initForms();
});

/* --- Mobile Navigation --- */
function initNavigation() {
  const toggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('.main-nav');

  if (!toggle || !nav) return;

  toggle.addEventListener('click', () => {
    toggle.classList.toggle('active');
    nav.classList.toggle('active');
    document.body.style.overflow = nav.classList.contains('active') ? 'hidden' : '';
  });

  // Close on link click
  nav.querySelectorAll('.main-nav__link').forEach(link => {
    link.addEventListener('click', () => {
      toggle.classList.remove('active');
      nav.classList.remove('active');
      document.body.style.overflow = '';
    });
  });

  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('active')) {
      toggle.classList.remove('active');
      nav.classList.remove('active');
      document.body.style.overflow = '';
    }
  });
}

/* --- Scroll Header Effect --- */
function initScrollHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let lastScroll = 0;

  window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    header.classList.toggle('scrolled', currentScroll > 50);
    lastScroll = currentScroll;
  }, { passive: true });
}

/* --- Fade-in Animations --- */
function initFadeAnimations() {
  const elements = document.querySelectorAll('.fade-in');
  if (!elements.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  elements.forEach(el => observer.observe(el));
}

/* --- Language Switcher --- */
function initLangSwitch() {
  const buttons = document.querySelectorAll('.lang-switch__btn');
  if (!buttons.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.dataset.lang;
      // Update active state
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // For now show alert - in production this would redirect to /nl/, /de/, /en/
      if (lang !== 'nl') {
        const msgs = {
          de: 'Deutsche Version in Vorbereitung. Bitte schauen Sie bald wieder vorbei.',
          en: 'English version coming soon. Please check back later.'
        };
        // Create toast notification
        const toast = document.createElement('div');
        toast.style.cssText = 'position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);background:#2C1810;color:#F5ECD7;padding:1rem 2rem;border-radius:4px;font-size:0.9375rem;z-index:9999;box-shadow:0 4px 20px rgba(0,0,0,0.2);transition:opacity 0.3s;';
        toast.textContent = msgs[lang];
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; }, 2500);
        setTimeout(() => { toast.remove(); }, 3000);
        // Reset to NL
        setTimeout(() => {
          buttons.forEach(b => b.classList.remove('active'));
          document.querySelector('.lang-switch__btn[data-lang="nl"]')?.classList.add('active');
        }, 3000);
      }
    });
  });
}

/* --- Form Handling --- */
function initForms() {
  document.querySelectorAll('form').forEach(form => {
    if (form.getAttribute('action') === '#' || !form.getAttribute('action')) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        // Collect form data
        const data = new FormData(form);
        const entries = [];
        for (const [key, value] of data.entries()) {
          if (value) entries.push(`${key}: ${value}`);
        }

        // Show success message
        const msg = document.createElement('div');
        msg.style.cssText = 'padding:1.5rem;background:var(--gold-pale,#FDF8F0);border:1px solid var(--gold,#C9A84C);border-radius:4px;margin-top:1rem;font-size:0.9375rem;';
        msg.innerHTML = '<strong>Bedankt!</strong> Uw bericht is ontvangen. Wij nemen zo spoedig mogelijk contact met u op via e-mail.';

        // For newsletter forms, show shorter message
        if (form.classList.contains('newsletter-form') || form.querySelector('input[type="email"]:only-child, input[placeholder*="mailadres"]')) {
          msg.innerHTML = '<strong>Bedankt!</strong> U bent aangemeld voor de nieuwsbrief.';
        }

        form.style.display = 'none';
        form.parentNode.insertBefore(msg, form.nextSibling);
      });
    }
  });
}

/* --- Smooth Scroll --- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      const headerHeight = document.querySelector('.site-header')?.offsetHeight || 80;
      const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight;

      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    });
  });
}

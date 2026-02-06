/**
 * Internationalization (i18n) System
 *
 * Supports Dutch (nl) and English (en)
 * Dutch is the default language
 */

export type Language = 'nl' | 'en';

export const defaultLanguage: Language = 'nl';
export const supportedLanguages: Language[] = ['nl', 'en'];

export const translations = {
  // Site metadata
  siteName: {
    nl: 'Praat met je Boekhouding',
    en: 'Chat with your Books',
  },
  siteDescription: {
    nl: 'Verbind je Exact Online administratie met AI assistenten',
    en: 'Connect your Exact Online administration with AI assistants',
  },

  // Navigation
  nav: {
    docs: { nl: 'Documentatie', en: 'Documentation' },
    pricing: { nl: 'Prijzen', en: 'Pricing' },
    setup: { nl: 'Setup', en: 'Setup' },
    dashboard: { nl: 'Dashboard', en: 'Dashboard' },
    faq: { nl: 'Veelgestelde vragen', en: 'FAQ' },
    support: { nl: 'Support', en: 'Support' },
    blog: { nl: 'Blog', en: 'Blog' },
  },

  // Footer
  footer: {
    copyright: {
      nl: '© 2026 Chef Data B.V.',
      en: '© 2026 Chef Data B.V.',
    },
    terms: { nl: 'Algemene Voorwaarden', en: 'Terms & Conditions' },
    privacy: { nl: 'Privacy', en: 'Privacy' },
    contact: { nl: 'Contact', en: 'Contact' },
  },

  // Homepage
  home: {
    comingSoon: {
      nl: 'Nu beschikbaar',
      en: 'Now available',
    },
    interested: { nl: 'Probeer gratis', en: 'Try for free' },
    badge: {
      nl: 'Werkt met ChatGPT, Claude en Copilot',
      en: 'Works with ChatGPT, Claude and Copilot',
    },
    heroTitle1: { nl: 'Praat met je', en: 'Chat with your' },
    heroTitle2: { nl: 'boekhouding', en: 'accounting' },
    heroSubtitle: {
      nl: 'Stel vragen aan je Exact Online administratie alsof je met een collega praat. Binnen 5 minuten ingesteld.',
      en: 'Ask questions about your Exact Online administration like you would ask a colleague. Set up in 5 minutes.',
    },
    ctaStart: { nl: 'Probeer gratis', en: 'Try for free' },
    ctaDemo: { nl: 'Bekijk hoe het werkt', en: 'See how it works' },
    noCreditCard: {
      nl: 'Geen creditcard nodig - 200 opdrachten per maand gratis',
      en: 'No credit card required - 200 operations per month free',
    },
    worksWithAI: {
      nl: 'Werkt met je favoriete AI-assistent',
      en: 'Works with your favorite AI assistant',
    },

    // Features section
    featuresTitle: {
      nl: 'Grip op je cijfers zonder te zoeken in rapporten',
      en: 'Get control over your numbers without digging through reports',
    },

    feature1Title: { nl: 'Vraag in gewoon Nederlands', en: 'Ask in plain English' },
    feature1Desc: {
      nl: 'Stel vragen zoals je ze aan een collega zou stellen. Geen formules, geen filters.',
      en: 'Ask questions like you would ask a colleague. No formulas, no filters.',
    },
    feature1Example: {
      nl: '"Hoeveel hebben we deze maand gefactureerd?"',
      en: '"How much did we invoice this month?"',
    },

    feature2Title: { nl: 'Altijd actuele cijfers', en: 'Always current numbers' },
    feature2Desc: {
      nl: 'Direct verbonden met je Exact Online. Je ziet dezelfde data als in je administratie.',
      en: 'Directly connected to your Exact Online. You see the same data as in your administration.',
    },
    feature2Example: {
      nl: '"Welke facturen staan nog open?"',
      en: '"Which invoices are still outstanding?"',
    },

    feature3Title: { nl: 'Jouw data blijft van jou', en: 'Your data stays yours' },
    feature3Desc: {
      nl: 'Wij kunnen alleen lezen, nooit aanpassen. Je financiële gegevens slaan we niet op.',
      en: 'We can only read, never modify. We do not store your financial data.',
    },
    feature3Example: {
      nl: '"Toon de omzet per klant dit kwartaal"',
      en: '"Show revenue per customer this quarter"',
    },

    // How it works
    howItWorksTitle: { nl: 'Zo werkt het', en: 'How it works' },

    step1Title: { nl: 'Voeg de URL toe', en: 'Add the URL' },
    step1Desc: {
      nl: 'Voeg onze MCP URL toe aan Claude, ChatGPT of je favoriete AI.',
      en: 'Add our MCP URL to Claude, ChatGPT or your favorite AI.',
    },

    step2Title: { nl: 'Log in via browser', en: 'Log in via browser' },
    step2Desc: {
      nl: 'Bij je eerste vraag opent je browser. Log in met Exact Online.',
      en: 'On your first question, your browser opens. Log in with Exact Online.',
    },

    step3Title: { nl: 'Stel je vraag', en: 'Ask your question' },
    step3Desc: {
      nl: 'Vraag wat je wilt weten. In gewoon Nederlands (of Engels).',
      en: 'Ask what you want to know. In plain English (or Dutch).',
    },

    // Use cases
    useCasesTitle: { nl: 'Wat kun je ermee?', en: 'What can you do with it?' },

    useCase1: {
      nl: 'Hoeveel omzet hebben we deze maand gemaakt?',
      en: 'How much revenue did we generate this month?',
    },
    useCase2: {
      nl: 'Welke facturen zijn meer dan 30 dagen open?',
      en: 'Which invoices are overdue by more than 30 days?',
    },
    useCase3: {
      nl: 'Wie zijn mijn top 5 klanten dit jaar?',
      en: 'Who are my top 5 customers this year?',
    },
    useCase4: {
      nl: 'Wat zijn de totale kosten per categorie?',
      en: 'What are the total costs per category?',
    },
    useCase5: {
      nl: 'Vergelijk de omzet van Q1 met vorig jaar',
      en: 'Compare Q1 revenue with last year',
    },
    useCase6: {
      nl: 'Toon alle transacties met leverancier X',
      en: 'Show all transactions with supplier X',
    },

    andMuchMore: { nl: 'En nog veel meer...', en: 'And much more...' },

    // Pricing section
    pricingTitle: {
      nl: 'Probeer gratis, upgrade wanneer je wilt',
      en: 'Try for free, upgrade when you want',
    },
    pricingSubtitle: {
      nl: 'Begin gratis met ~60 vragen per maand. Meer nodig? Starter €9/maand, Pro €25/maand.',
      en: 'Start free with ~60 questions per month. Need more? Starter €9/month, Pro €25/month.',
    },
    startFree: { nl: 'Probeer gratis', en: 'Try for free' },
    viewPricing: { nl: 'Bekijk alle opties', en: 'View all options' },

    // FAQ
    faqTitle: { nl: 'Veelgestelde vragen', en: 'Frequently asked questions' },

    faq1Q: { nl: 'Is mijn data veilig?', en: 'Is my data safe?' },
    faq1A: {
      nl: 'Ja. Wij slaan geen financiële data op. Alle verzoeken gaan direct naar Exact Online met jouw toestemming. Je kunt de toegang op elk moment intrekken.',
      en: 'Yes. We do not store any financial data. All requests go directly to Exact Online with your permission. You can revoke access at any time.',
    },

    faq2Q: { nl: 'Welke AI-assistenten werken hiermee?', en: 'Which AI assistants work with this?' },
    faq2A: {
      nl: 'ChatGPT (Plus, Team of Enterprise), Claude en GitHub Copilot. Wij begeleiden je stap voor stap bij het instellen.',
      en: 'ChatGPT (Plus, Team or Enterprise), Claude and GitHub Copilot. We guide you step by step through the setup.',
    },

    faq3Q: { nl: 'Heb ik technische kennis nodig?', en: 'Do I need technical knowledge?' },
    faq3A: {
      nl: 'Nee. Je kopieert een stukje configuratie en volgt onze handleiding. De meeste gebruikers zijn binnen 5 minuten klaar.',
      en: 'No. You copy a piece of configuration and follow our guide. Most users are done within 5 minutes.',
    },

    faq4Q: { nl: 'Hoe werkt de koppeling technisch?', en: 'How does the connection work technically?' },
    faq4A: {
      nl: 'Wij gebruiken een beveiligde verbinding waarmee AI-assistenten veilig met je boekhouddata kunnen praten. Je data blijft bij Exact Online, wij kunnen alleen lezen. Je hoeft hier zelf niets van te weten - wij regelen de techniek.',
      en: 'We use a secure connection that allows AI assistants to safely communicate with your accounting data. Your data stays with Exact Online, we can only read. You don\'t need to know anything about this - we handle the technical side.',
    },
  },

  // Connect page
  connect: {
    title: { nl: 'Verbind je Exact Online', en: 'Connect your Exact Online' },
    subtitle: {
      nl: 'Binnen 2 minuten stel je je eerste vraag',
      en: 'Ask your first question within 2 minutes',
    },
    regionLabel: { nl: 'In welk land gebruik je Exact Online?', en: 'In which country do you use Exact Online?' },
    regionNetherlands: { nl: 'Nederland', en: 'Netherlands' },
    regionBelgium: { nl: 'België', en: 'Belgium' },
    regionGermany: { nl: 'Duitsland', en: 'Germany' },
    regionUK: { nl: 'Verenigd Koninkrijk', en: 'United Kingdom' },
    regionUS: { nl: 'Verenigde Staten', en: 'United States' },
    regionSpain: { nl: 'Spanje', en: 'Spain' },
    regionFrance: { nl: 'Frankrijk', en: 'France' },
    connectButton: { nl: 'Verbinden met Exact Online', en: 'Connect to Exact Online' },
    whatHappens: { nl: 'Dit gebeurt er', en: 'This is what happens' },
    step1: {
      nl: 'Je logt in met je Exact Online account',
      en: 'You log in with your Exact Online account',
    },
    step2: {
      nl: 'Je geeft toestemming om je administratie te lezen',
      en: 'You give permission to read your administration',
    },
    step3: {
      nl: 'Je krijgt direct een sleutel om te gebruiken met je AI-assistent',
      en: 'You immediately receive a key to use with your AI assistant',
    },
    securityNote: {
      nl: 'Wij kunnen alleen lezen, nooit boekingen aanpassen. Je trekt de toegang in wanneer je wilt.',
      en: 'We can only read, never modify bookings. Revoke access whenever you want.',
    },
  },

  // Callback page
  callback: {
    successTitle: { nl: 'Verbonden', en: 'Connected' },
    successSubtitle: {
      nl: 'Je Exact Online account is gekoppeld. Kopieer je sleutel en stel je AI-assistent in.',
      en: 'Your Exact Online account is linked. Copy your key and configure your AI assistant.',
    },
    accountDetails: { nl: 'Je account', en: 'Your account' },
    name: { nl: 'Naam', en: 'Name' },
    email: { nl: 'E-mail', en: 'Email' },
    currentDivision: { nl: 'Actieve administratie', en: 'Active administration' },
    availableAdmins: { nl: 'Beschikbare administraties', en: 'Available administrations' },
    yourApiKey: { nl: 'Je sleutel', en: 'Your key' },
    saveKeyWarning: {
      nl: 'Kopieer deze sleutel nu. Om veiligheidsredenen tonen we hem maar één keer.',
      en: 'Copy this key now. For security reasons, we only show it once.',
    },
    copyApiKey: { nl: 'Kopieer sleutel', en: 'Copy key' },
    copied: { nl: 'Gekopieerd', en: 'Copied' },
    toDashboard: { nl: 'Naar je dashboard', en: 'Go to dashboard' },
    configureAI: { nl: 'AI-assistent instellen', en: 'Configure AI assistant' },
    errorTitle: { nl: 'Verbinden niet gelukt', en: 'Connection failed' },
    errorSubtitle: {
      nl: 'Er ging iets mis. Probeer het opnieuw of neem contact met ons op als het blijft gebeuren.',
      en: 'Something went wrong. Try again or contact us if it keeps happening.',
    },
    tryAgain: { nl: 'Opnieuw proberen', en: 'Try again' },
  },

  // Dashboard
  dashboard: {
    title: { nl: 'Dashboard', en: 'Dashboard' },
    notLoggedIn: { nl: 'Niet ingelogd', en: 'Not logged in' },
    notConnected: {
      nl: 'Je hebt nog geen Exact Online account verbonden.',
      en: 'You have not yet connected an Exact Online account.',
    },
    connectNow: { nl: 'Verbinden', en: 'Connect' },
    welcome: { nl: 'Welkom', en: 'Welcome' },
    logout: { nl: 'Uitloggen', en: 'Log out' },
    plan: { nl: 'Abonnement', en: 'Plan' },
    apiCallsUsed: { nl: 'Opdrachten deze maand', en: 'Operations this month' },
    unlimited: { nl: 'onbeperkt', en: 'unlimited' },
    connections: { nl: 'Verbonden accounts', en: 'Connected accounts' },
    noConnections: {
      nl: 'Verbind je eerste Exact Online account om te beginnen.',
      en: 'Connect your first Exact Online account to get started.',
    },
    addConnection: { nl: 'Account toevoegen', en: 'Add account' },
    region: { nl: 'Regio', en: 'Region' },
    divisions: { nl: 'Administraties', en: 'Administrations' },
    default: { nl: 'actief', en: 'active' },
    apiKeys: { nl: 'Sleutels', en: 'Keys' },
    noApiKeys: { nl: 'Je hebt nog geen sleutels aangemaakt.', en: 'You have not created any keys yet.' },
    createApiKey: { nl: 'Nieuwe sleutel', en: 'New key' },
    keyName: { nl: 'Naam', en: 'Name' },
    created: { nl: 'Aangemaakt', en: 'Created' },
    lastUsed: { nl: 'Laatst gebruikt', en: 'Last used' },
    never: { nl: 'Nog niet', en: 'Not yet' },
    revoke: { nl: 'Intrekken', en: 'Revoke' },
    revokeConfirm: {
      nl: 'Weet je zeker dat je deze sleutel wilt intrekken? Dit kun je niet ongedaan maken.',
      en: 'Are you sure you want to revoke this key? This cannot be undone.',
    },
    quickSetup: { nl: 'Snel instellen', en: 'Quick setup' },
    copyConfig: { nl: 'Kopieer', en: 'Copy' },
  },

  // Setup page
  setup: {
    title: { nl: 'Instellen', en: 'Setup' },
    step1Title: { nl: 'Kies je AI-assistent', en: 'Choose your AI assistant' },
    step2Title: { nl: 'Kopieer de configuratie', en: 'Copy the configuration' },
    step3Title: { nl: 'Test de verbinding', en: 'Test the connection' },
    selectTool: { nl: 'Selecteer', en: 'Select' },
    copyButton: { nl: 'Kopieer', en: 'Copy' },
    testQuestion: {
      nl: 'Stel een vraag om te controleren of alles werkt',
      en: 'Ask a question to check if everything works',
    },
  },

  // Pricing page
  pricing: {
    title: { nl: 'Prijzen', en: 'Pricing' },
    subtitle: {
      nl: 'Kies het plan dat bij je past',
      en: 'Choose the plan that suits you',
    },
    free: { nl: 'Gratis', en: 'Free' },
    pro: { nl: 'Pro', en: 'Pro' },
    enterprise: { nl: 'Enterprise', en: 'Enterprise' },
    perMonth: { nl: '/maand', en: '/month' },
    questionsPerMonth: { nl: 'opdrachten per maand', en: 'operations per month' },
    unlimited: { nl: 'Onbeperkt', en: 'Unlimited' },
    currentPlan: { nl: 'Huidig plan', en: 'Current plan' },
    upgrade: { nl: 'Upgraden', en: 'Upgrade' },
    contactUs: { nl: 'Neem contact op', en: 'Contact us' },
  },

  // Common
  common: {
    loading: { nl: 'Laden...', en: 'Loading...' },
    error: { nl: 'Fout', en: 'Error' },
    success: { nl: 'Gelukt', en: 'Success' },
    cancel: { nl: 'Annuleren', en: 'Cancel' },
    save: { nl: 'Opslaan', en: 'Save' },
    delete: { nl: 'Verwijderen', en: 'Delete' },
    edit: { nl: 'Bewerken', en: 'Edit' },
    back: { nl: 'Terug', en: 'Back' },
    next: { nl: 'Volgende', en: 'Next' },
    close: { nl: 'Sluiten', en: 'Close' },
  },

  // OAuth login
  oauth: {
    loginTitle: { nl: 'Log in om door te gaan', en: 'Log in to continue' },
    wantsAccess: {
      nl: 'wil toegang tot je Exact Online gegevens.',
      en: 'wants access to your Exact Online data.',
    },
    mustLogin: {
      nl: 'Log eerst in met je Exact Online account om toegang te geven.',
      en: 'First log in with your Exact Online account to grant access.',
    },
    loginWithExact: { nl: 'Inloggen met Exact Online', en: 'Log in with Exact Online' },
    afterLogin: {
      nl: 'Na het inloggen geef je toegang aan',
      en: 'After logging in, you grant access to',
    },
    grantAccessTitle: { nl: 'Toegang geven?', en: 'Grant access?' },
    requestsAccess: {
      nl: 'vraagt om toegang tot je account.',
      en: 'is requesting access to your account.',
    },
    loggedInAs: { nl: 'Je bent ingelogd als:', en: 'You are logged in as:' },
    appCanDo: { nl: 'Deze applicatie kan:', en: 'This application can:' },
    readData: {
      nl: 'Je Exact Online gegevens lezen (facturen, klanten, etc.)',
      en: 'Read your Exact Online data (invoices, customers, etc.)',
    },
    viewProfile: {
      nl: 'Je naam en e-mailadres zien',
      en: 'View your name and email address',
    },
    noModify: {
      nl: 'Deze applicatie kan geen wijzigingen maken in je administratie.',
      en: 'This application cannot make changes to your administration.',
    },
    grantAccess: { nl: 'Toegang geven', en: 'Grant access' },
    deny: { nl: 'Weigeren', en: 'Deny' },
    privacyAgree: {
      nl: 'Door toegang te geven ga je akkoord met onze',
      en: 'By granting access, you agree to our',
    },
    privacyPolicy: { nl: 'privacyverklaring', en: 'privacy policy' },
    authError: { nl: 'Inloggen niet gelukt', en: 'Login failed' },
  },

  // Support system
  support: {
    title: { nl: 'Support', en: 'Support' },
    subtitle: {
      nl: 'Hoe kunnen we je helpen?',
      en: 'How can we help you?',
    },
    searchPlaceholder: {
      nl: 'Zoek in artikelen en vragen...',
      en: 'Search articles and questions...',
    },
    featuredArticles: { nl: 'Populaire Artikelen', en: 'Popular Articles' },
    allArticles: { nl: 'Alle Artikelen', en: 'All Articles' },
    startConversation: { nl: 'Start een gesprek', en: 'Start a conversation' },
    yourConversations: { nl: 'Je Gesprekken', en: 'Your Conversations' },
    noConversations: {
      nl: 'Nog geen gesprekken',
      en: 'No conversations yet',
    },
    newConversation: { nl: 'Nieuw Gesprek', en: 'New Conversation' },
    categories: {
      connection: { nl: 'Verbinding', en: 'Connection' },
      billing: { nl: 'Facturatie', en: 'Billing' },
      bug: { nl: 'Technisch', en: 'Technical' },
      feature: { nl: 'Features', en: 'Features' },
      account: { nl: 'Account', en: 'Account' },
      other: { nl: 'Overig', en: 'Other' },
    },
    status: {
      open: { nl: 'Open', en: 'Open' },
      waiting_user: { nl: 'Wacht op jou', en: 'Waiting for you' },
      waiting_support: { nl: 'Wacht op support', en: 'Waiting for support' },
      resolved: { nl: 'Opgelost', en: 'Resolved' },
      closed: { nl: 'Gesloten', en: 'Closed' },
    },
    priority: {
      low: { nl: 'Laag', en: 'Low' },
      normal: { nl: 'Normaal', en: 'Normal' },
      high: { nl: 'Hoog', en: 'High' },
      urgent: { nl: 'Urgent', en: 'Urgent' },
    },
    sendMessage: { nl: 'Verstuur', en: 'Send' },
    messagePlaceholder: {
      nl: 'Typ je bericht...',
      en: 'Type your message...',
    },
    resolved: { nl: 'Opgelost', en: 'Resolved' },
    markResolved: { nl: 'Markeer als opgelost', en: 'Mark as resolved' },
    rateExperience: {
      nl: 'Hoe was je ervaring?',
      en: 'How was your experience?',
    },
    thanksFeedback: {
      nl: 'Bedankt voor je feedback!',
      en: 'Thanks for your feedback!',
    },
    articleHelpful: {
      nl: 'Was dit artikel nuttig?',
      en: 'Was this article helpful?',
    },
    yes: { nl: 'Ja', en: 'Yes' },
    no: { nl: 'Nee', en: 'No' },
    relatedArticles: { nl: 'Gerelateerde artikelen', en: 'Related articles' },
    needMoreHelp: { nl: 'Nog hulp nodig?', en: 'Need more help?' },
    systemPaused: {
      nl: 'Het support systeem is tijdelijk niet beschikbaar.',
      en: 'The support system is temporarily unavailable.',
    },
    systemDisabled: {
      nl: 'Support is momenteel niet beschikbaar.',
      en: 'Support is currently unavailable.',
    },
  },
} as const;

/**
 * Get translation for a key path
 */
export function t(
  key: string,
  lang: Language = defaultLanguage
): string {
  const keys = key.split('.');
  let result: any = translations;

  for (const k of keys) {
    if (result && typeof result === 'object' && k in result) {
      result = result[k];
    } else {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }
  }

  if (result && typeof result === 'object' && lang in result) {
    return result[lang];
  }

  console.warn(`Translation not found for key: ${key}, lang: ${lang}`);
  return key;
}

/**
 * Detect language from URL path
 */
export function getLanguageFromPath(pathname: string): Language {
  if (pathname.startsWith('/en/') || pathname === '/en') {
    return 'en';
  }
  return 'nl';
}

/**
 * Pages that have English translations
 * Add new pages here when creating /en/ versions
 */
const translatedPages = [
  '/',
  '/docs',
  '/faq',
  '/pricing',
  '/setup',
  '/connect',
];

/**
 * Check if a page has a translation available
 */
export function hasTranslation(pathname: string): boolean {
  // Remove /en prefix if present
  const basePath = pathname.replace(/^\/en\/?/, '/').replace(/\/$/, '') || '/';
  return translatedPages.includes(basePath);
}

/**
 * Get path for a different language
 */
export function getPathForLanguage(pathname: string, targetLang: Language): string {
  const currentLang = getLanguageFromPath(pathname);

  if (currentLang === 'en') {
    // Remove /en prefix
    const pathWithoutLang = pathname.replace(/^\/en\/?/, '/') || '/';
    if (targetLang === 'nl') {
      return pathWithoutLang;
    }
    return pathname;
  } else {
    // Add /en prefix
    if (targetLang === 'en') {
      return `/en${pathname === '/' ? '' : pathname}`;
    }
    return pathname;
  }
}

/**
 * Get all translations for a language (useful for passing to client)
 */
export function getAllTranslations(lang: Language): Record<string, string> {
  const result: Record<string, string> = {};

  function flatten(obj: any, prefix = '') {
    for (const key in obj) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (value && typeof value === 'object') {
        if ('nl' in value && 'en' in value) {
          result[newKey] = value[lang];
        } else {
          flatten(value, newKey);
        }
      }
    }
  }

  flatten(translations);
  return result;
}

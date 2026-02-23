import { WizardStepDef } from '@/lib/types'

// ============================================
// PROJECT SCOPES
// ============================================
export type ProjectScope =
  | 'website'
  | 'branding'
  | 'rebranding_strategy'
  | 'marketing_materials'
  | 'performance'
  | 'digital_audit'
  | 'other'

// Which steps are shown for each scope (by step key)
export const scopeStepMap: Record<ProjectScope, string[]> = {
  website: [
    'project_start',
    'company_basics',
    'website_details',
    'design_guidelines',
    'budget_final',
  ],
  branding: [
    'project_start',
    'company_basics',
    'brand_foundations',
    'target_audience',
    'design_guidelines',
    'budget_final',
  ],
  rebranding_strategy: [
    'project_start',
    'company_full',
    'brand_situation',
    'target_audience',
    'brand_promise',
    'budget_final',
  ],
  marketing_materials: [
    'project_start',
    'company_basics',
    'target_audience',
    'marketing_details',
    'budget_final',
  ],
  performance: [
    'project_start',
    'company_basics',
    'performance_goals',
    'website_audit',
    'budget_final',
  ],
  digital_audit: [
    'project_start',
    'company_basics',
    'website_audit',
    'market_competition',
    'performance_goals',
    'budget_final',
  ],
  other: [
    'project_start',
    'company_full',
    'market_competition',
    'target_audience',
    'brand_promise',
    'design_guidelines',
    'budget_final',
  ],
}

// Scope selection options
export const scopeOptions = [
  {
    value: 'website' as ProjectScope,
    label: { pl: 'Strona internetowa', en: 'Website' },
    description: {
      pl: 'Nowa strona, redesign lub e-commerce',
      en: 'New website, redesign, or e-commerce',
    },
  },
  {
    value: 'branding' as ProjectScope,
    label: { pl: 'Branding', en: 'Branding' },
    description: {
      pl: 'Nowa identyfikacja wizualna od podstaw',
      en: 'New visual identity from scratch',
    },
  },
  {
    value: 'rebranding_strategy' as ProjectScope,
    label: { pl: 'Rebranding / Strategia', en: 'Rebranding / Strategy' },
    description: {
      pl: 'Zmiana wizerunku lub strategia marki',
      en: 'Brand refresh or brand strategy',
    },
  },
  {
    value: 'marketing_materials' as ProjectScope,
    label: { pl: 'Materiały marketingowe', en: 'Marketing Materials' },
    description: {
      pl: 'Katalogi, ulotki, social media, prezentacje',
      en: 'Catalogs, flyers, social media, presentations',
    },
  },
  {
    value: 'performance' as ProjectScope,
    label: { pl: 'Performance & Growth', en: 'Performance & Growth' },
    description: {
      pl: 'SEO, kampanie ads, konwersje i analityka',
      en: 'SEO, ad campaigns, conversions & analytics',
    },
  },
  {
    value: 'digital_audit' as ProjectScope,
    label: { pl: 'Audyt Digital', en: 'Digital Audit' },
    description: {
      pl: 'Przegl\u0105d strony, konkurencji i performance',
      en: 'Website, competition & performance review',
    },
  },
  {
    value: 'other' as ProjectScope,
    label: { pl: 'Inne', en: 'Other' },
    description: {
      pl: 'Niestandardowy projekt',
      en: 'Custom project',
    },
  },
]

// ============================================
// ALL WIZARD STEPS
// ============================================
export const wizardSteps: WizardStepDef[] = [

  // ============================================
  // STEP: Project Start (replaces project_overview)
  // — lighter: name, description, timeline only
  // ============================================
  {
    key: 'project_start',
    number: 0,
    title: {
      pl: 'Twój projekt',
      en: 'Your Project',
    },
    description: {
      pl: 'Na początek — co robimy i na kiedy?',
      en: 'First things first — what and when?',
    },
    fields: [
      {
        key: 'project_name',
        type: 'text',
        label: { pl: 'Nazwa projektu', en: 'Project name' },
        placeholder: { pl: 'np. Nowa strona, Rebrand 2026', en: 'e.g., New website, Rebrand 2026' },
        required: true,
      },
      {
        key: 'project_description',
        type: 'textarea',
        label: { pl: 'O co chodzi w projekcie?', en: 'What is the project about?' },
        placeholder: { pl: 'Opisz w 2-3 zdaniach co chcesz osiągnąć', en: 'Describe in 2-3 sentences what you want to achieve' },
        required: true,
      },
      {
        key: 'project_timeline',
        type: 'select',
        label: { pl: 'Kiedy chcesz to mieć?', en: 'When do you need it?' },
        required: false,
        options: [
          { value: 'asap', label: { pl: 'Jak najszybciej (1–2 tyg.)', en: 'ASAP (1–2 weeks)' } },
          { value: '1_month', label: { pl: 'W ciągu miesiąca', en: 'Within a month' } },
          { value: '2_3_months', label: { pl: '2–3 miesiące', en: '2–3 months' } },
          { value: '3_6_months', label: { pl: '3–6 miesięcy', en: '3–6 months' } },
          { value: 'flexible', label: { pl: 'Bez pośpiechu', en: 'No rush' } },
        ],
      },
    ],
  },

  // ============================================
  // STEP: Company Basics (light version)
  // — for website, branding, marketing, performance, audit
  // — only essential: name, what you do, scope
  // ============================================
  {
    key: 'company_basics',
    number: 1,
    title: {
      pl: 'O firmie',
      en: 'About Your Company',
    },
    description: {
      pl: 'Kilka słów o Twojej firmie',
      en: 'A few words about your company',
    },
    fields: [
      {
        key: 'company_name',
        type: 'text',
        label: { pl: 'Nazwa firmy', en: 'Company name' },
        placeholder: { pl: 'np. Tech Solutions Sp. z o.o.', en: 'e.g., Tech Solutions Inc.' },
        required: true,
      },
      {
        key: 'company_description',
        type: 'textarea',
        label: { pl: 'Czym się zajmujecie?', en: 'What do you do?' },
        placeholder: { pl: 'Główne produkty lub usługi, branża', en: 'Main products or services, industry' },
        required: true,
      },
      {
        key: 'business_scope',
        type: 'text',
        label: { pl: 'Rynek i zasięg', en: 'Market & reach' },
        placeholder: { pl: 'np. Polska, e-commerce B2C', en: 'e.g., Europe, B2B SaaS' },
        required: false,
      },
      {
        key: 'company_website',
        type: 'url',
        label: { pl: 'Strona internetowa', en: 'Website' },
        placeholder: { pl: 'https://...', en: 'https://...' },
        required: false,
      },
    ],
  },

  // ============================================
  // STEP: Company Full (extended version)
  // — for rebranding/strategy and "other"
  // — includes history, mission, differentiators
  // ============================================
  {
    key: 'company_full',
    number: 2,
    title: {
      pl: 'O firmie i marce',
      en: 'About Your Company & Brand',
    },
    description: {
      pl: 'Opowiedz więcej — potrzebujemy pełnego obrazu',
      en: 'Tell us more — we need the full picture',
    },
    fields: [
      {
        key: 'company_name',
        type: 'text',
        label: { pl: 'Nazwa firmy', en: 'Company name' },
        placeholder: { pl: 'np. Tech Solutions Sp. z o.o.', en: 'e.g., Tech Solutions Inc.' },
        required: true,
      },
      {
        key: 'company_description',
        type: 'textarea',
        label: { pl: 'Czym się zajmujecie?', en: 'What do you do?' },
        placeholder: { pl: 'Główne produkty lub usługi, branża', en: 'Main products or services, industry' },
        required: true,
      },
      {
        key: 'company_age',
        type: 'text',
        label: { pl: 'Od kiedy działacie?', en: 'How long in business?' },
        placeholder: { pl: 'np. Od 2015 lub Start-up', en: 'e.g., Since 2015 or Start-up' },
        required: false,
      },
      {
        key: 'business_scope',
        type: 'text',
        label: { pl: 'Rynek i zasięg', en: 'Market & reach' },
        placeholder: { pl: 'np. Polska, e-commerce B2C', en: 'e.g., Europe, B2B SaaS' },
        required: false,
      },
      {
        key: 'competitive_advantage',
        type: 'textarea',
        label: { pl: 'Co Was wyróżnia?', en: 'What sets you apart?' },
        placeholder: { pl: 'Wasza największa przewaga nad konkurencją', en: 'Your biggest advantage over competitors' },
        required: false,
      },
      {
        key: 'company_website',
        type: 'url',
        label: { pl: 'Strona internetowa', en: 'Website' },
        placeholder: { pl: 'https://...', en: 'https://...' },
        required: false,
      },
    ],
  },

  // ============================================
  // STEP: Brand Foundations (new brands — branding scope)
  // ============================================
  {
    key: 'brand_foundations',
    number: 3,
    title: {
      pl: 'Wizja marki',
      en: 'Brand Vision',
    },
    description: {
      pl: 'Jak ma wyglądać Twoja nowa marka?',
      en: 'What should your new brand look like?',
    },
    fields: [
      {
        key: 'brand_origin_story',
        type: 'textarea',
        label: { pl: 'Skąd pomysł na markę?', en: 'What inspired the brand?' },
        placeholder: { pl: 'Historia, motywacja, dlaczego to robicie', en: 'The story, motivation, why you\'re doing this' },
        required: true,
      },
      {
        key: 'desired_perception',
        type: 'textarea',
        label: { pl: 'Jak chcesz być postrzegany?', en: 'How do you want to be perceived?' },
        placeholder: { pl: 'Jakie skojarzenia ma budzić marka? (np. nowoczesna, godna zaufania)', en: 'What should the brand evoke? (e.g., modern, trustworthy)' },
        required: false,
      },
      {
        key: 'brand_values',
        type: 'textarea',
        label: { pl: 'Wartości marki', en: 'Brand values' },
        placeholder: { pl: '3-5 kluczowych wartości (np. jakość, innowacja, prostota)', en: '3-5 core values (e.g., quality, innovation, simplicity)' },
        required: false,
      },
      {
        key: 'competitor_references',
        type: 'textarea',
        label: { pl: 'Marki, które Ci się podobają', en: 'Brands you admire' },
        placeholder: { pl: 'Podaj 2-3 marki z dowolnej branży i co Ci w nich imponuje', en: 'Name 2-3 brands from any industry and what you admire' },
        required: false,
      },
    ],
  },

  // ============================================
  // STEP: Brand Situation (existing brand — rebranding/strategy)
  // ============================================
  {
    key: 'brand_situation',
    number: 4,
    title: {
      pl: 'Obecna marka',
      en: 'Current Brand',
    },
    description: {
      pl: 'Co mamy dziś i co chcemy zmienić?',
      en: 'What do we have today and what do we want to change?',
    },
    fields: [
      {
        key: 'brand_history',
        type: 'textarea',
        label: { pl: 'Krótka historia marki', en: 'Brief brand history' },
        placeholder: { pl: 'Kiedy powstała, kluczowe momenty, zmiany', en: 'When it started, key moments, changes' },
        required: false,
      },
      {
        key: 'brand_perception',
        type: 'textarea',
        label: { pl: 'Jak jesteście postrzegani?', en: 'How are you perceived?' },
        placeholder: { pl: 'Jak klienci widzą markę? Co działa, co nie?', en: 'How do customers see the brand? What works, what doesn\'t?' },
        required: false,
      },
      {
        key: 'change_motivation',
        type: 'textarea',
        label: { pl: 'Dlaczego zmiana?', en: 'Why the change?' },
        placeholder: { pl: 'Co jest powodem rebrandingu lub zmiany strategii?', en: 'What\'s driving the rebrand or strategy change?' },
        required: true,
      },
      {
        key: 'what_to_keep',
        type: 'textarea',
        label: { pl: 'Co chcesz zachować?', en: 'What do you want to keep?' },
        placeholder: { pl: 'Elementy marki, które działają i powinny zostać', en: 'Brand elements that work and should stay' },
        required: false,
      },
    ],
  },

  // ============================================
  // STEP: Target Audience (simplified)
  // ============================================
  {
    key: 'target_audience',
    number: 5,
    title: {
      pl: 'Twój klient',
      en: 'Your Customer',
    },
    description: {
      pl: 'Dla kogo to robimy?',
      en: 'Who are we doing this for?',
    },
    fields: [
      {
        key: 'offer_target',
        type: 'textarea',
        label: { pl: 'Kto jest Twoim klientem?', en: 'Who is your customer?' },
        placeholder: { pl: 'np. właściciele małych firm, młode mamy, działy HR w korporacjach', en: 'e.g., small business owners, young moms, HR departments in corporations' },
        required: true,
      },
      {
        key: 'demographics',
        type: 'textarea',
        label: { pl: 'Podstawowe cechy', en: 'Basic characteristics' },
        placeholder: { pl: 'Wiek, lokalizacja, poziom dochodów, branża', en: 'Age, location, income level, industry' },
        required: false,
      },
      {
        key: 'audience_pain_points',
        type: 'textarea',
        label: { pl: 'Jakie problemy rozwiązujesz?', en: 'What problems do you solve?' },
        placeholder: { pl: 'Główne bolączki klientów, na które odpowiadasz', en: 'Main customer pain points you address' },
        required: false,
      },
    ],
  },

  // ============================================
  // STEP: Brand Promise (for rebranding/strategy/other)
  // — simplified: positioning + tone + values
  // ============================================
  {
    key: 'brand_promise',
    number: 6,
    title: {
      pl: 'Komunikacja marki',
      en: 'Brand Communication',
    },
    description: {
      pl: 'Jak marka powinna mówić i co obiecuje?',
      en: 'How should the brand speak and what does it promise?',
    },
    fields: [
      {
        key: 'positioning_statement',
        type: 'textarea',
        label: { pl: 'Pozycjonowanie jednym zdaniem', en: 'Positioning in one sentence' },
        placeholder: { pl: 'Dla [kto], [marka] jest [czym], bo [dlaczego]', en: 'For [who], [brand] is [what], because [why]' },
        required: false,
        helpText: { pl: 'Nie musi być idealne — chodzi o kierunek', en: 'Doesn\'t have to be perfect — just the direction' },
      },
      {
        key: 'communication_style',
        type: 'textarea',
        label: { pl: 'Ton komunikacji', en: 'Communication tone' },
        placeholder: { pl: 'np. przyjazny i bezpośredni, formalny i ekspercki', en: 'e.g., friendly and direct, formal and expert' },
        required: false,
      },
      {
        key: 'key_messages',
        type: 'textarea',
        label: { pl: 'Co chcesz komunikować?', en: 'What do you want to communicate?' },
        placeholder: { pl: '2-3 najważniejsze rzeczy, które klient powinien zapamiętać', en: '2-3 most important things the customer should remember' },
        required: false,
      },
    ],
  },

  // ============================================
  // STEP: Market & Competition (simplified)
  // ============================================
  {
    key: 'market_competition',
    number: 7,
    title: {
      pl: 'Konkurencja',
      en: 'Competition',
    },
    description: {
      pl: 'Kto jest Twoją konkurencją?',
      en: 'Who is your competition?',
    },
    fields: [
      {
        key: 'main_competitors',
        type: 'textarea',
        label: { pl: 'Główni konkurenci', en: 'Main competitors' },
        placeholder: { pl: 'Wymień 3-5 konkurentów (nazwy lub linki)', en: 'List 3-5 competitors (names or links)' },
        required: false,
      },
      {
        key: 'competitor_websites',
        type: 'textarea',
        label: { pl: 'Strony konkurentów', en: 'Competitor websites' },
        placeholder: { pl: 'URL-e (jeden na linię)', en: 'URLs (one per line)' },
        required: false,
      },
      {
        key: 'what_you_like_dislike',
        type: 'textarea',
        label: { pl: 'Co Ci się podoba / nie podoba u konkurencji?', en: 'What do you like / dislike about competitors?' },
        placeholder: { pl: 'Konkretne elementy — design, komunikacja, oferta', en: 'Specific elements — design, messaging, offer' },
        required: false,
      },
    ],
  },

  // ============================================
  // STEP: Marketing Materials Details
  // ============================================
  {
    key: 'marketing_details',
    number: 8,
    title: {
      pl: 'Materiały',
      en: 'Materials',
    },
    description: {
      pl: 'Jakie materiały potrzebujesz?',
      en: 'What materials do you need?',
    },
    fields: [
      {
        key: 'material_types',
        type: 'checkbox',
        label: { pl: 'Rodzaje materiałów', en: 'Types of materials' },
        required: true,
        options: [
          { value: 'catalog', label: { pl: 'Katalog / broszura', en: 'Catalog / brochure' } },
          { value: 'flyer', label: { pl: 'Ulotka / folder', en: 'Flyer / leaflet' } },
          { value: 'presentation', label: { pl: 'Prezentacja', en: 'Presentation' } },
          { value: 'social_media_kit', label: { pl: 'Social media (posty, stories)', en: 'Social media (posts, stories)' } },
          { value: 'rollup_banner', label: { pl: 'Roll-up / baner', en: 'Roll-up / banner' } },
          { value: 'business_cards', label: { pl: 'Wizytówki', en: 'Business cards' } },
          { value: 'packaging', label: { pl: 'Opakowania', en: 'Packaging' } },
          { value: 'newsletter_template', label: { pl: 'Szablon newslettera', en: 'Newsletter template' } },
          { value: 'other_material', label: { pl: 'Inne', en: 'Other' } },
        ],
      },
      {
        key: 'material_purpose',
        type: 'textarea',
        label: { pl: 'Gdzie będą używane?', en: 'Where will they be used?' },
        placeholder: { pl: 'np. targi, kampania online, spotkania z klientami', en: 'e.g., trade shows, online campaign, client meetings' },
        required: false,
      },
      {
        key: 'has_brand_guidelines',
        type: 'radio',
        label: { pl: 'Masz wytyczne brandowe?', en: 'Do you have brand guidelines?' },
        required: false,
        options: [
          { value: 'yes_complete', label: { pl: 'Tak, pełny brand book', en: 'Yes, full brand book' } },
          { value: 'yes_partial', label: { pl: 'Częściowe (logo, kolory)', en: 'Partial (logo, colors)' } },
          { value: 'no', label: { pl: 'Nie', en: 'No' } },
        ],
      },
      {
        key: 'material_content_ready',
        type: 'radio',
        label: { pl: 'Treści gotowe?', en: 'Content ready?' },
        required: false,
        options: [
          { value: 'yes', label: { pl: 'Tak', en: 'Yes' } },
          { value: 'partially', label: { pl: 'Częściowo', en: 'Partially' } },
          { value: 'no', label: { pl: 'Nie, potrzebujemy copywritingu', en: 'No, we need copywriting' } },
        ],
      },
    ],
  },

  // ============================================
  // STEP: Design Guidelines (simplified)
  // — references + character + sliders
  // ============================================
  {
    key: 'design_guidelines',
    number: 9,
    title: {
      pl: 'Styl i design',
      en: 'Style & Design',
    },
    description: {
      pl: 'Jak powinien wyglądać projekt?',
      en: 'How should the project look?',
    },
    fields: [
      {
        key: 'reference_links',
        type: 'textarea',
        label: { pl: 'Strony / projekty, które Ci się podobają', en: 'Websites / projects you like' },
        placeholder: { pl: 'Linki (jeden na linię) + co Ci się w nich podoba', en: 'Links (one per line) + what you like about them' },
        required: false,
      },
      {
        key: 'project_character',
        type: 'textarea',
        label: { pl: 'Charakter projektu', en: 'Project character' },
        placeholder: { pl: '3-5 przymiotników (np. minimalistyczny, odważny, elegancki)', en: '3-5 adjectives (e.g., minimalist, bold, elegant)' },
        required: false,
      },
      {
        key: 'section_design_traits',
        type: 'section_header',
        label: { pl: 'Cechy designu (skala 0–10)', en: 'Design Traits (scale 0–10)' },
        required: false,
      },
      {
        key: 'design_traits_minimalist',
        type: 'slider',
        label: { pl: 'Minimalistyczne', en: 'Minimalist' },
        required: false,
        validation: { min: 0, max: 10 },
      },
      {
        key: 'design_traits_vivid',
        type: 'slider',
        label: { pl: 'Żywe / Kolorowe', en: 'Vivid / Colorful' },
        required: false,
        validation: { min: 0, max: 10 },
      },
      {
        key: 'design_traits_innovative',
        type: 'slider',
        label: { pl: 'Nowatorskie', en: 'Innovative' },
        required: false,
        validation: { min: 0, max: 10 },
      },
      {
        key: 'design_traits_bold',
        type: 'slider',
        label: { pl: 'Odważne', en: 'Bold' },
        required: false,
        validation: { min: 0, max: 10 },
      },
      {
        key: 'design_traits_calm',
        type: 'slider',
        label: { pl: 'Spokojne', en: 'Calm' },
        required: false,
        validation: { min: 0, max: 10 },
      },
      {
        key: 'design_traits_dynamic',
        type: 'slider',
        label: { pl: 'Dynamiczne', en: 'Dynamic' },
        required: false,
        validation: { min: 0, max: 10 },
      },
      {
        key: 'design_traits_delicate',
        type: 'slider',
        label: { pl: 'Delikatne', en: 'Delicate' },
        required: false,
        validation: { min: 0, max: 10 },
      },
      {
        key: 'design_traits_casual',
        type: 'slider',
        label: { pl: 'Casualowe / Swobodne', en: 'Casual / Relaxed' },
        required: false,
        validation: { min: 0, max: 10 },
      },
      {
        key: 'design_traits_elegant',
        type: 'slider',
        label: { pl: 'Eleganckie', en: 'Elegant' },
        required: false,
        validation: { min: 0, max: 10 },
      },
      {
        key: 'design_traits_playful',
        type: 'slider',
        label: { pl: 'Zabawne / Lekkie', en: 'Playful / Light' },
        required: false,
        validation: { min: 0, max: 10 },
      },
      {
        key: 'design_traits_corporate',
        type: 'slider',
        label: { pl: 'Korporacyjne / Formalne', en: 'Corporate / Formal' },
        required: false,
        validation: { min: 0, max: 10 },
      },
      {
        key: 'design_traits_premium',
        type: 'slider',
        label: { pl: 'Luksusowe / Premium', en: 'Luxury / Premium' },
        required: false,
        validation: { min: 0, max: 10 },
      },
    ],
  },

  // ============================================
  // STEP: Website Details (for website scope — building new site)
  // — simplified: current site + new site goals
  // ============================================
  {
    key: 'website_details',
    number: 10,
    title: {
      pl: 'Strona internetowa',
      en: 'Website',
    },
    description: {
      pl: 'Szczegóły dotyczące strony',
      en: 'Website details',
    },
    fields: [
      {
        key: 'old_website_url',
        type: 'url',
        label: { pl: 'Obecna strona (jeśli istnieje)', en: 'Current website (if exists)' },
        placeholder: { pl: 'https://...', en: 'https://...' },
        required: false,
      },
      {
        key: 'old_website_feedback',
        type: 'textarea',
        label: { pl: 'Co Ci się podoba / nie podoba na obecnej stronie?', en: 'What do you like / dislike about current site?' },
        placeholder: { pl: 'Elementy do zachowania i do zmiany', en: 'Elements to keep and to change' },
        required: false,
      },
      {
        key: 'website_goals',
        type: 'textarea',
        label: { pl: 'Główny cel strony', en: 'Main website goal' },
        placeholder: { pl: 'np. generowanie leadów, sprzedaż online, portfolio', en: 'e.g., lead generation, online sales, portfolio' },
        required: true,
      },
      {
        key: 'primary_purpose',
        type: 'checkbox',
        label: { pl: 'Funkcje strony', en: 'Website functions' },
        required: false,
        options: [
          { value: 'lead_generation', label: { pl: 'Generowanie leadów', en: 'Lead generation' } },
          { value: 'ecommerce', label: { pl: 'E-commerce', en: 'E-commerce' } },
          { value: 'portfolio', label: { pl: 'Portfolio / wizytówka', en: 'Portfolio / showcase' } },
          { value: 'informational', label: { pl: 'Informacyjna', en: 'Informational' } },
          { value: 'blog', label: { pl: 'Blog / content', en: 'Blog / content' } },
        ],
      },
      {
        key: 'language_requirements',
        type: 'checkbox',
        label: { pl: 'Wersje językowe', en: 'Language versions' },
        required: false,
        options: [
          { value: 'polish', label: { pl: 'Polski', en: 'Polish' } },
          { value: 'english', label: { pl: 'Angielski', en: 'English' } },
          { value: 'german', label: { pl: 'Niemiecki', en: 'German' } },
          { value: 'other', label: { pl: 'Inny', en: 'Other' } },
        ],
      },
      {
        key: 'has_content_resources',
        type: 'radio',
        label: { pl: 'Masz gotowe treści?', en: 'Do you have content ready?' },
        required: false,
        options: [
          { value: 'yes', label: { pl: 'Tak', en: 'Yes' } },
          { value: 'partially', label: { pl: 'Częściowo', en: 'Partially' } },
          { value: 'no', label: { pl: 'Nie', en: 'No' } },
        ],
      },
    ],
  },

  // ============================================
  // STEP: Website Audit (for performance / digital_audit)
  // — evaluating existing site
  // ============================================
  {
    key: 'website_audit',
    number: 11,
    title: {
      pl: 'Obecna strona',
      en: 'Current Website',
    },
    description: {
      pl: 'Informacje o stronie do analizy',
      en: 'Information about the website to analyze',
    },
    fields: [
      {
        key: 'old_website_url',
        type: 'url',
        label: { pl: 'URL strony', en: 'Website URL' },
        placeholder: { pl: 'https://...', en: 'https://...' },
        required: true,
      },
      {
        key: 'website_platform',
        type: 'text',
        label: { pl: 'Platforma', en: 'Platform' },
        placeholder: { pl: 'np. WordPress, Shopify, nie wiem', en: 'e.g., WordPress, Shopify, I don\'t know' },
        required: false,
      },
      {
        key: 'old_website_cons',
        type: 'textarea',
        label: { pl: 'Główne problemy', en: 'Main issues' },
        placeholder: { pl: 'Co nie działa? Wolna strona, niska konwersja, słabe SEO?', en: 'What\'s not working? Slow site, low conversion, poor SEO?' },
        required: false,
      },
      {
        key: 'website_goals',
        type: 'textarea',
        label: { pl: 'Czego oczekujesz po audycie?', en: 'What do you expect from the audit?' },
        placeholder: { pl: 'Jakie problemy chcesz rozwiązać? Jakie KPI poprawić?', en: 'What problems to solve? What KPIs to improve?' },
        required: true,
      },
      {
        key: 'analytics_access',
        type: 'radio',
        label: { pl: 'Dostęp do analityki', en: 'Analytics access' },
        required: false,
        options: [
          { value: 'ga4_full', label: { pl: 'Google Analytics — pełny dostęp', en: 'Google Analytics — full access' } },
          { value: 'ga4_partial', label: { pl: 'GA — ograniczony dostęp', en: 'GA — limited access' } },
          { value: 'other_tool', label: { pl: 'Inne narzędzie', en: 'Other tool' } },
          { value: 'no_analytics', label: { pl: 'Brak analityki', en: 'No analytics' } },
        ],
      },
    ],
  },

  // ============================================
  // STEP: Performance & Growth (simplified)
  // ============================================
  {
    key: 'performance_goals',
    number: 12,
    title: {
      pl: 'Cele wzrostowe',
      en: 'Growth Goals',
    },
    description: {
      pl: 'Co chcesz osiągnąć?',
      en: 'What do you want to achieve?',
    },
    fields: [
      {
        key: 'performance_objectives',
        type: 'checkbox',
        label: { pl: 'Czym jesteś zainteresowany?', en: 'What are you interested in?' },
        required: true,
        options: [
          { value: 'seo', label: { pl: 'SEO / pozycjonowanie', en: 'SEO' } },
          { value: 'google_ads', label: { pl: 'Google Ads', en: 'Google Ads' } },
          { value: 'social_ads', label: { pl: 'Social Media Ads', en: 'Social Media Ads' } },
          { value: 'email_marketing', label: { pl: 'Email marketing', en: 'Email marketing' } },
          { value: 'conversion_optimization', label: { pl: 'Optymalizacja konwersji', en: 'Conversion optimization' } },
          { value: 'analytics', label: { pl: 'Analityka', en: 'Analytics' } },
          { value: 'content_marketing', label: { pl: 'Content marketing', en: 'Content marketing' } },
        ],
      },
      {
        key: 'growth_targets',
        type: 'textarea',
        label: { pl: 'Cele', en: 'Goals' },
        placeholder: { pl: 'np. +50% ruchu w 6 msc, 100 leadów/msc', en: 'e.g., +50% traffic in 6 months, 100 leads/mo' },
        required: false,
      },
      {
        key: 'monthly_ad_budget',
        type: 'text',
        label: { pl: 'Miesięczny budżet na reklamy', en: 'Monthly ad budget' },
        placeholder: { pl: 'np. 10 000 zł/msc lub do ustalenia', en: 'e.g., $3,000/mo or to be determined' },
        required: false,
      },
      {
        key: 'current_channels',
        type: 'textarea',
        label: { pl: 'Co już robicie?', en: 'What are you already doing?' },
        placeholder: { pl: 'Obecne kanały, kampanie, narzędzia (lub "nic — zaczynamy od zera")', en: 'Current channels, campaigns, tools (or "nothing — starting from scratch")' },
        required: false,
      },
    ],
  },

  // ============================================
  // STEP: Budget & Final (simplified)
  // ============================================
  {
    key: 'budget_final',
    number: 13,
    title: {
      pl: 'Budżet i finalizacja',
      en: 'Budget & Wrap-up',
    },
    description: {
      pl: 'Ostatni krok — budżet i dodatkowe informacje',
      en: 'Last step — budget and additional info',
    },
    fields: [
      {
        key: 'total_budget',
        type: 'text',
        label: { pl: 'Budżet projektu', en: 'Project budget' },
        placeholder: { pl: 'np. 30 000 zł lub "do ustalenia"', en: 'e.g., $10,000 or "to be discussed"' },
        required: true,
      },
      {
        key: 'budget_flexibility',
        type: 'radio',
        label: { pl: 'Elastyczność budżetu', en: 'Budget flexibility' },
        required: false,
        options: [
          { value: 'fixed', label: { pl: 'Stały', en: 'Fixed' } },
          { value: 'somewhat_flexible', label: { pl: 'Nieco elastyczny', en: 'Somewhat flexible' } },
          { value: 'very_flexible', label: { pl: 'Elastyczny', en: 'Flexible' } },
        ],
      },
      {
        key: 'deadline',
        type: 'date',
        label: { pl: 'Docelowy termin', en: 'Target deadline' },
        required: false,
      },
      {
        key: 'file_links',
        type: 'url',
        label: { pl: 'Link do plików', en: 'File link' },
        placeholder: { pl: 'Google Drive, Dropbox, itp.', en: 'Google Drive, Dropbox, etc.' },
        required: false,
        helpText: { pl: 'Logo, materiały, inspiracje — cokolwiek przydatnego', en: 'Logo, materials, inspiration — anything useful' },
      },
      {
        key: 'additional_notes',
        type: 'textarea',
        label: { pl: 'Coś jeszcze?', en: 'Anything else?' },
        placeholder: { pl: 'Dodatkowe informacje, które mogą się przydać', en: 'Any additional information that might be useful' },
        required: false,
      },
    ],
  },
]

// ============================================
// Helpers
// ============================================

export function getStepsForScope(scope: ProjectScope): WizardStepDef[] {
  const stepKeys = scopeStepMap[scope]
  return stepKeys
    .map((key) => wizardSteps.find((s) => s.key === key))
    .filter(Boolean) as WizardStepDef[]
}

export function getWizardStep(stepNumber: number): WizardStepDef | undefined {
  return wizardSteps.find((step) => step.number === stepNumber)
}

export function getTotalSteps(): number {
  return wizardSteps.length
}

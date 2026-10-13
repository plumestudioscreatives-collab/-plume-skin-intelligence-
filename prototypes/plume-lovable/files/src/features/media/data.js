// Plume Media prototype: fictional sample data.
// Every person, brand, clinic, credential, price and enrollment below is invented
// for design review. None of it describes a real customer or real traction.

export const TOPICS = {
  'textured-hair': 'Textured hair',
  'sensitive-skin': 'Sensitive skin',
  'hyperpigmentation': 'Hyperpigmentation',
  'ingredients': 'Ingredients',
  'rituals': 'Rituals & culture',
  'body-care': 'Body care',
  'founders': 'Founder stories',
  'clinic-care': 'Clinic treatments',
  'science': 'Skin science',
};

export const CREATOR_TYPES = {
  individual: 'Individual creator',
  practitioner: 'Practitioner',
  brand: 'Beauty brand',
  clinic: 'Clinic · med spa',
  plume: 'Plume editorial',
};

export const FORMATS = {
  article: 'Article',
  blog: 'Blog post',
  essay: 'Essay',
  guide: 'Guide',
  case: 'Case study',
};

export const FORMATS_PLURAL = {
  article: 'Articles',
  blog: 'Blog posts',
  essay: 'Essays',
  guide: 'Guides',
  case: 'Case studies',
};

export const CASE_TEMPLATES = {
  consumer: {
    label: 'Consumer experience',
    blurb: 'Your own routine, results and what you would do differently. Always labeled as personal experience.',
    fields: [
      ['goal', 'Question or goal', 'What were you trying to find out or change?'],
      ['context', 'Context', 'Your hair or skin, your routine before, anything a reader needs to know.'],
      ['approach', 'What I did', 'Products, steps and frequency. Be specific.'],
      ['timeline', 'Timeline', 'What happened week by week or month by month.'],
      ['observations', 'What I noticed', 'Describe changes plainly. Photos are optional.'],
      ['limitations', 'Limitations', 'One person, self-observed, other changes at the same time…'],
    ],
  },
  brand: {
    label: 'Brand or business',
    blurb: 'A study, launch or process run by your company. Your involvement is shown on the piece.',
    fields: [
      ['goal', 'Goal', 'What the company wanted to learn or solve.'],
      ['involvement', 'Our involvement', 'Who designed, ran and paid for this work.'],
      ['approach', 'Method', 'Participants, duration, what was measured and how.'],
      ['timeline', 'Timeline', 'Key dates and phases.'],
      ['observations', 'Results', 'What you found, including results that did not favor your product.'],
      ['limitations', 'Limitations', 'Sample size, controls, self-reporting, conflicts of interest.'],
    ],
  },
  clinical: {
    label: 'Practitioner or clinical',
    blurb: 'A teaching case from practice. Requires recorded consent and de-identification before publishing.',
    fields: [
      ['goal', 'Clinical question', 'What this case teaches.'],
      ['context', 'Presentation', 'De-identified history and presentation. No names, dates, faces or locations.'],
      ['approach', 'Assessment and approach', 'What was assessed and the plan agreed with the client.'],
      ['timeline', 'Timeline', 'Follow-up intervals and changes.'],
      ['observations', 'Observations', 'Outcome as observed, including side effects.'],
      ['limitations', 'Limitations', 'A single case does not establish effectiveness.'],
    ],
  },
};

// Tones and palettes for the illustrated placeholder art.
export const PALETTES = {
  lilac: ['#CBBDE1', '#EFE7F5'],
  butter: ['#F1CF7C', '#FAEBCB'],
  coral: ['#E7897E', '#F7D3C9'],
  mint: ['#B7DDD2', '#E6F3EE'],
  plum: ['#45203F', '#8A5A80'],
  dusk: ['#3A2541', '#C98B98'],
  sand: ['#E3CDB4', '#F6ECDF'],
  night: ['#1F1B2C', '#544572'],
  sea: ['#8FB9C4', '#E2EEF0'],
  clay: ['#B86A4B', '#EDC3A6'],
};

// ---------------------------------------------------------------- channels
// A channel is a public presentation. Accounts manage channels through memberships.
export const CHANNELS = {
  amara: {
    id: 'amara', name: 'Amara Okafor', handle: 'amaraokafor', type: 'individual', kind: 'person',
    location: 'London, UK',
    tagline: 'Wash day notes from a 4C head of hair and a sensitive scalp.',
    bio: 'I started writing my wash days down because I kept forgetting what worked. Now I share the whole record here: routines, mistakes, and the products I paid for myself. I am not a trichologist, and I say so.',
    topics: ['textured-hair', 'sensitive-skin', 'rituals'],
    credentials: [],
    expertise: 'Lived experience with 4C hair and eczema-prone skin',
    art: { kind: 'portrait', skin: 'deep', hair: 'puff', hairColor: '#1A1311', bg: 'butter', garment: '#45203F', acc: 'gold', blooms: ['coral', 'mint'] },
    cover: { kind: 'still', bg: 'butter', objects: ['comb', 'jar', 'leaf'], blooms: ['coral', 'lilac'] },
    members: [{ account: 'amara', role: 'Owner' }],
  },
  nia: {
    id: 'nia', name: 'Nia Adebayo-Brooks', handle: 'nia.ab', type: 'individual', kind: 'person',
    location: 'Atlanta, US',
    tagline: 'Founder of Sorrel & Shea. Writing personally about building a small brand.',
    bio: 'Former industrial chemist. I write here as myself; product news lives on the Sorrel & Shea channel.',
    topics: ['founders', 'body-care'],
    credentials: [],
    expertise: 'Founder; former industrial chemist (self-described)',
    art: { kind: 'portrait', skin: 'rich', hair: 'locs', hairColor: '#24160F', bg: 'coral', garment: '#2F4A3F', acc: 'hoop', blooms: ['butter'] },
    cover: { kind: 'place', bg: 'coral', blooms: ['butter', 'lilac'] },
    members: [{ account: 'nia', role: 'Owner' }],
  },
  sorrel: {
    id: 'sorrel', name: 'Sorrel & Shea', handle: 'sorrelandshea', type: 'brand', kind: 'org', monogram: 'S&S',
    location: 'Atlanta, US',
    tagline: 'Unscented body care made with shea from a women’s cooperative.',
    bio: 'An independent body-care brand. We publish how our products are made, what our own studies found, and what they cannot tell you. Everything on this channel is written by our team about our own products unless it says otherwise.',
    topics: ['body-care', 'founders', 'ingredients'],
    credentials: [{ label: 'Registered business', status: 'verified' }],
    art: { kind: 'mark', bg: 'mint', fg: '#2F4A3F' },
    cover: { kind: 'still', bg: 'mint', objects: ['jar', 'nuts', 'leaf', 'bottle'], blooms: ['butter'] },
    members: [{ account: 'nia', role: 'Owner' }, { account: null, name: 'Theo Brooks', role: 'Editor' }],
  },
  marisol: {
    id: 'marisol', name: 'Marisol Vega, NP', handle: 'marisolvega.np', type: 'practitioner', kind: 'person',
    location: 'Houston, US',
    tagline: 'Nurse practitioner in aesthetic medicine. Plain-language skin education.',
    bio: 'I teach people with medium to deep skin how dark marks form and what to ask before any treatment. Education here is general information, not a diagnosis or a replacement for your own clinician.',
    topics: ['hyperpigmentation', 'clinic-care', 'science'],
    credentials: [{ label: 'Nurse Practitioner (license)', status: 'verified' }],
    art: { kind: 'portrait', skin: 'tan', hair: 'waves', hairColor: '#2A1A14', bg: 'lilac', garment: '#F4EDE4', acc: 'gold', blooms: ['coral'] },
    cover: { kind: 'abstract', bg: 'lilac', blooms: ['coral', 'butter', 'mint'] },
    members: [{ account: 'marisol', role: 'Owner' }],
  },
  lumen: {
    id: 'lumen', name: 'Lumen Skin Clinic', handle: 'lumenskin', type: 'clinic', kind: 'org', monogram: 'L',
    location: 'Houston, US',
    tagline: 'A medical spa focused on treatments for skin of color.',
    bio: 'Our team writes about consultations, aftercare and realistic expectations. Clinical content on this channel is reviewed by our medical director before it is published.',
    topics: ['clinic-care', 'hyperpigmentation'],
    credentials: [{ label: 'Licensed medical spa', status: 'verified' }],
    art: { kind: 'mark', bg: 'night', fg: '#F7F1E8' },
    cover: { kind: 'abstract', bg: 'night', blooms: ['lilac', 'coral'] },
    members: [{ account: null, name: 'Dr. Ines Calder (Medical director)', role: 'Owner' }, { account: 'marisol', role: 'Editor' }],
  },
  keiko: {
    id: 'keiko', name: 'Keiko Arai', handle: 'keikoarai', type: 'individual', kind: 'person',
    location: 'Oita, Japan',
    tagline: 'Bathing rituals, rosacea notes and my grandmother’s house in Beppu.',
    bio: 'I write about the bath as a daily practice and about living with rosacea. Everything here is my own experience.',
    topics: ['rituals', 'sensitive-skin'],
    credentials: [],
    expertise: 'Lived experience with rosacea',
    art: { kind: 'portrait', skin: 'light', hair: 'bob', hairColor: '#15110F', bg: 'sea', garment: '#CBBDE1', acc: null, blooms: ['mint'] },
    cover: { kind: 'place', bg: 'sea', steam: true, blooms: ['mint', 'lilac'] },
    members: [{ account: null, name: 'Keiko Arai', role: 'Owner' }],
  },
  rohan: {
    id: 'rohan', name: 'Rohan Mehta', handle: 'rohanformulates', type: 'individual', kind: 'person',
    location: 'Leicester, UK',
    tagline: 'Ingredient lists, explained without fear.',
    bio: 'I formulate small-batch skincare as an independent and explain ingredient science for people who want to read a label calmly.',
    topics: ['ingredients', 'science'],
    credentials: [],
    expertise: 'Independent formulator (self-described, not verified by Plume)',
    art: { kind: 'portrait', skin: 'brown', hair: 'short', hairColor: '#120D0B', bg: 'sand', garment: '#3B4E6B', acc: null, beard: true, blooms: ['butter'] },
    cover: { kind: 'still', bg: 'sand', objects: ['bottle', 'jar', 'leaf'], blooms: ['mint'] },
    members: [{ account: null, name: 'Rohan Mehta', role: 'Owner' }],
  },
  zainab: {
    id: 'zainab', name: 'Zainab Hassan', handle: 'zainab.h', type: 'individual', kind: 'person',
    location: 'Khartoum and Cairo',
    tagline: 'Henna, hair oiling and the women in my family.',
    bio: 'I film the rituals I grew up with and the people who keep them going.',
    topics: ['rituals'],
    credentials: [],
    expertise: 'Lived experience',
    art: { kind: 'portrait', skin: 'deepWarm', hair: 'wrap', hairColor: '#E7897E', bg: 'clay', garment: '#F1CF7C', acc: 'gold', blooms: ['butter'] },
    cover: { kind: 'place', bg: 'clay', blooms: ['butter'] },
    members: [{ account: null, name: 'Zainab Hassan', role: 'Owner' }],
  },
  plume: {
    id: 'plume', name: 'Plume Editorial', handle: 'plume', type: 'plume', kind: 'org',
    location: 'Plume Studios',
    tagline: 'Films, series and essays commissioned by Plume.',
    bio: 'Plume’s own editorial team. Work on this channel is produced or commissioned by Plume, and we say who was paid to make it.',
    topics: ['rituals', 'founders'],
    credentials: [],
    art: { kind: 'logo' },
    cover: { kind: 'abstract', bg: 'lilac', blooms: ['coral', 'butter', 'mint'] },
    members: [{ account: null, name: 'Plume editorial team', role: 'Owner' }],
  },
};

// ---------------------------------------------------------------- demo accounts
// Account type is separate from permissions; permissions come from memberships.
export const ACCOUNTS = {
  amara: {
    id: 'amara', name: 'Amara Okafor', persona: 'Consumer creator', accountType: 'Individual',
    summary: 'Writes, films and teaches from lived experience. Also takes other people’s classes.',
    channelId: 'amara',
  },
  nia: {
    id: 'nia', name: 'Nia Adebayo-Brooks', persona: 'Brand creator', accountType: 'Individual',
    summary: 'Has a personal channel and is Owner of the Sorrel & Shea brand channel.',
    channelId: 'nia',
  },
  marisol: {
    id: 'marisol', name: 'Marisol Vega, NP', persona: 'Practitioner · clinic', accountType: 'Individual (credential verified)',
    summary: 'Has her own practitioner channel and is an Editor on the Lumen Skin Clinic channel.',
    channelId: 'marisol',
  },
  jordan: {
    id: 'jordan', name: 'Jordan Lee', persona: 'Learner & reader', accountType: 'Individual',
    summary: 'Reads, watches and takes classes. Has no channel yet, and can start one in Studio.',
    channelId: null,
    art: { kind: 'portrait', skin: 'olive', hair: 'curls', hairColor: '#3A2418', bg: 'mint', garment: '#45203F', acc: null, blooms: ['butter'] },
  },
};

export const PERSONA_ORDER = ['amara', 'nia', 'marisol', 'jordan'];

// ---------------------------------------------------------------- read
const D = (s) => s; // dates are ISO strings

export const ARTICLES = [
  {
    id: 'a1', channelId: 'amara', format: 'case', template: 'consumer', status: 'published',
    title: 'Ninety days of wash days',
    subtitle: 'What changed when I stopped chasing length and started counting broken strands. A personal record, not a recommendation.',
    topics: ['textured-hair', 'sensitive-skin'],
    published: D('2026-10-08'), updated: D('2026-10-10'), minutes: 9,
    labels: ['experience'], disclosure: { kind: 'none', note: 'I bought every product mentioned. No brand saw this before it was published.' },
    art: { kind: 'portrait', skin: 'deep', hair: 'puff', hairColor: '#1A1311', bg: 'butter', garment: '#45203F', acc: 'gold', blooms: ['coral', 'mint'] },
    caseFields: {
      goal: 'Could a simpler, lower-manipulation wash day reduce breakage on my 4C hair over 90 days?',
      context: 'Dense 4C hair, a sensitive scalp, and one free evening a week. My wash days ran four to five hours and I found broken strands in the sink every time I detangled.',
      approach: 'Washed once a week. Pre-pooed with the oil I already owned. Detangled only when soaking wet with conditioner, in four sections, fingers first. No heat. Two-strand twists between wash days.',
      timeline: 'Weeks 1–2: wash day dropped to about three hours. Weeks 3–6: started counting strands left in the comb. Weeks 7–13: kept the routine and changed nothing else on purpose.',
      observations: 'Strands in the comb went from roughly 40 to roughly 15 per section, counted by eye. My scalp itched less once I stopped scratching between twists.',
      limitations: 'One person, one head of hair. I counted by eye, did not control for weather, diet or stress, and changed several things at once.',
    },
    body: [
      'For years my wash day was a project. I blocked out a Sunday, put on a long playlist, and still finished with sore arms and a sink full of broken hair. I assumed that was the price of having 4C hair.',
      '## Why I started counting',
      'In July a friend asked how much I was actually losing. I didn’t know. So I started counting the strands left in my wide-tooth comb after each section, which is crude, but it was a number I could compare week to week.',
      '## What I changed',
      'I changed the order more than the products. I stopped detangling dry. I stopped trying to finish in one sitting. I sectioned into four and only moved on when a section felt soft all the way through.',
      '> The biggest change wasn’t a product. It was giving myself permission to stop halfway and finish the next morning.',
      '## What I can and can’t say',
      'My count went down, and my hair feels stronger to me. That’s all I can claim. I’m one person, I counted by eye, and I changed several things at once. If you have a scalp condition, a dermatologist or trichologist can tell you far more than my notebook can.',
      'I’ve put the full routine in my free class, Wash Day, Simplified, if you want to try the same structure and adapt it.',
    ],
    references: [],
  },
  {
    id: 'a2', channelId: 'sorrel', format: 'article', status: 'published',
    title: 'Shea butter starts with the women who make it',
    subtitle: 'How our butter is made, who we buy it from, and what we pay. Written by Sorrel & Shea about our own supply chain.',
    topics: ['body-care', 'founders'],
    published: D('2026-10-02'), updated: D('2026-10-02'), minutes: 6,
    labels: ['brand'], disclosure: { kind: 'brand', note: 'Written by Sorrel & Shea about our own products and suppliers.' },
    art: { kind: 'still', bg: 'mint', objects: ['nuts', 'jar', 'leaf'], blooms: ['butter'] },
    body: [
      'Every jar we sell starts with shea nuts gathered and processed by a women’s cooperative in northern Ghana. We have bought from the same cooperative since 2021.',
      '## How the butter is made',
      'The nuts are boiled, sun-dried, crushed and roasted, then kneaded with water until the fat separates. It is slow, physical work, and it is the reason good unrefined shea smells nutty and looks ivory rather than white.',
      '## What we pay',
      'We publish our price per kilogram each year alongside the local market rate. This year we paid above market, and we’ve agreed a minimum price for the next two harvests.',
      'This is our account of our own supply chain. We’re a company that sells shea products, so read it with that in mind.',
    ],
    references: ['Sorrel & Shea 2026 supplier price report (sample document)'],
  },
  {
    id: 'a3', channelId: 'sorrel', format: 'case', template: 'brand', status: 'published',
    title: 'Our 8-week body butter study, and what it can’t tell you',
    subtitle: 'We ran a small in-house study on our unscented body butter. Here is the method, the result, and the limits.',
    topics: ['body-care', 'sensitive-skin'],
    published: D('2026-09-24'), updated: D('2026-09-29'), minutes: 7,
    labels: ['brand', 'brand-study'], disclosure: { kind: 'brand', note: 'Designed, run and paid for by Sorrel & Shea. Participants were recruited from our customer list.' },
    art: { kind: 'still', bg: 'butter', objects: ['jar', 'bottle', 'leaf'], blooms: ['mint', 'coral'] },
    caseFields: {
      goal: 'Find out whether people with self-described dry skin noticed a difference after eight weeks of twice-daily use.',
      involvement: 'We make the product, designed the study, recruited participants from our own customer list and paid for everything. No independent lab was involved.',
      approach: '24 adults applied the unscented body butter twice daily for eight weeks and rated dryness from 1 to 10 each week. Photos were taken under the same light at weeks 0 and 8.',
      timeline: 'Recruitment in June 2026, study July–August, write-up in September.',
      observations: 'Average self-rated dryness went from 7.1 to 4.3 (sample figures). Two participants stopped because of itching. Three saw no change.',
      limitations: 'Small group, no control group, self-reported scores, and participants who already liked our brand. This is not a clinical trial and it does not show our product works better than any other.',
    },
    body: [
      'We wanted a better answer than “customers love it.” So we ran a small study and decided before we started that we would publish the result either way.',
      'The fields above explain who did what. The short version: it’s our product, our study and our money. Treat the numbers as a description of 24 people, not a promise.',
    ],
    references: ['Sorrel & Shea internal study protocol, v2 (sample document)'],
  },
  {
    id: 'a4', channelId: 'marisol', format: 'case', template: 'clinical', status: 'published',
    title: 'Dark marks after acne in deeper skin: a teaching case',
    subtitle: 'A fictional composite case about post-inflammatory hyperpigmentation, written to show how a consultation and follow-up can unfold.',
    topics: ['hyperpigmentation', 'clinic-care', 'science'],
    published: D('2026-10-05'), updated: D('2026-10-05'), minutes: 8,
    labels: ['clinical', 'credential'], disclosure: { kind: 'none', note: 'No commercial relationships. No products were provided.' },
    consent: { fictional: true, consent: true, deidentified: true, reviewed: true },
    art: { kind: 'abstract', bg: 'lilac', blooms: ['coral', 'butter', 'mint'] },
    caseFields: {
      goal: 'How can a practitioner set realistic expectations for fading post-inflammatory hyperpigmentation (PIH) in deeper skin?',
      context: 'Composite client in their late twenties with darker skin, recurring breakouts along the jaw and dark marks that lasted months after each spot healed.',
      approach: 'Treat active breakouts first, add daily broad-spectrum sunscreen, and introduce one gentle topical at a time. Defer procedures until skin was calm.',
      timeline: 'Reviewed at 6, 12 and 24 weeks. New marks slowed first; older marks faded gradually.',
      observations: 'The client described the marks as “much lighter” at 24 weeks. Mild irritation in week 3 settled after reducing frequency.',
      limitations: 'A fictional composite for teaching. One case cannot show that any approach works, and individual care should come from your own clinician.',
    },
    body: [
      'Clients with deeper skin often tell me the spot was never the problem. The mark it left behind was. This teaching case walks through the conversation I’d have and why patience is part of the plan.',
      '## Why irritation matters',
      'Anything that inflames the skin can leave a new mark. That includes over-exfoliating in a hurry to fade the old ones.',
      'This is general education. If you are worried about a mark that changes shape, colour or size, see a clinician.',
    ],
    references: [
      'Davis EC, Callender VD. Postinflammatory hyperpigmentation: a review of the epidemiology, clinical features, and treatment options in skin of color. J Clin Aesthet Dermatol. 2010;3(7):20–31.',
    ],
  },
  {
    id: 'a5', channelId: 'rohan', format: 'guide', status: 'published',
    title: 'How to read an ingredient list without panicking',
    subtitle: 'Order, concentration, and why a long chemical name is not a warning sign.',
    topics: ['ingredients', 'science'],
    published: D('2026-09-30'), updated: D('2026-09-30'), minutes: 5,
    labels: ['selfdescribed'], disclosure: { kind: 'none', note: 'I sell no products mentioned here.' },
    art: { kind: 'still', bg: 'sand', objects: ['bottle', 'jar'], blooms: ['mint'] },
    body: [
      'Ingredient lists are written in a standard naming system so that a product can be compared across countries. That’s why water is “aqua” and shea butter is “Butyrospermum Parkii Butter.”',
      '## Start at the top',
      'Ingredients above 1% are listed in descending order of concentration. Below 1%, they can appear in any order.',
      '## A long name isn’t a warning',
      'Tocopherol is vitamin E. Sodium chloride is salt. If something worries you, look it up in a reputable database instead of a scare list.',
    ],
    references: ['Reference to be added by the author before publishing (sample)'],
  },
  {
    id: 'a6', channelId: 'keiko', format: 'essay', status: 'published',
    title: 'The bath as a daily ritual',
    subtitle: 'Notes from my grandmother’s house in Beppu, and what fifteen minutes of hot water does for my rosacea.',
    topics: ['rituals', 'sensitive-skin'],
    published: D('2026-09-21'), updated: D('2026-09-21'), minutes: 7,
    labels: ['experience'], disclosure: { kind: 'none', note: '' },
    art: { kind: 'place', skin: 'light', hair: 'bob', hairColor: '#15110F', bg: 'sea', garment: '#CBBDE1', steam: true, blooms: ['mint'] },
    body: [
      'My grandmother bathed every evening at seven. Not to get clean, she would say. That happened first, at the shower stool. The bath was for something else.',
      '## Heat and my skin',
      'Rosacea complicates a love of hot water. I’ve learned to keep the bath warm rather than hot and to keep my face out of the steam. That’s what works for me; your triggers may be different.',
    ],
    references: [],
  },
  {
    id: 'a7', channelId: 'lumen', format: 'guide', status: 'published',
    title: 'What a good consultation covers before any laser treatment',
    subtitle: 'Seven things your provider should ask, and three you should ask them.',
    topics: ['clinic-care', 'hyperpigmentation'],
    published: D('2026-09-18'), updated: D('2026-10-01'), minutes: 6,
    labels: ['brand'], disclosure: { kind: 'brand', note: 'Written by Lumen Skin Clinic, which offers these treatments.' },
    art: { kind: 'portrait', skin: 'deepWarm', hair: 'braids', hairColor: '#1C1210', bg: 'night', garment: '#CBBDE1', acc: 'hoop', blooms: ['lilac'] },
    body: [
      'A consultation should feel like a conversation, not a sales pitch. If you leave without understanding the risks for your skin tone, ask for another appointment.',
      '## Questions to ask',
      'How many treatments like this have you performed on skin like mine? What settings will you use, and why? What happens if I get a burn or darker patches afterwards?',
    ],
    references: [],
  },
  {
    id: 'a8', channelId: 'amara', format: 'blog', status: 'published',
    title: 'My fragrance-free body routine for eczema-prone skin',
    subtitle: 'What I use after the shower, and how this post came to be sponsored.',
    topics: ['sensitive-skin', 'body-care'],
    published: D('2026-10-11'), updated: D('2026-10-11'), minutes: 4,
    labels: ['paid', 'experience'], disclosure: { kind: 'paid', sponsor: 'Sorrel & Shea', note: 'Sorrel & Shea paid me to write this post and saw it before publishing. The routine and opinions are mine.' },
    art: { kind: 'portrait', skin: 'deep', hair: 'coils', hairColor: '#1A1311', bg: 'mint', garment: '#F1CF7C', acc: 'gold', blooms: ['butter'] },
    body: [
      'Sorrel & Shea paid for this post. I agreed because I already used their unscented butter, and they agreed I could say what I don’t like about it too.',
      '## The routine',
      'Lukewarm shower, pat dry, butter on damp skin within three minutes, then cotton pyjamas. The butter is heavy and takes a while to sink in, which I don’t love in summer.',
    ],
    references: [],
  },
  {
    id: 'a9', channelId: 'plume', format: 'essay', status: 'published',
    title: 'Why every piece on Plume says who made it, and who paid',
    subtitle: 'A guide to the labels you will see across Plume Media.',
    topics: ['founders'],
    published: D('2026-10-01'), updated: D('2026-10-01'), minutes: 4,
    labels: ['plume'], disclosure: { kind: 'none', note: 'Written by Plume’s editorial team.' },
    art: { kind: 'abstract', bg: 'plum', blooms: ['coral', 'butter', 'lilac'] },
    body: [
      'Beauty should expand people’s agency, not exploit uncertainty. On Plume, anyone can publish: a founder, a nurse practitioner, or someone who has simply lived with their skin for a long time.',
      '## Labels describe different things',
      '“Brand-authored” means a company wrote about its own work. “Paid promotion” means someone was paid to publish. “Personal experience” means a person is describing their own life. A verified credential means Plume checked a licence or registration. None of these means Plume checked every claim.',
    ],
    references: [],
  },
];

// ---------------------------------------------------------------- learn
export const COURSES = [
  {
    id: 'c1', channelId: 'amara', status: 'published', title: 'Wash Day, Simplified',
    subtitle: 'A calmer weekly routine for type 4 hair, built from 90 days of notes.',
    price: 0, level: 'Beginner', edu: 'lived', minutes: 82, language: 'English',
    topics: ['textured-hair'],
    audience: 'People with type 4 hair who want a wash day that fits into one evening.',
    prereqs: 'None. Bring your current products; you won’t need to buy anything.',
    outcomes: ['Plan a wash day around the time you actually have', 'Detangle in sections with less breakage', 'Choose low-manipulation styles for the week', 'Keep a simple record so you can see what changes'],
    description: 'This is the routine from my 90-day diary, taught step by step. It’s lived experience, not professional hair care advice.',
    art: { kind: 'portrait', skin: 'deep', hair: 'puff', hairColor: '#1A1311', bg: 'coral', garment: '#45203F', acc: 'gold', blooms: ['butter', 'mint'] },
    modules: [
      { id: 'c1m1', title: 'Before you wet your hair', lessons: [
        { id: 'c1l1', type: 'video', title: 'Why I simplified', minutes: 6, preview: true },
        { id: 'c1l2', type: 'text', title: 'Mapping your hair’s week', minutes: 8 },
        { id: 'c1l3', type: 'resource', title: 'Wash day checklist', minutes: 2, file: 'wash-day-checklist.pdf · 1 page' },
      ] },
      { id: 'c1m2', title: 'The wash day', lessons: [
        { id: 'c1l4', type: 'video', title: 'Sectioning and detangling', minutes: 18 },
        { id: 'c1l5', type: 'text', title: 'Low-manipulation styles for the week', minutes: 10 },
        { id: 'c1l6', type: 'quiz', title: 'Wash day basics', minutes: 4, quizId: 'q-c1' },
      ] },
      { id: 'c1m3', title: 'Making it yours', lessons: [
        { id: 'c1l7', type: 'assignment', title: 'Plan your next wash day', minutes: 15, optional: true, assignmentId: 'as-c1' },
        { id: 'c1l8', type: 'text', title: 'What I’d tell my first-year self', minutes: 6 },
      ] },
    ],
  },
  {
    id: 'c2', channelId: 'marisol', status: 'published', title: 'Understanding Hyperpigmentation in Melanin-Rich Skin',
    subtitle: 'How dark marks form, how to protect your skin, and how to talk to a clinician.',
    price: 39, level: 'Intermediate', edu: 'general', minutes: 130, language: 'English',
    topics: ['hyperpigmentation', 'science'],
    audience: 'Anyone with medium to deep skin who wants to understand dark marks. This is not a clinical training course.',
    prereqs: 'None. It helps to know what your current routine is.',
    outcomes: ['Explain how inflammation leads to dark marks', 'Build sun protection into a routine for deeper skin', 'Introduce new actives without causing irritation', 'Prepare useful questions for a consultation'],
    description: 'Taught by a nurse practitioner as general education. It doesn’t diagnose or treat any condition, and finishing it is not a qualification.',
    art: { kind: 'portrait', skin: 'tan', hair: 'waves', hairColor: '#2A1A14', bg: 'lilac', garment: '#F4EDE4', acc: 'gold', blooms: ['coral'] },
    modules: [
      { id: 'c2m1', title: 'How dark marks form', lessons: [
        { id: 'c2l1', type: 'video', title: 'Welcome, and what this class isn’t', minutes: 6, preview: true },
        { id: 'c2l2', type: 'text', title: 'Melanin, inflammation and PIH', minutes: 12 },
        { id: 'c2l3', type: 'resource', title: 'Glossary', minutes: 3, file: 'pih-glossary.pdf · 2 pages' },
      ] },
      { id: 'c2m2', title: 'Prevention and daily care', lessons: [
        { id: 'c2l4', type: 'video', title: 'Sun protection that works on deeper skin', minutes: 14 },
        { id: 'c2l5', type: 'text', title: 'Gentle actives and patience', minutes: 10 },
        { id: 'c2l6', type: 'quiz', title: 'Check your understanding', minutes: 5, quizId: 'q-c2' },
      ] },
      { id: 'c2m3', title: 'Working with a clinician', lessons: [
        { id: 'c2l7', type: 'video', title: 'What to ask in a consultation', minutes: 11 },
        { id: 'c2l8', type: 'assignment', title: 'Write your consultation brief', minutes: 20, optional: true, assignmentId: 'as-c2' },
        { id: 'c2l9', type: 'text', title: 'When to seek care', minutes: 6 },
      ] },
    ],
  },
  {
    id: 'c3', channelId: 'sorrel', status: 'published', title: 'Whipped Body Butter at Home',
    subtitle: 'Make a small batch of unscented whipped butter in your own kitchen.',
    price: 24, level: 'Beginner', edu: 'general', minutes: 55, language: 'English',
    topics: ['body-care', 'ingredients'],
    audience: 'Curious beginners who want to understand what goes into a body butter.',
    prereqs: 'A stand or hand mixer and a kitchen scale.',
    outcomes: ['Measure and melt butters safely', 'Whip to a stable texture', 'Store a small batch so it lasts'],
    description: 'Taught by the Sorrel & Shea team. We mention our own products in two lessons and say so when we do.',
    brandInvolved: true,
    art: { kind: 'still', bg: 'butter', objects: ['jar', 'nuts', 'leaf'], blooms: ['coral'] },
    modules: [
      { id: 'c3m1', title: 'Ingredients and tools', lessons: [
        { id: 'c3l1', type: 'video', title: 'What you need', minutes: 7, preview: true },
        { id: 'c3l2', type: 'text', title: 'Butters and oils, compared', minutes: 9 },
      ] },
      { id: 'c3m2', title: 'Make a batch', lessons: [
        { id: 'c3l3', type: 'video', title: 'Melt, cool, whip', minutes: 21 },
        { id: 'c3l4', type: 'resource', title: 'Batch sheet', minutes: 2, file: 'batch-sheet.pdf · 1 page' },
      ] },
    ],
  },
  {
    id: 'c4', channelId: 'rohan', status: 'published', title: 'Reading Ingredient Lists',
    subtitle: 'A short, free class on INCI names, order and concentration.',
    price: 0, level: 'Beginner', edu: 'general', minutes: 28, language: 'English',
    topics: ['ingredients', 'science'],
    audience: 'Anyone who has stood in a shop squinting at the back of a bottle.',
    prereqs: 'None.',
    outcomes: ['Read INCI names', 'Understand the 1% line', 'Find reliable sources'],
    description: 'Taught by an independent formulator. His expertise is self-described and has not been verified by Plume.',
    art: { kind: 'portrait', skin: 'brown', hair: 'short', hairColor: '#120D0B', bg: 'sand', garment: '#3B4E6B', beard: true, blooms: ['mint'] },
    modules: [
      { id: 'c4m1', title: 'The basics', lessons: [
        { id: 'c4l1', type: 'text', title: 'Why INCI exists', minutes: 6, preview: true },
        { id: 'c4l2', type: 'video', title: 'The 1% line', minutes: 9 },
        { id: 'c4l3', type: 'text', title: 'Where to look things up', minutes: 6 },
      ] },
    ],
  },
  {
    id: 'c5', channelId: 'lumen', status: 'published', title: 'Consultation Foundations for Aesthetic Practice',
    subtitle: 'For licensed practitioners: structuring consultations for skin of color.',
    price: 149, level: 'Advanced', edu: 'professional', restricted: true, minutes: 240, language: 'English',
    topics: ['clinic-care', 'hyperpigmentation'],
    audience: 'Licensed aesthetic practitioners. Enrollment will require an eligibility check.',
    prereqs: 'A current professional licence. Eligibility checks are not part of this prototype.',
    outcomes: ['Structure a consultation for deeper skin', 'Document consent and expectations', 'Recognize when to refer'],
    description: 'Professional education from Lumen Skin Clinic. Completion is not an accredited continuing-education credit unless that is stated and verified separately.',
    art: { kind: 'abstract', bg: 'night', blooms: ['lilac', 'coral'] },
    modules: [
      { id: 'c5m1', title: 'Before the consultation', lessons: [
        { id: 'c5l1', type: 'video', title: 'Course overview', minutes: 8, preview: true },
        { id: 'c5l2', type: 'text', title: 'Intake and history', minutes: 20 },
      ] },
      { id: 'c5m2', title: 'In the room', lessons: [
        { id: 'c5l3', type: 'video', title: 'Assessing deeper skin', minutes: 32 },
        { id: 'c5l4', type: 'quiz', title: 'Case review', minutes: 10, quizId: null },
      ] },
    ],
  },
  {
    id: 'c6', channelId: 'keiko', status: 'published', title: 'Japanese Bathing Rituals at Home',
    subtitle: 'Bring the slow evening bath into a small flat, gently.',
    price: 12, level: 'Beginner', edu: 'lived', minutes: 46, language: 'English',
    topics: ['rituals', 'sensitive-skin'],
    audience: 'Anyone with a bathtub, or a bucket and a bit of patience.',
    prereqs: 'None.',
    outcomes: ['Set up a calm bathing space', 'Adapt temperature for sensitive skin', 'Build a ten-minute evening ritual'],
    description: 'My own practice, taught as lived experience.',
    art: { kind: 'place', skin: 'light', hair: 'bob', hairColor: '#15110F', bg: 'sea', garment: '#CBBDE1', steam: true, blooms: ['mint'] },
    modules: [
      { id: 'c6m1', title: 'The bath', lessons: [
        { id: 'c6l1', type: 'video', title: 'My grandmother’s bath', minutes: 9, preview: true },
        { id: 'c6l2', type: 'text', title: 'Temperature and skin', minutes: 7 },
        { id: 'c6l3', type: 'video', title: 'Ten-minute ritual', minutes: 12 },
      ] },
    ],
  },
];

export const EDU_TYPES = {
  lived: { label: 'Lived experience', note: 'Taught from the creator’s own experience. Not professional advice.' },
  general: { label: 'General beauty education', note: 'General information for anyone. Not a diagnosis, treatment or qualification.' },
  professional: { label: 'Professional education', note: 'For licensed professionals. Requires an eligibility check. Not an accredited credit unless stated and verified.' },
};

export const QUIZZES = {
  'q-c1': {
    pass: 2,
    questions: [
      { q: 'When does this class suggest detangling?', options: ['On dry hair, before washing', 'When hair is soaking wet with conditioner', 'Only after blow-drying'], answer: 1, why: 'Detangling while hair is wet and slippery with conditioner was the biggest change in Amara’s routine.' },
      { q: 'Why section your hair into four?', options: ['It looks neater in photos', 'You can finish each part fully before moving on', 'Products only work in sections'], answer: 1, why: 'Smaller sections let you stop when a part feels soft all the way through.' },
      { q: 'What is this class based on?', options: ['A clinical trial', 'One person’s lived experience', 'A trichology qualification'], answer: 1, why: 'It’s labeled lived experience. Adapt it to your own hair.' },
    ],
  },
  'q-c2': {
    pass: 3,
    questions: [
      { q: 'What does PIH stand for?', options: ['Post-inflammatory hyperpigmentation', 'Permanent irritation hyperpigmentation', 'Pigment-induced hydration'], answer: 0, why: 'PIH is darkening that follows inflammation such as acne or irritation.' },
      { q: 'Which daily habit does this class emphasize most?', options: ['Exfoliating every day', 'Broad-spectrum sun protection', 'Changing products weekly'], answer: 1, why: 'Sun exposure can deepen existing marks, so protection comes first.' },
      { q: 'Why introduce one new active at a time?', options: ['Irritation can cause new marks, and it’s easier to spot the cause', 'Actives expire faster when combined', 'It’s cheaper'], answer: 0, why: 'Going slowly lowers the risk of irritation and makes reactions easier to trace.' },
      { q: 'Completing this class qualifies you to…', options: ['Perform chemical peels', 'Diagnose skin conditions', 'Nothing. It’s general education, not a qualification'], answer: 2, why: 'A completion record shows you finished the class. It is not a license or accredited credit.' },
    ],
  },
};

export const ASSIGNMENTS = {
  'as-c1': {
    prompt: 'Plan your next wash day. List your sections, the time you have, and one thing you’ll do differently. Amara reads every submission and replies when she can.',
    min: 80, max: 1200,
  },
  'as-c2': {
    prompt: 'Write a short consultation brief you could take to an appointment: what you’ve noticed, for how long, what you’ve tried, and what you want to understand. Leave out anything you wouldn’t want course staff to read.',
    min: 120, max: 1500,
  },
};

export const LESSON_BODIES = {
  default: [
    'This lesson is sample text for the prototype. In the finished product, the creator writes or uploads the full lesson here.',
    'Written lessons use the same reading styles as articles, so a creator’s teaching and writing feel like one body of work.',
  ],
  c2l2: [
    'Melanin is made by cells called melanocytes. When skin is inflamed, by acne, a burn, or even an aggressive scrub, those cells can make extra pigment.',
    '## Why deeper skin is more affected',
    'Melanocytes in deeper skin tend to respond more strongly to inflammation, so marks can be darker and last longer. That is a difference in response, not a flaw.',
    '> Treat the inflammation first. The mark is a record of it.',
    'In the next module we’ll look at what daily habits help marks fade and stop new ones from forming.',
  ],
  c1l2: [
    'Before changing any products, write down your week: when you wash, when you style, and when your hair feels its best and worst.',
    '## Find your real window',
    'If you have three hours on a Sunday evening, plan for two and a half. A wash day that overruns is the one you’ll skip next time.',
  ],
};

// ---------------------------------------------------------------- watch
export const SERIES = [
  {
    id: 's1', channelId: 'plume', title: 'Beauty Where I’m From',
    kind: 'Docuseries', topics: ['rituals'],
    description: 'Four films about the places, people and rituals that shape how beauty is practised at home. Each episode is led by someone from that place.',
    art: { kind: 'place', skin: 'deep', hair: 'braids', hairColor: '#1C1210', bg: 'dusk', garment: '#F1CF7C', acc: 'gold', blooms: ['coral', 'butter'] },
    episodes: ['v1', 'v2', 'v3', 'v4'],
    credits: [['Series producer', 'Plume Editorial'], ['Commissioned by', 'Plume (paid production)']],
  },
];

export const VIDEOS = [
  {
    id: 'v1', channelId: 'plume', seriesId: 's1', episode: 1, status: 'published', kind: 'Docuseries',
    title: 'Lagos: The Saturday Salon',
    description: 'A day inside a family-run braiding salon in Surulere, where the Saturday queue starts before sunrise and the conversation never stops.',
    minutes: 24, duration: '24:10', language: 'English, Yoruba', published: '2026-10-03', topics: ['rituals', 'textured-hair'],
    captions: ['English'], transcript: true,
    credits: [['Director', 'Tolu Adeyemi'], ['Featuring', 'Mama Bisi and the salon team'], ['Produced by', 'Plume Editorial']],
    art: { kind: 'place', skin: 'deep', hair: 'braids', hairColor: '#1C1210', bg: 'dusk', garment: '#F1CF7C', acc: 'gold', blooms: ['coral', 'butter'] },
  },
  {
    id: 'v2', channelId: 'plume', seriesId: 's1', episode: 2, status: 'published', kind: 'Docuseries',
    title: 'Beppu: Water and Stone',
    description: 'Keiko Arai returns to her grandmother’s town of hot springs and asks what a bath is for.',
    minutes: 22, duration: '21:45', language: 'Japanese, English', published: '2026-10-10', topics: ['rituals', 'sensitive-skin'],
    captions: ['English', 'Japanese'], transcript: true,
    credits: [['Director', 'Haruka Mori'], ['Featuring', 'Keiko Arai'], ['Produced by', 'Plume Editorial']],
    featuring: 'keiko',
    art: { kind: 'place', skin: 'light', hair: 'bob', hairColor: '#15110F', bg: 'sea', garment: '#CBBDE1', steam: true, blooms: ['mint'] },
  },
  {
    id: 'v3', channelId: 'plume', seriesId: 's1', episode: 3, status: 'published', kind: 'Docuseries',
    title: 'Oaxaca: Steam and Herbs',
    description: 'In a village temazcal, a healer and her granddaughter prepare the herbs for a sweat bath ceremony.',
    minutes: 26, duration: '26:02', language: 'Spanish, Zapotec', published: '2026-10-10', topics: ['rituals'],
    captions: ['Spanish'], transcript: false,
    credits: [['Director', 'Lucía Hernández'], ['Featuring', 'Doña Elvira and family'], ['Produced by', 'Plume Editorial']],
    art: { kind: 'place', skin: 'clayTone', hair: 'braids', hairColor: '#120C0A', bg: 'clay', garment: '#45203F', acc: 'gold', blooms: ['butter'] },
  },
  {
    id: 'v4', channelId: 'plume', seriesId: 's1', episode: 4, status: 'upcoming', premieres: '2026-10-26', kind: 'Docuseries',
    title: 'Khartoum: Henna Nights',
    description: 'Zainab Hassan films the night before her cousin’s wedding, when the women of the family gather for henna.',
    minutes: 23, duration: '22:30', language: 'Arabic, English', published: null, topics: ['rituals'],
    captions: [], transcript: false,
    credits: [['Director', 'Zainab Hassan'], ['Produced by', 'Plume Editorial']],
    featuring: 'zainab',
    art: { kind: 'place', skin: 'deepWarm', hair: 'wrap', hairColor: '#E7897E', bg: 'night', garment: '#F1CF7C', acc: 'gold', blooms: ['coral'] },
  },
  {
    id: 'v5', channelId: 'sorrel', status: 'published', kind: 'Interview',
    title: 'Founder Stories: Building with a shea cooperative',
    description: 'Nia Adebayo-Brooks on pricing, trust and the year the harvest failed. Produced by Sorrel & Shea.',
    minutes: 14, duration: '14:20', language: 'English', published: '2026-09-27', topics: ['founders', 'body-care'],
    captions: ['English'], transcript: false,
    credits: [['Interview', 'Nia Adebayo-Brooks'], ['Produced by', 'Sorrel & Shea (brand)']],
    labels: ['brand'],
    art: { kind: 'portrait', skin: 'rich', hair: 'locs', hairColor: '#24160F', bg: 'mint', garment: '#2F4A3F', acc: 'hoop', blooms: ['butter'] },
  },
  {
    id: 'v6', channelId: 'marisol', status: 'published', kind: 'Explainer',
    title: 'What melanin actually does',
    description: 'A nine-minute explainer on pigment, protection, and why dark marks behave differently in deeper skin.',
    minutes: 9, duration: '8:40', language: 'English, Spanish', published: '2026-10-06', topics: ['science', 'hyperpigmentation'],
    captions: ['English', 'Spanish'], transcript: true,
    credits: [['Presenter', 'Marisol Vega, NP'], ['Produced by', 'Marisol Vega']],
    art: { kind: 'abstract', bg: 'lilac', blooms: ['coral', 'butter', 'mint'] },
  },
  {
    id: 'v7', channelId: 'rohan', status: 'published', kind: 'Explainer',
    title: 'How preservatives keep your cream safe',
    description: 'Why water-based products need preservatives, and what happens without them.',
    minutes: 11, duration: '11:05', language: 'English', published: '2026-09-19', topics: ['ingredients', 'science'],
    captions: ['English'], transcript: false,
    credits: [['Presenter', 'Rohan Mehta']],
    art: { kind: 'still', bg: 'sand', objects: ['bottle', 'jar'], blooms: ['mint'] },
  },
  {
    id: 'v8', channelId: 'amara', status: 'published', kind: 'Short film',
    title: 'Wash day, in real time',
    description: 'Three hours, compressed to eighteen minutes, with no music and no edits to my hair.',
    minutes: 18, duration: '18:00', language: 'English', published: '2026-10-04', topics: ['textured-hair', 'rituals'],
    captions: ['English'], transcript: false,
    credits: [['Filmed by', 'Amara Okafor']],
    labels: ['experience'],
    art: { kind: 'portrait', skin: 'deep', hair: 'coils', hairColor: '#1A1311', bg: 'butter', garment: '#45203F', acc: 'gold', blooms: ['coral'] },
  },
  {
    id: 'v9', channelId: 'lumen', status: 'published', kind: 'Explainer',
    title: 'Inside a consultation at Lumen',
    description: 'What happens in the first 30 minutes, filmed with a volunteer actor. No real patient appears.',
    minutes: 10, duration: '9:30', language: 'English', published: '2026-09-25', topics: ['clinic-care'],
    captions: ['English'], transcript: false,
    credits: [['Produced by', 'Lumen Skin Clinic'], ['Featuring', 'Marisol Vega, NP and a volunteer actor']],
    labels: ['brand'],
    art: { kind: 'portrait', skin: 'deepWarm', hair: 'braids', hairColor: '#1C1210', bg: 'night', garment: '#CBBDE1', acc: 'hoop', blooms: ['lilac'] },
  },
  {
    id: 'v10', channelId: 'nia', status: 'published', kind: 'Interview',
    title: 'Founder Stories: Leaving the lab',
    description: 'Nia talks, as herself, about leaving industrial chemistry to start a small brand.',
    minutes: 12, duration: '12:15', language: 'English', published: '2026-09-15', topics: ['founders'],
    captions: ['English'], transcript: false,
    credits: [['Interview', 'Nia Adebayo-Brooks'], ['Filmed by', 'Theo Brooks']],
    art: { kind: 'portrait', skin: 'rich', hair: 'locs', hairColor: '#24160F', bg: 'coral', garment: '#2F4A3F', acc: 'hoop', blooms: ['lilac'] },
  },
];

export const WATCH_COLLECTIONS = [
  { id: 'where', title: 'Beauty Where I’m From', note: 'A Plume docuseries', items: ['v1', 'v2', 'v3', 'v4'] },
  { id: 'founders', title: 'Founder Stories', note: 'Brand and founder-made films, labeled by who produced them', items: ['v5', 'v10'] },
  { id: 'science', title: 'The Science Behind Beauty', note: 'Explainers from practitioners and formulators', items: ['v6', 'v7', 'v9'] },
  { id: 'rituals', title: 'Rituals & Culture', note: 'Selected by Plume editors', items: ['v8', 'v2', 'v1', 'v3'] },
];

export const TRANSCRIPTS = {
  v1: [
    ['00:12', 'MAMA BISI', 'We open at six, but they are here at five. Every Saturday.'],
    ['00:31', 'NARRATOR', 'The salon has three chairs and one fan, and it has been in the same family for thirty years.'],
    ['01:05', 'CLIENT', 'I come for the braids. I stay for the gist.'],
    ['02:48', 'MAMA BISI', 'You don’t pull the edges. If it hurts, it’s wrong.'],
    ['04:10', 'NARRATOR', 'By nine, there is a queue on the pavement.'],
  ],
  v2: [
    ['00:08', 'KEIKO', 'My grandmother said the shower is for washing. The bath is for something else.'],
    ['01:22', 'KEIKO', 'In Beppu you can see the steam from almost anywhere in town.'],
    ['03:40', 'KEIKO', 'With rosacea I keep my face out of it. The rest of me goes in.'],
  ],
  v6: [
    ['00:05', 'MARISOL', 'Melanin is protection. It is not a problem to be solved.'],
    ['01:40', 'MARISOL', 'When skin is inflamed, pigment cells can overreact. That’s what a dark mark is.'],
    ['04:12', 'MARISOL', 'This is general education. Your own clinician can look at your skin.'],
  ],
};

// ---------------------------------------------------------------- per-account seed state
export const SEED_USERS = {
  amara: {
    followsCreators: ['marisol', 'keiko', 'zainab'], followsTopics: ['textured-hair', 'rituals'],
    saved: [{ kind: 'article', id: 'a4', at: '2026-10-06' }], watchlist: ['v2'],
    collections: [{ id: 'col-amara-1', name: 'Scalp care reading', items: [{ kind: 'article', id: 'a4' }, { kind: 'article', id: 'a5' }] }],
    enrollments: { c2: { at: '2026-10-01', paid: true, amount: 39, done: { c2l1: true, c2l2: true }, last: 'c2l3' } },
    quiz: {},
  },
  nia: {
    followsCreators: ['rohan', 'amara'], followsTopics: ['founders', 'ingredients'],
    saved: [], watchlist: [], collections: [],
    enrollments: { c4: { at: '2026-09-28', paid: false, amount: 0, done: { c4l1: true, c4l2: true, c4l3: true }, last: 'c4l3', completedAt: '2026-09-30' } },
    quiz: {},
  },
  marisol: {
    followsCreators: ['lumen', 'rohan'], followsTopics: ['hyperpigmentation', 'science'],
    saved: [{ kind: 'video', id: 'v7', at: '2026-10-02' }], watchlist: [], collections: [],
    enrollments: {}, quiz: {},
  },
  jordan: {
    followsCreators: ['keiko'], followsTopics: ['textured-hair', 'hyperpigmentation'],
    saved: [], watchlist: [], collections: [],
    enrollments: { c6: { at: '2026-10-05', paid: true, amount: 12, done: { c6l1: true }, last: 'c6l2' } },
    quiz: {},
  },
};

// Sample learners and submissions so the creator review queue isn't empty.
export const SAMPLE_LEARNERS = {
  c1: [['Sample learner A', 100], ['Sample learner B', 62], ['Sample learner C', 25], ['Sample learner D', 12]],
  c2: [['Sample learner E', 100], ['Sample learner F', 78], ['Sample learner G', 44], ['Sample learner H', 11]],
  c3: [['Sample learner I', 50]],
};

export const SEED_SUBMISSIONS = [
  {
    id: 'sub-1', courseId: 'c2', lessonId: 'c2l8', learnerName: 'Sample learner F', learnerId: null, at: '2026-10-09',
    text: 'I’ve had dark marks along my jaw for about a year, mostly after breakouts. I use sunscreen most days but not when it’s cloudy. I tried a scrub twice a week and I think it made things worse. I want to understand whether the marks will fade on their own and what I should avoid.',
    status: 'submitted', feedback: '',
  },
  {
    id: 'sub-2', courseId: 'c1', lessonId: 'c1l7', learnerName: 'Sample learner B', learnerId: null, at: '2026-10-07',
    text: 'Four sections, Sunday 6–9pm. I’m going to stop detangling before I wash and see if the comb count drops.',
    status: 'reviewed', feedback: 'Love that you set an end time. Let me know how the count goes after three weeks.',
  },
];

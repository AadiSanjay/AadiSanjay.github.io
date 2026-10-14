// `key` is the event.code that opens the project
const base = import.meta.env?.BASE_URL ?? '/';

export const content = {
  // the short "@ place / what" lines under my name
  roles: [
    { at: 'UIUC', what: 'B.S. CS + Econ, May 2029' },
    { at: 'NOBE × Cline Financial', what: 'software developer' },
    { at: 'PNW Keyboards', what: 'founder, est. 2022' },
  ],
  projects: [
    {
      id: 'focusticker',
      key: 'KeyF',
      short: 'focusticker',
      title: 'FocusTicker',
      image: { src: `${base}shots/focusticker.jpg`, alt: 'FocusTicker’s timer pill in the corner of LinkedIn, showing 02:34 today' },
      status: 'live on the Chrome Web Store',
      body: 'A Chrome extension that puts a small live timer on LinkedIn, Reddit, and other time sinks, so you see how long you’ve been scrolling instead of getting blocked.',
      stack: ['JavaScript', 'Manifest V3', 'Chrome APIs'],
      links: [
        { label: 'Chrome Web Store', href: 'https://chromewebstore.google.com/detail/focusticker/pghicmhngfmldcnoglcodkbaiaknjlah' },
        { label: 'GitHub', href: 'https://github.com/AadiSanjay/ChromeExt4SocialMedia' },
      ],
    },
    {
      id: 'capsule',
      key: 'KeyC',
      short: 'capsule',
      title: 'Capsule',
      status: 'iOS app · first version December 2026',
      body: 'A private pocket journal. Write a few lines, add a photo, and seal it like a time capsule until a date you choose.',
      stack: ['Swift', 'SwiftUI', 'SwiftData'],
      links: [],
    },
    {
      id: 'pnwkeyboards',
      key: 'KeyK',
      short: 'pnw kbs',
      title: 'PNW Keyboards',
      status: 'my keyboard shop, est. 2022 · 4.9★ on Etsy',
      body: 'I’ve built and sold custom 65% keyboards, starting in 2022. The keyboard on this page is one of mine, and so are its sounds.',
      stack: ['lubing', 'mods', 'sound tuning'],
      links: [
        { label: 'Etsy shop', href: 'https://www.etsy.com/shop/PNWKeyboards' },
        { label: 'Sound test', href: 'https://www.youtube.com/shorts/_28FialngiE' },
      ],
    },
  ],
  sections: {
    // placeholder until I write the real one
    about: {
      title: 'About',
      body: [
        'I’m Aadi, a CS + Econ student at UIUC from the Seattle area.',
        'I like building things people actually use: browser extensions, apps, and keyboards.',
      ],
      links: [],
    },
    experience: {
      title: 'Experience',
      body: [
        'Software Developer at NOBE × Cline Financial (2026 – now)',
        'Founder of PNW Keyboards (est. 2022)',
        'Co-founder & web developer at Educatodos (2024 – 2026)',
      ],
      links: [],
    },
    education: {
      title: 'Education',
      body: ['B.S. Computer Science + Economics', 'University of Illinois Urbana-Champaign · expected May 2029'],
      links: [],
    },
    contact: {
      title: 'Contact',
      body: 'Looking for summer 2027 internships. Email is the best way to reach me.',
      links: [
        { label: 'Email', href: 'mailto:aadisanjwa@gmail.com' },
        { label: 'LinkedIn', href: 'https://www.linkedin.com/in/aadi-sanjay/' },
        { label: 'GitHub', href: 'https://github.com/AadiSanjay' },
      ],
    },
    resume: {
      title: 'Resume',
      body: 'Everything else is on here.',
      links: [{ label: 'Open resume (PDF)', href: `${base}resume.pdf` }],
    },
  },
};

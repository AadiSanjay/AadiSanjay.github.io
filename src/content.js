// `key` is the event.code that opens the project
const base = import.meta.env?.BASE_URL ?? '/';

export const content = {
  projects: [
    {
      id: 'focusticker',
      key: 'KeyF',
      short: 'focusticker',
      title: 'FocusTicker',
      status: 'live on the Chrome Web Store',
      body: [
        'A Chrome extension I built after realizing how easy it was to open LinkedIn or Reddit for “a few minutes” and completely lose track of time. Instead of blocking sites, it adds a subtle live timer to the page so you can see your current session and your total for the day while you browse.',
        'What started as a simple timer turned into a real browser-engineering project: active-tab and window-focus tracking, idle detection, periodic checkpointing for Manifest V3 service workers, persistent daily usage, background/content-script messaging, favicon rendering, and a draggable Shadow DOM overlay that remembers where you put it.',
      ],
      stack: ['JavaScript', 'Manifest V3', 'Chrome APIs', 'Shadow DOM', 'HTML/CSS'],
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
      status: 'in progress · first full version December 2026',
      body: [
        'A pocket journal for the moments you don’t want to forget. Most of the ones I want to remember are small: a line that came to me on a walk, a photo from a night with friends. You write a few lines, add a photo if you like, in about 15 seconds. Later, the app gives those moments back to you.',
        'You’ll be able to seal an entry like a time capsule so it stays hidden until a date you choose, or pull up what you wrote this time last year. Everything stays on your phone, behind a calm, bookish design in light or dark mode.',
      ],
      stack: ['Swift', 'SwiftUI', 'SwiftData', 'PhotosUI', 'UserNotifications'],
      links: [],
    },
    {
      id: 'pnwkeyboards',
      key: 'KeyK',
      short: 'pnw kbs',
      title: 'PNW Keyboards',
      status: 'my keyboard shop · 4 years on Etsy · 4.9★',
      body: [
        'I build and sell custom 65% mechanical keyboards: lubed, modded, and tuned to sound thocky. It started as Floofd Keebs and is now PNW Keyboards, run out of Bellevue, WA.',
        'The board you’re typing on up there is one of mine, and the sounds are recorded from my builds.',
      ],
      stack: ['switch lubing', 'case foam mods', 'soldering', 'sound tuning'],
      links: [
        { label: 'Etsy shop', href: 'https://www.etsy.com/shop/PNWKeyboards' },
        { label: 'Sound test', href: 'https://www.youtube.com/shorts/_28FialngiE' },
      ],
    },
  ],
  sections: {
    about: {
      title: 'About',
      body: [
        'I’m Aadi, a Computer Science + Economics student at the University of Illinois Urbana-Champaign (class of 2029) and a National Merit Finalist, originally from the Seattle area.',
        'I like building things people actually use: browser extensions, apps, and keyboards. Right now I’m a software developer on the NOBE Technology Committee, building an investment app for Cline Financial.',
        'Outside of code I coached 160+ middle-school debaters, mentored DECA competitors (I was an ICDC finalist), and spend too long listening to switches.',
      ],
      links: [],
    },
    experience: {
      title: 'Experience',
      items: [
        {
          role: 'Software Developer',
          org: 'NOBE Technology Committee × Cline Financial',
          dates: 'Sep 2026 – now',
          blurb: 'Building a React/TypeScript and C#/.NET investment app in a shared codebase. I wrote the ClosedXML parser that turns brokerage subaccount workbooks into validated, normalized transaction and cost-basis data.',
          stack: ['React', 'TypeScript', 'C#', '.NET', 'ClosedXML'],
        },
        {
          role: 'Founder',
          org: 'PNW Keyboards (prev. Floofd Keebs)',
          dates: '2022 – now',
          blurb: 'Design, mod, and sell custom 65% keyboards on Etsy: 10 sales and a 4.9★ average across 7 reviews.',
          stack: ['soldering', 'acoustics', 'small business'],
        },
        {
          role: 'Co-Founder & Web Developer',
          org: 'Educatodos',
          dates: 'Jan 2024 – Aug 2026',
          blurb: 'Built a multilingual site for Spanish-speaking English learners and co-ran tutoring for 50+ students.',
          stack: ['HTML', 'CSS', 'JavaScript'],
        },
        {
          role: 'Web Developer',
          org: 'GLOW Action',
          dates: 'Mar 2025 – Jun 2026',
          blurb: 'Designed and prototyped C3-AP, a disaster-preparedness app for rural communities in Andhra Pradesh, shaped by feedback from 50+ youth.',
          stack: ['prototyping', 'UX research'],
        },
      ],
      links: [],
    },
    education: {
      title: 'Education',
      items: [
        {
          role: 'B.S. Computer Science + Economics',
          org: 'University of Illinois Urbana-Champaign',
          dates: 'expected May 2029',
          blurb: 'National Merit Finalist. Coursework: CS 124, MATH 257 (Linear Algebra), STAT 200.',
          stack: [],
        },
      ],
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
      body: 'One page. Looking for summer 2027 internships.',
      links: [{ label: 'Open resume (PDF)', href: `${base}resume.pdf` }],
    },
  },
};

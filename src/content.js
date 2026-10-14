// TODO: real projects + copy. `key` is the event.code that opens it.
export const content = {
  projects: [
    {
      id: 'project-one',
      key: 'KeyP',
      short: 'proj 1',
      title: 'Project one',
      blurb: 'One or two lines on what it does and why you built it.',
      tags: ['web'],
      links: [{ label: 'code', href: 'https://github.com/' }],
    },
    {
      id: 'project-two',
      key: 'KeyM',
      short: 'proj 2',
      title: 'Project two',
      blurb: 'One or two lines on what it does and why you built it.',
      tags: ['python', 'ml'],
      links: [{ label: 'code', href: 'https://github.com/' }],
    },
    {
      id: 'project-three',
      key: 'KeyK',
      short: 'proj 3',
      title: 'Project three',
      blurb: 'One or two lines on what it does and why you built it.',
      tags: ['hardware'],
      links: [],
    },
  ],
  sections: {
    about: {
      title: 'About',
      body: 'A few sentences about you: school, what you like building, and the keyboard you are typing on right now.',
      links: [],
    },
    contact: {
      title: 'Contact',
      body: 'Best way to reach me is email.',
      links: [
        { label: 'email', href: 'mailto:you@example.com' },
        { label: 'linkedin', href: 'https://www.linkedin.com/' },
        { label: 'github', href: 'https://github.com/' },
      ],
    },
    resume: {
      title: 'Resume',
      body: 'Looking for summer 2027 internships.',
      links: [{ label: 'resume (pdf)', href: '#' }],
    },
  },
};

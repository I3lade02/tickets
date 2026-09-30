// Your websites. Edit this list, commit, and Vercel redeploys.
//
//   id       short name used in URLs and saved on every ticket. Don't change it
//            once tickets exist, or old tickets lose their site.
//   name     what you see in the dashboard
//   color    marks this site's tickets in the dashboard
//   origins  the addresses your site is served from. Only these may send
//            tickets with fetch() or post a form straight to /api/tickets.
//            Include both www and non-www if you use both.

export const SITES = [
  {
    id: 'site-one',
    name: 'Site One',
    color: '#2F43C9',
    origins: ['https://site-one.com', 'https://www.site-one.com'],
  },
  {
    id: 'site-two',
    name: 'Site Two',
    color: '#0E8A6A',
    origins: ['https://site-two.com'],
  },
  {
    id: 'site-three',
    name: 'Site Three',
    color: '#B4309B',
    origins: ['https://site-three.com'],
  },
];

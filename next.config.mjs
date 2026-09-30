// The dashboard and login page must never be shown inside another site's frame.
// The public form at /submit/... stays embeddable so your websites can iframe it.
const noFraming = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
];

const nextConfig = {
  async headers() {
    return [
      { source: '/admin/:path*', headers: noFraming },
      { source: '/login', headers: noFraming },
    ];
  },
};

export default nextConfig;

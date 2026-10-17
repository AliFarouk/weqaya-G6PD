const config = {
  appId: 'org.weqaya.g6pd',
  appName: 'وقاية G6PD',
  webDir: 'public',
  server: {
    // Configured per §3: Points to deployed Next.js site where server routes execute
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://weqaya.org',
    cleartext: process.env.NODE_ENV !== 'production',
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#5E72E4',
  },
};

export default config;

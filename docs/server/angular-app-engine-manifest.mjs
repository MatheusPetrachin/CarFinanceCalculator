
export default {
  basePath: 'C:/Program Files/Git/CarFinanceCalculator',
  supportedLocales: {
  "en-US": ""
},
  entryPoints: {
    '': () => import('./main.server.mjs')
  },
};

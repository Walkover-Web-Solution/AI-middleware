import atatus from 'atatus-nodejs';

if (process.env.ENVIROMENT === 'prod') {
  atatus.start({
    licenseKey: 'lic_apm_75107a1dd48345c0a46ceacba62c8c32',
    appName: `Node - GTWY - Backend - ${process.env.ENVIROMENT === 'prod' ? 'PROD' : 'DEV'}`,
    analytics: true,
    analyticsCaptureOutgoing: true,
    logBody: 'all',
  });
}
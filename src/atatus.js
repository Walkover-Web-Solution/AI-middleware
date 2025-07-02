import atatus from 'atatus-nodejs';

if (process.env.ENVIROMENT === 'prod') {
  atatus.start({
    licenseKey: process.env.ATATUS_LICENSE_KEY,
    appName: `Node - GTWY - Backend - ${process.env.ENVIROMENT === 'prod' ? 'PROD' : 'DEV'}`,
    analytics: true,
    analyticsCaptureOutgoing: true,
    logBody: 'all',
  });
}
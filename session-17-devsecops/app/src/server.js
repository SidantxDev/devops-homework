const { createApp, VERSION } = require('./app');

const PORT = Number(process.env.PORT || 3000);

createApp().listen(PORT, '0.0.0.0', () => {
  console.log(`s17-devsecops-demo ${VERSION} listening on port ${PORT}`);
});

const { createServer, VERSION } = require('./app');

const PORT = Number(process.env.PORT || 3000);

createServer().listen(PORT, '0.0.0.0', () => {
  console.log(`s16-cicd-demo ${VERSION} listening on port ${PORT}`);
});

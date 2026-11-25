// Hooks globales de Mocha: apaga el servidor de pruebas al terminar todo
const { detenerServidor } = require("./entorno");

exports.mochaHooks = {
  async afterAll() {
    await detenerServidor();
  }
};

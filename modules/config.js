// Wrap the potential private-variables module to avoid import errors.
var priVars

// Try to get the possibly non-existent module
try {
  priVars = require('./private-variables')
} catch (e) {
  if (e instanceof Error && e.code === "MODULE_NOT_FOUND") {
    priVars = {
      mailerVariables: {}
    }
  } else {
    throw e
  }
}

module.exports = {
  mongolabURL: process.env.mongolabURL ||
               priVars.mongolabURL ||
               'mongodb://localhost:27017/guidechat',
  mailPort: process.env.mailPort ||
            priVars.mailerVariables.port,
  mailPass: process.env.mailPass ||
            priVars.mailerVariables.pass,
  senderEmail: priVars.mailerVariables.senderEmail
}

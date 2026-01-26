module.exports = {
  default: {
    paths: ['features/**/*.feature'],
    require: ['steps/**/*.ts'],
    requireModule: ['ts-node/register'],
    format: ['progress-bar', 'html:cucumber-report.html'],
  }
}

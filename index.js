'use strict'
const fs = require('fs/promises')
const dot = require('dot')

class DotTemplate {
  constructor (serverless, options) {
    this.templateHooks = {}
    this.serverless = serverless
    dot.templateSettings.strip = false
    dot.templateSettings.varname = 'vars'
    this.hooks = this.calculateHooks(this.serverless.variables.service.custom.dotTemplate)
  }

  calculateHooks (templateConfig) {
    const output = {}
    const templateHooks = {}
    const templates = (Array.isArray(templateConfig) ? templateConfig : [templateConfig])
    for (const template of templates) {
      const event = (template.event || 'package:initialize')
      if (templateHooks[event] === undefined) { templateHooks[event] = [] }
      templateHooks[event].push(template)
    }
    for (const [stage, templates] of Object.entries(templateHooks)) {
      output[stage] = async () => {
        for (const config of templates) {
          for (const key of ['input', 'output', 'vars']) {
            if (config[key] === undefined) {
              throw Error(`Invalid template config, need ${key}`)
            }
          }
          if (config.name !== undefined) {
            this.serverless.cli.log(`Generating template ${config.name}`)
          } else {
            this.serverless.cli.log(`Generating template ${config.input} -> ${config.output}`)
          }
          try {
            await this.generateTemplate(config)
          } catch (e) {
            throw Error(`${config.input}: ${e.message}`)
          }
        }
      }
    }
    return (output)
  }

  async generateTemplate (config) {
    const template = await fs.readFile(config.input)
    const compiled = dot.template(template.toString())
    const outputData = compiled(config.vars)
    await fs.writeFile(config.output, outputData)
  }
}

module.exports = DotTemplate

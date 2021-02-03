const fs = require('fs/promises')
jest.mock('fs/promises')
const Serverless = require('serverless/lib/Serverless')
const dotTemplateLib = require('./index')

/* Standard test payload we'll use for most of the tests */
const stdPayload = {
    'name': 'Test',
    'input': 'test/basic.dot',
    'output': 'test/basic.tmpl',
    'vars': {
        'x': 'multiline'
    }
}

/*
    Run the majority of our tests in a simulated Serverless environment
    for the sake of a swift execution.
*/
describe('Mocked serverless tests', () => {
    let sls
    let payload
    const logFn = jest.fn()
    beforeEach(async () => {
        jest.clearAllMocks();
        fs.readFile.mockResolvedValue("Basic {{=vars.x}}{{=vars.y || ''}}\nTest")
        fs.writeFile.mockResolvedValue()
        payload = Object.assign({}, stdPayload)
        sls = {
            'variables': {
                'service': {
                    'custom': {
                        'dotTemplate': payload
                    }
                }
            },
            'pluginManager': {
                'hooks': {}
            },
            'cli': {
                'log': (line) = logFn
            }
        }
    })

    test('Single template', async () => {
        const tp = new dotTemplateLib(sls)
        await tp.hooks['package:initialize']()
        expect(fs.readFile).toHaveBeenCalledTimes(1)
        expect(fs.writeFile).toBeCalledWith('test/basic.tmpl', "Basic multiline\nTest")
        expect(fs.writeFile).toHaveBeenCalledTimes(1)
        expect(logFn).toHaveBeenCalledWith('Generating template Test')
        expect(logFn).toHaveBeenCalledTimes(1)
    })
    test('No template name', async () => {
        delete payload.name
        const tp = new dotTemplateLib(sls)
        await tp.hooks['package:initialize']()
        expect(fs.readFile).toHaveBeenCalledTimes(1)
        expect(fs.writeFile).toBeCalledWith('test/basic.tmpl', "Basic multiline\nTest")
        expect(fs.writeFile).toHaveBeenCalledTimes(1)
        expect(logFn).toHaveBeenCalledWith('Generating template test/basic.dot -> test/basic.tmpl')
        expect(logFn).toHaveBeenCalledTimes(1)
    })
    test('Multiple templates', async () => {
        let otherExample = {
            'input': 'test/other.dot',
            'output': 'test/other.tmpl',
            'vars': {
                'y': 'hello'
            }
        }
        sls.variables.service.custom.dotTemplate = [
            stdPayload,
            otherExample
        ]
        const tp = new dotTemplateLib(sls)
        await tp.hooks['package:initialize']()
        expect(fs.readFile).toHaveBeenCalledTimes(2)
        expect(fs.writeFile).toBeCalledWith('test/basic.tmpl', "Basic multiline\nTest")
        expect(fs.writeFile).toBeCalledWith('test/other.tmpl', "Basic undefinedhello\nTest")
        expect(fs.writeFile).toHaveBeenCalledTimes(2)
        expect(logFn).toHaveBeenCalledWith('Generating template Test')
        expect(logFn).toHaveBeenCalledWith('Generating template test/other.dot -> test/other.tmpl')
        expect(logFn).toHaveBeenCalledTimes(2)
    })
    test('Non-standard hook name', async () => {
        payload.event = 'test:hook'
        const tp = new dotTemplateLib(sls)
        await tp.hooks['test:hook']()
        expect(fs.readFile).toHaveBeenCalledTimes(1)
        expect(fs.writeFile).toBeCalledWith('test/basic.tmpl', "Basic multiline\nTest")
        expect(fs.writeFile).toHaveBeenCalledTimes(1)
        expect(logFn).toHaveBeenCalledWith('Generating template Test')
        expect(logFn).toHaveBeenCalledTimes(1)
    })
    test('Broken template file', async () => {
        fs.readFile.mockResolvedValue("Basic {{=xxx}}\nTest")
        const tp = new dotTemplateLib(sls)
        const promise = tp.hooks['package:initialize']()
        expect(fs.readFile).toHaveBeenCalledTimes(1)
        expect(logFn).toHaveBeenCalledWith('Generating template Test')
        expect(logFn).toHaveBeenCalledTimes(1)
        return expect(promise).rejects.toMatchObject(Error('test/basic.dot: xxx is not defined'))
    })
    test('Missing input', async () => {
        delete payload.input
        const tp = new dotTemplateLib(sls)
        const promise = tp.hooks['package:initialize']()
        return expect(promise).rejects.toMatchObject(Error('Invalid template config, need input'))
    })
    test('Missing output', async () => {
        delete payload.output
        const tp = new dotTemplateLib(sls)
        const promise = tp.hooks['package:initialize']()
        return expect(promise).rejects.toMatchObject(Error('Invalid template config, need output'))
    })
    test('Missing vars', async () => {
        delete payload.vars
        const tp = new dotTemplateLib(sls)
        const promise = tp.hooks['package:initialize']()
        return expect(promise).rejects.toMatchObject(Error('Invalid template config, need vars'))
    })
})

/*
    This is a bit fugly; there is probably a saner way to call a given hook
    without invoking the entire command.

    Nominally loads the plugin in Serverless just so that we know it's (somewhat)
    compatible with the actual environment, not just the simulated one. We're
    still effectively mocking parts of sls too, though, so it may make sense
    to do this in some other way down the line.
*/
describe('Serverless tests', () => {
    test('Single template', async () => {
        jest.clearAllMocks();
        fs.readFile.mockResolvedValue("Basic {{=vars.x}}\nTest")
        fs.writeFile.mockResolvedValue()
        const logFn = jest.fn()
        const sls = new Serverless()    
        await sls.init()
        sls.cli.log = logFn
        sls.service.custom.dotTemplate = stdPayload
        sls.pluginManager.addPlugin(dotTemplateLib)
        await sls.pluginManager.hooks['package:initialize'][0]['hook']()
        expect(fs.readFile).toHaveBeenCalledTimes(1)
        expect(fs.writeFile).toBeCalledWith('test/basic.tmpl', "Basic multiline\nTest")
        expect(logFn).toHaveBeenCalledTimes(1)
    })
})

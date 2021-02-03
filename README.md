# serverless-plugin-dot-template

[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## Description
This plugin for the [Serverless framework](http://www.serverless.com/) will generate files
based on [doT.js](http://olado.github.io/doT/) templates and Serverless variables.

This is useful if you have data available in Serverless but need to generate it into a static
file. For instance, AWS' Lambda@Edge doesn't accept environment variables, so packing any
deployment specific configuration into a file could make sense.

doT.js is a bare bones template engine, but comes with the added benefits of maturity, manageable
code size and a lack of third party dependencies. 

## Installation
Run `npm install` in your Serverless project:

```
$ npm install --save-dev serverless-plugin-dot-template
```

Add the plugin to your serverless.yml file:
```yml
plugins:
  - serverless-plugin-dot-template
```


## Usage

Templates are configured via `dotTemplate` in the `custom` section of `serverless.yml`. 

```
custom:
  dotTemplate:
    name: OIDC config
    input: templates/oidc.json.dot
    output: oidc/config.json
    vars:
      baseUrl: https://my.site.com
      clientId: skfywyjg3rgukhaslihufywe4t
      clientSecret: sdojkajftrgkulzsdfgkkwlirojgaiyfdgflihai3f75ywhisg
```

The above config will turn this template (input: `templates/oidc.json.dot`):

```
{
    "AUTH_REQUEST": {
        "client_id": {{= JSON.stringify(vars.clientId) }},
        "response_type": "code",
        "scope": "profile openid email",
        "redirect_uri": {{= JSON.stringify(vars.baseUrl + '/_callback') }}
    },
    "TOKEN_REQUEST": {
        "client_id": {{= JSON.stringify(vars.clientId) }},
        "client_secret": {{= JSON.stringify(vars.clientSecret) }},
        "redirect_uri": {{= JSON.stringify(vars.baseUrl +'/_callback') }}
        "grant_type": "authorization_code"
    }
}
```

...into this file (output: `oidc/config.json`) with the help of the `vars`.

```
{
    "AUTH_REQUEST": {
        "client_id": "skfywyjg3rgukhaslihufywe4t",
        "response_type": "code",
        "scope": "profile openid email",
        "redirect_uri": "https://my.site.com/_callback"
    },
    "TOKEN_REQUEST": {
        "client_id": "skfywyjg3rgukhaslihufywe4t",
        "client_secret": "sdojkajftrgkulzsdfgkkwlirojgaiyfdgflihai3f75ywhisg",
        "redirect_uri": "https://my.site.com/_callback"
        "grant_type": "authorization_code"
    }
}
```

See the [doT.js](http://olado.github.io/doT/index.html) page for usage examples.

### Arguments
* `input` (required): Path to template file.
* `output` (required): Path to target file.
* `vars`: (required): Variables that'll be available to the template.
* `name`: Friendly name of the template to show in the CLI log. Optional.
* `event`: A template will normally be generated in the `package:initialize` event;
setting `event` will generate it in the provided event instead.

### Multiple templates
`custom.dotTemplate` also accepts an array for input:
```
custom:
  dotTemplate:
    - name: OIDC config
      input: templates/oidc.json.dot
      output: oidc/config.json
      vars:
        baseUrl: https://my.site.com
        clientId: skfywyjg3rgukhaslihufywe4t
        clientSecret: sdojkajftrgkulzsdfgkkwlirojgaiyfdgflihai3f75ywhisg
    - name: Other template
      input: templates/test.ini.dot
      output: .hellorc
      vars:
        servername: ${self:custom.commonConfig.serverName}
```

### Considerations
* It is generally not wise to pass untrusted input into template engines without taking some 
precautions regarding quoting. doT doesn't come with guard rails, so be careful if you don't
control all of your inputs.
* If you generate JSON, quoting your data (JSON.stringify) would make good sense.

## Authors and acknowledgment
* Written by Kriss Andsten <kriss@ekkono.ai>
* [Ekkono Solutions](https://www.ekkono.ai) sponsored parts of the development time for this plugin.
* doT by [Laura Doktorova](https://github.com/olado)

## Contributing
Feel free to [raise issues](https://github.com/kandsten/serverless-plugin-dot-template/issues)
and/or send in pull requests.

## License
### Internet Systems Consortium license

Copyright (c) `2021`, `Kriss Andsten`

Permission to use, copy, modify, and/or distribute this software for any purpose
with or without fee is hereby granted, provided that the above copyright notice
and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND
FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS
OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER
TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF
THIS SOFTWARE.

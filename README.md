# Exemplo de um parser simples implementado usando combinadores de parsers

O exemplo contido nesse repositório segue em grande parte o tutorial presente nesse link: [https://www.sigmacomputing.com/blog/writing-a-parser-combinator-from-scratch-in-typescript/](https://www.sigmacomputing.com/blog/writing-a-parser-combinator-from-scratch-in-typescript/)

Demo: [https://marcoswitcel.github.io/small-language-parser-sample/web/](https://marcoswitcel.github.io/small-language-parser-sample/web/)

## Executando scripts com o Deno

Rodando versão de linha de comando.
```bash
deno run index.js
```

## Compilando a versão Web

Gerando o arquivo de distribuição.
```bash
deno bundle --config web-deno.json web.ts web/index.js
```
Deixando o compilador em modo de monitoramento do arquivo para facilitar o desenvolvimento.
```bash
deno bundle --config web-deno.json --watch web.ts web/index.js
```

## Definição de termos

https://en.wikipedia.org/wiki/Recursive_descent_parser
https://en.wikipedia.org/wiki/Terminal_and_nonterminal_symbols

## Referências

https://www.sigmacomputing.com/blog/writing-a-parser-combinator-from-scratch-in-typescript/
https://github.com/sigma-engineering/blog-combinators
https://foss.heptapod.net/pypy/example-interpreter
https://docs.github.com/pt/pages/getting-started-with-github-pages/creating-a-github-pages-site

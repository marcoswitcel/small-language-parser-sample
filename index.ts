
type Parser<T> = (ctx: Context) => Result<T>;

type Context = Readonly<{
    text: string,
    index: number,
}>;

type Result<T> = Success<T> | Failure;

type Success<T> = Readonly<{
    success: true,
    value: T,
    ctx: Context, // @todo certo aqui?
}>;

type Failure = Readonly<{
    success: false,
    expected: string,
    ctx: Context, // @todo certo aqui?
}>;

function success<T>(ctx: Context, value: T): Success<T> {
    return { success: true, value, ctx };
}

function failure<T>(ctx: Context, expected: string): Failure {
    return { success: false, expected, ctx };
}

/**
 * Gera parsers para símbolos específicos
 * @param match Símbolo terminal usado para o match
 * @returns Parser especializado em parsear o símbolo especificado
 */
function str(match: string): Parser<string> {
    return (ctx) => {
        const endIdx = ctx.index + match.length;
        if (ctx.text.substring(ctx.index, endIdx) === match) {
            return success({ ...ctx, index: endIdx }, match);
        } else {
            return failure(ctx, match);
        }
    }
}

/**
 * Gera parsers para expressões regulares específicas
 * @param re RegEx usada para realizar a identificação da sequência
 * @param expected Mensagem de aviso exibida quando houver erros
 * @returns Parser especializado em parser a expressão especificada
 */
function regex(re: RegExp, expected: string): Parser<string> {
    return ctx => {
        re.lastIndex = ctx.index;
        const res =  re.exec(ctx.text);
        if (res && res.index === ctx.index) {
            return success({ ...ctx, index: ctx.index + res[0].length }, res[0]);
        } else {
            return failure(ctx, expected);
        }
    };
}


/**
 * Testa todos os parsers em ordem e começando do mesmo ponto, retorna o 
 * primeiro que tiver sucesso parseando.
 * @param parsers Lista de parsers
 * @returns Return o primeiro que sucedeu ou a falha mais profunda
 */
function any<T>(parsers: Parser<T>[]): Parser<T> {
    return ctx => {
        let furthestRes : Result<T> | null = null;
        for (const parser of parsers) {
            const res =  parser(ctx);
            if (res.success) return res;
            if (!furthestRes || furthestRes.ctx.index < res.ctx.index) {
                furthestRes = res;
            }
        }

        if (furthestRes === null) {
            return failure(ctx, "No match on any combinator");
        } 

        return furthestRes;
    }
}

/**
 * Checa que um parser consegue consumir um sequência, senão retorna sucesso com null
 * @param parser parser opcional
 * @returns Retorna o sucesso do primeiro parser ou em caso falha retorna sucesso com null
 */
function optional<T>(parser: Parser<T>): Parser<T | null> {
    return any([ parser, (ctx) => success(ctx, null) ]);
}


/**
 * Procura por zero ou mais ocorrências de uma dada sequência, até não haver
 * mais matches. Se não achar nenhum ocorrência retornará lista vazia, esse
 * combinador nunca falha.
 * @param parser parser usado para consumir sequências
 * @returns Retorna a lista de valores encontrados, se não houver valores
 * retornará um lista vazia.
 */
function many<T>(parser: Parser<T>): Parser<T[]> {
    return ctx => {
        const values : T[] = [];
        let nextCtx = ctx;
        while (true) {
            const res = parser(nextCtx);
            if (!res.success) break;
            values.push(res.value);
            nextCtx = res.ctx;
        }
        return success(nextCtx, values);
    };
}

/**
 * Um método auxiliar que permitirá a nós fazermos coisas como montar
 * nós da AST a partir das strings consumidas.
 * @param parser Parser usado para fazer o match da sequência
 * @param fn callback que será chamado para cada sequência consumida e
 * realizará a troca do valor
 * @returns Retorna um novo parser com callback
 */
function map<A, B>(parser: Parser<A>, fn: (val: A) => B): Parser<B> {
    return ctx => {
        const res = parser(ctx);
        return res.success ? success(res.ctx, fn(res.value)) : res;
    }
}

function sequence<T>(parsers: Parser<T>[]): Parser<T[]> {
    return (ctx) => {
        const values: T[] = [];
        let nextCtx = ctx;
        for (const parser of parsers) {
            const res = parser(nextCtx);
            if (!res.success) return res;
            values.push(res.value);
            nextCtx = res.ctx;
        }
        return success(nextCtx, values);
    }
}


// Cenário original
{
    const cow = str("cow");
    const says = str("says");
    const moo = str("moo");
    const space = str(" ");
    
    const parseCowSentence = sequence([ cow, space, says, space, moo ]);
    
    
    const ctx = { text: "cow says moo", index: 0 };
    const result = parseCowSentence(ctx);
    
    console.log(result);
}

// Cenário mais completo
{
    type Expr = Call | number;

    interface Call {
        target: string;
        args: Expr[];
    }

    /**
     * Função que recebe o texto a ser parseado e realiza os preparativos,
     * quando o texto é parseado a função realiza o unboxing do texto.
     * @param text Texto que tentaremos parsear
     * @returns AST construída a partir do texto
     */
    const parse = (text: string): Expr => {
        const res = expr({ text, index: 0});

        if (res.success) return res.value;
        throw `Parse error, expected ${res.expected} at char ${res.ctx.index}`;
    }

    // expr = call | numberLiteral
    const expr = (ctx: Context): Result<Expr> => {
        return any<Expr>([call, numberLiteral])(ctx);
    }

    // regex que consome identificadores
    const ident = regex(/[a-zA-Z][a-zA-Z0-9]*/g, "identifier");

    // regex parser que consome um string de número
    const numberLiteral = map(
        regex(/[+\-]?[0-9]+(\.[0-9]*)?/g, "number"),
        // Mapeamento para a função que realizará a conversão da string para um
        // number, possivelmente com casas decimais
        parseFloat
    );

    // traillingArg = ',' arg
    const trailingArg = map(
        sequence<any>([str(","), expr]),
        // mapeado para um função que descarta a vírgula,
        // retornando apenas a expressão do argumento
        ([ _comma, argExpr]): Expr[] => argExpr
    );

    // args = expr ( trailingArg ) *
    const args = map(
        sequence<any>([expr, many(trailingArg)]),
        // Combinando o primeiro argumento e os agumentos restantes em uma
        // lista única
        ([arg1, rest]): Expr[] => [arg1,...rest],
    );

    // call = ident "(" args ")"
    const call = map(
        sequence<any>([ident, str("("), optional(args), str(")")]),
        // Descartamos o parêntese esquerdo e direito e usamos o nome da função
        // e a lista de argumentos para construir o nó Call da nossa AST
        ([fnName, _lparen, argList, _rparen]): Call => ({
            target: fnName,
            args: argList || []
        }),
    );

    const example = (code: string): void => {
        console.log(JSON.stringify(parse(code), null, 2));
    }
      
    example("1");
    example("Foo()");
    example("Foo(Bar())");
    example("Foo(Bar(1,2,3))");
}

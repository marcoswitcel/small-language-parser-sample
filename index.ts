
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

const cow = str("cow");
const says = str("says");
const moo = str("moo");
const space = str(" ");

const parseCowSentence = sequence([ cow, space, says, space, moo ]);


const ctx = { text: "cow says moo", index: 0 };
const result = parseCowSentence(ctx);

console.log(result);

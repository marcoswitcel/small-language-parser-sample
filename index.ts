
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

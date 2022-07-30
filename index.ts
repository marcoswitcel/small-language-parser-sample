
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

const cow = str("cow");
const says = str("says");
const moo = str("moo");
const space = str(" ");

const parseCowSentence = (ctx: Context) => {
    const cowRes = cow(ctx);
    if (!cowRes.success) return cowRes;

    // Precisa passar o Context da etapa acima/anterior para o próximo parser
    const spaceRes = space(cowRes.ctx);
    if (!spaceRes.success) return spaceRes;

    const saysRes = says(spaceRes.ctx);
    if (!saysRes.success) return saysRes;

    const spaceRes2 = space(saysRes.ctx);
    if (!spaceRes2.success) return spaceRes2;

    const mooRes = moo(spaceRes2.ctx);
    if (!mooRes.success) return mooRes;

    return success(mooRes.ctx, [
        cowRes.value,
        spaceRes.value,
        saysRes.value,
        spaceRes2.value,
        mooRes.value,
    ]);
}


const ctx = { text: "cow says moo", index: 0 };
const result = parseCowSentence(ctx);

console.log(result);

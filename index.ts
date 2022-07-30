
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

const parseCow : Parser<string> = (ctx) => {
    const match = "cow";
    const endIdx = ctx.index + match.length;
    if (ctx.text.substring(ctx.index, endIdx) === match) {
        return success({ ...ctx, index: endIdx }, match);
    } else {
        return failure(ctx, match);
    }
}

const ctx = { text: "cow says moo", index: 0 };
const result = parseCow(ctx);

console.log(result);

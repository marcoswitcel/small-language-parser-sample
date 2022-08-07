// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

function success(ctx, value) {
    return {
        success: true,
        value,
        ctx
    };
}
function failure(ctx, expected) {
    return {
        success: false,
        expected,
        ctx
    };
}
function str(match) {
    return (ctx)=>{
        const endIdx = ctx.index + match.length;
        if (ctx.text.substring(ctx.index, endIdx) === match) {
            return success({
                ...ctx,
                index: endIdx
            }, match);
        } else {
            return failure(ctx, match);
        }
    };
}
function regex(re, expected) {
    return (ctx)=>{
        re.lastIndex = ctx.index;
        const res = re.exec(ctx.text);
        if (res && res.index === ctx.index) {
            return success({
                ...ctx,
                index: ctx.index + res[0].length
            }, res[0]);
        } else {
            return failure(ctx, expected);
        }
    };
}
function any(parsers) {
    return (ctx)=>{
        let furthestRes = null;
        for (const parser of parsers){
            const res = parser(ctx);
            if (res.success) return res;
            if (!furthestRes || furthestRes.ctx.index < res.ctx.index) {
                furthestRes = res;
            }
        }
        if (furthestRes === null) {
            return failure(ctx, "No match on any combinator");
        }
        return furthestRes;
    };
}
function optional(parser) {
    return any([
        parser,
        (ctx)=>success(ctx, null)
    ]);
}
function many(parser) {
    return (ctx)=>{
        const values = [];
        let nextCtx = ctx;
        while(true){
            const res = parser(nextCtx);
            if (!res.success) break;
            values.push(res.value);
            nextCtx = res.ctx;
        }
        return success(nextCtx, values);
    };
}
function map(parser, fn) {
    return (ctx)=>{
        const res = parser(ctx);
        return res.success ? success(res.ctx, fn(res.value)) : res;
    };
}
function sequence(parsers) {
    return (ctx)=>{
        const values = [];
        let nextCtx = ctx;
        for (const parser of parsers){
            const res = parser(nextCtx);
            if (!res.success) return res;
            values.push(res.value);
            nextCtx = res.ctx;
        }
        return success(nextCtx, values);
    };
}
const parseFuncSentence = (text)=>{
    const res = expr({
        text,
        index: 0
    });
    if (res.success) return res.value;
    throw `Parse error, expected ${res.expected} at char ${res.ctx.index}`;
};
const expr = (ctx)=>{
    return any([
        call,
        numberLiteral
    ])(ctx);
};
const ident = regex(/[a-zA-Z][a-zA-Z0-9]*/g, "identifier");
const numberLiteral = map(regex(/[+\-]?[0-9]+(\.[0-9]*)?/g, "number"), parseFloat);
const trailingArg = map(sequence([
    str(","),
    expr
]), ([_comma, argExpr])=>argExpr);
const args = map(sequence([
    expr,
    many(trailingArg)
]), ([arg1, rest])=>[
        arg1,
        ...rest
    ]);
const call = map(sequence([
    ident,
    str("("),
    optional(args),
    str(")")
]), ([fnName, _lparen, argList, _rparen])=>({
        target: fnName,
        args: argList || []
    }));
const inputTag = document.getElementById("inputTag");
const preTag = document.getElementById("preTag");
const errorTag = document.getElementById("errorTag");
if (!(inputTag instanceof HTMLInputElement && preTag instanceof HTMLPreElement && errorTag instanceof HTMLDivElement)) {
    throw "Os elementos não estão corretamente setados no html";
}
inputTag.addEventListener('keyup', ()=>{
    try {
        preTag.innerText = JSON.stringify(parseFuncSentence(inputTag.value), null, 2);
        errorTag.innerText = '';
    } catch (error) {
        errorTag.innerText = error;
        preTag.innerText = '';
    }
});

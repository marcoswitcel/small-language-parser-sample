import { Context, Failure, Parser, Result, Success } from "./ParserTypes.ts";

export function success<T>(ctx: Context, value: T): Success<T> {
    return { success: true, value, ctx };
}

export function failure(ctx: Context, expected: string): Failure {
    return { success: false, expected, ctx };
}


/**
 * Gera parsers para símbolos específicos
 * @param match Símbolo terminal usado para o match
 * @returns Parser especializado em parsear o símbolo especificado
 */
export function str(match: string): Parser<string> {
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
export function regex(re: RegExp, expected: string): Parser<string> {
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
export function any<T>(parsers: Parser<T>[]): Parser<T> {
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
export function optional<T>(parser: Parser<T>): Parser<T | null> {
    return any([parser, (ctx) => success(ctx, null)]);
}


/**
 * Procura por zero ou mais ocorrências de uma dada sequência, até não haver
 * mais matches. Se não achar nenhum ocorrência retornará lista vazia, esse
 * combinador nunca falha.
 * @param parser parser usado para consumir sequências
 * @returns Retorna a lista de valores encontrados, se não houver valores
 * retornará um lista vazia.
 */
export function many<T>(parser: Parser<T>): Parser<T[]> {
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
export function map<A, B>(parser: Parser<A>, fn: (val: A) => B): Parser<B> {
    return ctx => {
        const res = parser(ctx);
        return res.success ? success(res.ctx, fn(res.value)) : res;
    }
}

export function sequence<T>(parsers: Parser<T>[]): Parser<T[]> {
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

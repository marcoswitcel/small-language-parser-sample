import { any, many, map, optional, regex, sequence, str } from "../ParserCombinators.ts";
import { Context, Result } from "../ParserTypes.ts";

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
export const parseFuncSentence = (text: string): Expr => {
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
    ([_comma, argExpr]): Expr[] => argExpr
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

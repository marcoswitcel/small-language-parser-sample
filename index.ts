import { parseCowSentence } from "./source/parser/CowLang.ts";
import { parseFuncSentence } from "./source/parser/FuncLang.ts";

// Cenário original
{
    const ctx = { text: "cow says moo", index: 0 };
    const result = parseCowSentence(ctx);
    
    console.log(result);
}

// Cenário mais completo
{
    const example = (code: string): void => {
        console.log(JSON.stringify(parseFuncSentence(code), null, 2));
    }
      
    example("1");
    example("Foo()");
    example("Foo(Bar())");
    example("Foo(Bar(1,2,3))");
}

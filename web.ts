/// <reference lib="dom" />
import { parseFuncSentence } from "./source/parser/FuncLang.ts";

const inputTag = document.getElementById("inputTag");
const preTag = document.getElementById("preTag");
const errorTag = document.getElementById("errorTag");

if (!(inputTag instanceof HTMLInputElement && preTag instanceof HTMLPreElement
    && errorTag instanceof HTMLDivElement)) {
    throw "Os elementos não estão corretamente setados no html";
}

inputTag.addEventListener('keyup', () => {
    try {
        preTag.innerText = JSON.stringify(parseFuncSentence(inputTag.value), null, 2)
        errorTag.innerText = '';
    } catch (error) {
        errorTag.innerText = error;
        preTag.innerText = '';
    }
});

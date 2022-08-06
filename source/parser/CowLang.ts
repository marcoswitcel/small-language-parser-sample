import { sequence, str } from "../ParserCombinators.ts";

const cow = str("cow");
const says = str("says");
const moo = str("moo");
const space = str(" ");

export const parseCowSentence = sequence([cow, space, says, space, moo]);

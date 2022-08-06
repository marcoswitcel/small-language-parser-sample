
export type Parser<T> = (ctx: Context) => Result<T>;

export type Context = Readonly<{
    text: string,
    index: number,
}>;

export type Result<T> = Success<T> | Failure;

export type Success<T> = Readonly<{
    success: true,
    value: T,
    ctx: Context,
}>;

export type Failure = Readonly<{
    success: false,
    expected: string,
    ctx: Context,
}>;

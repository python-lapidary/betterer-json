export interface Payload<T, P> {
    path: string;
    value: T;
    parent: P;
    parentProperty: string | number;
    hasArrExpr: boolean;
    pointer: string;
}

export type CB<T> = (value: T) => T | undefined;

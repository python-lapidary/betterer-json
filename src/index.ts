#!/usr/bin/env node

import {readFile} from "node:fs/promises";
import JSONbig from 'json-bigint';
import {CB, Payload} from "./types.js";
import {JSONPath} from "jsonpath-plus";
import {set} from "jsonpointer";
import { resolve } from "node:path";

const JSONB = JSONbig({useNativeBigInt: true});

declare global {
    var replace: (query: string, cb: CB<any>) => void;
}

export function replace<T>(data: any, path: string | string[], cb: CB<T>) {
    const paths = Array.isArray(path) ? path : [path];
    const founds: Record<string, any> = {};
    for (const path of paths) {

        const results: Record<string, Payload<T, any>> = JSONPath({
            resultType: 'all',
            path,
            json: data,
        });

        for (const payload of Object.values(results))
            founds[payload.pointer] = payload.value;
    }

    for (const [pointer, value] of Object.entries(founds)) {
        const newValue = cb(value)
        set(data, pointer, newValue);
    }
}

async function runUserScript(scriptPath: string, dataPath: string) {
    const dataRaw = await readFile(dataPath, {encoding: 'utf8'});
    const data = JSONB.parse(dataRaw);

    function match(query: string, cb: CB<any>) {
        replace(data, query, cb)
    }

    globalThis.replace = match;
    await import(`file://${resolve(scriptPath)}`);

    process.stdout.write(JSONB.stringify(data, null, 2));
}

async function main(): Promise<void> {
    await runUserScript(process.argv[2], process.argv[3]);
}

(await main());

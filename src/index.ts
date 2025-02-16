#!/usr/bin/env node

import {readFile} from "node:fs/promises";
import {resolve} from "node:path";
import JSONbig from 'json-bigint';
import {jsonpatch, JSONPathEnvironment, JSONValue} from 'json-p3';
import {CB} from "./types.js";

const JSONB = JSONbig({useNativeBigInt: true});

const jsonpath_ = new JSONPathEnvironment({strict: false});

declare global {
    var replace: (query: string, cb: CB<any>) => void;
}

export function replace(data: any, path: string | string[], cb: CB<JSONValue>) {
    const paths = Array.isArray(path) ? path : [path];

    for (const path of paths) {
        const results = jsonpath_.query(path, data);
        if (results.nodes.length == 0)
            throw new Error(`Path "${path}" was not found`)

        for (const result of results) {
            const replacement = cb(result.value);
            data = jsonpatch.apply([{
                op: !!replacement ? 'replace' : 'remove',
                path: result.toPointer().toString(),
                value: replacement,
            }], data)
        }
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

#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import JSONbig from 'json-bigint';
import * as p3 from 'json-p3';
import * as YAML from 'yaml';

type CB = (value: p3.JSONValue) => p3.JSONValue;

const jsonpath = new p3.JSONPathEnvironment({ strict: false });

declare global {
	var replace: (query: string, cb: CB) => void;
}

class Json {
	private json: {
		parse: (raw: string) => p3.JSONValue;
		stringify: (raw: p3.JSONValue, _: any, indent: number) => string;
	};

	constructor() {
		this.json = JSONbig({ useNativeBigInt: true });
	}

	public parse(raw: string) {
		return this.json.parse(raw);
	}

	public stringify(value: p3.JSONValue): string {
		return this.json.stringify(value, undefined, 2);
	}
}

class Yaml {
	public parse(raw: string) {
		return YAML.parse(raw);
	}

	public stringify(value: p3.JSONValue) {
		return YAML.stringify(value, {
			indentSeq: false,
			intAsBigInt: true,
		});
	}
}

export function replace(data: p3.JSONValue, path: string | string[], cb: CB) {
	const paths = Array.isArray(path) ? path : [path];
	let data_: p3.JSONValue = data;

	for (const path of paths) {
		const results = jsonpath.query(path, data_);
		if (results.nodes.length === 0)
			throw new Error(`Path "${path}" was not found`);

		// code is removing items, so in case it's removing them from an array, it must iterate in reverse order.
		for (const result of results.nodes.reverse()) {
			if (result.value === undefined) continue;
			const value = cb(result.value);
			data_ = p3.jsonpatch.apply(
				[
					{
						op: value ? 'replace' : 'remove',
						path: result.toPointer().toString(),
						value,
					},
				],
				data_,
			);
		}
	}
}

async function processContent(scriptPath: string, dataPath: string) {
	const yamlMode = !dataPath.endsWith('.json');
	const format = yamlMode ? new Yaml() : new Json();

	const dataRaw = await readFile(dataPath, { encoding: 'utf8' });
	const data = format.parse(dataRaw);

	function match(query: string, cb: CB) {
		replace(data, query, cb);
	}

	globalThis.replace = match;
	await import(`file://${resolve(scriptPath)}`);

	process.stdout.write(format.stringify(data));
}

async function main(): Promise<void> {
	await processContent(process.argv[2], process.argv[3]);
}

await main();

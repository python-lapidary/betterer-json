# Betterer-JSON

Make Your JSON Great Again

## What

Betterer-json allows users to programmatically edit (and hopefully make better-er) JSON files using JavaScript and JSONPath.
It applies JSONPath to select multiple values and calls JavaScript functions to generate fixes.

# How

Betterer-json executes a user-provided JS script with one or more calls to `replace()` 

`replace` function accepts JSONPath and callback.

- JSONPath select any number of values from the input JSON;
- callback is called for each of those values and its result is used as its replacement.

faulty.json:
```json
{
  "type": "string",
  "format": "datetime"
}
```

fix.js
```js
/// replace 'format: datetime' with 'format: date-time'
replace('$..format', value => {
    if(value === 'datetime')
        return 'date-time'
})
```

```shell
bettererjson fix.js faulty.json > better.json
```

## Why

Third party JSON documents often don't conform to their declared JSON Schema, which causes problems with processing them down the line.
Updating them is a repetitive task, more so If these documents are updated often.

Most other JSON tools focus more on reporting or extracting data.
The second-best is JSON Patch, but it changes documents one value at a time.

import errCode from 'err-code'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import browserStreamToIt from 'browser-readablestream-to-it'
import blobToIt from 'blob-to-it'
import itPeekable from 'it-peekable'
import all from 'it-all'
import map from 'it-map'
import {
  isBytes,
  isReadableStream,
  isBlob
} from './utils.js'

/**
 * @param {import('./normalise').ToContent} input
 */
export async function normaliseContent (input) {
  return toAsyncGenerator(input)
}

/**
 * @param {import('./normalise').ToContent} input
 */
async function * toAsyncGenerator (input) {
  // Bytes | String
  if (isBytes(input)) {
    yield toBytes(input)
    return
  }

  if (typeof input === 'string' || input instanceof String) {
    yield toBytes(input.toString())
    return
  }

  // Blob
  if (isBlob(input)) {
    yield * blobToIt(input)
    return
  }

  // Browser stream
  if (isReadableStream(input)) {
    input = browserStreamToIt(input)
  }

  // (Async)Iterator<?>
  if (Symbol.iterator in input || Symbol.asyncIterator in input) {
    /** @type {any} peekable */
    const peekable = itPeekable(input)

    /** @type {any} value */
    const { value, done } = await peekable.peek()

    if (done) {
      // make sure empty iterators result in empty files
      yield * []
      return
    }

    peekable.push(value)

    // (Async)Iterable<Number>
    if (Number.isInteger(value)) {
      yield Uint8Array.from((await all(peekable)))
      return
    }

    // (Async)Iterable<Bytes|String>
    if (isBytes(value) || typeof value === 'string' || value instanceof String) {
      yield * map(peekable, toBytes)
      return
    }
  }

  throw errCode(new Error(`Unexpected input: ${input}`), 'ERR_UNEXPECTED_INPUT')
}

/**
 * @param {ArrayBuffer | ArrayBufferView | string | InstanceType<typeof window.String> | number[]} chunk
 */
function toBytes (chunk) {
  if (chunk instanceof Uint8Array) {
    return chunk
  }

  if (ArrayBuffer.isView(chunk)) {
    return new Uint8Array(chunk.buffer, chunk.byteOffset, chunk.byteLength)
  }

  if (chunk instanceof ArrayBuffer) {
    return new Uint8Array(chunk)
  }

  if (Array.isArray(chunk)) {
    return Uint8Array.from(chunk)
  }

  return uint8ArrayFromString(chunk.toString())
}

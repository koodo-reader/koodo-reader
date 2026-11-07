// SPDX-License-Identifier: MIT

import { checkAbort } from "../io.mjs";

/** Internal ordered write loop for one temporary-file chunk. */
export async function writeSpoolChunk(handle, chunk, position, signal) {
  let written = 0;
  while (written < chunk.byteLength) {
    checkAbort(signal);
    const remaining = chunk.byteLength - written;
    let result;
    try {
      result = await handle.write(chunk, written, remaining, position);
    } finally {
      checkAbort(signal);
    }
    const count = result?.bytesWritten;
    if (!Number.isSafeInteger(count) || count <= 0 || count > remaining) {
      throw new RangeError("FileHandle returned an invalid write count");
    }
    written += count;
    position += count;
  }
  return position;
}

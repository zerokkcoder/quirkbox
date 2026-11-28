# StarRudder

StarRudder is a collection of browser-only tools where input never leaves the device. This glossary pins terms whose meaning would otherwise be ambiguous in that context.

## Language

**Minify**:
The lossless removal of whitespace and line breaks from a JSON document, leaving valid, parseable JSON text. In this project, "compression" of JSON always means Minify — never binary gzip or base64 encoding.
_Avoid_: compress, gzip

## Credentials

**Password** (密碼):
A secret drawn character by character from a character set, such as `mQ7!vZ2#pL9@`. In StarRudder it names one of the two generation modes, never the tool as a whole.
_Avoid_: passphrase, 口令, 通行詞

**Passphrase** (口令):
A secret built from randomly chosen words, such as `river-lamp-velvet-cactus`, used when a person must read, type or remember it. In StarRudder it names the second generation mode.
_Avoid_: password, 密碼, memorable password

## Time

**Instant** (時刻):
The absolute moment on the timeline. A **Unix Timestamp** denotes one **Instant** and carries no time zone; a time zone belongs only to a **Formatted Date** of that **Instant**.
_Avoid_: date, local time, epoch time

**Unix Timestamp** (Unix 時間戳記):
An integer count of seconds since 1970-01-01T00:00:00Z, excluding leap seconds, or the same count expressed in milliseconds, microseconds or nanoseconds. It names the value a user pastes into the tool, never the tool itself.
_Avoid_: epoch (which names the origin, not a value), time, datetime

**Formatted Date** (格式化日期):
A human-readable rendering of an **Instant** under a chosen IANA time zone and format, such as ISO 8601 or RFC 2822. Interpreting a **Unix Timestamp** yields one or more **Formatted Dates**, never a different **Instant**.
_Avoid_: converted timestamp, converted date

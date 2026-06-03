---
sidebar_position: 9
title: JWT Decoder
---

# JWT Decoder

**Route:** `/jwt`

Decode and inspect [JSON Web Tokens](https://jwt.io/introduction).

## Features

- **Header and payload inspection** — decode the token's claims.
- **Readable JSON** view of each segment.
- **Validation** of token structure.

## Using it

1. Open **JWT Decoder** from the sidebar.
2. Paste a JWT (`header.payload.signature`).
3. Inspect the decoded header and payload claims.

## Notes

- Decoding happens in your browser. A JWT is only **Base64URL-encoded**, not
  encrypted — never treat the contents as secret.

## Related

- [Base64 Encoder / Decoder](./base64.md)

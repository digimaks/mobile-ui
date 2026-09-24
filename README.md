# Digimaks WebApp

Digimaks is a mobile digital wallet built on open EUDI Wallet reference
components and technically aligned with the formats and protocols of the
EUDI Wallet Architecture and Reference Framework (SD-JWT VC, mdoc,
OpenID4VCI, OpenID4VP).

> Digimaks is not a certified European Digital Identity Wallet within the
> meaning of Regulation (EU) 2024/1183 and is not the national wallet of
> any EU Member State.

Built with the [LX/UI platform](https://github.com/dativa-lv/lx-ui) and
[Vue.js 3](https://vuejs.org/) for fast, consistent, and accessible user
interfaces.

The WebApp contains the wallet screens and communication layer for onboarding,
document issuance, document presentation, document management, usage history,
and document signing.

## Requirements

- [Node.js](https://nodejs.org/)
- [pnpm](https://pnpm.io/)

## Development

1. Build dev server:

    ```
    pnpm i
    ```

2. Run dev server (also possible with vs code debug functionality F5) :

    ```
    pnpm dev
    ```

3. Don't forget to make sure you're using latest version of
   [`@dativa-lv/lx-ui`](https://github.com/dativa-lv/lx-ui):

    ```
    pnpm i -w @dativa-lv/lx-ui@latest
    ```

## Important notes

It's **very important** that the WebApp can be built and run locally with no
extra steps:

- Clone this repository.
- Run `pnpm i`.
- Press **F5** (**Run and Debug** in VS Code).
- The WebApp starts in the local browser.

Other ways to run the WebApp, such as connecting to a locally running API or a
test environment, are also possible but should be considered additional
methods.

## License

Licensed under the [EUPL-1.2](LICENSE).


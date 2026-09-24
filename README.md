# Digimaks WebApp

Digimaks is an [EU Digital Identity Wallet (EUDIW)](https://ec.europa.eu/digital-building-blocks/sites/display/EUDIGITALIDENTITYWALLET/EU+Digital+Identity+Wallet+Home) application for mobile
platforms, continuing the work of the
[NOBID Consortium](https://www.nobidconsortium.com/). This repository contains
the Vue WebApp used as its user interface and communication layer inside the
native mobile applications.

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


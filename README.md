
## Getting started

If you are looking to run this app or contribute to Podverse for the first time, please read the sections that are relevant for you in our [CONTRIBUTE.md](https://github.com/podverse/podverse-ops/blob/master/CONTRIBUTING.md) file in the podverse-ops repo. Among other things, that file contains instructions for running a local instance of the Podverse database.

## How to run the app locally

To run Podverse web locally:

1) have node >= 16 installed
2) create a .env file
3) install node modules
4) run the app
5) open localhost:3000 in your browser

To create a .env file, copy the `.env.local-prod-data.example` file in this directory, and rename it to `.env`. The default values in this file will set the web app to load prod data from <api.podverse.fm>. You can change it later to use a local database as described in the [CONTRIBUTE.md](https://github.com/podverse/podverse-ops/blob/master/CONTRIBUTING.md).

To install the node modules, run:

```bash
npm install
```

Then, to run the app:

```bash
npm run dev
```

Then open a web browser and go to <http://localhost:3000>.

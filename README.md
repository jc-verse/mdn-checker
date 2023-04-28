# mdn-checker

Check MDN page structures

## Installation

```bash
yarn
yarn build
```

We don't have an npm publishing yet, although we may in the future.

## Usage

```bash
yarn mdn-checker ../content
```

where `../content` is the path to the MDN content repository.

To run the ES scraper:

```bash
yarn es:scrape
```

To sync the ES spec with upstream:

```bash
yarn es:sync
```

# github-advisory-database-rss

RSS Feeds for GitHub Advisory Database.

## Usage

1. Visit <https://azu.github.io/github-advisory-database-rss/>
2. Subscribe RSS Feeds

:memo: It outputs [JSON Feed](https://www.jsonfeed.org/) and Atom Feed.

## Add "ECOSYSTEM"

1. Edit [RSS_FEEDS.ts](./src/RSS_FEEDS.ts)
2. Add new ECOSYSTEM

:memo: You may need to run `yarn upgrade` for updating types.

## Debug

    yarn install
    GITHUB_TOKEN=xxx yarn run main

## Changelog

See [Releases page](https://github.com/azu/github-advisory-database-rss/releases).

## Running tests

Install devDependencies and Run `npm test`:

    npm test

## Contributing

Pull requests and stars are always welcome.

For bugs and feature requests, [please create an issue](https://github.com/azu/github-advisory-database-rss/issues).

1. Fork it!
2. Create your feature branch: `git checkout -b my-new-feature`
3. Commit your changes: `git commit -am 'Add some feature'`
4. Push to the branch: `git push origin my-new-feature`
5. Submit a pull request :D

## Author

- azu: [GitHub](https://github.com/azu), [Twitter](https://twitter.com/azu_re)

## License

MIT © azu

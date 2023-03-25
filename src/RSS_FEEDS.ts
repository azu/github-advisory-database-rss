import { SecurityAdvisoryEcosystem } from "@octokit/graphql-schema";

const BASE_URL = "https://azu.github.io/github-advisory-database-rss";
const createBase = (ecosystem: SecurityAdvisoryEcosystem) => {
    const low = ecosystem.toLowerCase();
    return {
        ecosystem: ecosystem,
        link: `${BASE_URL}/${low}.json`,
        homepage: `https://github.com/advisories?query=type%3Areviewed+ecosystem%3A${low}`
    };
};
export type RSS_FEED = { title: string; ecosystem: SecurityAdvisoryEcosystem; link: string; homepage: string };
export const RSS_FEEDS: RSS_FEED[] = [
    {
        title: "Security Advisory for PHP packages hosted at packagist.org",
        ...createBase("COMPOSER")
    },
    {
        title: "Security Advisory for Go modules",
        ...createBase("GO")
    },
    {
        title: "Security Advisory for Java artifacts hosted at the Maven central repository",
        ...createBase("MAVEN")
    },
    {
        title: "Security Advisory for JavaScript packages hosted at npmjs.com",
        ...createBase("NPM")
    },
    {
        title: "Security Advisory for .NET packages hosted at the NuGet Gallery",
        ...createBase("NUGET")
    },
    {
        title: "Security Advisory for Python packages hosted at PyPI.org",
        ...createBase("PIP")
    },
    {
        title: "Security Advisory for Dart packages hosted at pub.dev",
        ...createBase("PUB")
    },
    {
        title: "Security Advisory for Ruby gems hosted at RubyGems.org",
        ...createBase("RUBYGEMS")
    },
    {
        title: "Security Advisory for Rust crates",
        ...createBase("RUST")
    },
    {
        title: "Security Advisory for Erlang/Elixir packages hosted at hex.pm",
        ...createBase("ERLANG")
    },
    {
        title: "Security Advisory for Github Actions",
        ...createBase("ACTIONS")
    }
];

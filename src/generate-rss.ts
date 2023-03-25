import { Feed } from "feed";
import path from "path";
import * as fs from "fs/promises";
import { convertJsonToOPML } from "./toOPML";
import { RSS_FEEDS } from "./RSS_FEEDS";
import { SecurityAdvisoryEcosystem } from "@octokit/graphql-schema";
import { graphql } from "@octokit/graphql";
import { SecurityAdvisoryReference, SecurityVulnerabilityConnection } from "@octokit/graphql-schema/schema";
import { createMarkdown } from "safe-marked";
import dayjs from "dayjs";

const createBody = (descriptionMarkdown: string, references: SecurityAdvisoryReference[]) => {
    const md = createMarkdown();
    const referencesMD = references.length
        ? "\n### References\n\n" +
          references
              .map((ref) => {
                  return `- <${ref.url}>`;
              })
              .join("\n")
        : "";
    return md(descriptionMarkdown + referencesMD);
};
type Item = {
    url: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    severity: string;
    author: {
        avatarUrl: string;
        login: string;
        url: string;
    };
    bodyHTML: string;
};

export type GenerateRSSOptions = {
    title: string;
    description: string;
    link: string;
    homepage?: string;
    image?: string;
    favicon?: string;
    updated: Date;
    filter?: (item: Item) => boolean; // if return true, it is included in the result
};

export const search = ({
    ecosystem,
    GITHUB_TOKEN,
    SIZE = 20
}: {
    ecosystem: SecurityAdvisoryEcosystem;
    GITHUB_TOKEN: string;
    SIZE: number;
}): Promise<Item[]> => {
    return graphql<{ securityVulnerabilities: SecurityVulnerabilityConnection }>(
        `
            query ($ECOSYSTEM: SecurityAdvisoryEcosystem!, $SIZE: Int!) {
                securityVulnerabilities(ecosystem: $ECOSYSTEM, first: $SIZE) {
                    nodes {
                        package {
                            name
                        }
                        advisory {
                            summary
                            description
                            references {
                                url
                            }
                            permalink
                            updatedAt
                            publishedAt
                        }
                        severity
                        updatedAt
                        vulnerableVersionRange
                    }
                }
            }
        `,
        {
            ECOSYSTEM: ecosystem,
            SIZE,
            headers: {
                authorization: `token ${GITHUB_TOKEN}`
            }
        }
    ).then((res) => {
        const nodes = res.securityVulnerabilities.nodes ?? [];
        return nodes?.map((node) => {
            if (!node) {
                throw new Error("Non node");
            }
            return {
                url: node.advisory.permalink,
                title: `[${node.package.name}] ${node.advisory.summary}`,
                createdAt: node.advisory.publishedAt,
                updatedAt: node.advisory.updatedAt,
                severity: node.severity,
                author: {
                    // FIXME: want to use published account
                    avatarUrl: "",
                    login: "GitHub",
                    url: node.advisory.permalink
                },
                bodyHTML: createBody(node.advisory.description, node.advisory.references)
            } as Item;
        });
    });
};

export const generateRSS = (items: Item[], options: GenerateRSSOptions) => {
    const feed = new Feed({
        title: options.title,
        description: options.description,
        id: options.link,
        link: options.homepage || options.link,
        feedLinks: { json: options.link },
        image: options.image,
        favicon: options.favicon,
        copyright: "github-advisory-database-rss",
        updated: options.updated,
        generator: "github-advisory-database-rss"
    });
    feed.addCategory("CRITICAL");
    feed.addCategory("HIGH");
    feed.addCategory("MODERATE");
    feed.addCategory("LOW");
    const filter = options.filter;
    const filteredItems = filter ? items.filter((item) => filter(item)) : items;
    filteredItems.forEach((item) => {
        const body = item.bodyHTML ?? "";
        const image = item.author.avatarUrl
            ? `<img src="${item.author.avatarUrl}" width="64" height="64" alt=""/><br/>`
            : "";
        feed.addItem({
            title: item.title,
            content: image + body,
            link: item.url,
            category: [
                {
                    term: item.severity,
                    name: "severity"
                }
            ],
            author: [
                {
                    name: item.author.login,
                    link: item.author.url,
                    email: `${item.author.login}@noreply.github.com`
                }
            ],
            published: dayjs(item.createdAt).toDate(),
            date: dayjs(item.updatedAt).toDate()
        });
    });
    if (path.extname(options.link) === ".json") {
        return feed.json1();
    } else {
        return feed.atom1();
    }
};

export type RSSItem = {
    query: string;
    SIZE?: number;
} & Omit<GenerateRSSOptions, "updated" | "description">;
if (require.main === module) {
    const distDir = path.join(__dirname, "../dist");
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    if (!GITHUB_TOKEN) {
        throw new Error("env.GITHUB_TOKEN required");
    }
    (async function () {
        await fs.mkdir(distDir, {
            recursive: true
        });
        for (const rssFeed of RSS_FEEDS) {
            try {
                const { ecosystem, ...options } = rssFeed;
                const items = await search({
                    ecosystem,
                    GITHUB_TOKEN: GITHUB_TOKEN,
                    SIZE: 20
                });
                if (!items) {
                    throw new Error("Can not found:" + ecosystem);
                }
                const jsonRSS = generateRSS(items, {
                    ...options,
                    description: `${rssFeed.title} on GitHub`,
                    updated: new Date()
                });
                const atomRSS = generateRSS(items, {
                    ...options,
                    link: rssFeed.link.replace(/\.json$/, ".rss"),
                    description: `${rssFeed.title} on GitHub`,
                    updated: new Date()
                });

                const filename = path.basename(rssFeed.link, ".json");
                await fs.writeFile(path.join(distDir, filename + ".json"), jsonRSS, "utf-8");
                await fs.writeFile(path.join(distDir, filename + ".rss"), atomRSS, "utf-8");
            } catch (error) {
                console.error(`Error on ${rssFeed.ecosystem}`, error);
                console.log("But continue to next");
            }
        }
        const opml = convertJsonToOPML(RSS_FEEDS);
        await fs.writeFile(path.join(distDir, "index.opml"), opml, "utf-8");
        const links = RSS_FEEDS.map((ecosystem) => {
            return `<li><code>${ecosystem.ecosystem}</code>: <a href="${ecosystem.link}">${
                ecosystem.link
            }</a> (<a href="${ecosystem.link.replace(/\.json$/, ".rss")}">atom</a>)</li>`;
        }).join("\n");
        const index = {
            html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>RSS Feeds for GitHub Advisory Database</title>
    <meta name="description" content="RSS Feeds for GitHub Advisory Database" />
</head>
<body>
<a href="https://github.com/azu/github-advisory-database-rss"><img style="position: absolute; top: 0; right: 0; border: 0;" src="https://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png" alt="Fork me on GitHub"></a>
<p>These RSS Feeds is a collection of <a href="https://github.com/advisories">GitHub Advisory Database</a>.</p>
<p>Supported Feed types</p>
<ul>
    <li>JSON Feed</li>
    <li>Atom Feed</li>
</ul>
<p>OPML Feeds(All ecosystems): <a href="./index.opml">https://azu.github.io/github-advisory-database-rss/index.opml</a></p>
<ul>
${links}
</ul>
<footer>
<a href="https://github.com/azu/github-advisory-database-rss">Source Code</a>
</footer>
</body>
</html>
`
        };
        await fs.writeFile(path.join(distDir, "index.html"), index.html, "utf-8");
    })().catch((error) => {
        console.error(error);
        process.exit(1);
    });
}

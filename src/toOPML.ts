import xml from "xml";
import { RSS_FEED } from "./RSS_FEEDS";

const convertItemToOutline = (item: RSS_FEED) => {
    return {
        outline: {
            _attr: {
                type: "rss",
                title: item.title,
                htmlUrl: item.link,
                xmlUrl: item.link
            }
        }
    };
};
export const convertJsonToOPML = (items: RSS_FEED[]) => {
    const head = {
        head: [
            {
                title: "GitHub Search Subscriptions"
            },
            {
                dateCreated: new Date().toISOString()
            }
        ]
    };
    return `<?xml version="1.0" encoding="UTF-8"?><opml version="2.0">
    ${xml(head, true)}
    ${xml(
        {
            body: [
                {
                    outline: [
                        {
                            _attr: {
                                title: "Subscriptions"
                            }
                        },
                        {
                            outline: items.map((item) => convertItemToOutline(item))
                        }
                    ]
                }
            ]
        },
        true
    )}
</opml>`;
};

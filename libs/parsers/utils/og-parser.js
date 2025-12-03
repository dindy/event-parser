module.exports = {
    parse: async content => {
        // const meta = await page.$$eval('meta', metas => metas.map(meta => meta));
        const regExp = /<meta\s[^>]*property=[\""'](og:[a-z]+)[\""']\s[^>]*content=[\""']([^'^\""]+?)[\""'][^>]*>/g
        const matches = [...content.matchAll(regExp)];

        return matches.map(match => ({property: match[1], content:match[2]}));
    }
}
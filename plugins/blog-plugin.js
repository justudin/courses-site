// Wraps @docusaurus/plugin-content-blog so the latest posts are exposed as
// global data, letting components like RecentUpdates read them at build time
// instead of fetching and parsing the RSS feed in the browser.
const blogPluginExports = require('@docusaurus/plugin-content-blog');

const blogPlugin = blogPluginExports.default;

async function blogPluginEnhanced(context, options) {
  const blogPluginInstance = await blogPlugin(context, options);

  return {
    ...blogPluginInstance,
    async contentLoaded(args) {
      await blogPluginInstance.contentLoaded?.(args);

      const recentPosts = args.content.blogPosts.slice(0, 5).map((post) => ({
        title: post.metadata.title,
        permalink: post.metadata.permalink,
        date: post.metadata.date,
      }));

      args.actions.setGlobalData({recentPosts});
    },
  };
}

module.exports = {
  ...blogPluginExports,
  default: blogPluginEnhanced,
};

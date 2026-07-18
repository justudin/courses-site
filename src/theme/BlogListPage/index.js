import React from 'react';
import clsx from 'clsx';
import {
  HtmlClassNameProvider,
  ThemeClassNames,
  PageMetadata,
} from '@docusaurus/theme-common';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import BlogSidebar from '@theme/BlogSidebar';
import BlogListPaginator from '@theme/BlogListPaginator';
import SearchMetadata from '@theme/SearchMetadata';
import BlogPostItems from '@theme/BlogPostItems';
import BlogListPageStructuredData from '@theme/BlogListPage/StructuredData';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

function BlogListPageMetadata({metadata}) {
  const {
    siteConfig: {title: siteTitle},
  } = useDocusaurusContext();
  const {blogDescription, blogTitle, permalink} = metadata;
  const isBlogOnlyMode = permalink === '/';
  const title = isBlogOnlyMode ? siteTitle : blogTitle;
  return (
    <>
      <PageMetadata title={title} description={blogDescription} />
      <SearchMetadata tag="blog_posts_list" />
    </>
  );
}

function BlogListPageContent({metadata, items, sidebar}) {
  const hasSidebar = sidebar && sidebar.items.length > 0;
  const isPaginatedListPage = metadata.page > 1;
  return (
    <Layout>
      <div className="container margin-vert--lg">
      <div className="row">
      <BlogSidebar sidebar={sidebar} />
      <main className={clsx('col', hasSidebar ? 'col--10' : 'col--12')}>
      {isPaginatedListPage && (
        <nav className="page-breadcrumb" aria-label="Breadcrumb">
          <ol>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/updates">Updates</Link>
            </li>
            <li aria-current="page">Page {metadata.page}</li>
          </ol>
        </nav>
      )}
      {!isPaginatedListPage && (
        <div className="page-shell">
          <div className="page-header">
            <p className="page-kicker">Lab News</p>
            <h1>Updates</h1>
            <p className="page-lead">
              <em>
                Research outputs, announcements, and highlights from
                our team.
              </em>
            </p>
          </div>
        </div>
      )}
      <BlogPostItems items={items} />
      <BlogListPaginator metadata={metadata} />
      </main>
      </div>
      </div>
    </Layout>
  );
}

export default function BlogListPage(props) {
  return (
    <HtmlClassNameProvider
      className={clsx(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page.blogListPage,
      )}>
      <BlogListPageMetadata {...props} />
      <BlogListPageStructuredData {...props} />
      <BlogListPageContent {...props} />
    </HtmlClassNameProvider>
  );
}

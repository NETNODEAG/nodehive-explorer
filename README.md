# nodehive-explorer

A comprehensive web-based API explorer for NodeHive and Drupal JSON:API endpoints. Explore, query, and generate code for all your content entities with an intuitive interface.

Try: https://nodehive-explorer.vercel.app/?baseurl=demo.nodehive.app

## Features

- **Content Entity Explorers**: Browse and query Nodes, Taxonomy Terms, Media, Menus, Texts, Fragments, and Areas
- **Entity Type Management**: Access Content Types, Media Types, Fragment Types, and Vocabularies
- **System Tools**: Router and Spaces explorers for system-level operations
- **Dynamic Field Discovery**: Automatically detect available fields for each entity type
- **Advanced Filtering**: Sort, limit, include relations, and select specific fields
- **Multiple View Modes**: View response data as Table, Tree, or Raw JSON
- **Permission Awareness**: Visual warnings when content is hidden due to insufficient permissions
- **Code Generation**: Generate ready-to-use JavaScript/TypeScript code with nodehive-js for any query
- **Flexible Authentication**: Connect anonymously or with credentials, with visual connection status
- **URL Parameters**: Auto-connect via `?baseurl=` query parameter
- **Security-First**: Only exposes entity types that are openly available via the API

## Setup & Development

```bash
npm install
npm run dev
npm run build
```

## Stack

- React 18
- Vite
- Tailwind CSS
- nodehive-js
- drupal-jsonapi-params
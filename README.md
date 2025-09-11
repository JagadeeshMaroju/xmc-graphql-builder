# XM GraphQL Builder

A powerful, interactive GraphQL query builder designed as a **XM Cloud Marketplace application**. This application provides an intuitive interface for building, testing, and optimizing GraphQL queries without requiring deep knowledge of GraphQL syntax or manual credential management.

## 🚀 Features

### Core Functionality
- **Interactive Query Builder**: Visual interface for constructing GraphQL queries
- **Real-time Query Generation**: Automatically generates GraphQL queries as you build
- **Schema Explorer**: Browse and explore the complete GraphQL schema
- **Template Filtering**: Smart filtering of Sitecore templates with exclusion of system templates
- **Alphabetical Organization**: Templates sorted alphabetically for easy navigation

### Query Types Supported
- **Item Queries**: Query specific Sitecore items by path
- **Search Queries**: Advanced search with filtering, sorting, and pagination
- **Template-based Filtering**: Filter content by Sitecore templates
- **Inheritance Support**: Include base templates and inheritance chains

### Advanced Features
- **XM Cloud Integration**: Seamless authentication using XM Cloud Marketplace tokens
- **Query Preview**: Real-time preview with multiple copy methods (clipboard API, manual selection, download)
- **Variables Editor**: Manage query variables and parameters
- **Results Display**: View query results in a formatted display
- **Template Exclusion**: Automatically excludes system templates (Advanced, Appearance, Help, etc.)
- **No Manual Setup**: Works immediately after Marketplace installation
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

## 🛠️ Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **Styling**: SCSS with modern CSS Grid and Flexbox
- **GraphQL**: Apollo Client for GraphQL operations
- **State Management**: React Hooks and Context API
- **Build Tool**: Next.js with TypeScript compilation

## 📋 Prerequisites

- Node.js 18+ (for development)
- npm or yarn
- XM Cloud instance with Marketplace access
- Admin access to install Marketplace applications

## 🚀 Installation

### For XM Cloud Marketplace

1. **Build the application**
   ```bash
   git clone <repository-url>
   cd xmc-graphql-builder
   npm install
   npm run build
   ```

2. **Deploy to your hosting platform**
   - Deploy the built application to your preferred hosting service (Vercel, Netlify, etc.)
   - Ensure the app is accessible via HTTPS
   - Note the application URL

3. **Register with XM Cloud Marketplace**
   - Log into your XM Cloud instance
   - Navigate to the Marketplace section
   - Register your application with the deployed URL

4. **Install in your XM Cloud instance**
   - Find the "XM GraphQL Builder" in the Marketplace
   - Click "Install" to add it to your instance
   - The application will automatically authenticate using XM Cloud tokens

### For Development

1. **Clone and install**
   ```bash
   git clone <repository-url>
   cd xmc-graphql-builder
   npm install
   ```

2. **Environment Setup**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_XM_ENDPOINT=https://your-xm-cloud-instance.sitecorecloud.io/sitecore/api/graph/edge
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

## 📖 Documentation

- **[User Guide](docs/USER_GUIDE.md)** - Complete step-by-step usage instructions
- **[Architecture Documentation](docs/ARCHITECTURE.md)** - Technical architecture and implementation details
- **[API Reference](#api-reference)** - GraphQL API documentation

## 🚀 Quick Start

1. **Access the Application**
   - Navigate to the installed app in your XM Cloud instance
   - The application will automatically connect using your XM Cloud credentials

2. **Select Query Type**
   - **Item Query**: Query a specific item by path
   - **Search Query**: Search across multiple items with filters

3. **Build Your Query**
   - Use the schema explorer to browse available fields
   - Select templates from the filtered list
   - Add fields and configure arguments
   - Set up search conditions and pagination

4. **Preview and Execute**
   - View the generated GraphQL query
   - Execute the query to see results

For detailed instructions, see the [User Guide](docs/USER_GUIDE.md).

### Item Queries

Item queries allow you to fetch specific Sitecore items and their data:

1. **Select "item" as the root field**
2. **Enter the item path** (e.g., `/sitecore/content/Home`)
3. **Choose templates** from the alphabetically sorted list
4. **Select fields** you want to include in the query
5. **Configure arguments** like language, version, etc.

### Search Queries

Search queries provide powerful filtering and search capabilities:

1. **Select "search" as the root field**
2. **Configure search conditions**:
   - Add filters for specific fields
   - Set up ordering and sorting
   - Configure pagination (page size, cursor)
3. **Select result fields** to include in the response
4. **Set up template filtering** to narrow down results

### Template Management

The application includes intelligent template filtering:

- **Automatic Exclusion**: System templates are automatically excluded
- **Alphabetical Sorting**: Templates are sorted A-Z for easy navigation
- **Inheritance Support**: Base templates are included in the inheritance chain
- **Smart Matching**: Advanced matching algorithms for template names

## 🏗️ Architecture

### Component Structure

```
components/
├── MainApp.tsx              # Main application layout
├── QueryBuilder.tsx         # Query building orchestration
├── QueryPreview.tsx         # Query display and execution
├── SchemaExplorer.tsx       # Schema browsing interface
├── panels/                  # UI panels
│   ├── RootFieldList.tsx    # Root field selection
│   ├── ConnectionPanel.tsx  # Connection status display
│   └── VariablesEditor.tsx  # Variables management
├── search/
│   └── SearchBuilder.tsx    # Search query builder
└── tree/
    └── Tree.tsx            # Field selection tree
```

### Key Hooks

- `useConnection`: Manages GraphQL connection state
- `useQueryState`: Handles query building state
- `useMarketplaceClient`: XM Cloud integration

### Utility Functions

- `queryHelpers.ts`: Query generation utilities

## 🎨 Styling

The application uses a modern, clean design with:

- **SCSS Architecture**: Modular SCSS files for each component
- **Responsive Design**: Mobile-first approach with breakpoints for desktop, tablet, and mobile
- **CSS Grid**: Modern layout system that adapts to screen size
- **Consistent Theming**: Unified color scheme and typography
- **Mobile Optimized**: Stacked layout on smaller screens for better usability

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_XM_ENDPOINT` | Default XM Cloud GraphQL endpoint | No |

### Template Exclusion

The application automatically excludes these system templates:
- Advanced, Appearance, Help, Layout, Lifetime
- Indexing, Insert Options, Item Buckets, Publishing
- Security, Statistics, Tagging, Tasks, Validators
- Workflow, Version

## 🚀 Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Reference

### GraphQL Endpoints

The application connects to Sitecore XM Cloud GraphQL endpoints:

- **Schema Introspection**: `/sitecore/api/graph/edge`
- **Query Execution**: `/sitecore/api/graph/edge`

### Key GraphQL Operations

#### Item Query
```graphql
query GetItem($path: String!, $language: String!) {
  item(path: $path, language: $language) {
    # Selected fields
  }
}
```

#### Search Query
```graphql
query SearchItems($where: SearchInput, $first: Int, $after: String) {
  search(where: $where, first: $first, after: $after) {
    results {
      # Selected fields
    }
  }
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Verify your XM Cloud endpoint URL
   - Check your authentication token
   - Ensure network connectivity

2. **Schema Loading Issues**
   - Check if the GraphQL endpoint is accessible
   - Verify authentication credentials
   - Check browser console for errors

3. **Template Filtering Issues**
   - Ensure the item path is valid
   - Check if the item exists in Sitecore
   - Verify template inheritance

### Debug Mode

Enable debug logging by opening browser developer tools and checking the console for detailed logs.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Sitecore XM Cloud for the GraphQL API
- Next.js team for the excellent framework
- React community for the ecosystem
- All contributors and users

## 📞 Support

For support and questions:

- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

**Built with ❤️ for the Sitecore community**
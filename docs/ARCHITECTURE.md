# GraphQL Builder - Architecture Documentation

## Overview

The GraphQL Builder is a sophisticated React application built on Next.js designed as a **XM Cloud Marketplace application** that provides an interactive interface for building and executing GraphQL queries against Sitecore XM Cloud. The application leverages XM Cloud Marketplace authentication and is designed with a modular architecture that separates concerns and provides a maintainable codebase.

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Client                           │
├─────────────────────────────────────────────────────────────┤
│  Next.js Application (React + TypeScript)                  │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────┐  │
│  │   UI Components │ │  State Management│ │  API Layer   │  │
│  │                 │ │                 │ │              │  │
│  │ • QueryBuilder  │ │ • React Hooks   │ │ • GraphQL    │  │
│  │ • SchemaExplorer│ │ • Context API   │ │ • Fetch API  │  │
│  │ • QueryPreview  │ │ • Local Storage │ │ • Proxy API  │  │
│  └─────────────────┘ └─────────────────┘ └──────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Next.js API Routes                                        │
│  ┌─────────────────┐ ┌─────────────────┐                   │
│  │   /api/proxy    │ │   /api/schema   │                   │
│  │                 │ │                 │                   │
│  │ • GraphQL Proxy │ │ • Schema Cache  │                   │
│  │ • Auth Handling │ │ • Introspection │                   │
│  └─────────────────┘ └─────────────────┘                   │
├─────────────────────────────────────────────────────────────┤
│  Sitecore XM Cloud GraphQL API                             │
│  ┌─────────────────┐ ┌─────────────────┐                   │
│  │   Query Endpoint│ │  Schema Endpoint│                   │
│  │                 │ │                 │                   │
│  │ • Item Queries  │ │ • Introspection │                   │
│  │ • Search Queries│ │ • Type Info     │                   │
│  └─────────────────┘ └─────────────────┘                   │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### Component Hierarchy

```
MainApp
├── ConnectionPanel (inline)
├── QueryBuilder
│   ├── RootFieldList
│   ├── SearchBuilder (conditional)
│   └── SelectionPanel (Tree)
│       └── NodeFields
│           ├── Field Selection
│           ├── Template Filtering
│           └── Argument Configuration
└── QueryPreview
    ├── Query Display
    ├── Complexity Analysis
    └── Results Display
```

### Key Components

#### MainApp.tsx
- **Purpose**: Main application layout and orchestration
- **Responsibilities**:
  - Grid layout management
  - Global state coordination
  - Connection status display
- **Key Features**:
  - Responsive CSS Grid layout
  - Connection status integration
  - Panel width management

#### QueryBuilder.tsx
- **Purpose**: Central query building orchestration
- **Responsibilities**:
  - Root field selection coordination
  - Search builder integration
  - Template filtering logic
- **Key Features**:
  - Template inheritance handling
  - Standard template exclusion
  - Search condition management

#### Tree.tsx (SelectionPanel)
- **Purpose**: Field selection and template filtering
- **Responsibilities**:
  - Schema type rendering
  - Template matching algorithms
  - Field argument configuration
- **Key Features**:
  - Advanced template matching
  - Alphabetical sorting
  - Template exclusion filtering
  - Pagination support

#### SearchBuilder.tsx
- **Purpose**: Search query construction
- **Responsibilities**:
  - Search condition management
  - Pagination configuration
  - Ordering and sorting
- **Key Features**:
  - Dynamic condition builder
  - Cursor-based pagination
  - Flexible ordering options

## State Management

### State Architecture

```
Application State
├── Connection State (useConnection)
│   ├── endpoint: string
│   ├── token: string
│   ├── isConnected: boolean
│   └── connectionState: ConnectionState
├── Query State (useQueryState)
│   ├── rootFieldName: string
│   ├── rootArgs: Record<string, any>
│   ├── selection: Selection[]
│   ├── searchConds: SearchCondition[]
│   └── pagination: PaginationConfig
└── UI State (Component Local)
    ├── filter: string
    ├── page: number
    ├── showAllTemplates: boolean
    └── templateCache: Map<string, string[]>
```

### State Flow

1. **Connection Establishment**
   ```
   User Input → useConnection → API Test → State Update → UI Update
   ```

2. **Query Building**
   ```
   User Selection → useQueryState → Query Generation → Preview Update
   ```

3. **Template Filtering**
   ```
   Item Path → getItemTemplates → Template Matching → Filtered List
   ```

## Data Flow

### Query Building Flow

```
1. User selects root field (item/search)
   ↓
2. Root field selection triggers appropriate UI
   ↓
3. User provides arguments (path, language, etc.)
   ↓
4. Template filtering occurs (for item queries)
   ↓
5. User selects fields from schema
   ↓
6. Query generation happens in real-time
   ↓
7. Query preview updates automatically
   ↓
8. User can execute query and view results
```

### Template Filtering Flow

```
1. Item path provided
   ↓
2. GraphQL query to get item template info
   ↓
3. Extract template and baseTemplates
   ↓
4. Apply Standard Template exclusion
   ↓
5. Match templates against GraphQL schema
   ↓
6. Apply exclusion filters (system templates)
   ↓
7. Sort alphabetically
   ↓
8. Display filtered template list
```

## API Integration

### GraphQL Operations

#### Schema Introspection
```typescript
const introspectionQuery = `
  query IntrospectionQuery {
    __schema {
      types {
        name
        kind
        fields {
          name
          type {
            name
            kind
          }
        }
      }
    }
  }
`;
```

#### Item Template Query
```typescript
const itemTemplateQuery = `
  query GetItemTemplates($path: String!, $language: String!) {
    item(path: $path, language: $language) {
      template {
        name
        baseTemplates {
          name
        }
      }
    }
  }
`;
```

#### Search Query
```typescript
const searchQuery = `
  query SearchItems($where: SearchInput, $first: Int, $after: String) {
    search(where: $where, first: $first, after: $after) {
      results {
        # Dynamic field selection
      }
    }
  }
`;
```

### API Route Architecture

#### /api/proxy
- **Purpose**: Proxy GraphQL requests to XM Cloud
- **Features**:
  - Authentication handling
  - CORS management
  - Error handling
  - Request/response logging

#### /api/schema
- **Purpose**: Schema introspection and caching
- **Features**:
  - Schema caching
  - Introspection query execution
  - Type information processing

## Template Matching Algorithm

### Matching Strategies

The application uses a sophisticated multi-strategy approach for matching API templates to GraphQL schema types:

1. **Exact Match**: Direct name comparison
2. **Pretty Name Match**: Case-insensitive pretty name comparison
3. **Space Removal**: Remove spaces and compare
4. **Template Suffix**: Handle "Template" suffix variations
5. **Partial Matching**: Smart partial matching with length constraints

### Exclusion Logic

```typescript
const excludedTemplates = [
  'Advanced', 'Appearance', 'Help', 'Layout', 'Lifetime', 'Indexing',
  'Insert Options', 'Item Buckets', 'Publishing', 'Security', 'Statistics',
  'Tagging', 'Tasks', 'Validators', 'Workflow', 'Version'
];
```

### Standard Template Handling

The application automatically excludes "Standard Template" and its inherited templates:

1. Query for templates that inherit from "Standard Template"
2. Filter out the main "Standard Template"
3. Filter out all inherited templates
4. Apply additional exclusion filters

## Performance Optimizations

### Caching Strategy

1. **Template Cache**: Caches template information per item path
2. **Schema Cache**: Caches GraphQL schema information
3. **Standard Template Cache**: Caches inherited template information

### Rendering Optimizations

1. **Memoization**: React.memo for expensive components
2. **Virtual Scrolling**: For large template lists
3. **Debounced Updates**: For search and filtering
4. **Lazy Loading**: For schema exploration

### Query Optimizations

1. **Complexity Analysis**: Real-time complexity calculation
2. **Field Selection**: Only select necessary fields
3. **Pagination**: Cursor-based pagination for large result sets
4. **Caching**: Intelligent caching of query results

## Security Considerations

### Authentication

- XM Cloud Marketplace token integration
- Automatic authentication via XM Cloud platform
- No manual credential management required
- Secure token handling by XM Cloud

### Data Protection

- No sensitive data in client-side logs
- Secure API proxy implementation
- Input validation and sanitization

### CORS Handling

- Proper CORS headers in API routes
- Secure cross-origin request handling
- Origin validation

## Error Handling

### Error Types

1. **Connection Errors**: Network and authentication issues
2. **Schema Errors**: GraphQL schema introspection failures
3. **Query Errors**: Malformed or invalid queries
4. **Template Errors**: Template matching and filtering issues

### Error Recovery

1. **Automatic Retry**: For transient network errors
2. **Fallback UI**: Graceful degradation for errors
3. **User Feedback**: Clear error messages and suggestions
4. **Logging**: Comprehensive error logging for debugging

## Testing Strategy

### Unit Testing

- Component testing with React Testing Library
- Hook testing with custom test utilities
- Utility function testing

### Integration Testing

- API route testing
- GraphQL query testing
- End-to-end user flow testing

### Performance Testing

- Load testing for large schemas
- Memory usage monitoring
- Query performance analysis

## Deployment Architecture

### Development

```bash
npm run dev
# Hot reloading, development server
```

### Production

```bash
npm run build
npm start
# Optimized production build
```

### Docker

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

## Monitoring and Analytics

### Performance Monitoring

- Query execution time tracking
- Schema loading performance
- User interaction analytics

### Error Tracking

- Client-side error reporting
- API error monitoring
- User experience metrics

## Future Enhancements

### Planned Features

1. **Query History**: Save and manage query history
2. **Query Sharing**: Share queries with team members
3. **Advanced Filtering**: More sophisticated filtering options
4. **Query Optimization**: Automatic query optimization suggestions
5. **Multi-Environment**: Support for multiple XM Cloud environments

### Technical Improvements

1. **GraphQL Subscriptions**: Real-time data updates
2. **Offline Support**: Offline query building
3. **Mobile App**: Native mobile application
4. **Plugin System**: Extensible plugin architecture
5. **Advanced Analytics**: Detailed usage analytics

---

This architecture documentation provides a comprehensive overview of the GraphQL Builder application's design, implementation, and future direction.

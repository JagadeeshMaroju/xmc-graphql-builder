# GraphQL Builder - User Guide

## Table of Contents

1. [Running the Application](#running-the-application)
2. [Getting Started](#getting-started)
3. [Building Item Queries](#building-item-queries)
4. [Building Search Queries](#building-search-queries)
5. [Building Layout Queries](#building-layout-queries)
6. [Building Site Queries](#building-site-queries)
7. [Understanding Templates](#understanding-templates)
8. [Query Preview and Execution](#query-preview-and-execution)

## Running the Application

You can run the GraphQL Builder in two ways:

### Run the App

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd xmc-graphql-builder
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Open in Browser**
   Navigate to `http://localhost:3000`






## Getting Started





### First Time Setup

1. **Access the Application**
   - This app is configured to run as a standalone app in XM Cloud
   - Open XM Cloud environment where this app is installed
   - Open the application from the marketplace app icon

2. **Understand the Interface**
   - **Left Panel**: Schema Explorer - Browse available GraphQL types and fields
   - **Middle Panel**: Query Builder - Build your queries interactively
   - **Right Panel**: Query Preview - View generated queries and results

3. **Automatic Connection**
   - The application automatically connects to your XM Cloud instance
   - The schema will load automatically in the left panel



4. **Connection Status**
   - The connection status is displayed in the interface


## Building Item Queries

Item queries allow you to fetch specific Sitecore items and their data.

### Step 1: Select Query Type

1. In the middle panel, you'll see "Root Fields"
2. Select "item" as your root field type
3. The interface will update to show item-specific options

### Step 2: Provide Item Path

1. **Enter Item Path**
   - In the "item Arguments" section, enter the path to your item
   - Example: `/sitecore/content/Home/Products/Product1`
   - The path should start with `/sitecore/content/`

2. **Set Language** (Optional)
   - Default is "en" (English)
   - You can change this to any valid language code
   - Example: "es" for Spanish, "fr" for French

### Step 3: Select Templates

1. **Template List Appears**
   - After entering a valid path, templates will load automatically
   - Templates are filtered to show only relevant ones for your item
   - Template filter can be turned off to load all the templates. 
   - System templates are automatically excluded

2. **Choose Templates**
   - Select the templates you want to include in your query
   - Templates are sorted alphabetically for easy navigation
   - You can select multiple templates

3. **Template Information**
   - Each template shows its name and inheritance information
   - Base templates are automatically included in the inheritance chain

### Step 4: Select Fields

1. **Browse Available Fields**
   - Use the schema explorer (left panel) to browse available fields
   - Fields are organized by type and template

2. **Add Fields to Query**
   - Click on fields to add them to your selection
   - Fields will appear in the query preview (right panel)
   - You can add fields from multiple templates

3. **Configure Field Arguments**
   - Some fields accept arguments (like language, version, etc.)
   - Configure these arguments as needed

### Step 5: Preview and Execute

1. **View Generated Query**
   - The query preview (right panel) shows your generated GraphQL query
   - The query is properly formatted and ready to execute

2. **Execute Query**
   - Click "Execute Query" to run the query
   - Results will appear in the results section
   - You can copy the query for use in other tools

## Building Search Queries

Search queries provide powerful filtering and search capabilities across multiple items.

### Step 1: Select Query Type

1. In the middle panel, select "search" as your root field type
2. The interface will update to show search-specific options

### Step 2: Configure Search Conditions

1. **Add Search Filters**
   - Click "Add Condition" to add search filters
   - Select the field to filter on
   - Choose the operator (equals, contains, greater than, etc.)
   - Enter the value to filter by

2. **Combine Conditions**
   - Use AND/OR logic to combine multiple conditions
   - Create complex search criteria

3. **Common Search Examples**
   - Find all items with a specific template: `_templates equals "Product"`
   - Find items containing text: `title contains "product"`
   - Find items by date range: `createdDate greater than "2023-01-01"`

### Step 3: Set Up Ordering and Pagination

1. **Configure Ordering**
   - Select the field to sort by
   - Choose ascending or descending order
   - You can add multiple sort criteria

2. **Set Pagination**
   - Set the page size (number of results per page)
   - Use cursor-based pagination for large result sets
   - Navigate through pages of results

### Step 4: Select Result Fields

1. **Choose Fields to Return**
   - Select which fields to include in the search results
   - You can select fields from any template
   - Common fields include: `name`, `path`, `template`, `createdDate`

2. **Template Filtering**
   - Optionally filter results by specific templates
   - This helps narrow down the search results

### Step 5: Execute Search

1. **Preview Search Query**
   - Review the generated search query
   - Ensure all required fields and filters are included

2. **Run Search**
   - Execute the search to see results
   - Results will show matching items with selected fields
   - Use pagination to browse through results

## Building Layout Queries

Layout queries allow you to fetch layout data for specific pages or items in Sitecore.

### Step 1: Select Query Type

1. In the middle panel, select "layout" as your root field type
2. The interface will update to show layout-specific options

### Step 2: Provide Layout Parameters

1. **Enter Item Path**
   - In the "layout Arguments" section, enter the path to your item
   - Example: `/sitecore/content/Home/Products/Product1`
   - The path should start with `/sitecore/content/`

2. **Set Language** (Optional)
   - Default is "en" (English)
   - You can change this to any valid language code
   - Example: "es" for Spanish, "fr" for French

3. **Set Site** 
   - Specify the site name.

### Step 3: Select Layout Fields

1. **Browse Available Fields**
   - Use the schema explorer (left panel) to browse available layout fields
   - Common fields include: `item`, `rendered`, `placeholders`

2. **Add Fields to Query**
   - Click on fields to add them to your selection
   - Fields will appear in the query preview (right panel)
   - You can add nested fields for detailed layout information

### Step 4: Preview and Execute

1. **View Generated Query**
   - The query preview (right panel) shows your generated GraphQL query
   - The query is properly formatted and ready to execute

2. **Execute Query**
   - Click "Execute Query" to run the query
   - Results will appear in the results section
   - You can copy the query for use in other tools

## Building Site Queries

Site queries allow you to fetch site information and configuration data from Sitecore.

### Step 1: Select Query Type

1. In the middle panel, select "site" as your root field type
2. The interface will update to show site-specific options

### Step 2: Provide Site Parameters

1. **Enter Site Name**
   - In the "site Arguments" section, enter the site name
   - This should match your Sitecore site configuration


### Step 3: Select Site Fields

1. **Browse Available Fields**
   - Use the schema explorer (left panel) to browse available site fields
   - Common fields include: `name`, `language`, `hostName`, `startItem`

2. **Add Fields to Query**
   - Click on fields to add them to your selection
   - Fields will appear in the query preview (right panel)
   - You can add nested fields for detailed site information

### Step 4: Preview and Execute

1. **View Generated Query**
   - The query preview (right panel) shows your generated GraphQL query
   - The query is properly formatted and ready to execute

2. **Execute Query**
   - Click "Execute Query" to run the query
   - Results will appear in the results section
   - You can copy the query for use in other tools

## Understanding Templates



### Template Filtering

The application automatically filters templates to show only relevant ones:

1. **Relevant Templates Only**
   - Only templates that are actually used by your item are shown
   - This prevents confusion and reduces clutter

2. **Inheritance Chain**
   - Base templates are automatically included
   - You can see the full inheritance hierarchy

3. **System Template Exclusion**
   - System templates are automatically excluded
   - These include: Advanced, Appearance, Help, Layout, etc.




## Query Preview and Execution

### Understanding the Query Preview

The query preview panel shows:

1. **Generated GraphQL Query**
   - The complete GraphQL query that will be executed
   - Properly formatted and indented
   - Includes all selected fields and arguments

2. **Variables**
   - Query variables and their values
   - Can be modified before execution

### Executing Queries

1. **Execute Button**
   - Click "Execute Query" to run the query
   - The query will be sent to your XM Cloud instance

2. **Viewing Results**
   - Results appear in the results section
   - JSON format for easy reading
   - Expandable/collapsible for large results



### Copying Queries

1. **Copy to Clipboard**
   - Use the copy button to copy the query
   - Paste into other GraphQL tools or applications














---


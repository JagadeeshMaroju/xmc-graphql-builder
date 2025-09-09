# GraphQL Builder - User Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Connecting to Sitecore XM Cloud](#connecting-to-sitecore-xm-cloud)
3. [Building Item Queries](#building-item-queries)
4. [Building Search Queries](#building-search-queries)
5. [Understanding Templates](#understanding-templates)
6. [Query Preview and Execution](#query-preview-and-execution)
7. [Advanced Features](#advanced-features)
8. [Troubleshooting](#troubleshooting)

## Getting Started

### First Time Setup

1. **Access the Application**
   - Navigate to the XM GraphQL Builder in your XM Cloud instance
   - The application will automatically authenticate using your XM Cloud credentials

2. **Understand the Interface**
   - **Left Panel**: Schema Explorer - Browse available GraphQL types and fields
   - **Middle Panel**: Query Builder - Build your queries interactively
   - **Right Panel**: Query Preview - View generated queries and results

3. **Automatic Connection**
   - The application automatically connects to your XM Cloud instance
   - No manual credential entry required
   - The schema will load automatically in the left panel

## XM Cloud Marketplace Integration

### Automatic Authentication

The XM GraphQL Builder is designed as a Marketplace application and provides seamless authentication:

1. **No Manual Setup Required**
   - The application automatically uses your XM Cloud credentials
   - Authentication is handled by the XM Cloud Marketplace platform
   - No need to enter endpoints or tokens manually

2. **Secure Token Management**
   - Tokens are managed securely by XM Cloud
   - No sensitive data is stored in the browser
   - Automatic token refresh when needed

3. **Instant Access**
   - The application connects immediately upon loading
   - The GraphQL schema loads automatically
   - Ready to use without any configuration

4. **Connection Status**
   - The connection status is displayed in the interface
   - Authentication is handled automatically by XM Cloud Marketplace

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
   - You can see the query complexity and estimated cost

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
   - Check the query complexity

2. **Run Search**
   - Execute the search to see results
   - Results will show matching items with selected fields
   - Use pagination to browse through results

## Understanding Templates

### What are Templates?

Templates in Sitecore define the structure and fields available for content items. The GraphQL Builder helps you work with templates effectively.

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

### Template Matching

The application uses sophisticated algorithms to match templates:

1. **Exact Matching**
   - Direct name matches are preferred
   - Case-insensitive comparison

2. **Pretty Name Matching**
   - Matches human-readable template names
   - Handles spaces and special characters

3. **Partial Matching**
   - Smart partial matching for complex names
   - Length-based validation to prevent false matches

## Query Preview and Execution

### Understanding the Query Preview

The query preview panel shows:

1. **Generated GraphQL Query**
   - The complete GraphQL query that will be executed
   - Properly formatted and indented
   - Includes all selected fields and arguments

2. **Query Complexity**
   - Real-time complexity calculation
   - Helps optimize query performance
   - Shows estimated cost

3. **Variables**
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

3. **Error Handling**
   - Errors are displayed clearly
   - Common issues and solutions are provided
   - Check the console for detailed error information

### Copying Queries

1. **Copy to Clipboard**
   - Use the copy button to copy the query
   - Paste into other GraphQL tools or applications

2. **Export Options**
   - Save queries for later use
   - Share queries with team members

## Advanced Features

### Query Complexity Analysis

The application provides real-time complexity analysis:

1. **Complexity Score**
   - Shows the estimated complexity of your query
   - Helps identify performance issues

2. **Optimization Suggestions**
   - Recommendations for reducing complexity
   - Tips for better query performance

### Template Inheritance

Understanding template inheritance:

1. **Base Templates**
   - Templates that other templates inherit from
   - Automatically included in the inheritance chain

2. **Inherited Fields**
   - Fields from base templates are available
   - No need to explicitly select base templates

### Search Optimization

For better search performance:

1. **Use Specific Filters**
   - More specific filters reduce result sets
   - Improves query performance

2. **Limit Result Fields**
   - Only select necessary fields
   - Reduces data transfer and processing time

3. **Use Pagination**
   - Large result sets should be paginated
   - Improves user experience

## Troubleshooting

### Common Issues

#### Connection Problems

**Issue**: Cannot connect to XM Cloud
**Solutions**:
- Verify your endpoint URL is correct
- Check your authentication token
- Ensure network connectivity
- Check if XM Cloud instance is running

#### Schema Loading Issues

**Issue**: Schema doesn't load
**Solutions**:
- Verify connection is established
- Check authentication token validity
- Refresh the page and try again
- Check browser console for errors

#### Template Filtering Issues

**Issue**: Templates don't appear or are incorrect
**Solutions**:
- Verify the item path is valid
- Check if the item exists in Sitecore
- Ensure the item has the expected templates
- Try refreshing the template list

#### Query Execution Errors

**Issue**: Query fails to execute
**Solutions**:
- Check the generated query syntax
- Verify all required fields are selected
- Check field argument values
- Review error messages for specific issues

### Getting Help

1. **Browser Console**
   - Open developer tools (F12)
   - Check the console for error messages
   - Look for detailed error information

2. **Error Messages**
   - Read error messages carefully
   - They often contain specific solutions
   - Common errors have helpful suggestions

3. **Documentation**
   - Refer to this user guide
   - Check the architecture documentation
   - Review the API documentation

### Performance Tips

1. **Optimize Queries**
   - Use specific filters to reduce result sets
   - Select only necessary fields
   - Use pagination for large results

2. **Template Selection**
   - Select only relevant templates
   - Avoid selecting too many base templates
   - Use template filtering effectively

3. **Browser Performance**
   - Close unnecessary browser tabs
   - Clear browser cache if needed
   - Use a modern browser with good performance

---

This user guide provides comprehensive instructions for using the GraphQL Builder application effectively. For technical details, refer to the architecture documentation.

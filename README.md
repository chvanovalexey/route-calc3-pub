# Sea Route Visualization Project

An interactive web application for visualizing maritime routes between ports using OpenStreetMap and Leaflet.js. The application calculates optimal sea paths while considering geographical constraints and visualizes both past and future route segments.

## Features

- **Interactive Map Interface**: Built with Leaflet.js and OpenStreetMap
- **Route Visualization**:
  - Past routes (solid lines)
  - Future routes (dashed lines)
  - Color-coded routes for easy distinction
  - Port markers with custom icons
  - Current position markers (⚓)
- **Route Management**:
  - Load routes from CSV file
  - Batch route updates
  - Individual route toggling
  - Route list with scrollable interface
- **Performance Optimization**:
  - Route caching
  - Batch processing
  - Memory management
  - Execution time tracking
- **API Environment Selection**:
  - Toggle between local and production APIs
  - Visual feedback during route calculations

## Technical Details

### Dependencies

- Leaflet.js for map rendering
- OpenStreetMap for base layer tiles
- Custom path-finding algorithm for route calculation
- CSV parsing for route data

### Route Calculation

The application uses a sophisticated path-finding algorithm that:
- Handles 180th meridian crossing
- Supports route segments through Bab-el-Mandab strait
- Provides smooth path interpolation
- Calculates optimal maritime routes considering geographical constraints

### Performance Features

- Route calculation timing metrics
- Memory usage optimization
- Batch processing for multiple routes
- Efficient route layer management

## Usage

1. **Initial Setup**:
   ```html
   <!-- Include in your HTML -->
   <div id="map"></div>
   <div class="route-selector">
     <div id="routeList"></div>
   </div>
   ```

2. **Route Data Format**:
   ```csv
   fromCountry;fromPort;fromLat;fromLng;toCountry;toPort;toLat;toLng
   ```

3. **API Configuration**:
   ```javascript
   const API_URLS = {
       local: 'http://localhost:5001/bollo-tracker/europe-west1/seaRoute',
       production: 'https://searoute-4agq4fs52q-ew.a.run.app'
   };
   ```

## Styling

The application includes a comprehensive CSS framework for:
- Route list styling
- Map controls
- Port markers
- Route lines
- Interactive elements
- Responsive design elements

## Performance Considerations

- Route calculations are performed server-side
- Client-side rendering is optimized for large datasets
- Memory management for route layers
- Efficient handling of multiple simultaneous routes

## Browser Support

The application supports modern browsers with:
- CSS Grid
- Flexbox
- CSS Custom Properties
- Modern JavaScript features

## Development

To run the project locally:

1. Clone the repository
2. Install dependencies
3. Configure API endpoints
4. Run local server
5. Load test_route.csv with route data

## Contributing

Contributions are welcome! Please ensure that your code follows the existing style and includes appropriate tests.


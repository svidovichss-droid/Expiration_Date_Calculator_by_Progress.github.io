# Overview

This is a **Progressive Web Application (PWA)** for calculating product expiration dates for AO "Progress" company. The application allows users to search for products by code or name, input production dates, and calculate shelf-life expiration dates. It's designed to work offline using Service Workers and local caching, making it reliable even without internet connectivity.

The application is built as a static web application with no backend server requirements, featuring a Russian language interface for calculating shelf life ("срок годности") of various food products, primarily from the "ФрутоНяня" brand.

# Recent Changes

**Version 2.5 (October 10, 2025)**
- ✅ Fixed JSON data files - removed excessive quote escaping and corrected text truncations
- ✅ Cleaned 2175 product records from encoding issues
- ✅ Fixed merged words in manufacturer names (e.g., "городскоймолочный" → "городской молочный")
- ✅ Updated data source from remote GitHub to local files for better offline support
- ✅ All files verified and working correctly
- ✅ Service Worker properly configured for PWA functionality
- 📝 Added comprehensive documentation (README.md, CHANGELOG.md)

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture

**Technology Stack:**
- Pure HTML5, CSS3, and vanilla JavaScript (ES6+)
- Tailwind CSS via CDN for styling
- Font Awesome via CDN for icons
- No build process or bundler required

**Design Pattern:**
- Single Page Application (SPA) architecture
- Event-driven JavaScript with global state management
- DOM manipulation through direct element references
- Responsive design using Flexbox and CSS custom properties (CSS variables)

**Key Architectural Decisions:**
1. **Static Site Design** - Chosen for simplicity and ease of deployment without server infrastructure
2. **Vanilla JavaScript** - No framework dependencies to minimize bundle size and maximize performance
3. **CDN Dependencies** - External resources loaded from CDNs with fallback mechanisms
4. **CSS Variables** - Theming system using CSS custom properties for consistent design

## Offline-First Architecture

**Service Worker Strategy:**
- Cache-first approach with network fallback
- Version-based cache management (`progress-calculator-v2.5`)
- Automatic cache invalidation on version updates
- Caches both local assets and external CDN resources

**Data Persistence:**
1. **LocalStorage Caching** - Product data stored locally with configurable TTL (24 hours)
2. **ETag Support** - Conditional requests to minimize data transfer
3. **Fallback Data** - Embedded test data when network and cache are unavailable
4. **Multi-layer Data Strategy:**
   - Primary: Fetch from remote JSON
   - Secondary: LocalStorage cache
   - Tertiary: Embedded fallback data

**Rationale:**
- Ensures application functionality even without internet
- Reduces server load through aggressive caching
- Provides instant loading after first visit
- Critical for industrial environments with unreliable connectivity

## Data Management

**Product Database:**
- JSON-based product catalog (`data.json`)
- Fields include: product code, Russian name, shelf life (days), packaging info, barcode, manufacturer, standard status
- Searchable by product code or name
- In-memory object structure for fast lookups

**State Management:**
- Global variables for application state (`products`, `isOnline`, `warningMessageAdded`)
- No state management library - direct variable manipulation
- DOM reflects state changes immediately

**Search Implementation:**
- Real-time filtering as user types
- Case-insensitive substring matching
- Searches across product codes and Russian names
- Results displayed in dropdown interface

## PWA Implementation

**Manifest Configuration:**
- Standalone display mode for app-like experience
- Portrait orientation lock
- Custom theme colors matching brand identity
- SVG-based icons in multiple sizes (64x64 to 512x512)
- Russian language locale

**Installation Features:**
- Installable on mobile devices (iOS/Android)
- Desktop PWA support
- Custom app name and icons
- Splash screen configuration

**Rationale:**
- Native app-like experience without app store deployment
- Offline access through installed PWA
- Reduced friction for user adoption

## Calculation Logic

**Date Calculation:**
- Production date input validation
- Shelf life in days from product database
- Expiration date = Production date + Shelf life days
- Formatted output in Russian locale (DD.MM.YYYY)

**Product Status Handling:**
- Visual warnings for products with "ВЫВОДИТСЯ" (being phased out) status
- Color-coded status indicators
- User notifications for product lifecycle status

# External Dependencies

## CDN Resources

1. **Tailwind CSS** (`https://cdn.tailwindcss.com`)
   - Utility-first CSS framework
   - Loaded dynamically via script tag
   - Used for responsive layout and component styling

2. **Font Awesome 6.4.0** (`https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css`)
   - Icon library
   - Used for UI icons (calculator, search, status indicators)

## Data Sources

1. **Product Database** (`data.json`)
   - Local JSON file containing product catalog
   - Can be updated by replacing the file
   - Structure: Array of product objects with Russian language fields

2. **Fallback Data** (`fallback.json`)
   - Backup product data for offline scenarios
   - Embedded in JavaScript as constant
   - Contains minimal test products

## Browser APIs

1. **Service Worker API**
   - Offline functionality
   - Asset caching
   - Background sync capabilities

2. **LocalStorage API**
   - Product data caching
   - ETag storage for conditional requests
   - Timestamp tracking for cache expiry

3. **Fetch API**
   - Network requests for product data
   - ETag-based conditional fetching
   - Error handling with fallbacks

4. **Web App Manifest**
   - PWA installation
   - App metadata
   - Icon definitions

## No Backend Dependencies

- Pure client-side application
- No server-side processing required
- Can be hosted on any static file server (GitHub Pages, Netlify, etc.)
- No database server needed
- No authentication/authorization system
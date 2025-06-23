# PWA Debug Guide

## Overview

This guide covers the comprehensive PWA debugging capabilities added to the ShoeFit application's `/debug` route. The PWA debugging section provides real-time diagnostics, testing tools, and recommendations for Progressive Web App development.

## Features

### 1. PWA Status Overview
- **Service Worker Status**: Real-time registration status, scope, and states
- **Installation Status**: PWA installability and current installation state
- **Manifest Validation**: Web App Manifest availability and validation
- **Cache API Support**: Cache availability and active caches count
- **Feature Detection**: Comprehensive PWA feature support detection

### 2. Detailed PWA Information

#### Service Worker Details
- Registration status (registered, not-registered, error)
- Scope and update time
- Installation states (installing, waiting, active)
- Communication capabilities

#### Installation & Platform
- Install prompt availability
- Current installation status
- Platform detection (iOS, Android, Desktop)
- User agent analysis

#### Cache Information
- Cache API support
- Active cache names and counts
- Cache size estimation
- Cache performance metrics

#### Features & Permissions
- Notification permission status
- Background Sync support
- Background Fetch capabilities
- Storage quota usage and limits

### 3. PWA Actions & Testing

#### Service Worker Management
- **Update Service Worker**: Manually trigger SW updates
- **Test Service Worker**: Verify SW communication and status
- **Skip Waiting**: Force SW activation
- **Ping Service Worker**: Test SW messaging

#### Cache Management
- **Clear All Caches**: Remove all cached resources
- **Analyze Caches**: Detailed cache inspection
- **Cache Performance Test**: Measure cache hit rates

#### Installation Testing
- **Test Install Prompt**: Trigger PWA installation dialog
- **Install Prompt Detection**: Automatic prompt detection
- **Installation Event Tracking**: Monitor install/uninstall events

### 4. Performance & Offline Testing

#### Network Status
- Online/offline detection
- Connection type and speed
- Network quality assessment

#### Cache Performance
- **Manifest Load Time**: Test manifest fetch performance
- **Page Cache Performance**: Measure page load from cache
- **Resource Load Testing**: Test critical resource caching

#### Offline Simulation
- **Simulate Offline Mode**: Guide for offline testing
- **Offline Readiness Test**: Check cached resources availability
- **Offline Functionality Validation**: Verify app works offline

### 5. PWA Quality Checklist

Real-time validation of PWA requirements:
- ✅ Web App Manifest
- ✅ Service Worker Registration
- ✅ HTTPS/Localhost
- ✅ PWA Installability
- ✅ Offline Functionality
- ✅ App Icons

### 6. Lighthouse Integration & Recommendations

#### Lighthouse Testing
- Direct link to Google PageSpeed Insights
- PWA audit automation
- Performance scoring

#### PWA Score Estimation
Real-time scoring based on:
- Manifest (20 points)
- Service Worker (30 points)
- HTTPS (15 points)
- Installability (20 points)
- Offline Ready (15 points)

#### Improvement Recommendations
Actionable suggestions for:
- Missing manifest configuration
- Service worker implementation
- HTTPS configuration
- Caching strategies
- Notification setup
- Icon optimization

## Getting Started

### 1. Access PWA Debug Tools
Navigate to `/debug` in your application and scroll to the "PWA Status" section.

### 2. Initial PWA Health Check
1. Check the PWA Status Overview cards
2. Review the PWA Quality Checklist
3. Note any red/yellow status indicators
4. Check the estimated PWA score

### 3. Service Worker Debugging
```javascript
// The debug page automatically detects and logs:
// - Service Worker registration
// - SW state changes
// - SW update events
// - SW communication
```

### 4. Test PWA Installation
1. Click "Test Install Prompt" to trigger installation
2. Monitor install prompt status
3. Check installation events in debug logs

### 5. Offline Testing
1. Use browser DevTools to simulate offline
2. Click "Test Offline Readiness" to check cached resources
3. Verify app functionality while offline

### 6. Performance Testing
1. Run "Test Manifest Load Time" for manifest performance
2. Test "Page Cache Performance" for caching effectiveness
3. Monitor cache hit rates and load times

## Common Issues & Solutions

### Service Worker Not Registering
**Problem**: Service Worker status shows "not-registered"
**Solutions**:
- Check HTTPS/localhost requirement
- Verify service worker file exists
- Check browser console for registration errors
- Ensure PWA plugin is properly configured

### PWA Not Installable
**Problem**: Install prompt not available
**Solutions**:
- Verify manifest.json is valid and accessible
- Check minimum icon requirements (192x192, 512x512)
- Ensure start_url is accessible
- Verify display mode is set to "standalone"
- Check HTTPS requirement

### Caching Issues
**Problem**: Resources not caching properly
**Solutions**:
- Check service worker caching strategy
- Verify cache names and patterns
- Test cache storage limits
- Check network-first vs cache-first strategies

### Offline Functionality
**Problem**: App doesn't work offline
**Solutions**:
- Verify critical resources are cached
- Check offline fallback pages
- Test offline navigation
- Implement proper offline UI feedback

## Advanced Debugging

### Service Worker Communication
```javascript
// Send messages to service worker
navigator.serviceWorker.controller.postMessage({
  type: 'CUSTOM_ACTION',
  data: { /* your data */ }
});

// Listen for service worker messages
navigator.serviceWorker.addEventListener('message', (event) => {
  console.log('SW Message:', event.data);
});
```

### Cache Inspection
```javascript
// List all caches
caches.keys().then(cacheNames => {
  console.log('Available caches:', cacheNames);
});

// Inspect specific cache
caches.open('cache-name').then(cache => {
  cache.keys().then(requests => {
    console.log('Cached requests:', requests);
  });
});
```

### PWA Install Events
```javascript
// Listen for install prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  // Store the event for later use
  window.deferredPrompt = e;
});

// Listen for successful installation
window.addEventListener('appinstalled', () => {
  console.log('PWA was installed');
});
```

## Testing Tools Integration

### External Tools
- **Google Lighthouse**: Comprehensive PWA auditing
- **web.dev Measure**: Quick PWA assessment
- **WebPageTest**: Performance and PWA testing
- **PWA Builder**: Microsoft's PWA development tools

### Browser DevTools
- **Application Tab**: Service Workers, Storage, Manifest
- **Network Tab**: Cache behavior, offline simulation
- **Lighthouse Tab**: Built-in PWA auditing
- **Console**: Service Worker logs and errors

## Best Practices

### 1. Regular PWA Health Checks
- Monitor PWA score regularly
- Check service worker status
- Verify cache performance
- Test offline functionality

### 2. Progressive Enhancement
- Ensure core functionality works without PWA features
- Implement graceful fallbacks
- Test across different browsers and devices

### 3. Performance Monitoring
- Monitor cache hit rates
- Track installation success rates
- Measure offline usage patterns
- Optimize critical resource caching

### 4. User Experience
- Provide clear install prompts
- Implement offline indicators
- Cache critical user data
- Test installation flow regularly

## Troubleshooting

### Debug Logs
The debug page provides comprehensive logging for:
- PWA feature detection
- Service worker events
- Cache operations
- Installation attempts
- Network status changes

### Browser Compatibility
- Test across different browsers
- Check feature support matrices
- Implement feature detection
- Provide fallbacks for unsupported features

### Development vs Production
- Test in both environments
- Verify HTTPS in production
- Check manifest URLs
- Test with real network conditions

## Resources

- [PWA Developer Guide](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [PWA Checklist](https://web.dev/pwa-checklist/)

## Contributing

To enhance the PWA debugging capabilities:

1. Add new diagnostic tests to the debug page
2. Implement additional PWA feature detection
3. Create automated PWA testing scripts
4. Improve error reporting and suggestions
5. Add more performance benchmarks

The PWA debugging system is designed to be extensible and can be enhanced with additional testing capabilities as needed.
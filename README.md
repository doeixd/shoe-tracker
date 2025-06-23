# ShoeFit - Running Shoe Tracker

A modern, PWA-enabled running shoe tracking application built with React 19, TanStack Start, and the React Compiler RC. Track your running shoes, log your runs, and gain insights into your running performance with comprehensive analytics.

## ✨ Features

### 🏃 Core Functionality
- **Shoe Management**: Add, edit, and track multiple pairs of running shoes
- **Run Logging**: Record runs with distance, duration, pace, and notes
- **Mileage Tracking**: Automatic mileage accumulation per shoe
- **Collections**: Organize shoes into custom collections
- **Analytics**: Comprehensive insights and performance tracking

### 🚀 Modern Tech Stack
- **React 19** with latest features and performance improvements
- **React Compiler RC** for automatic memoization and optimizations
- **TanStack Start** for full-stack React framework
- **TypeScript** for type safety
- **Convex** for real-time backend and database
- **Tailwind CSS** for styling
- **Motion** for smooth animations

### 📱 Progressive Web App (PWA)
- **Offline Support**: Works without internet connection
- **Install Prompt**: Add to home screen on mobile devices
- **iOS Enhancements**: Native-like experience on iOS
- **Push Notifications**: Stay updated with your running goals
- **Background Sync**: Sync data when connection is restored

### 🎨 User Experience
- **Mobile-First Design**: Optimized for mobile usage
- **Dark Mode Support**: Automatic theme switching
- **Responsive Layout**: Works on all screen sizes
- **First-Visit Animations**: Engaging onboarding experience
- **Loading States**: Smooth loading experiences

## 🛠️ Installation

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Git

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shoes-final
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Add your Convex deployment URL and other required environment variables.

4. **Set up Convex backend**
   ```bash
   npx convex dev
   ```

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to `http://localhost:3000`

## 🚀 Development

### Scripts

- `pnpm dev` - Start development server with Convex
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm pwa:check` - Run PWA audit
- `pnpm audit:animations` - Audit animation performance

### Project Structure

```
src/
├── components/          # React components
│   ├── analytics/      # Analytics dashboards
│   ├── loading/        # Loading states
│   ├── navigation/     # Navigation components
│   └── ui/            # UI components
├── hooks/              # Custom React hooks
├── routes/             # TanStack Router routes
├── services/           # API and service layers
├── styles/             # Global styles
├── types/              # TypeScript type definitions
└── utils/              # Utility functions

convex/                 # Convex backend
├── schema.ts          # Database schema
├── shoes.ts           # Shoe-related functions
└── auth.ts            # Authentication logic
```

## 🔧 Configuration

### React Compiler RC

The project uses React Compiler RC for automatic optimizations:

```typescript
// vite.config.ts
react({
  babel: {
    plugins: [["babel-plugin-react-compiler", {}]],
  },
})
```

### PWA Configuration

PWA features are configured in `vite.config.ts` with VitePWA:

```typescript
VitePWA({
  registerType: "autoUpdate",
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
    // ... more config
  }
})
```

## 📱 PWA Features

### Installation
The app can be installed on mobile devices and desktops:
- Mobile: "Add to Home Screen" prompt
- Desktop: Install button in browser

### Offline Support
- Cached resources for offline usage
- Background sync when connection returns
- Offline indicator in UI

### iOS Enhancements
- Status bar styling
- Safe area handling
- Native-like interactions
- Haptic feedback

## 🎯 Usage

### Adding Shoes
1. Navigate to "Shoes" tab
2. Click "Add New Shoe"
3. Fill in shoe details (brand, model, purchase date, etc.)
4. Optionally add to a collection
5. Save to start tracking

### Logging Runs
1. Go to "Runs" tab
2. Click "Log New Run"
3. Select the shoes used
4. Enter run details (distance, time, etc.)
5. Add notes if desired
6. Save to update shoe mileage

### Viewing Analytics
1. Access "Analytics" tab
2. View running statistics
3. See shoe performance data
4. Track progress over time

## 🔒 Authentication

The app uses Convex Auth for authentication:
- Email/password sign-up and sign-in
- Secure session management
- Protected routes
- User data isolation

## 🚀 Deployment

### Build for Production
```bash
pnpm build
```

### Deploy to Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Deploy to Netlify
1. Build the project: `pnpm build`
2. Deploy the `.output/public` directory
3. Configure environment variables

## 🧪 Testing

### PWA Testing
```bash
pnpm pwa:check
```

### Animation Performance
```bash
pnpm audit:animations
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use React Compiler-friendly patterns
- Write mobile-first responsive code
- Include appropriate loading states
- Test PWA functionality

## 📊 Performance

### React Compiler Benefits
- Automatic memoization reduces re-renders
- Improved component performance
- Better memory usage
- Optimized bundle size

### PWA Performance
- Fast loading with service worker caching
- Offline functionality
- Smooth animations with Motion
- Optimized images and assets

## 🐛 Troubleshooting

### Common Issues

**React Compiler Errors**
- Ensure code follows Rules of React
- Check for proper dependency arrays in hooks
- Avoid breaking React patterns

**PWA Not Installing**
- Check manifest.json is accessible
- Ensure HTTPS in production
- Verify service worker registration

**Convex Connection Issues**
- Check environment variables
- Ensure Convex deployment is active
- Verify network connectivity

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React Team](https://react.dev) for React 19 and React Compiler
- [TanStack](https://tanstack.com) for the amazing router and start framework
- [Convex](https://convex.dev) for the real-time backend
- [Tailwind CSS](https://tailwindcss.com) for the utility-first CSS framework
- [Motion](https://motion.dev) for smooth animations

## 📞 Support

If you have any questions or need help:
- Open an issue on GitHub
- Check the documentation
- Review the troubleshooting section

---

Built with ❤️ for runners who love their shoes!
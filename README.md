# Running Shoe Tracker 🏃‍♂️👟

A comprehensive running shoe tracking application built with TanStack Start and Convex DB. Track your running shoes, log your runs, monitor shoe usage, and organize your collection with Google authentication.

## ✨ Features

### 🔐 Authentication
- **Google Sign-In**: Secure authentication with your Google account
- **User Profiles**: Personal dashboard and settings
- **Data Privacy**: Your data is private and secure

### 👟 Shoe Management
- **Detailed Tracking**: Brand, model, size, weight, heel drop, purchase info
- **Photo Uploads**: Add photos of your shoes for easy identification
- **Usage Monitoring**: Track current vs. maximum mileage
- **Smart Alerts**: Get notified when shoes need replacement
- **Retirement Tracking**: Archive old shoes while maintaining history

### 📁 Collection Organization
- **Custom Collections**: Group shoes by type (Road, Trail, Racing, etc.)
- **Color Coding**: Visual organization with custom colors
- **Flexible Organization**: Move shoes between collections easily

### 🏃 Run Logging
- **Comprehensive Metrics**: Distance, duration, pace, effort level
- **Environmental Data**: Weather, temperature, surface type
- **Performance Tracking**: Heart rate, calories, elevation
- **Route Information**: Track where you run
- **Automatic Mileage**: Shoe mileage updates when runs are logged

### 📊 Analytics & Insights
- **Usage Levels**: Visual indicators (New → Good → Moderate → High → Replace)
- **Statistics Dashboard**: Total runs, distance, time, averages
- **Monthly Tracking**: Current month progress
- **Shoe Performance**: Individual shoe statistics and run history

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- A [Convex](https://convex.dev) account
- A Google Cloud project with OAuth credentials

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd shoes-final
pnpm install
```

### 2. Set Up Convex

```bash
# Initialize Convex project
npx convex dev --once

# This will create a new Convex deployment and give you a URL
```

### 3. Configure Google OAuth

#### 3.1 Create Google OAuth Credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API (required for authentication)
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URIs:
   - For development: `http://localhost:3000/api/auth/callback/google`
   - For production: `https://your-domain.com/api/auth/callback/google`

#### 3.2 Set Environment Variables in Convex

Go to your [Convex Dashboard](https://dashboard.convex.dev) and navigate to your project settings:

1. **Settings** → **Environment Variables**
2. Add the following variables:

```
AUTH_GOOGLE_ID=your_google_client_id_here
AUTH_GOOGLE_SECRET=your_google_client_secret_here
```

### 4. Configure Local Environment

Create a `.env.local` file in the project root:

```bash
# Your Convex deployment URL (from step 2)
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

### 5. Start Development

```bash
# Start the development server
pnpm dev
```

The app will be available at `http://localhost:3000` (or another port if 3000 is taken).

## 🛠️ Development

### Project Structure

```
shoes-final/
├── convex/                 # Backend functions and schema
│   ├── auth.config.ts     # Authentication configuration
│   ├── auth.ts           # Auth queries
│   ├── schema.ts         # Database schema
│   └── shoes.ts          # Main API functions
├── src/
│   ├── components/       # Reusable React components
│   │   ├── AuthProvider.tsx
│   │   ├── FormComponents.tsx
│   │   └── Onboarding.tsx
│   ├── routes/          # Page components
│   └── queries.ts       # API query hooks
└── README.md
```

### Key Technologies

- **Frontend**: TanStack Start (React-based meta-framework)
- **Backend**: Convex (Reactive backend-as-a-service)
- **Database**: Convex DB with real-time updates
- **Authentication**: Convex Auth with Google OAuth
- **Styling**: Tailwind CSS
- **State Management**: TanStack Query
- **Routing**: TanStack Router

## 📱 User Guide

### First Time Setup

1. **Sign In**: Use your Google account to sign in
2. **Onboarding**: Create your first collections (e.g., "Road Running", "Trail Running")
3. **Add Shoes**: Start adding your running shoes with details
4. **Log Runs**: Begin tracking your runs and see automatic mileage updates

### Managing Collections

- **Create**: Organize shoes by type, brand, or purpose
- **Customize**: Choose colors and descriptions
- **Archive**: Hide collections you no longer use

### Tracking Shoes

- **Add Details**: Brand, model, size, purchase info, max mileage
- **Upload Photos**: Visual identification of your shoes
- **Monitor Usage**: See usage levels and replacement alerts
- **Retire Shoes**: Mark shoes as retired when worn out

### Logging Runs

- **Quick Entry**: Distance, duration, and shoe selection
- **Detailed Metrics**: Weather, effort level, surface type
- **Performance Data**: Heart rate, calories, elevation
- **Auto-Calculate**: Pace calculation from distance and time

## 🔧 Configuration

### Environment Variables

#### Convex Dashboard Variables (Required)
```
AUTH_GOOGLE_ID=your_google_oauth_client_id
AUTH_GOOGLE_SECRET=your_google_oauth_client_secret
```

#### Local Environment (.env.local)
```
VITE_CONVEX_URL=https://your-deployment.convex.cloud
```

### Customization

The app is designed to be easily customizable:

- **Colors**: Update the color palette in `tailwind.config.mjs`
- **Units**: Distance units (miles/km) can be configured per user
- **Features**: Enable/disable features in the UI components

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. **Prepare for Production**:
   ```bash
   pnpm build
   ```

2. **Deploy to Vercel**:
   ```bash
   npx vercel
   ```

3. **Set Environment Variables** in Vercel dashboard:
   - `VITE_CONVEX_URL=https://your-deployment.convex.cloud`

4. **Update OAuth Redirect URLs** in Google Cloud Console:
   - Add your production domain: `https://your-app.vercel.app/api/auth/callback/google`

### Deploy Convex Backend

```bash
# Deploy to production
npx convex deploy
```

## 📊 Database Schema

### Collections
- User's organizational categories for shoes
- Custom colors and descriptions
- Archive capability

### Shoes
- Detailed shoe information and specifications
- Usage tracking and mileage monitoring
- Image storage integration
- User ownership and privacy

### Runs
- Comprehensive run logging
- Performance metrics and environmental data
- Automatic shoe mileage updates
- Historical tracking

### Users
- Google OAuth integration
- User preferences and settings
- Data privacy and isolation

## 🎯 Features in Detail

### Smart Usage Tracking
- **Automatic Mileage**: Updates when runs are logged
- **Visual Indicators**: Color-coded usage levels
- **Replacement Alerts**: Notifications when shoes reach limits
- **Historical Data**: Complete usage history preserved

### Advanced Run Logging
- **Multiple Metrics**: Distance, time, pace, effort
- **Environmental Tracking**: Weather, temperature, surface
- **Performance Data**: Heart rate, calories, elevation
- **Route Information**: Where you ran

### Real-time Synchronization
- **Instant Updates**: Changes sync across devices immediately
- **Optimistic UI**: Immediate feedback with background sync
- **Conflict Resolution**: Handles concurrent edits gracefully

## 🔒 Privacy & Security

- **Data Isolation**: Each user's data is completely private
- **Secure Authentication**: Google OAuth 2.0 with industry standards
- **No Tracking**: No analytics or tracking beyond essential functionality
- **Data Export**: Full data export capabilities (coming soon)

## 🐛 Troubleshooting

### Common Issues

1. **Authentication Fails**
   - Verify Google OAuth credentials in Convex dashboard
   - Check redirect URLs in Google Cloud Console
   - Ensure Convex deployment is active

2. **Database Errors**
   - Clear browser cache and local storage
   - Restart development server
   - Check Convex dashboard for deployment status

3. **Environment Variables**
   - Verify all required variables are set in Convex dashboard
   - Check `.env.local` file for local development
   - Restart development server after changes

### Getting Help

1. Check the [Convex Documentation](https://docs.convex.dev)
2. Review [TanStack Start Docs](https://tanstack.com/start)
3. Open an issue in this repository

## 🤝 Contributing

We welcome contributions! Please see our contributing guidelines for details on:

- Code style and standards
- Testing requirements
- Pull request process
- Issue reporting

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **Convex**: For the amazing backend-as-a-service platform
- **TanStack**: For the excellent React tooling ecosystem
- **Google**: For reliable authentication services
- **Tailwind CSS**: For the utility-first CSS framework

---

**Happy Running! 🏃‍♂️💨**

Track your shoes, improve your runs, and never get caught with worn-out gear again!
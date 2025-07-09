#!/bin/bash

# MyShoeTracker Setup Script
# This script helps set up the development environment for the shoe tracker app

set -e

echo "🏃‍♂️ MyShoeTracker Setup"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."

    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+ from https://nodejs.org/"
        exit 1
    fi

    if ! command -v pnpm &> /dev/null; then
        print_warning "pnpm is not installed. Installing pnpm..."
        npm install -g pnpm
    fi

    print_success "Dependencies check completed"
}

# Install project dependencies
install_dependencies() {
    print_status "Installing project dependencies..."
    pnpm install
    print_success "Dependencies installed"
}

# Setup Convex
setup_convex() {
    print_status "Setting up Convex..."

    if ! command -v npx &> /dev/null; then
        print_error "npx is not available. Please ensure Node.js is properly installed."
        exit 1
    fi

    print_status "Initializing Convex (this will create a new deployment)..."
    npx convex dev --once

    print_success "Convex setup completed"
}

# Create environment file
create_env_file() {
    print_status "Creating environment configuration..."

    if [ ! -f .env.local ]; then
        echo "# Convex Configuration" > .env.local
        echo "# Replace with your actual Convex deployment URL" >> .env.local
        echo "VITE_CONVEX_URL=https://your-deployment.convex.cloud" >> .env.local
        echo "" >> .env.local
        echo "# Development settings" >> .env.local
        echo "NODE_ENV=development" >> .env.local

        print_success "Created .env.local file"
        print_warning "Please update VITE_CONVEX_URL in .env.local with your actual Convex deployment URL"
    else
        print_warning ".env.local already exists, skipping creation"
    fi
}

# Setup instructions
show_setup_instructions() {
    echo ""
    echo "🔧 Setup Instructions"
    echo "===================="
    echo ""
    echo "1. CONVEX ENVIRONMENT VARIABLES:"
    echo "   Go to https://dashboard.convex.dev and navigate to your project"
    echo "   Add these environment variables in Settings > Environment Variables:"
    echo ""
    echo "   AUTH_GOOGLE_ID=your_google_oauth_client_id"
    echo "   AUTH_GOOGLE_SECRET=your_google_oauth_client_secret"
    echo ""
    echo "2. GOOGLE OAUTH SETUP:"
    echo "   - Go to https://console.cloud.google.com/"
    echo "   - Create a new project or select existing one"
    echo "   - Enable Google+ API"
    echo "   - Create OAuth 2.0 credentials"
    echo "   - Add these redirect URIs:"
    echo "     • Development: http://localhost:3000/api/auth/callback/google"
    echo "     • Production: https://myshoetracker.fun/api/auth/callback/google"
    echo ""
    echo "3. UPDATE LOCAL ENVIRONMENT:"
    echo "   Edit .env.local and replace the Convex URL with your actual deployment URL"
    echo ""
    echo "4. START DEVELOPMENT:"
    echo "   Run: pnpm dev"
    echo ""
}

# Validate setup
validate_setup() {
    print_status "Validating setup..."

    if [ ! -f package.json ]; then
        print_error "package.json not found. Are you in the right directory?"
        exit 1
    fi

    if [ ! -d node_modules ]; then
        print_error "node_modules not found. Run 'pnpm install' first."
        exit 1
    fi

    if [ ! -f .env.local ]; then
        print_warning ".env.local not found. Environment variables may not be configured."
    fi

    print_success "Setup validation completed"
}

# Main setup flow
main() {
    echo ""
    print_status "Starting setup process..."
    echo ""

    check_dependencies
    echo ""

    install_dependencies
    echo ""

    create_env_file
    echo ""

    print_status "Setting up Convex deployment..."
    echo "This will open your browser to authenticate with Convex..."
    read -p "Press Enter to continue or Ctrl+C to cancel..."
    setup_convex
    echo ""

    validate_setup
    echo ""

    show_setup_instructions

    print_success "Setup completed! 🎉"
    echo ""
    echo "Next steps:"
    echo "1. Configure Google OAuth credentials in Convex dashboard"
    echo "2. Update .env.local with your Convex deployment URL"
    echo "3. Run 'pnpm dev' to start development"
    echo ""
}

# Help function
show_help() {
    echo "MyShoeTracker Setup Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --help, -h     Show this help message"
    echo "  --deps-only    Only install dependencies"
    echo "  --env-only     Only create environment file"
    echo "  --validate     Only validate existing setup"
    echo ""
    echo "Examples:"
    echo "  $0              # Full setup"
    echo "  $0 --deps-only  # Install dependencies only"
    echo "  $0 --validate   # Validate current setup"
    echo ""
}

# Parse command line arguments
case "${1:-}" in
    --help|-h)
        show_help
        exit 0
        ;;
    --deps-only)
        check_dependencies
        install_dependencies
        print_success "Dependencies installation completed"
        exit 0
        ;;
    --env-only)
        create_env_file
        print_success "Environment file creation completed"
        exit 0
        ;;
    --validate)
        validate_setup
        exit 0
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac

# Jira Time Tracking Report - Next.js UI

A modern, responsive web application for tracking and visualizing time spent on Jira tickets with authentication and multiple dashboard views.

## Features

### Authentication
- **Secure Login System**: Admin authentication with email/password
- **Session Management**: Persistent login with localStorage
- **Protected Routes**: Automatic redirect to login for unauthorized access

### Dashboard Views
- **Overview Dashboard**: 8 comprehensive metric cards showing:
  - Total Users, Tickets, Time Logged
  - Average time per user and per ticket
  - Issues found and productivity metrics

- **Team Performance Dashboard**:
  - Top performer rankings by time
  - Most tickets completed
  - Detailed team performance table

- **Ticket Analytics Dashboard**:
  - Longest tasks analysis
  - Most collaborative tickets
  - Detailed ticket time breakdown with contributors

- **Detailed User View**:
  - Individual user statistics
  - Ticket breakdowns
  - Daily time distributions

### Date Selection
- **Quick Periods**: Daily, Weekly, Monthly presets
- **Custom Date Range**: Select any date range with calendar picker
- **Real-time Updates**: Instant data refresh on date changes

### UI/UX
- **Dark Mode Support**: Automatically adapts to system theme
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Beautiful Cards**: Gradient-styled metric cards
- **Interactive Tables**: Sortable, hover-enabled data tables

## Prerequisites

- Node.js 18+ or npm
- Jira account with API access
- Jira API token

## Setup

1. **Install Dependencies**

```bash
npm install
```

2. **Configure Environment Variables**

Create a `.env.local` file in the root directory with your Jira credentials:

```env
JIRA_HOST=your-company.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=your-api-token
PROJECT_KEY=PROJ  # Optional: filter by specific project
```

To generate a Jira API token:
1. Go to https://id.atlassian.com/manage-profile/security/api-tokens
2. Click "Create API token"
3. Copy the token and paste it in your `.env.local` file

3. **Run the Development Server**

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

## Usage

### Login
1. Navigate to the application URL
2. You'll be redirected to the login page
3. Enter credentials:
   - Email: `admin@moonsys.co`
   - Password: `123123123`
4. Click "Sign In"

### Dashboard Navigation
Once logged in, you'll have access to 4 dashboard views:

1. **Overview**: Quick metrics and statistics at a glance
2. **Team Performance**: Rankings and performance comparisons
3. **Ticket Analytics**: Detailed ticket analysis and collaboration data
4. **Detailed View**: Individual user breakdowns with full details

### Date Selection
- Use the **Quick Period** buttons (Daily, Weekly, Monthly) for predefined ranges
- Click **Custom Range** to select specific start and end dates
- Data updates automatically when you change the date range

### Logout
Click the "Logout" button in the top-right corner to sign out

## Building for Production

```bash
npm run build
npm start
```

## Project Structure

```
jira-reporting-ui/
├── app/
│   ├── api/
│   │   └── worklog/
│   │       └── route.ts             # API endpoint for fetching Jira data
│   ├── login/
│   │   └── page.tsx                 # Login page
│   ├── dashboard/
│   │   └── page.tsx                 # Main dashboard with navigation
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Home page (redirects to login/dashboard)
│   └── globals.css                  # Global styles
├── components/
│   ├── dashboards/
│   │   ├── OverviewDashboard.tsx    # Overview metrics cards
│   │   ├── TeamPerformanceDashboard.tsx  # Team rankings & performance
│   │   └── TicketAnalyticsDashboard.tsx  # Ticket analytics
│   ├── DateRangeSelector.tsx        # Custom date range picker
│   ├── UserStatsCard.tsx            # User statistics display
│   ├── SummaryCard.tsx              # Summary statistics card
│   └── LoadingSpinner.tsx           # Loading indicator
├── lib/
│   ├── jira.ts                      # Jira API utilities
│   └── auth.ts                      # Authentication utilities
└── .env.local                       # Environment variables (not committed)
```

## Technologies Used

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe code
- **Tailwind CSS**: Utility-first styling
- **Axios**: HTTP client for API requests
- **Jira REST API v3**: Data source

## Troubleshooting

**No work logs found:**
- Verify your Jira credentials in `.env.local`
- Check that work logs exist for the selected time period
- Ensure your API token has proper permissions

**API errors:**
- Verify your Jira host URL is correct (without https://)
- Check that your API token hasn't expired
- Ensure your email matches your Jira account

## License

ISC
# jira-reporting-moonsys

# The Good Life: Virtue Tracker

A mobile app for iOS built with React Native and Expo to help you track your daily virtuous activities and build better habits.

## Features

- **Activity Logging**: Log activities with a unique handle, date, and custom tags
- **Activity History**: View all your logged activities in a clean, searchable list
- **Statistics**: Track your progress with insights and achievement milestones
- **Search & Filter**: Find activities by handle or tags
- **Local Storage**: All data is stored locally on your device using SQLite

## Data Model

Each activity includes:
- **Handle**: A unique identifier/name for the activity (e.g., "morning_meditation", "daily_exercise")
- **Committed On**: The date when the activity was performed
- **Tags**: A list of custom tags to categorize and organize activities
- **Timestamps**: Automatic creation and update timestamps

## Tech Stack

- **React Native** with **Expo** for cross-platform mobile development
- **TypeScript** for type safety
- **SQLite** (expo-sqlite) for local data storage
- **React Navigation** for app navigation
- **Expo Vector Icons** for UI icons

## Project Structure

```
src/
├── components/          # Reusable UI components
├── screens/            # App screens
│   ├── ActivityListScreen.tsx
│   ├── AddActivityScreen.tsx
│   └── StatsScreen.tsx
├── services/           # Business logic and data services
│   └── DatabaseService.ts
└── types/             # TypeScript type definitions
    └── Activity.ts
```

## Getting Started

### Prerequisites

- Node.js (v16 or later)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (Xcode) or physical iOS device with Expo Go app

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

4. Run on iOS:
   - Press `i` to open in iOS Simulator
   - Or scan the QR code with your iPhone camera to open in Expo Go

### Build Commands

- `npm start` - Start the Expo development server
- `npm run ios` - Start and open in iOS Simulator
- `npm run android` - Start and open in Android Simulator
- `npm run web` - Start and open in web browser

## Usage

### Adding Activities

1. Tap the "+" button on the main screen
2. Enter a handle for your activity (e.g., "morning_run", "read_philosophy")
3. Select or enter the date when you performed the activity
4. Add relevant tags (e.g., "exercise", "health", "learning")
5. Tap "Save Activity"

### Viewing Statistics

- Navigate to the "Stats" tab to see:
  - Total activities logged
  - Weekly and monthly activity counts
  - Current activity streak
  - Most popular tags
  - Achievement milestones

### Searching Activities

- Use the search bar on the main screen to find activities by handle or tags
- Results update in real-time as you type

## Database Schema

The app uses SQLite with the following table structure:

```sql
CREATE TABLE activities (
  id TEXT PRIMARY KEY,
  handle TEXT NOT NULL,
  committed_on TEXT NOT NULL,
  tags TEXT NOT NULL,  -- JSON array of strings
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

## Contributing

This is a personal virtue tracking app, but feel free to fork and adapt it for your own use!

## License

MIT License - feel free to use this project as a foundation for your own virtue tracking app.

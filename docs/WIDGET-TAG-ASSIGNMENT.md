# Widget Tag Assignment Feature

## Overview
All dashboard widgets now support dynamic tag assignment, allowing users to connect widgets directly to I/O channels from the ParX data collection system.

## Components

### TagSelector Component
**Location:** `frontend-v2/src/components/widgets/TagSelector.tsx`

A reusable component for selecting I/O channels/tags with the following features:
- **Search & Filter**: Real-time search across all available channels
- **Multi-Select Support**: Can be configured for single or multiple tag selection
- **Visual Feedback**: Selected tags displayed as colored chips with units
- **API Integration**: Loads channels from `/api/v1/io/channels` endpoint
- **Hierarchical Display**: Shows Interface → Connection → Channel structure

### Enhanced Widgets

#### 1. TrendGraph Widget
**File:** `frontend-v2/src/components/widgets/TrendGraph.tsx`

**Features:**
- Multi-tag selection for plotting multiple data series
- Dynamic line generation with automatic color assignment
- Configurable max data points (10-500)
- Grid display toggle
- Custom widget title

**Configuration Options:**
- Data Sources (Tags): Multiple channel selection
- Widget Title: Custom display name
- Max Data Points: Buffer size for historical data
- Show Grid: Toggle cartesian grid display

#### 2. AlarmLog Widget
**File:** `frontend-v2/src/components/widgets/AlarmLog.tsx`

**Features:**
- Multi-tag selection for alarm source filtering
- Configurable maximum items display
- Timestamp display toggle
- Severity-based color coding (Critical/Warning/Info)

**Configuration Options:**
- Alarm Sources (Tags): Filter alarms by selected channels
- Widget Title: Custom display name
- Max Items: Number of alarms to display (5-100)
- Show Timestamps: Toggle timestamp visibility

#### 3. ProgressBar Widget
**File:** `frontend-v2/src/components/widgets/ProgressBar.tsx`

**Features:**
- Single tag selection for value display
- Customizable min/max range
- Configurable bar color
- Decimal precision control

**Configuration Options:**
- Data Source (Tag): Single channel selection
- Widget Title: Custom display name
- Minimum Value: Lower bound of progress range
- Maximum Value: Upper bound of progress range
- Decimal Places: Value precision (0-4)
- Bar Color: Custom color picker

#### 4. ValueCard Widget
**File:** `frontend-v2/src/components/widgets/ValueCard.tsx`

**Features:**
- Single tag selection for value display
- Engineering units display
- Quality indicator (GOOD/BAD/UNKNOWN)
- Decimal precision control

**Configuration Options:**
- Data Source (Tag): Single channel selection
- Widget Title: Custom display name
- Engineering Units: Display units (°C, PSI, RPM, etc.)
- Decimal Places: Value precision (0-4)
- Show Quality Indicator: Toggle quality status display

## Integration

### DashboardGrid Component
**File:** `frontend-v2/src/components/DashboardGrid.tsx`

Updated to pass `onConfigChange` callback to all widgets, enabling configuration persistence:

```typescript
const commonProps = {
  widget,
  editable,
  onRemove: () => removeWidget(widget.id),
  onConfigChange: (config: any) => {
    updateWidget(widget.id, { config })
  },
}
```

## User Workflow

1. **Add Widget**: User adds a widget to the dashboard
2. **Configure**: Click the settings icon on the widget
3. **Select Tags**: Use the TagSelector to search and choose I/O channels
4. **Customize**: Adjust display options (title, colors, ranges, etc.)
5. **Save**: Configuration is persisted to the dashboard
6. **Real-time Data**: Widget automatically subscribes to selected channels via WebSocket

## Technical Details

### WebSocket Integration
Widgets subscribe to real-time data updates using the `websocketService`:

```typescript
useEffect(() => {
  if (!localConfig.channel) return

  const unsubscribe = websocketService.subscribe(
    localConfig.channel,
    (data) => {
      setValue(data.value)
      setQuality(data.quality)
    }
  )

  return unsubscribe
}, [localConfig.channel])
```

### Configuration State Management
Each widget maintains local configuration state and syncs with the dashboard store:

```typescript
const [localConfig, setLocalConfig] = useState({
  channel: '',
  title: 'Widget Title',
  // ... other config options
  ...widget.config
})

const handleSaveConfig = () => {
  if (onConfigChange) {
    onConfigChange(localConfig)
  }
  setShowConfig(false)
}
```

### Type Safety
All widgets use proper TypeScript interfaces and type guards for safe property access:

```typescript
interface Props {
  widget: any
  editable: boolean
  onRemove: () => void
  onConfigChange?: (config: any) => void
}
```

## API Endpoints

### Get I/O Channels
**Endpoint:** `GET /api/v1/io/channels`

**Response:**
```json
[
  {
    "id": "interface1.connection1.channel1",
    "name": "Temperature Sensor 1",
    "interfaceId": "interface1",
    "connectionId": "connection1",
    "enabled": true,
    "metadata": {
      "units": "°C",
      "description": "Reactor temperature"
    }
  }
]
```

## Future Enhancements

1. **Tag Grouping**: Organize tags by interface/connection in dropdown
2. **Favorites**: Allow users to mark frequently used tags
3. **Tag Metadata**: Display additional tag information (data type, scan rate)
4. **Validation**: Warn users about incompatible tag selections
5. **Bulk Configuration**: Apply same tags to multiple widgets
6. **Tag Templates**: Save and reuse common tag configurations

## Testing

To test the tag assignment feature:

1. Start the ParX system: `npm run dev` in frontend-v2
2. Navigate to Dashboard Builder
3. Add a widget (TrendGraph, AlarmLog, ProgressBar, or ValueCard)
4. Click the settings icon on the widget
5. Search for and select tags from the TagSelector
6. Configure display options
7. Save and verify real-time data updates

## Dependencies

- **react-grid-layout**: Dashboard layout management
- **@types/react-grid-layout**: TypeScript definitions
- **recharts**: Chart rendering for TrendGraph
- **lucide-react**: Icons for UI elements

# ParX UI Requirements Analysis

**Date**: November 28, 2025  
**Status**: Gap Analysis Complete

---

## User Personas

### Primary Persona: Controls/Automation Engineer
**Context**: Commissioning new ParX Edge instance at steel mill or OEM facility

**Needs**:
- ✅ Quick connection to PLC/device
- 🟡 Fast validation via test connection (partially implemented)
- 🟡 Straightforward scaling and offset definitions (needs enhancement)
- ❌ Confidence runtime will never silently fail (needs robust error handling)

### Secondary Persona: Process Engineer / Data Analyst
**Needs**:
- ✅ Clearly named signals (implemented via naming conventions)
- ✅ Consistent units (metadata support exists)
- ✅ Reliable sampling rates (configurable scan rates)
- ✅ Logical grouping for dashboards (dashboard builder exists)

---

## Current Implementation vs Requirements

### ✅ What's Already Implemented

#### 1. Database Schema (Matches ParX Structure)
**File**: `database/migrations/001_initial_schema.sql`

Current structure:
```
interfaces (Module level)
  ├── connections (Connection level)
  │     └── channels (Signal level)
```

**Alignment**: ✅ Matches ParX I/O Tree structure

#### 2. Admin UI - ChannelTreeView
**File**: `frontend-v2/src/components/admin/ChannelTreeView.tsx`

Current features:
- ✅ Tree-based navigation (Interfaces → Connections → Channels)
- ✅ Add/Edit/Delete for all levels
- ✅ Enable/Disable toggle
- ✅ Protocol selection (Modbus, OPC UA, MQTT, EtherNet/IP, EGD)
- ✅ Configuration JSON editor
- ✅ Metadata support

**Alignment**: 🟡 Good foundation, needs ParX-specific enhancements

#### 3. Naming Conventions
**File**: `docs/NAMING-CONVENTIONS.md`

Current format: `interface.connection.channel`

**Alignment**: ✅ Matches ParX namespace requirements

---

## 🔴 Critical Gaps

### Gap 1: ParX Two-Pane Layout Not Implemented

**Required**:
```
┌─────────────────────┬──────────────────────────────────┐
│ Left: Module Tree   │ Right: Configuration Tabs        │
│                     │                                  │
│ ▼ Inputs            │ ┌─────────────────────────────┐ │
│   ▼ OPC UA          │ │ General | Connection | ...  │ │
│     • Module 1      │ └─────────────────────────────┘ │
│     • Module 2      │                                  │
│   ▼ Modbus TCP      │ [Configuration Form]             │
│     • PLC-001       │                                  │
│   + Add Module      │                                  │
│                     │                                  │
│ ▼ Outputs           │                                  │
│   • MQTT Writer     │                                  │
│   + Add Module      │                                  │
│                     │                                  │
│ ▼ Groups            │                                  │
│ ▼ Analytics         │                                  │
│ ▼ General           │                                  │
└─────────────────────┴──────────────────────────────────┘
```

**Current**: Single tree view without categorization

**Impact**: High - Core UX mismatch

---

### Gap 2: Missing Configuration Tabs

**Required Tabs**:
1. ✅ General (partially exists)
2. 🟡 Connection (exists but needs enhancement)
3. ❌ Analog Inputs (table view missing)
4. ❌ Digital Inputs (table view missing)
5. ❌ Diagnostics (not implemented)

**Current**: Single JSON editor for all configuration

**Impact**: High - Engineers need structured forms, not JSON

---

### Gap 3: Missing General Tab Fields

**Required Fields**:
| Field | Current Status | Notes |
|-------|---------------|-------|
| Module Name | ✅ Exists | `name` field |
| Module Type | ✅ Exists | `protocol` field |
| Enabled | ✅ Exists | `enabled` boolean |
| Timebase (ms) | ❌ Missing | Critical for ParX runtime |

**Required Behavior**:
- Timebase determines signal update cadence
- Name used as namespace prefix
- Module layout defines max signal count

**Impact**: High - Core ParX functionality

---

### Gap 4: Missing Connection Tab Features

**Required Features**:
| Feature | Current Status | Notes |
|---------|---------------|-------|
| Endpoint/IP/URL | ✅ Exists | In config JSON |
| Port | ✅ Exists | In config JSON |
| Authentication | 🟡 Partial | Basic support |
| Timeout | ❌ Missing | Needs explicit field |
| **Browse Address Space** | ❌ Missing | Critical for OPC UA |
| **Test Connection** | ❌ Missing | Critical for commissioning |

**Protocol-Specific Extensions Needed**:
- OPC UA: Security policy, message mode, user token
- EIP: CIP path, RPI, connection type
- Modbus: Function codes, register ranges, endianness
- EGD: Exchange ID, producer/consumer role
- ProfiNET: Device name, slot/subslot, API mappings

**Impact**: Critical - Engineers can't validate connections

---

### Gap 5: Missing Analog Inputs Table

**Required Table**:
```
┌──────────────┬──────┬──────┬────────┬─────────────────┬───────────┬────────┐
│ Name         │ Unit │ Gain │ Offset │ Source Address  │ Data Type │ Active │
├──────────────┼──────┼──────┼────────┼─────────────────┼───────────┼────────┤
│ Temperature  │ °C   │ 1.0  │ 0.0    │ 40001          │ Float     │ ✓      │
│ Pressure     │ PSI  │ 0.1  │ 0.0    │ 40003          │ Float     │ ✓      │
│ Speed        │ RPM  │ 1.0  │ 0.0    │ 40005          │ Int16     │ ✓      │
└──────────────┴──────┴──────┴────────┴─────────────────┴───────────┴────────┘
```

**Required Behavior**:
- Calculated value = (RawValue × Gain) + Offset
- Type validation at runtime
- Real-time validation feedback
- Green = Active, Grey = Inactive
- Double-click Node ID → open browser
- Hover → show datatype & last value

**Current**: Channels are individual entities, not grouped in table

**Impact**: High - Core signal configuration UX

---

### Gap 6: Missing Digital Inputs Table

**Required Table**:
```
┌──────────────┬────────────────┬────────┐
│ Name         │ Source Address │ Active │
├──────────────┼────────────────┼────────┤
│ Pump Status  │ Coil 1        │ ✓      │
│ Valve Open   │ Coil 2        │ ✓      │
└──────────────┴────────────────┴────────┘
```

**Required Behavior**:
- All true/false as 1/0
- Store as events and continuous time series

**Current**: No distinction between analog and digital

**Impact**: Medium - Usability issue

---

### Gap 7: Missing Diagnostics Tab

**Required Information**:
- Real-time connection status
- Last successful read/write timestamp
- Error count
- Reconnect attempts
- Packet counters (rx/tx)
- Protocol-specific indicators

**Required Behavior**:
- 1 Hz refresh rate
- Color coding: Red (lost), Yellow (degraded), Green (good)

**Current**: Basic health check endpoint exists, no UI

**Impact**: High - Engineers need runtime visibility

---

### Gap 8: Missing Browse Address Space

**Required for OPC UA**:
- Tree browser for OPC UA nodes
- Filter by data type
- Drag-and-drop to signal table
- Show node attributes (data type, access level, etc.)

**Current**: Not implemented

**Impact**: Critical for OPC UA commissioning

---

### Gap 9: Missing Test Connection Button

**Required Behavior**:
- Immediate handshake test
- Direct success/failure messaging
- Must not disrupt running modules
- Run in worker thread

**Current**: Not implemented

**Impact**: Critical - Engineers need validation before deployment

---

## 🟡 Enhancements Needed

### Enhancement 1: Module Categories

**Required Categories**:
1. **Inputs**
   - OPC UA
   - EtherNet/IP
   - EGD
   - Modbus TCP
   - ProfiNET
   - GaugeConnect
   - Custom Sources
   - "+ Add Module"

2. **Outputs**
   - OPC UA Server Publishing
   - MQTT Topic Writer
   - File Writer
   - Database Writer
   - "+ Add Module"

3. **Groups**
   - User-created signal groups

4. **Analytics**
   - Derived signals
   - Virtual signals
   - Math functions
   - Filters

5. **General**
   - Runtime settings
   - Sampling timers
   - Engine health

**Current**: Flat interface/connection/channel structure

**Impact**: Medium - Organizational clarity

---

### Enhancement 2: Scaling and Offset UI

**Required**:
- Visual calculator showing: `Output = (Input × Gain) + Offset`
- Example values with live preview
- Common presets (e.g., "4-20mA to 0-100%")
- Unit conversion helper

**Current**: Basic metadata support, no UI

**Impact**: Medium - Quality of life for engineers

---

### Enhancement 3: Signal Quality Indicators

**Required**:
- Real-time quality display (GOOD/BAD/UNCERTAIN)
- Last value display on hover
- Timestamp of last update
- Visual indicators (green/red/yellow)

**Current**: Quality stored but not displayed in admin UI

**Impact**: Medium - Runtime confidence

---

### Enhancement 4: Reconnect Logic Visibility

**Required**:
- Show reconnect attempts
- Exponential backoff visualization
- Manual reconnect button
- Connection history log

**Current**: Reconnect logic exists in code, no UI

**Impact**: Low - Nice to have for troubleshooting

---

## Implementation Priority

### Phase 1A: Critical UX Fixes (1-2 weeks)

**Priority 1: Two-Pane Layout**
- Implement left module tree with categories
- Implement right tabbed configuration panel
- Migrate existing tree view to new layout

**Priority 2: Configuration Tabs**
- General Tab with Timebase field
- Connection Tab with structured fields
- Analog Inputs table view
- Digital Inputs table view
- Diagnostics Tab

**Priority 3: Test Connection**
- Implement test connection API endpoint
- Add "Test Connection" button to Connection tab
- Show success/failure feedback
- Add connection status indicator

### Phase 1B: Enhanced Features (1-2 weeks)

**Priority 4: Browse Address Space (OPC UA)**
- Implement OPC UA browser API
- Create tree browser UI component
- Add drag-and-drop to signal table

**Priority 5: Scaling and Offset UI**
- Add Gain/Offset columns to Analog Inputs table
- Implement visual calculator
- Add unit conversion helper

**Priority 6: Diagnostics Tab**
- Real-time connection status
- Error counters
- Packet statistics
- Protocol-specific indicators

### Phase 2: Advanced Features (2-3 weeks)

**Priority 7: Module Categories**
- Reorganize data model for Input/Output/Groups/Analytics
- Implement category-based navigation
- Add "+ Add Module" buttons

**Priority 8: Signal Quality Indicators**
- Real-time quality display
- Last value on hover
- Visual indicators

**Priority 9: Advanced Diagnostics**
- Connection history
- Reconnect visualization
- Manual reconnect button

---

## Database Schema Changes Needed

### Add to `interfaces` table:
```sql
ALTER TABLE interfaces ADD COLUMN timebase_ms INTEGER DEFAULT 1000;
ALTER TABLE interfaces ADD COLUMN category TEXT DEFAULT 'inputs';
ALTER TABLE interfaces ADD COLUMN max_analog_channels INTEGER DEFAULT 100;
ALTER TABLE interfaces ADD COLUMN max_digital_channels INTEGER DEFAULT 100;
```

### Add to `channels` table:
```sql
ALTER TABLE channels ADD COLUMN channel_type TEXT DEFAULT 'analog'; -- 'analog' or 'digital'
ALTER TABLE channels ADD COLUMN gain DOUBLE PRECISION DEFAULT 1.0;
ALTER TABLE channels ADD COLUMN offset DOUBLE PRECISION DEFAULT 0.0;
ALTER TABLE channels ADD COLUMN source_address TEXT; -- Protocol-specific address
ALTER TABLE channels ADD COLUMN data_type TEXT; -- 'float', 'int16', 'bool', etc.
```

### Add new `diagnostics` table:
```sql
CREATE TABLE connection_diagnostics (
  connection_id TEXT PRIMARY KEY,
  status TEXT, -- 'connected', 'disconnected', 'degraded'
  last_success_timestamp TIMESTAMPTZ,
  last_error_timestamp TIMESTAMPTZ,
  error_count INTEGER DEFAULT 0,
  reconnect_attempts INTEGER DEFAULT 0,
  packets_rx BIGINT DEFAULT 0,
  packets_tx BIGINT DEFAULT 0,
  protocol_specific JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## API Endpoints Needed

### Test Connection
```
POST /api/v1/connections/:connectionId/test
Response: {
  success: boolean,
  message: string,
  latency_ms: number,
  details: object
}
```

### Browse Address Space (OPC UA)
```
GET /api/v1/connections/:connectionId/browse?nodeId=ns=2;i=1
Response: {
  nodes: [
    {
      nodeId: string,
      browseName: string,
      displayName: string,
      nodeClass: string,
      dataType: string,
      children: boolean
    }
  ]
}
```

### Get Diagnostics
```
GET /api/v1/connections/:connectionId/diagnostics
Response: {
  status: string,
  lastSuccess: timestamp,
  errorCount: number,
  reconnectAttempts: number,
  packetsRx: number,
  packetsTx: number,
  protocolSpecific: object
}
```

### Get Live Value
```
GET /api/v1/channels/:channelId/live
Response: {
  value: number,
  quality: string,
  timestamp: number,
  unit: string
}
```

---

## UI Component Architecture

### Recommended Structure

```
frontend-v2/src/components/admin/
├── ParXLayout.tsx                    # Two-pane layout container
├── ModuleTree/
│   ├── ModuleTree.tsx               # Left pane tree
│   ├── ModuleTreeNode.tsx           # Tree node component
│   ├── CategoryNode.tsx             # Category (Inputs, Outputs, etc.)
│   └── AddModuleButton.tsx          # "+ Add Module" button
├── ConfigurationPanel/
│   ├── ConfigurationPanel.tsx       # Right pane container
│   ├── GeneralTab.tsx               # General configuration
│   ├── ConnectionTab.tsx            # Connection settings
│   ├── AnalogInputsTab.tsx          # Analog signals table
│   ├── DigitalInputsTab.tsx         # Digital signals table
│   └── DiagnosticsTab.tsx           # Runtime diagnostics
├── Shared/
│   ├── TestConnectionButton.tsx     # Test connection component
│   ├── BrowseAddressSpace.tsx       # OPC UA browser
│   ├── ScalingCalculator.tsx        # Gain/Offset calculator
│   └── StatusIndicator.tsx          # Connection status badge
└── ChannelTreeView.tsx              # Legacy (to be migrated)
```

---

## Conclusion

### Current State
The ParX implementation has a **solid foundation** with:
- ✅ Correct data model (Interface → Connection → Channel)
- ✅ Basic CRUD operations
- ✅ Protocol support (Modbus, OPC UA, MQTT)
- ✅ Real-time data collection working

### Critical Gaps
The UI needs **significant enhancement** to match ParX requirements:
- 🔴 Two-pane layout (Module Tree + Configuration Tabs)
- 🔴 Structured configuration forms (not JSON editor)
- 🔴 Test Connection functionality
- 🔴 Analog/Digital Inputs tables
- 🔴 Diagnostics Tab
- 🔴 Browse Address Space (OPC UA)

### Recommended Approach
1. **Phase 1A** (1-2 weeks): Implement critical UX fixes
   - Two-pane layout
   - Configuration tabs
   - Test connection
   
2. **Phase 1B** (1-2 weeks): Enhanced features
   - Browse address space
   - Scaling/offset UI
   - Diagnostics tab

3. **Phase 2** (2-3 weeks): Advanced features
   - Module categories
   - Signal quality indicators
   - Advanced diagnostics

### Estimated Total Time
**4-7 weeks** to fully align with ParX UI requirements

The good news: The backend is ready. This is purely a frontend enhancement effort.

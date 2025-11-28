# ParX Naming Conventions

## 1. Purpose
This document defines the standard naming conventions used throughout the ParX Data Collection Platform. The goals are:
- Ensure long-term consistency across sites and deployments
- Provide clear, human-readable labels for customers
- Provide clean, stable, machine-readable IDs for developers
- Support scalable analytics, dashboards, storage, and configuration

Every object in ParX uses two names:
- **ID** – machine-facing, immutable, strict format
- **Label** – human-facing, flexible, editable

## 2. Scope
This naming convention applies to the following ParX entity types:
- **Interfaces** (EtherNet/IP, Modbus TCP, OPC UA, MQTT, etc.)
- **Modules** (hardware cards, OPC UA node groups, topic groups)
- **Channels** (single data points on modules)
- **Tags** (logical signals used by dashboards, analytics, alarms, and storage)

## 3. General Naming Rules

### 3.1 IDs (Machine-Facing)
- Lowercase only
- Allowed characters: `a–z`, `0–9`, `_`
- Format: `snake_case`
- No spaces, punctuation, or uppercase
- Numeric segments must be zero-padded: `01`, `02`, `10`
- IDs are immutable after creation
- Auto-generated whenever possible

### 3.2 Labels (Human-Facing)
- Free-form, readable text
- Can include spaces and special characters
- Editable at any time
- Shown in UI, dashboards, analytics tools
- Does not affect system integration or references

## 4. Entity Naming Standards

### 4.1 Interface Naming
**Definition:** A communication endpoint such as an EtherNet/IP connection, OPC UA client, Modbus device, or MQTT broker.

**ID Pattern:** `{site}_{area}_{prot}{index}`

| Segment | Definition | Example |
|---------|------------|---------|
| site | 3–5 char location code | atl |
| area | Line or process | hm1, sl1, pl1 |
| prot | Protocol code | enip, modb, opcua, mqtt, egd, srtp |
| index | Numeric index, zero-padded | 01, 02 |

**Examples:**
- `atl_hm1_enip01`
- `atl_sl1_opcua01`

**Label Examples:**
- ATL Hot Mill 1 EtherNet/IP Interface #1
- ATL Slitter 1 OPC UA Server

### 4.2 Module Naming
**Definition:** A hardware card or logical grouping belonging to an interface.

**ID Pattern:** `{interface_id}_mod{index}`

**Examples:**
- `atl_hm1_enip01_mod01`
- `atl_sl1_opcua01_mod02`

**Attributes (Non-Name):**
- `module_type` (ai, ao, di, do, opc_node_group, mqtt_topic_group)
- `slot_number` (optional)

### 4.3 Channel Naming
**Definition:** A physical or logical data point on a module (e.g., analog input 3, OPC UA node, MQTT subtopic).

**ID Pattern:** `{module_id}_ch{channel}`

**Examples:**
- `atl_hm1_enip01_mod01_ch03`
- `atl_sl1_opcua01_mod02_ch12`

**Attributes (Non-Name):**
- `channel_type` (analog, digital, derived)
- `eng_unit`
- `data_type`

### 4.4 Tag Naming
**Definition:** A logical signal inside ParX. The Tag ID is used everywhere—dashboards, analytics, alarms, and storage.

**ID Pattern:** `{site}_{area}_{asset}_{subasset?}_{measurement}_{role}`

| Segment | Definition | Example |
|---------|------------|---------|
| site | Location code | atl |
| area | Line/process | hm1, sl1 |
| asset | Equipment identifier | fce1, mill1, slit1 |
| subasset | Optional subdivision | z1, st1, entry |
| measurement | What is being measured | temp, width, speed, thk, coilid |
| role | Type of signal | pv, sp, cmd, stat, alm, raw |

**Examples:**
- `atl_hm1_fce1_z1_temp_pv`
- `atl_hm1_fce1_z1_temp_sp`
- `atl_hm1_st1_thk_pv`
- `atl_sl1_line_speed_pv`
- `atl_sl1_ggc_width_pv`
- `atl_sl1_coilid_pv`

**Label Examples:**
- ATL Hot Mill 1 Furnace 1 Zone 1 Temp PV
- ATL Hot Mill Stand 1 Thickness
- Coil ID (MES)

## 5. Tag Mapping Requirements
Each tag must map to one data source:
- `interface_id`
- `module_id`
- `channel_id`

OR protocol-specific address:
- EtherNet/IP path
- Modbus register
- OPC UA Node ID
- MQTT topic

**Example Mapping:**
```
tag_id:         atl_hm1_fce1_z1_temp_pv
tag_label:      ATL Hot Mill 1 Furnace 1 Zone 1 Temp PV
interface_id:   atl_hm1_enip01
module_id:      atl_hm1_enip01_mod01
channel_id:     atl_hm1_enip01_mod01_ch03
eng_unit:       C
data_type:      float
```

## 6. User Experience Requirements

### 6.1 ID Autogeneration
ParX automatically constructs IDs based on user inputs such as:
- Site
- Area
- Asset
- Subasset
- Measurement
- Protocol
- Index

ID fields must be:
- Auto-populated
- Read-only or semi-editable
- Strictly validated

### 6.2 Bulk Import
Support CSV/XLSX import with fields such as:
- `tag_label`, `site`, `area`, `asset`, `subasset`, `measurement`, `role`
- `interface_ref`, `module_ref`, `channel_ref`

Provide a preview of auto-generated IDs before saving.

### 6.3 Validation
- Reject invalid characters
- Reject uppercase characters
- Reject duplicate IDs
- Warn on missing segments for tags

### 6.4 Editable Labels
Users may update labels at any time without breaking backend references.

## 7. Developer Requirements

### 7.1 Helper Functions
Implement standardized builders:
```javascript
buildInterfaceId(site, area, protocolCode, index)
buildModuleId(interfaceId, index)
buildChannelId(moduleId, channel)
buildTagId(site, area, asset, subasset, measurement, role)
```

### 7.2 Central Registry Tables
```sql
interfaces(interface_id PK, label, site, area, protocol, index, ...)
modules(module_id PK, interface_id FK, label, module_type, slot_number, ...)
channels(channel_id PK, module_id FK, label, channel_type, ...)
tags(tag_id PK, label, site, area, asset, subasset, measurement, role, 
     interface_id FK, module_id FK, channel_id FK, eng_unit, data_type, ...)
```

### 7.3 Enforcement
- IDs are immutable
- All analytics reference `tag_id`
- Labels are safe to change

## 8. JSON Schema Examples

### 8.1 Tag Schema
```json
{
  "type": "object",
  "required": ["tag_id", "tag_label", "site", "area", "measurement", "role"],
  "properties": {
    "tag_id": {
      "type": "string",
      "pattern": "^[a-z0-9]+(_[a-z0-9]+)*$"
    },
    "tag_label": { "type": "string" },
    "site": {
      "type": "string",
      "pattern": "^[a-z0-9]{3,5}$"
    },
    "area": { "type": "string" },
    "asset": { "type": "string" },
    "subasset": { "type": "string" },
    "measurement": {
      "type": "string",
      "enum": ["temp", "width", "speed", "thk", "tension", "coilid", "pressure", "current", "voltage", "custom"]
    },
    "role": {
      "type": "string",
      "enum": ["pv", "sp", "cmd", "stat", "alm", "raw"]
    },
    "interface_id": { "type": "string" },
    "module_id": { "type": "string" },
    "channel_id": { "type": "string" },
    "eng_unit": { "type": "string" },
    "data_type": {
      "type": "string",
      "enum": ["bool", "int", "float", "string", "double"]
    }
  }
}
```

### 8.2 Interface Schema
```json
{
  "type": "object",
  "required": ["interface_id", "label", "site", "area", "protocol", "index"],
  "properties": {
    "interface_id": {
      "type": "string",
      "pattern": "^[a-z0-9]+(_[a-z0-9]+)*$"
    },
    "label": { "type": "string" },
    "site": {
      "type": "string",
      "pattern": "^[a-z0-9]{3,5}$"
    },
    "area": { "type": "string" },
    "protocol": {
      "type": "string",
      "enum": ["enip", "modb", "opcua", "mqtt", "egd", "srtp"]
    },
    "index": { "type": "integer", "minimum": 1 }
  }
}
```

## 9. Summary
- **ID vs Label:** IDs are strict and permanent; Labels are flexible.
- **Interface IDs:** `site_area_protNN`
- **Module IDs:** `{interface_id}_modNN`
- **Channel IDs:** `{module_id}_chNN`
- **Tag IDs:** `site_area_asset_subasset_measurement_role`
- **Customer UX:** Wizards, auto-ID generation, bulk import, validation
- **Developer UX:** Helper functions, immutable IDs, central registry

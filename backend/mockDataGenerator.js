class MockDataGenerator {
  constructor() {
    this.tags = this.initializeTags();
    this.coilState = {
      currentCoilId: 'C-2025-001',
      position: 0,
      speed: 120, // m/min
      thickness: 2.5, // mm
      width: 1200, // mm
    };
    this.startTime = Date.now();
  }

  initializeTags() {
    return {
      'Line1/Furnace/Zone1_Temp': {
        base: 850, range: 20, unit: '°C', type: 'analog'
      },
      'Line1/Furnace/Zone2_Temp': {
        base: 920, range: 15, unit: '°C', type: 'analog'
      },
      'Line1/Furnace/Zone3_Temp': {
        base: 1050, range: 25, unit: '°C', type: 'analog'
      },
      'Line1/Furnace/Zone4_Temp': {
        base: 980, range: 18, unit: '°C', type: 'analog'
      },
      'Line1/Mill/Speed': {
        base: 120, range: 10, unit: 'm/min', type: 'analog'
      },
      'Line1/Mill/Thickness': {
        base: 2.5, range: 0.1, unit: 'mm', type: 'analog'
      },
      'Line1/Mill/Width': {
        base: 1200, range: 5, unit: 'mm', type: 'analog'
      },
      'Line1/Tension/Entry': {
        base: 45, range: 5, unit: 'kN', type: 'analog'
      },
      'Line1/Tension/Exit': {
        base: 50, range: 5, unit: 'kN', type: 'analog'
      },
      'Line1/Cooling/FlowRate': {
        base: 200, range: 20, unit: 'L/min', type: 'analog'
      },
      'Line1/Status/Running': {
        base: 1, range: 0, unit: '', type: 'digital'
      },
      'Line1/Status/Alarm': {
        base: 0, range: 0, unit: '', type: 'digital'
      },
    };
  }

  generateValue(tagPath) {
    const config = this.tags[tagPath];
    if (!config) return null;

    if (config.type === 'digital') {
      // Running status: 95% uptime
      if (tagPath.includes('Running')) {
        return Math.random() > 0.05 ? 1 : 0;
      }
      // Alarm: 5% chance
      if (tagPath.includes('Alarm')) {
        return Math.random() > 0.95 ? 1 : 0;
      }
      return config.base;
    }

    // Add sinusoidal variation + noise for analog values
    const time = Date.now() / 1000;
    const sine = Math.sin(time / 30) * config.range * 0.3;
    const noise = (Math.random() - 0.5) * config.range;

    // Inject occasional anomalies (3% chance)
    const anomaly = Math.random() > 0.97 ? config.range * 1.5 : 0;

    return config.base + sine + noise + anomaly;
  }

  generateCrossWidthProfile() {
    // 64-zone sensor array simulation
    const zones = 64;
    const profile = [];
    const centerThickness = this.coilState.thickness;

    for (let i = 0; i < zones; i++) {
      // Crown profile: thicker in center (parabolic)
      const position = (i - zones / 2) / (zones / 2);
      const crown = Math.exp(-position * position * 2) * 0.15;
      const noise = (Math.random() - 0.5) * 0.02;

      // Edge drop-off simulation
      const edgeFactor = i < 3 || i > zones - 4 ? -0.05 : 0;

      profile.push({
        zone: i,
        position: (i / zones) * this.coilState.width,
        thickness: centerThickness + crown + noise + edgeFactor,
      });
    }

    return profile;
  }

  getTagTree() {
    const tree = {};

    Object.keys(this.tags).forEach(path => {
      const parts = path.split('/');
      let current = tree;

      parts.forEach((part, idx) => {
        if (!current[part]) {
          current[part] = idx === parts.length - 1
            ? { ...this.tags[path], path }
            : { children: {} };
        }

        if (idx < parts.length - 1) {
          current = current[part].children || current[part];
        }
      });
    });

    return tree;
  }

  getCoilHistory() {
    const now = Date.now();
    return [
      {
        id: 'C-2025-001',
        startTime: now - 3600000,
        status: 'active',
        grade: 'CR4',
        targetThickness: 2.5,
        targetWidth: 1200,
        length: 1240,
        targetLength: 1600
      },
      {
        id: 'C-2025-000',
        startTime: now - 7200000,
        endTime: now - 3700000,
        status: 'completed',
        grade: 'CR4',
        targetThickness: 2.5,
        targetWidth: 1200,
        length: 1580,
        targetLength: 1600,
        stats: {
          avgThickness: 2.501,
          stdThickness: 0.048,
          minThickness: 2.38,
          maxThickness: 2.62
        }
      },
      {
        id: 'C-2024-999',
        startTime: now - 14400000,
        endTime: now - 7300000,
        status: 'completed',
        grade: 'HR3',
        targetThickness: 3.0,
        targetWidth: 1000,
        length: 2100,
        targetLength: 2100,
        stats: {
          avgThickness: 3.003,
          stdThickness: 0.052,
          minThickness: 2.88,
          maxThickness: 3.15
        }
      }
    ];
  }

  updateCoilProgress() {
    // Simulate coil progression
    const elapsed = (Date.now() - this.startTime) / 1000; // seconds
    this.coilState.position = (elapsed * this.coilState.speed) / 60; // meters

    // Roll over to new coil after target length
    if (this.coilState.position > 1600) {
      this.startTime = Date.now();
      this.coilState.position = 0;
      const coilNum = parseInt(this.coilState.currentCoilId.split('-')[2]) + 1;
      this.coilState.currentCoilId = `C-2025-${String(coilNum).padStart(3, '0')}`;
    }

    return {
      ...this.coilState,
      progress: Math.min((this.coilState.position / 1600) * 100, 100)
    };
  }
}

module.exports = MockDataGenerator;

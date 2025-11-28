#!/usr/bin/env node

/**
 * Setup Test Channels for ParX Data Collection
 * 
 * This script creates test interfaces, connections, and channels
 * for testing the data collection system with a Modbus TCP simulator.
 */

import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'parx',
  user: process.env.DB_USER || 'parx',
  password: process.env.DB_PASSWORD || 'parx',
});

async function setupTestChannels() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Setting up test channels...\n');
    
    // 1. Create Test Interface
    console.log('1. Creating test interface...');
    const interfaceResult = await client.query(`
      INSERT INTO interfaces (id, name, protocol, enabled, config, metadata)
      VALUES (
        'test-modbus-interface',
        'Test Modbus Interface',
        'modbus',
        true,
        '{}',
        '{"description": "Test interface for Modbus TCP simulator"}'
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        enabled = EXCLUDED.enabled
      RETURNING id
    `);
    console.log(`   ✓ Interface created: ${interfaceResult.rows[0].id}\n`);
    
    // 2. Create Test Connection
    console.log('2. Creating test connection...');
    const connectionResult = await client.query(`
      INSERT INTO connections (id, interface_id, name, enabled, config, metadata)
      VALUES (
        'test-modbus-connection',
        'test-modbus-interface',
        'Modbus Simulator',
        true,
        '{"host": "localhost", "port": 502, "unitId": 1}',
        '{"description": "Connection to Modbus TCP simulator"}'
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        enabled = EXCLUDED.enabled,
        config = EXCLUDED.config
      RETURNING id
    `);
    console.log(`   ✓ Connection created: ${connectionResult.rows[0].id}\n`);
    
    // 3. Create Test Channels
    console.log('3. Creating test channels...');
    
    const channels = [
      {
        id: 'test-modbus-interface.test-modbus-connection.temperature',
        name: 'Temperature Sensor',
        register: 40001,
        dataType: 'float',
        scanRate: 1000,
        units: '°C',
        description: 'Reactor temperature'
      },
      {
        id: 'test-modbus-interface.test-modbus-connection.pressure',
        name: 'Pressure Sensor',
        register: 40003,
        dataType: 'float',
        scanRate: 1000,
        units: 'PSI',
        description: 'System pressure'
      },
      {
        id: 'test-modbus-interface.test-modbus-connection.speed',
        name: 'Motor Speed',
        register: 40005,
        dataType: 'int16',
        scanRate: 500,
        units: 'RPM',
        description: 'Motor speed'
      },
      {
        id: 'test-modbus-interface.test-modbus-connection.flow',
        name: 'Flow Rate',
        register: 40006,
        dataType: 'float',
        scanRate: 2000,
        units: 'L/min',
        description: 'Coolant flow rate'
      },
      {
        id: 'test-modbus-interface.test-modbus-connection.level',
        name: 'Tank Level',
        register: 40008,
        dataType: 'int16',
        scanRate: 5000,
        units: '%',
        description: 'Tank fill level'
      },
      {
        id: 'test-modbus-interface.test-modbus-connection.pump-status',
        name: 'Pump Status',
        register: 1,
        dataType: 'bool',
        scanRate: 1000,
        units: '',
        description: 'Pump running status'
      }
    ];
    
    for (const channel of channels) {
      await client.query(`
        INSERT INTO channels (
          id, 
          connection_id, 
          name, 
          protocol, 
          enabled, 
          config, 
          metadata
        )
        VALUES (
          $1,
          'test-modbus-connection',
          $2,
          'modbus',
          true,
          $3,
          $4
        )
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          enabled = EXCLUDED.enabled,
          config = EXCLUDED.config,
          metadata = EXCLUDED.metadata
      `, [
        channel.id,
        channel.name,
        JSON.stringify({
          host: 'localhost',
          port: 502,
          unitId: 1,
          register: channel.register,
          dataType: channel.dataType,
          pollingInterval: channel.scanRate
        }),
        JSON.stringify({
          units: channel.units,
          description: channel.description
        })
      ]);
      
      console.log(`   ✓ Channel created: ${channel.name} (${channel.id})`);
    }
    
    console.log(`\n   Total channels created: ${channels.length}\n`);
    
    // 4. Create Storage Rules
    console.log('4. Creating storage rules...');
    
    await client.query(`
      INSERT INTO storage_rules (
        id,
        name,
        enabled,
        mode,
        backend,
        channels,
        config
      )
      VALUES (
        'continuous-storage-rule',
        'Continuous Storage - All Channels',
        true,
        'continuous',
        'timescaledb',
        $1,
        '{}'
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        enabled = EXCLUDED.enabled,
        channels = EXCLUDED.channels
    `, [JSON.stringify(channels.map(c => c.id))]);
    
    console.log('   ✓ Storage rule created: Continuous Storage\n');
    
    await client.query('COMMIT');
    
    console.log('✅ Test channels setup complete!\n');
    console.log('Next steps:');
    console.log('1. Start a Modbus TCP simulator on localhost:502');
    console.log('   - Recommended: ModbusPal (https://sourceforge.net/projects/modbuspal/)');
    console.log('   - Or use: diagslave -m tcp -p 502');
    console.log('2. Start the collector service: cd services/collector && npm start');
    console.log('3. Start the data-router service: cd services/data-router && npm start');
    console.log('4. Start the storage-engine service: cd services/storage-engine && npm start');
    console.log('5. Open the frontend and check the dashboard\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error setting up test channels:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

setupTestChannels().catch(console.error);

import ModbusRTU from 'modbus-serial';
import { createLogger } from '../../../../shared/utils/logger.js';

const logger = createLogger('modbus-protocol');

export class ModbusEngine {
  constructor() {
    this.connections = new Map(); // Map<connectionKey, client>
    this.subscriptions = new Map(); // Map<channelId, config>
  }

  /**
   * Get or create Modbus connection
   */
  async getConnection(host, port) {
    const key = `${host}:${port}`;
    
    if (this.connections.has(key)) {
      return this.connections.get(key);
    }

    const client = new ModbusRTU();
    
    try {
      await client.connectTCP(host, { port });
      client.setTimeout(5000);
      this.connections.set(key, client);
      logger.info(`Modbus connection established: ${key}`);
      return client;
    } catch (error) {
      logger.error(`Modbus connection failed: ${key}`, error);
      throw error;
    }
  }

  /**
   * Subscribe to a channel
   */
  async subscribe(channelId, config) {
    this.subscriptions.set(channelId, config);
    logger.info(`Modbus channel subscribed: ${channelId}`);
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channelId) {
    this.subscriptions.delete(channelId);
    logger.info(`Modbus channel unsubscribed: ${channelId}`);
  }

  /**
   * Read value from Modbus device
   */
  async readValue(channelId) {
    const config = this.subscriptions.get(channelId);
    if (!config) {
      throw new Error(`Channel not subscribed: ${channelId}`);
    }

    try {
      const client = await this.getConnection(config.host, config.port);
      client.setID(config.unitId);

      let value;
      const register = config.register;

      // Determine register type and read
      if (register >= 1 && register <= 9999) {
        // Coils (0x)
        const result = await client.readCoils(register - 1, 1);
        value = result.data[0] ? 1 : 0;
      } else if (register >= 10001 && register <= 19999) {
        // Discrete Inputs (1x)
        const result = await client.readDiscreteInputs(register - 10001, 1);
        value = result.data[0] ? 1 : 0;
      } else if (register >= 30001 && register <= 39999) {
        // Input Registers (3x)
        const result = await client.readInputRegisters(register - 30001, config.dataType === 'float' ? 2 : 1);
        value = this.parseValue(result.data, config.dataType);
      } else if (register >= 40001 && register <= 49999) {
        // Holding Registers (4x)
        const result = await client.readHoldingRegisters(register - 40001, config.dataType === 'float' ? 2 : 1);
        value = this.parseValue(result.data, config.dataType);
      } else {
        throw new Error(`Invalid register: ${register}`);
      }

      // Apply scaling
      if (config.scaling) {
        value = value * (config.scaling.factor || 1) + (config.scaling.offset || 0);
      }

      return {
        channelId,
        value,
        quality: 'GOOD',
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error(`Modbus read error for ${channelId}:`, error.message);
      return {
        channelId,
        value: null,
        quality: 'BAD',
        timestamp: Date.now(),
        error: error.message
      };
    }
  }

  /**
   * Parse value based on data type
   */
  parseValue(data, dataType) {
    switch (dataType) {
      case 'int16':
        return data[0];
      case 'uint16':
        return data[0];
      case 'int32':
        return (data[0] << 16) | data[1];
      case 'uint32':
        return ((data[0] << 16) | data[1]) >>> 0;
      case 'float':
        // IEEE 754 float from two 16-bit registers
        const buffer = Buffer.allocUnsafe(4);
        buffer.writeUInt16BE(data[0], 0);
        buffer.writeUInt16BE(data[1], 2);
        return buffer.readFloatBE(0);
      default:
        return data[0];
    }
  }

  /**
   * Write value to Modbus device
   */
  async writeValue(channelId, value) {
    const config = this.subscriptions.get(channelId);
    if (!config) {
      throw new Error(`Channel not subscribed: ${channelId}`);
    }

    try {
      const client = await this.getConnection(config.host, config.port);
      client.setID(config.unitId);

      const register = config.register;

      if (register >= 1 && register <= 9999) {
        // Write Coil
        await client.writeCoil(register - 1, value ? true : false);
      } else if (register >= 40001 && register <= 49999) {
        // Write Holding Register
        await client.writeRegister(register - 40001, value);
      } else {
        throw new Error(`Cannot write to register: ${register}`);
      }

      logger.info(`Modbus write successful: ${channelId} = ${value}`);
      return true;
    } catch (error) {
      logger.error(`Modbus write error for ${channelId}:`, error.message);
      throw error;
    }
  }

  /**
   * Close all connections
   */
  async close() {
    for (const [key, client] of this.connections) {
      try {
        client.close(() => {});
        logger.info(`Modbus connection closed: ${key}`);
      } catch (error) {
        logger.error(`Error closing Modbus connection ${key}:`, error);
      }
    }
    this.connections.clear();
    this.subscriptions.clear();
  }
}

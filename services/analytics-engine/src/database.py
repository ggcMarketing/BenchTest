import psycopg2
from psycopg2.pool import ThreadedConnectionPool
import os
import logging

logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.config_pool = None
        self.timescale_pool = None

    def initialize(self):
        """Initialize database connection pools"""
        try:
            # Configuration database (PostgreSQL)
            self.config_pool = ThreadedConnectionPool(
                minconn=1,
                maxconn=10,
                host=os.getenv('DB_HOST', 'localhost'),
                port=int(os.getenv('DB_PORT', 5432)),
                database=os.getenv('DB_NAME', 'parx'),
                user=os.getenv('DB_USER', 'parx'),
                password=os.getenv('DB_PASSWORD', 'parx')
            )

            # TimescaleDB (time-series data)
            self.timescale_pool = ThreadedConnectionPool(
                minconn=1,
                maxconn=20,
                host=os.getenv('TIMESCALE_HOST', 'localhost'),
                port=int(os.getenv('TIMESCALE_PORT', 5433)),
                database=os.getenv('TIMESCALE_DB', 'parx_timeseries'),
                user=os.getenv('TIMESCALE_USER', 'parx'),
                password=os.getenv('TIMESCALE_PASSWORD', 'parx')
            )

            logger.info("Database pools initialized")
        except Exception as e:
            logger.error(f"Error initializing database: {e}")
            raise

    def get_config_connection(self):
        """Get connection from config pool"""
        return self.config_pool.getconn()

    def get_timescale_connection(self):
        """Get connection from timescale pool"""
        return self.timescale_pool.getconn()

    def return_config_connection(self, conn):
        """Return connection to config pool"""
        self.config_pool.putconn(conn)

    def return_timescale_connection(self, conn):
        """Return connection to timescale pool"""
        self.timescale_pool.putconn(conn)

    def close(self):
        """Close all connection pools"""
        if self.config_pool:
            self.config_pool.closeall()
        if self.timescale_pool:
            self.timescale_pool.closeall()
        logger.info("Database pools closed")

# Global database instance
db = Database()

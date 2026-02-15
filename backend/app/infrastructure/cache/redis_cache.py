"""
Redis cache service for caching frequently accessed data.
"""

import json
from typing import Any, Optional

import redis.asyncio as aioredis
from loguru import logger

from app.config import settings


class RedisCache:
    """Async Redis cache wrapper with JSON serialization."""

    def __init__(self):
        self._redis: Optional[aioredis.Redis] = None

    async def connect(self) -> None:
        """Initialize Redis connection."""
        try:
            self._redis = aioredis.from_url(
                settings.REDIS_URL,
                encoding="utf-8",
                decode_responses=True,
            )
            await self._redis.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.warning(f"Redis connection failed: {e}. Caching disabled.")
            self._redis = None

    async def disconnect(self) -> None:
        """Close Redis connection."""
        if self._redis:
            await self._redis.close()
            logger.info("Redis connection closed")

    async def get(self, key: str) -> Optional[Any]:
        """Get a value from cache."""
        if not self._redis:
            return None
        try:
            value = await self._redis.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.warning(f"Redis GET error for key '{key}': {e}")
            return None

    async def set(
        self, key: str, value: Any, expire_seconds: int = 300
    ) -> bool:
        """Set a value in cache with TTL."""
        if not self._redis:
            return False
        try:
            serialized = json.dumps(value, default=str)
            await self._redis.setex(key, expire_seconds, serialized)
            return True
        except Exception as e:
            logger.warning(f"Redis SET error for key '{key}': {e}")
            return False

    async def delete(self, key: str) -> bool:
        """Delete a value from cache."""
        if not self._redis:
            return False
        try:
            await self._redis.delete(key)
            return True
        except Exception as e:
            logger.warning(f"Redis DELETE error for key '{key}': {e}")
            return False

    async def delete_pattern(self, pattern: str) -> int:
        """Delete all keys matching a pattern."""
        if not self._redis:
            return 0
        try:
            keys = []
            async for key in self._redis.scan_iter(match=pattern):
                keys.append(key)
            if keys:
                return await self._redis.delete(*keys)
            return 0
        except Exception as e:
            logger.warning(f"Redis DELETE pattern error '{pattern}': {e}")
            return 0

    @property
    def is_connected(self) -> bool:
        """Check if Redis is connected."""
        return self._redis is not None


# Singleton cache instance
redis_cache = RedisCache()

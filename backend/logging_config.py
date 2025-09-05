import logging
import sys
import json
from datetime import datetime
from typing import Dict, Any
import traceback

class StructuredFormatter(logging.Formatter):
    """Custom formatter for structured JSON logging"""
    
    def format(self, record):
        log_entry = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = {
                "type": record.exc_info[0].__name__ if record.exc_info[0] else None,
                "message": str(record.exc_info[1]) if record.exc_info[1] else None,
                "traceback": traceback.format_exception(*record.exc_info)
            }
        
        # Add extra fields if present
        if hasattr(record, 'extra_fields'):
            log_entry.update(record.extra_fields)
            
        return json.dumps(log_entry, default=str)

def setup_logging(environment: str = "development", log_level: str = "INFO"):
    """Setup structured logging for the application"""
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(getattr(logging, log_level.upper()))
    
    # Remove existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Create console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, log_level.upper()))
    
    # Use structured formatter for production, simple formatter for development
    if environment == "production":
        formatter = StructuredFormatter()
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    console_handler.setFormatter(formatter)
    root_logger.addHandler(console_handler)
    
    # Configure specific loggers
    logging.getLogger("uvicorn.access").setLevel(logging.INFO)
    logging.getLogger("uvicorn.error").setLevel(logging.INFO)
    logging.getLogger("sqlalchemy.engine").setLevel(logging.WARNING)
    logging.getLogger("google.cloud").setLevel(logging.INFO)
    
    # Create application logger
    app_logger = logging.getLogger("inventory_mgmt")
    app_logger.setLevel(getattr(logging, log_level.upper()))
    
    return app_logger

def get_logger(name: str) -> logging.Logger:
    """Get a logger instance with the given name"""
    return logging.getLogger(f"inventory_mgmt.{name}")

def log_request(logger: logging.Logger, method: str, url: str, headers: Dict[str, str], 
                body: Any = None, user_id: str = None):
    """Log incoming request details"""
    extra_fields = {
        "request": {
            "method": method,
            "url": url,
            "headers": {k: v for k, v in headers.items() if k.lower() not in ['authorization', 'cookie']},
            "user_id": user_id
        }
    }
    if body:
        extra_fields["request"]["body"] = str(body)[:1000]  # Limit body size
    
    logger.info("Incoming request", extra={"extra_fields": extra_fields})

def log_response(logger: logging.Logger, status_code: int, response_time: float, 
                response_size: int = None):
    """Log outgoing response details"""
    extra_fields = {
        "response": {
            "status_code": status_code,
            "response_time_ms": round(response_time * 1000, 2),
            "response_size": response_size
        }
    }
    logger.info("Outgoing response", extra={"extra_fields": extra_fields})

def log_error(logger: logging.Logger, error: Exception, context: str = None, 
              extra_data: Dict[str, Any] = None):
    """Log error with context and extra data"""
    extra_fields = {
        "error": {
            "type": type(error).__name__,
            "message": str(error),
            "context": context
        }
    }
    if extra_data:
        extra_fields["error"]["extra_data"] = extra_data
    
    logger.error(f"Error occurred: {str(error)}", exc_info=True, extra={"extra_fields": extra_fields})

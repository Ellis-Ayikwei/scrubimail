import re
import dns.resolver
import dns.exception
import smtplib
import socket
import ssl
import hashlib
import time
import asyncio
import aiohttp
import aiodns
from typing import Dict, List, Tuple, Optional, Any
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import idna
import tldextract
from datetime import datetime, timedelta
import json
import logging

logger = logging.getLogger(__name__)

# The EmailValidator class and its related ValidationResult dataclass have been removed as AdvancedEmailValidator is now the only validator used in the project.

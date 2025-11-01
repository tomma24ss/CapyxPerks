"""File storage utilities for handling image uploads"""
import os
import uuid
from pathlib import Path
from typing import Optional
from fastapi import UploadFile
import shutil

# Configure upload directory
UPLOAD_DIR = Path("/app/uploads")
if not UPLOAD_DIR.exists():
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# Allowed image extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def is_valid_image(filename: str) -> bool:
    """Check if file has valid image extension"""
    ext = Path(filename).suffix.lower()
    return ext in ALLOWED_EXTENSIONS


async def save_upload_file(upload_file: UploadFile) -> str:
    """
    Save uploaded file to disk and return the file path
    
    Args:
        upload_file: FastAPI UploadFile object
        
    Returns:
        str: Relative path to saved file
        
    Raises:
        ValueError: If file type is invalid or file too large
    """
    if not is_valid_image(upload_file.filename):
        raise ValueError(f"Invalid file type. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}")
    
    # Generate unique filename
    file_ext = Path(upload_file.filename).suffix.lower()
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = UPLOAD_DIR / unique_filename
    
    # Save file
    try:
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
    finally:
        upload_file.file.close()
    
    # Return relative path
    return f"/uploads/{unique_filename}"


def delete_file(file_path: str) -> bool:
    """
    Delete a file from storage
    
    Args:
        file_path: Relative path to file (e.g., /uploads/filename.jpg)
        
    Returns:
        bool: True if deleted successfully, False otherwise
    """
    if not file_path or not file_path.startswith("/uploads/"):
        return False
    
    try:
        full_path = UPLOAD_DIR / Path(file_path).name
        if full_path.exists():
            full_path.unlink()
            return True
    except Exception:
        pass
    
    return False


def get_file_path(relative_path: str) -> Optional[Path]:
    """
    Get full file path from relative path
    
    Args:
        relative_path: Relative path (e.g., /uploads/filename.jpg)
        
    Returns:
        Path object or None if invalid
    """
    if not relative_path or not relative_path.startswith("/uploads/"):
        return None
    
    full_path = UPLOAD_DIR / Path(relative_path).name
    return full_path if full_path.exists() else None


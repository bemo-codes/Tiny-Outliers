from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.core.config import settings
from app.api.v1.api import api_router

app = FastAPI(
    title="CARE/ROUTE Emergency Care Coordination API",
    description="Emergency care coordination and deterministic smart hospital routing engine.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows frontend in dev environment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Standardized Error Handlers conforming to specification
@app.exception_handler(StarletteHTTPException)
async def custom_http_exception_handler(request: Request, exc: StarletteHTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": f"HTTP_{exc.status_code}",
                "message": str(exc.detail),
                "details": {"path": str(request.url.path)}
            }
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed for request payload",
                "details": {"validation_errors": errors, "path": str(request.url.path)}
            }
        }
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected server error occurred during processing",
                "details": {"error_type": type(exc).__name__, "path": str(request.url.path)}
            }
        }
    )

# Include API Router under /api/v1
app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {
        "service": "CARE/ROUTE Emergency Care Coordination API",
        "status": "online",
        "api_v1": settings.API_V1_STR,
        "docs": "/api/docs"
    }

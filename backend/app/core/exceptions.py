from typing import Optional

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class ErrorDetail(BaseModel):
    code: str
    message: str
    field: Optional[str] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail


class AppException(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        field: Optional[str] = None,
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.field = field
        super().__init__(message)


class NotFoundException(AppException):
    def __init__(
        self, message: str = "Resource not found", field: Optional[str] = None
    ):
        super().__init__(
            code="NOT_FOUND",
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            field=field,
        )


class ConflictException(AppException):
    def __init__(self, message: str = "Resource conflict", field: Optional[str] = None):
        super().__init__(
            code="CONFLICT",
            message=message,
            status_code=status.HTTP_409_CONFLICT,
            field=field,
        )


class ValidationException(AppException):
    def __init__(self, message: str = "Validation error", field: Optional[str] = None):
        super().__init__(
            code="VALIDATION_ERROR",
            message=message,
            status_code=status.HTTP_400_BAD_REQUEST,
            field=field,
        )


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppException)
    async def app_exception_handler(
        request: Request, exc: AppException
    ) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content={
                "error": {"code": exc.code, "message": exc.message, "field": exc.field}
            },
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        errors = exc.errors()
        field = None
        message = "Validation error"

        if errors:
            first_err = errors[0]
            loc = first_err.get("loc", ())
            if len(loc) > 1:
                field = str(loc[-1])
            message = first_err.get("msg", "Invalid input")

        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": message,
                    "field": field,
                }
            },
        )

    @app.exception_handler(HTTPException)
    async def http_exception_handler(
        request: Request, exc: HTTPException
    ) -> JSONResponse:
        code = "HTTP_ERROR"
        if exc.status_code == 404:
            code = "NOT_FOUND"
        elif exc.status_code == 409:
            code = "CONFLICT"
        elif exc.status_code == 400:
            code = "BAD_REQUEST"

        message = exc.detail if isinstance(exc.detail, str) else "An error occurred"
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": {"code": code, "message": message, "field": None}},
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(
        request: Request, exc: Exception
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "error": {
                    "code": "INTERNAL_SERVER_ERROR",
                    "message": "An unexpected error occurred",
                    "field": None,
                }
            },
        )

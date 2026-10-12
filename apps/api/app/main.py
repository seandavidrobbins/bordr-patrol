from fastapi import FastAPI

from app.settings import get_settings


def create_app() -> FastAPI:
    application = FastAPI(title="Bordr Patrol API")
    application.state.settings = get_settings()

    @application.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    return application


app = create_app()

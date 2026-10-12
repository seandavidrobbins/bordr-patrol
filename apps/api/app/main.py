from fastapi import FastAPI

app = FastAPI(title="Bordr Patrol API")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
